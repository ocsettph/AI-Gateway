<template>
  <div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-6 md:mb-8 text-center">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          API Playground
        </h1>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">
          ทดสอบเรียกใช้งาน API ได้จากหน้านี้ (ตัวอย่างค่าเริ่มต้นจะทดสอบ
          /health ของระบบ)
        </p>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="md:col-span-3">
            <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">URL</label>
            <input
              v-model="url"
              type="text"
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Method</label>
            <select
              v-model="method"
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
            >
              <option>GET</option>
              <option>POST</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key ของคุณ (ถ้ามี)</label>
            <select v-model="selectedKeyId" class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm">
              <option value="">-- ไม่ใช้ --</option>
              <option v-for="k in keys" :key="k.id" :value="k.id">{{ k.name }} ({{ k.is_active ? 'Active' : 'Disabled' }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Authorization</label>
            <input
              v-model="bearer"
              type="text"
              placeholder="Bearer <your_api_token> (ถ้ามี)"
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div class="flex items-center md:items-end">
            <label class="inline-flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" v-model="withCredentials" class="mr-2" />
              ส่งพร้อม cookie session
            </label>
          </div>
        </div>

        <div v-if="method==='POST'" class="mb-4">
          <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">JSON Body</label>
          <textarea
            v-model="body"
            rows="6"
            class="w-full px-3 py-2 border rounded font-mono text-xs sm:text-sm dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
          <button
            @click="send"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap"
          >
            ส่งคำขอ
          </button>
          <span v-if="elapsed !== null" class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
            >เวลาตอบสนอง: {{ elapsed }} ms</span
          >
          <span v-if="status !== null" class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">สถานะ: {{ status }}</span>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ผลลัพธ์</label>
          <pre
            class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 md:p-4 rounded overflow-auto text-xs sm:text-sm max-h-64 md:max-h-96"
          >{{ responseText }}</pre>
        </div>
      </div>

      <!-- Models quick test card -->
      <div class="mt-6 md:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">ทดสอบ Model</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label class="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Model</label>
            <input v-model="testModel" placeholder="openai/gpt-4o" class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key ของคุณ</label>
            <select v-model="selectedKeyId" class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white">
              <option value="">-- เลือกคีย์ --</option>
              <option v-for="k in keys" :key="k.id" :value="k.id">{{ k.name }} ({{ k.is_active ? 'Active' : 'Disabled' }})</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ข้อความ</label>
            <input v-model="testPrompt" placeholder="พิมพ์ข้อความทดสอบ..." class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
        <div class="flex items-center gap-3 mb-3">
          <button @click="runModelTest" :disabled="!selectedKeyId" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">ส่งทดสอบ</button>
          <span v-if="modelStatus" class="text-sm text-gray-600 dark:text-gray-300">สถานะ: {{ modelStatus }}</span>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ผลลัพธ์</label>
          <pre class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded overflow-auto text-sm max-h-72">{{ modelResponse }}</pre>
        </div>
      </div>
    </div>
  </div>
  </template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHead } from 'nuxt/app'

useHead({ title: 'API Playground - UBU AI FLOW' })

const method = ref<'GET' | 'POST'>('GET')
const url = ref((useRuntimeConfig().public.apiBase as string) + '/health')
const bearer = ref('')
const withCredentials = ref(true)
const body = ref('')
// user keys
const keys = ref<any[]>([])
const selectedKeyId = ref<string>('')

const responseText = ref('')
const status = ref<number | null>(null)
const elapsed = ref<number | null>(null)

const send = async () => {
  try {
    responseText.value = ''
    status.value = null
    const t0 = performance.now()
    const headers: Record<string, string> = {}
    // If a key is selected, use it; else fall back to manual bearer
    const selected = keys.value.find((k: any) => String(k.id) === String(selectedKeyId.value))
    const token = selected?.key_value ? `Bearer ${selected.key_value}` : bearer.value.trim()
    if (token) headers['Authorization'] = token
    if (method.value === 'POST') headers['Content-Type'] = 'application/json'

    const res = await fetch(url.value, {
      method: method.value,
      headers,
      body: method.value === 'POST' && body.value ? body.value : undefined,
      credentials: withCredentials.value ? 'include' : 'omit'
    })
    elapsed.value = Math.round(performance.now() - t0)
    status.value = res.status
    const text = await res.text()
    try {
      responseText.value = JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      responseText.value = text
    }
  } catch (e: any) {
    responseText.value = e?.message || String(e)
  }
}

onMounted(() => {
  // default body sample
  body.value = JSON.stringify({ hello: 'world' }, null, 2)
  // load user's keys
  ;(async () => {
    try {
      const apiBase = useRuntimeConfig().public.apiBase as string
      const res = await $fetch(`${apiBase}/api/keys`, { credentials: 'include' }) as any
      keys.value = res?.keys || []
      if (!selectedKeyId.value && keys.value.length) {
        const active = keys.value.find((k: any) => k.is_active)
        selectedKeyId.value = String((active || keys.value[0]).id)
      }
    } catch {}
  })()
})

// --- Models quick test ---
const testModel = ref('openai/gpt-4o')
const testPrompt = ref('สวัสดีครับ')
const modelResponse = ref('')
const modelStatus = ref('')

const runModelTest = async () => {
  if (!selectedKeyId.value) {
    modelStatus.value = 'ต้องเลือก API Key ก่อน'
    return
  }
  modelResponse.value = ''
  modelStatus.value = 'กำลังส่ง...'
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const res = await fetch(`${apiBase}/api/test-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ keyId: selectedKeyId.value, model: testModel.value, prompt: testPrompt.value })
    })
    modelStatus.value = String(res.status)
    const text = await res.text()
    try { modelResponse.value = JSON.stringify(JSON.parse(text), null, 2) } catch { modelResponse.value = text }
  } catch (e: any) {
    modelStatus.value = 'error'
    modelResponse.value = e?.message || String(e)
  }
}
</script>