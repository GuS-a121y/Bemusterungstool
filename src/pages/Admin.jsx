import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import {
  Building2, Home, FolderOpen, Plus, Edit2, Trash2, Eye, Copy, Check, X,
  ChevronRight, Image, ArrowLeft, Save, AlertCircle, Users, FileSpreadsheet,
  Lock, LogOut, ImagePlus, Settings2, EyeOff, Loader2, RefreshCw, FileText, Upload
} from 'lucide-react'

// ============================================
// KONFIGURATION
// ============================================
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'bemusterung2024'
}

// ============================================
// API HELPER
// ============================================
const api = {
  async get(endpoint) {
    const res = await fetch(`/api${endpoint}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'API Fehler')
    }
    return res.json()
  },
  async post(endpoint, data) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'API Fehler')
    return json
  },
  async put(endpoint, data) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'API Fehler')
    return json
  },
  async delete(endpoint) {
    const res = await fetch(`/api${endpoint}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('API Fehler')
    return res.json()
  }
}

// ============================================
// HILFSFUNKTIONEN
// ============================================
const formatPrice = (price) => {
  if (price === 0) return <span style={{ color: 'var(--gray-600)' }}>Inklusive</span>
  if (price > 0) return <span style={{ fontWeight: 600 }}>+{price.toLocaleString('de-DE')} €</span>
  return <span style={{ fontWeight: 600 }}>{price.toLocaleString('de-DE')} €</span>
}

// ============================================
// KOMPONENTEN
// ============================================
const StatusBadge = ({ status }) => {
  const config = {
    'aktiv': { cls: 'badge-success', label: 'Aktiv' },
    'offen': { cls: 'badge-info', label: 'Offen' },
    'in_bearbeitung': { cls: 'badge-warning', label: 'In Bearbeitung' },
    'abgeschlossen': { cls: 'badge-success', label: 'Abgeschlossen' },
  }
  const { cls, label } = config[status] || config['offen']
  return <span className={`badge ${cls}`}>{label}</span>
}

const Modal = ({ isOpen, onClose, title, children, size = '' }) => {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const ImageUpload = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const fileRef = useRef(null)

  useEffect(() => { setPreview(value || '') }, [value])

  const handleFile = async (file) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Nur JPG, PNG, WebP, GIF erlaubt'); return
    }
    if (file.size > 5 * 1024 * 1024) { alert('Max. 5 MB'); return }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      setPreview(e.target.result)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          onChange(data.url)
        } else {
          onChange(e.target.result)
        }
      } catch {
        onChange(e.target.result)
      }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
          <img src={preview} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button type="button" className="btn btn-sm btn-outline" style={{ background: 'white' }} onClick={() => fileRef.current?.click()}>Ändern</button>
            <button type="button" className="btn btn-sm btn-ghost" style={{ background: 'white', color: 'var(--error)' }} onClick={() => { setPreview(''); onChange('') }}><Trash2 size={16} /></button>
          </div>
        </div>
      ) : (
        <div
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed var(--gray-300)', borderRadius: 8, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--gray-500)', background: isDragging ? 'rgba(227,6,19,0.05)' : 'var(--gray-50)' }}
        >
          {uploading ? <Loader2 className="animate-spin" size={24} /> : <ImagePlus size={28} />}
          <span style={{ fontSize: '0.875rem' }}>{uploading ? 'Hochladen...' : 'Bild hinzufügen'}</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// LOGIN
// ============================================
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('adminAuth', 'true')
      onLogin()
    } else {
      setError('Ungültige Zugangsdaten')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', padding: '2rem' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gs-red)' }} />
      <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 50, marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '1.5rem' }}>Admin-Bereich</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Benutzername</label><input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} autoFocus /></div>
          <div className="form-group"><label className="form-label">Passwort</label><input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} /></div>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}><AlertCircle size={16} />{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={!username || !password}><Lock size={18} /> Anmelden</button>
        </form>
      </div>
    </div>
  )
}

// ============================================
// PROJEKT-LISTE
// ============================================
const ProjectList = ({ onLogout }) => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', address: '' })
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [projRes, aptRes] = await Promise.all([api.get('/projects'), api.get('/apartments')])
      setProjects(projRes.projects || [])
      setApartments(aptRes.apartments || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openModal = (project = null) => {
    setEditProject(project)
    setFormData(project ? { name: project.name, description: project.description || '', address: project.address || '' } : { name: '', description: '', address: '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      if (editProject) await api.put('/projects', { id: editProject.id, ...formData })
      else await api.post('/projects', formData)
      setShowModal(false)
      loadData()
    } catch (err) { alert(err.message) }
    setSaving(false)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Projekt wirklich löschen?')) return
    try { await api.delete(`/projects?id=${id}`); loadData() } catch { alert('Fehler') }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Bemusterung Admin</h1>
          </div>
          <button className="btn btn-ghost" onClick={onLogout} style={{ color: 'white' }}><LogOut size={18} /> Abmelden</button>
        </div>
      </header>
      <div className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Projekte</h2>
            <p style={{ color: 'var(--gray-500)' }}>Wählen Sie ein Projekt oder erstellen Sie ein neues.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={loadData}><RefreshCw size={18} /></button>
            <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> Neues Projekt</button>
          </div>
        </div>
        <div className="project-grid">
          {projects.map(project => {
            const projectApts = apartments.filter(a => a.project_id === project.id)
            const completed = projectApts.filter(a => a.status === 'abgeschlossen').length
            return (
              <div key={project.id} className="project-card" onClick={() => navigate(`/admin/projekt/${project.id}`)}>
                <div className="project-card-header">
                  <Building2 size={24} />
                  <div className="project-card-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); openModal(project) }}><Edit2 size={16} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => handleDelete(e, project.id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="project-card-title">{project.name}</h3>
                {project.address && <p className="project-card-address">{project.address}</p>}
                <div className="project-card-stats">
                  <div className="project-card-stat"><Home size={16} /><span>{projectApts.length} Wohnungen</span></div>
                </div>
                <div className="project-card-progress">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${projectApts.length ? (completed / projectApts.length) * 100 : 0}%` }} /></div>
                  <span className="progress-text">{completed} von {projectApts.length} abgeschlossen</span>
                </div>
                <div className="project-card-footer"><span>Projekt öffnen</span><ChevronRight size={18} /></div>
              </div>
            )
          })}
          {projects.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Building2 size={48} style={{ color: 'var(--gray-300)', marginBottom: '1rem' }} />
              <div className="empty-state-title">Keine Projekte</div>
              <button className="btn btn-primary mt-4" onClick={() => openModal()}><Plus size={18} /> Neues Projekt</button>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Projekt bearbeiten' : 'Neues Projekt'}>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Name *</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus /></div>
          <div className="form-group"><label className="form-label">Beschreibung</label><textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Adresse</label><input type="text" className="form-input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name.trim() || saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Speichern</button>
        </div>
      </Modal>
      <style>{adminStyles}</style>
    </div>
  )
}

// ============================================
// PROJEKT-DETAIL
// ============================================
const ProjectDetail = ({ onLogout }) => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [categories, setCategories] = useState([])
  const [options, setOptions] = useState([])
  const [apartments, setApartments] = useState([])
  const [activeTab, setActiveTab] = useState('categories')
  const [copiedCode, setCopiedCode] = useState(null)

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [showApartmentModal, setShowApartmentModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showOptionsConfig, setShowOptionsConfig] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedApartment, setSelectedApartment] = useState(null)
  const [hiddenOptions, setHiddenOptions] = useState([])
  const [customOptions, setCustomOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Forms
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sort_order: 1 })
  const [optionForm, setOptionForm] = useState({ name: '', description: '', price: '0', is_default: 0, image_url: '' })
  const [apartmentForm, setApartmentForm] = useState({ name: '', floor: '', size_sqm: '', rooms: '', customer_name: '', customer_email: '' })
  const [customForm, setCustomForm] = useState({ category_id: '', new_category_name: '', use_new_category: false, name: '', description: '', price: '0', image_url: '' })
  const [batchText, setBatchText] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [projRes, catRes, optRes, aptRes] = await Promise.all([
        api.get('/projects'),
        api.get(`/categories?project_id=${projectId}`),
        api.get(`/options?project_id=${projectId}`),
        api.get(`/apartments?project_id=${projectId}`)
      ])
      setProject((projRes.projects || []).find(p => p.id === parseInt(projectId)) || null)
      setCategories(catRes.categories || [])
      setOptions(optRes.options || [])
      setApartments(aptRes.apartments || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [projectId])

  useEffect(() => { loadData() }, [loadData])

  // Kategorie
  const openCategoryModal = (cat = null) => {
    setEditItem(cat)
    setCategoryForm(cat ? { name: cat.name, description: cat.description || '', sort_order: cat.sort_order } : { name: '', description: '', sort_order: categories.length + 1 })
    setShowCategoryModal(true)
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return
    setSaving(true)
    try {
      if (editItem) await api.put('/categories', { id: editItem.id, ...categoryForm, sort_order: parseInt(categoryForm.sort_order) })
      else await api.post('/categories', { project_id: parseInt(projectId), ...categoryForm, sort_order: parseInt(categoryForm.sort_order) })
      setShowCategoryModal(false)
      loadData()
    } catch (err) { alert(err.message) }
    setSaving(false)
  }

  const deleteCategory = async (id) => {
    if (!confirm('Kategorie löschen?')) return
    try { await api.delete(`/categories?id=${id}`); loadData() } catch { alert('Fehler') }
  }

  // Option
  const openOptionModal = (catId, opt = null) => {
    setSelectedCategory(catId)
    setEditItem(opt)
    setOptionForm(opt ? { name: opt.name, description: opt.description || '', price: opt.price.toString(), is_default: opt.is_default, image_url: opt.image_url || '' } : { name: '', description: '', price: '0', is_default: 0, image_url: '' })
    setShowOptionModal(true)
  }

  const saveOption = async () => {
    if (!optionForm.name.trim()) return
    setSaving(true)
    try {
      const data = { ...optionForm, price: parseFloat(optionForm.price) || 0, is_default: optionForm.is_default ? 1 : 0 }
      if (editItem) await api.put('/options', { id: editItem.id, category_id: selectedCategory, ...data })
      else await api.post('/options', { category_id: selectedCategory, ...data })
      setShowOptionModal(false)
      loadData()
    } catch (err) { alert(err.message) }
    setSaving(false)
  }

  const deleteOption = async (id) => {
    if (!confirm('Option löschen?')) return
    try { await api.delete(`/options?id=${id}`); loadData() } catch { alert('Fehler') }
  }

  // Wohnung (Einzeln)
  const openApartmentModal = (apt = null) => {
    setEditItem(apt)
    setError('')
    setApartmentForm(apt ? {
      name: apt.name, floor: apt.floor || '', size_sqm: apt.size_sqm?.toString() || '', rooms: apt.rooms?.toString() || '',
      customer_name: apt.customer_name || '', customer_email: apt.customer_email || ''
    } : { name: '', floor: '', size_sqm: '', rooms: '', customer_name: '', customer_email: '' })
    setShowApartmentModal(true)
  }

  const saveApartment = async () => {
    if (!apartmentForm.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const data = {
        ...apartmentForm,
        project_id: parseInt(projectId),
        size_sqm: apartmentForm.size_sqm ? parseFloat(apartmentForm.size_sqm) : null,
        rooms: apartmentForm.rooms ? parseInt(apartmentForm.rooms) : null
      }
      if (editItem) await api.put('/apartments', { id: editItem.id, ...data })
      else await api.post('/apartments', data)
      setShowApartmentModal(false)
      loadData()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  const deleteApartment = async (id) => {
    if (!confirm('Wohnung löschen?')) return
    try { await api.delete(`/apartments?id=${id}`); loadData() } catch { alert('Fehler') }
  }

  // Batch-Erstellung
  const openBatchModal = () => {
    setBatchText('')
    setError('')
    setShowBatchModal(true)
  }

  const saveBatch = async () => {
    const lines = batchText.split('\n').filter(l => l.trim())
    if (lines.length === 0) return

    const aptList = lines.map(line => {
      const parts = line.split(';').map(p => p.trim())
      return {
        name: parts[0] || '',
        floor: parts[1] || '',
        size_sqm: parts[2] || '',
        rooms: parts[3] || '',
        customer_name: parts[4] || '',
        customer_email: parts[5] || ''
      }
    }).filter(a => a.name)

    if (aptList.length === 0) { setError('Keine gültigen Wohnungen gefunden'); return }

    setSaving(true)
    setError('')
    try {
      const result = await api.post('/apartments', {
        batch: true,
        project_id: parseInt(projectId),
        apartments: aptList
      })
      
      if (result.errors?.length > 0) {
        setError(`${result.created.length} erstellt, ${result.errors.length} Fehler: ${result.errors.map(e => e.name + ' (' + e.error + ')').join(', ')}`)
      } else {
        setShowBatchModal(false)
      }
      loadData()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000) }

  // Options-Konfiguration
  const openOptionsConfig = async (apt) => {
    setSelectedApartment(apt)
    try {
      const res = await api.get(`/apartment-options?apartment_id=${apt.id}`)
      setHiddenOptions(res.hidden_option_ids || [])
      setCustomOptions(res.custom_options || [])
    } catch { setHiddenOptions([]); setCustomOptions([]) }
    setShowOptionsConfig(true)
  }

  const toggleHidden = async (optionId) => {
    const isHidden = hiddenOptions.includes(optionId)
    try {
      await api.post('/apartment-options', {
        action: isHidden ? 'unhide' : 'hide',
        apartment_id: selectedApartment.id,
        option_id: optionId
      })
      setHiddenOptions(prev => isHidden ? prev.filter(id => id !== optionId) : [...prev, optionId])
    } catch { alert('Fehler') }
  }

  const openCustomModal = () => {
    setCustomForm({ 
      category_id: categories[0]?.id?.toString() || '', 
      new_category_name: '',
      use_new_category: false,
      name: '', 
      description: '', 
      price: '0', 
      image_url: '' 
    })
    setError('')
    setShowCustomModal(true)
  }

  const saveCustomOption = async () => {
    if (!customForm.name.trim()) return
    
    // Prüfen ob Kategorie gewählt oder neue eingegeben
    const useNewCat = customForm.use_new_category
    if (useNewCat && !customForm.new_category_name.trim()) {
      setError('Bitte Kategoriename eingeben')
      return
    }
    if (!useNewCat && !customForm.category_id) {
      setError('Bitte Kategorie auswählen')
      return
    }

    setSaving(true)
    setError('')
    
    try {
      let categoryId = parseInt(customForm.category_id)
      
      // Wenn neue Kategorie gewünscht, erst erstellen
      if (useNewCat) {
        const catResult = await api.post('/categories', {
          project_id: parseInt(projectId),
          name: customForm.new_category_name.trim(),
          description: '',
          sort_order: categories.length + 1
        })
        categoryId = catResult.id
        // Kategorien neu laden
        const catRes = await api.get(`/categories?project_id=${projectId}`)
        setCategories(catRes.categories || [])
      }
      
      // Individuelle Option erstellen
      const res = await api.post('/apartment-options', {
        action: 'add_custom',
        apartment_id: selectedApartment.id,
        category_id: categoryId,
        name: customForm.name.trim(),
        description: customForm.description,
        price: parseFloat(customForm.price) || 0,
        image_url: customForm.image_url || null
      })
      
      setCustomOptions(prev => [...prev, res.option])
      setShowCustomModal(false)
      loadData() // Reload um neue Kategorie anzuzeigen
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  const deleteCustomOption = async (id) => {
    try {
      await api.post('/apartment-options', { action: 'delete_custom', id })
      setCustomOptions(prev => prev.filter(o => o.id !== id))
    } catch { alert('Fehler') }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>
  if (!project) return <div className="admin-page"><div className="admin-content" style={{ textAlign: 'center', paddingTop: '4rem' }}><AlertCircle size={48} style={{ color: 'var(--gray-300)' }} /><h2>Projekt nicht gefunden</h2><button className="btn btn-primary mt-4" onClick={() => navigate('/admin')}><ArrowLeft size={18} /> Zurück</button></div></div>

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="back-button" onClick={() => navigate('/admin')}><ArrowLeft size={20} /><span>Zurück</span></button>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
            <img src="/logo.jpg" alt="" style={{ height: 36 }} />
            <div><div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase' }}>Projekt</div><div style={{ fontWeight: 600 }}>{project.name}</div></div>
          </div>
          <button className="btn btn-ghost" onClick={onLogout} style={{ color: 'white' }}><LogOut size={18} /> Abmelden</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="tabs">
          <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}><FolderOpen size={18} /> Kategorien & Optionen</button>
          <button className={`tab ${activeTab === 'apartments' ? 'active' : ''}`} onClick={() => setActiveTab('apartments')}><Users size={18} /> Wohnungen & Kunden</button>
        </div>

        {activeTab === 'categories' && (
          <div>
            <div className="section-header">
              <div><h3>Bemusterungskategorien</h3><p>Standard-Kategorien und Optionen für dieses Projekt.</p></div>
              <button className="btn btn-primary" onClick={() => openCategoryModal()}><Plus size={18} /> Neue Kategorie</button>
            </div>
            {categories.length === 0 ? (
              <div className="empty-state"><FolderOpen size={48} style={{ color: 'var(--gray-300)' }} /><div className="empty-state-title">Keine Kategorien</div></div>
            ) : (
              <div className="categories-list">
                {categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => {
                  const catOptions = options.filter(o => o.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order)
                  return (
                    <div key={cat.id} className="category-card">
                      <div className="category-header">
                        <div><span className="category-order">{cat.sort_order}</span><h4>{cat.name}</h4>{cat.description && <p>{cat.description}</p>}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openOptionModal(cat.id)}><Plus size={16} /> Option</button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openCategoryModal(cat)}><Edit2 size={16} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteCategory(cat.id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      {catOptions.length > 0 ? (
                        <table style={{ margin: 0 }}>
                          <thead><tr><th style={{ width: 70 }}>Bild</th><th>Option</th><th style={{ width: 120 }}>Preis</th><th style={{ width: 80 }}>Standard</th><th style={{ width: 90 }}></th></tr></thead>
                          <tbody>
                            {catOptions.map(opt => (
                              <tr key={opt.id}>
                                <td>{opt.image_url ? <img src={opt.image_url} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: 56, height: 42, background: 'var(--gray-100)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image size={18} color="var(--gray-300)" /></div>}</td>
                                <td><div style={{ fontWeight: 500 }}>{opt.name}</div>{opt.description && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{opt.description}</div>}</td>
                                <td>{formatPrice(opt.price)}</td>
                                <td>{opt.is_default ? <Check size={18} color="var(--success)" /> : null}</td>
                                <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openOptionModal(cat.id, opt)}><Edit2 size={14} /></button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteOption(opt.id)} style={{ color: 'var(--error)' }}><Trash2 size={14} /></button></div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--gray-400)' }}>Noch keine Optionen</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'apartments' && (
          <div>
            <div className="section-header">
              <div><h3>Wohnungen & Kunden</h3><p>Wohnungen anlegen und Optionen konfigurieren.</p></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => window.open(`/api/export?project_id=${projectId}`)}><FileSpreadsheet size={18} /> Export</button>
                <button className="btn btn-outline" onClick={openBatchModal}><Upload size={18} /> Sammelimport</button>
                <button className="btn btn-primary" onClick={() => openApartmentModal()}><Plus size={18} /> Neue Wohnung</button>
              </div>
            </div>
            {apartments.length === 0 ? (
              <div className="empty-state"><Home size={48} style={{ color: 'var(--gray-300)' }} /><div className="empty-state-title">Keine Wohnungen</div></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Wohnung</th><th>Kunde</th><th>Zugangscode</th><th>Status</th><th style={{ width: 200 }}>Aktionen</th></tr></thead>
                  <tbody>
                    {apartments.map(apt => (
                      <tr key={apt.id}>
                        <td><div style={{ fontWeight: 600 }}>{apt.name}</div><div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{[apt.floor, apt.size_sqm && `${apt.size_sqm} m²`, apt.rooms && `${apt.rooms} Zi.`].filter(Boolean).join(' · ')}</div></td>
                        <td><div style={{ fontWeight: 500 }}>{apt.customer_name || '-'}</div>{apt.customer_email && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{apt.customer_email}</div>}</td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><code className="access-code">{apt.access_code}</code><button className="btn btn-ghost btn-icon btn-sm" onClick={() => copyCode(apt.access_code)}>{copiedCode === apt.access_code ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}</button></div></td>
                        <td><StatusBadge status={apt.status} /></td>
                        <td><div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openOptionsConfig(apt)} title="Optionen"><Settings2 size={16} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.open(`/kunde/${apt.access_code}`, '_blank')} title="Vorschau"><Eye size={16} /></button>
                          {apt.status === 'abgeschlossen' && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.open(`/api/pdf?apartment_id=${apt.id}`, '_blank')} title="PDF"><FileText size={16} /></button>}
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openApartmentModal(apt)} title="Bearbeiten"><Edit2 size={16} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteApartment(apt.id)} style={{ color: 'var(--error)' }} title="Löschen"><Trash2 size={16} /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editItem ? 'Kategorie bearbeiten' : 'Neue Kategorie'}>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Name *</label><input type="text" className="form-input" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} autoFocus /></div>
          <div className="form-group"><label className="form-label">Beschreibung</label><textarea className="form-textarea" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Reihenfolge</label><input type="number" className="form-input" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} min="1" style={{ width: 100 }} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>Abbrechen</button><button className="btn btn-primary" onClick={saveCategory} disabled={!categoryForm.name.trim() || saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Speichern</button></div>
      </Modal>

      <Modal isOpen={showOptionModal} onClose={() => setShowOptionModal(false)} title={editItem ? 'Option bearbeiten' : 'Neue Option'} size="modal-lg">
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div className="form-group"><label className="form-label">Name *</label><input type="text" className="form-input" value={optionForm.name} onChange={e => setOptionForm({ ...optionForm, name: e.target.value })} autoFocus /></div>
              <div className="form-group"><label className="form-label">Beschreibung</label><textarea className="form-textarea" value={optionForm.description} onChange={e => setOptionForm({ ...optionForm, description: e.target.value })} style={{ minHeight: 80 }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Preis (€)</label><input type="number" className="form-input" value={optionForm.price} onChange={e => setOptionForm({ ...optionForm, price: e.target.value })} step="0.01" /><p className="form-hint">0 = Inklusive</p></div>
                <div className="form-group"><label className="form-label">&nbsp;</label><label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}><input type="checkbox" checked={optionForm.is_default === 1} onChange={e => setOptionForm({ ...optionForm, is_default: e.target.checked ? 1 : 0 })} style={{ width: 18, height: 18 }} /><span>Standard</span></label></div>
              </div>
            </div>
            <div><div className="form-group"><label className="form-label">Bild</label><ImageUpload value={optionForm.image_url} onChange={url => setOptionForm({ ...optionForm, image_url: url })} /></div></div>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowOptionModal(false)}>Abbrechen</button><button className="btn btn-primary" onClick={saveOption} disabled={!optionForm.name.trim() || saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Speichern</button></div>
      </Modal>

      <Modal isOpen={showApartmentModal} onClose={() => setShowApartmentModal(false)} title={editItem ? 'Wohnung bearbeiten' : 'Neue Wohnung'}>
        <div className="modal-body">
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}><AlertCircle size={16} />{error}</div>}
          <div className="form-group"><label className="form-label">Bezeichnung *</label><input type="text" className="form-input" value={apartmentForm.name} onChange={e => setApartmentForm({ ...apartmentForm, name: e.target.value })} placeholder="z.B. Wohnung 1.01" autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Etage</label><input type="text" className="form-input" value={apartmentForm.floor} onChange={e => setApartmentForm({ ...apartmentForm, floor: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Größe (m²)</label><input type="number" className="form-input" value={apartmentForm.size_sqm} onChange={e => setApartmentForm({ ...apartmentForm, size_sqm: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Zimmer</label><input type="number" className="form-input" value={apartmentForm.rooms} onChange={e => setApartmentForm({ ...apartmentForm, rooms: e.target.value })} /></div>
          </div>
          <div className="gs-accent-line" style={{ margin: '1.5rem 0' }} />
          <div className="form-group"><label className="form-label">Kundenname</label><input type="text" className="form-input" value={apartmentForm.customer_name} onChange={e => setApartmentForm({ ...apartmentForm, customer_name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">E-Mail</label><input type="email" className="form-input" value={apartmentForm.customer_email} onChange={e => setApartmentForm({ ...apartmentForm, customer_email: e.target.value })} /></div>
          {editItem && <div className="form-group"><label className="form-label">Zugangscode</label><input type="text" className="form-input" value={editItem.access_code} disabled style={{ background: 'var(--gray-100)', fontFamily: 'monospace' }} /><p className="form-hint">Der Zugangscode kann nicht geändert werden.</p></div>}
        </div>
        <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowApartmentModal(false)}>Abbrechen</button><button className="btn btn-primary" onClick={saveApartment} disabled={!apartmentForm.name.trim() || saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Speichern</button></div>
      </Modal>

      <Modal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} title="Wohnungen Sammelimport" size="modal-lg">
        <div className="modal-body">
          <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>Geben Sie eine Wohnung pro Zeile ein. Felder mit Semikolon trennen:</p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>Name;Etage;m²;Zimmer;Kundenname;Email</p>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}><AlertCircle size={16} />{error}</div>}
          <textarea 
            className="form-textarea" 
            value={batchText} 
            onChange={e => setBatchText(e.target.value)} 
            placeholder="Wohnung 1.01;EG;78.5;3;Familie Müller;mueller@email.de&#10;Wohnung 1.02;EG;92;4;Herr Schmidt;schmidt@email.de&#10;Wohnung 2.01;1.OG;85;3;Frau Weber;"
            style={{ minHeight: 200, fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
          <p className="form-hint" style={{ marginTop: 8 }}>{batchText.split('\n').filter(l => l.trim()).length} Zeilen erkannt</p>
        </div>
        <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowBatchModal(false)}>Abbrechen</button><button className="btn btn-primary" onClick={saveBatch} disabled={!batchText.trim() || saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} Importieren</button></div>
      </Modal>

      <Modal isOpen={showOptionsConfig} onClose={() => setShowOptionsConfig(false)} title={`Optionen für ${selectedApartment?.name}`} size="modal-lg">
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--gray-500)', margin: 0 }}>Optionen ausblenden oder individuelle hinzufügen.</p>
            <button className="btn btn-primary btn-sm" onClick={openCustomModal}><Plus size={16} /> Individuelle Option</button>
          </div>
          {categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => {
            const catOptions = options.filter(o => o.category_id === cat.id)
            const catCustom = customOptions.filter(o => o.category_id === cat.id)
            if (catOptions.length === 0 && catCustom.length === 0) return null
            return (
              <div key={cat.id} style={{ marginBottom: '1.5rem', background: 'var(--gray-50)', borderRadius: 8, padding: '1rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>{cat.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {catOptions.map(opt => {
                    const hidden = hiddenOptions.includes(opt.id)
                    return (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', background: 'white', borderRadius: 6, border: '1px solid var(--gray-200)', opacity: hidden ? 0.5 : 1 }}>
                        <label style={{ position: 'relative', width: 20, height: 20, cursor: 'pointer' }}>
                          <input type="checkbox" checked={!hidden} onChange={() => toggleHidden(opt.id)} style={{ opacity: 0, position: 'absolute' }} />
                          <span style={{ position: 'absolute', inset: 0, background: hidden ? 'var(--gray-200)' : 'var(--gs-red)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{!hidden && <Check size={14} />}</span>
                        </label>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 500 }}>{opt.name}</span>
                          <span>{formatPrice(opt.price)}</span>
                        </div>
                        {hidden && <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}><EyeOff size={12} /> Ausgeblendet</span>}
                      </div>
                    )
                  })}
                  {catCustom.map(opt => (
                    <div key={`c${opt.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.05)', borderRadius: 6, border: '1px solid var(--info)' }}>
                      {opt.image_url && <img src={opt.image_url} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 4 }} />}
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 500 }}>{opt.name} <span style={{ padding: '2px 8px', background: 'var(--info)', color: 'white', fontSize: '0.6875rem', borderRadius: 9999, marginLeft: 8 }}>Individuell</span></span>
                        <span>{formatPrice(opt.price)}</span>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteCustomOption(opt.id)} style={{ color: 'var(--error)' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="modal-footer"><button className="btn btn-primary" onClick={() => setShowOptionsConfig(false)}>Fertig</button></div>
      </Modal>

      <Modal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} title="Individuelle Option hinzufügen">
        <div className="modal-body">
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}><AlertCircle size={16} />{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Kategorie *</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="catType" checked={!customForm.use_new_category} onChange={() => setCustomForm({ ...customForm, use_new_category: false })} />
                <span>Bestehende Kategorie</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="catType" checked={customForm.use_new_category} onChange={() => setCustomForm({ ...customForm, use_new_category: true })} />
                <span>Neue Kategorie</span>
              </label>
            </div>
            
            {customForm.use_new_category ? (
              <input 
                type="text" 
                className="form-input" 
                value={customForm.new_category_name} 
                onChange={e => setCustomForm({ ...customForm, new_category_name: e.target.value })}
                placeholder="Name der neuen Kategorie"
              />
            ) : (
              <select className="form-input" value={customForm.category_id} onChange={e => setCustomForm({ ...customForm, category_id: e.target.value })}>
                <option value="">-- Kategorie wählen --</option>
                {categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="form-group"><label className="form-label">Optionsname *</label><input type="text" className="form-input" value={customForm.name} onChange={e => setCustomForm({ ...customForm, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Beschreibung</label><textarea className="form-textarea" value={customForm.description} onChange={e => setCustomForm({ ...customForm, description: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Preis (€)</label><input type="number" className="form-input" value={customForm.price} onChange={e => setCustomForm({ ...customForm, price: e.target.value })} step="0.01" /></div>
          <div className="form-group"><label className="form-label">Bild (optional)</label><ImageUpload value={customForm.image_url} onChange={url => setCustomForm({ ...customForm, image_url: url })} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowCustomModal(false)}>Abbrechen</button><button className="btn btn-primary" onClick={saveCustomOption} disabled={!customForm.name.trim() || saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Hinzufügen</button></div>
      </Modal>

      <style>{adminStyles}</style>
    </div>
  )
}

// ============================================
// STYLES
// ============================================
const adminStyles = `
  .admin-page { min-height: 100vh; background: var(--gray-50); }
  .admin-header { background: var(--gs-black); color: white; padding: 1rem 2rem; position: sticky; top: 0; z-index: 100; }
  .admin-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .admin-content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
  .project-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: var(--shadow); cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
  .project-card:hover { border-color: var(--gs-red); box-shadow: var(--shadow-lg); transform: translateY(-2px); }
  .project-card-header { display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--gs-red); }
  .project-card-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
  .project-card:hover .project-card-actions { opacity: 1; }
  .project-card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; }
  .project-card-address { color: var(--gray-500); font-size: 0.875rem; margin-bottom: 1rem; }
  .project-card-stats { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
  .project-card-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--gray-600); }
  .project-card-progress { margin-bottom: 1rem; }
  .progress-bar { height: 6px; background: var(--gray-200); border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem; }
  .progress-fill { height: 100%; background: var(--success); }
  .progress-text { font-size: 0.75rem; color: var(--gray-500); }
  .project-card-footer { display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--gray-100); color: var(--gs-red); font-weight: 500; font-size: 0.875rem; }
  .back-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
  .back-button:hover { background: rgba(255,255,255,0.2); }
  .tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid var(--gray-200); margin-bottom: 2rem; }
  .tab { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.5rem; background: none; border: none; font-size: 0.9375rem; font-weight: 500; color: var(--gray-500); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab:hover { color: var(--gray-700); }
  .tab.active { color: var(--gs-red); border-bottom-color: var(--gs-red); }
  .section-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
  .section-header h3 { font-size: 1.25rem; margin-bottom: 0.25rem; }
  .section-header p { color: var(--gray-500); }
  .categories-list { display: flex; flex-direction: column; gap: 1.5rem; }
  .category-card { background: white; border-radius: 8px; box-shadow: var(--shadow); overflow: hidden; }
  .category-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; background: var(--gray-50); border-bottom: 1px solid var(--gray-200); }
  .category-header h4 { display: inline; font-size: 1rem; margin: 0; }
  .category-header p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
  .category-order { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: var(--gs-red); color: white; font-size: 0.75rem; font-weight: 600; border-radius: 50%; margin-right: 0.75rem; }
  .access-code { font-size: 0.875rem !important; padding: 0.375rem 0.75rem !important; }
  .animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`

// ============================================
// HAUPTKOMPONENTE
// ============================================
function Admin() {
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('adminAuth') === 'true')
  const handleLogout = () => { sessionStorage.removeItem('adminAuth'); setIsAuth(false) }

  if (!isAuth) return <LoginPage onLogin={() => setIsAuth(true)} />

  return (
    <Routes>
      <Route path="/" element={<ProjectList onLogout={handleLogout} />} />
      <Route path="/projekt/:projectId" element={<ProjectDetail onLogout={handleLogout} />} />
    </Routes>
  )
}

export default Admin
