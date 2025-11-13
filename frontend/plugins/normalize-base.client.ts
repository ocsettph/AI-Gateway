import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

// Normalize duplicated base path when app is served under a subdirectory.
// Fixes cases like /ai_gateway/ai_gateway/login on first load before router runs.
export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  try {
    const base = (useRuntimeConfig().public as any).basePath || '/'
    if (!base || base === '/') return
    const loc = window.location
    const doublePrefix = base + base.slice(1)
    let pathname = loc.pathname
    let changed = false
    // Collapse repeated prefixes
    while (pathname.startsWith(doublePrefix)) {
      pathname = '/' + pathname.slice(base.length)
      changed = true
    }
    // Ensure we don't leave a leading base when router will add it
    if (pathname.startsWith(base)) {
      pathname = '/' + pathname.slice(base.length)
      changed = true
    }
    if (changed) {
      const newUrl = pathname + loc.search + loc.hash
      window.history.replaceState(null, '', newUrl)
    }
  } catch {}
})


