import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, formatDate, formatDateTime, getStatusColor, getStatusLabel, formatPrice } from '../lib/api'
import type { Apartment, Project, Category, Option, Selection } from '../lib/types'
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Mail, 
  Copy, 
  Check, 
  Download,
  ExternalLink,
  Package
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF
  }
}

export default function ApartmentDetail() {
  const { projectId, apartmentId } = useParams<{ projectId: string; apartmentId: string }>()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (projectId && apartmentId) loadData()
  }, [projectId, apartmentId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [apartmentData, projectData, categoriesData, optionsData, selectionsData] = await Promise.all([
        api.getApartment(apartmentId!),
        api.getProject(projectId!),
        api.getCategories(projectId!),
        api.getOptionsByProject(projectId!),
        api.getSelections(apartmentId!)
      ])
      setApartment(apartmentData)
      setProject(projectData)
      setCategories(categoriesData)
      setOptions(optionsData)
      setSelections(selectionsData)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyAccessLink = () => {
    if (!apartment) return
    const link = `${window.location.origin}/bemusterung/${apartment.accessCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getSelectionForCategory = (categoryId: string) => {
    const selection = selections.find(s => s.categoryId === categoryId)
    if (!selection) return null
    return options.find(o => o.id === selection.optionId)
  }

  const calculateTotal = () => {
    return selections.reduce((sum, sel) => {
      const option = options.find(o => o.id === sel.optionId)
      return sum + (option?.price || 0)
    }, 0)
  }

  const generatePDF = () => {
    if (!apartment || !project) return

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(227, 6, 19) // GS Red
    doc.text('GS Gruppe', 20, 25)
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Bemusterungsbestätigung', 20, 35)
    
    // Project & Apartment Info
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Projekt: ${project.name}`, 20, 50)
    doc.text(`Wohnung: ${apartment.number}`, 20, 56)
    if (apartment.customerName) {
      doc.text(`Kunde: ${apartment.customerName}`, 20, 62)
    }
    if (apartment.completedAt) {
      doc.text(`Abgeschlossen am: ${formatDateTime(apartment.completedAt)}`, 20, 68)
    }

    // Table data
    const tableData = categories.map(cat => {
      const selectedOption = getSelectionForCategory(cat.id)
      return [
        cat.name,
        selectedOption?.name || '-',
        selectedOption ? formatPrice(selectedOption.price) : '-'
      ]
    })

    // Add total row
    tableData.push(['', 'Gesamt-Mehrkosten:', formatPrice(calculateTotal())])

    // Draw table
    doc.autoTable({
      startY: 80,
      head: [['Kategorie', 'Gewählte Option', 'Mehrpreis']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40, halign: 'right' }
      }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Erstellt am ${formatDateTime(new Date().toISOString())} | Seite ${i} von ${pageCount}`,
        105,
        290,
        { align: 'center' }
      )
    }

    // Save
    doc.save(`Bemusterung_${project.name}_${apartment.number}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-red"></div>
      </div>
    )
  }

  if (!apartment || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-gs-gray-600">Wohnung nicht gefunden</p>
        <Link to={`/admin/projects/${projectId}`} className="text-gs-red hover:underline mt-2 inline-block">
          Zurück zum Projekt
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link 
          to={`/admin/projects/${projectId}`} 
          className="p-2 rounded-lg hover:bg-gs-gray-100 transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gs-gray-900">{apartment.number}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apartment.status)}`}>
              {getStatusLabel(apartment.status)}
            </span>
          </div>
          <p className="text-gs-gray-600">{project.name}</p>
        </div>
        {apartment.status === 'abgeschlossen' && (
          <button onClick={generatePDF} className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            PDF Export
          </button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apartment Info */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-gs-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Wohnungsdaten
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {apartment.floor && (
              <div>
                <span className="text-gs-gray-500">Etage:</span>
                <span className="ml-2 text-gs-gray-900">{apartment.floor}</span>
              </div>
            )}
            {apartment.size && (
              <div>
                <span className="text-gs-gray-500">Größe:</span>
                <span className="ml-2 text-gs-gray-900">{apartment.size} m²</span>
              </div>
            )}
            {apartment.rooms && (
              <div>
                <span className="text-gs-gray-500">Zimmer:</span>
                <span className="ml-2 text-gs-gray-900">{apartment.rooms}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-gs-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Kundendaten
          </h2>
          {apartment.customerName ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gs-gray-500">Name:</span>
                <span className="ml-2 text-gs-gray-900">{apartment.customerName}</span>
              </div>
              {apartment.customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gs-gray-400" />
                  <a href={`mailto:${apartment.customerEmail}`} className="text-gs-red hover:underline">
                    {apartment.customerEmail}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gs-gray-500">Noch keine Kundendaten hinterlegt</p>
          )}
        </div>
      </div>

      {/* Access Link */}
      <div className="card p-4">
        <h2 className="font-medium text-gs-gray-900 mb-3">Zugangslink für Kunden</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gs-gray-100 rounded-lg px-4 py-2 font-mono text-sm text-gs-gray-700 truncate">
            {window.location.origin}/bemusterung/{apartment.accessCode}
          </div>
          <button onClick={copyAccessLink} className="btn-secondary px-3">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <Link 
            to={`/bemusterung/${apartment.accessCode}`}
            target="_blank"
            className="btn-secondary px-3"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Selections */}
      {apartment.status === 'abgeschlossen' && selections.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gs-gray-200">
            <h2 className="font-medium text-gs-gray-900">Gewählte Ausstattung</h2>
            {apartment.completedAt && (
              <p className="text-sm text-gs-gray-500 mt-1">
                Abgeschlossen am {formatDateTime(apartment.completedAt)}
              </p>
            )}
          </div>
          <div className="divide-y divide-gs-gray-200">
            {categories.map(category => {
              const selectedOption = getSelectionForCategory(category.id)
              if (!selectedOption) return null
              return (
                <div key={category.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gs-gray-500">{category.name}</p>
                    <p className="font-medium text-gs-gray-900">{selectedOption.name}</p>
                    {selectedOption.description && (
                      <p className="text-sm text-gs-gray-600 truncate">{selectedOption.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gs-gray-900">
                      {selectedOption.price === 0 ? 'inkl.' : formatPrice(selectedOption.price)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 bg-gs-gray-50 border-t border-gs-gray-200 flex justify-between items-center">
            <span className="font-medium text-gs-gray-900">Gesamt-Mehrkosten</span>
            <span className="text-xl font-bold text-gs-red">{formatPrice(calculateTotal())}</span>
          </div>
        </div>
      )}

      {/* Status Info */}
      {apartment.status !== 'abgeschlossen' && (
        <div className="card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gs-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gs-gray-400" />
          </div>
          <h3 className="font-medium text-gs-gray-900 mb-1">Bemusterung noch nicht abgeschlossen</h3>
          <p className="text-sm text-gs-gray-600">
            Der Kunde hat den Bemusterungsassistenten noch nicht vollständig durchlaufen.
          </p>
        </div>
      )}
    </div>
  )
}
