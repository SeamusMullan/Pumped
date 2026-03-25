export interface FuelPrice {
  type: 'unleaded' | 'diesel' | 'premium' | 'e10' | 'lpg'
  price: number
  updatedAt: string
}

export interface Station {
  id: string
  name: string
  brand: string
  address: string
  city: string
  postcode: string
  lat: number
  lng: number
  prices: FuelPrice[]
  amenities: string[]
  openingHours?: string
  phone?: string
  distanceKm?: number
}

export interface StationFilters {
  fuelType: FuelPrice['type'] | 'all'
  maxDistance: number
  maxPrice: number | null
  brands: string[]
  sortBy: 'price' | 'distance' | 'name'
  sortOrder: 'asc' | 'desc'
}
