<template>
  <div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8 md:mb-12">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4">API Status</h1>
        <p class="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300">ดูสถานะและการใช้งาน API ของคุณ</p>
      </div>

			<!-- Service Status -->
      <div :class="['grid gap-8', isAdmin ? 'md:grid-cols-2' : 'md:grid-cols-1']">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your APIs</h2>
          <div v-if="keys.length === 0" class="text-sm text-gray-500 dark:text-gray-400">ไม่มี API ของคุณ หรือยังไม่ได้เข้าสู่ระบบ</div>
          <div v-else class="space-y-3">
            <div v-for="k in keys" :key="k.id" class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <button class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline" @click="openKey(k)">{{ k.name }}</button>
                <div class="text-xs text-gray-500 dark:text-gray-400">สร้างเมื่อ: {{ new Date(k.created_at).toLocaleString('th-TH') }}</div>
              </div>
              <div class="text-right text-sm text-gray-700 dark:text-gray-200">
                <div>ใช้ไป ${{ money((k._used ?? k.current_spend) || 0) }} / จำกัด ${{ number(k.credit_limit || 0) }}</div>
                <div class="text-xs" :class="k.is_active ? 'text-green-600' : 'text-red-500'">{{ k.is_active ? 'Active' : 'Disabled' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isAdmin" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Admin Dashboard</h2>
          <div v-if="!isAdmin" class="text-gray-500 dark:text-gray-400 text-sm">สำหรับผู้ดูแลระบบเท่านั้น</div>
          <div v-else>
            <div class="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input 
                v-model="adminSearchQuery" 
                type="text" 
                placeholder="ค้นหาชื่อหรืออีเมล..." 
                class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
                @input="loadOverview"
              />
              <select 
                v-model="adminFilterFaculty" 
                class="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
                @change="loadOverview"
              >
                <option value="">ทั้งหมด</option>
                <option v-for="faculty in facultyOptions" :key="faculty" :value="faculty">{{ faculty }}</option>
              </select>
              <button @click="loadOverview" class="px-3 py-1 text-xs sm:text-sm bg-indigo-600 text-white rounded whitespace-nowrap">รีเฟรช</button>
            </div>
            <div class="overflow-x-auto -mx-4 md:mx-0">
              <table class="min-w-full text-sm">
                <thead class="text-left text-gray-600 dark:text-gray-300">
                  <tr>
                    <th class="py-2 pr-4">ผู้ใช้</th>
                    <th class="py-2 pr-4">คณะ</th>
                    <th class="py-2 pr-4">จำนวนคีย์</th>
                    <th class="py-2 pr-4">ใช้ไป (USD)</th>
                    <th class="py-2 pr-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="text-gray-900 dark:text-gray-100">
                  <tr v-for="it in overview" :key="it.id" class="border-t border-gray-200 dark:border-gray-700">
                    <td class="py-2 pr-4">
                      <div>{{ it.label }}</div>
                      <div class="text-xs text-gray-400">{{ it.email }}</div>
                    </td>
                    <td class="py-2 pr-4">{{ it.faculty || '-' }}</td>
                    <td class="py-2 pr-4">{{ it.keys_count }}</td>
                    <td class="py-2 pr-4">${{ money(it.total_spend) }}</td>
                    <td class="py-2 pr-4">
                      <button 
                        @click="openUserUsage(it)" 
                        class="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                  <tr v-if="overview.length === 0">
                    <td colspan="5" class="py-4 text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
			</div>

      <!-- Model usage statistics (separate card) -->
      <div v-if="isAdmin" class="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">สถิติการใช้งานตาม Model</h3>
        <div class="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs sm:text-sm">
          <label class="whitespace-nowrap">Model</label>
          <input v-model="filterModel" placeholder="เช่น openai/gpt-4o" class="flex-1 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" />
          <label class="whitespace-nowrap">ตั้งแต่</label>
          <input type="date" v-model="adminStart" class="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" />
          <label class="whitespace-nowrap">ถึง</label>
          <input type="date" v-model="adminEnd" class="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" />
          <button @click="loadModelsUsage" class="px-3 py-1 bg-indigo-600 text-white rounded whitespace-nowrap">กรอง</button>
        </div>
        <div v-if="modelsUsageLoading" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        <div v-else class="overflow-x-auto -mx-4 md:mx-0">
          <table class="min-w-full text-sm">
            <thead class="text-left text-gray-600 dark:text-gray-300">
              <tr>
                <th class="py-2 pr-4">ผู้ใช้</th>
                <th class="py-2 pr-4">คณะ</th>
                <th class="py-2 pr-4">API</th>
                <th class="py-2 pr-4">Model</th>
                <th class="py-2 pr-4">Calls</th>
                <th class="py-2 pr-4">Tokens (in/out)</th>
                <th class="py-2 pr-4">Cost (USD)</th>
              </tr>
            </thead>
            <tbody class="text-gray-900 dark:text-gray-100">
              <tr v-for="row in modelsUsage" :key="row.api_name + row.model + row.fullname" class="border-t border-gray-200 dark:border-gray-700">
                <td class="py-2 pr-4">{{ row.fullname || '-' }}</td>
                <td class="py-2 pr-4">{{ row.faculty || '-' }}</td>
                <td class="py-2 pr-4">{{ row.api_name || '-' }}</td>
                <td class="py-2 pr-4">{{ row.model || '-' }}</td>
                <td class="py-2 pr-4">{{ row.calls }}</td>
                <td class="py-2 pr-4">{{ row.tokens_in }} / {{ row.tokens_out }}</td>
                <td class="py-2 pr-4">${{ money(row.cost_usd) }}</td>
              </tr>
              <tr v-if="!modelsUsage || modelsUsage.length===0">
                <td colspan="7" class="py-4 text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูลสถิติในช่วงที่เลือก</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

			<!-- Recent Incidents -->
            <div class="mt-8 text-xs text-gray-500 dark:text-gray-400">อัปเดตล่าสุด: {{ serverTimeFmt }}</div>

            <!-- Key usage modal -->
            <div v-if="showModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div class="bg-white dark:bg-gray-800 rounded-lg w-[720px] max-w-[90vw] max-h-[90vh] overflow-y-auto p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      {{ selectedUser ? `รายละเอียดการใช้งาน - ${selectedUser.label}` : `รายละเอียดการใช้งาน - ${selectedKey?.name}` }}
                    </h3>
                    <div v-if="selectedUser" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      คลิกที่ API key เพื่อดูรายละเอียดการใช้งาน
                    </div>
                  </div>
                  <button @click="closeModal" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div class="mb-3 flex items-center gap-2 text-sm">
                  <label>ตั้งแต่</label>
                  <input type="date" v-model="filterStart" class="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" />
                  <label>ถึง</label>
                  <input type="date" v-model="filterEnd" class="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" />
                  <button @click="selectedUser ? loadUserUsage() : loadKeyUsage()" class="px-3 py-1 bg-indigo-600 text-white rounded">กรอง</button>
                </div>
                <div v-if="usageLoading" class="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
                <div v-else>
                  <!-- Show keys list for user view -->
                  <div v-if="selectedUser && userUsageData.keys" class="space-y-4 mb-4">
                    <div v-for="keyData in userUsageData.keys" :key="keyData.id" 
                         class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                         @click="viewKeyDetails(keyData)">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <h4 class="font-semibold text-gray-900 dark:text-white">{{ keyData.name }}</h4>
                            <span class="text-xs text-blue-600 dark:text-blue-400">คลิกเพื่อดูรายละเอียด</span>
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">สร้างเมื่อ: {{ new Date(keyData.created_at).toLocaleString('th-TH') }}</div>
                        </div>
                        <div class="text-right text-sm">
                          <div class="text-gray-700 dark:text-gray-200">ใช้ไป ${{ money(keyData.total?.cost_usd) }} / จำกัด ${{ number(keyData.credit_limit || 0) }}</div>
                          <div class="text-xs" :class="keyData.is_active ? 'text-green-600' : 'text-red-500'">{{ keyData.is_active ? 'Active' : 'Disabled' }}</div>
                        </div>
                      </div>
                      <div class="mb-2 text-xs text-gray-600 dark:text-gray-400">รวม: ${{ money(keyData.total?.cost_usd) }} • tokens in {{ keyData.total?.tokens_in }} / out {{ keyData.total?.tokens_out }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {{ keyData.by_model?.length || 0 }} รายการการใช้งาน
                      </div>
                    </div>
                    <div v-if="userUsageData.keys && userUsageData.keys.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      ไม่มี API Key
                    </div>
                  </div>
                  
                  <!-- Show single key usage for key view -->
                  <div v-else>
                    <div class="mb-3 text-sm text-gray-700 dark:text-gray-200">รวม: ${{ money(keyUsage.total?.cost_usd) }} • tokens in {{ keyUsage.total?.tokens_in }} / out {{ keyUsage.total?.tokens_out }}</div>
                    <table class="min-w-full text-sm">
                      <thead class="text-left text-gray-600 dark:text-gray-300">
                        <tr>
                          <th class="py-2 pr-4">Model</th>
                          <th class="py-2 pr-4">Calls</th>
                          <th class="py-2 pr-4">Tokens (in/out)</th>
                          <th class="py-2 pr-4">Cost (USD)</th>
                        </tr>
                      </thead>
                      <tbody class="text-gray-900 dark:text-gray-100">
                        <tr v-for="row in keyUsage.by_model" :key="row.model" class="border-t border-gray-200 dark:border-gray-700">
                          <td class="py-2 pr-4">{{ row.model || '-' }}</td>
                          <td class="py-2 pr-4">{{ row.calls }}</td>
                          <td class="py-2 pr-4">{{ row.tokens_in }} / {{ row.tokens_out }}</td>
                          <td class="py-2 pr-4">${{ money(row.cost_usd) }}</td>
                        </tr>
                        <tr v-if="!keyUsage.by_model || keyUsage.by_model.length===0">
                          <td class="py-4 text-center text-gray-500 dark:text-gray-400" colspan="4">ยังไม่มีข้อมูลการใช้งาน</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useHead, useRuntimeConfig } from 'nuxt/app';
import { ref, computed, onMounted } from 'vue'

useHead({ 
	title: 'System Status - UBU AI SERVICE',
	meta: [
		{ name: 'description', content: 'สถานะระบบ UBU AI SERVICE' }
	]
});

const serverTime = ref<string>('')
const serverTimeFmt = computed(() => serverTime.value ? new Date(serverTime.value).toLocaleString('th-TH') : '-')

const isAdmin = ref(false)
const overview = ref<any[]>([])
const keys = ref<any[]>([])
const showModal = ref(false)
const selectedKey = ref<any>(null)
const selectedUser = ref<any>(null)
const keyUsage = ref<any>({ by_model: [], total: {} })
const userUsageData = ref<any>({ keys: [], total: {} })
const usageLoading = ref(false)
const filterStart = ref<string>('')
const filterEnd = ref<string>('')
// Admin model usage
const adminStart = ref<string>('')
const adminEnd = ref<string>('')
const filterModel = ref<string>('')
const modelsUsage = ref<any[]>([])
const modelsUsageLoading = ref(false)
// Admin search and filter
const adminSearchQuery = ref<string>('')
const adminFilterFaculty = ref<string>('')
const facultyOptions = computed(() => {
  const set = new Set<string>()
  overview.value.forEach(item => {
    if (item.faculty && item.faculty !== '-') set.add(item.faculty)
  })
  return Array.from(set).sort()
})

const loadStatus = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const apiPath = apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/status` : `${apiBase}/api/status`
    const res = await $fetch<{ serverTime?: string }>(apiPath)
    serverTime.value = res?.serverTime ?? ''
  } catch {}
}

const loadOverview = async () => {
  if (!isAdmin.value) return
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const params: any = {}
    if (adminSearchQuery.value) params.q = adminSearchQuery.value
    if (adminFilterFaculty.value) params.faculty = adminFilterFaculty.value
    console.log('🔍 [frontend] Loading overview with params:', params)
    const apiPath = apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/admin/usage` : `${apiBase}/api/admin/usage`
    const res = await $fetch(apiPath, { params, credentials: 'include' }) as any
    console.log('🔍 [frontend] Overview response:', res)
    overview.value = res.items || []
    console.log('🔍 [frontend] Overview items count:', overview.value.length)
  } catch (e) {
    console.error('🔍 [frontend] Error loading overview:', e)
    overview.value = []
  }
}

onMounted(async () => {
  await loadStatus()
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const buildApiPath = (endpoint: string) => apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`
    const me: any = await $fetch(buildApiPath('me'), { credentials: 'include' })
    isAdmin.value = me?.user?.role === 'ADMIN'
    // load user's keys to show per-API usage/services
    try {
      const k = await $fetch(buildApiPath('keys'), { credentials: 'include' }) as any
      keys.value = k?.keys || []
      // Load precise used cost per key for high-precision display
      await Promise.all(keys.value.map(async (it: any) => {
        try {
          const u: any = await $fetch(buildApiPath('keys/usage'), { params: { value: it.key_value }, credentials: 'include' })
          it._used = Number(u?.total?.cost_usd || 0)
        } catch { it._used = Number(it.current_spend || 0) }
      }))
    } catch {}
    if (isAdmin.value) await loadOverview()
  } catch { isAdmin.value = false }
})

function number(n: any) {
  return Number(n || 0).toFixed(2)
}

function money(n: any) {
  const v = Number(n || 0)
  if (!isFinite(v) || v === 0) return '0.00'
  // Show more decimal places for small values to see actual cost
  if (v > 0 && v < 0.0001) return v.toFixed(6)
  if (v > 0 && v < 0.01) return v.toFixed(4)
  return v.toFixed(2)
}

function openKey(k: any) {
  selectedKey.value = k
  selectedUser.value = null
  showModal.value = true
  filterStart.value = ''
  filterEnd.value = ''
  loadKeyUsage()
}

function openUserUsage(user: any) {
  selectedUser.value = user
  selectedKey.value = null
  showModal.value = true
  filterStart.value = ''
  filterEnd.value = ''
  loadUserUsage()
}

function viewKeyDetails(keyData: any) {
  // Set selected key and clear selected user to show key details view
  selectedKey.value = {
    id: keyData.id,
    name: keyData.name,
    key_value: keyData.key_value
  }
  selectedUser.value = null
  userUsageData.value = { keys: [], total: {} }
  // Load key usage
  loadKeyUsage()
}

function closeModal() {
  showModal.value = false
  selectedKey.value = null
  selectedUser.value = null
  userUsageData.value = { keys: [], total: {} }
}

async function loadKeyUsage() {
  if (!selectedKey.value) return
  usageLoading.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const buildApiPath = (endpoint: string) => apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`
    const params: any = {}
    if (filterStart.value) params.start = filterStart.value
    if (filterEnd.value) params.end = filterEnd.value
    const keyVal = selectedKey.value?.key_value
    const res = await $fetch(buildApiPath('keys/usage'), { params: { ...params, value: keyVal }, credentials: 'include' }) as any
    keyUsage.value = res || { by_model: [], total: {} }
  } catch {
    keyUsage.value = { by_model: [], total: {} }
  } finally {
    usageLoading.value = false
  }
}

async function loadUserUsage() {
  if (!selectedUser.value) return
  usageLoading.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const params: any = {}
    if (filterStart.value) params.start = filterStart.value
    if (filterEnd.value) params.end = filterEnd.value
    console.log('🔍 [frontend] Loading user usage for user', selectedUser.value.id, 'with params:', params)
    const res = await $fetch(`${apiBase}/api/admin/usage/user/${selectedUser.value.id}`, { params, credentials: 'include' }) as any
    console.log('🔍 [frontend] User usage response:', res)
    console.log('🔍 [frontend] Keys count:', res?.keys?.length || 0)
    if (res?.keys && res.keys.length > 0) {
      console.log('🔍 [frontend] First key:', res.keys[0])
      console.log('🔍 [frontend] First key by_model:', res.keys[0]?.by_model?.length || 0, 'rows')
      console.log('🔍 [frontend] First key total:', res.keys[0]?.total)
    }
    userUsageData.value = res || { keys: [], total: {} }
    console.log('🔍 [frontend] userUsageData.value after assignment:', userUsageData.value)
  } catch (e) {
    console.error('❌ [frontend] Error loading user usage:', e)
    userUsageData.value = { keys: [], total: {} }
  } finally {
    usageLoading.value = false
  }
}

async function loadModelsUsage() {
  if (!isAdmin.value) return
  modelsUsageLoading.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const params: any = {}
    if (adminStart.value) params.start = adminStart.value
    if (adminEnd.value) params.end = adminEnd.value
    if (filterModel.value) params.model = filterModel.value
    const buildApiPath = (endpoint: string) => apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`
    const res = await $fetch(buildApiPath('admin/usage/models'), { params, credentials: 'include' }) as any
    modelsUsage.value = res?.items || []
  } catch {
    modelsUsage.value = []
  } finally {
    modelsUsageLoading.value = false
  }
}
</script>