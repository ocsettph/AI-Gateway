import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  ssr: false, // Disable SSR to use only client-side rendering

  app: {
    // ให้ทำงานได้ทั้ง local และใต้พาธ /ai_gateway/ บน dev2
    baseURL: process.env.NUXT_APP_BASE_URL || (process.env.NODE_ENV === 'production' ? '/ai_gateway/' : '/'),
    head: (() => {
      const base = process.env.NUXT_APP_BASE_URL || (process.env.NODE_ENV === 'production' ? '/ai_gateway/' : '/');
      return {
        link: [
          // Fonts for iOS: preconnect + stylesheet (more reliable than @import)
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
          { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap' },
          { rel: 'icon', type: 'image/png', href: `${base}favicon.png` },
          { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${base}favicon-16x16.png` },
          { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${base}favicon-32x32.png` },
          { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}favicon.png` },
          { rel: 'icon', type: 'image/x-icon', href: `${base}favicon.ico` },
          // Fallback to assets favicon if standard files missing
          { rel: 'icon', type: 'image/png', href: `${base}assets/favicon.png` },
        ]
      }
    })(),
    pageTransition: { name: "fade", mode: "out-in" },
  },

  css: ["~/assets/tailwind.css"],

  modules: [
    "@nuxtjs/tailwindcss",
  ],

  runtimeConfig: {
    public: {
      // ค่าเริ่มต้น: prod ใต้ dev2 เรียกผ่าน nginx path, dev เรียก backend local
      apiBase: process.env.NUXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'production' ? '/ai_gateway_api' : 'http://localhost:4000'),
      basePath: process.env.NUXT_APP_BASE_URL || (process.env.NODE_ENV === 'production' ? '/ai_gateway/' : '/'),
      appName: process.env.PUBLIC_APP_NAME || "UBU AI SERVICE"
    }
  },



  typescript: {
    strict: true,
    typeCheck: false
  },

  compatibilityDate: "2025-01-16",
})