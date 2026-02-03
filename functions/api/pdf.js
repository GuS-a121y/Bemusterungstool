// API: PDF für Bemusterung generieren
// GET /api/pdf?apartment_id=X oder /api/pdf?code=XXX

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const apartmentId = url.searchParams.get('apartment_id')
  const code = url.searchParams.get('code')?.toUpperCase()
  const download = url.searchParams.get('download') === '1'

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

    // Für jede Selection die Details laden
    const selectionDetails = []
    for (const sel of selections.results) {
      const cat = categories.results.find(c => c.id === sel.category_id)
      if (!cat) continue

      let optionName, optionPrice, optionDescription, isCustom = false

      if (sel.option_id < 0) {
        // Individuelle Option (negative ID)
        const customOpt = await env.DB.prepare(`
          SELECT name, price, description FROM apartment_custom_options WHERE id = ?
        `).bind(Math.abs(sel.option_id)).first()
        if (customOpt) {
          optionName = customOpt.name
          optionPrice = customOpt.price
          optionDescription = customOpt.description
          isCustom = true
        }
      } else {
        // Standard Option
        const opt = await env.DB.prepare(`
          SELECT name, price, description FROM options WHERE id = ?
        `).bind(sel.option_id).first()
        if (opt) {
          optionName = opt.name
          optionPrice = opt.price
          optionDescription = opt.description
        }
      }

      if (optionName) {
        selectionDetails.push({
          category_name: cat.name,
          option_name: optionName,
          option_price: optionPrice || 0,
          option_description: optionDescription,
          is_custom: isCustom
        })
      }
    }

    // Gesamtpreis berechnen
    let totalPrice = 0
    selectionDetails.forEach(s => {
      totalPrice += s.option_price || 0
    })

    // PDF als HTML generieren
    const html = generatePDFHtml(apartment, selectionDetails, totalPrice, download)

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

function generatePDFHtml(apartment, selections, totalPrice, autoDownload) {
  const now = new Date()
  const date = now.toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })
  const time = now.toLocaleTimeString('de-DE', { 
    hour: '2-digit', minute: '2-digit' 
  })

  const selectionRows = selections.map(s => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${s.category_name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${s.option_name}${s.is_custom ? ' <span style="color: #3b82f6; font-size: 11px;">(Sonderausstattung)</span>' : ''}
        ${s.option_description ? `<br><span style="color: #6b7280; font-size: 12px;">${s.option_description}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.5; 
      color: #1f2937;
      margin: 0;
      padding: 20px;
      font-size: 14px;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      border-bottom: 3px solid #E30613; 
      padding-bottom: 15px; 
      margin-bottom: 20px; 
    }
    .title { font-size: 22px; font-weight: bold; margin: 0; }
    .subtitle { color: #6b7280; margin: 5px 0 0; font-size: 14px; }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
      margin-bottom: 20px; 
    }
    .info-box { 
      background: #f9fafb; 
      padding: 12px; 
      border-radius: 6px; 
    }
    .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 3px; }
    .info-value { font-weight: 600; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { 
      background: #1f2937; 
      color: white; 
      padding: 10px 12px; 
      text-align: left; 
      font-weight: 600;
      font-size: 13px;
    }
    th:last-child { text-align: right; }
    .total-row { 
      background: #1f2937; 
      color: white; 
    }
    .total-row td { 
      padding: 12px; 
      font-weight: bold; 
      font-size: 15px;
    }
    .validity-notice {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 25px;
    }
    .validity-notice h4 {
      color: #166534;
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    .validity-notice p {
      color: #15803d;
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
    }
    .print-bar {
      background: #E30613; 
      color: white; 
      padding: 15px 20px; 
      margin: -20px -20px 20px -20px; 
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
    }
    .print-bar button:hover {
      background: #f3f4f6;
    }
    @media print {
      .print-bar { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span style="font-weight: 500;">Bemusterungsprotokoll für ${apartment.customer_name || apartment.name}</span>
    <button onclick="window.print()">Als PDF speichern / Drucken</button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">Bemusterungsprotokoll</h1>
      <p class="subtitle">Verbindliche Ausstattungsauswahl</p>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 600; color: #E30613; font-size: 16px;">G&S Gruppe</div>
      <div style="font-size: 13px; color: #6b7280;">Erstellt: ${date}, ${time} Uhr</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Projekt</div>
      <div class="info-value">${apartment.project_name}</div>
      ${apartment.project_address ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${apartment.project_address}</div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-label">Wohnung</div>
      <div class="info-value">${apartment.name}</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">
        ${[apartment.floor, apartment.size_sqm ? apartment.size_sqm + ' m²' : '', apartment.rooms ? apartment.rooms + ' Zimmer' : ''].filter(Boolean).join(' · ') || '-'}
      </div>
    </div>
    <div class="info-box">
      <div class="info-label">Kunde</div>
      <div class="info-value">${apartment.customer_name || '-'}</div>
      ${apartment.customer_email ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${apartment.customer_email}</div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-label">Referenz-Code</div>
      <div class="info-value" style="font-family: monospace; letter-spacing: 1px;">${apartment.access_code}</div>
    </div>
  </div>

  <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #374151;">Gewählte Ausstattung</h3>
  
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Kategorie</th>
        <th>Gewählte Option</th>
        <th style="width: 15%;">Mehrpreis</th>
      </tr>
    </thead>
    <tbody>
      ${selectionRows || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6b7280;">Keine Auswahl vorhanden</td></tr>'}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">Gesamter Mehrpreis zur Basisausstattung</td>
        <td style="text-align: right;">${totalPrice >= 0 ? '+' : ''}${totalPrice.toLocaleString('de-DE')} €</td>
      </tr>
    </tfoot>
  </table>

  <div class="validity-notice">
    <h4>✓ Rechtsgültiges Dokument</h4>
    <p>
      Dieses Bemusterungsprotokoll wurde am <strong>${date} um ${time} Uhr</strong> maschinell erstellt 
      und elektronisch über das Bemusterungsportal der G&S Gruppe übermittelt. 
      Das Dokument ist <strong>ohne Unterschrift rechtsgültig</strong>, da die Auswahl durch den Kunden 
      aktiv und verbindlich im Online-Portal bestätigt wurde.
    </p>
  </div>

</body>
</html>`
}

