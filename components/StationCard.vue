<template>
  <article
    class="card p-4 flex flex-col gap-3 cursor-pointer transition hover:shadow-md"
    :class="{ 'ring-2 ring-green-500': selected }"
    role="button"
    :aria-pressed="selected"
    :aria-label="`${station.name}, ${lowestPrice !== null ? '€' + lowestPrice.toFixed(3) + ' per litre' : 'no price available'}`"
    @click="$emit('select', station)"
  >
    <!-- Header row -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-semibold text-gray-900 leading-tight">{{ station.name }}</h3>
        <p class="text-xs text-gray-500 mt-0.5">{{ station.address }}, {{ station.city }}</p>
      </div>
      <span v-if="lowestPrice !== null" class="badge-price shrink-0">
        €{{ lowestPrice.toFixed(3) }}
      </span>
    </div>

    <!-- Prices -->
    <div v-if="station.prices.length">
      <ul class="flex flex-wrap gap-2" aria-label="Fuel prices">
        <li
          v-for="fp in station.prices"
          :key="fp.type"
          class="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs"
        >
          <span class="font-medium capitalize text-gray-700">{{ FUEL_LABELS[fp.type] }}</span>
          <span class="font-bold text-gray-900">€{{ fp.price.toFixed(3) }}</span>
        </li>
      </ul>
      <p v-if="priceAge" class="text-xs text-gray-400 mt-1">Updated {{ priceAge }}</p>
    </div>
    <p v-else class="text-xs text-gray-400 italic">No prices yet — be the first to report!</p>

    <!-- Footer row -->
    <div class="flex items-center justify-between text-xs text-gray-400">
      <div class="flex items-center gap-1">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span v-if="station.distanceKm !== undefined">{{ station.distanceKm.toFixed(1) }} km away</span>
        <span v-else>{{ station.city }}</span>
      </div>
      <span v-if="station.openingHours">{{ station.openingHours }}</span>
    </div>

    <!-- Amenities -->
    <div v-if="station.amenities.length" class="flex flex-wrap gap-1.5" aria-label="Amenities">
      <span
        v-for="amenity in station.amenities"
        :key="amenity"
        class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
      >
        {{ AMENITY_LABELS[amenity] ?? amenity }}
      </span>
    </div>

    <!-- Update price toggle -->
    <button
      class="text-xs text-green-600 hover:text-green-700 font-medium self-start"
      @click.stop="showForm = !showForm"
    >
      {{ showForm ? 'Cancel' : 'Update price' }}
    </button>

    <!-- Price submission form -->
    <PriceSubmitForm
      v-if="showForm"
      :station-id="station.id"
      @submitted="onPriceSubmitted"
      @click.stop
    />
  </article>
</template>

<script setup lang="ts">
import type { Station } from '~/types/station'

const props = defineProps<{
  station: Station
  selected?: boolean
}>()

defineEmits<{
  select: [station: Station]
  priceSubmitted: []
}>()

const showForm = ref(false)

const FUEL_LABELS: Record<string, string> = {
  unleaded: 'Unleaded',
  diesel: 'Diesel',
  premium: 'Premium',
  e10: 'E10',
  lpg: 'LPG',
}

const AMENITY_LABELS: Record<string, string> = {
  'car-wash': '🚗 Car wash',
  'shop': '🛒 Shop',
  'atm': '💳 ATM',
  'coffee': '☕ Coffee',
  'restaurant': '🍴 Food',
  'toilets': '🚻 Toilets',
}

const lowestPrice = computed(() => {
  if (!props.station.prices.length) return null
  return Math.min(...props.station.prices.map(p => p.price))
})

const priceAge = computed(() => {
  if (!props.station.prices.length) return null
  const dates = props.station.prices.map(p => new Date(p.updatedAt).getTime()).filter(t => !isNaN(t))
  if (!dates.length) return null
  const latest = Math.max(...dates)
  const diffMs = Date.now() - latest
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
})

function onPriceSubmitted() {
  showForm.value = false
}
</script>
