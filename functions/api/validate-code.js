// API: Code validieren
// GET /api/validate-code?code=XXX

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.toUpperCase()

  if (!code) {
    return Response.json({ valid: false, error: 'Kein Code angegeben' }, { status: 400 })
  }

  try {
    const result = await env.DB.prepare(
      'SELECT id, status FROM apartments WHERE access_code = ?'
    ).bind(code).first()

    if (result) {
      return Response.json({ 
        valid: true, 
        status: result.status,
        apartmentId: result.id 
      })
    } else {
      return Response.json({ valid: false, error: 'Code nicht gefunden' })
    }
  } catch (error) {
    console.error('DB Error:', error)
    return Response.json({ valid: false, error: 'Datenbankfehler' }, { status: 500 })
  }
}
