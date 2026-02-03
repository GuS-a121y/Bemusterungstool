// Projekt
export interface Project {
  id: string
  name: string
  description?: string
  status: 'aktiv' | 'abgeschlossen' | 'entwurf'
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// Wohnung
export interface Apartment {
  id: string
  projectId: string
  number: string
  floor?: string
  size?: number
  rooms?: number
  customerName?: string
  customerEmail?: string
  accessCode: string
  status: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Bemusterungskategorie
export interface Category {
  id: string
  projectId: string
  name: string
  description?: string
  sortOrder: number
  createdAt: string
}

// Ausstattungsoption
export interface Option {
  id: string
  categoryId: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isDefault: boolean
  sortOrder: number
  createdAt: string
}

// Kundenwahl
export interface Selection {
  id: string
  apartmentId: string
  categoryId: string
  optionId: string
  createdAt: string
}

// Bemusterungsergebnis mit allen Details
export interface SelectionWithDetails extends Selection {
  category: Category
  option: Option
}

// Admin User
export interface AdminUser {
  id: string
  email: string
  passwordHash: string
  name: string
  createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Dashboard Statistics
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalApartments: number
  completedBemusterungen: number
  pendingBemusterungen: number
  totalRevenue: number
}

// Export Data
export interface ExportRow {
  projektName: string
  wohnungNummer: string
  kundenName: string
  kategorie: string
  gewaehlteOption: string
  mehrpreis: number
  abgeschlossenAm: string
}
