<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">About Pumped</h1>

    <div class="prose prose-gray max-w-none">
      <p class="text-gray-600 text-lg leading-relaxed mb-4">
        <strong>Pumped</strong> is a free, open-source tool for finding and comparing petrol and diesel prices at stations near you.
      </p>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">How it works</h2>
      <ul class="list-disc list-inside space-y-2 text-gray-600">
        <li>View petrol stations on an interactive map powered by OpenStreetMap</li>
        <li>Filter results by fuel type, distance, and price</li>
        <li>Sort by cheapest price or nearest station</li>
        <li>Enable location access for personalised results</li>
      </ul>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">Technology</h2>
      <p class="text-gray-600 mb-2">Built with:</p>
      <ul class="list-disc list-inside space-y-2 text-gray-600">
        <li><a href="https://nuxt.com" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Nuxt 3</a> – Vue meta-framework with SSR and SEO built-in</li>
        <li><a href="https://vuejs.org" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Vue 3</a> – Progressive JavaScript framework</li>
        <li><a href="https://bun.sh" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Bun</a> – Fast JavaScript runtime and package manager</li>
        <li><a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Leaflet</a> – Open-source interactive maps</li>
        <li><a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Tailwind CSS</a> – Utility-first CSS framework</li>
      </ul>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">Contributing</h2>
      <p class="text-gray-600">
        Pumped is open source. Contributions are welcome via
        <a href="https://github.com/SeamusMullan/Pumped" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">GitHub</a>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'About Pumped – Fuel Price Comparison',
  description: 'Learn about Pumped, the free tool for finding and comparing petrol station prices near you.',
  ogTitle: 'About Pumped – Fuel Price Comparison',
  ogDescription: 'Learn about Pumped, the free tool for finding and comparing petrol station prices near you.',
})
</script>
