import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'

// Pages
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import ApartmentDetail from './pages/ApartmentDetail'
import CustomerAccess from './pages/CustomerAccess'
import CustomerWizard from './pages/CustomerWizard'

// Types
export interface User {
  id: string
  email: string
  role: 'admin' | 'customer'
  apartmentId?: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('bemusterung_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = (user: User) => {
    setUser(user)
    localStorage.setItem('bemusterung_user', JSON.stringify(user))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bemusterung_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'customer' }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-red"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProjectList />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="projects/:projectId/apartments/:apartmentId" element={<ApartmentDetail />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/bemusterung/:accessCode" element={<CustomerAccess />} />
          <Route
            path="/bemusterung/:accessCode/wizard"
            element={
              <ProtectedRoute role="customer">
                <CustomerWizard />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
