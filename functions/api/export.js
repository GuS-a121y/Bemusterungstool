// API: Excel-Export der Bemusterungen
// GET /api/export?project_id=X - Export für ein Projekt

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  if (!projectId) {
    return Response.json({ error: 'project_id ist erforderlich' }, { status: 400 })
  }

  try {
    // Projektdaten laden
    const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?')
      .bind(parseInt(projectId)).first()

    if (!project) {
      return Response.json({ error: 'Projekt nicht gefunden' }, { status: 404 })
    }

    // Wohnungen mit Auswahl laden
    const apartments = await env.DB.prepare(`
      SELECT a.*, 
        GROUP_CONCAT(
          c.name || ': ' || o.name || ' (' || 
          CASE 
            WHEN o.price = 0 THEN 'Inklusive'
            WHEN o.price > 0 THEN '+' || o.price || ' €'
            ELSE o.price || ' €'
          END || ')',
          ' | '
        ) as selections_text,
        SUM(o.price) as total_price
      FROM apartments a
      LEFT JOIN selections s ON a.id = s.apartment_id
      LEFT JOIN options o ON s.option_id = o.id
      LEFT JOIN categories c ON o.category_id = c.id
      WHERE a.project_id = ?
      GROUP BY a.id
      ORDER BY a.name
    `).bind(parseInt(projectId)).all()

    // Kategorien für Header
    const categories = await env.DB.prepare(`
      SELECT id, name FROM categories 
      WHERE project_id = ? 
      ORDER BY sort_order ASC
    `).bind(parseInt(projectId)).all()

    // CSV erstellen (einfaches Format, Excel-kompatibel)
    const BOM = '\uFEFF' // UTF-8 BOM für Excel
    let csv = BOM

    // Header
    const headers = [
      'Wohnung', 'Etage', 'Größe (m²)', 'Zimmer', 
      'Kunde', 'E-Mail', 'Zugangscode', 'Status',
      ...categories.results.map(c => c.name),
      'Mehrpreis gesamt'
    ]
    csv += headers.map(h => `"${h}"`).join(';') + '\n'

    // Daten
    for (const apt of apartments.results) {
      // Auswahl pro Kategorie laden
      const selectionsResult = await env.DB.prepare(`
        SELECT c.id as category_id, o.name as option_name, o.price
        FROM selections s
        JOIN options o ON s.option_id = o.id
        JOIN categories c ON o.category_id = c.id
        WHERE s.apartment_id = ?
      `).bind(apt.id).all()

      const selectionsByCategory = {}
      selectionsResult.results.forEach(s => {
        selectionsByCategory[s.category_id] = {
          name: s.option_name,
          price: s.price
        }
      })

      const row = [
        apt.name,
        apt.floor || '',
        apt.size_sqm || '',
        apt.rooms || '',
        apt.customer_name || '',
        apt.customer_email || '',
        apt.access_code,
        apt.status === 'abgeschlossen' ? 'Abgeschlossen' : 
          apt.status === 'in_bearbeitung' ? 'In Bearbeitung' : 'Offen',
        ...categories.results.map(c => {
          const sel = selectionsByCategory[c.id]
          if (sel) {
            const priceStr = sel.price === 0 ? '(inkl.)' : 
              sel.price > 0 ? `(+${sel.price}€)` : `(${sel.price}€)`
            return `${sel.name} ${priceStr}`
          }
          return '-'
        }),
        apt.total_price ? `${apt.total_price} €` : '0 €'
      ]

      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';') + '\n'
    }

    // Als Download zurückgeben
    const filename = `Bemusterung_${project.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (error) {
    console.error('Export Error:', error)
    return Response.json({ error: 'Export fehlgeschlagen' }, { status: 500 })
  }
}
