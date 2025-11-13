<script setup lang="ts">
import { useHead, useRuntimeConfig } from 'nuxt/app';

useHead({
  title: "UBU AI SERVICE - Home",
})

const base = (useRuntimeConfig().public as any).basePath || '/'

type ServiceOption = {
  title: string;
  href: string;
  icon: string;
  description: string;
  external?: boolean;
}

const services: ServiceOption[] = [
  {
    title: "UBU AI API",
    href: "/ai-gateway",
    icon: "api.png",
    description: "AI Gateway สำหรับ API",
    external: false,
  },
  {
    title: "UBU n8n",
    href: "https://35.193.131.93/n8n",
    icon: "N8n-logo-new.svg",
    description: "Workflow Automation",
    external: true,
  },
  {
    title: "UBU Dify",
    href: "https://35.193.131.93/dify",
    icon: "dify-logo.png",
    description: "Generative AI (LLMs)",
    external: true,
  },
]
</script>

<template>
  <div class="md:min-h-[calc(100vh-11rem)] flex flex-col my-24 md:my-0 items-center justify-center container mx-auto relative">
    <!-- Animated Background (Client-side only) -->
    <ClientOnly>
      <AnimatedBackground />
      <template #fallback>
        <div class="absolute inset-0 pointer-events-none overflow-hidden z-0"></div>
      </template>
    </ClientOnly>

    <div class="flex flex-col items-center gap-12 relative z-10 w-full px-4">
      <header class="flex-1 z-10 text-center">
        <div class="space-y-8 z-10">
          <div class="space-y-4">
            <h1
              class="font-semibold text-center text-lg text-black/50 dark:text-white/50 md:text-xl"
            >
              Hi, I am
              <span
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200/70 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm mx-2 select-none align-middle"
              >
                <span class="flex h-7 w-7 items-center justify-center ">
                  <img :src="base + 'assets/UBU_AI_FLOW_icon.png'" alt="UBU AI SERVICE" class="h-5 w-5 object-contain" />
                </span>
                <span class="text-gray-800 dark:text-gray-100 font-semibold tracking-wide">UBU AI SERVICE</span>
              </span>
            </h1>

            <h1
              class="font-semibold text-center text-5xl text-black/90 dark:text-white/90 md:text-6xl lg:text-7xl"
            >
              Welcome
            </h1>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-center gap-4 md:gap-5 select-none">
          <img :src="base + 'assets/Ubu_logo.png'" alt="UBU" title="UBU" class="h-10 w-10 md:h-12 md:w-12 object-contain max-w-[2.5rem] md:max-w-[3rem]" />
          <img :src="base + 'assets/ubufavicon.png'" alt="UBU Favicon" title="UBU Favicon" class="h-10 w-10 md:h-12 md:w-12 object-contain max-w-[2.5rem] md:max-w-[3rem]" />
          <img :src="base + 'assets/api.png'" alt="API" title="API" class="h-10 w-10 md:h-12 md:w-12 object-contain max-w-[2.5rem] md:max-w-[3rem]" />
          <img :src="base + 'assets/N8n-logo-new.svg'" alt="n8n" title="n8n" class="h-12 w-12 md:h-14 md:w-14 object-contain max-w-[3.5rem] md:max-w-[4rem]" />
          <img :src="base + 'assets/dify-logo.png'" alt="Dify" title="Dify" class="h-10 w-10 md:h-12 md:w-12 object-contain max-w-[2.5rem] md:max-w-[3rem]" />
        </div>
      </header>

      <!-- Service Options -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl z-10">
        <div
          v-for="(service, index) in services"
          :key="`service-${index}`"
          class="group relative flex flex-col items-center justify-center transform hover:scale-105 transition-all dark:!bg-[#1a1a1a] dark:hover:!bg-[#222222] bg-white hover:bg-gray-50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 md:p-10 cursor-pointer"
          :class="{
            'rotate-1': index === 0,
            '-rotate-1': index === 2,
          }"
        >
          <!-- Internal Link (NuxtLink) -->
          <NuxtLink
            v-if="!service.external"
            :to="service.href"
            class="flex flex-col gap-4 items-center text-center w-full"
          >
            <!-- Icon -->
            <div :class="service.icon === 'N8n-logo-new.svg' ? 'w-25 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20'" class="flex items-center justify-center mb-2">
              <img 
                :src="base + 'assets/' + service.icon" 
                :alt="service.title" 
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Title -->
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {{ service.title }}
            </h2>

            <!-- Description -->
            <p class="text-sm md:text-base text-gray-600 dark:text-gray-400 break-words px-2">
              {{ service.description }}
            </p>
          </NuxtLink>

          <!-- External Link (a tag) -->
          <a
            v-else
            :href="service.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col gap-4 items-center text-center w-full"
          >
            <!-- Icon -->
            <div :class="service.icon === 'N8n-logo-new.svg' ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20'" class="flex items-center justify-center mb-2">
              <img 
                :src="base + 'assets/' + service.icon" 
                :alt="service.title" 
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Title -->
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {{ service.title }}
            </h2>

            <!-- Description -->
            <p class="text-sm md:text-base text-gray-600 dark:text-gray-400 break-words px-2">
              {{ service.description }}
            </p>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
