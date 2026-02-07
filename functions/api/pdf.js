// API: PDF für Bemusterung generieren
// GET /api/pdf?apartment_id=X oder /api/pdf?code=XXX
// GET /api/pdf?code=XXX&format=json - JSON-Daten für clientseitiges PDF

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const apartmentId = url.searchParams.get('apartment_id')
  const code = url.searchParams.get('code')?.toUpperCase()

  if (!apartmentId && !code) {
    return new Response('apartment_id oder code erforderlich', { status: 400 })
  }

  try {
    // Wohnung laden
    let apartment
    if (code) {
      apartment = await env.DB.prepare(`
        SELECT a.*, p.name as project_name, p.address as project_address
        FROM apartments a
        JOIN projects p ON a.project_id = p.id
        WHERE a.access_code = ?
      `).bind(code).first()
    } else {
      apartment = await env.DB.prepare(`
        SELECT a.*, p.name as project_name, p.address as project_address
        FROM apartments a
        JOIN projects p ON a.project_id = p.id
        WHERE a.id = ?
      `).bind(parseInt(apartmentId)).first()
    }

    if (!apartment) {
      return new Response('Wohnung nicht gefunden', { status: 404 })
    }

    // Kategorien laden
    const categories = await env.DB.prepare(`
      SELECT * FROM categories WHERE project_id = ? ORDER BY sort_order ASC
    `).bind(apartment.project_id).all()

    // Alle Selections laden
    const selections = await env.DB.prepare(`
      SELECT s.category_id, s.option_id
      FROM selections s
      WHERE s.apartment_id = ?
    `).bind(apartment.id).all()

    // Für jede Selection die Details laden (inkl. Bild, info_text, additional_images)
    const selectionDetails = []
    for (const sel of selections.results) {
      const cat = categories.results.find(c => c.id === sel.category_id)
      if (!cat) continue

      let optionName, optionPrice, optionDescription, optionInfoText, optionImage, optionId, isCustom = false

      if (sel.option_id < 0) {
        const customOpt = await env.DB.prepare(`
          SELECT id, name, price, description, image_url FROM apartment_custom_options WHERE id = ?
        `).bind(Math.abs(sel.option_id)).first()
        if (customOpt) {
          optionId = customOpt.id
          optionName = customOpt.name
          optionPrice = customOpt.price
          optionDescription = customOpt.description
          optionImage = customOpt.image_url
          isCustom = true
        }
      } else {
        const opt = await env.DB.prepare(`
          SELECT id, name, price, description, info_text, image_url FROM options WHERE id = ?
        `).bind(sel.option_id).first()
        if (opt) {
          optionId = opt.id
          optionName = opt.name
          optionPrice = opt.price
          optionDescription = opt.description
          optionInfoText = opt.info_text
          optionImage = opt.image_url
        }
      }

      // Zusätzliche Bilder laden
      let additionalImages = []
      if (optionId && !isCustom) {
        try {
          const imgResult = await env.DB.prepare(`
            SELECT image_url FROM option_images WHERE option_id = ? ORDER BY sort_order ASC
          `).bind(optionId).all()
          additionalImages = imgResult.results.map(r => r.image_url)
        } catch { /* Tabelle existiert evtl. noch nicht */ }
      }

      // Alle Bilder sammeln (Hauptbild + zusätzliche)
      const allImages = []
      if (optionImage) allImages.push(optionImage)
      allImages.push(...additionalImages)

      if (optionName) {
        selectionDetails.push({
          category_name: cat.name,
          option_name: optionName,
          option_price: optionPrice || 0,
          option_description: optionDescription || null,
          option_info_text: optionInfoText || null,
          option_images: allImages,
          is_custom: isCustom
        })
      }
    }

    // Gesamtpreis berechnen
    let totalPrice = 0
    selectionDetails.forEach(s => { totalPrice += s.option_price || 0 })

    // Format prüfen
    const format = url.searchParams.get('format')

    if (format === 'json') {
      const completedDate = apartment.completed_at ? new Date(apartment.completed_at + 'Z') : new Date()
      const date = completedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const time = completedDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

      return Response.json({
        apartment_name: apartment.name,
        project_name: apartment.project_name,
        project_address: apartment.project_address,
        customer_name: apartment.customer_name,
        access_code: apartment.access_code,
        floor: apartment.floor,
        size_sqm: apartment.size_sqm,
        rooms: apartment.rooms,
        date,
        time,
        selections: selectionDetails,
        total_price: totalPrice
      })
    }

    // HTML-Fallback
    const html = generatePDFHtml(apartment, selectionDetails, totalPrice)
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error) {
    console.error('PDF Error:', error)
    return new Response('Fehler beim Generieren des PDFs: ' + error.message, { status: 500 })
  }
}

function generatePDFHtml(apartment, selections, totalPrice) {
  const completedDate = apartment.completed_at ? new Date(apartment.completed_at + 'Z') : new Date()
  const date = completedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = completedDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  const selectionRows = selections.map(s => {
    const imgs = (s.option_images || []).map(url =>
      `<img src="${url}" style="width:64px;height:48px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;" onerror="this.style.display='none'">`
    ).join('')
    return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">${s.category_name}</div>
          <div style="font-size:15px;font-weight:700;color:#111827;">${s.option_name}</div>
        </div>
        <div style="font-size:15px;font-weight:700;color:#111827;white-space:nowrap;margin-left:16px;">
          ${s.option_price === 0 ? 'Inklusive' : (s.option_price > 0 ? '+' : '') + s.option_price.toLocaleString('de-DE') + ' €'}
        </div>
      </div>
      ${s.option_description ? `<div style="font-size:12px;color:#4b5563;margin-bottom:8px;">${s.option_description}</div>` : ''}
      ${s.option_info_text ? `<div style="font-size:11px;color:#6b7280;line-height:1.6;margin-bottom:8px;padding:8px 10px;background:#f9fafb;border-radius:4px;">${s.option_info_text.replace(/\n/g, '<br>')}</div>` : ''}
      ${imgs ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${imgs}</div>` : ''}
    </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><title>Bemusterungsprotokoll - ${apartment.name}</title>
<style>
  @page{size:A4;margin:15mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#f3f4f6}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;color:#1f2937;font-size:14px}
  .pw{min-height:100vh;padding:20px}.pc{max-width:800px;margin:0 auto;background:#fff;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);border-radius:12px;overflow:hidden}
  .pb{background:#E30613;color:#fff;padding:15px 24px;display:flex;justify-content:space-between;align-items:center}
  .pb button{background:#fff;color:#E30613;border:none;padding:10px 25px;font-size:15px;font-weight:600;border-radius:6px;cursor:pointer}
  .ct{padding:32px 40px}
  @media print{html,body{background:#fff}.pb{display:none!important}.pw{padding:0}.pc{max-width:none;box-shadow:none;border-radius:0}.ct{padding:0}}
</style></head><body>
<div class="pw"><div class="pc">
  <div class="pb"><span style="font-weight:500">Bemusterungsprotokoll für ${apartment.customer_name || apartment.name}</span>
  <button onclick="window.print()">Als PDF speichern / Drucken</button></div>
  <div class="ct">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #E30613">
      <div><div style="font-size:18px;font-weight:700;color:#E30613;margin-bottom:5px">G&S Gruppe</div><div style="color:#4b5563;font-size:13px">Felix-Wankel-Straße 29<br>53881 Euskirchen</div></div>
      <img src="/logo.jpg" alt="Logo" style="height:55px">
    </div>
    <div style="text-align:center;margin-bottom:28px"><h1 style="font-size:24px;font-weight:bold;margin:0 0 6px;color:#111827">Bemusterungsprotokoll</h1><p style="color:#6b7280;margin:0;font-size:14px">Verbindliche Ausstattungsauswahl vom ${date}</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <div style="background:#f9fafb;padding:14px 16px;border-radius:8px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.5px">Projekt</div><div style="font-weight:600;font-size:15px;color:#111827">${apartment.project_name}</div>${apartment.project_address ? `<div style="font-size:13px;color:#6b7280;margin-top:3px">${apartment.project_address}</div>` : ''}</div>
      <div style="background:#f9fafb;padding:14px 16px;border-radius:8px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.5px">Wohnung</div><div style="font-weight:600;font-size:15px;color:#111827">${apartment.name}</div><div style="font-size:13px;color:#6b7280;margin-top:3px">${[apartment.floor, apartment.size_sqm ? apartment.size_sqm + ' m²' : '', apartment.rooms ? apartment.rooms + ' Zimmer' : ''].filter(Boolean).join(' · ') || '-'}</div></div>
      <div style="background:#f9fafb;padding:14px 16px;border-radius:8px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.5px">Kunde</div><div style="font-weight:600;font-size:15px;color:#111827">${apartment.customer_name || '-'}</div></div>
      <div style="background:#f9fafb;padding:14px 16px;border-radius:8px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.5px">Referenz</div><div style="font-weight:600;font-size:15px;color:#111827;font-family:monospace;letter-spacing:1px">${apartment.access_code}</div><div style="font-size:13px;color:#6b7280;margin-top:3px">Abgesendet: ${date}, ${time} Uhr</div></div>
    </div>
    <h3 style="font-size:16px;margin:0 0 16px;color:#374151;font-weight:600">Gewählte Ausstattung</h3>
    ${selectionRows}
    <div style="background:#1f2937;color:#fff;padding:14px 18px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-top:8px">
      <div><div style="font-weight:600;font-size:15px">Gesamter Mehrpreis zur Basisausstattung</div></div>
      <div style="font-size:18px;font-weight:700">${totalPrice >= 0 ? '+' : ''}${totalPrice.toLocaleString('de-DE')} €</div>
    </div>
    <div style="margin-top:32px;padding:16px 20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;font-size:12px;color:#4b5563;line-height:1.7">
      Dieses Bemusterungsprotokoll wurde am ${date} um ${time} Uhr maschinell erstellt und elektronisch über das Bemusterungsportal der G&S Gruppe übermittelt. Das Dokument ist ohne Unterschrift rechtsgültig, da die Auswahl durch den Kunden aktiv und verbindlich im Online-Portal bestätigt wurde.
    </div>
  </div>
</div></div></body></html>`
}
