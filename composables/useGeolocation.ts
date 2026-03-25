export function useGeolocation() {
  const lat = ref<number | null>(null)
  const lng = ref<number | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function locate(): Promise<{ lat: number; lng: number } | null> {
    if (!import.meta.client) return Promise.resolve(null)
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser.'
      return Promise.resolve(null)
    }

    loading.value = true
    error.value = null

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lat.value = position.coords.latitude
          lng.value = position.coords.longitude
          loading.value = false
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
        },
        (err) => {
          loading.value = false
          switch (err.code) {
            case err.PERMISSION_DENIED:
              error.value = 'Location permission denied. Enable location access to find nearby stations.'
              break
            case err.POSITION_UNAVAILABLE:
              error.value = 'Location information is unavailable.'
              break
            case err.TIMEOUT:
              error.value = 'Location request timed out.'
              break
            default:
              error.value = 'An unknown error occurred while retrieving location.'
          }
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    })
  }

  return { lat, lng, error, loading, locate }
}
