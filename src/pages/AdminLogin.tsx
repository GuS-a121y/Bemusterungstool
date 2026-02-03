import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { api } from '../lib/api'
import { LogIn, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await api.adminLogin(email, password)
      if (result.success && result.user) {
        login({ id: result.user.id, email: result.user.email, role: 'admin' })
        navigate('/admin')
      } else {
        setError('Ungültige Anmeldedaten')
      }
    } catch {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gs-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="GS Gruppe" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gs-gray-900">Bemusterungstool</h1>
          <p className="text-gs-gray-600 mt-1">Admin-Bereich</p>
        </div>

        {/* Login Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gs-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@gs-gruppe.de"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gs-gray-700 mb-1">
                Passwort
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Anmelden...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Anmelden
                </span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-4 border-t border-gs-gray-200">
            <p className="text-xs text-gs-gray-500 text-center mb-2">Demo-Zugangsdaten:</p>
            <div className="bg-gs-gray-50 rounded-lg p-3 text-sm text-gs-gray-600">
              <p><span className="font-medium">E-Mail:</span> admin@gs-gruppe.de</p>
              <p><span className="font-medium">Passwort:</span> demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
