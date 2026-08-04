<template>
  <div class="min-h-screen bg-transparent dark:bg-transparent py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">คำขอ API Key</h1>
          <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">อนุมัติ/ปฏิเสธคำขอจากผู้ใช้</p>
        </div>
        <NuxtLink to="/" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm whitespace-nowrap text-center">กลับ</NuxtLink>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white">คิวส่ง Webhook ไป n8n</h2>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              to="/admin/webhook-queue"
              class="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
            >
              เปิด Queue Monitor
            </NuxtLink>
            <button
              :disabled="queueLoading || queueActionLoading"
              @click="fetchQueueStatus()"
              class="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-60"
            >
              รีเฟรช
            </button>
            <button
              :disabled="queueLoading || queueActionLoading || queueSummary.failed === 0"
              @click="requeueFailedJobs()"
              class="px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
            >
              Requeue Failed ({{ queueSummary.failed }})
            </button>
            <button
              :disabled="queueLoading || queueActionLoading || queueSummary.failed === 0"
              @click="deleteFailedJobs()"
              class="px-3 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
            >
              ลบ Failed ({{ queueSummary.failed }})
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div class="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20 p-3">
            <p class="text-yellow-700 dark:text-yellow-300">Pending</p>
            <p class="text-xl font-semibold text-yellow-900 dark:text-yellow-200">{{ queueSummary.pending }}</p>
          </div>
          <div class="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20 p-3">
            <p class="text-orange-700 dark:text-orange-300">Retry</p>
            <p class="text-xl font-semibold text-orange-900 dark:text-orange-200">{{ queueSummary.retry }}</p>
          </div>
          <div class="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20 p-3">
            <p class="text-rose-700 dark:text-rose-300">Failed</p>
            <p class="text-xl font-semibold text-rose-900 dark:text-rose-200">{{ queueSummary.failed }}</p>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 p-3">
            <p class="text-blue-700 dark:text-blue-300">Processing</p>
            <p class="text-xl font-semibold text-blue-900 dark:text-blue-200">{{ queueSummary.processing }}</p>
          </div>
          <div class="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-3">
            <p class="text-emerald-700 dark:text-emerald-300">Sent</p>
            <p class="text-xl font-semibold text-emerald-900 dark:text-emerald-200">{{ queueSummary.sent }}</p>
          </div>
        </div>

        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">รายการ Failed ล่าสุด</p>
          <div v-if="queueFailedJobs.length === 0" class="text-xs text-gray-500 dark:text-gray-400">
            ไม่มีงาน failed
          </div>
          <div v-else class="space-y-2">
            <div v-for="job in queueFailedJobs" :key="job.id" class="rounded-md border border-gray-200 dark:border-gray-700 p-2 text-xs">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium text-gray-800 dark:text-gray-100">{{ job.label || `Job #${job.id}` }}</p>
                  <p class="text-gray-600 dark:text-gray-300">attempt {{ job.attempts }}/{{ job.max_attempts }}</p>
                  <p v-if="job.result_message" class="text-indigo-600 dark:text-indigo-300 break-words">{{ job.result_message }}</p>
                  <p class="text-rose-600 dark:text-rose-300 break-words">{{ job.last_error || 'unknown error' }}</p>
                </div>
                <button
                  :disabled="queueActionLoading || requeueJobId === job.id"
                  @click="requeueSingleJob(job.id)"
                  class="px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 whitespace-nowrap"
                >
                  {{ requeueJobId === job.id ? 'กำลังส่ง...' : 'Requeue' }}
                </button>
                <button
                  :disabled="queueActionLoading || deleteJobId === job.id"
                  @click="deleteSingleFailedJob(job.id)"
                  class="px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 whitespace-nowrap"
                >
                  {{ deleteJobId === job.id ? 'กำลังลบ...' : 'ลบ' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <div class="mb-6 flex flex-wrap gap-2">
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold"
            :class="activeTab === 'api-key' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'"
            @click="activeTab = 'api-key'"
          >
            คำขอ API Key
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold"
            :class="activeTab === 'chatbot-code' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'"
            @click="activeTab = 'chatbot-code'"
          >
            คำขอโค้ด Chatbot
            <span v-if="pendingChatbotCount > 0" class="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{{ pendingChatbotCount }}</span>
          </button>
        </div>

        <!-- Filters -->
        <div v-if="activeTab === 'api-key'" class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ค้นหาชื่อ/อีเมล/บัญชี</label>
            <input v-model="searchQuery" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="พิมพ์คำค้น..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">กรองตามหน่วยงาน</label>
            <select v-model="deptFilter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
              <option value="">ทั้งหมด</option>
              <option v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>
        <div v-if="loading" class="text-center py-8">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>

        <div v-else-if="activeTab === 'api-key'">
          <div v-if="filteredRequests.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            ไม่มีคำขอรออนุมัติ
          </div>
          <div v-else class="space-y-4">
            <div v-for="req in filteredRequests" :key="req.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-5 bg-gray-50 dark:bg-gray-700">
              <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 break-words">{{ req.api_key_name }}</h3>
                  <div class="text-sm text-gray-700 dark:text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1">
                    <p><span class="font-medium">ผู้ขอ:</span> {{ req.first_name }} {{ req.last_name }}</p>
                    <p><span class="font-medium">บัญชี:</span> {{ req.ubuaccount || '-' }}</p>
                    <p><span class="font-medium">อีเมล:</span> <span class="break-all">{{ req.email }}</span></p>
                    <p><span class="font-medium">รหัสนักศึกษา/บุคลากร:</span> {{ req.student_id || '-' }}</p>
                    <p class="md:col-span-2"><span class="font-medium">คณะ/หน่วยงาน:</span> {{ req.department || 'ไม่ระบุ' }}</p>
                    <p><span class="font-medium">เครดิต:</span> ${{ req.credit_limit }}</p>
                    <p><span class="font-medium">การใช้งานที่คาดหวัง:</span> {{ req.expected_usage || '-' }}</p>
                    <p class="md:col-span-2"><span class="font-medium">วัตถุประสงค์:</span> {{ req.purpose || '-' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 md:col-span-2">ส่งเมื่อ: {{ formatDate(req.created_at) }}</p>
                  </div>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 lg:ml-4">
                  <button
                    :disabled="processingId===req.id"
                    @click="reject(req)"
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-tr from-red-600 to-rose-600 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm whitespace-nowrap"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    ปฏิเสธ
                  </button>
                  <button
                    :disabled="processingId===req.id"
                    @click="approve(req)"
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-tr from-green-600 to-emerald-600 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm whitespace-nowrap"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    อนุมัติ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <div v-if="filteredChatbotRequests.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            ไม่มีคำขอโค้ด Chatbot รออนุมัติ
          </div>
          <div v-else class="space-y-4">
            <div v-for="req in filteredChatbotRequests" :key="`chatbot-${req.id}`" class="border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 md:p-5 bg-amber-50/60 dark:bg-amber-900/10">
              <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 break-words">{{ req.project_name }}</h3>
                  <div class="text-sm text-gray-700 dark:text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1">
                    <p><span class="font-medium">ผู้ขอ:</span> {{ req.user_fullname || '-' }}</p>
                    <p><span class="font-medium">บัญชี:</span> {{ req.ubuaccount || '-' }}</p>
                    <p><span class="font-medium">อีเมล:</span> <span class="break-all">{{ req.email || '-' }}</span></p>
                    <p class="md:col-span-2"><span class="font-medium">เว็บไซต์:</span> {{ req.website_url || '-' }}</p>
                    <p class="md:col-span-2"><span class="font-medium">หน่วยงาน:</span> {{ req.department_name || req.faculty || 'ไม่ระบุ' }}</p>
                    <p><span class="font-medium">ประเภท:</span> {{ req.usage_type || '-' }}</p>
                    <p class="md:col-span-2"><span class="font-medium">วัตถุประสงค์:</span> {{ req.purpose || '-' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 md:col-span-2">ส่งเมื่อ: {{ formatDate(req.created_at) }}</p>
                  </div>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 lg:ml-4">
                  <button
                    :disabled="processingChatbotId===req.id"
                    @click="rejectChatbot(req)"
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-tr from-red-600 to-rose-600 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm whitespace-nowrap"
                  >
                    ปฏิเสธ
                  </button>
                  <button
                    :disabled="processingChatbotId===req.id"
                    @click="approveChatbot(req)"
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-tr from-amber-600 to-orange-600 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm whitespace-nowrap"
                  >
                    อนุมัติ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

declare const useRuntimeConfig: any
declare const useRoute: any
declare const navigateTo: any

// @ts-ignore - Nuxt macro available at runtime
definePageMeta({ middleware: 'admin-only' })

const loading = ref(true)
const activeTab = ref<'api-key' | 'chatbot-code'>('api-key')
const requests = ref<any[]>([])
const chatbotRequests = ref<any[]>([])
const searchQuery = ref('')
const deptFilter = ref('')
const processingId = ref<number | null>(null)
const processingChatbotId = ref<number | null>(null)
const queueLoading = ref(false)
const queueActionLoading = ref(false)
const requeueJobId = ref<number | null>(null)
const deleteJobId = ref<number | null>(null)
const queueSummary = ref({ pending: 0, retry: 0, failed: 0, processing: 0, sent: 0, total: 0 })
const queueFailedJobs = ref<any[]>([])
const AUTO_REFRESH_MS = 5000
let requestsAutoRefreshTimer: ReturnType<typeof setInterval> | null = null
let queueAutoRefreshTimer: ReturnType<typeof setInterval> | null = null

const apiBase = useRuntimeConfig().public.apiBase as string
const buildApiPath = (endpoint: string) => apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`

const fetchChatbotRequests = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const res = await $fetch(buildApiPath('admin/chatbot-code-requests'), { credentials: 'include' }) as { requests: any[] }
    chatbotRequests.value = (res.requests || []).filter(r => r.status === 'pending')

    const route = useRoute()
    const approveId = route.query.approveChatbot
    if (approveId) {
      activeTab.value = 'chatbot-code'
      const requestId = Number(approveId)
      const reqToApprove = chatbotRequests.value.find(r => r.id === requestId)
      if (reqToApprove) {
        await approveChatbot(reqToApprove)
        await navigateTo({ query: {} })
      }
    }
  } catch (e) {
    console.error('Error loading chatbot code requests:', e)
  } finally {
    if (!silent) loading.value = false
  }
}

const fetchRequests = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const res = await $fetch(buildApiPath('admin/requests'), { credentials: 'include' }) as { requests: any[] }
    requests.value = (res.requests || []).filter(r => r.status === 'pending')
    
    // Check if there's an approve parameter in URL (from Google Chat button)
    const route = useRoute()
    const approveId = route.query.approve
    if (approveId) {
      const requestId = Number(approveId)
      const reqToApprove = requests.value.find(r => r.id === requestId)
      if (reqToApprove) {
        // Auto-approve the request
        await approve(reqToApprove)
        // Remove query parameter
        await navigateTo({ query: {} })
      }
    }
  } catch (e) {
    console.error('Error loading admin requests:', e)
  } finally {
    if (!silent) loading.value = false
  }
}

const departmentOptions = computed(() => {
  const set = new Set<string>()
  for (const r of requests.value) {
    if (r.department) set.add(r.department)
  }
  return Array.from(set).sort()
})

const filteredRequests = computed(() => {
  let list = requests.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r =>
      (r.first_name + ' ' + r.last_name).toLowerCase().includes(q) ||
      String(r.email || '').toLowerCase().includes(q) ||
      String(r.ubuaccount || '').toLowerCase().includes(q)
    )
  }
  if (deptFilter.value) {
    list = list.filter(r => r.department === deptFilter.value)
  }
  return list
})

const pendingChatbotCount = computed(() => chatbotRequests.value.length)

const filteredChatbotRequests = computed(() => {
  let list = chatbotRequests.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r =>
      String(r.project_name || '').toLowerCase().includes(q) ||
      String(r.user_fullname || '').toLowerCase().includes(q) ||
      String(r.email || '').toLowerCase().includes(q) ||
      String(r.ubuaccount || '').toLowerCase().includes(q)
    )
  }
  return list
})

const fetchQueueStatus = async () => {
  queueLoading.value = true
  try {
    const res = await $fetch(buildApiPath('admin/n8n-webhook-queue?limit=30'), { credentials: 'include' }) as any
    queueSummary.value = {
      pending: Number(res?.summary?.pending || 0),
      retry: Number(res?.summary?.retry || 0),
      failed: Number(res?.summary?.failed || 0),
      processing: Number(res?.summary?.processing || 0),
      sent: Number(res?.summary?.sent || 0),
      total: Number(res?.summary?.total || 0)
    }
    queueFailedJobs.value = Array.isArray(res?.jobs) ? res.jobs.filter((j: any) => j.status === 'failed').slice(0, 10) : []
  } catch (e) {
    console.error('Load queue status failed:', e)
  } finally {
    queueLoading.value = false
  }
}

const requeueFailedJobs = async () => {
  queueActionLoading.value = true
  try {
    const result = await $fetch(buildApiPath('admin/n8n-webhook-queue/requeue-failed'), {
      method: 'POST',
      credentials: 'include'
    }) as any
    await fetchQueueStatus()
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: `Requeue แล้ว ${result?.requeued || 0} งาน` }) } catch {}
  } catch (e) {
    console.error('Requeue failed jobs error:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'Requeue ไม่สำเร็จ' }) } catch {}
  } finally {
    queueActionLoading.value = false
  }
}

const deleteFailedJobs = async () => {
  queueActionLoading.value = true
  try {
    const result = await $fetch(buildApiPath('admin/n8n-webhook-queue/delete-failed'), {
      method: 'POST',
      credentials: 'include'
    }) as any
    await fetchQueueStatus()
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: `ลบแล้ว ${result?.deleted || 0} งาน` }) } catch {}
  } catch (e) {
    console.error('Delete failed jobs error:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ลบ Failed ไม่สำเร็จ' }) } catch {}
  } finally {
    queueActionLoading.value = false
  }
}

const requeueSingleJob = async (jobId: number) => {
  requeueJobId.value = jobId
  try {
    const result = await $fetch(buildApiPath('admin/n8n-webhook-queue/requeue-failed'), {
      method: 'POST',
      credentials: 'include',
      body: { ids: [jobId] }
    }) as any
    await fetchQueueStatus()
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: `Requeue แล้ว ${result?.requeued || 0} งาน` }) } catch {}
  } catch (e) {
    console.error('Requeue single failed job error:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'Requeue รายการนี้ไม่สำเร็จ' }) } catch {}
  } finally {
    requeueJobId.value = null
  }
}

const deleteSingleFailedJob = async (jobId: number) => {
  deleteJobId.value = jobId
  try {
    const result = await $fetch(buildApiPath('admin/n8n-webhook-queue/delete-failed'), {
      method: 'POST',
      credentials: 'include',
      body: { ids: [jobId] }
    }) as any
    await fetchQueueStatus()
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: `ลบแล้ว ${result?.deleted || 0} งาน` }) } catch {}
  } catch (e) {
    console.error('Delete single failed job error:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ลบรายการนี้ไม่สำเร็จ' }) } catch {}
  } finally {
    deleteJobId.value = null
  }
}

const approve = async (reqItem: any) => {
  try {
    processingId.value = reqItem.id
    await $fetch(buildApiPath(`admin/requests/${reqItem.id}/approve`), { method: 'POST', credentials: 'include' })
    requests.value = requests.value.filter(r => r.id !== reqItem.id)
    await fetchQueueStatus()
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: 'อนุมัติแล้ว' }) } catch {}
  } catch (e) {
    console.error('Approve failed:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'อนุมัติไม่สำเร็จ' }) } catch {}
  } finally {
    processingId.value = null
  }
}

const reject = async (reqItem: any) => {
  try {
    processingId.value = reqItem.id
    await $fetch(buildApiPath(`admin/requests/${reqItem.id}/reject`), { method: 'POST', credentials: 'include' })
    requests.value = requests.value.filter(r => r.id !== reqItem.id)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: 'ปฏิเสธแล้ว' }) } catch {}
  } catch (e) {
    console.error('Reject failed:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ปฏิเสธไม่สำเร็จ' }) } catch {}
  } finally {
    processingId.value = null
  }
}

const approveChatbot = async (reqItem: any) => {
  try {
    processingChatbotId.value = reqItem.id
    await $fetch(buildApiPath(`admin/chatbot-code-requests/${reqItem.id}/approve`), { method: 'POST', credentials: 'include' })
    chatbotRequests.value = chatbotRequests.value.filter(r => r.id !== reqItem.id)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: 'อนุมัติโค้ด Chatbot แล้ว' }) } catch {}
  } catch (e) {
    console.error('Approve chatbot request failed:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'อนุมัติไม่สำเร็จ' }) } catch {}
  } finally {
    processingChatbotId.value = null
  }
}

const rejectChatbot = async (reqItem: any) => {
  try {
    processingChatbotId.value = reqItem.id
    await $fetch(buildApiPath(`admin/chatbot-code-requests/${reqItem.id}/reject`), { method: 'POST', credentials: 'include' })
    chatbotRequests.value = chatbotRequests.value.filter(r => r.id !== reqItem.id)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: 'ปฏิเสธแล้ว' }) } catch {}
  } catch (e) {
    console.error('Reject chatbot request failed:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ปฏิเสธไม่สำเร็จ' }) } catch {}
  } finally {
    processingChatbotId.value = null
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  })
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([fetchRequests(true), fetchChatbotRequests(true)])
  } finally {
    loading.value = false
  }
})
onMounted(fetchQueueStatus)
onMounted(() => {
  requestsAutoRefreshTimer = setInterval(() => {
    fetchRequests(true).catch(() => {})
    fetchChatbotRequests(true).catch(() => {})
  }, AUTO_REFRESH_MS)
  queueAutoRefreshTimer = setInterval(() => {
    fetchQueueStatus().catch(() => {})
  }, AUTO_REFRESH_MS)
})
onUnmounted(() => {
  if (requestsAutoRefreshTimer) clearInterval(requestsAutoRefreshTimer)
  if (queueAutoRefreshTimer) clearInterval(queueAutoRefreshTimer)
})
</script>


