// Cloudflare Pages Functions - API Routes
// This file provides the API endpoints that replace the mock data

import type { D1Database } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
}

// Helper to generate UUIDs
function generateId(): string {
  return crypto.randomUUID()
}

// Helper to generate access codes
function generateAccessCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Main API handler
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const method = request.method

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Route handling
    const segments = path.split('/').filter(Boolean)
    
    // Projects
    if (segments[0] === 'projects') {
      if (segments.length === 1) {
        if (method === 'GET') return getProjects(env.DB)
        if (method === 'POST') return createProject(env.DB, await request.json())
      }
      if (segments.length === 2) {
        const id = segments[1]
        if (method === 'GET') return getProject(env.DB, id)
        if (method === 'PUT') return updateProject(env.DB, id, await request.json())
        if (method === 'DELETE') return deleteProject(env.DB, id)
      }
      // Project sub-resources
      if (segments.length === 3) {
        const projectId = segments[1]
        if (segments[2] === 'apartments') {
          if (method === 'GET') return getApartments(env.DB, projectId)
          if (method === 'POST') return createApartment(env.DB, projectId, await request.json())
        }
        if (segments[2] === 'categories') {
          if (method === 'GET') return getCategories(env.DB, projectId)
          if (method === 'POST') return createCategory(env.DB, projectId, await request.json())
        }
        if (segments[2] === 'options') {
          if (method === 'GET') return getOptionsByProject(env.DB, projectId)
        }
      }
    }

    // Apartments
    if (segments[0] === 'apartments') {
      if (segments.length === 2) {
        const id = segments[1]
        if (method === 'GET') return getApartment(env.DB, id)
        if (method === 'PUT') return updateApartment(env.DB, id, await request.json())
      }
      if (segments.length === 3 && segments[2] === 'selections') {
        const apartmentId = segments[1]
        if (method === 'GET') return getSelections(env.DB, apartmentId)
        if (method === 'POST') return saveSelections(env.DB, apartmentId, await request.json())
      }
    }

    // Access by code (for customers)
    if (segments[0] === 'access' && segments.length === 2) {
      if (method === 'GET') return getApartmentByCode(env.DB, segments[1])
    }

    // Categories
    if (segments[0] === 'categories' && segments.length === 2) {
      const id = segments[1]
      if (method === 'PUT') return updateCategory(env.DB, id, await request.json())
      if (method === 'DELETE') return deleteCategory(env.DB, id)
    }

    // Options
    if (segments[0] === 'options') {
      if (segments.length === 1 && method === 'POST') {
        return createOption(env.DB, await request.json())
      }
      if (segments.length === 2) {
        const id = segments[1]
        if (method === 'PUT') return updateOption(env.DB, id, await request.json())
        if (method === 'DELETE') return deleteOption(env.DB, id)
      }
    }

    // Category options
    if (segments[0] === 'categories' && segments.length === 3 && segments[2] === 'options') {
      if (method === 'GET') return getOptions(env.DB, segments[1])
    }

    // Dashboard stats
    if (segments[0] === 'stats' && method === 'GET') {
      return getDashboardStats(env.DB)
    }

    // Auth
    if (segments[0] === 'auth' && segments[1] === 'login' && method === 'POST') {
      return adminLogin(env.DB, await request.json())
    }

    return jsonResponse({ error: 'Not found' }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
}

// Helper to create JSON responses
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

// === API Functions ===

async function getProjects(db: D1Database) {
  const result = await db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  return jsonResponse(result.results)
}

async function getProject(db: D1Database, id: string) {
  const result = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()
  if (!result) return jsonResponse({ error: 'Not found' }, 404)
  return jsonResponse(result)
}

async function createProject(db: D1Database, data: { name: string; description?: string }) {
  const id = generateId()
  await db.prepare(`
    INSERT INTO projects (id, name, description, status) 
    VALUES (?, ?, ?, 'entwurf')
  `).bind(id, data.name, data.description || null).run()
  return getProject(db, id)
}

async function updateProject(db: D1Database, id: string, data: Partial<{ name: string; description: string; status: string }>) {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status) }
  fields.push("updated_at = datetime('now')")
  
  values.push(id)
  await db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return getProject(db, id)
}

async function deleteProject(db: D1Database, id: string) {
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  return jsonResponse({ success: true })
}

async function getApartments(db: D1Database, projectId: string) {
  const result = await db.prepare('SELECT * FROM apartments WHERE project_id = ? ORDER BY number').bind(projectId).all()
  return jsonResponse(result.results)
}

async function getApartment(db: D1Database, id: string) {
  const result = await db.prepare('SELECT * FROM apartments WHERE id = ?').bind(id).first()
  if (!result) return jsonResponse({ error: 'Not found' }, 404)
  return jsonResponse(result)
}

async function getApartmentByCode(db: D1Database, code: string) {
  const result = await db.prepare('SELECT * FROM apartments WHERE access_code = ?').bind(code).first()
  if (!result) return jsonResponse({ error: 'Not found' }, 404)
  return jsonResponse(result)
}

async function createApartment(db: D1Database, projectId: string, data: {
  number: string
  floor?: string
  size?: number
  rooms?: number
  customerName?: string
  customerEmail?: string
}) {
  const id = generateId()
  const accessCode = generateAccessCode()
  await db.prepare(`
    INSERT INTO apartments (id, project_id, number, floor, size, rooms, customer_name, customer_email, access_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, projectId, data.number, 
    data.floor || null, data.size || null, data.rooms || null,
    data.customerName || null, data.customerEmail || null, accessCode
  ).run()
  return getApartment(db, id)
}

async function updateApartment(db: D1Database, id: string, data: Partial<{
  number: string
  floor: string
  size: number
  rooms: number
  customerName: string
  customerEmail: string
  status: string
  completedAt: string
}>) {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.number !== undefined) { fields.push('number = ?'); values.push(data.number) }
  if (data.floor !== undefined) { fields.push('floor = ?'); values.push(data.floor) }
  if (data.size !== undefined) { fields.push('size = ?'); values.push(data.size) }
  if (data.rooms !== undefined) { fields.push('rooms = ?'); values.push(data.rooms) }
  if (data.customerName !== undefined) { fields.push('customer_name = ?'); values.push(data.customerName) }
  if (data.customerEmail !== undefined) { fields.push('customer_email = ?'); values.push(data.customerEmail) }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status) }
  if (data.completedAt !== undefined) { fields.push('completed_at = ?'); values.push(data.completedAt) }
  fields.push("updated_at = datetime('now')")
  
  values.push(id)
  await db.prepare(`UPDATE apartments SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return getApartment(db, id)
}

async function getCategories(db: D1Database, projectId: string) {
  const result = await db.prepare('SELECT * FROM categories WHERE project_id = ? ORDER BY sort_order').bind(projectId).all()
  return jsonResponse(result.results)
}

async function createCategory(db: D1Database, projectId: string, data: { name: string; description?: string }) {
  const id = generateId()
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM categories WHERE project_id = ?').bind(projectId).first<{ count: number }>()
  const sortOrder = (countResult?.count || 0) + 1
  
  await db.prepare(`
    INSERT INTO categories (id, project_id, name, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, projectId, data.name, data.description || null, sortOrder).run()
  
  const result = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first()
  return jsonResponse(result)
}

async function updateCategory(db: D1Database, id: string, data: Partial<{ name: string; description: string; sortOrder: number }>) {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder) }
  
  values.push(id)
  await db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  
  const result = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first()
  return jsonResponse(result)
}

async function deleteCategory(db: D1Database, id: string) {
  await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return jsonResponse({ success: true })
}

async function getOptions(db: D1Database, categoryId: string) {
  const result = await db.prepare('SELECT * FROM options WHERE category_id = ? ORDER BY sort_order').bind(categoryId).all()
  return jsonResponse(result.results)
}

async function getOptionsByProject(db: D1Database, projectId: string) {
  const result = await db.prepare(`
    SELECT o.* FROM options o
    JOIN categories c ON o.category_id = c.id
    WHERE c.project_id = ?
    ORDER BY c.sort_order, o.sort_order
  `).bind(projectId).all()
  return jsonResponse(result.results)
}

async function createOption(db: D1Database, data: {
  categoryId: string
  name: string
  description?: string
  price?: number
  imageUrl?: string
  isDefault?: boolean
}) {
  const id = generateId()
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM options WHERE category_id = ?').bind(data.categoryId).first<{ count: number }>()
  const sortOrder = (countResult?.count || 0) + 1
  
  await db.prepare(`
    INSERT INTO options (id, category_id, name, description, price, image_url, is_default, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.categoryId, data.name, 
    data.description || null, data.price || 0, data.imageUrl || null,
    data.isDefault ? 1 : 0, sortOrder
  ).run()
  
  const result = await db.prepare('SELECT * FROM options WHERE id = ?').bind(id).first()
  return jsonResponse(result)
}

async function updateOption(db: D1Database, id: string, data: Partial<{
  name: string
  description: string
  price: number
  imageUrl: string
  isDefault: boolean
  sortOrder: number
}>) {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price) }
  if (data.imageUrl !== undefined) { fields.push('image_url = ?'); values.push(data.imageUrl) }
  if (data.isDefault !== undefined) { fields.push('is_default = ?'); values.push(data.isDefault ? 1 : 0) }
  if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder) }
  
  values.push(id)
  await db.prepare(`UPDATE options SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  
  const result = await db.prepare('SELECT * FROM options WHERE id = ?').bind(id).first()
  return jsonResponse(result)
}

async function deleteOption(db: D1Database, id: string) {
  await db.prepare('DELETE FROM options WHERE id = ?').bind(id).run()
  return jsonResponse({ success: true })
}

async function getSelections(db: D1Database, apartmentId: string) {
  const result = await db.prepare('SELECT * FROM selections WHERE apartment_id = ?').bind(apartmentId).all()
  return jsonResponse(result.results)
}

async function saveSelections(db: D1Database, apartmentId: string, data: { categoryId: string; optionId: string }[]) {
  // Delete existing selections
  await db.prepare('DELETE FROM selections WHERE apartment_id = ?').bind(apartmentId).run()
  
  // Insert new selections
  for (const sel of data) {
    const id = generateId()
    await db.prepare(`
      INSERT INTO selections (id, apartment_id, category_id, option_id)
      VALUES (?, ?, ?, ?)
    `).bind(id, apartmentId, sel.categoryId, sel.optionId).run()
  }
  
  // Update apartment status
  await db.prepare(`
    UPDATE apartments 
    SET status = 'abgeschlossen', completed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(apartmentId).run()
  
  return jsonResponse({ success: true })
}

async function getDashboardStats(db: D1Database) {
  const projectsResult = await db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "aktiv" THEN 1 ELSE 0 END) as active FROM projects').first<{ total: number; active: number }>()
  const apartmentsResult = await db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "abgeschlossen" THEN 1 ELSE 0 END) as completed FROM apartments').first<{ total: number; completed: number }>()
  
  const revenueResult = await db.prepare(`
    SELECT COALESCE(SUM(o.price), 0) as total
    FROM selections s
    JOIN options o ON s.option_id = o.id
    JOIN apartments a ON s.apartment_id = a.id
    WHERE a.status = 'abgeschlossen'
  `).first<{ total: number }>()
  
  return jsonResponse({
    totalProjects: projectsResult?.total || 0,
    activeProjects: projectsResult?.active || 0,
    totalApartments: apartmentsResult?.total || 0,
    completedBemusterungen: apartmentsResult?.completed || 0,
    pendingBemusterungen: (apartmentsResult?.total || 0) - (apartmentsResult?.completed || 0),
    totalRevenue: revenueResult?.total || 0,
  })
}

async function adminLogin(db: D1Database, data: { email: string; password: string }) {
  // Simple password check (in production, use proper hashing!)
  const user = await db.prepare('SELECT * FROM admin_users WHERE email = ? AND password_hash = ?')
    .bind(data.email, data.password)
    .first<{ id: string; email: string; name: string }>()
  
  if (!user) {
    return jsonResponse({ success: false }, 401)
  }
  
  return jsonResponse({
    success: true,
    user: { id: user.id, email: user.email, name: user.name }
  })
}
