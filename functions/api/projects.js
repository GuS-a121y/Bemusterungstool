// API: Projekte verwalten
// GET /api/projects - Alle Projekte laden
// POST /api/projects - Neues Projekt erstellen
// PUT /api/projects - Projekt aktualisieren
// DELETE /api/projects?id=X - Projekt löschen

export async function onRequestGet(context) {
  const { env } = context

  try {
    const result = await env.DB.prepare(`
      SELECT 
        p.*,
        COUNT(DISTINCT a.id) as apartment_count,
        COUNT(DISTINCT CASE WHEN a.status = 'abgeschlossen' THEN a.id END) as completed_count
      FROM projects p
      LEFT JOIN apartments a ON p.id = a.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all()

    return Response.json({ projects: result.results })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { name, description, address, status } = await request.json()

    if (!name?.trim()) {
      return Response.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const result = await env.DB.prepare(`
      INSERT INTO projects (name, description, address, status)
      VALUES (?, ?, ?, ?)
    `).bind(name.trim(), description || '', address || '', status || 'aktiv').run()

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
    const { id, name, description, address, status } = await request.json()

    if (!id || !name?.trim()) {
      return Response.json({ error: 'ID und Name sind erforderlich' }, { status: 400 })
    }

    await env.DB.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name.trim(), description || '', address || '', status || 'aktiv', id).run()

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
    // Lösche auch alle zugehörigen Daten (CASCADE)
    await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(parseInt(id)).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
