export interface TruckItem {
  id: number
  title: string
  preview?: string
  imgUrl?: string
  description?: string
  weight?: number
  price?: number
  length?: number
  width?: number
  height?: number
  year?: number
  status?: string
}

export interface TrucksQuery {
  title?: string
  minPrice?: number
  maxPrice?: number
  yearFrom?: number
  yearTo?: number
}

export async function fetchTrucks(query: TrucksQuery): Promise<TruckItem[]> {
  const params = new URLSearchParams()
  if (query.title) params.set('title', query.title)
  if (query.minPrice != null) params.set('minPrice', String(query.minPrice))
  if (query.maxPrice != null) params.set('maxPrice', String(query.maxPrice))
  if (query.yearFrom != null) params.set('yearFrom', String(query.yearFrom))
  if (query.yearTo != null) params.set('yearTo', String(query.yearTo))

  try {
    const res = await fetch(`/api/trucks?${params.toString()}`)
    if (!res.ok) throw new Error('Bad status')
    return await res.json()
  } catch {
    return filterTrucksMock(query)
  }
}

export async function fetchTruckById(id: number | string): Promise<TruckItem | null> {
  try {
    const res = await fetch(`/api/trucks/${id}`)
    if (!res.ok) throw new Error('Bad status')
    return await res.json()
  } catch {
    return TRUCKS_MOCK.find(s => String(s.id) === String(id)) || null
  }
}

// Mock data with MinIO-style URLs
export const TRUCKS_MOCK: TruckItem[] = [
  {
    id: 1,
    title: 'Volvo FH',
    price: 5200000,
    year: 2022,
    imgUrl: 'http://localhost:9000/trucks/truck1.png',
    weight: 8000,
    length: 6.5,
    width: 2.5,
    height: 3.2,
    status: 'available',
    description: 'Дальнемагистральный тягач.'
  },
  {
    id: 2,
    title: 'Scania R',
    price: 6100000,
    year: 2021,
    imgUrl: 'http://localhost:9000/trucks/truck3.png',
    weight: 7900,
    length: 6.3,
    width: 2.5,
    height: 3.1,
    status: 'service',
    description: 'Надежный и экономичный.'
  },
]

function filterTrucksMock(q: TrucksQuery): TruckItem[] {
  return TRUCKS_MOCK.filter(t => {
    if (q.title && !t.title.toLowerCase().includes(q.title.toLowerCase())) return false
    if (q.minPrice != null && (t.price ?? 0) < q.minPrice) return false
    if (q.maxPrice != null && (t.price ?? 0) > q.maxPrice) return false
    if (q.yearFrom != null && (t.year ?? 0) < q.yearFrom) return false
    if (q.yearTo != null && (t.year ?? 0) > q.yearTo) return false
    return true
  })
}


