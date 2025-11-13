<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHead, navigateTo, useRuntimeConfig } from 'nuxt/app'
// User display name (fetched from backend session)
const displayName = ref<string | null>(null)

const fetchCurrentUser = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const me: any = await $fetch(`${apiBase}/api/me`, { credentials: 'include' })
    displayName.value = me?.user?.fullname || me?.user?.username || null
  } catch {
    displayName.value = null
  }
}

const logout = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    await $fetch(`${apiBase}/api/logout`, { 
      method: 'POST',
      credentials: 'include' 
    })
    // Clear local state and ensure name hides immediately
    displayName.value = null
    // Redirect to login
    await navigateTo('/login')
  } catch (e) {
    console.error('Logout failed:', e)
    // Still redirect even if logout fails
    await navigateTo('/login')
  }
}

// base path for assets when deployed under a subdirectory
const base = (useRuntimeConfig().public as any).basePath || '/'

// Simple theme controller using html.classList and localStorage
const theme = ref<'light' | 'dark'>('light')

const applyThemeClass = (mode: 'light' | 'dark') => {
  const html = document.documentElement
  if (mode === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

const toggleColorMode = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('nuxt-color-mode', theme.value)
  applyThemeClass(theme.value)
}

onMounted(() => {
  // Load theme FIRST - this is critical for dark mode to work
  const stored = (localStorage.getItem('nuxt-color-mode') as 'light' | 'dark' | null)
  theme.value = stored ?? 'light'
  applyThemeClass(theme.value)
  
  // Then fetch user data
  fetchCurrentUser()
  
  // Listen for login success event to refresh user data
  window.addEventListener('user-login-success', fetchCurrentUser)
})

useHead(() => {
  let string = "UBU AI SERVICE"

  return {
    titleTemplate: `%s`,
    meta: [
      {
        hid: "og:site_name",
        name: "og:site_name",
        content: string,
      },
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.png' }
    ]
  }
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-[#111111]">
    <!-- Header -->
    <header class="pt-6">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Logo and Name (clickable, animated on hover) -->
          <NuxtLink to="/" class="flex items-center space-x-2 group cursor-pointer">
            <img :src="base + 'assets/UBU_AI_FLOW_icon.png'" alt="UBU AI SERVICE" class="h-8 w-8 object-contain group-hover:rotate-3 transition-transform duration-200">
            <span class="text-lg font-bold text-gray-900 dark:text-white">UBU AI SERVICE</span>
          </NuxtLink>
          
          <div class="flex items-center gap-3">
            <span v-if="displayName" class="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
              <span class="hidden md:inline">สวัสดี, {{ displayName }}</span>
              <span class="md:hidden">{{ displayName.split(' ')[0] }}</span>
            </span>
            
            <!-- Logout Button -->
            <button 
              v-if="displayName"
              @click="logout"
              class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
            >
              Logout
            </button>
            
            <!-- Theme Toggle Button (simple moon/sun icon) -->
            <!-- <button 
              @click="toggleColorMode"
              class="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1a1a1a] flex items-center justify-center hover:bg-gray-300 dark:hover:bg-[#222222] transition-colors"
            >
              <svg v-if="theme === 'dark'" class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <svg v-else class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              </svg>
            </button> -->
          </div>
        </div>
      </div>
    </header>

    <!-- Nuxt component -->
    <main class="min-h-screen pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NuxtPage />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-gray-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center space-x-2">
            <img :src="base + 'assets/UBU_AI_FLOW_icon.png'" alt="UBU AI SERVICE" class="h-6 w-6 object-contain flex-shrink-0">
            <span class="text-sm font-medium text-gray-900 dark:text-white">UBU AI SERVICE | AI Gateway</span>
          </div>
          
          <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
            <div>&copy; 2025 UBU AI SERVICE Team </div>
            <div class="mt-1">Template inspired by <a href="https://eggsy.xyz" target="_blank" rel="noopener noreferrer" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">eggsy.xyz</a></div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>