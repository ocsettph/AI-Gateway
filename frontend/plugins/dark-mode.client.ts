export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  
  // Load theme immediately before Vue hydrates
  const stored = localStorage.getItem('nuxt-color-mode') as 'light' | 'dark' | null
  const theme = stored ?? 'light'
  
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
})

