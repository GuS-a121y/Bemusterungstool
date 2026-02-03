import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, getStatusColor, getStatusLabel } from '../lib/api'
import type { Project, DashboardStats } from '../lib/types'
import { 
  Plus, 
  FolderKanban, 
  Building2, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Search
} from 'lucide-react'

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsData, statsData] = await Promise.all([
        api.getProjects(),
        api.getDashboardStats()
      ])
      setProjects(projectsData)
      setStats(statsData)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gs-gray-900">Projekte</h1>
          <p className="text-gs-gray-600 mt-1">Verwalten Sie Ihre Bauprojekte und Bemusterungen</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neues Projekt
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gs-gray-600">Aktive Projekte</p>
                <p className="text-xl font-bold text-gs-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gs-gray-600">Wohnungen</p>
                <p className="text-xl font-bold text-gs-gray-900">{stats.totalApartments}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gs-gray-600">Abgeschlossen</p>
                <p className="text-xl font-bold text-gs-gray-900">{stats.completedBemusterungen}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gs-red/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gs-red" />
              </div>
              <div>
                <p className="text-sm text-gs-gray-600">Gesamt-Mehrkosten</p>
                <p className="text-xl font-bold text-gs-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gs-gray-400" />
        <input
          type="text"
          placeholder="Projekt suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Project List */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="card p-8 text-center">
            <FolderKanban className="w-12 h-12 text-gs-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gs-gray-900 mb-1">Keine Projekte gefunden</h3>
            <p className="text-sm text-gs-gray-600">
              {search ? 'Versuchen Sie eine andere Suche' : 'Erstellen Sie Ihr erstes Projekt'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/admin/projects/${project.id}`}
              className="card-hover p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-gs-gray-100 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-6 h-6 text-gs-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gs-gray-900 truncate">{project.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gs-gray-600 truncate">{project.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gs-gray-500">
                  {project.startDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.startDate)}
                      {project.endDate && ` - ${formatDate(project.endDate)}`}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gs-gray-400 flex-shrink-0" />
            </Link>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <NewProjectModal 
          onClose={() => setShowNewModal(false)} 
          onCreated={loadData}
        />
      )}
    </div>
  )
}

// Modal Component
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createProject({ name, description })
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
        <h2 className="text-lg font-bold text-gs-gray-900 mb-4">Neues Projekt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-1">
              Projektname *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="z.B. Wohnpark Sonnenhügel"
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
              placeholder="Kurze Projektbeschreibung..."
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
