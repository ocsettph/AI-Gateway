import { defineNuxtConfig } from "nuxt/config"
import { readFileSync } from "fs"
import { join } from "path"

// Read version from version.json
function getVersion(): string {
  try {
    const versionPath = join(__dirname, 'version.json')
    const versionData = JSON.parse(readFileSync(versionPath, 'utf8'))
    return versionData.version || '5.1.0'
  } catch {
    return '5.1.0'
  }
}

const appVersion = getVersion()

// Helper function to determine base path based on environment
function getBasePath(): string {
  // If explicitly set via env, use it
  if (process.env.NUXT_APP_BASE_URL) {
    return process.env.NUXT_APP_BASE_URL;
  }
  
  // For production, default to / (root path for aigateway.ubu.ac.th)
  if (process.env.NODE_ENV === 'production') {
    return '/';
  }
  
  // Development default
  return '/';
}

// Helper function to determine API base
function getApiBase(): string {
  // If explicitly set via env, use it
  if (process.env.NUXT_PUBLIC_API_BASE) {
    return process.env.NUXT_PUBLIC_API_BASE;
  }
  
  // For production, default to /api (for aigateway.ubu.ac.th)
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // Development default
  return 'http://localhost:4000';
}

const basePath = getBasePath();
const apiBase = getApiBase();

export default defineNuxtConfig({
  ssr: false, // Disable SSR to use only client-side rendering

  app: {
    // ใช้ root path สำหรับ aigateway.ubu.ac.th
    baseURL: basePath,
    head: (() => {
      return {
        link: [
          // Fonts for iOS: preconnect + stylesheet (more reliable than @import)
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
          { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap' },
          { rel: 'icon', type: 'image/png', href: `${basePath}favicon.png` },
          { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${basePath}favicon-16x16.png` },
          { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${basePath}favicon-32x32.png` },
          { rel: 'apple-touch-icon', sizes: '180x180', href: `${basePath}favicon.png` },
          { rel: 'icon', type: 'image/x-icon', href: `${basePath}favicon.ico` },
          // Fallback to assets favicon if standard files missing
          { rel: 'icon', type: 'image/png', href: `${basePath}assets/favicon.png` },
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
      // API base: /api สำหรับ aigateway.ubu.ac.th
      apiBase: apiBase,
      // Base path: / สำหรับ aigateway.ubu.ac.th
      basePath: basePath,
      appName: process.env.PUBLIC_APP_NAME || "UBU AI SERVICE",
      // App version for display
      appVersion: appVersion
    }
  },



  typescript: {
    strict: true,
    typeCheck: false
  },

  compatibilityDate: "2025-01-16",
})