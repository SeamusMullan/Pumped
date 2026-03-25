<template>
  <footer class="bg-white border-t border-gray-200 mt-auto">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>© {{ year }} Pumped. Find cheap fuel near you.</p>
        <nav class="flex gap-4" aria-label="Footer navigation">
          <NuxtLink to="/about" class="hover:text-green-600 transition">About</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-green-600 transition">Privacy</NuxtLink>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="hover:text-green-600 transition">Map data © OSM</a>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
