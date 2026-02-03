import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, formatDate, getStatusColor, getStatusLabel, formatPrice } from '../lib/api'
import type { Project, Apartment, Category, Option } from '../lib/types'
import { 
  ArrowLeft, 
  Plus, 
  Building2, 
  Users,
  Settings,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Package,
  Trash2,
  Edit2
} from 'lucide-react'

type Tab = 'apartments' | 'categories'

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('apartments')
  const [showNewApartmentModal, setShowNewApartmentModal] = useState(false)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectData, apartmentsData, categoriesData, optionsData] = await Promise.all([
        api.getProject(projectId!),
        api.getApartments(projectId!),
        api.getCategories(projectId!),
        api.getOptionsByProject(projectId!)
      ])
      setProject(projectData)
      setApartments(apartmentsData)
      setCategories(categoriesData)
      setOptions(optionsData)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyAccessLink = (code: string) => {
    const link = `${window.location.origin}/bemusterung/${code}`
    navigator.clipboard.writeText(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-red"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gs-gray-600">Projekt nicht gefunden</p>
        <Link to="/admin/projects" className="text-gs-red hover:underline mt-2 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link 
          to="/admin/projects" 
          className="p-2 rounded-lg hover:bg-gs-gray-100 transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gs-gray-900">{project.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          {project.description && (
            <p className="text-gs-gray-600">{project.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gs-gray-600">Wohnungen</p>
              <p className="text-xl font-bold text-gs-gray-900">{apartments.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gs-gray-600">Abgeschlossen</p>
              <p className="text-xl font-bold text-gs-gray-900">
                {apartments.filter(a => a.status === 'abgeschlossen').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gs-gray-600">Kategorien</p>
              <p className="text-xl font-bold text-gs-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gs-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('apartments')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'apartments'
                ? 'border-gs-red text-gs-red'
                : 'border-transparent text-gs-gray-600 hover:text-gs-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Wohnungen
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-gs-red text-gs-red'
                : 'border-transparent text-gs-gray-600 hover:text-gs-gray-900'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Kategorien & Optionen
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'apartments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewApartmentModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Wohnung hinzufügen
            </button>
          </div>

          {apartments.length === 0 ? (
            <div className="card p-8 text-center">
              <Building2 className="w-12 h-12 text-gs-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gs-gray-900 mb-1">Keine Wohnungen</h3>
              <p className="text-sm text-gs-gray-600">Fügen Sie die erste Wohnung hinzu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apartments.map((apartment) => (
                <ApartmentRow 
                  key={apartment.id} 
                  apartment={apartment} 
                  projectId={projectId!}
                  onCopyLink={copyAccessLink}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewCategoryModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Kategorie hinzufügen
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="card p-8 text-center">
              <Layers className="w-12 h-12 text-gs-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gs-gray-900 mb-1">Keine Kategorien</h3>
              <p className="text-sm text-gs-gray-600">Erstellen Sie Bemusterungskategorien</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  options={options.filter(o => o.categoryId === category.id)}
                  expanded={expandedCategory === category.id}
                  onToggle={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                  onUpdate={loadData}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showNewApartmentModal && (
        <NewApartmentModal
          projectId={projectId!}
          onClose={() => setShowNewApartmentModal(false)}
          onCreated={loadData}
        />
      )}
      {showNewCategoryModal && (
        <NewCategoryModal
          projectId={projectId!}
          onClose={() => setShowNewCategoryModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  )
}

// Apartment Row
function ApartmentRow({ 
  apartment, 
  projectId, 
  onCopyLink 
}: { 
  apartment: Apartment
  projectId: string
  onCopyLink: (code: string) => void 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCopyLink(apartment.accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Link
      to={`/admin/projects/${projectId}/apartments/${apartment.id}`}
      className="card-hover p-4 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-lg bg-gs-gray-100 flex items-center justify-center flex-shrink-0">
        <Building2 className="w-5 h-5 text-gs-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gs-gray-900">{apartment.number}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apartment.status)}`}>
            {getStatusLabel(apartment.status)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gs-gray-600">
          {apartment.customerName && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {apartment.customerName}
            </span>
          )}
          {apartment.floor && <span>{apartment.floor}</span>}
          {apartment.size && <span>{apartment.size} m²</span>}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="p-2 rounded-lg hover:bg-gs-gray-100 transition-colors text-gs-gray-500"
        title="Zugangslink kopieren"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
      <ChevronRight className="w-5 h-5 text-gs-gray-400" />
    </Link>
  )
}

// Category Card
function CategoryCard({ 
  category, 
  options, 
  expanded, 
  onToggle,
  onUpdate 
}: { 
  category: Category
  options: Option[]
  expanded: boolean
  onToggle: () => void
  onUpdate: () => void
}) {
  const [showOptionModal, setShowOptionModal] = useState(false)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-gs-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-medium text-gs-gray-900">{category.name}</h3>
          <p className="text-sm text-gs-gray-600">{options.length} Optionen</p>
        </div>
        <ChevronRight className={`w-5 h-5 text-gs-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-gs-gray-200 p-4 bg-gs-gray-50 space-y-3">
          {options.map((option) => (
            <div key={option.id} className="bg-white rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gs-gray-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-gs-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gs-gray-900">{option.name}</span>
                  {option.isDefault && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Standard</span>
                  )}
                </div>
                {option.description && (
                  <p className="text-xs text-gs-gray-600 truncate">{option.description}</p>
                )}
              </div>
              <span className="font-medium text-sm text-gs-gray-900">
                {option.price === 0 ? 'inkl.' : formatPrice(option.price)}
              </span>
            </div>
          ))}
          <button
            onClick={() => setShowOptionModal(true)}
            className="w-full p-2 border-2 border-dashed border-gs-gray-300 rounded-lg text-sm text-gs-gray-600 hover:border-gs-gray-400 hover:text-gs-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Option hinzufügen
          </button>
        </div>
      )}

      {showOptionModal && (
        <NewOptionModal
          categoryId={category.id}
          onClose={() => setShowOptionModal(false)}
          onCreated={() => {
            setShowOptionModal(false)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

// New Apartment Modal
function NewApartmentModal({ 
  projectId, 
  onClose, 
  onCreated 
}: { 
  projectId: string
  onClose: () => void
  onCreated: () => void 
}) {
  const [formData, setFormData] = useState({
    number: '',
    floor: '',
    size: '',
    rooms: '',
    customerName: '',
    customerEmail: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createApartment({
        projectId,
        number: formData.number,
        floor: formData.floor || undefined,
        size: formData.size ? Number(formData.size) : undefined,
        rooms: formData.rooms ? Number(formData.rooms) : undefined,
        customerName: formData.customerName || undefined,
        customerEmail: formData.customerEmail || undefined,
      })
      onCreated()
      onClose()
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gs-gray-900 mb-4">Neue Wohnung</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Wohnungsnummer *
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="input"
              placeholder="z.B. WE 01"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-1">Etage</label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="input"
                placeholder="z.B. 1. OG"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-1">Größe (m²)</label>
              <input
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="input"
                placeholder="85"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">Zimmer</label>
            <input
              type="number"
              value={formData.rooms}
              onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
              className="input"
              placeholder="3"
            />
          </div>
          <hr className="my-4" />
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">Kundenname</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="input"
              placeholder="Familie Müller"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="input"
              placeholder="kunde@beispiel.de"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Erstellen...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// New Category Modal
function NewCategoryModal({ 
  projectId, 
  onClose, 
  onCreated 
}: { 
  projectId: string
  onClose: () => void
  onCreated: () => void 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createCategory({ projectId, name, description })
      onCreated()
      onClose()
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gs-gray-900 mb-4">Neue Kategorie</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="z.B. Bodenbeläge"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Kurze Beschreibung für Kunden..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Erstellen...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// New Option Modal
function NewOptionModal({ 
  categoryId, 
  onClose, 
  onCreated 
}: { 
  categoryId: string
  onClose: () => void
  onCreated: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '0',
    isDefault: false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createOption({
        categoryId,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        isDefault: formData.isDefault
      })
      onCreated()
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gs-gray-900 mb-4">Neue Option</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="z.B. Eiche Natur"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Detailbeschreibung..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Mehrpreis (€)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gs-gray-500 mt-1">0 = im Grundpreis enthalten</p>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-gs-gray-300 text-gs-red focus:ring-gs-red"
            />
            <span className="text-sm text-gs-gray-700">Als Standard vorausgewählt</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Erstellen...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
