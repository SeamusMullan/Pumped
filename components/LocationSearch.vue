<template>
  <div class="relative">
    <div class="flex gap-2">
      <!-- Search input -->
      <div class="relative flex-1">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition"
          placeholder="Search a town, city, or address…"
          autocomplete="off"
          @input="onInput"
          @focus="showDropdown = suggestions.length > 0"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="selectHighlighted"
          @keydown.escape="closeDropdown"
        >
        <!-- Clear button -->
        <button
          v-if="searchQuery"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search button -->
      <button
        class="btn-primary gap-2 shrink-0"
        :disabled="!searchQuery.trim() || searching"
        @click="triggerSearch"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="hidden sm:inline">Search</span>
      </button>
    </div>

    <!-- Current location label -->
    <p v-if="locationLabel" class="mt-1.5 text-xs text-gray-500">
      Showing stations near <span class="font-medium text-gray-700">{{ locationLabel }}</span>
    </p>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && suggestions.length"
      class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
    >
      <ul role="listbox">
        <li
          v-for="(suggestion, i) in suggestions"
          :key="suggestion.placeId"
          role="option"
          :aria-selected="i === highlightedIndex"
          class="flex items-start gap-3 px-3 py-2.5 text-sm cursor-pointer transition"
          :class="i === highlightedIndex ? 'bg-green-50 text-green-900' : 'text-gray-700 hover:bg-gray-50'"
          @mousedown.prevent="selectSuggestion(suggestion)"
          @mouseenter="highlightedIndex = i"
        >
          <svg class="h-4 w-4 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <div class="min-w-0">
            <p class="font-medium truncate">{{ suggestion.name }}</p>
            <p v-if="suggestion.description" class="text-xs text-gray-500 truncate">{{ suggestion.description }}</p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Loading indicator for search -->
    <div v-if="searching" class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg p-3">
      <p class="text-sm text-gray-400 text-center">Searching…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Suggestion {
  placeId: string
  name: string
  description: string
}

defineProps<{
  locationLabel?: string
}>()

const emit = defineEmits<{
  'select-location': [location: { lat: number; lng: number; name: string }]
}>()

const inputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const suggestions = ref<Suggestion[]>([])
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const searching = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)

  const q = searchQuery.value.trim()
  if (q.length < 2) {
    suggestions.value = []
    showDropdown.value = false
    return
  }

  debounceTimer = setTimeout(() => fetchSuggestions(q), 300)
}

async function fetchSuggestions(q: string) {
  searching.value = true
  try {
    suggestions.value = await $fetch<Suggestion[]>('/api/geocode', { params: { q } })
    highlightedIndex.value = -1
    showDropdown.value = suggestions.value.length > 0
  }
  catch {
    suggestions.value = []
  }
  finally {
    searching.value = false
  }
}

async function selectSuggestion(suggestion: Suggestion) {
  searchQuery.value = suggestion.name
  showDropdown.value = false

  try {
    const location = await $fetch<{ lat: number; lng: number; name: string }>(`/api/geocode/${suggestion.placeId}`)
    emit('select-location', {
      lat: location.lat,
      lng: location.lng,
      name: suggestion.description ? `${suggestion.name}, ${suggestion.description}` : suggestion.name,
    })
  }
  catch (err) {
    console.error('Failed to resolve location:', err)
  }
}

function highlightNext() {
  if (highlightedIndex.value < suggestions.value.length - 1) {
    highlightedIndex.value++
  }
}

function highlightPrev() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    selectSuggestion(suggestions.value[highlightedIndex.value])
  }
  else {
    triggerSearch()
  }
}

async function triggerSearch() {
  const q = searchQuery.value.trim()
  if (q.length < 2) return

  // If we have suggestions, select the first one
  if (suggestions.value.length > 0) {
    await selectSuggestion(suggestions.value[0])
    return
  }

  // Otherwise fetch suggestions first, then select the top result
  await fetchSuggestions(q)
  if (suggestions.value.length > 0) {
    await selectSuggestion(suggestions.value[0])
  }
}

function closeDropdown() {
  showDropdown.value = false
}

function clearSearch() {
  searchQuery.value = ''
  suggestions.value = []
  showDropdown.value = false
  inputRef.value?.focus()
}
</script>
