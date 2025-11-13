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

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <!-- Filters -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <div v-else>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// @ts-ignore - Nuxt macro available at runtime
definePageMeta({ middleware: 'admin-only' })

const loading = ref(true)
const requests = ref<any[]>([])
const searchQuery = ref('')
const deptFilter = ref('')
const processingId = ref<number | null>(null)

const apiBase = useRuntimeConfig().public.apiBase as string

const fetchRequests = async () => {
  loading.value = true
  try {
    const res = await $fetch(`${apiBase}/api/admin/requests`, { credentials: 'include' }) as { requests: any[] }
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
    loading.value = false
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

const approve = async (reqItem: any) => {
  try {
    processingId.value = reqItem.id
    await $fetch(`${apiBase}/api/admin/requests/${reqItem.id}/approve`, { method: 'POST', credentials: 'include' })
    requests.value = requests.value.filter(r => r.id !== reqItem.id)
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
    await $fetch(`${apiBase}/api/admin/requests/${reqItem.id}/reject`, { method: 'POST', credentials: 'include' })
    requests.value = requests.value.filter(r => r.id !== reqItem.id)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'success', title: 'ปฏิเสธแล้ว' }) } catch {}
  } catch (e) {
    console.error('Reject failed:', e)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ปฏิเสธไม่สำเร็จ' }) } catch {}
  } finally {
    processingId.value = null
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  })
}

onMounted(fetchRequests)
</script>


