// API: Bilder aus R2 ausliefern
// GET /api/images/[...path] - Bild laden

export async function onRequest(context) {
  const { request, env, params } = context
  
  // Pfad aus params zusammensetzen
  const path = params.path
  const key = Array.isArray(path) ? path.join('/') : path

  if (!key) {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const object = await env.IMAGES.get(key)

    if (!object) {
      return new Response('Not Found', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=31536000') // 1 Jahr Cache
    headers.set('ETag', object.httpEtag)

    return new Response(object.body, { headers })
  } catch (error) {
    console.error('Image Error:', error)
    return new Response('Error loading image', { status: 500 })
  }
}
