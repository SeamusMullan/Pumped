<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Privacy Notice</h1>

    <div class="prose prose-gray max-w-none text-gray-600">
      <p class="text-lg leading-relaxed mb-6">
        Pumped is designed to collect as little personal data as possible. Here is exactly what we collect, why, and how long we keep it.
      </p>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">What we collect</h2>

      <h3 class="text-lg font-medium text-gray-800 mt-6 mb-2">Location data</h3>
      <p>
        If you grant permission, your browser shares your approximate location so we can show nearby stations. This data is sent to our server to query for stations but is <strong>never stored</strong>.
      </p>

      <h3 class="text-lg font-medium text-gray-800 mt-6 mb-2">IP addresses</h3>
      <p>
        When you submit a fuel price, your IP address is recorded alongside the submission for rate-limiting purposes (to prevent spam). IP addresses are <strong>automatically anonymised after 30 days</strong> and cannot be linked back to you after that point.
      </p>

      <h3 class="text-lg font-medium text-gray-800 mt-6 mb-2">Price submissions</h3>
      <p>
        Fuel prices you submit (fuel type, price, station, and timestamp) are stored indefinitely to provide price history to all users. These submissions are anonymous and contain no identifying information after IP anonymisation.
      </p>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">What we don't collect</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>No cookies or tracking pixels</li>
        <li>No analytics or advertising scripts</li>
        <li>No user accounts or personal profiles</li>
        <li>No browsing history or usage patterns</li>
      </ul>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">Third-party services</h2>
      <ul class="list-disc list-inside space-y-2">
        <li><strong>Cloudflare</strong> hosts the site and may process requests through its network. See <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Cloudflare's privacy policy</a>.</li>
        <li><strong>OpenStreetMap</strong> provides map tiles. See <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">OSM's privacy policy</a>.</li>
        <li><strong>Google Places API</strong> is used server-side to find station data. Your searches are proxied through our server; Google does not receive your IP address directly.</li>
      </ul>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">Your rights</h2>
      <p>
        Under GDPR (applicable in Ireland and the UK), you have the right to request access to, correction of, or deletion of any personal data we hold about you. Since the only personal data we store is your IP address (retained for up to 30 days), you can contact us to request its early deletion.
      </p>

      <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-3">Contact</h2>
      <p>
        For any privacy-related questions, please open an issue on <a href="https://github.com/SeamusMullan/Pumped" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">GitHub</a>.
      </p>

      <p class="mt-8 text-sm text-gray-400">Last updated: March 2026</p>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Notice – Pumped',
  description: 'How Pumped handles your data: what we collect, why, and your rights under GDPR.',
  ogTitle: 'Privacy Notice – Pumped',
  ogDescription: 'How Pumped handles your data: what we collect, why, and your rights under GDPR.',
})
</script>
