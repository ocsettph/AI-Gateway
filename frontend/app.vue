<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useHead, navigateTo, useRuntimeConfig, useRoute } from 'nuxt/app'
// User display name (fetched from backend session)
const displayName = ref<string | null>(null)

const fetchCurrentUser = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    // apiBase already includes /api prefix for production
    const mePath = apiBase.endsWith('/api') || apiBase === '/api' 
      ? `${apiBase}/me` 
      : `${apiBase}/api/me`
    const me: any = await $fetch(mePath, { credentials: 'include' })
    displayName.value = me?.user?.fullname || me?.user?.username || null
  } catch {
    displayName.value = null
  }
}

const logout = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    // apiBase already includes /api prefix for production
    const logoutPath = apiBase.endsWith('/api') || apiBase === '/api' 
      ? `${apiBase}/logout` 
      : `${apiBase}/api/logout`
    await $fetch(logoutPath, { 
      method: 'POST',
      credentials: 'include' 
    })
    // Clear local state and ensure name hides immediately
    displayName.value = null
    // Dispatch logout event for chatbot to reset
    window.dispatchEvent(new CustomEvent('user-logout'))
    // Redirect to login
    await navigateTo('/login')
  } catch (e) {
    console.error('Logout failed:', e)
    // Still dispatch logout event even if logout fails
    window.dispatchEvent(new CustomEvent('user-logout'))
    // Still redirect even if logout fails
    await navigateTo('/login')
  }
}

// base path for assets when deployed under a subdirectory
const base = (useRuntimeConfig().public as any).basePath || '/'
const route = useRoute()

const isFreshieMicrosite = computed(() => {
  const p = route.path
  return p === '/freshie-frame' || p.endsWith('/freshie-frame')
})

// Determine logo link based on current route
// If on /ai-gateway page, go to home (/)
// If on other AI Gateway pages, go to /ai-gateway
// Otherwise go to home (/)
const logoLink = computed(() => {
  const path = route.path
  // If currently on /ai-gateway page, go to home
  if (path === '/ai-gateway' || path.startsWith('/ai-gateway/')) {
    return '/'
  }
  // Check if we're in other AI Gateway related pages
  const aiGatewayPages = ['/request', '/keys', '/status', '/docs', '/api-playground', '/chatbot', '/about', '/admin']
  const isInAiGatewaySection = aiGatewayPages.some(page => path.startsWith(page))
  return isInAiGatewaySection ? '/ai-gateway' : '/'
})

// ปุ่มกลับ: หน้า index (/) ไม่แสดง, หน้า ai-gateway กลับไป /, หน้าอื่นกลับไป /ai-gateway
const showBackButton = computed(() => {
  const path = route.path
  if (path === '/freshie-frame' || path.endsWith('/freshie-frame')) return false
  return path !== '/' && !path.startsWith('/login') && !path.startsWith('/callback')
})
const backLink = computed(() => {
  const path = route.path
  if (path === '/ai-gateway' || path.startsWith('/ai-gateway/')) return '/'
  return '/ai-gateway'
})

// Header: โปร่งใสตอนอยู่บน, เบลอเมื่อเลื่อนลง
const headerScrolled = ref(false)
const onScroll = () => {
  headerScrolled.value = window.scrollY > 24
}

onMounted(() => {
  document.documentElement.classList.remove('dark')
  fetchCurrentUser()
  window.addEventListener('user-login-success', fetchCurrentUser)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll() // init state
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
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
  <div
    class="bg-white"
    :class="isFreshieMicrosite ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-screen'"
  >
    <!-- Header: โปร่งใสบนสุด → เบลอเมื่อเลื่อน -->
    <header
      v-if="!isFreshieMicrosite"
      class="sticky top-0 z-50 pt-2 pb-2 transition-[background,backdrop-filter] duration-300"
      :class="headerScrolled ? 'bg-white/70 backdrop-blur-md shadow-[0_4px_20px_-6px_rgba(0,0,0,0.06)]' : 'bg-transparent'"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-2">
          <div class="flex items-center gap-3">
            <NuxtLink
              v-if="showBackButton"
              :to="backLink"
              class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span class="hidden sm:inline">Back</span>
            </NuxtLink>
            <!-- Logo and Name (clickable, animated on hover) -->
            <NuxtLink :to="logoLink" class="flex items-center space-x-2 group cursor-pointer">
            <img :src="base + 'assets/UBU_AI_FLOW_icon.png'" alt="UBU AI SERVICE" class="h-8 w-8 object-contain group-hover:rotate-3 transition-transform duration-200">
            <span class="text-lg font-bold text-gray-900">UBU AI SERVICE</span>
            </NuxtLink>
          </div>
          
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

    <main v-if="!isFreshieMicrosite" class="min-h-screen pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NuxtPage />
      </div>
    </main>
    <main v-else class="h-dvh overflow-hidden">
      <NuxtPage />
    </main>

    <footer
      v-if="!isFreshieMicrosite"
      class="bg-white border-t border-gray-200">
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

    <ClientOnly v-if="!isFreshieMicrosite">
      <Chatbot />
    </ClientOnly>
  </div>
</template>