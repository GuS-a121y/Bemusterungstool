// API: Bemusterungskategorien verwalten
// GET /api/categories?project_id=X - Kategorien laden
// POST /api/categories - Neue Kategorie erstellen
// PUT /api/categories - Kategorie aktualisieren
// DELETE /api/categories?id=X - Kategorie löschen

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  if (!projectId) {
    return Response.json({ error: 'project_id ist erforderlich' }, { status: 400 })
  }

  try {
    const result = await env.DB.prepare(`
      SELECT c.*, 
        COUNT(o.id) as option_count
      FROM categories c
      LEFT JOIN options o ON c.id = o.category_id
      WHERE c.project_id = ?
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at ASC
    `).bind(parseInt(projectId)).all()

    return Response.json({ categories: result.results })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { project_id, name, description, sort_order } = await request.json()

    if (!project_id || !name?.trim()) {
      return Response.json({ error: 'Projekt und Name sind erforderlich' }, { status: 400 })
    }

    // Höchste Sortierung ermitteln wenn nicht angegeben
    let order = sort_order
    if (order === undefined || order === null) {
      const maxOrder = await env.DB.prepare(
        'SELECT MAX(sort_order) as max_order FROM categories WHERE project_id = ?'
      ).bind(parseInt(project_id)).first()
      order = (maxOrder?.max_order || 0) + 1
    }

    const result = await env.DB.prepare(`
      INSERT INTO categories (project_id, name, description, sort_order)
      VALUES (?, ?, ?, ?)
    `).bind(
      parseInt(project_id),
      name.trim(),
      description || '',
      parseInt(order)
    ).run()

    return Response.json({ 
      success: true, 
      id: result.meta.last_row_id 
    })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPut(context) {
  const { request, env } = context

  try {
    const { id, name, description, sort_order } = await request.json()

    if (!id || !name?.trim()) {
      return Response.json({ error: 'ID und Name sind erforderlich' }, { status: 400 })
    }

    await env.DB.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, sort_order = ?
      WHERE id = ?
    `).bind(
      name.trim(),
      description || '',
      parseInt(sort_order) || 0,
      id
    ).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'ID ist erforderlich' }, { status: 400 })
  }

  try {
    // Optionen werden durch CASCADE gelöscht
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(parseInt(id)).run()
    return Response.json({ success: true })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
