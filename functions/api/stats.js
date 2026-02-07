// API: Statistiken für ein Projekt
// GET /api/stats?project_id=X

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  if (!projectId) {
    return Response.json({ error: 'project_id ist erforderlich' }, { status: 400 })
  }

  try {
    // Übersicht
    const overview = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_apartments,
        COUNT(CASE WHEN status = 'abgeschlossen' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_bearbeitung' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'offen' THEN 1 END) as open
      FROM apartments WHERE project_id = ?
    `).bind(parseInt(projectId)).first()

    // Auswahl pro Kategorie & Option (wie oft wurde jede Option gewählt)
    const selectionStats = await env.DB.prepare(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.sort_order,
        o.id as option_id,
        o.name as option_name,
        o.price as option_price,
        o.is_default,
        COUNT(s.id) as selection_count
      FROM categories c
      LEFT JOIN options o ON o.category_id = c.id
      LEFT JOIN selections s ON s.option_id = o.id AND s.category_id = c.id
      WHERE c.project_id = ?
      GROUP BY c.id, o.id
      ORDER BY c.sort_order ASC, o.sort_order ASC
    `).bind(parseInt(projectId)).all()

    // Gruppiere nach Kategorie
    const categoriesMap = {}
    for (const row of selectionStats.results) {
      if (!categoriesMap[row.category_id]) {
        categoriesMap[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          sort_order: row.sort_order,
          options: []
        }
      }
      if (row.option_id) {
        categoriesMap[row.category_id].options.push({
          id: row.option_id,
          name: row.option_name,
          price: row.option_price,
          is_default: row.is_default,
          count: row.selection_count
        })
      }
    }

    // Individuelle Optionen zählen
    const customStats = await env.DB.prepare(`
      SELECT 
        c.id as category_id,
        aco.name as option_name,
        aco.price as option_price,
        COUNT(s.id) as selection_count
      FROM apartment_custom_options aco
      JOIN categories c ON aco.category_id = c.id
      LEFT JOIN selections s ON s.option_id = -aco.id AND s.category_id = c.id
      WHERE c.project_id = ?
      GROUP BY aco.id
    `).bind(parseInt(projectId)).all()

    for (const row of customStats.results) {
      if (categoriesMap[row.category_id] && row.selection_count > 0) {
        categoriesMap[row.category_id].options.push({
          id: `custom`,
          name: `${row.option_name} (Individuell)`,
          price: row.option_price,
          is_default: 0,
          count: row.selection_count
        })
      }
    }

    // Durchschnittlicher Mehrpreis
    const avgPrice = await env.DB.prepare(`
      SELECT AVG(total_price) as avg_price
      FROM (
        SELECT a.id, COALESCE(SUM(o.price), 0) as total_price
        FROM apartments a
        LEFT JOIN selections s ON a.id = s.apartment_id
        LEFT JOIN options o ON s.option_id = o.id
        WHERE a.project_id = ? AND a.status = 'abgeschlossen'
        GROUP BY a.id
      )
    `).bind(parseInt(projectId)).first()

    return Response.json({
      overview,
      categories: Object.values(categoriesMap).sort((a, b) => a.sort_order - b.sort_order),
      avg_additional_price: avgPrice?.avg_price || 0
    })
  } catch (error) {
    console.error('Stats Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
