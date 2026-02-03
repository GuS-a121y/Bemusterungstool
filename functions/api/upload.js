// API: Bilder hochladen und verwalten (R2)
// POST /api/upload - Bild hochladen
// DELETE /api/upload?key=X - Bild löschen

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Dateityp prüfen
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, GIF' 
      }, { status: 400 })
    }

    // Dateigröße prüfen (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json({ 
        error: 'Datei zu groß. Maximum: 5 MB' 
      }, { status: 400 })
    }

    // Eindeutigen Dateinamen generieren
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const key = `options/${timestamp}-${random}.${ext}`

    // In R2 speichern
    const arrayBuffer = await file.arrayBuffer()
    await env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // Öffentliche URL zurückgeben
    // Format: https://[bucket].r2.cloudflarestorage.com/[key]
    // Oder bei eigenem Domain: https://images.example.com/[key]
    const publicUrl = `/api/images/${key}`

    return Response.json({ 
      success: true, 
      url: publicUrl,
      key: key
    })
  } catch (error) {
    console.error('Upload Error:', error)
    return Response.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const key = url.searchParams.get('key')

  if (!key) {
    return Response.json({ error: 'key ist erforderlich' }, { status: 400 })
  }

  try {
    await env.IMAGES.delete(key)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete Error:', error)
    return Response.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }
}
