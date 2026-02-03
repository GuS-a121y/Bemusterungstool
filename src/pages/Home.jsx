import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home as HomeIcon, Lock, ArrowRight, AlertCircle } from 'lucide-react'

function Home() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!code.trim()) {
      setError('Bitte geben Sie Ihren Zugangscode ein.')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/validate-code?code=${encodeURIComponent(code.trim().toUpperCase())}`)
      const data = await response.json()
      
      if (data.valid) {
        navigate(`/kunde/${code.trim().toUpperCase()}`)
      } else {
        setError('Ungültiger Zugangscode. Bitte überprüfen Sie Ihre Eingabe.')
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Logo und Header */}
        <div className="home-header">
          <img src="/logo.jpg" alt="G&S Gruppe" className="home-logo" />
          <div className="gs-accent-line" style={{ width: '80px', margin: '1.5rem auto' }} />
          <h1>Bemusterungsportal</h1>
          <p className="home-subtitle">
            Wählen Sie die Ausstattung für Ihre neue Wohnung ganz bequem online aus.
          </p>
        </div>

        {/* Code-Eingabe Card */}
        <div className="home-card">
          <div className="home-card-icon">
            <Lock size={32} />
          </div>
          <h2>Zugang zur Bemusterung</h2>
          <p>
            Geben Sie den Zugangscode ein, den Sie von uns erhalten haben.
          </p>

          <form onSubmit={handleSubmit} className="home-form">
            <div className="form-group">
              <input
                type="text"
                className="form-input code-input"
                placeholder="z.B. WPS-A1B2C3"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError('')
                }}
                maxLength={20}
                autoComplete="off"
                autoFocus
              />
              {error && (
                <div className="form-error mt-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Wird überprüft...
                </>
              ) : (
                <>
                  Zur Bemusterung
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="home-hint">
            Sie haben noch keinen Zugangscode erhalten? 
            <br />
            Kontaktieren Sie uns unter <a href="mailto:info@gs-gruppe.de">info@gs-gruppe.de</a>
          </p>
        </div>

        {/* Footer */}
        <footer className="home-footer">
          <div className="home-footer-links">
            <a href="https://www.g-s-wohnbau.de/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutz</a>
            <span>|</span>
            <a href="https://www.g-s-wohnbau.de/impressum" target="_blank" rel="noopener noreferrer">Impressum</a>
          </div>
          <p>© {new Date().getFullYear()} G&S Gruppe. Alle Rechte vorbehalten.</p>
        </footer>
      </div>

      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          position: relative;
        }

        .home-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: var(--gs-red);
        }

        .home-container {
          width: 100%;
          max-width: 460px;
        }

        .home-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .home-logo {
          height: 60px;
          margin-bottom: 0.5rem;
        }

        .home-header h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .home-subtitle {
          color: var(--gray-600);
          font-size: 1rem;
        }

        .home-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          box-shadow: var(--shadow-lg);
          text-align: center;
        }

        .home-card-icon {
          width: 64px;
          height: 64px;
          background: var(--gray-100);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          color: var(--gs-red);
        }

        .home-card h2 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .home-card > p {
          color: var(--gray-500);
          font-size: 0.9375rem;
          margin-bottom: 1.5rem;
        }

        .home-form {
          margin-bottom: 1.5rem;
        }

        .code-input {
          text-align: center;
          font-family: 'Space Grotesk', monospace;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .code-input::placeholder {
          font-size: 1rem;
          letter-spacing: normal;
          text-transform: none;
        }

        .home-hint {
          font-size: 0.8125rem;
          color: var(--gray-500);
          line-height: 1.6;
        }

        .home-hint a {
          color: var(--gs-red);
          font-weight: 500;
        }

        .home-admin-link {
          text-align: center;
          margin-top: 1.5rem;
        }

        .home-footer {
          text-align: center;
          margin-top: 2rem;
          color: var(--gray-400);
          font-size: 0.8125rem;
        }

        .home-footer-links {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .home-footer-links a {
          color: var(--gray-500);
          text-decoration: none;
        }

        .home-footer-links a:hover {
          color: var(--gs-red);
        }

        .home-footer-links span {
          color: var(--gray-300);
        }

        @media (max-width: 480px) {
          .home-page {
            padding: 1rem;
            align-items: flex-start;
            padding-top: 2rem;
          }

          .home-card {
            padding: 1.5rem;
          }

          .home-logo {
            height: 50px;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
