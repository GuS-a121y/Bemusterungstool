// API: Mehrere Bilder pro Option verwalten
// GET /api/option-images?option_id=X - Bilder laden
// POST /api/option-images - Bild hinzufügen
// DELETE /api/option-images?id=X - Bild löschen
// PUT /api/option-images - Reihenfolge ändern

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const optionId = url.searchParams.get('option_id')

  if (!optionId) {
    return Response.json({ error: 'option_id erforderlich' }, { status: 400 })
  }

  try {
    const result = await env.DB.prepare(`
      SELECT * FROM option_images WHERE option_id = ? ORDER BY sort_order ASC
    `).bind(parseInt(optionId)).all()

    return Response.json({ images: result.results })
  } catch (error) {
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { option_id, image_url } = await request.json()

    if (!option_id || !image_url) {
      return Response.json({ error: 'option_id und image_url erforderlich' }, { status: 400 })
    }

    const maxOrder = await env.DB.prepare(
      'SELECT MAX(sort_order) as max_order FROM option_images WHERE option_id = ?'
    ).bind(parseInt(option_id)).first()

    const result = await env.DB.prepare(`
      INSERT INTO option_images (option_id, image_url, sort_order)
      VALUES (?, ?, ?)
    `).bind(parseInt(option_id), image_url, (maxOrder?.max_order || 0) + 1).run()

    return Response.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestPut(context) {
  const { request, env } = context

  try {
    const { items } = await request.json()
    if (!Array.isArray(items)) {
      return Response.json({ error: 'items Array erforderlich' }, { status: 400 })
    }

    for (const item of items) {
      await env.DB.prepare(
        'UPDATE option_images SET sort_order = ? WHERE id = ?'
      ).bind(item.sort_order, item.id).run()
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'id erforderlich' }, { status: 400 })
  }

  try {
    const img = await env.DB.prepare('SELECT image_url FROM option_images WHERE id = ?')
      .bind(parseInt(id)).first()
    
    if (img?.image_url && env.IMAGES) {
      const key = img.image_url.replace('/api/images/', '')
      try { await env.IMAGES.delete(key) } catch {}
    }

    await env.DB.prepare('DELETE FROM option_images WHERE id = ?').bind(parseInt(id)).run()
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
