<template>
  <aside class="card p-4 flex flex-col gap-5" aria-label="Filter stations">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-gray-900">Filters</h2>
      <button class="text-xs text-green-600 hover:underline" @click="resetFilters">Reset</button>
    </div>

    <!-- Fuel type -->
    <fieldset>
      <legend class="text-sm font-medium text-gray-700 mb-2">Fuel type</legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="option in fuelTypeOptions"
          :key="option.value"
          class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition"
          :class="filters.fuelType === option.value
            ? 'bg-green-600 border-green-600 text-white'
            : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'"
        >
          <input
            v-model="filters.fuelType"
            type="radio"
            :value="option.value"
            class="sr-only"
            :aria-label="option.label"
          >
          {{ option.label }}
        </label>
      </div>
    </fieldset>

    <!-- Max distance -->
    <div>
      <label for="max-distance" class="text-sm font-medium text-gray-700 flex justify-between">
        <span>Max distance</span>
        <span class="text-green-600 font-semibold">{{ filters.maxDistance }} km</span>
      </label>
      <input
        id="max-distance"
        v-model.number="filters.maxDistance"
        type="range"
        min="1"
        max="50"
        step="1"
        class="mt-2 w-full accent-green-600"
        aria-valuemin="1"
        :aria-valuenow="filters.maxDistance"
        aria-valuemax="50"
      >
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>1 km</span>
        <span>50 km</span>
      </div>
    </div>

    <!-- Sort -->
    <div>
      <label for="sort-by" class="text-sm font-medium text-gray-700 block mb-1.5">Sort by</label>
      <div class="flex gap-2">
        <select
          id="sort-by"
          v-model="filters.sortBy"
          class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="price">Price</option>
          <option value="distance">Distance</option>
          <option value="name">Name</option>
        </select>
        <button
          class="btn-secondary px-3"
          :aria-label="filters.sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'"
          @click="filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path v-if="filters.sortOrder === 'asc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Brand filter -->
    <div v-if="availableBrands.length">
      <p class="text-sm font-medium text-gray-700 mb-2">Brand</p>
      <div class="flex flex-col gap-1.5">
        <label
          v-for="brand in availableBrands"
          :key="brand"
          class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
        >
          <input
            v-model="filters.brands"
            type="checkbox"
            :value="brand"
            class="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          >
          {{ brand }}
        </label>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { StationFilters } from '~/types/station'

const props = defineProps<{
  modelValue: StationFilters
  availableBrands: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: StationFilters]
}>()

const filters = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const fuelTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'unleaded', label: 'Unleaded' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'premium', label: 'Premium' },
  { value: 'e10', label: 'E10' },
  { value: 'lpg', label: 'LPG' },
] as const

function resetFilters() {
  emit('update:modelValue', {
    fuelType: 'all',
    maxDistance: 10,
    maxPrice: null,
    brands: [],
    sortBy: 'price',
    sortOrder: 'asc',
  })
}
</script>
