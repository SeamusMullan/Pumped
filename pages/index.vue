<template>
  <div>
    <!-- Hero / location bar -->
    <section class="bg-white border-b border-gray-200">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div class="flex-1">
            <h1 class="text-xl font-bold text-gray-900">Find Cheap Petrol Near You</h1>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ filteredStations.length }} station{{ filteredStations.length !== 1 ? 's' : '' }} found
              <template v-if="userLocation"> within {{ filters.maxDistance }} km</template>
            </p>
          </div>
          <button
            class="btn-primary gap-2"
            :disabled="geo.loading.value"
            @click="locateMe"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ geo.loading.value ? 'Locating…' : 'Near me' }}</span>
          </button>
        </div>

        <!-- Geo error -->
        <p v-if="geo.error.value" class="mt-2 text-sm text-red-600" role="alert">
          {{ geo.error.value }}
        </p>
      </div>
    </section>

    <!-- Main content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <!-- Mobile: filter toggle -->
      <div class="lg:hidden mb-3">
        <button class="btn-secondary w-full gap-2" @click="filtersOpen = !filtersOpen">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span>{{ filtersOpen ? 'Hide filters' : 'Show filters' }}</span>
        </button>
      </div>

      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Sidebar filters -->
        <div class="lg:w-72 shrink-0" :class="{ 'hidden lg:block': !filtersOpen }">
          <FilterPanel v-model="filters" :available-brands="availableBrands" />
        </div>

        <!-- Map + list -->
        <div class="flex-1 min-w-0 flex flex-col gap-4">
          <!-- Map -->
          <div class="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style="height: 400px; min-height: 300px">
            <ClientOnly fallback-tag="div">
              <template #fallback>
                <div class="h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
                  Loading map…
                </div>
              </template>
              <StationMap
                :stations="filteredStations"
                :center="mapCenter"
                @select-station="selectedStation = $event"
              />
            </ClientOnly>
          </div>

          <!-- Station list -->
          <div>
            <h2 class="sr-only">Station list</h2>

            <!-- Loading -->
            <div v-if="loading" class="text-center py-10 text-gray-400">
              <svg class="mx-auto h-8 w-8 animate-spin text-green-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p class="mt-2 text-sm">Loading stations…</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
              {{ error }}
            </div>

            <!-- Empty state -->
            <div v-else-if="!filteredStations.length" class="text-center py-10 text-gray-400">
              <p class="text-sm">No stations match your filters.</p>
              <button class="mt-2 text-sm text-green-600 hover:underline" @click="resetFilters">Reset filters</button>
            </div>

            <!-- Station cards -->
            <ul v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Petrol stations">
              <li v-for="station in filteredStations" :key="station.id">
                <StationCard
                  :station="station"
                  :selected="selectedStation?.id === station.id"
                  @select="selectedStation = $event"
                />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const geo = useGeolocation()
const {
  filteredStations,
  availableBrands,
  filters,
  loading,
  error,
  userLocation,
  fetchStations,
  setUserLocation,
} = useStations()

const filtersOpen = ref(false)
const selectedStation = ref(null)

const mapCenter = computed<[number, number]>(() =>
  userLocation.value
    ? [userLocation.value.lat, userLocation.value.lng]
    : [53.3498, -6.2603],
)

const seoTitle = 'Pumped – Find Cheap Petrol & Diesel Near You'
const seoDescription = 'Compare real-time petrol and diesel prices at stations near you. Filter by fuel type, distance, and price to save money every fill-up.'

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
})

async function locateMe() {
  await geo.locate()
  if (geo.lat.value && geo.lng.value) {
    setUserLocation(geo.lat.value, geo.lng.value)
  }
}

function resetFilters() {
  filters.value = {
    fuelType: 'all',
    maxDistance: 10,
    maxPrice: null,
    brands: [],
    sortBy: 'price',
    sortOrder: 'asc',
  }
}

onMounted(() => {
  fetchStations()
})
</script>
