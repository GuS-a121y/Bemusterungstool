import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Home, AlertCircle, CheckCircle2, Loader2, FileText, ArrowRight, Info, X, ZoomIn, Save } from 'lucide-react'

// Footer Komponente
const Footer = () => (
  <footer className="customer-footer">
    <div className="footer-links">
      <a href="https://www.g-s-wohnbau.de/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutz</a>
      <span>|</span>
      <a href="https://www.g-s-wohnbau.de/impressum" target="_blank" rel="noopener noreferrer">Impressum</a>
    </div>
    <div className="footer-copyright">© {new Date().getFullYear()} G&S Gruppe</div>
  </footer>
)

// Info Modal
const InfoModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={e => e.stopPropagation()}>
        <div className="info-modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="info-modal-content">
          {content.split('\n').map((line, i) => (
            <p key={i}>{line || <br />}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// Bild Modal
const ImageModal = ({ isOpen, onClose, src, alt }) => {
  if (!isOpen || !src) return null
  return (
    <div className="modal-overlay image-modal-overlay" onClick={onClose}>
      <div className="image-modal" onClick={e => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose}><X size={24} /></button>
        <img src={src} alt={alt} />
      </div>
    </div>
  )
}

function Customer() {
  const { code } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apartment, setApartment] = useState(null)
  const [categories, setCategories] = useState([])
  const [currentStep, setCurrentStep] = useState(-1) // -1 = Einleitungsseite
  const [selections, setSelections] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  
  // Modal States
  const [infoModal, setInfoModal] = useState({ open: false, title: '', content: '' })
  const [imageModal, setImageModal] = useState({ open: false, src: '', alt: '' })

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
          setCurrentStep(data.categories.length) // Zeige Übersicht
          setLoading(false)
          return
        }

        // Vorauswahl: bestehende Auswahl oder Standardoptionen
        const defaultSelections = {}
        
        // Erst bestehende Auswahl laden
        if (data.selections) {
          Object.entries(data.selections).forEach(([catId, optId]) => {
            // Negative IDs sind custom options
            if (optId < 0) {
              defaultSelections[catId] = `custom_${Math.abs(optId)}`
            } else {
              defaultSelections[catId] = optId
            }
          })
        }
        
        // Dann für fehlende Kategorien Defaults setzen
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
      const option = category?.options.find(o => o.id === optionId || o.id === `custom_${optionId}` || `custom_${o.custom_id}` === optionId)
      if (option) total += option.price
    })
    return total
  }

  // Option auswählen
  const handleSelect = (categoryId, optionId) => {
    setSelections(prev => ({ ...prev, [categoryId]: optionId }))
    setDraftSaved(false)
  }

  // Navigation
  const nextStep = () => { if (currentStep < categories.length) setCurrentStep(prev => prev + 1) }
  const prevStep = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1) }
  const startBemusterung = () => setCurrentStep(0)

  // Zwischenspeichern
  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    
    try {
      const res = await fetch(`/api/customer/${code.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections, draft: true })
      })
      
      if (res.ok) {
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 3000)
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Speichern')
      }
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Final absenden
  const handleSubmit = async () => {
    if (!confirm('Möchten Sie Ihre Auswahl verbindlich abschicken? Eine nachträgliche Änderung ist nicht möglich.')) return

    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/customer/${code.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections, draft: false })
      })
      
      if (res.ok) {
        setIsCompleted(true)
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

  // Info Modal öffnen
  const openInfoModal = (title, content) => {
    setInfoModal({ open: true, title, content })
  }

  // Bild Modal öffnen
  const openImageModal = (src, alt) => {
    setImageModal({ open: true, src, alt })
  }

  // Loading
  if (loading) {
    return (
      <div className="wizard-loading">
        <Loader2 className="animate-spin" size={40} />
        <p>Bemusterung wird geladen...</p>
        <style>{wizardStyles}</style>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="wizard-page">
        <div className="wizard-container">
          <div className="wizard-error">
            <AlertCircle size={48} />
            <h2>Fehler</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Zurück zur Startseite</button>
          </div>
        </div>
        <Footer />
        <style>{wizardStyles}</style>
      </div>
    )
  }

  // Completed
  if (isCompleted) {
    return (
      <div className="wizard-page">
        <header className="wizard-page-header">
          <div className="wizard-page-header-inner">
            {apartment?.project?.logo ? (
              <img src={apartment.project.logo} alt={apartment.project.name} style={{ height: 40 }} />
            ) : (
              <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
            )}
            <div className="wizard-apartment-info">
              <span style={{ fontWeight: 600 }}>{apartment?.project?.name}</span>
            </div>
          </div>
        </header>
        
        <div className="wizard-container">
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
                  const selectedOption = cat.options.find(o => o.id === selections[cat.id] || `custom_${o.custom_id}` === selections[cat.id])
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
        </div>
        <Footer />
        <style>{wizardStyles}</style>
      </div>
    )
  }

  // Einleitungsseite
  if (currentStep === -1) {
    const defaultIntroText = `Herzlich willkommen zur digitalen Bemusterung für Ihre neue Wohnung!

In den folgenden Schritten können Sie die Ausstattung Ihrer Wohnung ganz nach Ihren Wünschen auswählen. Für jede Kategorie stehen Ihnen verschiedene Optionen zur Verfügung - von der Basisausstattung bis zu hochwertigen Upgrades.

Nehmen Sie sich Zeit für Ihre Auswahl. Sie können Ihren Fortschritt jederzeit zwischenspeichern und später fortfahren. Am Ende erhalten Sie eine Übersicht und können Ihre Entscheidung verbindlich bestätigen.`

    return (
      <div className="wizard-page">
        <header className="wizard-page-header">
          <div className="wizard-page-header-inner">
            {apartment?.project?.logo ? (
              <img src={apartment.project.logo} alt={apartment.project.name} style={{ height: 40 }} />
            ) : (
              <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
            )}
          </div>
        </header>

        <div className="intro-container">
          {apartment?.project?.image && (
            <div className="intro-image">
              <img src={apartment.project.image} alt={apartment.project.name} />
            </div>
          )}
          
          <div className="intro-content">
            <div className="intro-badge">Digitale Bemusterung</div>
            <h1>{apartment?.project?.name}</h1>
            {apartment?.project?.address && <p className="intro-address">{apartment.project.address}</p>}
            
            <div className="intro-welcome">
              <p>Willkommen, <strong>{apartment?.customer_name || 'Kunde'}</strong>!</p>
              <p className="intro-apartment">Wohnung: <strong>{apartment?.name}</strong></p>
            </div>

            <div className="intro-text">
              {(apartment?.project?.intro_text || defaultIntroText).split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <button className="btn btn-primary btn-lg" onClick={startBemusterung}>
              Bemusterung starten <ArrowRight size={20} />
            </button>
          </div>
        </div>
        <Footer />
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
          {apartment?.project?.logo ? (
            <img src={apartment.project.logo} alt={apartment.project.name} style={{ height: 40 }} />
          ) : (
            <img src="/logo.jpg" alt="G&S Gruppe" style={{ height: 40 }} />
          )}
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
                  const selectedOption = cat.options.find(o => o.id === selections[cat.id] || `custom_${o.custom_id}` === selections[cat.id])
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
                {currentCategory?.options.map(option => {
                  const isSelected = selections[currentCategory.id] === option.id || selections[currentCategory.id] === `custom_${option.custom_id}`
                  return (
                    <div
                      key={option.id}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(currentCategory.id, option.id)}
                    >
                      {option.image_url ? (
                        <div className="option-image-wrapper">
                          <img src={option.image_url} alt={option.name} className="option-image" />
                          <button 
                            className="option-zoom-btn" 
                            onClick={(e) => { e.stopPropagation(); openImageModal(option.image_url, option.name) }}
                          >
                            <ZoomIn size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="option-image option-image-placeholder">
                          <span>Kein Bild</span>
                        </div>
                      )}
                      <div className="option-content">
                        <div className="option-name">
                          {option.name}
                          {option.info_text && (
                            <button 
                              className="option-info-btn" 
                              onClick={(e) => { e.stopPropagation(); openInfoModal(option.name, option.info_text) }}
                            >
                              <Info size={16} />
                            </button>
                          )}
                        </div>
                        {option.description && <div className="option-description">{option.description}</div>}
                        <div className="option-price">{formatPrice(option.price)}</div>
                      </div>
                      {isSelected && (
                        <div className="option-check"><Check size={20} /></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          <div className="wizard-footer-left">
            <div className="wizard-total">
              <div className="wizard-total-label">Aktueller Mehrpreis</div>
              <div className="wizard-total-value">{calculateTotal() >= 0 ? '+' : ''}{calculateTotal().toLocaleString('de-DE')} €</div>
            </div>
            <button 
              className={`btn btn-outline btn-save-draft ${draftSaved ? 'saved' : ''}`} 
              onClick={handleSaveDraft} 
              disabled={isSavingDraft}
            >
              {isSavingDraft ? <Loader2 size={16} className="animate-spin" /> : draftSaved ? <Check size={16} /> : <Save size={16} />}
              {draftSaved ? 'Gespeichert!' : 'Zwischenspeichern'}
            </button>
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
      
      {/* Modals */}
      <InfoModal 
        isOpen={infoModal.open} 
        onClose={() => setInfoModal({ ...infoModal, open: false })}
        title={infoModal.title}
        content={infoModal.content}
      />
      <ImageModal
        isOpen={imageModal.open}
        onClose={() => setImageModal({ ...imageModal, open: false })}
        src={imageModal.src}
        alt={imageModal.alt}
      />
      
      <Footer />
      <style>{wizardStyles}</style>
    </div>
  )
}

const wizardStyles = `
  .wizard-page { min-height: 100vh; background: var(--gray-50); display: flex; flex-direction: column; }
  .wizard-page-header { background: white; border-bottom: 1px solid var(--gray-200); padding: 1rem 2rem; position: sticky; top: 0; z-index: 100; }
  .wizard-page-header-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .wizard-apartment-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: var(--gray-600); }
  .wizard-container { max-width: 900px; margin: 0 auto; padding: 2rem; padding-top: 1.5rem; flex: 1; }
  .wizard-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--gray-500); }
  .wizard-error { text-align: center; padding: 3rem; background: white; border-radius: 12px; box-shadow: var(--shadow-lg); }
  .wizard-error h2 { margin: 1rem 0 0.5rem; }
  .wizard-error svg { color: var(--error); }
  
  /* Intro Page */
  .intro-container { max-width: 800px; margin: 0 auto; padding: 2rem; flex: 1; }
  .intro-image { border-radius: 12px; overflow: hidden; margin-bottom: 2rem; box-shadow: var(--shadow-lg); }
  .intro-image img { width: 100%; height: 300px; object-fit: cover; }
  .intro-content { background: white; border-radius: 12px; padding: 2.5rem; box-shadow: var(--shadow); }
  .intro-badge { display: inline-block; background: var(--gs-red); color: white; padding: 0.375rem 1rem; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem; }
  .intro-content h1 { font-size: 2rem; margin: 0 0 0.5rem; }
  .intro-address { color: var(--gray-500); margin-bottom: 1.5rem; }
  .intro-welcome { background: var(--gray-50); padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; }
  .intro-welcome p { margin: 0; }
  .intro-apartment { margin-top: 0.5rem !important; color: var(--gray-600); }
  .intro-text { color: var(--gray-600); line-height: 1.7; margin-bottom: 2rem; }
  .intro-text p { margin: 0 0 1rem; }
  .intro-text p:last-child { margin-bottom: 0; }
  
  /* Footer */
  .customer-footer { background: white; border-top: 1px solid var(--gray-200); padding: 1.5rem 2rem; text-align: center; }
  .footer-links { display: flex; justify-content: center; gap: 1rem; margin-bottom: 0.5rem; }
  .footer-links a { color: var(--gray-600); text-decoration: none; font-size: 0.875rem; }
  .footer-links a:hover { color: var(--gs-red); }
  .footer-links span { color: var(--gray-300); }
  .footer-copyright { color: var(--gray-400); font-size: 0.8125rem; }
  
  /* Wizard Progress */
  .wizard-progress { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; }
  .wizard-step { display: flex; align-items: center; gap: 0.5rem; }
  .step-number { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600; background: var(--gray-200); color: var(--gray-500); flex-shrink: 0; }
  .step-number.active { background: var(--gs-red); color: white; }
  .step-number.completed { background: var(--success); color: white; }
  .step-label { font-size: 0.875rem; color: var(--gray-500); display: none; }
  @media (min-width: 768px) { .step-label { display: block; } .step-label.active { color: var(--gs-black); font-weight: 500; } }
  .step-connector { width: 40px; height: 2px; background: var(--gray-200); margin: 0 0.5rem; flex-shrink: 0; }
  .step-connector.completed { background: var(--success); }
  
  /* Wizard Content */
  .wizard-content { background: white; border-radius: 12px; box-shadow: var(--shadow-lg); padding: 2rem; }
  .option-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; margin: 1.5rem 0; }
  .option-card { position: relative; border: 2px solid var(--gray-200); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
  .option-card:hover { border-color: var(--gray-300); box-shadow: var(--shadow-md); }
  .option-card.selected { border-color: var(--gs-red); box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.1); }
  .option-image-wrapper { position: relative; }
  .option-image { width: 100%; height: 160px; object-fit: cover; background: var(--gray-100); display: block; }
  .option-image-placeholder { display: flex; align-items: center; justify-content: center; color: var(--gray-400); height: 160px; background: var(--gray-100); }
  .option-zoom-btn { position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; background: rgba(255,255,255,0.9); border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
  .option-card:hover .option-zoom-btn { opacity: 1; }
  .option-zoom-btn:hover { background: white; }
  .option-content { padding: 1rem; }
  .option-name { font-weight: 600; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
  .option-info-btn { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--gray-300); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--gray-500); flex-shrink: 0; }
  .option-info-btn:hover { border-color: var(--gs-red); color: var(--gs-red); }
  .option-description { font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.75rem; }
  .option-price { font-size: 1rem; font-weight: 600; }
  .option-check { position: absolute; top: 0.75rem; right: 0.75rem; width: 28px; height: 28px; background: var(--gs-red); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  
  /* Wizard Footer */
  .wizard-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap; gap: 1rem; }
  .wizard-footer-left { display: flex; align-items: center; gap: 1.5rem; }
  .wizard-total-label { color: var(--gray-500); font-size: 0.875rem; }
  .wizard-total-value { font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; }
  .btn-save-draft { font-size: 0.8125rem; }
  .btn-save-draft.saved { color: var(--success); border-color: var(--success); }
  
  /* Overview */
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
  
  /* Modals */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
  .info-modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
  .info-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-200); }
  .info-modal-header h3 { margin: 0; font-size: 1.125rem; }
  .modal-close { background: none; border: none; cursor: pointer; color: var(--gray-500); padding: 4px; }
  .modal-close:hover { color: var(--gray-700); }
  .info-modal-content { padding: 1.5rem; overflow-y: auto; color: var(--gray-600); line-height: 1.7; }
  .info-modal-content p { margin: 0 0 0.75rem; }
  .info-modal-content p:last-child { margin-bottom: 0; }
  
  .image-modal-overlay { background: rgba(0,0,0,0.85); }
  .image-modal { position: relative; max-width: 90vw; max-height: 90vh; }
  .image-modal img { max-width: 100%; max-height: 85vh; object-fit: contain; border-radius: 8px; }
  .image-modal-close { position: absolute; top: -40px; right: 0; background: none; border: none; color: white; cursor: pointer; padding: 8px; }
  .image-modal-close:hover { color: var(--gray-300); }
  
  .animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  @media (max-width: 768px) {
    .wizard-page-header { padding: 0.75rem 1rem; }
    .wizard-apartment-info { display: none; }
    .wizard-container { padding: 1rem; }
    .intro-container { padding: 1rem; }
    .intro-content { padding: 1.5rem; }
    .intro-content h1 { font-size: 1.5rem; }
    .wizard-footer { flex-direction: column; align-items: stretch; }
    .wizard-footer-left { justify-content: space-between; }
    .wizard-footer > div:last-child { display: flex; }
    .wizard-footer .btn { flex: 1; }
  }
`

export default Customer
