import type { Station, StationFilters, FuelPrice } from '~/types/station'

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
      const params: Record<string, string> = {}
      if (userLocation.value) {
        params.lat = String(userLocation.value.lat)
        params.lng = String(userLocation.value.lng)
        params.radius = String(filters.value.maxDistance)
      }
      stations.value = await $fetch<Station[]>('/api/stations', { params })
    }
    catch (e) {
      error.value = 'Failed to load stations. Please try again.'
      console.error(e)
    }
    finally {
      loading.value = false
    }
  }

  async function submitPrice(stationId: string, fuelType: FuelPrice['type'], price: number) {
    await $fetch(`/api/stations/${encodeURIComponent(stationId)}/prices`, {
      method: 'POST',
      body: { fuelType, price },
    })
    // Re-fetch to update displayed prices
    await fetchStations()
  }

  const stationsWithDistance = computed(() => {
    if (!userLocation.value) return stations.value
    return stations.value.map((s) => {
      // If server already calculated distance, use it; otherwise compute client-side
      if (s.distanceKm !== undefined) return s
      return {
        ...s,
        distanceKm: haversineDistance(userLocation.value!.lat, userLocation.value!.lng, s.lat, s.lng),
      }
    })
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
    [...new Set(stations.value.map(s => s.brand).filter(Boolean))].sort(),
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
    submitPrice,
  }
}
