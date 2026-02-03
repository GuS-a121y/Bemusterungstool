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

    // Auswahl laden
    const selections = await env.DB.prepare(`
      SELECT s.*, o.name as option_name, o.price as option_price, o.description as option_description,
             c.name as category_name
      FROM selections s
      LEFT JOIN options o ON s.option_id = o.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.apartment_id = ?
    `).bind(apartment.id).all()

    // Individuelle Optionen die ausgewählt wurden (negative IDs)
    const customSelections = await env.DB.prepare(`
      SELECT s.category_id, aco.name as option_name, aco.price as option_price, 
             aco.description as option_description, c.name as category_name
      FROM selections s
      JOIN apartment_custom_options aco ON aco.id = ABS(s.option_id)
      JOIN categories c ON s.category_id = c.id
      WHERE s.apartment_id = ? AND s.option_id < 0
    `).bind(apartment.id).all()

    // Alle Auswahlen zusammenführen
    const allSelections = [
      ...selections.results.filter(s => s.option_id > 0),
      ...customSelections.results.map(s => ({ ...s, is_custom: true }))
    ]

    // Gesamtpreis berechnen
    let totalPrice = 0
    allSelections.forEach(s => {
      totalPrice += s.option_price || 0
    })

    // PDF als HTML generieren (wird vom Browser als PDF gedruckt)
    const html = generatePDFHtml(apartment, allSelections, totalPrice)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })

  } catch (error) {
    console.error('PDF Error:', error)
    return new Response('Fehler beim Generieren des PDFs', { status: 500 })
  }
}

function generatePDFHtml(apartment, selections, totalPrice) {
  const date = new Date().toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })

  const selectionRows = selections.map(s => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${s.category_name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${s.option_name}${s.is_custom ? ' <span style="color: #3b82f6; font-size: 11px;">(Individuell)</span>' : ''}
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
    @page { size: A4; margin: 20mm; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.5; 
      color: #1f2937;
      margin: 0;
      padding: 20px;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      border-bottom: 3px solid #E30613; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .logo { height: 50px; }
    .title { font-size: 24px; font-weight: bold; margin: 0; }
    .subtitle { color: #6b7280; margin: 5px 0 0; }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 30px; 
    }
    .info-box { 
      background: #f9fafb; 
      padding: 15px; 
      border-radius: 8px; 
    }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
    .info-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { 
      background: #1f2937; 
      color: white; 
      padding: 12px; 
      text-align: left; 
      font-weight: 600;
    }
    th:last-child { text-align: right; }
    .total-row { 
      background: #1f2937; 
      color: white; 
    }
    .total-row td { 
      padding: 15px; 
      font-weight: bold; 
      font-size: 16px;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
    }
    .signature-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
      margin-top: 60px; 
    }
    .signature-box { border-top: 1px solid #1f2937; padding-top: 10px; }
    .signature-label { font-size: 12px; color: #6b7280; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #E30613; color: white; padding: 15px; margin: -20px -20px 20px; text-align: center;">
    <button onclick="window.print()" style="background: white; color: #E30613; border: none; padding: 10px 30px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer;">
      PDF herunterladen / drucken
    </button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">Bemusterungsprotokoll</h1>
      <p class="subtitle">Verbindliche Ausstattungsauswahl</p>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 600; color: #E30613;">G&S Gruppe</div>
      <div style="font-size: 14px; color: #6b7280;">Datum: ${date}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Projekt</div>
      <div class="info-value">${apartment.project_name}</div>
      ${apartment.project_address ? `<div style="font-size: 14px; color: #6b7280;">${apartment.project_address}</div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-label">Wohnung</div>
      <div class="info-value">${apartment.name}</div>
      <div style="font-size: 14px; color: #6b7280;">
        ${[apartment.floor, apartment.size_sqm ? apartment.size_sqm + ' m²' : '', apartment.rooms ? apartment.rooms + ' Zimmer' : ''].filter(Boolean).join(' · ')}
      </div>
    </div>
    <div class="info-box">
      <div class="info-label">Kunde</div>
      <div class="info-value">${apartment.customer_name}</div>
      ${apartment.customer_email ? `<div style="font-size: 14px; color: #6b7280;">${apartment.customer_email}</div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-label">Zugangscode</div>
      <div class="info-value" style="font-family: monospace;">${apartment.access_code}</div>
    </div>
  </div>

  <h2 style="font-size: 18px; margin-bottom: 15px;">Ausgewählte Ausstattung</h2>
  
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Kategorie</th>
        <th>Gewählte Option</th>
        <th style="width: 15%;">Mehrpreis</th>
      </tr>
    </thead>
    <tbody>
      ${selectionRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">Gesamter Mehrpreis zur Basisausstattung</td>
        <td style="text-align: right;">${totalPrice >= 0 ? '+' : ''}${totalPrice.toLocaleString('de-DE')} €</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <p style="font-size: 14px; color: #6b7280;">
      Mit meiner Unterschrift bestätige ich die oben aufgeführte Ausstattungsauswahl. 
      Die Auswahl ist verbindlich und kann nach Abgabe nicht mehr geändert werden.
    </p>
    
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-label">Datum, Unterschrift Kunde</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Datum, Unterschrift G&S Gruppe</div>
      </div>
    </div>
  </div>
</body>
</html>`
}
