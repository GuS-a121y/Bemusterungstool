// API: Kundendaten für Bemusterung
// GET /api/customer/[code] - Daten laden
// POST /api/customer/[code] - Auswahl absenden

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
        p.id as project_id, p.name as project_name, p.address as project_address,
        p.intro_text as project_intro_text, p.project_logo, p.project_image
      FROM apartments a
      JOIN projects p ON a.project_id = p.id
      WHERE a.access_code = ?
    `).bind(code).first()

    if (!apartment) {
      return Response.json({ error: 'Wohnung nicht gefunden' }, { status: 404 })
    }

    // Ausgeblendete Optionen für diese Wohnung laden
    const hiddenResult = await env.DB.prepare(`
      SELECT option_id FROM apartment_hidden_options WHERE apartment_id = ?
    `).bind(apartment.id).all()
    const hiddenIds = hiddenResult.results.map(h => h.option_id)

    // Individuelle Optionen für diese Wohnung laden
    const customResult = await env.DB.prepare(`
      SELECT id, category_id, name, description, price, image_url
      FROM apartment_custom_options 
      WHERE apartment_id = ?
    `).bind(apartment.id).all()

    // Kategorien für das Projekt laden
    const categoriesResult = await env.DB.prepare(`
      SELECT id, name, description, sort_order
      FROM categories
      WHERE project_id = ?
      ORDER BY sort_order ASC
    `).bind(apartment.project_id).all()

    // Optionen für alle Kategorien laden (ohne ausgeblendete)
    const categories = []
    for (const cat of categoriesResult.results) {
      const optionsResult = await env.DB.prepare(`
        SELECT id, name, description, info_text, price, image_url, is_default, sort_order
        FROM options
        WHERE category_id = ?
        ORDER BY sort_order ASC
      `).bind(cat.id).all()

      // Standard-Optionen filtern (ausgeblendete entfernen)
      const filteredOptions = optionsResult.results.filter(o => !hiddenIds.includes(o.id))

      // Individuelle Optionen für diese Kategorie hinzufügen
      const customOptions = customResult.results
        .filter(co => co.category_id === cat.id)
        .map(co => ({
          ...co,
          id: `custom_${co.id}`,
          custom_id: co.id,
          is_custom: true,
          is_default: 0,
          sort_order: 999
        }))

      const allOptions = [...filteredOptions, ...customOptions]

      // Nur Kategorien mit mindestens einer Option anzeigen
      if (allOptions.length > 0) {
        categories.push({
          ...cat,
          options: allOptions
        })
      }
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
          address: apartment.project_address,
          intro_text: apartment.project_intro_text,
          logo: apartment.project_logo,
          image: apartment.project_image
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
    const { selections, draft } = body // draft = true für Zwischenspeichern

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
      // Prüfen ob es eine individuelle Option ist (custom_123 Format oder String)
      let finalOptionId = optionId
      if (typeof optionId === 'string' && optionId.startsWith('custom_')) {
        // Individuelle Option: ID extrahieren und negativ speichern
        finalOptionId = -Math.abs(parseInt(optionId.replace('custom_', '')))
      } else {
        finalOptionId = parseInt(optionId)
      }
      
      await env.DB.prepare(`
        INSERT OR REPLACE INTO selections (apartment_id, category_id, option_id, selected_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(apartment.id, parseInt(categoryId), finalOptionId).run()
    }

    // Status aktualisieren
    if (draft) {
      // Nur Zwischenspeichern - Status auf "in_bearbeitung"
      await env.DB.prepare(`
        UPDATE apartments 
        SET status = 'in_bearbeitung'
        WHERE id = ?
      `).bind(apartment.id).run()
      
      return Response.json({ success: true, draft: true })
    } else {
      // Final absenden - Status auf "abgeschlossen"
      await env.DB.prepare(`
        UPDATE apartments 
        SET status = 'abgeschlossen', completed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(apartment.id).run()
      
      return Response.json({ success: true, draft: false })
    }

  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
