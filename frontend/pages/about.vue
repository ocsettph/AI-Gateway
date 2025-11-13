<template>
  <div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Team -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-12"
      >
        <h2
          class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center"
        >
          ทีมพัฒนา UBU AI FLOW
        </h2>
        <div class="text-center">
          <div class="w-36 h-36 flex items-center justify-center mx-auto mb-4">
            <img
              src="/assets/UBU_AI_FLOW_icon.png"
              alt="UBU AI FLOW"
              class="h-32 w-32 object-contain flex-shrink-0"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ฝ่ายพัฒนาซอฟต์แวร์ OCN UBU
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            ทีมพัฒนาซอฟต์แวร์สำนักคอมพิวเตอร์และเครือข่าย มหาวิทยาลัยอุบลราชธานี
          </p>
          <div class="flex justify-center space-x-4">
            <a
              href="mailto:ocn@ubu.ac.th"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >ocn@ubu.ac.th</a
            >
            <a
              href="https://ocn.ubu.ac.th"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >ocn.ubu.ac.th</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from "nuxt/app";

useHead({
  title: "About - UBU AI FLOW",
  meta: [
    { name: "description", content: "ข้อมูลเกี่ยวกับ UBU AI FLOW และทีมพัฒนา" },
  ],
});
</script>
