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

onMounted(() => {
  // Ensure dark mode is removed
  document.documentElement.classList.remove('dark')
  
  // Fetch user data
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
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="pt-6">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Logo and Name (clickable, animated on hover) -->
          <NuxtLink to="/" class="flex items-center space-x-2 group cursor-pointer">
            <img :src="base + 'assets/UBU_AI_FLOW_icon.png'" alt="UBU AI SERVICE" class="h-8 w-8 object-contain group-hover:rotate-3 transition-transform duration-200">
            <span class="text-lg font-bold text-gray-900">UBU AI SERVICE</span>
          </NuxtLink>
          
          <div class="flex items-center gap-3">
            <span v-if="displayName" class="text-sm text-gray-600 truncate max-w-[200px]">
              <span class="hidden md:inline">สวัสดี, {{ displayName }}</span>
              <span class="md:hidden">{{ displayName.split(' ')[0] }}</span>
            </span>
            
            <!-- Logout Button -->
            <button 
              v-if="displayName"
              @click="logout"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
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
    <footer class="bg-white border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center space-x-2">
            <img :src="base + 'assets/UBU_AI_FLOW_icon.png'" alt="UBU AI SERVICE" class="h-6 w-6 object-contain flex-shrink-0">
            <span class="text-sm font-medium text-gray-900">UBU AI SERVICE | AI Gateway</span>
          </div>
          
          <div class="text-xs text-gray-500 text-center">
            <div>&copy; 2025 UBU AI SERVICE Team </div>
            <div class="mt-1">Template inspired by <a href="https://eggsy.xyz" target="_blank" rel="noopener noreferrer" class="hover:text-gray-700 transition-colors">eggsy.xyz</a></div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>