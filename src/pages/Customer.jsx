import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Home, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react'

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

  // Daten von API laden
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/customer/${code.toUpperCase()}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error || 'Fehler beim Laden')
          setLoading(false)
          return
        }

        setApartment(data.apartment)
        setCategories(data.categories || [])

        // Bereits abgeschlossen?
        if (data.apartment.status === 'abgeschlossen') {
          setSelections(data.selections || {})
          setIsCompleted(true)
          setLoading(false)
          return
        }

        // Vorauswahl: bestehende Auswahl oder Standardoptionen
        const defaultSelections = { ...data.selections }
        data.categories.forEach(cat => {
          if (!defaultSelections[cat.id]) {
            const defaultOpt = cat.options.find(o => o.is_default) || cat.options[0]
            if (defaultOpt) defaultSelections[cat.id] = defaultOpt.id
          }
        })
        setSelections(defaultSelections)
        setLoading(false)

      } catch (err) {
        console.error('Fehler:', err)
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.')
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
      const option = category?.options.find(o => o.id === optionId || o.id === `custom_${optionId}`)
      if (option) total += option.price
    })
    return total
  }

  // Option auswählen
  const handleSelect = (categoryId, optionId) => {
    setSelections(prev => ({ ...prev, [categoryId]: optionId }))
  }

  // Navigation
  const nextStep = () => { if (currentStep < categories.length) setCurrentStep(prev => prev + 1) }
  const prevStep = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1) }

  // Absenden
  const handleSubmit = async () => {
    if (!confirm('Möchten Sie Ihre Auswahl verbindlich abschicken? Eine nachträgliche Änderung ist nicht möglich.')) return

    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/customer/${code.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections })
      })
      
      if (res.ok) {
        setIsCompleted(true)
        // PDF in neuem Tab öffnen damit der Kunde es speichern kann
        window.open(`/api/pdf?code=${code.toUpperCase()}`, '_blank')
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Speichern')
      }
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.')
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

  // Loading
  if (loading) {
    return (
      <div className="wizard-loading">
        <Loader2 className="animate-spin" size={40} />
        <p>Bemusterung wird geladen...</p>
        <style>{`
          .wizard-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--gray-500); }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="wizard-container">
        <div className="wizard-error">
          <AlertCircle size={48} />
          <h2>Fehler</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Zurück zur Startseite</button>
        </div>
        <style>{`
          .wizard-container { max-width: 600px; margin: 0 auto; padding: 2rem; }
          .wizard-error { text-align: center; padding: 3rem; background: white; border-radius: 12px; box-shadow: var(--shadow-lg); }
          .wizard-error h2 { margin: 1rem 0 0.5rem; }
          .wizard-error svg { color: var(--error); }
        `}</style>
      </div>
    )
  }

  // Completed
  if (isCompleted) {
    return (
      <div className="wizard-container">
        <div className="wizard-header">
          <img src="/logo.jpg" alt="G&S Gruppe" className="wizard-logo" />
        </div>
        <div className="wizard-content" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: 80, height: 80, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={40} color="var(--success)" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Bemusterung erfolgreich abgeschlossen!</h2>
          <p style={{ color: 'var(--gray-500)', maxWidth: 450, margin: '0 auto 2rem' }}>
            Vielen Dank! Ihre Auswahl wurde verbindlich übermittelt. 
            Ein Protokoll wurde automatisch in einem neuen Tab geöffnet - 
            bitte speichern Sie dieses als PDF für Ihre Unterlagen.
          </p>
          
          {categories.length > 0 && (
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
              <h4 style={{ marginBottom: '1rem' }}>Ihre Auswahl im Überblick</h4>
              {categories.map(cat => {
                const selectedOption = cat.options.find(o => o.id === selections[cat.id])
                return selectedOption && (
                  <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{cat.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{selectedOption.name}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatPrice(selectedOption.price)}</div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', fontWeight: 700, fontSize: '1.125rem' }}>
                <span>Gesamt Mehrpreis</span>
                <span>{calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => window.open(`/api/pdf?code=${code.toUpperCase()}`, '_blank')}><FileText size={18} /> PDF herunterladen</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}><Home size={18} /> Zur Startseite</button>
          </div>
        </div>
        <style>{wizardStyles}</style>
      </div>
    )
  }

  // Wizard
  const currentCategory = categories[currentStep]
  const isOverview = currentStep === categories.length

  return (
    <div className="wizard-page">
      <header className="wizard-page-header">
        <div className="wizard-page-header-inner">
          <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
          <div className="wizard-apartment-info">
            <span style={{ fontWeight: 600 }}>{apartment?.project?.name}</span>
            <span style={{ color: 'var(--gray-400)' }}>·</span>
            <span>{apartment?.name}</span>
          </div>
        </div>
      </header>

      <div className="wizard-container">
        {/* Progress */}
        <div className="wizard-progress">
          {categories.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <div className="wizard-step">
                <div className={`step-number ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`}>
                  {index < currentStep ? <Check size={16} /> : index + 1}
                </div>
                <span className={`step-label ${index === currentStep ? 'active' : ''}`}>{cat.name.split(' ')[0]}</span>
              </div>
              {index < categories.length - 1 && <div className={`step-connector ${index < currentStep ? 'completed' : ''}`} />}
            </React.Fragment>
          ))}
          <div className="wizard-step">
            <div className={`step-number ${isOverview ? 'active' : ''}`}>{categories.length + 1}</div>
            <span className={`step-label ${isOverview ? 'active' : ''}`}>Übersicht</span>
          </div>
        </div>

        {/* Content */}
        <div className="wizard-content" key={currentStep}>
          {isOverview ? (
            <>
              <h2 style={{ marginBottom: '0.5rem' }}>Zusammenfassung</h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>Bitte überprüfen Sie Ihre Auswahl.</p>
              <div className="overview-list">
                {categories.map(cat => {
                  const selectedOption = cat.options.find(o => o.id === selections[cat.id])
                  return (
                    <div key={cat.id} className="overview-item">
                      <div className="overview-item-main">
                        <div className="overview-category">{cat.name}</div>
                        <div className="overview-selection">{selectedOption?.name}</div>
                      </div>
                      <div className="overview-price">{formatPrice(selectedOption?.price || 0)}</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setCurrentStep(categories.indexOf(cat))}>Ändern</button>
                    </div>
                  )
                })}
              </div>
              <div className="overview-total">
                <div>
                  <div className="overview-total-label">Gesamter Mehrpreis</div>
                  <div className="overview-total-note">zzgl. zur Basisausstattung</div>
                </div>
                <div className="overview-total-value">{calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €</div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: '0.5rem' }}>{currentCategory?.name}</h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>{currentCategory?.description}</p>
              <div className="option-grid">
                {currentCategory?.options.map(option => (
                  <div
                    key={option.id}
                    className={`option-card ${selections[currentCategory.id] === option.id ? 'selected' : ''}`}
                    onClick={() => handleSelect(currentCategory.id, option.id)}
                  >
                    {option.image_url ? (
                      <img src={option.image_url} alt={option.name} className="option-image" />
                    ) : (
                      <div className="option-image option-image-placeholder">
                        <span>Kein Bild</span>
                      </div>
                    )}
                    <div className="option-content">
                      <div className="option-name">
                        {option.name}
                        {option.is_custom && <span className="custom-tag">Individuell</span>}
                      </div>
                      {option.description && <div className="option-description">{option.description}</div>}
                      <div className="option-price">{formatPrice(option.price)}</div>
                    </div>
                    {selections[currentCategory.id] === option.id && (
                      <div className="option-check"><Check size={20} /></div>
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
            <div className="wizard-total-value">{calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep > 0 && <button className="btn btn-outline" onClick={prevStep}><ChevronLeft size={18} /> Zurück</button>}
            {isOverview ? (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Wird gesendet...</> : <><Check size={18} /> Verbindlich absenden</>}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={nextStep}>Weiter <ChevronRight size={18} /></button>
            )}
          </div>
        </div>
      </div>

      <style>{wizardStyles}</style>
    </div>
  )
}

const wizardStyles = `
  .wizard-page { min-height: 100vh; background: var(--gray-50); }
  .wizard-page-header { background: white; border-bottom: 1px solid var(--gray-200); padding: 1rem 2rem; position: sticky; top: 0; z-index: 100; }
  .wizard-page-header-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .wizard-apartment-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: var(--gray-600); }
  .wizard-container { max-width: 900px; margin: 0 auto; padding: 2rem; padding-top: 1.5rem; }
  .wizard-header { text-align: center; margin-bottom: 2rem; }
  .wizard-logo { height: 50px; }
  .wizard-progress { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; }
  .wizard-step { display: flex; align-items: center; gap: 0.5rem; }
  .step-number { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600; background: var(--gray-200); color: var(--gray-500); flex-shrink: 0; }
  .step-number.active { background: var(--gs-red); color: white; }
  .step-number.completed { background: var(--success); color: white; }
  .step-label { font-size: 0.875rem; color: var(--gray-500); display: none; }
  @media (min-width: 768px) { .step-label { display: block; } .step-label.active { color: var(--gs-black); font-weight: 500; } }
  .step-connector { width: 40px; height: 2px; background: var(--gray-200); margin: 0 0.5rem; flex-shrink: 0; }
  .step-connector.completed { background: var(--success); }
  .wizard-content { background: white; border-radius: 12px; box-shadow: var(--shadow-lg); padding: 2rem; }
  .option-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; margin: 1.5rem 0; }
  .option-card { position: relative; border: 2px solid var(--gray-200); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
  .option-card:hover { border-color: var(--gray-300); box-shadow: var(--shadow-md); }
  .option-card.selected { border-color: var(--gs-red); box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.1); }
  .option-image { width: 100%; height: 160px; object-fit: cover; background: var(--gray-100); }
  .option-image-placeholder { display: flex; align-items: center; justify-content: center; color: var(--gray-400); }
  .option-content { padding: 1rem; }
  .option-name { font-weight: 600; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .option-description { font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.75rem; }
  .option-price { font-size: 1rem; font-weight: 600; }
  .option-check { position: absolute; top: 0.75rem; right: 0.75rem; width: 28px; height: 28px; background: var(--gs-red); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .custom-tag { display: inline-block; padding: 0.125rem 0.5rem; background: var(--info); color: white; font-size: 0.6875rem; border-radius: 9999px; font-weight: 600; }
  .wizard-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200); }
  .wizard-total-label { color: var(--gray-500); font-size: 0.875rem; }
  .wizard-total-value { font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; }
  .overview-list { border: 1px solid var(--gray-200); border-radius: 8px; overflow: hidden; }
  .overview-item { display: flex; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--gray-100); gap: 1rem; }
  .overview-item:last-child { border-bottom: none; }
  .overview-item-main { flex: 1; }
  .overview-category { font-size: 0.8125rem; color: var(--gray-500); margin-bottom: 0.125rem; }
  .overview-selection { font-weight: 600; }
  .overview-price { font-weight: 600; min-width: 100px; text-align: right; }
  .overview-total { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding: 1.25rem 1.5rem; background: var(--gray-900); color: white; border-radius: 8px; }
  .overview-total-label { font-weight: 600; font-size: 1.125rem; }
  .overview-total-note { font-size: 0.8125rem; opacity: 0.7; }
  .overview-total-value { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; }
  .animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .wizard-page-header { padding: 0.75rem 1rem; }
    .wizard-apartment-info { display: none; }
    .wizard-container { padding: 1rem; }
    .wizard-footer { flex-direction: column; gap: 1rem; }
    .wizard-footer > div:last-child { width: 100%; display: flex; }
    .wizard-footer .btn { flex: 1; }
  }
`

export default Customer
