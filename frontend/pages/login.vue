<template>
  <div class="md:min-h-[calc(100vh-11rem)] flex flex-col my-24 md:my-0 items-center justify-center container mx-auto relative bg-white dark:bg-[#111111]">
    <ClientOnly>
      <AnimatedBackground />
      <template #fallback>
        <div class="absolute inset-0 pointer-events-none overflow-hidden z-0"></div>
      </template>
    </ClientOnly>

    <div class="flex items-center gap-8 relative z-10 w-full">
      <header class="flex-1 z-10">
        <div class="space-y-8 z-10">
          <div class="space-y-4">
            <h1 class="font-semibold text-center text-lg text-black/50 dark:text-white/50 md:text-xl">
              Hi, I am
              <span
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200/70 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm mx-2 select-none align-middle"
              >
                <span class="flex h-7 w-7 items-center justify-center ">
                  <img :src="base + 'assets/icon.png'" alt="UBU AI SERVICE" class="h-5 w-5 object-contain" />
                </span>
                <span class="text-gray-800 dark:text-gray-100 font-semibold tracking-wide">UBU AI SERVICE</span>
              </span>
              a
            </h1>

            <h1
              class="font-semibold text-center text-5xl text-black/90 dark:text-white/90 md:text-6xl"
            >
              AI Gateway
            </h1>
          </div>
        </div>

        <!-- icons row (same as homepage: emblem, UBU, api) -->
        <div class="mt-6 flex items-center justify-center gap-5 md:gap-6 select-none">
          <img :src="base + 'assets/Ubu_logo.png'" alt="UBU Emblem" title="UBU Emblem" class="h-6 w-6 md:h-7 md:w-7 object-contain" />
          <img :src="base + 'assets/ubufavicon.png'" alt="UBU" title="UBU" class="h-6 w-6 md:h-7 md:w-7 object-contain" />
          <img :src="base + 'assets/api.png'" alt="api" title="api" class="h-6 w-6 md:h-7 md:w-7 object-contain" />
        </div>

        <!-- login button below icons -->
        <div class="mt-8 flex items-center justify-center">
          <button
            @click="startLogin"
            class="px-7 py-3 rounded-xl text-white font-semibold shadow-lg transition transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500"
          >
            เข้าสู่ระบบผ่าน UBU Portal
          </button>
        </div>

        <div class="mt-4 text-center">
          <NuxtLink to="/" class="text-sm text-gray-600 dark:text-gray-300 hover:underline">กลับหน้าแรก</NuxtLink>
        </div>
      </header>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead, useRuntimeConfig } from 'nuxt/app'
useHead({ title: 'Login - UBU AI SERVICE' })

const startLogin = () => {
  const apiBase = (useRuntimeConfig().public.apiBase as string)
  // ส่งไปยัง backend OAuth login
  window.location.href = `${apiBase}/api/oauth-login`
}

// base path for assets when deployed under a subdirectory
const base = (useRuntimeConfig().public as any).basePath || '/'
</script>
