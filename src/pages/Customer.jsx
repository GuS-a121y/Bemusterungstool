import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Home, AlertCircle, CheckCircle2, Loader2, FileText, ArrowRight, Info, X, ZoomIn, Save, Download } from 'lucide-react'

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

// Galerie Modal (Raster-Ansicht aller Bilder)
const GalleryModal = ({ isOpen, onClose, images, title }) => {
  const [selectedIdx, setSelectedIdx] = useState(0)
  if (!isOpen || !images || images.length === 0) return null

  return (
    <div className="modal-overlay image-modal-overlay" onClick={onClose}>
      <div className="gallery-modal" onClick={e => e.stopPropagation()}>
        <button className="gallery-modal-close" onClick={onClose}><X size={24} /></button>
        <h3 style={{ margin: '0 0 1rem', color: 'white', fontSize: '1.125rem' }}>{title}</h3>
        {/* Großes Bild */}
        <div className="gallery-main">
          <img src={images[selectedIdx]} alt={`${title} ${selectedIdx + 1}`} />
          {images.length > 1 && (
            <>
              <button className="gallery-nav gallery-nav-left" onClick={() => setSelectedIdx(i => (i - 1 + images.length) % images.length)}><ChevronLeft size={24} /></button>
              <button className="gallery-nav gallery-nav-right" onClick={() => setSelectedIdx(i => (i + 1) % images.length)}><ChevronRight size={24} /></button>
            </>
          )}
        </div>
        {/* Thumbnail-Raster */}
        {images.length > 1 && (
          <div className="gallery-thumbs">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${title} ${i + 1}`}
                className={`gallery-thumb ${i === selectedIdx ? 'active' : ''}`}
                onClick={() => setSelectedIdx(i)}
              />
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginTop: 8 }}>
          {selectedIdx + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}

// Auto-Slider für Optionskarten
const ImageSlider = ({ images, onOpen, height = 160 }) => {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (images.length <= 1) return
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % images.length)
    }, 3000)
    return () => clearInterval(intervalRef.current)
  }, [images.length])

  const handleMouseEnter = () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  const handleMouseLeave = () => {
    if (images.length <= 1) return
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % images.length)
    }, 3000)
  }

  if (images.length === 0) {
    return <div className="option-image option-image-placeholder" style={{ height }}><span>Kein Bild</span></div>
  }

  return (
    <div
      className="option-image-wrapper"
      style={{ position: 'relative', height, overflow: 'hidden' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt=""
          className="option-image"
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: i === current ? 1 : 0,
            transition: 'opacity 0.5s ease'
          }}
        />
      ))}
      {/* Dots */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setCurrent(i) }}
              style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === current ? 'white' : 'rgba(255,255,255,0.5)', transition: 'background 0.2s', padding: 0 }}
            />
          ))}
        </div>
      )}
      <button
        className="option-zoom-btn"
        onClick={e => { e.stopPropagation(); onOpen() }}
      >
        <ZoomIn size={16} />
      </button>
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
  const [currentStep, setCurrentStep] = useState(-1)
  const [selections, setSelections] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [downloadFailed, setDownloadFailed] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  
  // Modal States
  const [infoModal, setInfoModal] = useState({ open: false, title: '', content: '' })
  const [galleryModal, setGalleryModal] = useState({ open: false, images: [], title: '' })

  // Alle Bilder für eine Option sammeln (Hauptbild + zusätzliche)
  const getAllImages = (option) => {
    const imgs = []
    if (option.image_url) imgs.push(option.image_url)
    if (option.additional_images && option.additional_images.length > 0) {
      option.additional_images.forEach(img => imgs.push(img.image_url))
    }
    return imgs
  }

  // Bild als Base64 laden (Helper)
  const fetchImageBase64 = async (url) => {
    try {
      const r = await fetch(url)
      if (!r.ok) return null
      const blob = await r.blob()
      return await new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsDataURL(blob) })
    } catch { return null }
  }

  // PDF generieren und herunterladen
  const downloadPDF = async () => {
    try {
      const res = await fetch(`/api/pdf?code=${code.toUpperCase()}&format=json`)
      if (!res.ok) throw new Error('Daten konnten nicht geladen werden')
      const d = await res.json()

      // jsPDF laden
      const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s)
      })
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')

      const { jsPDF } = window.jspdf
      const pdf = new jsPDF('p', 'mm', 'a4')
      const W = pdf.internal.pageSize.getWidth()   // 210
      const H = pdf.internal.pageSize.getHeight()   // 297
      const M = 14 // Margin
      const U = W - M * 2 // Usable width
      let y = M
      const R = 227, G = 6, B = 19 // G&S Rot

      const newPage = () => { pdf.addPage(); y = M }
      const check = (n) => { if (y + n > H - M) { newPage(); return true } return false }
      const fmtEuro = (p) => p === 0 ? 'Inklusive' : (p > 0 ? '+' : '') + p.toLocaleString('de-DE') + ' \u20ac'

      // --- Alle Bilder vorladen ---
      const imgCache = {}
      const logoB64 = await fetchImageBase64('/logo.jpg')
      for (const sel of d.selections) {
        for (const url of (sel.option_images || [])) {
          if (!imgCache[url]) imgCache[url] = await fetchImageBase64(url)
        }
      }

      // ============================
      // SEITE 1: HEADER
      // ============================

      // Roter Balken oben
      pdf.setFillColor(R, G, B)
      pdf.rect(0, 0, W, 4, 'F')
      y = 10

      // Logo links
      if (logoB64) {
        try { pdf.addImage(logoB64, 'JPEG', M, y, 38, 15) } catch {}
      }
      // Firmeninfo rechts
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(130)
      pdf.text('G&S Gruppe  \u00b7  Felix-Wankel-Stra\u00dfe 29  \u00b7  53881 Euskirchen', W - M, y + 5, { align: 'right' })
      pdf.text('www.g-s-wohnbau.de', W - M, y + 10, { align: 'right' })

      y += 22

      // Trennlinie
      pdf.setDrawColor(229, 231, 235)
      pdf.setLineWidth(0.3)
      pdf.line(M, y, W - M, y)
      y += 8

      // Titel
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22)
      pdf.setTextColor(R, G, B)
      pdf.text('Bemusterungsprotokoll', M, y)
      y += 5
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(100)
      pdf.text(`Verbindliche Ausstattungsauswahl  \u00b7  ${d.date}`, M, y)
      y += 10

      // Info-Boxen (2x2 Grid)
      const bW = (U - 5) / 2
      const bH = 20
      const box = (x, yy, lbl, val, sub) => {
        pdf.setFillColor(248, 249, 250)
        pdf.setDrawColor(229, 231, 235)
        pdf.roundedRect(x, yy, bW, bH, 1.5, 1.5, 'FD')
        // Roter Akzent links
        pdf.setFillColor(R, G, B)
        pdf.rect(x, yy + 3, 0.8, bH - 6, 'F')
        pdf.setFontSize(6.5)
        pdf.setTextColor(130)
        pdf.setFont('helvetica', 'normal')
        pdf.text(lbl.toUpperCase(), x + 5, yy + 5.5)
        pdf.setFontSize(10.5)
        pdf.setTextColor(30)
        pdf.setFont('helvetica', 'bold')
        const valTxt = String(val || '-')
        const valLines = pdf.splitTextToSize(valTxt, bW - 10)
        pdf.text(valLines[0], x + 5, yy + 12)
        if (sub) {
          pdf.setFontSize(7.5)
          pdf.setTextColor(120)
          pdf.setFont('helvetica', 'normal')
          pdf.text(String(sub), x + 5, yy + 17)
        }
      }
      box(M, y, 'Projekt', d.project_name, d.project_address || '')
      const aptSub = [d.floor, d.size_sqm ? d.size_sqm + ' m\u00b2' : '', d.rooms ? d.rooms + ' Zi.' : ''].filter(Boolean).join(' \u00b7 ')
      box(M + bW + 5, y, 'Wohnung', d.apartment_name, aptSub)
      y += bH + 4
      box(M, y, 'Kunde', d.customer_name || '-', '')
      box(M + bW + 5, y, 'Referenz / Datum', d.access_code, `${d.date}, ${d.time} Uhr`)
      y += bH + 10

      // ============================
      // ÜBERSICHTS-TABELLE (kompakt)
      // ============================
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(50)
      pdf.text('\u00dcbersicht der gew\u00e4hlten Ausstattung', M, y)
      y += 6

      // Tabellenkopf
      pdf.setFillColor(R, G, B)
      pdf.rect(M, y, U, 7, 'F')
      pdf.setFontSize(7.5)
      pdf.setTextColor(255)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Kategorie', M + 4, y + 5)
      pdf.text('Gew\u00e4hlte Option', M + U * 0.3, y + 5)
      pdf.text('Mehrpreis', W - M - 4, y + 5, { align: 'right' })
      y += 7

      for (let i = 0; i < d.selections.length; i++) {
        const s = d.selections[i]
        check(9)
        if (i % 2 === 0) { pdf.setFillColor(250, 250, 252); pdf.rect(M, y, U, 8, 'F') }
        pdf.setDrawColor(235, 235, 240); pdf.setLineWidth(0.15); pdf.line(M, y + 8, W - M, y + 8)
        pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(70)
        pdf.text(s.category_name, M + 4, y + 5.5)
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(50)
        const optTxt = pdf.splitTextToSize(s.option_name, U * 0.4)
        pdf.text(optTxt[0], M + U * 0.3, y + 5.5)
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30)
        pdf.text(fmtEuro(s.option_price), W - M - 4, y + 5.5, { align: 'right' })
        y += 8
      }

      // Gesamtzeile
      check(12)
      pdf.setFillColor(R, G, B)
      pdf.rect(M, y, U, 10, 'F')
      pdf.setFontSize(9.5); pdf.setTextColor(255); pdf.setFont('helvetica', 'bold')
      pdf.text('Gesamter Mehrpreis', M + 4, y + 7)
      pdf.setFontSize(11)
      pdf.text(fmtEuro(d.total_price), W - M - 4, y + 7, { align: 'right' })
      y += 16

      // ============================
      // DETAIL-KARTEN pro Auswahl
      // ============================
      check(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(50)
      pdf.text('Detailansicht der Auswahl', M, y)
      y += 7

      for (const sel of d.selections) {
        const imgs = (sel.option_images || []).map(u => imgCache[u]).filter(Boolean)
        const desc = sel.option_description || ''
        const info = sel.option_info_text || ''
        const hasText = desc || info

        // H\u00f6he sch\u00e4tzen
        let cardH = 14 // Header + Padding
        if (hasText) {
          pdf.setFontSize(8)
          const allText = [desc, info].filter(Boolean).join('\n')
          const lines = pdf.splitTextToSize(allText, imgs.length > 0 ? U - 42 : U - 10)
          cardH += Math.min(lines.length, 12) * 3.2 + 4
        }
        if (imgs.length > 0) {
          const imgRowH = imgs.length <= 3 ? 26 : 26
          if (!hasText) cardH += imgRowH + 4
          else cardH = Math.max(cardH, 14 + imgRowH + 4)
        }
        cardH = Math.max(cardH, 18)

        check(cardH + 4)

        // Karten-Hintergrund
        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(225, 228, 232)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(M, y, U, cardH, 2, 2, 'FD')

        // Roter Top-Balken
        pdf.setFillColor(R, G, B)
        pdf.rect(M, y, U, 0.6, 'F')

        // Kategorie-Label + Preis Header
        const hY = y + 5.5
        pdf.setFontSize(6.5); pdf.setTextColor(R, G, B); pdf.setFont('helvetica', 'bold')
        pdf.text(sel.category_name.toUpperCase(), M + 5, hY)
        pdf.setFontSize(10); pdf.setTextColor(30); pdf.setFont('helvetica', 'bold')
        pdf.text(fmtEuro(sel.option_price), W - M - 5, hY, { align: 'right' })

        // Optionsname
        pdf.setFontSize(11); pdf.setTextColor(20); pdf.setFont('helvetica', 'bold')
        const nameLines = pdf.splitTextToSize(sel.option_name, U - 50)
        pdf.text(nameLines[0], M + 5, hY + 6)
        let contentY = hY + 10

        // Bilder (rechts oder unten, je nach Anzahl)
        let textW = U - 10
        if (imgs.length > 0) {
          const imgSize = 18
          const gap = 2.5
          const maxPerRow = Math.min(imgs.length, 3)
          const imgsW = maxPerRow * imgSize + (maxPerRow - 1) * gap
          const imgX = W - M - 5 - imgsW
          const imgY = contentY - 2
          textW = imgX - M - 8

          for (let i = 0; i < Math.min(imgs.length, 6); i++) {
            const row = Math.floor(i / 3)
            const col = i % 3
            try {
              pdf.addImage(imgs[i], 'JPEG', imgX + col * (imgSize + gap), imgY + row * (imgSize + gap), imgSize, imgSize)
            } catch {}
          }
        }

        // Beschreibung
        if (desc) {
          pdf.setFontSize(8); pdf.setTextColor(60); pdf.setFont('helvetica', 'normal')
          const descLines = pdf.splitTextToSize(desc, textW)
          pdf.text(descLines.slice(0, 4), M + 5, contentY)
          contentY += Math.min(descLines.length, 4) * 3.2 + 2
        }

        // Info-Text (Langbeschreibung)
        if (info) {
          pdf.setFontSize(7.5); pdf.setTextColor(100); pdf.setFont('helvetica', 'italic')
          const infoLines = pdf.splitTextToSize(info, textW)
          pdf.text(infoLines.slice(0, 8), M + 5, contentY)
        }

        y += cardH + 3
      }

      // ============================
      // RECHTSHINWEIS
      // ============================
      check(24)
      y += 4
      pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.3); pdf.line(M, y, W - M, y)
      y += 5
      pdf.setFontSize(7); pdf.setTextColor(140); pdf.setFont('helvetica', 'normal')
      const notice = `Dieses Bemusterungsprotokoll wurde am ${d.date} um ${d.time} Uhr maschinell erstellt und elektronisch \u00fcber das Bemusterungsportal der G&S Gruppe \u00fcbermittelt. Das Dokument ist ohne Unterschrift rechtsg\u00fcltig, da die Auswahl durch den Kunden aktiv und verbindlich im Online-Portal best\u00e4tigt wurde.`
      const nLines = pdf.splitTextToSize(notice, U)
      pdf.text(nLines, M, y)
      y += nLines.length * 2.8 + 3
      pdf.setFontSize(6.5); pdf.setTextColor(180)
      pdf.text(`Ref: ${d.access_code}  \u00b7  G&S Gruppe  \u00b7  Seite 1/${pdf.internal.getNumberOfPages()}`, W / 2, y, { align: 'center' })

      // Seitenzahlen auf allen Seiten
      const totalPages = pdf.internal.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p)
        pdf.setFontSize(6.5); pdf.setTextColor(180); pdf.setFont('helvetica', 'normal')
        pdf.text(`Seite ${p} von ${totalPages}`, W / 2, H - 6, { align: 'center' })
        // Roter Balken unten
        pdf.setFillColor(R, G, B)
        pdf.rect(0, H - 3, W, 3, 'F')
      }

      pdf.save(`Bemusterungsprotokoll_${d.apartment_name || 'Auswahl'}.pdf`)
      return true
    } catch (err) {
      console.error('PDF-Generierung fehlgeschlagen:', err)
      return false
    }
  }

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

        if (data.apartment.status === 'abgeschlossen') {
          setSelections(data.selections || {})
          setIsCompleted(true)
          setCurrentStep(data.categories.length)
          setLoading(false)
          return
        }

        const defaultSelections = {}
        if (data.selections) {
          Object.entries(data.selections).forEach(([catId, optId]) => {
            if (optId < 0) {
              defaultSelections[catId] = `custom_${Math.abs(optId)}`
            } else {
              defaultSelections[catId] = optId
            }
          })
        }
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

  const calculateTotal = () => {
    let total = 0
    Object.entries(selections).forEach(([catId, optionId]) => {
      const category = categories.find(c => c.id === parseInt(catId))
      const option = category?.options.find(o => o.id === optionId || o.id === `custom_${optionId}` || `custom_${o.custom_id}` === optionId)
      if (option) total += option.price
    })
    return total
  }

  const handleSelect = (categoryId, optionId) => {
    setSelections(prev => ({ ...prev, [categoryId]: optionId }))
    setDraftSaved(false)
  }

  const nextStep = () => { if (currentStep < categories.length) setCurrentStep(prev => prev + 1) }
  const prevStep = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1) }
  const startBemusterung = () => setCurrentStep(0)

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      const res = await fetch(`/api/customer/${code.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections, draft: true })
      })
      if (res.ok) { setDraftSaved(true); setTimeout(() => setDraftSaved(false), 3000) }
      else { const data = await res.json(); alert(data.error || 'Fehler beim Speichern') }
    } catch (err) { alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.') }
    finally { setIsSavingDraft(false) }
  }

  // Final absenden mit Auto-Download
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
        // Auto-Download des PDF starten
        setPdfGenerating(true)
        const downloaded = await downloadPDF()
        setPdfGenerating(false)
        if (!downloaded) {
          setDownloadFailed(true)
        }
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

  const formatPrice = (price) => {
    if (price === 0) return 'Inklusive'
    if (price > 0) return `+${price.toLocaleString('de-DE')} €`
    return `${price.toLocaleString('de-DE')} €`
  }

  const openInfoModal = (title, content) => { setInfoModal({ open: true, title, content }) }
  const openGallery = (option) => {
    const imgs = getAllImages(option)
    if (imgs.length > 0) setGalleryModal({ open: true, images: imgs, title: option.name })
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
            {pdfGenerating ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                <Loader2 size={20} className="animate-spin" />
                <span>PDF wird erstellt und heruntergeladen...</span>
              </div>
            ) : (
              <p style={{ color: 'var(--gray-500)', maxWidth: 500, margin: '0 auto 1.5rem' }}>
                Vielen Dank! Ihre Auswahl wurde verbindlich übermittelt.
                {downloadFailed
                  ? ' Der automatische Download konnte nicht gestartet werden. Bitte laden Sie das Protokoll manuell herunter.'
                  : ' Ihr Bemusterungsprotokoll wurde als PDF heruntergeladen.'}
              </p>
            )}
            
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

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" disabled={pdfGenerating} onClick={async () => { 
                setPdfGenerating(true)
                const ok = await downloadPDF()
                setPdfGenerating(false)
                if (!ok) window.open(`/api/pdf?code=${code.toUpperCase()}`, '_blank') 
              }}>
                {pdfGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} PDF herunterladen
              </button>
              <button className="btn btn-outline" onClick={() => window.open(`/api/pdf?code=${code.toUpperCase()}`, '_blank')}>
                <FileText size={18} /> Im Browser öffnen
              </button>
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
            <div className="intro-image"><img src={apartment.project.image} alt={apartment.project.name} /></div>
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
                  const allImgs = getAllImages(option)
                  return (
                    <div
                      key={option.id}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(currentCategory.id, option.id)}
                    >
                      <ImageSlider
                        images={allImgs}
                        onOpen={() => openGallery(option)}
                        height={160}
                      />
                      <div className="option-content">
                        <div className="option-name">
                          {option.name}
                          {allImgs.length > 1 && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', fontWeight: 400 }}>
                              {allImgs.length} Bilder
                            </span>
                          )}
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
      <GalleryModal
        isOpen={galleryModal.open}
        onClose={() => setGalleryModal({ ...galleryModal, open: false })}
        images={galleryModal.images}
        title={galleryModal.title}
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
  
  .customer-footer { background: white; border-top: 1px solid var(--gray-200); padding: 1.5rem 2rem; text-align: center; }
  .footer-links { display: flex; justify-content: center; gap: 1rem; margin-bottom: 0.5rem; }
  .footer-links a { color: var(--gray-600); text-decoration: none; font-size: 0.875rem; }
  .footer-links a:hover { color: var(--gs-red); }
  .footer-links span { color: var(--gray-300); }
  .footer-copyright { color: var(--gray-400); font-size: 0.8125rem; }
  
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
  .option-image-wrapper { position: relative; }
  .option-image { width: 100%; height: 160px; object-fit: cover; background: var(--gray-100); display: block; }
  .option-image-placeholder { display: flex; align-items: center; justify-content: center; color: var(--gray-400); height: 160px; background: var(--gray-100); }
  .option-zoom-btn { position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; background: rgba(255,255,255,0.9); border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; z-index: 2; }
  .option-card:hover .option-zoom-btn { opacity: 1; }
  .option-zoom-btn:hover { background: white; }
  .option-content { padding: 1rem; }
  .option-name { font-weight: 600; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
  .option-info-btn { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--gray-300); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--gray-500); flex-shrink: 0; }
  .option-info-btn:hover { border-color: var(--gs-red); color: var(--gs-red); }
  .option-description { font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.75rem; }
  .option-price { font-size: 1rem; font-weight: 600; }
  .option-check { position: absolute; top: 0.75rem; right: 0.75rem; width: 28px; height: 28px; background: var(--gs-red); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 3; }
  
  .wizard-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap; gap: 1rem; }
  .wizard-footer-left { display: flex; align-items: center; gap: 1.5rem; }
  .wizard-total-label { color: var(--gray-500); font-size: 0.875rem; }
  .wizard-total-value { font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; }
  .btn-save-draft { font-size: 0.8125rem; }
  .btn-save-draft.saved { color: var(--success); border-color: var(--success); }
  
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
  
  /* Gallery Modal */
  .gallery-modal { max-width: 90vw; max-height: 95vh; display: flex; flex-direction: column; align-items: center; position: relative; }
  .gallery-modal-close { position: absolute; top: -10px; right: -10px; background: rgba(255,255,255,0.15); border: none; color: white; cursor: pointer; padding: 8px; border-radius: 50%; z-index: 10; }
  .gallery-modal-close:hover { background: rgba(255,255,255,0.3); }
  .gallery-main { position: relative; max-width: 100%; max-height: 65vh; margin-bottom: 12px; }
  .gallery-main img { max-width: 80vw; max-height: 65vh; object-fit: contain; border-radius: 8px; display: block; }
  .gallery-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); border: none; color: white; cursor: pointer; padding: 8px; border-radius: 50%; }
  .gallery-nav:hover { background: rgba(0,0,0,0.7); }
  .gallery-nav-left { left: -20px; }
  .gallery-nav-right { right: -20px; }
  .gallery-thumbs { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; max-width: 80vw; }
  .gallery-thumb { width: 60px; height: 45px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid transparent; opacity: 0.6; transition: all 0.2s; }
  .gallery-thumb:hover { opacity: 0.9; }
  .gallery-thumb.active { border-color: white; opacity: 1; }
  
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
  .image-modal-overlay { background: rgba(0,0,0,0.85); }
  .info-modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
  .info-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-200); }
  .info-modal-header h3 { margin: 0; font-size: 1.125rem; }
  .modal-close { background: none; border: none; cursor: pointer; color: var(--gray-500); padding: 4px; }
  .modal-close:hover { color: var(--gray-700); }
  .info-modal-content { padding: 1.5rem; overflow-y: auto; color: var(--gray-600); line-height: 1.7; }
  .info-modal-content p { margin: 0 0 0.75rem; }
  .info-modal-content p:last-child { margin-bottom: 0; }
  
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
    .gallery-main img { max-width: 95vw; }
    .gallery-nav-left { left: 5px; }
    .gallery-nav-right { right: 5px; }
  }
`

export default Customer
