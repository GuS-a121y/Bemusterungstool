// API: Wohnungen verwalten
// GET /api/apartments?project_id=X - Wohnungen laden
// POST /api/apartments - Neue Wohnung erstellen
// PUT /api/apartments - Wohnung aktualisieren
// DELETE /api/apartments?id=X - Wohnung löschen

// Hilfsfunktion: Zufälligen Zugangscode generieren
function generateAccessCode(prefix = 'GS') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Ohne verwechselbare Zeichen
  let code = prefix.toUpperCase().substring(0, 3) + '-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  try {
    let query = `
      SELECT a.*, p.name as project_name
      FROM apartments a
      JOIN projects p ON a.project_id = p.id
    `
    let params = []

    if (projectId) {
      query += ' WHERE a.project_id = ?'
      params.push(parseInt(projectId))
    }

    query += ' ORDER BY a.created_at DESC'

    const stmt = params.length > 0 
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query)

    const result = await stmt.all()

    return Response.json({ apartments: result.results })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const data = await request.json()
    const { 
      project_id, name, floor, size_sqm, rooms,
      customer_name, customer_email, access_code 
    } = data

    if (!project_id || !name?.trim()) {
      return Response.json({ error: 'Projekt und Name sind erforderlich' }, { status: 400 })
    }

    // Zugangscode generieren oder validieren
    let finalCode = access_code?.trim().toUpperCase()
    if (!finalCode) {
      // Projektpräfix holen
      const project = await env.DB.prepare('SELECT name FROM projects WHERE id = ?')
        .bind(project_id).first()
      const prefix = project?.name?.substring(0, 3) || 'GS'
      finalCode = generateAccessCode(prefix)
    }

    // Prüfen ob Code bereits existiert
    const existing = await env.DB.prepare('SELECT id FROM apartments WHERE access_code = ?')
      .bind(finalCode).first()
    
    if (existing) {
      return Response.json({ error: 'Zugangscode bereits vergeben' }, { status: 400 })
    }

    const result = await env.DB.prepare(`
      INSERT INTO apartments (project_id, name, floor, size_sqm, rooms, customer_name, customer_email, access_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offen')
    `).bind(
      parseInt(project_id),
      name.trim(),
      floor || null,
      size_sqm ? parseFloat(size_sqm) : null,
      rooms ? parseInt(rooms) : null,
      customer_name || null,
      customer_email || null,
      finalCode
    ).run()

    return Response.json({ 
      success: true, 
      id: result.meta.last_row_id,
      access_code: finalCode
    })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPut(context) {
  const { request, env } = context

  try {
    const data = await request.json()
    const { 
      id, project_id, name, floor, size_sqm, rooms,
      customer_name, customer_email, access_code, status 
    } = data

    if (!id || !name?.trim()) {
      return Response.json({ error: 'ID und Name sind erforderlich' }, { status: 400 })
    }

    // Prüfen ob Code bereits von anderer Wohnung verwendet wird
    if (access_code) {
      const existing = await env.DB.prepare(
        'SELECT id FROM apartments WHERE access_code = ? AND id != ?'
      ).bind(access_code.toUpperCase(), id).first()
      
      if (existing) {
        return Response.json({ error: 'Zugangscode bereits vergeben' }, { status: 400 })
      }
    }

    await env.DB.prepare(`
      UPDATE apartments 
      SET project_id = ?, name = ?, floor = ?, size_sqm = ?, rooms = ?,
          customer_name = ?, customer_email = ?, access_code = ?, status = ?
      WHERE id = ?
    `).bind(
      parseInt(project_id),
      name.trim(),
      floor || null,
      size_sqm ? parseFloat(size_sqm) : null,
      rooms ? parseInt(rooms) : null,
      customer_name || null,
      customer_email || null,
      access_code?.toUpperCase() || null,
      status || 'offen',
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
    await env.DB.prepare('DELETE FROM apartments WHERE id = ?').bind(parseInt(id)).run()
    return Response.json({ success: true })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
