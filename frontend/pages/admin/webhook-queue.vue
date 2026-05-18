<template>
  <div class="min-h-screen bg-transparent dark:bg-transparent py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Webhook Queue Monitor</h1>
          <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">ติดตามคิวส่ง webhook ไป n8n และ requeue งานที่ล้มเหลว</p>
        </div>
        <div class="flex gap-2">
          <NuxtLink to="/admin/requests" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm whitespace-nowrap text-center">ไปหน้า Requests</NuxtLink>
          <NuxtLink to="/" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm whitespace-nowrap text-center">กลับ</NuxtLink>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <div class="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20 p-3">
            <p class="text-yellow-700 dark:text-yellow-300">Pending</p>
            <p class="text-xl font-semibold text-yellow-900 dark:text-yellow-200">{{ summary.pending }}</p>
          </div>
          <div class="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20 p-3">
            <p class="text-orange-700 dark:text-orange-300">Retry</p>
            <p class="text-xl font-semibold text-orange-900 dark:text-orange-200">{{ summary.retry }}</p>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 p-3">
            <p class="text-blue-700 dark:text-blue-300">Processing</p>
            <p class="text-xl font-semibold text-blue-900 dark:text-blue-200">{{ summary.processing }}</p>
          </div>
          <div class="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20 p-3">
            <p class="text-rose-700 dark:text-rose-300">Failed</p>
            <p class="text-xl font-semibold text-rose-900 dark:text-rose-200">{{ summary.failed }}</p>
          </div>
          <div class="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-3">
            <p class="text-emerald-700 dark:text-emerald-300">Sent</p>
            <p class="text-xl font-semibold text-emerald-900 dark:text-emerald-200">{{ summary.sent }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/20 p-3">
            <p class="text-slate-700 dark:text-slate-300">Total</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-200">{{ summary.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Filter Status</label>
            <select v-model="statusFilter" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
              <option value="">all</option>
              <option value="failed">failed</option>
              <option value="retry">retry</option>
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="sent">sent</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
            <select v-model="sortBy" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
              <option value="created_desc">created (newest)</option>
              <option value="created_asc">created (oldest)</option>
              <option value="attempts_desc">attempts (high-low)</option>
              <option value="attempts_asc">attempts (low-high)</option>
            </select>
          </div>
          <div class="flex items-end">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input v-model="autoRefresh" type="checkbox" />
              auto-refresh 3s
            </label>
          </div>
          <div class="flex items-end gap-2">
            <button :disabled="loading" @click="fetchQueue" class="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-60">รีเฟรช</button>
            <button :disabled="actionLoading || summary.failed === 0" @click="requeueAllFailed" class="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-60">Requeue Failed ทั้งหมด</button>
            <button :disabled="actionLoading || summary.failed === 0" @click="deleteAllFailed" class="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-60">ลบ Failed ทั้งหมด</button>
            <button :disabled="actionLoading || summary.sent === 0" @click="deleteAllSent" class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60">ลบ Sent ทั้งหมด</button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-gray-400">กำลังโหลดคิว...</div>
        <div v-else-if="sortedJobs.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">ไม่พบงานในคิว</div>
        <div v-else class="space-y-2">
          <div v-for="job in sortedJobs" :key="job.id" class="rounded-md border border-gray-200 dark:border-gray-700 p-3">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-white break-words">{{ job.label || `Job #${job.id}` }}</p>
                <p class="text-xs text-gray-600 dark:text-gray-300">#{{ job.id }} | status: {{ job.status }} | attempt {{ job.attempts }}/{{ job.max_attempts }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 break-words">{{ job.url }}</p>
                <p v-if="job.result_message" class="text-xs text-indigo-600 dark:text-indigo-300 break-words mt-1">{{ job.result_message }}</p>
                <p v-if="job.last_error" class="text-xs text-rose-600 dark:text-rose-300 break-words mt-1">{{ job.last_error }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="job.status === 'failed'"
                  :disabled="actionLoading || requeueJobId === job.id"
                  @click="requeueSingle(job.id)"
                  class="px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600 text-xs disabled:opacity-60"
                >
                  {{ requeueJobId === job.id ? 'กำลังส่ง...' : 'Requeue รายการนี้' }}
                </button>
                <button
                  v-if="job.status === 'failed'"
                  :disabled="actionLoading || deleteJobId === job.id"
                  @click="deleteSingle(job.id)"
                  class="px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-xs disabled:opacity-60"
                >
                  {{ deleteJobId === job.id ? 'กำลังลบ...' : 'ลบรายการนี้' }}
                </button>
                <button
                  v-if="job.status === 'sent'"
                  :disabled="actionLoading || deleteJobId === job.id"
                  @click="deleteSingleSent(job.id)"
                  class="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs disabled:opacity-60"
                >
                  {{ deleteJobId === job.id ? 'กำลังลบ...' : 'ลบรายการนี้' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'

// @ts-ignore - Nuxt macro available at runtime
definePageMeta({ middleware: 'admin-only' })

type Job = {
  id: number
  label: string
  status: string
  attempts: number
  max_attempts: number
  url: string
  last_error?: string
  result_message?: string
  created_at?: string
}

const apiBase = useRuntimeConfig().public.apiBase as string
const buildApiPath = (endpoint: string) => apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`

const loading = ref(false)
const actionLoading = ref(false)
const requeueJobId = ref<number | null>(null)
const deleteJobId = ref<number | null>(null)
const autoRefresh = ref(true)
const statusFilter = ref('')
const sortBy = ref('created_desc')
const jobs = ref<Job[]>([])
const summary = ref({ pending: 0, retry: 0, failed: 0, processing: 0, sent: 0, total: 0 })
let intervalId: ReturnType<typeof setInterval> | null = null

const sortedJobs = computed(() => {
  const list = [...jobs.value]
  if (sortBy.value === 'created_asc') {
    list.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
  } else if (sortBy.value === 'attempts_desc') {
    list.sort((a, b) => Number(b.attempts || 0) - Number(a.attempts || 0))
  } else if (sortBy.value === 'attempts_asc') {
    list.sort((a, b) => Number(a.attempts || 0) - Number(b.attempts || 0))
  } else {
    list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  }
  return list
})

const fetchQueue = async () => {
  loading.value = true
  try {
    const query = new URLSearchParams()
    query.set('limit', '120')
    if (statusFilter.value) query.set('status', statusFilter.value)
    const res = await $fetch(buildApiPath(`admin/n8n-webhook-queue?${query.toString()}`), { credentials: 'include' }) as any
    summary.value = {
      pending: Number(res?.summary?.pending || 0),
      retry: Number(res?.summary?.retry || 0),
      failed: Number(res?.summary?.failed || 0),
      processing: Number(res?.summary?.processing || 0),
      sent: Number(res?.summary?.sent || 0),
      total: Number(res?.summary?.total || 0)
    }
    jobs.value = Array.isArray(res?.jobs) ? res.jobs : []
  } catch (e) {
    console.error('Load queue monitor failed:', e)
  } finally {
    loading.value = false
  }
}

const confirmBulkAction = async (title: string, text: string, confirmText: string, confirmColor: string) => {
  try {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: confirmColor
    })
    return !!result.isConfirmed
  } catch {
    return true
  }
}

const requeueSingle = async (jobId: number) => {
  requeueJobId.value = jobId
  try {
    await $fetch(buildApiPath('admin/n8n-webhook-queue/requeue-failed'), {
      method: 'POST',
      credentials: 'include',
      body: { ids: [jobId] }
    })
    await fetchQueue()
  } catch (e) {
    console.error('Requeue single failed:', e)
  } finally {
    requeueJobId.value = null
  }
}

const requeueAllFailed = async () => {
  const ok = await confirmBulkAction(
    'ยืนยัน Requeue Failed ทั้งหมด',
    `ต้องการนำงาน failed ทั้งหมดกลับเข้าคิวอีกครั้งใช่หรือไม่? (จำนวน ${summary.value.failed} งาน)`,
    'Requeue',
    '#f59e0b'
  )
  if (!ok) return
  actionLoading.value = true
  try {
    await $fetch(buildApiPath('admin/n8n-webhook-queue/requeue-failed'), {
      method: 'POST',
      credentials: 'include'
    })
    await fetchQueue()
  } catch (e) {
    console.error('Requeue all failed error:', e)
  } finally {
    actionLoading.value = false
  }
}

const deleteSingle = async (jobId: number) => {
  deleteJobId.value = jobId
  try {
    await $fetch(buildApiPath('admin/n8n-webhook-queue/delete-failed'), {
      method: 'POST',
      credentials: 'include',
      body: { ids: [jobId] }
    })
    await fetchQueue()
  } catch (e) {
    console.error('Delete single failed:', e)
  } finally {
    deleteJobId.value = null
  }
}

const deleteAllFailed = async () => {
  const ok = await confirmBulkAction(
    'ยืนยันลบ Failed ทั้งหมด',
    `ต้องการลบงาน failed ทั้งหมดใช่หรือไม่? (จำนวน ${summary.value.failed} งาน)`,
    'ลบทั้งหมด',
    '#e11d48'
  )
  if (!ok) return
  actionLoading.value = true
  try {
    await $fetch(buildApiPath('admin/n8n-webhook-queue/delete-failed'), {
      method: 'POST',
      credentials: 'include'
    })
    await fetchQueue()
  } catch (e) {
    console.error('Delete all failed error:', e)
  } finally {
    actionLoading.value = false
  }
}

const deleteSingleSent = async (jobId: number) => {
  deleteJobId.value = jobId
  try {
    await $fetch(buildApiPath('admin/n8n-webhook-queue/delete-sent'), {
      method: 'POST',
      credentials: 'include',
      body: { ids: [jobId] }
    })
    await fetchQueue()
  } catch (e) {
    console.error('Delete single sent failed:', e)
  } finally {
    deleteJobId.value = null
  }
}

const deleteAllSent = async () => {
  const ok = await confirmBulkAction(
    'ยืนยันลบ Sent ทั้งหมด',
    `ต้องการลบงาน sent ทั้งหมดใช่หรือไม่? (จำนวน ${summary.value.sent} งาน)`,
    'ลบทั้งหมด',
    '#059669'
  )
  if (!ok) return
  actionLoading.value = true
  try {
    await $fetch(buildApiPath('admin/n8n-webhook-queue/delete-sent'), {
      method: 'POST',
      credentials: 'include'
    })
    await fetchQueue()
  } catch (e) {
    console.error('Delete all sent error:', e)
  } finally {
    actionLoading.value = false
  }
}

const setupInterval = () => {
  if (intervalId) clearInterval(intervalId)
  if (!autoRefresh.value) return
  intervalId = setInterval(() => {
    fetchQueue().catch(() => {})
  }, 3000)
}

watch(autoRefresh, setupInterval)
watch(statusFilter, () => { fetchQueue(); })

onMounted(async () => {
  await fetchQueue()
  setupInterval()
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

