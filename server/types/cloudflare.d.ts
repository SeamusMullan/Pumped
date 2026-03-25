declare module 'h3' {
  interface H3EventContext {
    cloudflare: {
      env: {
        DB: D1Database
      }
    }
  }
}

export {}
