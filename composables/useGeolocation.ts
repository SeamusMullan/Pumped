export function useGeolocation() {
  const lat = ref<number | null>(null)
  const lng = ref<number | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function locate() {
    if (!import.meta.client) return
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser.'
      return
    }

    loading.value = true
    error.value = null

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat.value = position.coords.latitude
        lng.value = position.coords.longitude
        loading.value = false
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
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return { lat, lng, error, loading, locate }
}
