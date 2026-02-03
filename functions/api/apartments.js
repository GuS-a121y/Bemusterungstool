// API: Wohnungen verwalten
// GET /api/apartments?project_id=X - Wohnungen laden
// POST /api/apartments - Neue Wohnung erstellen (einzeln oder batch)
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

// Hilfsfunktion: Eindeutigen Code generieren
async function generateUniqueCode(env, prefix) {
  let code
  let attempts = 0
  do {
    code = generateAccessCode(prefix)
    const existing = await env.DB.prepare('SELECT id FROM apartments WHERE access_code = ?')
      .bind(code).first()
    if (!existing) break
    attempts++
  } while (attempts < 10)
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

    query += ' ORDER BY a.name ASC'

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
    
    // Batch-Erstellung?
    if (data.batch && Array.isArray(data.apartments)) {
      return handleBatchCreate(env, data)
    }

    // Einzelne Wohnung erstellen
    const { 
      project_id, name, floor, size_sqm, rooms,
      customer_name, customer_email 
    } = data

    if (!project_id || !name?.trim()) {
      return Response.json({ error: 'Projekt und Name sind erforderlich' }, { status: 400 })
    }

    // Prüfen ob Name bereits existiert im Projekt
    const existingName = await env.DB.prepare(
      'SELECT id FROM apartments WHERE project_id = ? AND LOWER(name) = LOWER(?)'
    ).bind(parseInt(project_id), name.trim()).first()
    
    if (existingName) {
      return Response.json({ error: `Wohnung "${name}" existiert bereits in diesem Projekt` }, { status: 400 })
    }

    // Projektpräfix holen und eindeutigen Code generieren
    const project = await env.DB.prepare('SELECT name FROM projects WHERE id = ?')
      .bind(project_id).first()
    const prefix = project?.name?.substring(0, 3) || 'GS'
    const finalCode = await generateUniqueCode(env, prefix)

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

// Batch-Erstellung von Wohnungen
async function handleBatchCreate(env, data) {
  const { project_id, apartments } = data

  if (!project_id || !apartments?.length) {
    return Response.json({ error: 'Projekt und Wohnungen sind erforderlich' }, { status: 400 })
  }

  // Projektpräfix holen
  const project = await env.DB.prepare('SELECT name FROM projects WHERE id = ?')
    .bind(project_id).first()
  const prefix = project?.name?.substring(0, 3) || 'GS'

  // Existierende Namen im Projekt laden
  const existingApts = await env.DB.prepare(
    'SELECT LOWER(name) as name FROM apartments WHERE project_id = ?'
  ).bind(parseInt(project_id)).all()
  const existingNames = new Set(existingApts.results.map(a => a.name))

  const results = []
  const errors = []

  for (const apt of apartments) {
    if (!apt.name?.trim()) {
      errors.push({ name: apt.name, error: 'Name fehlt' })
      continue
    }

    const lowerName = apt.name.trim().toLowerCase()
    if (existingNames.has(lowerName)) {
      errors.push({ name: apt.name, error: 'Existiert bereits' })
      continue
    }

    try {
      const code = await generateUniqueCode(env, prefix)
      
      const result = await env.DB.prepare(`
        INSERT INTO apartments (project_id, name, floor, size_sqm, rooms, customer_name, customer_email, access_code, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offen')
      `).bind(
        parseInt(project_id),
        apt.name.trim(),
        apt.floor || null,
        apt.size_sqm ? parseFloat(apt.size_sqm) : null,
        apt.rooms ? parseInt(apt.rooms) : null,
        apt.customer_name || null,
        apt.customer_email || null,
        code
      ).run()

      existingNames.add(lowerName)
      results.push({ 
        id: result.meta.last_row_id, 
        name: apt.name.trim(),
        access_code: code 
      })
    } catch (err) {
      errors.push({ name: apt.name, error: err.message })
    }
  }

  return Response.json({ 
    success: true, 
    created: results,
    errors: errors
  })
}

export async function onRequestPut(context) {
  const { request, env } = context

  try {
    const data = await request.json()
    const { 
      id, project_id, name, floor, size_sqm, rooms,
      customer_name, customer_email, status 
    } = data

    if (!id || !name?.trim()) {
      return Response.json({ error: 'ID und Name sind erforderlich' }, { status: 400 })
    }

    // Prüfen ob Name bereits von anderer Wohnung im Projekt verwendet wird
    const existingName = await env.DB.prepare(
      'SELECT id FROM apartments WHERE project_id = ? AND LOWER(name) = LOWER(?) AND id != ?'
    ).bind(parseInt(project_id), name.trim(), parseInt(id)).first()
    
    if (existingName) {
      return Response.json({ error: `Wohnung "${name}" existiert bereits in diesem Projekt` }, { status: 400 })
    }

    // Zugangscode wird NICHT geändert - er bleibt wie er ist
    await env.DB.prepare(`
      UPDATE apartments 
      SET project_id = ?, name = ?, floor = ?, size_sqm = ?, rooms = ?,
          customer_name = ?, customer_email = ?, status = ?
      WHERE id = ?
    `).bind(
      parseInt(project_id),
      name.trim(),
      floor || null,
      size_sqm ? parseFloat(size_sqm) : null,
      rooms ? parseInt(rooms) : null,
      customer_name || null,
      customer_email || null,
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
