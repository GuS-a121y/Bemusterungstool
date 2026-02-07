// API: Reihenfolge von Kategorien und Optionen per Drag & Drop ändern
// POST /api/reorder - { type: 'categories'|'options', items: [{id, sort_order}] }

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { type, items } = await request.json()

    if (!type || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'type und items sind erforderlich' }, { status: 400 })
    }

    const table = type === 'categories' ? 'categories' : 'options'

    for (const item of items) {
      await env.DB.prepare(
        `UPDATE ${table} SET sort_order = ? WHERE id = ?`
      ).bind(item.sort_order, item.id).run()
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Reorder Error:', error)
    return Response.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
