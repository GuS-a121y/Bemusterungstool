// API: PDF für Bemusterung generieren
// GET /api/pdf?apartment_id=X oder /api/pdf?code=XXX

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

    // Für jede Selection die Details laden (inkl. Bild)
    const selectionDetails = []
    for (const sel of selections.results) {
      const cat = categories.results.find(c => c.id === sel.category_id)
      if (!cat) continue

      let optionName, optionPrice, optionDescription, optionImage, isCustom = false

      if (sel.option_id < 0) {
        // Individuelle Option (negative ID)
        const customOpt = await env.DB.prepare(`
          SELECT name, price, description, image_url FROM apartment_custom_options WHERE id = ?
        `).bind(Math.abs(sel.option_id)).first()
        if (customOpt) {
          optionName = customOpt.name
          optionPrice = customOpt.price
          optionDescription = customOpt.description
          optionImage = customOpt.image_url
          isCustom = true
        }
      } else {
        // Standard Option
        const opt = await env.DB.prepare(`
          SELECT name, price, description, image_url FROM options WHERE id = ?
        `).bind(sel.option_id).first()
        if (opt) {
          optionName = opt.name
          optionPrice = opt.price
          optionDescription = opt.description
          optionImage = opt.image_url
        }
      }

      if (optionName) {
        selectionDetails.push({
          category_name: cat.name,
          option_name: optionName,
          option_price: optionPrice || 0,
          option_description: optionDescription,
          option_image: optionImage || null,
          is_custom: isCustom
        })
      }
    }

    // Gesamtpreis berechnen
    let totalPrice = 0
    selectionDetails.forEach(s => {
      totalPrice += s.option_price || 0
    })

    // PDF als HTML generieren – completed_at für Datum verwenden
    const html = generatePDFHtml(apartment, selectionDetails, totalPrice)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })

  } catch (error) {
    console.error('PDF Error:', error)
    return new Response('Fehler beim Generieren des PDFs: ' + error.message, { status: 500 })
  }
}

function generatePDFHtml(apartment, selections, totalPrice) {
  // Datum vom erstmaligen Absenden verwenden (completed_at), nicht aktuelles Datum
  const completedDate = apartment.completed_at ? new Date(apartment.completed_at + 'Z') : new Date()
  const date = completedDate.toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })
  const time = completedDate.toLocaleTimeString('de-DE', { 
    hour: '2-digit', minute: '2-digit' 
  })

  const selectionRows = selections.map(s => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <strong>${s.category_name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          ${s.option_image ? `<img src="${s.option_image}" alt="${s.option_name}" style="width: 70px; height: 52px; object-fit: cover; border-radius: 4px; flex-shrink: 0; border: 1px solid #e5e7eb;" onerror="this.style.display='none'">` : ''}
          <div>
            ${s.option_name}
            ${s.option_description ? `<br><span style="color: #6b7280; font-size: 12px;">${s.option_description}</span>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap; vertical-align: top;">
        ${s.option_price === 0 ? 'Inklusive' : (s.option_price > 0 ? '+' : '') + s.option_price.toLocaleString('de-DE') + ' €'}
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Bemusterungsprotokoll - ${apartment.name}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    html, body { 
      margin: 0;
      padding: 0;
      background: #f3f4f6;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.5; 
      color: #1f2937;
      font-size: 14px;
    }
    .page-wrapper {
      min-height: 100vh;
      padding: 20px;
    }
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      border-radius: 12px;
      overflow: hidden;
    }
    .print-bar {
      background: #E30613; 
      color: white; 
      padding: 15px 24px; 
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-bar button {
      background: white; 
      color: #E30613; 
      border: none; 
      padding: 10px 25px; 
      font-size: 15px; 
      font-weight: 600; 
      border-radius: 6px; 
      cursor: pointer;
      transition: background 0.2s;
    }
    .print-bar button:hover {
      background: #f3f4f6;
    }
    .content {
      padding: 32px 40px;
    }
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 3px solid #E30613;
    }
    .company-info {
      font-size: 13px;
      line-height: 1.6;
    }
    .company-name {
      font-size: 18px;
      font-weight: 700;
      color: #E30613;
      margin-bottom: 5px;
    }
    .company-address {
      color: #4b5563;
    }
    .logo-container {
      text-align: right;
    }
    .logo-container img {
      height: 55px;
    }
    .document-title {
      text-align: center;
      margin-bottom: 28px;
    }
    .document-title h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 6px 0;
      color: #111827;
    }
    .document-title p {
      color: #6b7280;
      margin: 0;
      font-size: 14px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
      margin-bottom: 24px; 
    }
    .info-box { 
      background: #f9fafb; 
      padding: 14px 16px; 
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
    .info-value { font-weight: 600; font-size: 15px; color: #111827; }
    .section-title {
      font-size: 16px; 
      margin: 0 0 16px 0; 
      color: #374151;
      font-weight: 600;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-radius: 8px; overflow: hidden; }
    th { 
      background: #1f2937; 
      color: white; 
      padding: 12px 14px; 
      text-align: left; 
      font-weight: 600;
      font-size: 13px;
    }
    th:last-child { text-align: right; }
    tbody tr:hover { background: #f9fafb; }
    .total-row { 
      background: #1f2937; 
      color: white; 
    }
    .total-row td { 
      padding: 14px 14px; 
      font-weight: bold; 
      font-size: 15px;
    }
    .validity-notice {
      margin-top: 32px;
      padding: 16px 20px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      font-size: 12px;
      color: #4b5563;
      line-height: 1.7;
    }
    @media print {
      html, body { background: white; }
      .print-bar { display: none !important; }
      .page-wrapper { padding: 0; }
      .page-container { max-width: none; box-shadow: none; border-radius: 0; }
      .content { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="print-bar">
        <span style="font-weight: 500;">Bemusterungsprotokoll für ${apartment.customer_name || apartment.name}</span>
        <button onclick="window.print()">Als PDF speichern / Drucken</button>
      </div>

      <div class="content">
        <div class="letterhead">
          <div class="company-info">
            <div class="company-name">G&S Gruppe</div>
            <div class="company-address">
              Felix-Wankel-Straße 29<br>
              53881 Euskirchen
            </div>
          </div>
          <div class="logo-container">
            <img src="/logo.jpg" alt="G&S Gruppe Logo">
          </div>
        </div>

        <div class="document-title">
          <h1>Bemusterungsprotokoll</h1>
          <p>Verbindliche Ausstattungsauswahl vom ${date}</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Projekt</div>
            <div class="info-value">${apartment.project_name}</div>
            ${apartment.project_address ? `<div style="font-size: 13px; color: #6b7280; margin-top: 3px;">${apartment.project_address}</div>` : ''}
          </div>
          <div class="info-box">
            <div class="info-label">Wohnung</div>
            <div class="info-value">${apartment.name}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 3px;">
              ${[apartment.floor, apartment.size_sqm ? apartment.size_sqm + ' m²' : '', apartment.rooms ? apartment.rooms + ' Zimmer' : ''].filter(Boolean).join(' · ') || '-'}
            </div>
          </div>
          <div class="info-box">
            <div class="info-label">Kunde</div>
            <div class="info-value">${apartment.customer_name || '-'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Referenz</div>
            <div class="info-value" style="font-family: monospace; letter-spacing: 1px;">${apartment.access_code}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 3px;">Abgesendet: ${date}, ${time} Uhr</div>
          </div>
        </div>

        <h3 class="section-title">Gewählte Ausstattung</h3>
        
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Kategorie</th>
              <th>Gewählte Option</th>
              <th style="width: 13%;">Mehrpreis</th>
            </tr>
          </thead>
          <tbody>
            ${selectionRows || '<tr><td colspan="3" style="padding: 24px; text-align: center; color: #6b7280;">Keine Auswahl vorhanden</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2">Gesamter Mehrpreis zur Basisausstattung</td>
              <td style="text-align: right;">${totalPrice >= 0 ? '+' : ''}${totalPrice.toLocaleString('de-DE')} €</td>
            </tr>
          </tfoot>
        </table>

        <div class="validity-notice">
          Dieses Bemusterungsprotokoll wurde am ${date} um ${time} Uhr maschinell erstellt und elektronisch über das Bemusterungsportal der G&S Gruppe übermittelt. Das Dokument ist ohne Unterschrift rechtsgültig, da die Auswahl durch den Kunden aktiv und verbindlich im Online-Portal bestätigt wurde.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}
