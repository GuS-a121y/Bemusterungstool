import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import { 
  LayoutDashboard, 
  FolderKanban, 
  LogOut, 
  Menu, 
  X,
  Building2
} from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Übersicht', href: '/admin', icon: LayoutDashboard },
  { name: 'Projekte', href: '/admin/projects', icon: FolderKanban },
]

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gs-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gs-gray-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gs-gray-200">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="GS Gruppe" className="h-10 w-auto" />
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gs-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-gs-red text-white' 
                    : 'text-gs-gray-700 hover:bg-gs-gray-100'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gs-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gs-red text-white flex items-center justify-center text-sm font-medium">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gs-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-gs-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gs-gray-700 hover:bg-gs-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gs-gray-200 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gs-gray-100 mr-4"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-gs-gray-600">
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Bemusterungstool</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
