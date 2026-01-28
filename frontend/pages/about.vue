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
          ทีมพัฒนา UBU AI SERVICE
        </h2>
        <div class="text-center">
          <div class="w-36 h-36 flex items-center justify-center mx-auto mb-4">
            <img
              src="/assets/main_logo_cl_en.png"
              alt="UBU AI SERVICE"
              class="h-50 w-50 object-contain flex-shrink-0"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ฝ่ายเทคโนโลยีดิจิทัล ODL UBU
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            สำนักเทคโนโลยีดิจิทัลและทรัพยากรการเรียนรู้ มหาวิทยาลัยอุบลราชธานี
          </p>
          <div class="flex justify-center space-x-4">
            <a
              href="mailto:odl@ubu.ac.th"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >odl.ubu.ac.th</a
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
  title: "About - UBU AI SERVICE",
  meta: [
    { name: "description", content: "ข้อมูลเกี่ยวกับ UBU AI SERVICE และทีมพัฒนา" },
  ],
});
</script>
