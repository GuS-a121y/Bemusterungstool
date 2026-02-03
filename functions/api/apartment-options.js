// API: Wohnungs-spezifische Optionen verwalten
// GET /api/apartment-options?apartment_id=X - Optionen für eine Wohnung laden
// POST /api/apartment-options/hide - Option ausblenden
// DELETE /api/apartment-options/hide - Ausblendung aufheben
// POST /api/apartment-options/custom - Individuelle Option hinzufügen
// DELETE /api/apartment-options/custom - Individuelle Option löschen

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const apartmentId = url.searchParams.get('apartment_id')

  if (!apartmentId) {
    return Response.json({ error: 'apartment_id ist erforderlich' }, { status: 400 })
  }

  try {
    // Ausgeblendete Optionen laden
    const hidden = await env.DB.prepare(`
      SELECT option_id FROM apartment_hidden_options WHERE apartment_id = ?
    `).bind(parseInt(apartmentId)).all()

    // Individuelle Optionen laden
    const custom = await env.DB.prepare(`
      SELECT * FROM apartment_custom_options WHERE apartment_id = ?
    `).bind(parseInt(apartmentId)).all()

    return Response.json({
      hidden_option_ids: hidden.results.map(h => h.option_id),
      custom_options: custom.results
    })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context
  const url = new URL(request.url)
  
  try {
    const data = await request.json()
    const { apartment_id, option_id, category_id, name, description, price, image_url, action } = data

    if (action === 'hide') {
      // Option ausblenden
      if (!apartment_id || !option_id) {
        return Response.json({ error: 'apartment_id und option_id erforderlich' }, { status: 400 })
      }
      
      await env.DB.prepare(`
        INSERT OR IGNORE INTO apartment_hidden_options (apartment_id, option_id)
        VALUES (?, ?)
      `).bind(parseInt(apartment_id), parseInt(option_id)).run()

      return Response.json({ success: true })
    } 
    
    if (action === 'unhide') {
      // Ausblendung aufheben
      if (!apartment_id || !option_id) {
        return Response.json({ error: 'apartment_id und option_id erforderlich' }, { status: 400 })
      }

      await env.DB.prepare(`
        DELETE FROM apartment_hidden_options WHERE apartment_id = ? AND option_id = ?
      `).bind(parseInt(apartment_id), parseInt(option_id)).run()

      return Response.json({ success: true })
    }
    
    if (action === 'add_custom') {
      // Individuelle Option hinzufügen
      if (!apartment_id || !category_id || !name?.trim()) {
        return Response.json({ error: 'apartment_id, category_id und name erforderlich' }, { status: 400 })
      }

      const result = await env.DB.prepare(`
        INSERT INTO apartment_custom_options (apartment_id, category_id, name, description, info_text, price, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        parseInt(apartment_id),
        parseInt(category_id),
        name.trim(),
        description || '',
        data.info_text || '',
        parseFloat(price) || 0,
        image_url || null
      ).run()

      return Response.json({ 
        success: true, 
        id: result.meta.last_row_id,
        option: {
          id: result.meta.last_row_id,
          apartment_id: parseInt(apartment_id),
          category_id: parseInt(category_id),
          name: name.trim(),
          description: description || '',
          info_text: data.info_text || '',
          price: parseFloat(price) || 0,
          image_url: image_url || null
        }
      })
    }
    
    if (action === 'delete_custom') {
      // Individuelle Option löschen
      if (!data.id) {
        return Response.json({ error: 'id erforderlich' }, { status: 400 })
      }

      await env.DB.prepare(`
        DELETE FROM apartment_custom_options WHERE id = ?
      `).bind(parseInt(data.id)).run()

      return Response.json({ success: true })
    }

    return Response.json({ error: 'Ungültige Aktion' }, { status: 400 })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
