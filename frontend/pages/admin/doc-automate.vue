<template>
  <div class="min-h-screen bg-transparent dark:bg-transparent py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div class="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-semibold">Admin Automation</p>
            <h1 class="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">UBU DocAutomate</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              อัปโหลดไฟล์หลักฐาน + กำหนดตำแหน่งใน Google Doc Template เพื่อส่งเข้า n8n
            </p>
          </div>
          <NuxtLink to="/" class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 text-sm">
            กลับหน้าหลัก
          </NuxtLink>
        </div>
      </div>

      <div v-if="activeFlow === 'menu'" class="grid lg:grid-cols-2 gap-6">
        <button
          type="button"
          class="doc-menu-card group relative rounded-2xl overflow-hidden shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          aria-label="ทดลองแนบหลักฐาน"
          @click="activeFlow = 'upload'"
        >
          <img
            src="/assets/n8n_docimg.png"
            alt="ทดลองแนบหลักฐาน"
            class="block w-full h-auto transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />

          <span class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800/60">
            <span class="relative flex w-1.5 h-1.5">
              <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500"></span>
            </span>
            Integration ready
          </span>

          <span class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-indigo-600/0 via-transparent to-cyan-400/0 group-hover:from-indigo-600/10 group-hover:to-cyan-400/10 transition-all duration-300"></span>
        </button>

        <button
          type="button"
          class="doc-menu-card group relative rounded-2xl overflow-hidden shadow-md focus:outline-none focus:ring-4 focus:ring-cyan-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          aria-label="ทำสำเนาไฟล์มาทำต่อ"
          @click="activeFlow = 'copy'"
        >
          <img
            src="/assets/n8n_doc.png"
            alt="ทำสำเนาไฟล์"
            class="block w-full h-auto transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />

          <span class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800/60">
            <span class="relative flex w-1.5 h-1.5">
              <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500"></span>
            </span>
            Integration ready
          </span>

          <span class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-cyan-600/0 via-transparent to-blue-400/0 group-hover:from-cyan-600/10 group-hover:to-blue-400/10 transition-all duration-300"></span>
        </button>
      </div>

      <div v-else-if="activeFlow === 'upload'" class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 shadow-inner">
            <button
              type="button"
              :class="[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition',
                uploadTab === 'use' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              ]"
              @click="uploadTab = 'use'"
            >ใช้งาน</button>
            <button
              type="button"
              :class="[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5',
                uploadTab === 'integration' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              ]"
              @click="uploadTab = 'integration'"
            >
              <span>วิธีนำไปใช้กับระบบอื่น</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">DEV</span>
            </button>
          </div>
          <button
            type="button"
            class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60"
            @click="activeFlow = 'menu'"
          >
            กลับเมนู
          </button>
        </div>

        <DocAutomateIntegrationGuide v-if="uploadTab === 'integration'" mode="submit" />

        <div v-else class="grid lg:grid-cols-2 gap-6">
        <div class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">วิธีใช้งาน (แนบหลักฐาน)</h2>
          </div>
          <div class="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 p-4">
            <ol class="space-y-2 text-sm text-gray-700 dark:text-gray-200">
              <li>1) อัปโหลดไฟล์หลักฐาน (รูปภาพเท่านั้น)</li>
              <li>2) กดปุ่ม “ส่งเข้า n8n เพื่อสร้าง Google Doc”</li>
              <li>3) ระบบจะสร้าง Google Doc ของผู้ใช้ที่ล็อกอิน จากเทมเพลตที่เตรียมไว้ให้อัตโนมัติ</li>
            </ol>
            <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
              หมายเหตุ: ตำแหน่งการวางไฟล์หลักฐานในเอกสารถูกกำหนดไว้ใน n8n workflow แล้ว
            </p>
          </div>
        </div>

        <div class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">แนบไฟล์หลักฐาน</h2>

          <div class="rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-4 bg-indigo-50/40 dark:bg-indigo-900/20">
            <input
              ref="fileInput"
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp"
              class="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-700"
              @change="onFileChange"
            />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">รองรับเฉพาะรูปภาพ ขนาดไม่เกิน 5MB</p>
          </div>

          <div v-if="selectedFile" class="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p class="text-sm text-gray-700 dark:text-gray-200"><span class="font-medium">ไฟล์:</span> {{ selectedFile.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ขนาด: {{ formatBytes(selectedFile.size) }}</p>
          </div>

          <div v-if="previewUrl" class="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <img v-if="isImagePreview" :src="previewUrl" alt="Preview" class="w-full max-h-72 object-contain" />
            <iframe v-else :src="previewUrl" class="w-full h-72" />
          </div>

          <button
            :disabled="submitting || !canSubmit"
            @click="submitToN8n"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="submitting" class="doc-loading-spinner" aria-hidden="true" />
            <span>{{ submitting ? 'กำลังส่งเข้า n8n' : 'ส่งเข้า n8n เพื่อสร้าง Google Doc' }}</span>
            <span v-if="submitting" class="doc-loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
          </button>
          <div
            v-if="submitting"
            role="status"
            aria-live="polite"
            class="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3"
          >
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">ระบบกำลังประมวลผลการสร้างเอกสาร กรุณารอสักครู่</p>
            <p class="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">เพื่อป้องกันข้อมูลไม่ครบถ้วน โปรดอย่าปิดหน้าต่างหรือรีเฟรชหน้านี้จนกว่าระบบจะแจ้งผลสำเร็จ</p>
            <div class="mt-3 h-1.5 rounded-full bg-amber-200/70 dark:bg-amber-800/70 overflow-hidden">
              <div class="doc-loading-progress h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
            </div>
          </div>

          <div v-if="resultMessage" class="rounded-lg p-3 text-sm" :class="resultSuccess ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'">
            {{ resultMessage }}
          </div>

          <div v-if="resultDocUrl" class="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-2">
            <p class="text-sm text-emerald-800 dark:text-emerald-300 break-all">Google Doc: {{ resultDocUrl }}</p>
            <button
              type="button"
              @click="openGoogleDoc"
              class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium"
            >
              เปิด Google Doc
            </button>
          </div>
        </div>
        </div>
      </div>

      <div v-else-if="activeFlow === 'copy'" class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 shadow-inner">
            <button
              type="button"
              :class="[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition',
                copyTab === 'use' ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              ]"
              @click="copyTab = 'use'"
            >ใช้งาน</button>
            <button
              type="button"
              :class="[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5',
                copyTab === 'integration' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              ]"
              @click="copyTab = 'integration'"
            >
              <span>วิธีนำไปใช้กับระบบอื่น</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">DEV</span>
            </button>
          </div>
          <button
            type="button"
            class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60"
            @click="activeFlow = 'menu'"
          >
            กลับเมนู
          </button>
        </div>

        <DocAutomateIntegrationGuide v-if="copyTab === 'integration'" mode="copy" />

        <div v-else class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">ทำสำเนาไฟล์มาทำต่อ</h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                นี้ถูกแยกออกจากการแนบหลักฐาน เพื่อรองรับขั้นตอนทำสำเนาไฟล์ก่อนส่งงานต่อ
              </p>
            </div>
          </div>

        <div class="rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-900/20 p-4">
          <p class="text-sm text-gray-700 dark:text-gray-200">
            กดปุ่มด้านล่างเพื่อเริ่มทำสำเนาไฟล์ จากนั้นระบบจะเตรียมเอกสารให้พร้อมใช้งานต่อทันที
          </p>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            เมนูนี้ใช้สำหรับงานทำสำเนาไฟล์โดยเฉพาะ เพื่อให้แยกจากเมนูแนบหลักฐานอย่างชัดเจน
          </p>
        </div>

        <button
          type="button"
          :disabled="copySubmitting"
          @click="startCopyFlow"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="copySubmitting" class="doc-loading-spinner" aria-hidden="true" />
          <span>{{ copySubmitting ? 'กำลังทำสำเนาไฟล์' : 'ทำสำเนาไฟล์' }}</span>
        </button>

        <div
          v-if="copyResultMessage"
          class="rounded-lg p-3 text-sm"
          :class="copyResultSuccess ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'"
        >
          {{ copyResultMessage }}
        </div>

        <div v-if="copyResultDocUrl" class="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-2">
          <p class="text-sm text-emerald-800 dark:text-emerald-300 break-all">Google Doc: {{ copyResultDocUrl }}</p>
          <button
            type="button"
            @click="openCopyGoogleDoc"
            class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium"
          >
            เปิด Google Doc
          </button>
        </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRuntimeConfig, useHead } from 'nuxt/app'

// @ts-ignore Nuxt macro
definePageMeta({ middleware: 'admin-only' })

const fileInput = ref<HTMLInputElement | null>(null)
const activeFlow = ref<'menu' | 'upload' | 'copy'>('menu')
const uploadTab = ref<'use' | 'integration'>('use')
const copyTab = ref<'use' | 'integration'>('use')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const isImagePreview = ref(true)
const processedFile = ref<File | null>(null)
const submitting = ref(false)
const resultMessage = ref('')
const resultSuccess = ref(false)
const resultDocUrl = ref('')
const copySubmitting = ref(false)
const copyResultMessage = ref('')
const copyResultSuccess = ref(false)
const copyResultDocUrl = ref('')

const runtimeConfig = useRuntimeConfig()
const apiBase = runtimeConfig.public.apiBase as string
const buildApiPath = (endpoint: string) => apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`

const canSubmit = computed(() => {
  return !!selectedFile.value
})

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  resultMessage.value = ''
  resultSuccess.value = false
  resultDocUrl.value = ''
  previewUrl.value = ''
  selectedFile.value = null
  processedFile.value = null
  if (!file) return

  if (!file.type.startsWith('image/')) {
    resultMessage.value = 'รองรับเฉพาะไฟล์รูปภาพเท่านั้น'
    if (input) input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    resultMessage.value = 'ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ใหม่'
    if (input) input.value = ''
    return
  }

  selectedFile.value = file
  const imageType = file.type.startsWith('image/')
  isImagePreview.value = imageType
  previewUrl.value = URL.createObjectURL(file)
}

async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (typeof window === 'undefined') return file
  if (file.size <= 900 * 1024) return file

  const bitmap = await createImageBitmap(file)
  const maxWidth = 1400
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8)
  })
  if (!blob) return file

  // Keep original if compression does not help.
  if (blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      const base64 = value.includes(',') ? value.split(',')[1] : value
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

async function submitToN8n() {
  if (!selectedFile.value) return

  submitting.value = true
  resultMessage.value = ''
  resultSuccess.value = false
  resultDocUrl.value = ''
  try {
    processedFile.value = await compressImageFile(selectedFile.value)
    const uploadFile = processedFile.value || selectedFile.value

    if (!uploadFile.type.startsWith('image/')) {
      throw new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น')
    }

    if (uploadFile.size > 1200 * 1024) {
      throw new Error('ไฟล์ใหญ่เกินกว่าที่ n8n รับได้ในตอนนี้ กรุณาใช้รูปเล็กลงหรือลดความละเอียด')
    }

    const fileBase64 = await fileToBase64(uploadFile)
    const payload = {
      file: {
        name: uploadFile.name,
        mimeType: uploadFile.type || 'application/octet-stream',
        size: uploadFile.size,
        contentBase64: fileBase64
      }
    }
    const res = await $fetch(buildApiPath('admin/doc-automate/submit'), {
      method: 'POST',
      credentials: 'include',
      body: payload
    }) as any
    resultSuccess.value = true
    resultDocUrl.value = String(res?.docUrl || '')
    resultMessage.value = res?.message || 'สร้าง Google Doc สำเร็จแล้ว'
    if (resultDocUrl.value) {
      openGoogleDoc()
    }
  } catch (e: any) {
    resultSuccess.value = false
    resultMessage.value = e?.data?.error || e?.data?.message || e?.message || 'ส่งเข้า n8n ไม่สำเร็จ'
  } finally {
    submitting.value = false
  }
}

function openGoogleDoc() {
  if (!resultDocUrl.value) return
  if (typeof window !== 'undefined') {
    window.open(resultDocUrl.value, '_blank', 'noopener,noreferrer')
  }
}

async function startCopyFlow() {
  copyResultMessage.value = ''
  copyResultSuccess.value = false
  copyResultDocUrl.value = ''

  copySubmitting.value = true
  try {
    const res = await $fetch(buildApiPath('admin/doc-automate/copy'), {
      method: 'POST',
      credentials: 'include',
      body: {
        source: 'admin-doc-automate',
        mode: 'copy-file',
        requestedAt: new Date().toISOString()
      }
    }) as any
    copyResultDocUrl.value = String(res?.docUrl || '')
    copyResultSuccess.value = true
    copyResultMessage.value = res?.message || 'เรียกใช้งานโหมดทำสำเนาไฟล์สำเร็จแล้ว'
    if (copyResultDocUrl.value) {
      openCopyGoogleDoc()
    }
  } catch (e: any) {
    copyResultSuccess.value = false
    copyResultMessage.value = e?.data?.error || e?.data?.message || e?.message || 'เรียกใช้งานโหมดทำสำเนาไฟล์ไม่สำเร็จ'
  } finally {
    copySubmitting.value = false
  }
}

function openCopyGoogleDoc() {
  if (!copyResultDocUrl.value) return
  if (typeof window !== 'undefined') {
    window.open(copyResultDocUrl.value, '_blank', 'noopener,noreferrer')
  }
}

useHead({
  title: 'UBU DocAutomate - Admin',
  meta: [{ name: 'description', content: 'Admin tool สำหรับสร้างเอกสารจาก Google Doc template ผ่าน n8n' }]
})
</script>

<style scoped>
.doc-loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 9999px;
  animation: doc-spin 0.9s linear infinite;
}

.doc-loading-dots span {
  display: inline-block;
  animation: doc-dot-fade 1.2s infinite;
}

.doc-loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.doc-loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.doc-loading-progress {
  animation: doc-progress-slide 1.3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

@keyframes doc-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes doc-dot-fade {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-1px);
  }
}

@keyframes doc-progress-slide {
  0% {
    transform: translateX(-130%);
  }
  100% {
    transform: translateX(370%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .doc-loading-spinner,
  .doc-loading-dots span,
  .doc-loading-progress {
    animation: none !important;
  }
}
</style>
