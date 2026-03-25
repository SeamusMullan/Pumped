// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
  ],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
      title: 'Pumped – Find Cheap Fuel Near You',
      meta: [
        { name: 'description', content: 'Find and compare petrol station prices near you. Filter by fuel type, price, and distance to save money every time you fill up.' },
        { name: 'theme-color', content: '#16a34a' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Pumped' },
        { property: 'og:title', content: 'Pumped – Find Cheap Fuel Near You' },
        { property: 'og:description', content: 'Find and compare petrol station prices near you. Filter by fuel type, price, and distance to save money every time you fill up.' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Pumped – Find Cheap Fuel Near You' },
        { name: 'twitter:description', content: 'Find and compare petrol station prices near you.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
  },

  ssr: true,

  nitro: {
    // Ensure better-sqlite3 native module is not bundled
    externals: {
      inline: [],
    },
  },
})
