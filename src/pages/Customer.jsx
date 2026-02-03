import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Home, AlertCircle,
  CheckCircle2, Loader2, Download, FileText
} from 'lucide-react'

// Demo-Daten (werden durch API ersetzt)
const DEMO_APARTMENT = {
  id: 1,
  name: 'Wohnung 1.01',
  floor: 'EG',
  size_sqm: 78.5,
  rooms: 3,
  customer_name: 'Familie Müller',
  project: {
    id: 1,
    name: 'Wohnpark Am See',
    address: 'Seestraße 15-21, 12345 Musterstadt'
  },
  status: 'offen'
}

const DEMO_CATEGORIES = [
  {
    id: 1,
    name: 'Bodenbeläge Wohnbereich',
    description: 'Wählen Sie den Bodenbelag für Wohn- und Essbereich aus.',
    options: [
      { id: 1, name: 'Eiche Natur', description: 'Parkett Eiche, gebürstet und geölt, Landhausdiele 14mm', price: 0, is_default: 1, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
      { id: 2, name: 'Eiche Grau', description: 'Parkett Eiche, grau lasiert, Landhausdiele 14mm', price: 850, is_default: 0, image_url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop' },
      { id: 3, name: 'Nussbaum Amerikanisch', description: 'Parkett Nussbaum, matt lackiert, Landhausdiele 14mm', price: 1200, is_default: 0, image_url: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=400&h=300&fit=crop' },
      { id: 4, name: 'Vinyl Designboden', description: 'Hochwertiger Vinyl-Designboden in Eichenoptik', price: -350, is_default: 0, image_url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=300&fit=crop' }
    ]
  },
  {
    id: 2,
    name: 'Bodenbeläge Nassbereich',
    description: 'Fliesen für Badezimmer und Gäste-WC.',
    options: [
      { id: 5, name: 'Feinsteinzeug Weiß 60x60', description: 'Großformatige weiße Bodenfliesen, matt', price: 0, is_default: 1, image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop' },
      { id: 6, name: 'Feinsteinzeug Anthrazit 60x60', description: 'Großformatige anthrazitfarbene Bodenfliesen, matt', price: 450, is_default: 0, image_url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop' },
      { id: 7, name: 'Naturstein Optik Beige 30x60', description: 'Fliesen in edler Natursteinoptik', price: 680, is_default: 0, image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop' }
    ]
  },
  {
    id: 3,
    name: 'Sanitärobjekte',
    description: 'Ausstattung für Ihr Badezimmer.',
    options: [
      { id: 8, name: 'Standard Paket', description: 'Wand-WC, Waschtisch 60cm mit Unterschrank, Duschwanne 90x90cm', price: 0, is_default: 1, image_url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop' },
      { id: 9, name: 'Komfort Paket', description: 'Wand-WC spülrandlos, Waschtisch 80cm mit Unterschrank, bodengleiche Dusche', price: 1850, is_default: 0, image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop' },
      { id: 10, name: 'Premium Paket', description: 'Wand-WC spülrandlos, Doppelwaschtisch 120cm, Walk-In Dusche 120cm, freistehende Badewanne', price: 4200, is_default: 0, image_url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop' }
    ]
  },
  {
    id: 4,
    name: 'Innentüren',
    description: 'Design für alle Innentüren der Wohnung.',
    options: [
      { id: 11, name: 'Weiß lackiert glatt', description: 'Innentüren weiß lackiert, glatte Oberfläche, Edelstahldrücker', price: 0, is_default: 1, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
      { id: 12, name: 'Weiß mit Lichtausschnitt', description: 'Innentüren weiß lackiert mit Glasausschnitt (Klarglas)', price: 180, is_default: 0, image_url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop' },
      { id: 13, name: 'Eiche furniert', description: 'Innentüren mit Echtholzfurnier Eiche natur', price: 420, is_default: 0, image_url: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=400&h=300&fit=crop' }
    ]
  },
  {
    id: 5,
    name: 'Elektroausstattung',
    description: 'Schalter- und Steckdosenprogramm.',
    options: [
      { id: 14, name: 'Standard Weiß', description: 'Schalterprogramm in Reinweiß glänzend (Busch-Jaeger)', price: 0, is_default: 1, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
      { id: 15, name: 'Aluminium gebürstet', description: 'Schalterprogramm in Aluminium-Optik (Busch-Jaeger future linear)', price: 650, is_default: 0, image_url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop' },
      { id: 16, name: 'Glas Weiß', description: 'Schalterprogramm mit Glasrahmen weiß (Busch-Jaeger carat)', price: 890, is_default: 0, image_url: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=400&h=300&fit=crop' }
    ]
  }
]

function Customer() {
  const { code } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apartment, setApartment] = useState(null)
  const [categories, setCategories] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Daten laden
  useEffect(() => {
    const loadData = async () => {
      try {
        // Versuche API-Aufruf
        const response = await fetch(`/api/customer/${code}`)
        if (response.ok) {
          const data = await response.json()
          setApartment(data.apartment)
          setCategories(data.categories)
          
          // Vorauswahl der Standard-Optionen
          const defaultSelections = {}
          data.categories.forEach(cat => {
            const defaultOption = cat.options.find(o => o.is_default) || cat.options[0]
            if (defaultOption) defaultSelections[cat.id] = defaultOption.id
          })
          setSelections(defaultSelections)
          
          if (data.apartment.status === 'abgeschlossen') {
            setIsCompleted(true)
          }
        } else {
          throw new Error('API nicht verfügbar')
        }
      } catch (err) {
        // Fallback auf Demo-Daten
        console.log('Verwende Demo-Daten')
        setApartment(DEMO_APARTMENT)
        setCategories(DEMO_CATEGORIES)
        
        // Vorauswahl der Standard-Optionen
        const defaultSelections = {}
        DEMO_CATEGORIES.forEach(cat => {
          const defaultOption = cat.options.find(o => o.is_default) || cat.options[0]
          if (defaultOption) defaultSelections[cat.id] = defaultOption.id
        })
        setSelections(defaultSelections)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [code])

  // Gesamtpreis berechnen
  const calculateTotal = () => {
    let total = 0
    Object.entries(selections).forEach(([catId, optionId]) => {
      const category = categories.find(c => c.id === parseInt(catId))
      const option = category?.options.find(o => o.id === optionId)
      if (option) total += option.price
    })
    return total
  }

  // Option auswählen
  const handleSelect = (categoryId, optionId) => {
    setSelections(prev => ({ ...prev, [categoryId]: optionId }))
  }

  // Nächster Schritt
  const nextStep = () => {
    if (currentStep < categories.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Vorheriger Schritt
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Absenden
  const handleSubmit = async () => {
    if (!confirm('Möchten Sie Ihre Auswahl verbindlich abschicken? Eine nachträgliche Änderung ist nicht möglich.')) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/customer/${code}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections })
      })
      
      if (response.ok) {
        setIsCompleted(true)
      } else {
        throw new Error('Fehler beim Absenden')
      }
    } catch (err) {
      // Demo-Modus
      console.log('Demo: Auswahl abgesendet', selections)
      setIsCompleted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preis formatieren
  const formatPrice = (price) => {
    if (price === 0) return 'Inklusive'
    if (price > 0) return `+${price.toLocaleString('de-DE')} €`
    return `${price.toLocaleString('de-DE')} €`
  }

  // Loading State
  if (loading) {
    return (
      <div className="wizard-loading">
        <div className="spinner spinner-lg" />
        <p>Bemusterung wird geladen...</p>
        <style>{`
          .wizard-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            color: var(--gray-500);
          }
        `}</style>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="wizard-container">
        <div className="wizard-error">
          <AlertCircle size={48} />
          <h2>Fehler</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Zurück zur Startseite
          </button>
        </div>
        <style>{`
          .wizard-error {
            text-align: center;
            padding: 3rem;
            color: var(--gray-500);
          }
          .wizard-error h2 {
            margin: 1rem 0 0.5rem;
            color: var(--gray-700);
          }
          .wizard-error svg {
            color: var(--error);
          }
        `}</style>
      </div>
    )
  }

  // Completion State
  if (isCompleted) {
    return (
      <div className="wizard-container">
        <div className="wizard-header">
          <img src="/logo.jpg" alt="G&S Gruppe" className="wizard-logo" />
        </div>
        <div className="wizard-content" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            background: 'var(--success-light)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <CheckCircle2 size={40} color="var(--success)" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Bemusterung abgeschlossen</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
            Vielen Dank! Ihre Auswahl wurde erfolgreich übermittelt. 
            Sie erhalten in Kürze eine Bestätigung per E-Mail.
          </p>
          
          <div style={{ 
            background: 'var(--gray-50)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h4 style={{ marginBottom: '1rem' }}>Ihre Auswahl im Überblick</h4>
            {categories.map(cat => {
              const selectedOption = cat.options.find(o => o.id === selections[cat.id])
              return (
                <div key={cat.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--gray-200)'
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{cat.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{selectedOption?.name}</div>
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: selectedOption?.price === 0 ? 'var(--success)' : selectedOption?.price > 0 ? 'var(--gs-red)' : 'var(--info)'
                  }}>
                    {formatPrice(selectedOption?.price || 0)}
                  </div>
                </div>
              )
            })}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '1rem 0 0',
              fontWeight: 700,
              fontSize: '1.125rem'
            }}>
              <span>Gesamt Mehrpreis</span>
              <span style={{ color: calculateTotal() >= 0 ? 'var(--gs-red)' : 'var(--info)' }}>
                {calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €
              </span>
            </div>
          </div>

          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <Home size={18} />
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }

  // Wizard
  const currentCategory = categories[currentStep]
  const isOverview = currentStep === categories.length

  return (
    <div className="wizard-page">
      {/* Header */}
      <header className="wizard-page-header">
        <div className="wizard-page-header-inner">
          <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
          <div className="wizard-apartment-info">
            <span style={{ fontWeight: 600 }}>{apartment.project.name}</span>
            <span style={{ color: 'var(--gray-400)' }}>·</span>
            <span>{apartment.name}</span>
          </div>
        </div>
      </header>

      <div className="wizard-container">
        {/* Progress Bar */}
        <div className="wizard-progress">
          {categories.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <div className="wizard-step">
                <div className={`step-number ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`}>
                  {index < currentStep ? <Check size={16} /> : index + 1}
                </div>
                <span className={`step-label ${index === currentStep ? 'active' : ''}`}>
                  {cat.name.split(' ')[0]}
                </span>
              </div>
              {index < categories.length - 1 && (
                <div className={`step-connector ${index < currentStep ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          ))}
          <div className="wizard-step">
            <div className={`step-number ${isOverview ? 'active' : ''}`}>
              {isOverview ? <Check size={16} /> : categories.length + 1}
            </div>
            <span className={`step-label ${isOverview ? 'active' : ''}`}>Übersicht</span>
          </div>
        </div>

        {/* Content */}
        <div className="wizard-content animate-fade-in" key={currentStep}>
          {isOverview ? (
            // Zusammenfassung
            <>
              <h2 style={{ marginBottom: '0.5rem' }}>Zusammenfassung</h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                Bitte überprüfen Sie Ihre Auswahl. Nach dem Absenden ist keine Änderung mehr möglich.
              </p>

              <div className="overview-list">
                {categories.map(cat => {
                  const selectedOption = cat.options.find(o => o.id === selections[cat.id])
                  return (
                    <div key={cat.id} className="overview-item">
                      <div className="overview-item-main">
                        <div className="overview-category">{cat.name}</div>
                        <div className="overview-selection">{selectedOption?.name}</div>
                      </div>
                      <div className={`overview-price ${selectedOption?.price === 0 ? 'included' : selectedOption?.price > 0 ? 'extra' : 'discount'}`}>
                        {formatPrice(selectedOption?.price || 0)}
                      </div>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentStep(categories.indexOf(cat))}
                      >
                        Ändern
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="overview-total">
                <div>
                  <div className="overview-total-label">Gesamter Mehrpreis</div>
                  <div className="overview-total-note">zzgl. zur Basisausstattung</div>
                </div>
                <div className={`overview-total-value ${calculateTotal() >= 0 ? 'extra' : 'discount'}`}>
                  {calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €
                </div>
              </div>
            </>
          ) : (
            // Kategorie-Auswahl
            <>
              <h2 style={{ marginBottom: '0.5rem' }}>{currentCategory.name}</h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                {currentCategory.description}
              </p>

              <div className="option-grid">
                {currentCategory.options.map(option => (
                  <div
                    key={option.id}
                    className={`option-card ${selections[currentCategory.id] === option.id ? 'selected' : ''}`}
                    onClick={() => handleSelect(currentCategory.id, option.id)}
                  >
                    {option.image_url ? (
                      <img src={option.image_url} alt={option.name} className="option-image" />
                    ) : (
                      <div className="option-image" style={{ background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--gray-400)' }}>Kein Bild</span>
                      </div>
                    )}
                    <div className="option-content">
                      <div className="option-name">{option.name}</div>
                      <div className="option-description">{option.description}</div>
                      <div className={`option-price ${option.price === 0 ? 'included' : option.price > 0 ? 'extra' : 'discount'}`}>
                        {formatPrice(option.price)}
                      </div>
                    </div>
                    {selections[currentCategory.id] === option.id && (
                      <div className="option-check">
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          <div className="wizard-total">
            <div className="wizard-total-label">Aktueller Mehrpreis</div>
            <div className={`wizard-total-value ${calculateTotal() >= 0 ? '' : 'discount'}`} style={{ color: calculateTotal() >= 0 ? 'var(--gs-red)' : 'var(--info)' }}>
              {calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep > 0 && (
              <button className="btn btn-outline" onClick={prevStep}>
                <ChevronLeft size={18} />
                Zurück
              </button>
            )}
            {isOverview ? (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Verbindlich absenden
                  </>
                )}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={nextStep}>
                Weiter
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .wizard-page {
          min-height: 100vh;
          background: var(--gray-50);
        }

        .wizard-page-header {
          background: white;
          border-bottom: 1px solid var(--gray-200);
          padding: 1rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .wizard-page-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .wizard-apartment-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          color: var(--gray-600);
        }

        .wizard-container {
          padding: 2rem;
          padding-top: 1.5rem;
        }

        .wizard-progress {
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .option-card {
          position: relative;
        }

        .option-card.selected .option-content {
          background: rgba(227, 6, 19, 0.03);
        }

        .option-check {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 28px;
          height: 28px;
          background: var(--gs-red);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overview-list {
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .overview-item {
          display: flex;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--gray-100);
          gap: 1rem;
        }

        .overview-item:last-child {
          border-bottom: none;
        }

        .overview-item-main {
          flex: 1;
        }

        .overview-category {
          font-size: 0.8125rem;
          color: var(--gray-500);
          margin-bottom: 0.125rem;
        }

        .overview-selection {
          font-weight: 600;
        }

        .overview-price {
          font-weight: 600;
          min-width: 100px;
          text-align: right;
        }

        .overview-price.included {
          color: var(--success);
        }

        .overview-price.extra {
          color: var(--gs-red);
        }

        .overview-price.discount {
          color: var(--info);
        }

        .overview-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding: 1.25rem 1.5rem;
          background: var(--gray-900);
          color: white;
          border-radius: var(--radius-md);
        }

        .overview-total-label {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .overview-total-note {
          font-size: 0.8125rem;
          opacity: 0.7;
        }

        .overview-total-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .overview-total-value.extra {
          color: #ff6b6b;
        }

        .overview-total-value.discount {
          color: #69db7c;
        }

        @media (max-width: 768px) {
          .wizard-page-header {
            padding: 0.75rem 1rem;
          }

          .wizard-apartment-info {
            display: none;
          }

          .wizard-container {
            padding: 1rem;
          }

          .wizard-footer {
            flex-direction: column;
            gap: 1rem;
          }

          .wizard-footer > div:last-child {
            width: 100%;
            display: flex;
          }

          .wizard-footer .btn {
            flex: 1;
          }

          .overview-item {
            flex-wrap: wrap;
          }

          .overview-item .btn {
            width: 100%;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Customer
