<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl text-green-600 hover:text-green-700 transition">
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 22V10l9-8 9 8v12H3z" />
            <path d="M9 22V12h6v10" />
            <circle cx="18" cy="6" r="2" />
            <path d="M18 8v4" />
          </svg>
          <span>Pumped</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600" aria-label="Main navigation">
          <NuxtLink to="/" class="hover:text-green-600 transition" active-class="text-green-600 font-semibold">Map</NuxtLink>
          <NuxtLink to="/about" class="hover:text-green-600 transition" active-class="text-green-600 font-semibold">About</NuxtLink>
        </nav>

        <!-- Mobile menu toggle -->
        <button
          class="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <svg v-if="!menuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile nav -->
      <nav
        v-if="menuOpen"
        class="sm:hidden border-t border-gray-100 py-3 flex flex-col gap-1"
        aria-label="Mobile navigation"
      >
        <NuxtLink
          to="/"
          class="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
          active-class="bg-green-50 text-green-600"
          @click="menuOpen = false"
        >
          Map
        </NuxtLink>
        <NuxtLink
          to="/about"
          class="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
          active-class="bg-green-50 text-green-600"
          @click="menuOpen = false"
        >
          About
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const menuOpen = ref(false)
</script>
