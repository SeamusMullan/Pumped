# Pumped 

**Find and compare petrol station prices near you.**

Pumped is a desktop, tablet, and mobile-compatible web app built with [Nuxt 3](https://nuxt.com), [Vue 3](https://vuejs.org), and [Bun](https://bun.sh). It displays petrol stations on an interactive map and lets users filter by fuel type, price, and distance.

## Features

- Interactive map powered by [Leaflet](https://leafletjs.com) + OpenStreetMap
- Filter by fuel type (unleaded, diesel, premium, E10, LPG)
- "Near me" button using the browser Geolocation API
- Sort by cheapest price or nearest station
- Mobile-first responsive design
- SEO-optimised with `useSeoMeta` and full Open Graph/Twitter card meta

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 3 (SSR + SSG) |
| UI | Vue 3 + Tailwind CSS |
| Map | Leaflet + OpenStreetMap |
| Runtime | Bun |
| Linting | ESLint (`@nuxt/eslint`) |

## Getting started

```bash
# Install dependencies (requires Bun)
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Generate static site
bun run generate

# Lint
bun run lint
```

## Project structure

```
pumped/
├── assets/css/         # Global styles (Tailwind + Leaflet)
├── components/         # Vue components
│   ├── TheHeader.vue   # Sticky navigation header
│   ├── TheFooter.vue   # Site footer
│   ├── StationMap.vue  # Leaflet map
│   ├── StationCard.vue # Station info card
│   └── FilterPanel.vue # Filter sidebar
├── composables/        # Auto-imported composables
│   ├── useStations.ts  # Station data + filtering logic
│   └── useGeolocation.ts # Browser geolocation
├── layouts/            # Nuxt layouts
├── pages/              # File-based routing
│   ├── index.vue       # Main map page
│   └── about.vue       # About page
├── types/              # TypeScript types
└── .github/workflows/  # CI/CD workflows
```

## CI / CD

| Workflow | Trigger | Description |
|---|---|---|
| `lint.yml` | push / PR | ESLint |
| `build.yml` | push / PR | Nuxt build + artifact upload |
| `deploy-ssh.yml` | manual | SSH deployment (placeholder) |
| `deploy-ftp.yml` | manual | FTP deployment (placeholder) |

> SSH and FTP deployment workflows contain commented-out examples ready to configure with repository secrets.

## License

[MIT](LICENSE)
