import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { api } from '../lib/api'
import type { Apartment, Project } from '../lib/types'
import { Building2, AlertCircle, CheckCircle } from 'lucide-react'

export default function CustomerAccess() {
  const { accessCode } = useParams<{ accessCode: string }>()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (accessCode) loadData()
  }, [accessCode])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const apartmentData = await api.getApartmentByCode(accessCode!)
      if (!apartmentData) {
        setError('Ungültiger Zugangscode. Bitte überprüfen Sie den Link.')
        setLoading(false)
        return
      }
      setApartment(apartmentData)
      
      const projectData = await api.getProject(apartmentData.projectId)
      setProject(projectData)
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (!apartment) return
    login({ 
      id: apartment.id, 
      email: apartment.customerEmail || '', 
      role: 'customer',
      apartmentId: apartment.id 
    })
    navigate(`/bemusterung/${accessCode}/wizard`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gs-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-red"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gs-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gs-gray-900 mb-2">Zugang nicht möglich</h1>
          <p className="text-gs-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!apartment || !project) {
    return null
  }

  // Already completed
  if (apartment.status === 'abgeschlossen') {
    return (
      <div className="min-h-screen bg-gs-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 text-center">
          <img src="/logo.jpg" alt="GS Gruppe" className="h-12 mx-auto mb-6" />
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gs-gray-900 mb-2">Bemusterung abgeschlossen</h1>
          <p className="text-gs-gray-600 mb-4">
            Die Bemusterung für Ihre Wohnung wurde bereits abgeschlossen.
            Änderungen sind nicht mehr möglich.
          </p>
          <div className="bg-gs-gray-50 rounded-lg p-4 text-left text-sm">
            <p className="text-gs-gray-600">
              <span className="font-medium">Projekt:</span> {project.name}
            </p>
            <p className="text-gs-gray-600">
              <span className="font-medium">Wohnung:</span> {apartment.number}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gs-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6">
        <img src="/logo.jpg" alt="GS Gruppe" className="h-12 mx-auto mb-6" />
        
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gs-gray-900 mb-2">
            Willkommen zur Bemusterung
          </h1>
          <p className="text-gs-gray-600">
            Wählen Sie die Ausstattung für Ihre neue Wohnung
          </p>
        </div>

        <div className="bg-gs-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gs-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gs-gray-900">{project.name}</p>
              <p className="text-sm text-gs-gray-600">Wohnung {apartment.number}</p>
            </div>
          </div>
          {apartment.customerName && (
            <p className="text-sm text-gs-gray-600">
              Hallo {apartment.customerName}!
            </p>
          )}
        </div>

        <div className="space-y-3 mb-6 text-sm text-gs-gray-600">
          <p>Im folgenden Assistenten können Sie:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Ausstattungsoptionen für jede Kategorie sehen</li>
            <li>Ihre bevorzugte Option auswählen</li>
            <li>Die Mehrkosten jederzeit einsehen</li>
            <li>Am Ende Ihre Auswahl verbindlich bestätigen</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> Nach der verbindlichen Bestätigung können keine 
            Änderungen mehr vorgenommen werden.
          </p>
        </div>

        <button onClick={handleStart} className="btn-primary w-full">
          Bemusterung starten
        </button>
      </div>
    </div>
  )
}
