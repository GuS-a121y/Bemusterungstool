// G+S Bemusterungstool - Cloudflare Workers Backend
// Version 4.0 - Mit D1 Database Support

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve Frontend
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return env.ASSETS.fetch(request);
    }

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await handleAPI(request, env);
        return new Response(response.body, {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Static assets
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Health Check
  if (path === '/api/health') {
    return { body: JSON.stringify({ status: 'ok' }), status: 200 };
  }

  // ==================== PROJECTS ====================
  
  // GET all projects
  if (path === '/api/projects' && method === 'GET') {
    const projects = await env.DB.prepare(
      'SELECT * FROM projects ORDER BY created_at DESC'
    ).all();

    for (let project of projects.results) {
      const categories = await env.DB.prepare(
        'SELECT * FROM categories WHERE project_id = ? ORDER BY id'
      ).bind(project.id).all();

      for (let category of categories.results) {
        const options = await env.DB.prepare(
          'SELECT * FROM options WHERE category_id = ? ORDER BY id'
        ).bind(category.id).all();
        category.options = options.results;
      }
      project.categories = categories.results;
    }

    return { body: JSON.stringify(projects.results), status: 200 };
  }

  // POST create project
  if (path === '/api/projects' && method === 'POST') {
    const data = await request.json();
    const result = await env.DB.prepare(
      'INSERT INTO projects (name, status, start_date, end_date, logo, welcome_image, welcome_text) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      data.name,
      data.status || 'Aktiv',
      data.startDate || null,
      data.endDate || null,
      data.logo || null,
      data.welcomeImage || null,
      data.welcomeText
    ).run();

    return { body: JSON.stringify({ id: result.meta.last_row_id }), status: 200 };
  }

  // PUT update project
  if (path.match(/^\/api\/projects\/\d+$/) && method === 'PUT') {
    const id = path.split('/').pop();
    const data = await request.json();
    
    await env.DB.prepare(
      'UPDATE projects SET name = ?, status = ?, start_date = ?, end_date = ?, logo = ?, welcome_image = ?, welcome_text = ? WHERE id = ?'
    ).bind(
      data.name,
      data.status,
      data.startDate || null,
      data.endDate || null,
      data.logo || null,
      data.welcomeImage || null,
      data.welcomeText,
      id
    ).run();

    return { body: JSON.stringify({ message: 'Updated' }), status: 200 };
  }

  // DELETE project
  if (path.match(/^\/api\/projects\/\d+$/) && method === 'DELETE') {
    const id = path.split('/').pop();
    await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    return { body: JSON.stringify({ message: 'Deleted' }), status: 200 };
  }

  // ==================== CATEGORIES ====================

  // POST create category
  if (path === '/api/categories' && method === 'POST') {
    const data = await request.json();
    const result = await env.DB.prepare(
      'INSERT INTO categories (project_id, name, description) VALUES (?, ?, ?)'
    ).bind(data.projectId, data.name, data.description).run();

    return { body: JSON.stringify({ id: result.meta.last_row_id }), status: 200 };
  }

  // DELETE category
  if (path.match(/^\/api\/categories\/\d+$/) && method === 'DELETE') {
    const id = path.split('/').pop();
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return { body: JSON.stringify({ message: 'Deleted' }), status: 200 };
  }

  // ==================== OPTIONS ====================

  // POST create option
  if (path === '/api/options' && method === 'POST') {
    const data = await request.json();
    const result = await env.DB.prepare(
      'INSERT INTO options (category_id, name, description, price, icon, image) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      data.categoryId,
      data.name,
      data.description,
      data.price,
      data.icon || null,
      data.image || null
    ).run();

    return { body: JSON.stringify({ id: result.meta.last_row_id }), status: 200 };
  }

  // DELETE option
  if (path.match(/^\/api\/options\/\d+$/) && method === 'DELETE') {
    const id = path.split('/').pop();
    await env.DB.prepare('DELETE FROM options WHERE id = ?').bind(id).run();
    return { body: JSON.stringify({ message: 'Deleted' }), status: 200 };
  }

  // ==================== APARTMENTS ====================

  // GET all apartments
  if (path === '/api/apartments' && method === 'GET') {
    const apartments = await env.DB.prepare(
      'SELECT * FROM apartments ORDER BY number'
    ).all();

    for (let apt of apartments.results) {
      apt.hiddenOptions = apt.hidden_options ? JSON.parse(apt.hidden_options) : {};
      apt.customOptions = apt.custom_options ? JSON.parse(apt.custom_options) : {};
    }

    return { body: JSON.stringify(apartments.results), status: 200 };
  }

  // POST create apartment
  if (path === '/api/apartments' && method === 'POST') {
    const data = await request.json();
    const result = await env.DB.prepare(
      'INSERT INTO apartments (project_id, number, floor, size, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.projectId,
      data.number,
      data.floor,
      data.size,
      'Bemusterung offen'
    ).run();

    return { body: JSON.stringify({ id: result.meta.last_row_id }), status: 200 };
  }

  // PUT update apartment
  if (path.match(/^\/api\/apartments\/\d+$/) && method === 'PUT') {
    const id = path.split('/').pop();
    const data = await request.json();
    
    await env.DB.prepare(
      'UPDATE apartments SET status = ?, hidden_options = ?, custom_options = ? WHERE id = ?'
    ).bind(
      data.status,
      JSON.stringify(data.hiddenOptions || {}),
      JSON.stringify(data.customOptions || {}),
      id
    ).run();

    return { body: JSON.stringify({ message: 'Updated' }), status: 200 };
  }

  // DELETE apartment
  if (path.match(/^\/api\/apartments\/\d+$/) && method === 'DELETE') {
    const id = path.split('/').pop();
    await env.DB.prepare('DELETE FROM apartments WHERE id = ?').bind(id).run();
    return { body: JSON.stringify({ message: 'Deleted' }), status: 200 };
  }

  // ==================== CUSTOMER ACCESS ====================

  // GET all customer access
  if (path === '/api/customer-access' && method === 'GET') {
    const access = await env.DB.prepare(
      'SELECT * FROM customer_access ORDER BY created_at DESC'
    ).all();

    return { body: JSON.stringify(access.results), status: 200 };
  }

  // POST create customer access
  if (path === '/api/customer-access' && method === 'POST') {
    const data = await request.json();
    const result = await env.DB.prepare(
      'INSERT INTO customer_access (apartment_id, customer_name, code) VALUES (?, ?, ?)'
    ).bind(data.apartmentId, data.customerName, data.code).run();

    return { body: JSON.stringify({ id: result.meta.last_row_id }), status: 200 };
  }

  // DELETE customer access
  if (path.match(/^\/api\/customer-access\/\d+$/) && method === 'DELETE') {
    const id = path.split('/').pop();
    await env.DB.prepare('DELETE FROM customer_access WHERE id = ?').bind(id).run();
    return { body: JSON.stringify({ message: 'Deleted' }), status: 200 };
  }

  // ==================== SELECTIONS ====================

  // GET all selections
  if (path === '/api/selections' && method === 'GET') {
    const selections = await env.DB.prepare(
      'SELECT * FROM selections ORDER BY completed_at DESC'
    ).all();

    for (let sel of selections.results) {
      sel.choices = JSON.parse(sel.choices);
    }

    return { body: JSON.stringify(selections.results), status: 200 };
  }

  // POST create/update selection
  if (path === '/api/selections' && method === 'POST') {
    const data = await request.json();
    
    const existing = await env.DB.prepare(
      'SELECT id FROM selections WHERE apartment_id = ?'
    ).bind(data.apartmentId).first();

    if (existing) {
      await env.DB.prepare(
        'UPDATE selections SET choices = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE apartment_id = ?'
      ).bind(
        JSON.stringify(data.choices),
        data.status,
        data.apartmentId
      ).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO selections (apartment_id, choices, status) VALUES (?, ?, ?)'
      ).bind(
        data.apartmentId,
        JSON.stringify(data.choices),
        data.status
      ).run();
    }

    const newStatus = data.status === 'Abgeschlossen' ? 'Abgeschlossen' : 'Vorläufig ausgefüllt';
    await env.DB.prepare(
      'UPDATE apartments SET status = ? WHERE id = ?'
    ).bind(newStatus, data.apartmentId).run();

    return { body: JSON.stringify({ message: 'Saved' }), status: 200 };
  }

  // DELETE selection (reset)
  if (path.match(/^\/api\/selections\/\d+$/) && method === 'DELETE') {
    const apartmentId = path.split('/').pop();
    
    await env.DB.prepare(
      'DELETE FROM selections WHERE apartment_id = ?'
    ).bind(apartmentId).run();
    
    await env.DB.prepare(
      'UPDATE apartments SET status = ? WHERE id = ?'
    ).bind('Bemusterung offen', apartmentId).run();

    return { body: JSON.stringify({ message: 'Reset' }), status: 200 };
  }

  // ==================== LOGIN ====================

  // POST customer login
  if (path === '/api/login' && method === 'POST') {
    const data = await request.json();
    
    const access = await env.DB.prepare(
      'SELECT * FROM customer_access WHERE code = ?'
    ).bind(data.code).first();

    if (!access) {
      return { body: JSON.stringify({ error: 'Ungültiger Code' }), status: 401 };
    }

    return { body: JSON.stringify({
      apartmentId: access.apartment_id,
      customerName: access.customer_name
    }), status: 200 };
  }

  return { body: JSON.stringify({ error: 'Not found' }), status: 404 };
}
