import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Home, FolderOpen, Package, Settings,
  Plus, Edit2, Trash2, Eye, Download, Copy, Check, X, Search,
  ChevronRight, Upload, Image, ArrowLeft, Save, AlertCircle
} from 'lucide-react'

// Demo-Daten für lokale Entwicklung (werden durch API ersetzt)
const DEMO_DATA = {
  projects: [
    { id: 1, name: 'Wohnpark Am See', description: 'Modernes Wohnprojekt mit 24 Einheiten', address: 'Seestraße 15-21', status: 'aktiv', apartmentCount: 4, completedCount: 1 },
    { id: 2, name: 'Stadtvillen Mitte', description: 'Exklusive Stadtvillen', address: 'Marktplatz 8-10', status: 'aktiv', apartmentCount: 2, completedCount: 0 }
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
    { id: 5, project_id: 1, name: 'Elektroausstattung', description: 'Schalter und Steckdosen', sort_order: 5 }
  ],
  options: [
    { id: 1, category_id: 1, name: 'Eiche Natur', description: 'Parkett Eiche, gebürstet', price: 0, is_default: 1 },
    { id: 2, category_id: 1, name: 'Eiche Grau', description: 'Parkett Eiche, grau lasiert', price: 850, is_default: 0 },
    { id: 3, category_id: 1, name: 'Nussbaum', description: 'Parkett Nussbaum, matt', price: 1200, is_default: 0 },
    { id: 4, category_id: 2, name: 'Feinsteinzeug Weiß', description: 'Großformat 60x60', price: 0, is_default: 1 },
    { id: 5, category_id: 2, name: 'Feinsteinzeug Anthrazit', description: 'Großformat 60x60', price: 450, is_default: 0 },
    { id: 6, category_id: 3, name: 'Standard Paket', description: 'Wand-WC, Waschtisch 60cm', price: 0, is_default: 1 },
    { id: 7, category_id: 3, name: 'Komfort Paket', description: 'Spülrandlos, Waschtisch 80cm', price: 1850, is_default: 0 },
    { id: 8, category_id: 3, name: 'Premium Paket', description: 'Walk-In Dusche, Badewanne', price: 4200, is_default: 0 }
  ]
}

// Hilfsfunktion: Zufälligen Code generieren
const generateCode = (prefix = 'GS') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix + '-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Status Badge Komponente
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

// Modal Komponente
const Modal = ({ isOpen, onClose, title, children, size = '' }) => {
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Sidebar Komponente
const Sidebar = ({ activeItem, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: Building2, label: 'Projekte' },
    { id: 'apartments', icon: Home, label: 'Wohnungen' },
    { id: 'categories', icon: FolderOpen, label: 'Kategorien' },
    { id: 'options', icon: Package, label: 'Optionen' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.jpg" alt="G&S Gruppe" className="sidebar-logo" />
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Bemusterungstool v1.0</div>
      </div>
    </aside>
  )
}

// Dashboard Übersicht
const Dashboard = ({ data }) => {
  const stats = {
    totalProjects: data.projects.length,
    activeProjects: data.projects.filter(p => p.status === 'aktiv').length,
    totalApartments: data.apartments.length,
    completedApartments: data.apartments.filter(a => a.status === 'abgeschlossen').length,
    inProgressApartments: data.apartments.filter(a => a.status === 'in_bearbeitung').length,
    openApartments: data.apartments.filter(a => a.status === 'offen').length
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Übersicht aller Bemusterungen</p>
      </div>
      <div className="page-content">
        {/* Statistik-Karten */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="stat-card highlight">
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Projekte gesamt</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalApartments}</div>
            <div className="stat-label">Wohnungen gesamt</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedApartments}</div>
            <div className="stat-label">Bemusterungen abgeschlossen</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inProgressApartments}</div>
            <div className="stat-label">In Bearbeitung</div>
          </div>
        </div>

        {/* Letzte Aktivitäten */}
        <div className="card">
          <div className="card-header">
            <h3>Aktuelle Wohnungen</h3>
          </div>
          <div className="table-container" style={{ boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Wohnung</th>
                  <th>Projekt</th>
                  <th>Kunde</th>
                  <th>Zugangscode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.apartments.slice(0, 5).map(apt => {
                  const project = data.projects.find(p => p.id === apt.project_id)
                  return (
                    <tr key={apt.id}>
                      <td style={{ fontWeight: 500 }}>{apt.name}</td>
                      <td>{project?.name}</td>
                      <td>{apt.customer_name}</td>
                      <td><code className="access-code" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem' }}>{apt.access_code}</code></td>
                      <td><StatusBadge status={apt.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

// Projekte Verwaltung
const ProjectsView = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', address: '', status: 'aktiv' })

  const openCreateModal = () => {
    setEditProject(null)
    setFormData({ name: '', description: '', address: '', status: 'aktiv' })
    setShowModal(true)
  }

  const openEditModal = (project) => {
    setEditProject(project)
    setFormData({ name: project.name, description: project.description || '', address: project.address || '', status: project.status })
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
        apartmentCount: 0,
        completedCount: 0
      }
      setData(prev => ({ ...prev, projects: [...prev.projects, newProject] }))
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (confirm('Projekt wirklich löschen? Alle zugehörigen Wohnungen und Kategorien werden ebenfalls gelöscht.')) {
      setData(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        apartments: prev.apartments.filter(a => a.project_id !== id),
        categories: prev.categories.filter(c => c.project_id !== id)
      }))
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Projekte</h1>
          <p className="page-subtitle">Verwalten Sie Ihre Bauprojekte</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Neues Projekt
        </button>
      </div>
      <div className="page-content">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Projektname</th>
                <th>Adresse</th>
                <th>Wohnungen</th>
                <th>Fortschritt</th>
                <th>Status</th>
                <th style={{ width: 120 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map(project => {
                const apartments = data.apartments.filter(a => a.project_id === project.id)
                const completed = apartments.filter(a => a.status === 'abgeschlossen').length
                return (
                  <tr key={project.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{project.name}</div>
                      {project.description && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{project.description}</div>}
                    </td>
                    <td>{project.address || '-'}</td>
                    <td>{apartments.length}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden', maxWidth: 100 }}>
                          <div style={{ width: `${apartments.length ? (completed / apartments.length) * 100 : 0}%`, height: '100%', background: 'var(--success)' }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{completed}/{apartments.length}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={project.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(project)} title="Bearbeiten">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(project.id)} title="Löschen" style={{ color: 'var(--error)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {data.projects.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Building2 className="empty-state-icon" />
                      <div className="empty-state-title">Keine Projekte vorhanden</div>
                      <p>Erstellen Sie Ihr erstes Projekt, um zu beginnen.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="aktiv">Aktiv</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="archiviert">Archiviert</option>
            </select>
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
    </>
  )
}

// Wohnungen Verwaltung
const ApartmentsView = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false)
  const [editApartment, setEditApartment] = useState(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)
  const [formData, setFormData] = useState({
    project_id: '', name: '', floor: '', size_sqm: '', rooms: '',
    customer_name: '', customer_email: '', access_code: '', status: 'offen'
  })

  const filteredApartments = selectedProject
    ? data.apartments.filter(a => a.project_id === parseInt(selectedProject))
    : data.apartments

  const openCreateModal = () => {
    setEditApartment(null)
    setFormData({
      project_id: selectedProject || (data.projects[0]?.id.toString() || ''),
      name: '', floor: '', size_sqm: '', rooms: '',
      customer_name: '', customer_email: '',
      access_code: generateCode(data.projects.find(p => p.id === parseInt(selectedProject))?.name?.substring(0, 3).toUpperCase() || 'GS'),
      status: 'offen'
    })
    setShowModal(true)
  }

  const openEditModal = (apartment) => {
    setEditApartment(apartment)
    setFormData({
      project_id: apartment.project_id.toString(),
      name: apartment.name,
      floor: apartment.floor || '',
      size_sqm: apartment.size_sqm?.toString() || '',
      rooms: apartment.rooms?.toString() || '',
      customer_name: apartment.customer_name || '',
      customer_email: apartment.customer_email || '',
      access_code: apartment.access_code,
      status: apartment.status
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.project_id) return

    const apartmentData = {
      ...formData,
      project_id: parseInt(formData.project_id),
      size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
      rooms: formData.rooms ? parseInt(formData.rooms) : null
    }

    if (editApartment) {
      setData(prev => ({
        ...prev,
        apartments: prev.apartments.map(a => a.id === editApartment.id ? { ...a, ...apartmentData } : a)
      }))
    } else {
      const newApartment = {
        id: Math.max(0, ...data.apartments.map(a => a.id)) + 1,
        ...apartmentData
      }
      setData(prev => ({ ...prev, apartments: [...prev.apartments, newApartment] }))
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (confirm('Wohnung wirklich löschen?')) {
      setData(prev => ({
        ...prev,
        apartments: prev.apartments.filter(a => a.id !== id)
      }))
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Wohnungen</h1>
          <p className="page-subtitle">Verwalten Sie die Wohnungen und Kundenzugänge</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="">Alle Projekte</option>
            {data.projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            Neue Wohnung
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Wohnung</th>
                <th>Projekt</th>
                <th>Kunde</th>
                <th>Zugangscode</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredApartments.map(apt => {
                const project = data.projects.find(p => p.id === apt.project_id)
                return (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        {apt.floor && `${apt.floor} · `}{apt.size_sqm && `${apt.size_sqm} m² · `}{apt.rooms && `${apt.rooms} Zimmer`}
                      </div>
                    </td>
                    <td>{project?.name}</td>
                    <td>
                      <div>{apt.customer_name || '-'}</div>
                      {apt.customer_email && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{apt.customer_email}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code className="access-code" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem' }}>{apt.access_code}</code>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => copyCode(apt.access_code)}
                          title="Code kopieren"
                        >
                          {copiedCode === apt.access_code ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td><StatusBadge status={apt.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.open(`/kunde/${apt.access_code}`, '_blank')} title="Vorschau">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(apt)} title="Bearbeiten">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(apt.id)} title="Löschen" style={{ color: 'var(--error)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredApartments.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Home className="empty-state-icon" />
                      <div className="empty-state-title">Keine Wohnungen vorhanden</div>
                      <p>Erstellen Sie Wohnungen für Ihre Projekte.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editApartment ? 'Wohnung bearbeiten' : 'Neue Wohnung'} size="modal-lg">
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Projekt *</label>
              <select
                className="form-select"
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">Bitte wählen</option>
                {data.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Wohnungsbezeichnung *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Wohnung 1.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Etage</label>
              <input
                type="text"
                className="form-input"
                value={formData.floor}
                onChange={e => setFormData({ ...formData, floor: e.target.value })}
                placeholder="z.B. 1. OG"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Größe (m²)</label>
              <input
                type="number"
                className="form-input"
                value={formData.size_sqm}
                onChange={e => setFormData({ ...formData, size_sqm: e.target.value })}
                placeholder="z.B. 85"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Zimmer</label>
              <input
                type="number"
                className="form-input"
                value={formData.rooms}
                onChange={e => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="z.B. 3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Zugangscode</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={formData.access_code}
                  onChange={e => setFormData({ ...formData, access_code: e.target.value.toUpperCase() })}
                  style={{ fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.05em' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setFormData({ ...formData, access_code: generateCode('GS') })}
                  title="Neuen Code generieren"
                >
                  Neu
                </button>
              </div>
            </div>
          </div>
          <div className="gs-accent-line mt-6 mb-6" />
          <h4 className="mb-4">Kundendaten</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kundenname</label>
              <input
                type="text"
                className="form-input"
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="z.B. Familie Müller"
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-Mail</label>
              <input
                type="email"
                className="form-input"
                value={formData.customer_email}
                onChange={e => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="kunde@email.de"
              />
            </div>
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Status</label>
            <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="offen">Offen</option>
              <option value="in_bearbeitung">In Bearbeitung</option>
              <option value="abgeschlossen">Abgeschlossen</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name.trim() || !formData.project_id}>
            <Save size={18} />
            Speichern
          </button>
        </div>
      </Modal>
    </>
  )
}

// Kategorien Verwaltung
const CategoriesView = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [selectedProject, setSelectedProject] = useState(data.projects[0]?.id.toString() || '')
  const [formData, setFormData] = useState({ project_id: '', name: '', description: '', sort_order: 0 })

  const filteredCategories = data.categories
    .filter(c => c.project_id === parseInt(selectedProject))
    .sort((a, b) => a.sort_order - b.sort_order)

  const openCreateModal = () => {
    setEditCategory(null)
    setFormData({
      project_id: selectedProject,
      name: '',
      description: '',
      sort_order: filteredCategories.length + 1
    })
    setShowModal(true)
  }

  const openEditModal = (category) => {
    setEditCategory(category)
    setFormData({
      project_id: category.project_id.toString(),
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.project_id) return

    const categoryData = {
      ...formData,
      project_id: parseInt(formData.project_id),
      sort_order: parseInt(formData.sort_order) || 0
    }

    if (editCategory) {
      setData(prev => ({
        ...prev,
        categories: prev.categories.map(c => c.id === editCategory.id ? { ...c, ...categoryData } : c)
      }))
    } else {
      const newCategory = {
        id: Math.max(0, ...data.categories.map(c => c.id)) + 1,
        ...categoryData
      }
      setData(prev => ({ ...prev, categories: [...prev.categories, newCategory] }))
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (confirm('Kategorie wirklich löschen? Alle zugehörigen Optionen werden ebenfalls gelöscht.')) {
      setData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        options: prev.options.filter(o => o.category_id !== id)
      }))
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Bemusterungskategorien</h1>
          <p className="page-subtitle">Kategorien für die Ausstattungsauswahl</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{ width: 200 }}
          >
            {data.projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={!selectedProject}>
            <Plus size={18} />
            Neue Kategorie
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Reihenf.</th>
                <th>Kategorie</th>
                <th>Beschreibung</th>
                <th>Optionen</th>
                <th style={{ width: 120 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(cat => {
                const optionCount = data.options.filter(o => o.category_id === cat.id).length
                return (
                  <tr key={cat.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--gray-400)' }}>{cat.sort_order}</td>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{cat.description || '-'}</td>
                    <td>
                      <span className="badge badge-neutral">{optionCount} Optionen</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(cat)} title="Bearbeiten">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(cat.id)} title="Löschen" style={{ color: 'var(--error)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <FolderOpen className="empty-state-icon" />
                      <div className="empty-state-title">Keine Kategorien vorhanden</div>
                      <p>Erstellen Sie Kategorien für dieses Projekt.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Kategoriename *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Bodenbeläge Wohnbereich"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kurze Beschreibung der Kategorie..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Reihenfolge</label>
            <input
              type="number"
              className="form-input"
              value={formData.sort_order}
              onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
              min="1"
            />
            <p className="form-hint">Die Reihenfolge bestimmt die Position im Wizard.</p>
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
    </>
  )
}

// Optionen Verwaltung
const OptionsView = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false)
  const [editOption, setEditOption] = useState(null)
  const [selectedProject, setSelectedProject] = useState(data.projects[0]?.id.toString() || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formData, setFormData] = useState({
    category_id: '', name: '', description: '', price: '0', is_default: 0, image_url: '', sort_order: 0
  })

  const projectCategories = data.categories.filter(c => c.project_id === parseInt(selectedProject))
  const filteredOptions = data.options
    .filter(o => selectedCategory ? o.category_id === parseInt(selectedCategory) : projectCategories.some(c => c.id === o.category_id))
    .sort((a, b) => a.sort_order - b.sort_order)

  const openCreateModal = () => {
    setEditOption(null)
    setFormData({
      category_id: selectedCategory || projectCategories[0]?.id.toString() || '',
      name: '',
      description: '',
      price: '0',
      is_default: 0,
      image_url: '',
      sort_order: filteredOptions.length + 1
    })
    setShowModal(true)
  }

  const openEditModal = (option) => {
    setEditOption(option)
    setFormData({
      category_id: option.category_id.toString(),
      name: option.name,
      description: option.description || '',
      price: option.price.toString(),
      is_default: option.is_default,
      image_url: option.image_url || '',
      sort_order: option.sort_order
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.category_id) return

    const optionData = {
      ...formData,
      category_id: parseInt(formData.category_id),
      price: parseFloat(formData.price) || 0,
      is_default: formData.is_default ? 1 : 0,
      sort_order: parseInt(formData.sort_order) || 0
    }

    if (editOption) {
      setData(prev => ({
        ...prev,
        options: prev.options.map(o => o.id === editOption.id ? { ...o, ...optionData } : o)
      }))
    } else {
      const newOption = {
        id: Math.max(0, ...data.options.map(o => o.id)) + 1,
        ...optionData
      }
      setData(prev => ({ ...prev, options: [...prev.options, newOption] }))
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (confirm('Option wirklich löschen?')) {
      setData(prev => ({
        ...prev,
        options: prev.options.filter(o => o.id !== id)
      }))
    }
  }

  const formatPrice = (price) => {
    if (price === 0) return <span className="text-success">Inklusive</span>
    if (price > 0) return <span className="text-error">+{price.toLocaleString('de-DE')} €</span>
    return <span style={{ color: 'var(--info)' }}>{price.toLocaleString('de-DE')} €</span>
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Ausstattungsoptionen</h1>
          <p className="page-subtitle">Optionen pro Bemusterungskategorie</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedProject}
            onChange={e => {
              setSelectedProject(e.target.value)
              setSelectedCategory('')
            }}
            style={{ width: 180 }}
          >
            {data.projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="">Alle Kategorien</option>
            {projectCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={projectCategories.length === 0}>
            <Plus size={18} />
            Neue Option
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Bild</th>
                <th>Option</th>
                <th>Kategorie</th>
                <th>Preis</th>
                <th>Standard</th>
                <th style={{ width: 120 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map(opt => {
                const category = data.categories.find(c => c.id === opt.category_id)
                return (
                  <tr key={opt.id}>
                    <td>
                      {opt.image_url ? (
                        <img src={opt.image_url} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 60, height: 45, background: 'var(--gray-100)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Image size={20} color="var(--gray-300)" />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{opt.name}</div>
                      {opt.description && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{opt.description}</div>}
                    </td>
                    <td>{category?.name}</td>
                    <td>{formatPrice(opt.price)}</td>
                    <td>
                      {opt.is_default ? (
                        <span className="badge badge-success">Standard</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(opt)} title="Bearbeiten">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(opt.id)} title="Löschen" style={{ color: 'var(--error)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredOptions.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Package className="empty-state-icon" />
                      <div className="empty-state-title">Keine Optionen vorhanden</div>
                      <p>{projectCategories.length === 0 ? 'Erstellen Sie zuerst Kategorien.' : 'Erstellen Sie Optionen für diese Kategorie.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editOption ? 'Option bearbeiten' : 'Neue Option'} size="modal-lg">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Kategorie *</label>
            <select
              className="form-select"
              value={formData.category_id}
              onChange={e => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Bitte wählen</option>
              {projectCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Optionsname *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Eiche Natur"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preis (€)</label>
              <input
                type="number"
                className="form-input"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                step="0.01"
              />
              <p className="form-hint">0 = Inklusive, negativ = Ersparnis</p>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaillierte Beschreibung der Option..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bild-URL</label>
            <input
              type="text"
              className="form-input"
              value={formData.image_url}
              onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="form-hint">URL zum Produktbild (Bilder können nach dem Deployment über Cloudflare R2 hochgeladen werden)</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Reihenfolge</label>
              <input
                type="number"
                className="form-input"
                value={formData.sort_order}
                onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">&nbsp;</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_default === 1}
                  onChange={e => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })}
                  style={{ width: 18, height: 18 }}
                />
                <span>Als Standard markieren</span>
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name.trim() || !formData.category_id}>
            <Save size={18} />
            Speichern
          </button>
        </div>
      </Modal>
    </>
  )
}

// Haupt-Admin-Komponente
function Admin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(DEMO_DATA)
  
  // Aktiven Tab aus URL ermitteln
  const getActiveTab = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '')
    return path || 'dashboard'
  }

  const handleNavigate = (tab) => {
    navigate(tab === 'dashboard' ? '/admin' : `/admin/${tab}`)
  }

  const renderContent = () => {
    const tab = getActiveTab()
    switch (tab) {
      case 'projects':
        return <ProjectsView data={data} setData={setData} />
      case 'apartments':
        return <ApartmentsView data={data} setData={setData} />
      case 'categories':
        return <CategoriesView data={data} setData={setData} />
      case 'options':
        return <OptionsView data={data} setData={setData} />
      default:
        return <Dashboard data={data} />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activeItem={getActiveTab()} onNavigate={handleNavigate} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  )
}

export default Admin
