import type { Project, Apartment, Category, Option, Selection, DashboardStats } from './types'

// Mock Data für lokale Entwicklung
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Wohnpark Sonnenhügel',
    description: 'Modernes Wohnprojekt mit 24 Einheiten',
    status: 'aktiv',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Residenz am Park',
    description: 'Exklusive Eigentumswohnungen',
    status: 'aktiv',
    startDate: '2024-03-01',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
]

const mockApartments: Apartment[] = [
  {
    id: '1',
    projectId: '1',
    number: 'WE 01',
    floor: 'EG',
    size: 85,
    rooms: 3,
    customerName: 'Familie Müller',
    customerEmail: 'mueller@example.com',
    accessCode: 'ABC123',
    status: 'abgeschlossen',
    completedAt: '2024-02-01T14:30:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '2',
    projectId: '1',
    number: 'WE 02',
    floor: 'EG',
    size: 72,
    rooms: 2,
    customerName: 'Herr Schmidt',
    customerEmail: 'schmidt@example.com',
    accessCode: 'DEF456',
    status: 'in_bearbeitung',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    projectId: '1',
    number: 'WE 03',
    floor: '1. OG',
    size: 95,
    rooms: 4,
    customerName: 'Familie Weber',
    customerEmail: 'weber@example.com',
    accessCode: 'GHI789',
    status: 'offen',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
]

const mockCategories: Category[] = [
  { id: '1', projectId: '1', name: 'Bodenbeläge', description: 'Wählen Sie Ihren Bodenbelag', sortOrder: 1, createdAt: '2024-01-15T00:00:00Z' },
  { id: '2', projectId: '1', name: 'Sanitär', description: 'Sanitärausstattung für Bad und WC', sortOrder: 2, createdAt: '2024-01-15T00:00:00Z' },
  { id: '3', projectId: '1', name: 'Elektroinstallation', description: 'Zusätzliche Steckdosen und Schalter', sortOrder: 3, createdAt: '2024-01-15T00:00:00Z' },
  { id: '4', projectId: '1', name: 'Innentüren', description: 'Türen und Zargen', sortOrder: 4, createdAt: '2024-01-15T00:00:00Z' },
]

const mockOptions: Option[] = [
  // Bodenbeläge
  { id: '1', categoryId: '1', name: 'Eiche Natur', description: 'Parkettboden Eiche, naturgeölt', price: 0, isDefault: true, sortOrder: 1, createdAt: '2024-01-15T00:00:00Z' },
  { id: '2', categoryId: '1', name: 'Eiche Geräuchert', description: 'Parkettboden Eiche, geräuchert und geölt', price: 1200, isDefault: false, sortOrder: 2, createdAt: '2024-01-15T00:00:00Z' },
  { id: '3', categoryId: '1', name: 'Nussbaum', description: 'Parkettboden Amerikanischer Nussbaum', price: 2500, isDefault: false, sortOrder: 3, createdAt: '2024-01-15T00:00:00Z' },
  // Sanitär
  { id: '4', categoryId: '2', name: 'Standard Weiß', description: 'Keramik in klassischem Weiß', price: 0, isDefault: true, sortOrder: 1, createdAt: '2024-01-15T00:00:00Z' },
  { id: '5', categoryId: '2', name: 'Premium Linie', description: 'Hochwertige Designkeramik', price: 1800, isDefault: false, sortOrder: 2, createdAt: '2024-01-15T00:00:00Z' },
  { id: '6', categoryId: '2', name: 'Wellness Paket', description: 'Inkl. Regendusche und Handtuchheizkörper', price: 3500, isDefault: false, sortOrder: 3, createdAt: '2024-01-15T00:00:00Z' },
  // Elektro
  { id: '7', categoryId: '3', name: 'Basis', description: 'Standardausstattung lt. Baubeschreibung', price: 0, isDefault: true, sortOrder: 1, createdAt: '2024-01-15T00:00:00Z' },
  { id: '8', categoryId: '3', name: 'Komfort', description: '+5 Doppelsteckdosen, Netzwerkanschlüsse', price: 650, isDefault: false, sortOrder: 2, createdAt: '2024-01-15T00:00:00Z' },
  { id: '9', categoryId: '3', name: 'Smart Home', description: 'KNX-Vorbereitung inkl. Verkabelung', price: 4200, isDefault: false, sortOrder: 3, createdAt: '2024-01-15T00:00:00Z' },
  // Innentüren
  { id: '10', categoryId: '4', name: 'Weiß Lack', description: 'Türen weiß lackiert, Standardzarge', price: 0, isDefault: true, sortOrder: 1, createdAt: '2024-01-15T00:00:00Z' },
  { id: '11', categoryId: '4', name: 'Eiche Furniert', description: 'Echtholzfurnier Eiche, Holzzarge', price: 1400, isDefault: false, sortOrder: 2, createdAt: '2024-01-15T00:00:00Z' },
  { id: '12', categoryId: '4', name: 'Glas', description: 'Türen mit Glasausschnitt', price: 900, isDefault: false, sortOrder: 3, createdAt: '2024-01-15T00:00:00Z' },
]

const mockSelections: Selection[] = [
  { id: '1', apartmentId: '1', categoryId: '1', optionId: '2', createdAt: '2024-02-01T14:00:00Z' },
  { id: '2', apartmentId: '1', categoryId: '2', optionId: '5', createdAt: '2024-02-01T14:10:00Z' },
  { id: '3', apartmentId: '1', categoryId: '3', optionId: '8', createdAt: '2024-02-01T14:20:00Z' },
  { id: '4', apartmentId: '1', categoryId: '4', optionId: '10', createdAt: '2024-02-01T14:30:00Z' },
]

// Simulierte API-Verzögerung
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// API Client
export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    await delay(300)
    return mockProjects
  },

  async getProject(id: string): Promise<Project | null> {
    await delay(200)
    return mockProjects.find(p => p.id === id) || null
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    await delay(300)
    const newProject: Project = {
      id: String(mockProjects.length + 1),
      name: data.name || 'Neues Projekt',
      description: data.description,
      status: 'entwurf',
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockProjects.push(newProject)
    return newProject
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
    await delay(300)
    const index = mockProjects.findIndex(p => p.id === id)
    if (index === -1) return null
    mockProjects[index] = { ...mockProjects[index], ...data, updatedAt: new Date().toISOString() }
    return mockProjects[index]
  },

  async deleteProject(id: string): Promise<boolean> {
    await delay(300)
    const index = mockProjects.findIndex(p => p.id === id)
    if (index === -1) return false
    mockProjects.splice(index, 1)
    return true
  },

  // Apartments
  async getApartments(projectId: string): Promise<Apartment[]> {
    await delay(300)
    return mockApartments.filter(a => a.projectId === projectId)
  },

  async getApartment(id: string): Promise<Apartment | null> {
    await delay(200)
    return mockApartments.find(a => a.id === id) || null
  },

  async getApartmentByCode(code: string): Promise<Apartment | null> {
    await delay(200)
    return mockApartments.find(a => a.accessCode === code) || null
  },

  async createApartment(data: Partial<Apartment>): Promise<Apartment> {
    await delay(300)
    const newApartment: Apartment = {
      id: String(mockApartments.length + 1),
      projectId: data.projectId || '1',
      number: data.number || 'Neue WE',
      floor: data.floor,
      size: data.size,
      rooms: data.rooms,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      accessCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'offen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockApartments.push(newApartment)
    return newApartment
  },

  async updateApartment(id: string, data: Partial<Apartment>): Promise<Apartment | null> {
    await delay(300)
    const index = mockApartments.findIndex(a => a.id === id)
    if (index === -1) return null
    mockApartments[index] = { ...mockApartments[index], ...data, updatedAt: new Date().toISOString() }
    return mockApartments[index]
  },

  // Categories
  async getCategories(projectId: string): Promise<Category[]> {
    await delay(300)
    return mockCategories.filter(c => c.projectId === projectId).sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    await delay(300)
    const projectCategories = mockCategories.filter(c => c.projectId === data.projectId)
    const newCategory: Category = {
      id: String(mockCategories.length + 1),
      projectId: data.projectId || '1',
      name: data.name || 'Neue Kategorie',
      description: data.description,
      sortOrder: projectCategories.length + 1,
      createdAt: new Date().toISOString(),
    }
    mockCategories.push(newCategory)
    return newCategory
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    await delay(300)
    const index = mockCategories.findIndex(c => c.id === id)
    if (index === -1) return null
    mockCategories[index] = { ...mockCategories[index], ...data }
    return mockCategories[index]
  },

  async deleteCategory(id: string): Promise<boolean> {
    await delay(300)
    const index = mockCategories.findIndex(c => c.id === id)
    if (index === -1) return false
    mockCategories.splice(index, 1)
    return true
  },

  // Options
  async getOptions(categoryId: string): Promise<Option[]> {
    await delay(300)
    return mockOptions.filter(o => o.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async getOptionsByProject(projectId: string): Promise<Option[]> {
    await delay(300)
    const categoryIds = mockCategories.filter(c => c.projectId === projectId).map(c => c.id)
    return mockOptions.filter(o => categoryIds.includes(o.categoryId))
  },

  async createOption(data: Partial<Option>): Promise<Option> {
    await delay(300)
    const categoryOptions = mockOptions.filter(o => o.categoryId === data.categoryId)
    const newOption: Option = {
      id: String(mockOptions.length + 1),
      categoryId: data.categoryId || '1',
      name: data.name || 'Neue Option',
      description: data.description,
      price: data.price || 0,
      imageUrl: data.imageUrl,
      isDefault: data.isDefault || false,
      sortOrder: categoryOptions.length + 1,
      createdAt: new Date().toISOString(),
    }
    mockOptions.push(newOption)
    return newOption
  },

  async updateOption(id: string, data: Partial<Option>): Promise<Option | null> {
    await delay(300)
    const index = mockOptions.findIndex(o => o.id === id)
    if (index === -1) return null
    mockOptions[index] = { ...mockOptions[index], ...data }
    return mockOptions[index]
  },

  async deleteOption(id: string): Promise<boolean> {
    await delay(300)
    const index = mockOptions.findIndex(o => o.id === id)
    if (index === -1) return false
    mockOptions.splice(index, 1)
    return true
  },

  // Selections
  async getSelections(apartmentId: string): Promise<Selection[]> {
    await delay(300)
    return mockSelections.filter(s => s.apartmentId === apartmentId)
  },

  async saveSelections(apartmentId: string, selections: { categoryId: string; optionId: string }[]): Promise<boolean> {
    await delay(500)
    // Remove existing selections
    const toRemove = mockSelections.filter(s => s.apartmentId === apartmentId).map(s => s.id)
    toRemove.forEach(id => {
      const index = mockSelections.findIndex(s => s.id === id)
      if (index !== -1) mockSelections.splice(index, 1)
    })
    // Add new selections
    selections.forEach((sel, i) => {
      mockSelections.push({
        id: String(Date.now() + i),
        apartmentId,
        categoryId: sel.categoryId,
        optionId: sel.optionId,
        createdAt: new Date().toISOString(),
      })
    })
    // Update apartment status
    const apartmentIndex = mockApartments.findIndex(a => a.id === apartmentId)
    if (apartmentIndex !== -1) {
      mockApartments[apartmentIndex].status = 'abgeschlossen'
      mockApartments[apartmentIndex].completedAt = new Date().toISOString()
    }
    return true
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(300)
    const completedApartments = mockApartments.filter(a => a.status === 'abgeschlossen')
    let totalRevenue = 0
    completedApartments.forEach(apt => {
      const selections = mockSelections.filter(s => s.apartmentId === apt.id)
      selections.forEach(sel => {
        const option = mockOptions.find(o => o.id === sel.optionId)
        if (option) totalRevenue += option.price
      })
    })
    return {
      totalProjects: mockProjects.length,
      activeProjects: mockProjects.filter(p => p.status === 'aktiv').length,
      totalApartments: mockApartments.length,
      completedBemusterungen: completedApartments.length,
      pendingBemusterungen: mockApartments.filter(a => a.status !== 'abgeschlossen').length,
      totalRevenue,
    }
  },

  // Auth
  async adminLogin(email: string, password: string): Promise<{ success: boolean; user?: { id: string; email: string; name: string } }> {
    await delay(500)
    // Demo Login
    if (email === 'admin@gs-gruppe.de' && password === 'demo123') {
      return { success: true, user: { id: '1', email, name: 'Administrator' } }
    }
    return { success: false }
  },
}

// Helper functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'aktiv':
    case 'abgeschlossen':
      return 'bg-green-100 text-green-800'
    case 'in_bearbeitung':
      return 'bg-yellow-100 text-yellow-800'
    case 'offen':
    case 'entwurf':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'aktiv':
      return 'Aktiv'
    case 'abgeschlossen':
      return 'Abgeschlossen'
    case 'in_bearbeitung':
      return 'In Bearbeitung'
    case 'offen':
      return 'Offen'
    case 'entwurf':
      return 'Entwurf'
    default:
      return status
  }
}
