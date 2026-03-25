import type { Station, StationFilters, FuelPrice } from '~/types/station'

const MOCK_STATIONS: Station[] = [
  {
    id: '1',
    name: 'Shell Westmoreland Street',
    brand: 'Shell',
    address: '14 Westmoreland Street',
    city: 'Dublin',
    postcode: 'D02 XH78',
    lat: 53.3454,
    lng: -6.2595,
    prices: [
      { type: 'unleaded', price: 1.789, updatedAt: new Date().toISOString() },
      { type: 'diesel', price: 1.699, updatedAt: new Date().toISOString() },
    ],
    amenities: ['car-wash', 'shop', 'atm'],
    openingHours: '24/7',
  },
  {
    id: '2',
    name: 'BP O\'Connell Street',
    brand: 'BP',
    address: '42 O\'Connell Street',
    city: 'Dublin',
    postcode: 'D01 F5P2',
    lat: 53.3498,
    lng: -6.2603,
    prices: [
      { type: 'unleaded', price: 1.769, updatedAt: new Date().toISOString() },
      { type: 'diesel', price: 1.679, updatedAt: new Date().toISOString() },
      { type: 'premium', price: 1.899, updatedAt: new Date().toISOString() },
    ],
    amenities: ['shop', 'coffee'],
    openingHours: '06:00–22:00',
  },
  {
    id: '3',
    name: 'Applegreen Rathmines',
    brand: 'Applegreen',
    address: '8 Rathmines Road Lower',
    city: 'Dublin',
    postcode: 'D06 W8X7',
    lat: 53.3273,
    lng: -6.2644,
    prices: [
      { type: 'unleaded', price: 1.749, updatedAt: new Date().toISOString() },
      { type: 'diesel', price: 1.659, updatedAt: new Date().toISOString() },
      { type: 'e10', price: 1.729, updatedAt: new Date().toISOString() },
    ],
    amenities: ['shop', 'car-wash', 'coffee', 'atm'],
    openingHours: '24/7',
  },
  {
    id: '4',
    name: 'Texaco Ranelagh',
    brand: 'Texaco',
    address: '3 Ranelagh Road',
    city: 'Dublin',
    postcode: 'D06 Y2V9',
    lat: 53.3297,
    lng: -6.2533,
    prices: [
      { type: 'unleaded', price: 1.799, updatedAt: new Date().toISOString() },
      { type: 'diesel', price: 1.709, updatedAt: new Date().toISOString() },
    ],
    amenities: ['shop'],
    openingHours: '07:00–21:00',
  },
  {
    id: '5',
    name: 'Circle K Ballsbridge',
    brand: 'Circle K',
    address: '22 Pembroke Road',
    city: 'Dublin',
    postcode: 'D04 EP20',
    lat: 53.3319,
    lng: -6.2368,
    prices: [
      { type: 'unleaded', price: 1.759, updatedAt: new Date().toISOString() },
      { type: 'diesel', price: 1.669, updatedAt: new Date().toISOString() },
      { type: 'premium', price: 1.889, updatedAt: new Date().toISOString() },
      { type: 'lpg', price: 0.989, updatedAt: new Date().toISOString() },
    ],
    amenities: ['shop', 'coffee', 'car-wash', 'atm'],
    openingHours: '24/7',
  },
]

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useStations() {
  const stations = ref<Station[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filters = ref<StationFilters>({
    fuelType: 'all',
    maxDistance: 10,
    maxPrice: null,
    brands: [],
    sortBy: 'price',
    sortOrder: 'asc',
  })

  const userLocation = ref<{ lat: number; lng: number } | null>(null)

  async function fetchStations() {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300))
      stations.value = MOCK_STATIONS
    }
    catch (e) {
      error.value = 'Failed to load stations. Please try again.'
      console.error(e)
    }
    finally {
      loading.value = false
    }
  }

  const stationsWithDistance = computed(() => {
    if (!userLocation.value) return stations.value
    return stations.value.map(s => ({
      ...s,
      distanceKm: haversineDistance(userLocation.value!.lat, userLocation.value!.lng, s.lat, s.lng),
    }))
  })

  const filteredStations = computed(() => {
    let result = stationsWithDistance.value

    // Filter by fuel type
    if (filters.value.fuelType !== 'all') {
      result = result.filter(s =>
        s.prices.some(p => p.type === filters.value.fuelType),
      )
    }

    // Filter by distance
    if (userLocation.value) {
      result = result.filter(s => (s.distanceKm ?? Infinity) <= filters.value.maxDistance)
    }

    // Filter by max price
    if (filters.value.maxPrice !== null) {
      result = result.filter(s =>
        s.prices.some(p =>
          (filters.value.fuelType === 'all' || p.type === filters.value.fuelType)
          && p.price <= filters.value.maxPrice!,
        ),
      )
    }

    // Filter by brands
    if (filters.value.brands.length > 0) {
      result = result.filter(s => filters.value.brands.includes(s.brand))
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      if (filters.value.sortBy === 'price') {
        const getPrice = (s: Station): number => {
          const fuelType = filters.value.fuelType === 'all' ? 'unleaded' : filters.value.fuelType
          return s.prices.find(p => p.type === fuelType)?.price ?? Infinity
        }
        aVal = getPrice(a)
        bVal = getPrice(b)
      }
      else if (filters.value.sortBy === 'distance') {
        aVal = a.distanceKm ?? Infinity
        bVal = b.distanceKm ?? Infinity
      }
      else {
        aVal = a.name
        bVal = b.name
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return filters.value.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return filters.value.sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })

    return result
  })

  const availableBrands = computed(() =>
    [...new Set(stations.value.map(s => s.brand))].sort(),
  )

  function getPriceForType(station: Station, fuelType: FuelPrice['type'] | 'all'): number | null {
    const type = fuelType === 'all' ? 'unleaded' : fuelType
    return station.prices.find(p => p.type === type)?.price ?? null
  }

  function setUserLocation(lat: number, lng: number) {
    userLocation.value = { lat, lng }
  }

  return {
    stations,
    filteredStations,
    availableBrands,
    filters,
    loading,
    error,
    userLocation,
    fetchStations,
    setUserLocation,
    getPriceForType,
  }
}
