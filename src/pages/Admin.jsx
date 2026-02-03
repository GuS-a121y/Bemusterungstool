import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Home, FolderOpen, Package,
  Plus, Edit2, Trash2, Eye, Download, Copy, Check, X, Search,
  ChevronRight, ChevronLeft, Upload, Image, ArrowLeft, Save, AlertCircle,
  Users, Settings, FileSpreadsheet
} from 'lucide-react'

// Demo-Daten für lokale Entwicklung
const INITIAL_DATA = {
  projects: [
    { id: 1, name: 'Wohnpark Am See', description: 'Modernes Wohnprojekt mit 24 Einheiten', address: 'Seestraße 15-21, 12345 Musterstadt', status: 'aktiv' },
    { id: 2, name: 'Stadtvillen Mitte', description: 'Exklusive Stadtvillen', address: 'Marktplatz 8-10, 12345 Musterstadt', status: 'aktiv' }
  ],
  apartments: [
    { id: 1, project_id: 1, name: 'Wohnung 1.01', floor: 'EG', size_sqm: 78.5, rooms: 3, customer_name: 'Familie Müller', customer_email: 'mueller@email.de', access_code: 'WPS-A1B2C3', status: 'offen' },
    { id: 2, project_id: 1, name: 'Wohnung 1.02', floor: 'EG', size_sqm: 92.0, rooms: 4, customer_name: 'Herr Schmidt', customer_email: 'schmidt@email.de', access_code: 'WPS-D4E5F6', status: 'offen' },
    { id: 3, project_id: 1, name: 'Wohnung 2.01', floor: '1. OG', size_sqm: 85.0, rooms: 3, customer_name: 'Frau Weber', customer_email: 'weber@email.de', access_code: 'WPS-G7H8I9', status: 'in_bearbeitung' },
    { id: 4, project_id: 1, name: 'Wohnung 2.02', floor: '1. OG', size_sqm: 110.5, rooms: 4, customer_name: 'Familie Becker', customer_email: 'becker@email.de', access_code: 'WPS-J1K2L3', status: 'abgeschlossen' },
    { id: 5, project_id: 2, name: 'Villa A', floor: 'EG-2.OG', size_sqm: 185.0, rooms: 5, customer_name: 'Dr. Hoffmann', customer_email: 'hoffmann@email.de', access_code: 'SVM-M4N5O6', status: 'offen' },
    { id: 6, project_id: 2, name: 'Villa B', floor: 'EG-2.OG', size_sqm: 195.0, rooms: 6, customer_name: 'Familie Fischer', customer_email: 'fischer@email.de', access_code: 'SVM-P7Q8R9', status: 'offen' }
  ],
  categories: [
    { id: 1, project_id: 1, name: 'Bodenbeläge Wohnbereich', description: 'Auswahl des Bodenbelags', sort_order: 1 },
    { id: 2, project_id: 1, name: 'Bodenbeläge Nassbereich', description: 'Fliesen für Bad', sort_order: 2 },
    { id: 3, project_id: 1, name: 'Sanitärobjekte', description: 'Badezimmerausstattung', sort_order: 3 },
    { id: 4, project_id: 1, name: 'Innentüren', description: 'Türdesign', sort_order: 4 },
    { id: 5, project_id: 1, name: 'Elektroausstattung', description: 'Schalter und Steckdosen', sort_order: 5 },
    { id: 6, project_id: 2, name: 'Premium Bodenbeläge', description: 'Exklusive Holzböden', sort_order: 1 },
    { id: 7, project_id: 2, name: 'Badezimmer Deluxe', description: 'Hochwertige Sanitärausstattung', sort_order: 2 }
  ],
  options: [
    { id: 1, category_id: 1, name: 'Eiche Natur', description: 'Parkett Eiche, gebürstet', price: 0, is_default: 1, sort_order: 1 },
    { id: 2, category_id: 1, name: 'Eiche Grau', description: 'Parkett Eiche, grau lasiert', price: 850, is_default: 0, sort_order: 2 },
    { id: 3, category_id: 1, name: 'Nussbaum', description: 'Parkett Nussbaum, matt', price: 1200, is_default: 0, sort_order: 3 },
    { id: 4, category_id: 2, name: 'Feinsteinzeug Weiß', description: 'Großformat 60x60', price: 0, is_default: 1, sort_order: 1 },
    { id: 5, category_id: 2, name: 'Feinsteinzeug Anthrazit', description: 'Großformat 60x60', price: 450, is_default: 0, sort_order: 2 },
    { id: 6, category_id: 3, name: 'Standard Paket', description: 'Wand-WC, Waschtisch 60cm', price: 0, is_default: 1, sort_order: 1 },
    { id: 7, category_id: 3, name: 'Komfort Paket', description: 'Spülrandlos, Waschtisch 80cm', price: 1850, is_default: 0, sort_order: 2 },
    { id: 8, category_id: 3, name: 'Premium Paket', description: 'Walk-In Dusche, Badewanne', price: 4200, is_default: 0, sort_order: 3 },
    { id: 9, category_id: 4, name: 'Weiß lackiert', description: 'Glatte Oberfläche', price: 0, is_default: 1, sort_order: 1 },
    { id: 10, category_id: 4, name: 'Eiche furniert', description: 'Echtholzfurnier', price: 420, is_default: 0, sort_order: 2 },
    { id: 11, category_id: 5, name: 'Standard Weiß', description: 'Reinweiß glänzend', price: 0, is_default: 1, sort_order: 1 },
    { id: 12, category_id: 5, name: 'Aluminium', description: 'Aluminium-Optik', price: 650, is_default: 0, sort_order: 2 }
  ]
}

// Hilfsfunktion: Zufälligen Code generieren
const generateCode = (prefix = 'GS') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = prefix.substring(0, 3).toUpperCase() + '-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    'aktiv': { class: 'badge-success', label: 'Aktiv' },
    'offen': { class: 'badge-info', label: 'Offen' },
    'in_bearbeitung': { class: 'badge-warning', label: 'In Bearbeitung' },
    'abgeschlossen': { class: 'badge-success', label: 'Abgeschlossen' },
    'archiviert': { class: 'badge-neutral', label: 'Archiviert' }
  }
  const { class: className, label } = config[status] || config['offen']
  return <span className={`badge ${className}`}>{label}</span>
}

// Modal
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

// ============================================
// PROJEKT-ÜBERSICHT (Hauptseite)
// ============================================
const ProjectList = ({ data, setData }) => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', address: '' })

  const openCreateModal = () => {
    setEditProject(null)
    setFormData({ name: '', description: '', address: '' })
    setShowModal(true)
  }

  const openEditModal = (e, project) => {
    e.stopPropagation()
    setEditProject(project)
    setFormData({ name: project.name, description: project.description || '', address: project.address || '' })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) return
    if (editProject) {
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === editProject.id ? { ...p, ...formData } : p)
      }))
    } else {
      const newProject = {
        id: Math.max(0, ...data.projects.map(p => p.id)) + 1,
        ...formData,
        status: 'aktiv'
      }
      setData(prev => ({ ...prev, projects: [...prev.projects, newProject] }))
    }
    setShowModal(false)
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirm('Projekt wirklich löschen? Alle Wohnungen, Kategorien und Optionen werden ebenfalls gelöscht.')) {
      setData(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        apartments: prev.apartments.filter(a => a.project_id !== id),
        categories: prev.categories.filter(c => c.project_id !== id),
        options: prev.options.filter(o => {
          const cat = prev.categories.find(c => c.id === o.category_id)
          return cat?.project_id !== id
        })
      }))
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Bemusterung Admin</h1>
        </div>
      </header>

      <div className="admin-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Projekte</h2>
            <p style={{ color: 'var(--gray-500)' }}>Wählen Sie ein Projekt aus oder erstellen Sie ein neues.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            Neues Projekt
          </button>
        </div>

        {/* Projekt-Karten */}
        <div className="project-grid">
          {data.projects.map(project => {
            const apartments = data.apartments.filter(a => a.project_id === project.id)
            const completed = apartments.filter(a => a.status === 'abgeschlossen').length
            const categories = data.categories.filter(c => c.project_id === project.id)

            return (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/admin/projekt/${project.id}`)}
              >
                <div className="project-card-header">
                  <Building2 size={24} />
                  <div className="project-card-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => openEditModal(e, project)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => handleDelete(e, project.id)} style={{ color: 'var(--error)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="project-card-title">{project.name}</h3>
                {project.address && <p className="project-card-address">{project.address}</p>}
                <div className="project-card-stats">
                  <div className="project-card-stat">
                    <Home size={16} />
                    <span>{apartments.length} Wohnungen</span>
                  </div>
                  <div className="project-card-stat">
                    <FolderOpen size={16} />
                    <span>{categories.length} Kategorien</span>
                  </div>
                </div>
                <div className="project-card-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${apartments.length ? (completed / apartments.length) * 100 : 0}%` }} />
                  </div>
                  <span className="progress-text">{completed} von {apartments.length} abgeschlossen</span>
                </div>
                <div className="project-card-footer">
                  <span>Projekt öffnen</span>
                  <ChevronRight size={18} />
                </div>
              </div>
            )
          })}

          {data.projects.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Building2 size={48} style={{ color: 'var(--gray-300)', marginBottom: '1rem' }} />
              <div className="empty-state-title">Keine Projekte vorhanden</div>
              <p>Erstellen Sie Ihr erstes Projekt, um zu beginnen.</p>
              <button className="btn btn-primary mt-4" onClick={openCreateModal}>
                <Plus size={18} />
                Neues Projekt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Projekt bearbeiten' : 'Neues Projekt'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Projektname *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Wohnpark Am See"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kurze Projektbeschreibung..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Straße, PLZ Ort"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name.trim()}>
            <Save size={18} />
            Speichern
          </button>
        </div>
      </Modal>

      <style>{`
        .admin-page {
          min-height: 100vh;
          background: var(--gray-50);
        }
        .admin-header {
          background: var(--gs-black);
          color: white;
          padding: 1rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .admin-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        .project-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          box-shadow: var(--shadow);
          cursor: pointer;
          transition: all var(--transition);
          border: 2px solid transparent;
        }
        .project-card:hover {
          border-color: var(--gs-red);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .project-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          color: var(--gs-red);
        }
        .project-card-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity var(--transition);
        }
        .project-card:hover .project-card-actions {
          opacity: 1;
        }
        .project-card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .project-card-address {
          color: var(--gray-500);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .project-card-stats {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .project-card-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray-600);
        }
        .project-card-progress {
          margin-bottom: 1rem;
        }
        .progress-bar {
          height: 6px;
          background: var(--gray-200);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        .progress-fill {
          height: 100%;
          background: var(--success);
          transition: width var(--transition);
        }
        .progress-text {
          font-size: 0.75rem;
          color: var(--gray-500);
        }
        .project-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-100);
          color: var(--gs-red);
          font-weight: 500;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}

// ============================================
// PROJEKT-DETAIL (Kategorien, Optionen, Wohnungen)
// ============================================
const ProjectDetail = ({ data, setData }) => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('categories')
  const [copiedCode, setCopiedCode] = useState(null)

  const project = data.projects.find(p => p.id === parseInt(projectId))
  const projectCategories = data.categories.filter(c => c.project_id === parseInt(projectId)).sort((a, b) => a.sort_order - b.sort_order)
  const projectApartments = data.apartments.filter(a => a.project_id === parseInt(projectId))

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [showApartmentModal, setShowApartmentModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sort_order: 1 })
  const [optionForm, setOptionForm] = useState({ name: '', description: '', price: '0', is_default: 0, image_url: '' })
  const [apartmentForm, setApartmentForm] = useState({ name: '', floor: '', size_sqm: '', rooms: '', customer_name: '', customer_email: '', access_code: '' })

  if (!project) {
    return (
      <div className="admin-page">
        <div className="admin-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--gray-300)', marginBottom: '1rem' }} />
          <h2>Projekt nicht gefunden</h2>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/admin')}>
            <ArrowLeft size={18} />
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    )
  }

  // Kategorie Funktionen
  const openCategoryModal = (category = null) => {
    setEditItem(category)
    setCategoryForm(category ? {
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order
    } : {
      name: '',
      description: '',
      sort_order: projectCategories.length + 1
    })
    setShowCategoryModal(true)
  }

  const saveCategory = () => {
    if (!categoryForm.name.trim()) return
    if (editItem) {
      setData(prev => ({
        ...prev,
        categories: prev.categories.map(c => c.id === editItem.id ? { ...c, ...categoryForm, sort_order: parseInt(categoryForm.sort_order) } : c)
      }))
    } else {
      const newCategory = {
        id: Math.max(0, ...data.categories.map(c => c.id)) + 1,
        project_id: parseInt(projectId),
        ...categoryForm,
        sort_order: parseInt(categoryForm.sort_order)
      }
      setData(prev => ({ ...prev, categories: [...prev.categories, newCategory] }))
    }
    setShowCategoryModal(false)
  }

  const deleteCategory = (id) => {
    if (confirm('Kategorie und alle Optionen löschen?')) {
      setData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        options: prev.options.filter(o => o.category_id !== id)
      }))
    }
  }

  // Option Funktionen
  const openOptionModal = (categoryId, option = null) => {
    setSelectedCategory(categoryId)
    setEditItem(option)
    const categoryOptions = data.options.filter(o => o.category_id === categoryId)
    setOptionForm(option ? {
      name: option.name,
      description: option.description || '',
      price: option.price.toString(),
      is_default: option.is_default,
      image_url: option.image_url || ''
    } : {
      name: '',
      description: '',
      price: '0',
      is_default: categoryOptions.length === 0 ? 1 : 0,
      image_url: ''
    })
    setShowOptionModal(true)
  }

  const saveOption = () => {
    if (!optionForm.name.trim()) return
    const optionData = {
      ...optionForm,
      price: parseFloat(optionForm.price) || 0,
      is_default: optionForm.is_default ? 1 : 0
    }
    if (editItem) {
      setData(prev => ({
        ...prev,
        options: prev.options.map(o => o.id === editItem.id ? { ...o, ...optionData } : o)
      }))
    } else {
      const categoryOptions = data.options.filter(o => o.category_id === selectedCategory)
      const newOption = {
        id: Math.max(0, ...data.options.map(o => o.id)) + 1,
        category_id: selectedCategory,
        ...optionData,
        sort_order: categoryOptions.length + 1
      }
      setData(prev => ({ ...prev, options: [...prev.options, newOption] }))
    }
    setShowOptionModal(false)
  }

  const deleteOption = (id) => {
    if (confirm('Option löschen?')) {
      setData(prev => ({ ...prev, options: prev.options.filter(o => o.id !== id) }))
    }
  }

  // Wohnung Funktionen
  const openApartmentModal = (apartment = null) => {
    setEditItem(apartment)
    setApartmentForm(apartment ? {
      name: apartment.name,
      floor: apartment.floor || '',
      size_sqm: apartment.size_sqm?.toString() || '',
      rooms: apartment.rooms?.toString() || '',
      customer_name: apartment.customer_name || '',
      customer_email: apartment.customer_email || '',
      access_code: apartment.access_code
    } : {
      name: '',
      floor: '',
      size_sqm: '',
      rooms: '',
      customer_name: '',
      customer_email: '',
      access_code: generateCode(project.name)
    })
    setShowApartmentModal(true)
  }

  const saveApartment = () => {
    if (!apartmentForm.name.trim() || !apartmentForm.customer_name.trim()) return
    const aptData = {
      ...apartmentForm,
      size_sqm: apartmentForm.size_sqm ? parseFloat(apartmentForm.size_sqm) : null,
      rooms: apartmentForm.rooms ? parseInt(apartmentForm.rooms) : null,
      access_code: apartmentForm.access_code.toUpperCase()
    }
    if (editItem) {
      setData(prev => ({
        ...prev,
        apartments: prev.apartments.map(a => a.id === editItem.id ? { ...a, ...aptData } : a)
      }))
    } else {
      const newApartment = {
        id: Math.max(0, ...data.apartments.map(a => a.id)) + 1,
        project_id: parseInt(projectId),
        ...aptData,
        status: 'offen'
      }
      setData(prev => ({ ...prev, apartments: [...prev.apartments, newApartment] }))
    }
    setShowApartmentModal(false)
  }

  const deleteApartment = (id) => {
    if (confirm('Wohnung löschen?')) {
      setData(prev => ({ ...prev, apartments: prev.apartments.filter(a => a.id !== id) }))
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatPrice = (price) => {
    if (price === 0) return <span style={{ color: 'var(--success)' }}>Inklusive</span>
    if (price > 0) return <span style={{ color: 'var(--gs-red)' }}>+{price.toLocaleString('de-DE')} €</span>
    return <span style={{ color: 'var(--info)' }}>{price.toLocaleString('de-DE')} €</span>
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <button className="btn btn-ghost" onClick={() => navigate('/admin')} style={{ color: 'white', marginRight: '1rem' }}>
            <ArrowLeft size={20} />
          </button>
          <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 36 }} />
          <div style={{ marginLeft: '1rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Projekt</div>
            <div style={{ fontWeight: 600 }}>{project.name}</div>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            <FolderOpen size={18} />
            Kategorien & Optionen
          </button>
          <button className={`tab ${activeTab === 'apartments' ? 'active' : ''}`} onClick={() => setActiveTab('apartments')}>
            <Users size={18} />
            Wohnungen & Kunden
          </button>
        </div>

        {/* KATEGORIEN TAB */}
        {activeTab === 'categories' && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h3>Bemusterungskategorien</h3>
                <p>Definieren Sie die Kategorien und deren Optionen für dieses Projekt.</p>
              </div>
              <button className="btn btn-primary" onClick={() => openCategoryModal()}>
                <Plus size={18} />
                Neue Kategorie
              </button>
            </div>

            {projectCategories.length === 0 ? (
              <div className="empty-state">
                <FolderOpen size={48} style={{ color: 'var(--gray-300)' }} />
                <div className="empty-state-title">Keine Kategorien</div>
                <p>Erstellen Sie Kategorien wie "Bodenbeläge", "Sanitär", etc.</p>
              </div>
            ) : (
              <div className="categories-list">
                {projectCategories.map(category => {
                  const categoryOptions = data.options.filter(o => o.category_id === category.id).sort((a, b) => a.sort_order - b.sort_order)
                  return (
                    <div key={category.id} className="category-card">
                      <div className="category-header">
                        <div>
                          <span className="category-order">{category.sort_order}</span>
                          <h4>{category.name}</h4>
                          {category.description && <p>{category.description}</p>}
                        </div>
                        <div className="category-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => openOptionModal(category.id)}>
                            <Plus size={16} />
                            Option
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openCategoryModal(category)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteCategory(category.id)} style={{ color: 'var(--error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {categoryOptions.length > 0 && (
                        <div className="options-table">
                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: 60 }}>Bild</th>
                                <th>Option</th>
                                <th>Preis</th>
                                <th style={{ width: 80 }}>Standard</th>
                                <th style={{ width: 100 }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryOptions.map(option => (
                                <tr key={option.id}>
                                  <td>
                                    {option.image_url ? (
                                      <img src={option.image_url} alt="" style={{ width: 50, height: 38, objectFit: 'cover', borderRadius: 4 }} />
                                    ) : (
                                      <div style={{ width: 50, height: 38, background: 'var(--gray-100)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image size={16} color="var(--gray-300)" />
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 500 }}>{option.name}</div>
                                    {option.description && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{option.description}</div>}
                                  </td>
                                  <td>{formatPrice(option.price)}</td>
                                  <td>{option.is_default ? <Check size={18} color="var(--success)" /> : null}</td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openOptionModal(category.id, option)}>
                                        <Edit2 size={14} />
                                      </button>
                                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteOption(option.id)} style={{ color: 'var(--error)' }}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {categoryOptions.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                          Noch keine Optionen. Klicken Sie auf "+ Option" um Auswahlmöglichkeiten hinzuzufügen.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* WOHNUNGEN TAB */}
        {activeTab === 'apartments' && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h3>Wohnungen & Kunden</h3>
                <p>Legen Sie Wohnungen an und generieren Sie Zugangscodes für die Kunden.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-outline" onClick={() => window.open(`/api/export?project_id=${projectId}`)}>
                  <FileSpreadsheet size={18} />
                  Excel-Export
                </button>
                <button className="btn btn-primary" onClick={() => openApartmentModal()}>
                  <Plus size={18} />
                  Neue Wohnung
                </button>
              </div>
            </div>

            {projectApartments.length === 0 ? (
              <div className="empty-state">
                <Home size={48} style={{ color: 'var(--gray-300)' }} />
                <div className="empty-state-title">Keine Wohnungen</div>
                <p>Legen Sie Wohnungen für dieses Projekt an.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Wohnung</th>
                      <th>Kunde</th>
                      <th>Zugangscode</th>
                      <th>Status</th>
                      <th style={{ width: 140 }}>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectApartments.map(apt => (
                      <tr key={apt.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{apt.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                            {[apt.floor, apt.size_sqm && `${apt.size_sqm} m²`, apt.rooms && `${apt.rooms} Zi.`].filter(Boolean).join(' · ')}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{apt.customer_name}</div>
                          {apt.customer_email && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{apt.customer_email}</div>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code className="access-code">{apt.access_code}</code>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => copyCode(apt.access_code)} title="Kopieren">
                              {copiedCode === apt.access_code ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td><StatusBadge status={apt.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.open(`/kunde/${apt.access_code}`, '_blank')} title="Vorschau">
                              <Eye size={16} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openApartmentModal(apt)} title="Bearbeiten">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteApartment(apt.id)} style={{ color: 'var(--error)' }} title="Löschen">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KATEGORIE MODAL */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editItem ? 'Kategorie bearbeiten' : 'Neue Kategorie'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" className="form-input" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="z.B. Bodenbeläge Wohnbereich" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-textarea" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Kurze Beschreibung für den Kunden..." />
          </div>
          <div className="form-group">
            <label className="form-label">Reihenfolge</label>
            <input type="number" className="form-input" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} min="1" style={{ width: 100 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={saveCategory} disabled={!categoryForm.name.trim()}><Save size={18} /> Speichern</button>
        </div>
      </Modal>

      {/* OPTION MODAL */}
      <Modal isOpen={showOptionModal} onClose={() => setShowOptionModal(false)} title={editItem ? 'Option bearbeiten' : 'Neue Option'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" className="form-input" value={optionForm.name} onChange={e => setOptionForm({ ...optionForm, name: e.target.value })} placeholder="z.B. Eiche Natur" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-textarea" value={optionForm.description} onChange={e => setOptionForm({ ...optionForm, description: e.target.value })} placeholder="Details zur Option..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Preis (€)</label>
              <input type="number" className="form-input" value={optionForm.price} onChange={e => setOptionForm({ ...optionForm, price: e.target.value })} step="0.01" />
              <p className="form-hint">0 = Inklusive, positiv = Aufpreis, negativ = Ersparnis</p>
            </div>
            <div className="form-group">
              <label className="form-label">&nbsp;</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={optionForm.is_default === 1} onChange={e => setOptionForm({ ...optionForm, is_default: e.target.checked ? 1 : 0 })} style={{ width: 18, height: 18 }} />
                <span>Als Standard vorauswählen</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bild-URL</label>
            <input type="text" className="form-input" value={optionForm.image_url} onChange={e => setOptionForm({ ...optionForm, image_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowOptionModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={saveOption} disabled={!optionForm.name.trim()}><Save size={18} /> Speichern</button>
        </div>
      </Modal>

      {/* WOHNUNG MODAL */}
      <Modal isOpen={showApartmentModal} onClose={() => setShowApartmentModal(false)} title={editItem ? 'Wohnung bearbeiten' : 'Neue Wohnung'} size="modal-lg">
        <div className="modal-body">
          <h4 style={{ marginBottom: '1rem', color: 'var(--gray-500)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wohnungsdaten</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Bezeichnung *</label>
              <input type="text" className="form-input" value={apartmentForm.name} onChange={e => setApartmentForm({ ...apartmentForm, name: e.target.value })} placeholder="z.B. Wohnung 1.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Etage</label>
              <input type="text" className="form-input" value={apartmentForm.floor} onChange={e => setApartmentForm({ ...apartmentForm, floor: e.target.value })} placeholder="z.B. 1. OG" />
            </div>
            <div className="form-group">
              <label className="form-label">Größe (m²)</label>
              <input type="number" className="form-input" value={apartmentForm.size_sqm} onChange={e => setApartmentForm({ ...apartmentForm, size_sqm: e.target.value })} step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Zimmer</label>
              <input type="number" className="form-input" value={apartmentForm.rooms} onChange={e => setApartmentForm({ ...apartmentForm, rooms: e.target.value })} />
            </div>
          </div>

          <div className="gs-accent-line" style={{ margin: '1.5rem 0' }} />

          <h4 style={{ marginBottom: '1rem', color: 'var(--gray-500)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kundendaten</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kundenname *</label>
              <input type="text" className="form-input" value={apartmentForm.customer_name} onChange={e => setApartmentForm({ ...apartmentForm, customer_name: e.target.value })} placeholder="z.B. Familie Müller" />
            </div>
            <div className="form-group">
              <label className="form-label">E-Mail</label>
              <input type="email" className="form-input" value={apartmentForm.customer_email} onChange={e => setApartmentForm({ ...apartmentForm, customer_email: e.target.value })} placeholder="kunde@email.de" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Zugangscode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="form-input" value={apartmentForm.access_code} onChange={e => setApartmentForm({ ...apartmentForm, access_code: e.target.value.toUpperCase() })} style={{ fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.05em', flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setApartmentForm({ ...apartmentForm, access_code: generateCode(project.name) })}>
                Neu generieren
              </button>
            </div>
            <p className="form-hint">Diesen Code erhält der Kunde für den Zugang zur Bemusterung.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowApartmentModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={saveApartment} disabled={!apartmentForm.name.trim() || !apartmentForm.customer_name.trim()}>
            <Save size={18} /> Speichern
          </button>
        </div>
      </Modal>

      <style>{`
        .tabs {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid var(--gray-200);
          margin-bottom: 2rem;
        }
        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--gray-500);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all var(--transition-fast);
        }
        .tab:hover {
          color: var(--gray-700);
        }
        .tab.active {
          color: var(--gs-red);
          border-bottom-color: var(--gs-red);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .section-header h3 {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }
        .section-header p {
          color: var(--gray-500);
          font-size: 0.9375rem;
        }
        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .category-card {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem 1.5rem;
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-200);
        }
        .category-header h4 {
          display: inline;
          font-size: 1rem;
          margin: 0;
        }
        .category-header p {
          color: var(--gray-500);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        .category-order {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--gs-red);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 50%;
          margin-right: 0.75rem;
        }
        .category-actions {
          display: flex;
          gap: 0.5rem;
        }
        .options-table {
          padding: 0;
        }
        .options-table table {
          margin: 0;
        }
        .options-table th {
          background: white;
        }
        .access-code {
          font-size: 0.875rem !important;
          padding: 0.375rem 0.75rem !important;
        }
      `}</style>
    </div>
  )
}

// ============================================
// HAUPT-ADMIN-KOMPONENTE
// ============================================
function Admin() {
  const [data, setData] = useState(INITIAL_DATA)

  return (
    <Routes>
      <Route path="/" element={<ProjectList data={data} setData={setData} />} />
      <Route path="/projekt/:projectId" element={<ProjectDetail data={data} setData={setData} />} />
    </Routes>
  )
}

export default Admin
