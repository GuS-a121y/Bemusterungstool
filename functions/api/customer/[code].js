// API: Kundendaten für Bemusterung
// GET /api/customer/[code] - Daten laden
// POST /api/customer/[code]/submit - Auswahl absenden

export async function onRequestGet(context) {
  const { params, env } = context
  const code = params.code?.toUpperCase()

  if (!code) {
    return Response.json({ error: 'Kein Code angegeben' }, { status: 400 })
  }

  try {
    // Wohnung mit Projekt laden
    const apartment = await env.DB.prepare(`
      SELECT 
        a.id, a.name, a.floor, a.size_sqm, a.rooms, 
        a.customer_name, a.customer_email, a.status,
        p.id as project_id, p.name as project_name, p.address as project_address
      FROM apartments a
      JOIN projects p ON a.project_id = p.id
      WHERE a.access_code = ?
    `).bind(code).first()

    if (!apartment) {
      return Response.json({ error: 'Wohnung nicht gefunden' }, { status: 404 })
    }

    // Kategorien für das Projekt laden
    const categoriesResult = await env.DB.prepare(`
      SELECT id, name, description, sort_order
      FROM categories
      WHERE project_id = ?
      ORDER BY sort_order ASC
    `).bind(apartment.project_id).all()

    // Optionen für alle Kategorien laden
    const categories = []
    for (const cat of categoriesResult.results) {
      const optionsResult = await env.DB.prepare(`
        SELECT id, name, description, price, image_url, is_default, sort_order
        FROM options
        WHERE category_id = ?
        ORDER BY sort_order ASC
      `).bind(cat.id).all()

      categories.push({
        ...cat,
        options: optionsResult.results
      })
    }

    // Bestehende Auswahl laden (falls vorhanden)
    const selectionsResult = await env.DB.prepare(`
      SELECT category_id, option_id
      FROM selections
      WHERE apartment_id = ?
    `).bind(apartment.id).all()

    const existingSelections = {}
    selectionsResult.results.forEach(s => {
      existingSelections[s.category_id] = s.option_id
    })

    return Response.json({
      apartment: {
        id: apartment.id,
        name: apartment.name,
        floor: apartment.floor,
        size_sqm: apartment.size_sqm,
        rooms: apartment.rooms,
        customer_name: apartment.customer_name,
        status: apartment.status,
        project: {
          id: apartment.project_id,
          name: apartment.project_name,
          address: apartment.project_address
        }
      },
      categories,
      selections: existingSelections
    })

  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { params, request, env } = context
  const code = params.code?.toUpperCase()

  if (!code) {
    return Response.json({ error: 'Kein Code angegeben' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { selections } = body

    if (!selections || typeof selections !== 'object') {
      return Response.json({ error: 'Ungültige Auswahl' }, { status: 400 })
    }

    // Wohnung finden
    const apartment = await env.DB.prepare(
      'SELECT id, status FROM apartments WHERE access_code = ?'
    ).bind(code).first()

    if (!apartment) {
      return Response.json({ error: 'Wohnung nicht gefunden' }, { status: 404 })
    }

    if (apartment.status === 'abgeschlossen') {
      return Response.json({ error: 'Bemusterung bereits abgeschlossen' }, { status: 400 })
    }

    // Auswahl speichern
    for (const [categoryId, optionId] of Object.entries(selections)) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO selections (apartment_id, category_id, option_id, selected_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(apartment.id, parseInt(categoryId), parseInt(optionId)).run()
    }

    // Status aktualisieren
    await env.DB.prepare(`
      UPDATE apartments 
      SET status = 'abgeschlossen', completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(apartment.id).run()

    return Response.json({ success: true })

  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
