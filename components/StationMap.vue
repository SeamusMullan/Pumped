<template>
  <div class="h-full w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm" style="min-height: 400px">
    <div ref="mapContainer" class="h-full w-full" />
  </div>
</template>

<script setup lang="ts">
import type { Station } from '~/types/station'

const props = defineProps<{
  stations: Station[]
  center?: [number, number]
  zoom?: number
  selectedStationId?: string | null
}>()

const emit = defineEmits<{
  selectStation: [station: Station]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: InstanceType<typeof import('leaflet').Map> | null = null
let L: typeof import('leaflet') | null = null
let markerLayer: InstanceType<typeof import('leaflet').LayerGroup> | null = null

onMounted(async () => {
  if (!mapContainer.value) return

  L = (await import('leaflet')).default

  // @ts-expect-error _getIconUrl is not in types
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  const centerCoords: [number, number] = props.center ?? [53.3498, -6.2603]
  map = L.map(mapContainer.value).setView(centerCoords, props.zoom ?? 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  renderMarkers()
})

function renderMarkers() {
  if (!map || !L || !markerLayer) return
  markerLayer.clearLayers()

  props.stations.forEach((station) => {
    const lowestPrice = station.prices.length
      ? station.prices.reduce((min, p) => (p.price < min ? p.price : min), Infinity)
      : null

    const priceText = lowestPrice !== null
      ? `<p class="mt-1 font-bold text-green-600">From €${lowestPrice.toFixed(3)}/L</p>`
      : `<p class="mt-1 text-gray-400 italic text-xs">No prices reported</p>`

    const marker = L.marker([station.lat, station.lng])
      .addTo(markerLayer)
      .bindPopup(
        `<div class="text-sm">
          <p class="font-semibold text-gray-900">${station.name}</p>
          <p class="text-gray-500 mt-0.5">${station.address || station.city}</p>
          ${priceText}
        </div>`,
        { maxWidth: 220 },
      )

    marker.on('click', () => {
      emit('selectStation', station)
    })
  })
}

watch(() => props.stations, () => {
  renderMarkers()
}, { deep: true })

watch(() => props.center, (newCenter) => {
  if (map && newCenter) {
    map.setView(newCenter, props.zoom ?? 13)
  }
})
</script>
