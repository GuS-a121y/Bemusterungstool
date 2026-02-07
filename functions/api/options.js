// API: Ausstattungsoptionen verwalten
// GET /api/options?category_id=X - Optionen laden
// POST /api/options - Neue Option erstellen
// PUT /api/options - Option aktualisieren
// DELETE /api/options?id=X - Option löschen

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const categoryId = url.searchParams.get('category_id')
  const projectId = url.searchParams.get('project_id')

  try {
    let query, params

    if (categoryId) {
      query = `
        SELECT o.*, c.name as category_name
        FROM options o
        JOIN categories c ON o.category_id = c.id
        WHERE o.category_id = ?
        ORDER BY o.sort_order ASC, o.created_at ASC
      `
      params = [parseInt(categoryId)]
    } else if (projectId) {
      query = `
        SELECT o.*, c.name as category_name
        FROM options o
        JOIN categories c ON o.category_id = c.id
        WHERE c.project_id = ?
        ORDER BY c.sort_order ASC, o.sort_order ASC
      `
      params = [parseInt(projectId)]
    } else {
      return Response.json({ error: 'category_id oder project_id erforderlich' }, { status: 400 })
    }

    const result = await env.DB.prepare(query).bind(...params).all()

    // Zusätzliche Bilder für alle Optionen laden
    const optionIds = result.results.map(o => o.id)
    let allImages = []
    if (optionIds.length > 0) {
      try {
        const imgResult = await env.DB.prepare(`
          SELECT * FROM option_images WHERE option_id IN (${optionIds.join(',')}) ORDER BY sort_order ASC
        `).all()
        allImages = imgResult.results || []
      } catch (e) {
        // Tabelle existiert möglicherweise noch nicht
        console.warn('option_images table may not exist yet:', e.message)
      }
    }

    // Bilder den Optionen zuordnen
    const optionsWithImages = result.results.map(opt => ({
      ...opt,
      additional_images: allImages.filter(img => img.option_id === opt.id)
    }))

    return Response.json({ options: optionsWithImages })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { category_id, name, description, info_text, price, image_url, is_default, sort_order } = await request.json()

    if (!category_id || !name?.trim()) {
      return Response.json({ error: 'Kategorie und Name sind erforderlich' }, { status: 400 })
    }

    // Wenn is_default gesetzt wird, andere Defaults zurücksetzen
    if (is_default) {
      await env.DB.prepare(
        'UPDATE options SET is_default = 0 WHERE category_id = ?'
      ).bind(parseInt(category_id)).run()
    }

    // Höchste Sortierung ermitteln wenn nicht angegeben
    let order = sort_order
    if (order === undefined || order === null) {
      const maxOrder = await env.DB.prepare(
        'SELECT MAX(sort_order) as max_order FROM options WHERE category_id = ?'
      ).bind(parseInt(category_id)).first()
      order = (maxOrder?.max_order || 0) + 1
    }

    const result = await env.DB.prepare(`
      INSERT INTO options (category_id, name, description, info_text, price, image_url, is_default, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      parseInt(category_id),
      name.trim(),
      description || '',
      info_text || '',
      parseFloat(price) || 0,
      image_url || null,
      is_default ? 1 : 0,
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
    const { id, category_id, name, description, info_text, price, image_url, is_default, sort_order } = await request.json()

    if (!id || !name?.trim()) {
      return Response.json({ error: 'ID und Name sind erforderlich' }, { status: 400 })
    }

    // Wenn is_default gesetzt wird, andere Defaults zurücksetzen
    if (is_default && category_id) {
      await env.DB.prepare(
        'UPDATE options SET is_default = 0 WHERE category_id = ? AND id != ?'
      ).bind(parseInt(category_id), id).run()
    }

    await env.DB.prepare(`
      UPDATE options 
      SET name = ?, description = ?, info_text = ?, price = ?, image_url = ?, is_default = ?, sort_order = ?
      WHERE id = ?
    `).bind(
      name.trim(),
      description || '',
      info_text || '',
      parseFloat(price) || 0,
      image_url || null,
      is_default ? 1 : 0,
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
    // Bild aus R2 löschen wenn vorhanden
    const option = await env.DB.prepare('SELECT image_url FROM options WHERE id = ?')
      .bind(parseInt(id)).first()
    
    if (option?.image_url && env.IMAGES) {
      const key = option.image_url.split('/').pop()
      try {
        await env.IMAGES.delete(key)
      } catch (e) {
        console.warn('Bild konnte nicht gelöscht werden:', e)
      }
    }

    await env.DB.prepare('DELETE FROM options WHERE id = ?').bind(parseInt(id)).run()
    return Response.json({ success: true })
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
