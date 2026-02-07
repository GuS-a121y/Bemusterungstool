// API: Projekte verwalten
// GET /api/projects - Alle Projekte laden
// POST /api/projects - Neues Projekt erstellen
// PUT /api/projects - Projekt aktualisieren
// DELETE /api/projects?id=X - Projekt löschen

export async function onRequestGet(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const includeArchived = url.searchParams.get('include_archived') === 'true'

  try {
    let query = `
      SELECT 
        p.*,
        COUNT(DISTINCT a.id) as apartment_count,
        COUNT(DISTINCT CASE WHEN a.status = 'abgeschlossen' THEN a.id END) as completed_count
      FROM projects p
      LEFT JOIN apartments a ON p.id = a.project_id
    `
    if (!includeArchived) {
      query += ` WHERE p.status != 'archiviert'`
    }
    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `

    const result = await env.DB.prepare(query).all()

    return Response.json({ projects: result.results })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { name, description, address, intro_text, project_logo, project_image, status } = await request.json()

    if (!name?.trim()) {
      return Response.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const result = await env.DB.prepare(`
      INSERT INTO projects (name, description, address, intro_text, project_logo, project_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name.trim(), 
      description || '', 
      address || '', 
      intro_text || '',
      project_logo || null,
      project_image || null,
      status || 'aktiv'
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
    const { id, name, description, address, intro_text, project_logo, project_image, status } = await request.json()

    if (!id || !name?.trim()) {
      return Response.json({ error: 'ID und Name sind erforderlich' }, { status: 400 })
    }

    await env.DB.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, address = ?, intro_text = ?, project_logo = ?, project_image = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name.trim(), 
      description || '', 
      address || '', 
      intro_text || '',
      project_logo || null,
      project_image || null,
      status || 'aktiv', 
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
  const permanent = url.searchParams.get('permanent') === 'true'

  if (!id) {
    return Response.json({ error: 'ID ist erforderlich' }, { status: 400 })
  }

  try {
    if (permanent) {
      // Nur aus dem Archiv: endgültig löschen
      const project = await env.DB.prepare('SELECT status FROM projects WHERE id = ?').bind(parseInt(id)).first()
      if (!project || project.status !== 'archiviert') {
        return Response.json({ error: 'Nur archivierte Projekte können endgültig gelöscht werden' }, { status: 400 })
      }
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(parseInt(id)).run()
    } else {
      // Archivieren statt löschen
      await env.DB.prepare(`UPDATE projects SET status = 'archiviert', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(parseInt(id)).run()
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
