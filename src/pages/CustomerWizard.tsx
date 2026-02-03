import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { api, formatPrice } from '../lib/api'
import type { Apartment, Project, Category, Option } from '../lib/types'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Package,
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF
  }
}

type Step = 'selection' | 'review' | 'confirm' | 'complete'

export default function CustomerWizard() {
  const { accessCode } = useParams<{ accessCode: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [step, setStep] = useState<Step>('selection')

  useEffect(() => {
    loadData()
  }, [accessCode])

  const loadData = async () => {
    setLoading(true)
    try {
      const apartmentData = await api.getApartmentByCode(accessCode!)
      if (!apartmentData) {
        navigate(`/bemusterung/${accessCode}`)
        return
      }
      setApartment(apartmentData)
      
      const [projectData, categoriesData, optionsData] = await Promise.all([
        api.getProject(apartmentData.projectId),
        api.getCategories(apartmentData.projectId),
        api.getOptionsByProject(apartmentData.projectId)
      ])
      
      setProject(projectData)
      setCategories(categoriesData)
      setOptions(optionsData)
      
      // Initialize selections with defaults
      const defaultSelections: Record<string, string> = {}
      categoriesData.forEach(cat => {
        const defaultOption = optionsData.find(o => o.categoryId === cat.id && o.isDefault)
        if (defaultOption) {
          defaultSelections[cat.id] = defaultOption.id
        }
      })
      setSelections(defaultSelections)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories[currentCategoryIndex]
  const currentOptions = currentCategory 
    ? options.filter(o => o.categoryId === currentCategory.id)
    : []

  const calculateTotal = () => {
    return Object.values(selections).reduce((sum, optionId) => {
      const option = options.find(o => o.id === optionId)
      return sum + (option?.price || 0)
    }, 0)
  }

  const handleOptionSelect = (optionId: string) => {
    if (!currentCategory) return
    setSelections({ ...selections, [currentCategory.id]: optionId })
  }

  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1)
    } else {
      setStep('review')
    }
  }

  const handleBack = () => {
    if (step === 'review') {
      setStep('selection')
      setCurrentCategoryIndex(categories.length - 1)
    } else if (step === 'confirm') {
      setStep('review')
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (!apartment) return
    setSaving(true)
    try {
      const selectionArray = Object.entries(selections).map(([categoryId, optionId]) => ({
        categoryId,
        optionId
      }))
      await api.saveSelections(apartment.id, selectionArray)
      setStep('complete')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setSaving(false)
    }
  }

  const generatePDF = () => {
    if (!apartment || !project) return

    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.setTextColor(227, 6, 19)
    doc.text('GS Gruppe', 20, 25)
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Bemusterungsbestätigung', 20, 35)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Projekt: ${project.name}`, 20, 50)
    doc.text(`Wohnung: ${apartment.number}`, 20, 56)
    if (apartment.customerName) {
      doc.text(`Kunde: ${apartment.customerName}`, 20, 62)
    }
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 68)

    const tableData = categories.map(cat => {
      const selectedOption = options.find(o => o.id === selections[cat.id])
      return [
        cat.name,
        selectedOption?.name || '-',
        selectedOption ? formatPrice(selectedOption.price) : '-'
      ]
    })

    tableData.push(['', 'Gesamt-Mehrkosten:', formatPrice(calculateTotal())])

    doc.autoTable({
      startY: 80,
      head: [['Kategorie', 'Gewählte Option', 'Mehrpreis']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40, halign: 'right' }
      }
    })

    doc.save(`Bemusterung_${project.name}_${apartment.number}.pdf`)
  }

  const handleFinish = () => {
    logout()
    navigate(`/bemusterung/${accessCode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gs-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-red"></div>
      </div>
    )
  }

  if (!apartment || !project) {
    return null
  }

  // Complete Step
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gs-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gs-gray-900 mb-2">
            Bemusterung abgeschlossen!
          </h1>
          <p className="text-gs-gray-600 mb-6">
            Vielen Dank! Ihre Ausstattungswahl wurde erfolgreich gespeichert.
          </p>
          <div className="bg-gs-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gs-gray-600 mb-2">
              <span className="font-medium">Projekt:</span> {project.name}
            </p>
            <p className="text-sm text-gs-gray-600 mb-2">
              <span className="font-medium">Wohnung:</span> {apartment.number}
            </p>
            <p className="text-sm text-gs-gray-600">
              <span className="font-medium">Mehrkosten:</span> {formatPrice(calculateTotal())}
            </p>
          </div>
          <button onClick={generatePDF} className="btn-primary w-full mb-3">
            <Download className="w-4 h-4 mr-2" />
            PDF herunterladen
          </button>
          <button onClick={handleFinish} className="btn-secondary w-full">
            Fertig
          </button>
        </div>
      </div>
    )
  }

  // Confirm Step
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gs-gray-50">
        <Header project={project} apartment={apartment} total={calculateTotal()} />
        
        <div className="max-w-2xl mx-auto p-4">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gs-gray-900 mb-2">
              Verbindliche Bestätigung
            </h2>
            <p className="text-gs-gray-600 mb-6">
              Mit dem Absenden bestätigen Sie Ihre Auswahl verbindlich. 
              Änderungen sind danach <strong>nicht mehr möglich</strong>.
            </p>
            <div className="bg-gs-gray-50 rounded-lg p-4 mb-6">
              <p className="text-lg font-bold text-gs-gray-900">
                Gesamt-Mehrkosten: {formatPrice(calculateTotal())}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Zurück
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Wird gespeichert...' : 'Verbindlich bestätigen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Review Step
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gs-gray-50 pb-24">
        <Header project={project} apartment={apartment} total={calculateTotal()} />
        
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-xl font-bold text-gs-gray-900 mb-4">
            Ihre Auswahl überprüfen
          </h2>
          
          <div className="space-y-3 mb-6">
            {categories.map((category, index) => {
              const selectedOption = options.find(o => o.id === selections[category.id])
              return (
                <div key={category.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gs-gray-500">{category.name}</p>
                      <p className="font-medium text-gs-gray-900">
                        {selectedOption?.name || 'Nicht ausgewählt'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gs-gray-900">
                        {selectedOption?.price === 0 ? 'inkl.' : formatPrice(selectedOption?.price || 0)}
                      </p>
                      <button
                        onClick={() => {
                          setCurrentCategoryIndex(index)
                          setStep('selection')
                        }}
                        className="text-sm text-gs-red hover:underline"
                      >
                        Ändern
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card p-4 bg-gs-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gs-gray-900">Gesamt-Mehrkosten</span>
              <span className="text-xl font-bold text-gs-red">{formatPrice(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gs-gray-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={handleBack} className="btn-secondary flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </button>
            <button onClick={() => setStep('confirm')} className="btn-primary flex-1">
              Weiter zur Bestätigung
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Selection Step
  return (
    <div className="min-h-screen bg-gs-gray-50 pb-24">
      <Header project={project} apartment={apartment} total={calculateTotal()} />
      
      {/* Progress */}
      <div className="bg-white border-b border-gs-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gs-gray-900">
              {currentCategory?.name}
            </span>
            <span className="text-sm text-gs-gray-500">
              {currentCategoryIndex + 1} von {categories.length}
            </span>
          </div>
          <div className="h-2 bg-gs-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gs-red transition-all duration-300"
              style={{ width: `${((currentCategoryIndex + 1) / categories.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="max-w-2xl mx-auto p-4">
        {currentCategory?.description && (
          <p className="text-gs-gray-600 mb-4">{currentCategory.description}</p>
        )}
        
        <div className="space-y-3">
          {currentOptions.map((option) => {
            const isSelected = selections[currentCategory?.id || ''] === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full card p-4 text-left transition-all ${
                  isSelected 
                    ? 'ring-2 ring-gs-red border-gs-red' 
                    : 'hover:border-gs-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected 
                      ? 'border-gs-red bg-gs-red text-white' 
                      : 'border-gs-gray-300'
                  }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gs-gray-900">{option.name}</p>
                        {option.isDefault && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gs-gray-900 whitespace-nowrap">
                        {option.price === 0 ? 'inkl.' : `+ ${formatPrice(option.price)}`}
                      </p>
                    </div>
                    {option.description && (
                      <p className="text-sm text-gs-gray-600 mt-2">{option.description}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gs-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button 
            onClick={handleBack} 
            disabled={currentCategoryIndex === 0}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück
          </button>
          <button 
            onClick={handleNext}
            disabled={!selections[currentCategory?.id || '']}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {currentCategoryIndex === categories.length - 1 ? 'Zur Übersicht' : 'Weiter'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Header Component
function Header({ 
  project, 
  apartment, 
  total 
}: { 
  project: Project
  apartment: Apartment
  total: number 
}) {
  return (
    <div className="bg-white border-b border-gs-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="GS Gruppe" className="h-8" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gs-gray-900">{project.name}</p>
            <p className="text-xs text-gs-gray-500">{apartment.number}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gs-gray-500">Mehrkosten</p>
          <p className="font-bold text-gs-red">{formatPrice(total)}</p>
        </div>
      </div>
    </div>
  )
}
