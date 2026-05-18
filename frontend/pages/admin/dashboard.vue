<template>
  <div class="min-h-screen bg-transparent dark:bg-transparent py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard สถิติ (Admin)</h1>
          <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {{ filterLabel }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="loadStats"
            :disabled="loading"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            {{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
          <button
            @click="exportReport"
            :disabled="loading"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2"
            title="ส่งออกเป็น CSV สำหรับนำไปรายงาน"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export รายงาน
          </button>
          <NuxtLink to="/status" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm whitespace-nowrap">กลับ</NuxtLink>
        </div>
      </div>

      <!-- ช่วงเวลา: แถบเดียว ไม่มีกล่องโหมด -->
      <div class="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span class="text-gray-500 dark:text-gray-400">ช่วงเวลา</span>
        <select
          v-model="filterMode"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 min-w-[8rem]"
        >
          <option value="all">ทั้งหมด</option>
          <option value="month">เลือกเดือน</option>
          <option value="date">เลือกวันที่</option>
          <option value="range">เลือกช่วงวันที่</option>
        </select>
        <template v-if="filterMode === 'month'">
          <select v-model="filterYear" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 w-20">
            <option value="">ปี</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
          <select v-model="filterMonth" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 min-w-[7rem]">
            <option value="">เดือน</option>
            <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">{{ name }}</option>
          </select>
        </template>
        <template v-if="filterMode === 'date'">
          <input v-model="filterSingleDate" type="date" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
        </template>
        <template v-if="filterMode === 'range'">
          <input v-model="filterStartDate" type="date" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
          <span class="text-gray-400">–</span>
          <input v-model="filterEndDate" type="date" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
        </template>
        <button
          @click="applyFilter"
          :disabled="loading || !canApplyFilter"
          class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          {{ loading ? '...' : 'ดูสรุป' }}
        </button>
        <button type="button" @click="setQuickFilter('thisMonth')" class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
          เดือนนี้
        </button>
        <button type="button" @click="setQuickFilter('lastMonth')" class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
          เดือนที่แล้ว
        </button>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
        {{ error }}
      </div>

      <!-- ช่วงที่แสดง (กำกับทุกส่วน) -->
      <div v-if="stats.filter?.start && stats.filter?.end" class="mb-4 flex items-center gap-2">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ช่วงที่แสดง:</span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          {{ rangeLabel }}
        </span>
      </div>
      <div v-else class="mb-4">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">สรุปทั้งหมด (ไม่กรองช่วงเวลา)</span>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">ยอดคงเหลือ OpenRouter (USD)</div>
          <div class="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            <span v-if="openrouterLoading">...</span>
            <span v-else-if="openrouterBalance !== null">${{ money(openrouterBalance) }}</span>
            <span v-else class="text-gray-500 dark:text-gray-400">{{ openrouterError || '-' }}</span>
          </div>
          <p v-if="openrouterError && openrouterBalance === null" class="mt-1 text-xs text-amber-600 dark:text-amber-400 break-words">{{ openrouterError }}</p>
          <p v-else-if="openrouterBalance === null && !openrouterLoading" class="mt-1 text-xs text-gray-400">ถ้าแสดง - : ตั้งค่า OPENROUTER_TOKEN หรือใช้ provisioning key ที่ openrouter.ai</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">ค่าใช้จ่ายรวม (USD)</div>
          <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${{ money(totalSpend) }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">จำนวนคำขอทั้งหมด</div>
          <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ stats.requests?.total ?? 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">รออนุมัติ</div>
          <div class="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.requests?.pending ?? 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">อนุมัติแล้ว / ปฏิเสธ</div>
          <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ (stats.requests?.approved ?? 0) }} / {{ stats.requests?.rejected ?? 0 }}</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">ค่าใช้จ่ายแยกตามคณะ</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabelShort }}</span>
          </div>
          <div class="h-72">
            <canvas ref="chartFaculty"></canvas>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">จำนวนการขอใช้งาน (สถานะ)</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabelShort }}</span>
          </div>
          <div class="h-72 flex items-center justify-center">
            <canvas ref="chartRequests"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 mb-8">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">ค่าใช้จ่ายรายคน (Top 15)</h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabelShort }}</span>
        </div>
        <div class="h-80">
          <canvas ref="chartPerson"></canvas>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">สรุปตามคณะ</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabelShort }}</span>
          </div>
          <div class="p-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
            <input
              v-model="facultyTableSearch"
              type="text"
              placeholder="กรองตามชื่อคณะ..."
              class="flex-1 min-w-0 max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5"
            />
            <select
              v-model="facultySortOrder"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5"
            >
              <option value="desc">สูงสุด-ต่ำสุด</option>
              <option value="asc">ต่ำสุด-สูงสุด</option>
            </select>
          </div>
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">คณะ</th>
                  <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">ผู้ใช้</th>
                  <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">คีย์</th>
                  <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">ใช้ไป (USD)</th>
                </tr>
              </thead>
              <tbody class="text-gray-900 dark:text-gray-100 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="row in filteredByFaculty" :key="row.faculty">
                  <td class="px-4 py-2">{{ row.faculty }}</td>
                  <td class="px-4 py-2 text-right">{{ row.user_count }}</td>
                  <td class="px-4 py-2 text-right">{{ row.keys_count }}</td>
                  <td class="px-4 py-2 text-right">${{ money(row.total_spend) }}</td>
                </tr>
                <tr v-if="!filteredByFaculty.length">
                  <td colspan="4" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">ค่าใช้จ่ายรายคน</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabelShort }}</span>
          </div>
          <div class="p-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
            <input
              v-model="personTableSearch"
              type="text"
              placeholder="กรองตามชื่อหรือคณะ..."
              class="flex-1 min-w-0 max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5"
            />
            <select
              v-model="personSortOrder"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5"
            >
              <option value="desc">สูงสุด-ต่ำสุด</option>
              <option value="asc">ต่ำสุด-สูงสุด</option>
            </select>
          </div>
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">ผู้ใช้</th>
                  <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">คณะ</th>
                  <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">คีย์</th>
                  <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">ใช้ไป (USD)</th>
                </tr>
              </thead>
              <tbody class="text-gray-900 dark:text-gray-100 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="row in filteredByPerson" :key="row.id">
                  <td class="px-4 py-2">
                    <div>{{ row.label }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.email }}</div>
                  </td>
                  <td class="px-4 py-2">{{ row.faculty }}</td>
                  <td class="px-4 py-2 text-right">{{ row.keys_count }}</td>
                  <td class="px-4 py-2 text-right">${{ money(row.total_spend) }}</td>
                </tr>
                <tr v-if="!filteredByPerson.length">
                  <td colspan="4" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRuntimeConfig, useHead } from 'nuxt/app'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  ArcElement,
  PieController,
  Tooltip,
  Legend
} from 'chart.js'

// @ts-expect-error Nuxt macro
definePageMeta({ middleware: 'admin-only' })

Chart.register(CategoryScale, LinearScale, BarController, BarElement, ArcElement, PieController, Tooltip, Legend)
Chart.defaults.font.family = "'Kanit', sans-serif"
Chart.defaults.plugins.tooltip.titleFont = { family: "'Kanit', sans-serif" }
Chart.defaults.plugins.tooltip.bodyFont = { family: "'Kanit', sans-serif" }
Chart.defaults.plugins.legend.labels.font = { family: "'Kanit', sans-serif" }

const loading = ref(false)
const error = ref('')
const stats = ref<{
  byPerson: Array<{ id: number; label: string; faculty: string; email: string; total_spend: number; keys_count: number }>
  byFaculty: Array<{ faculty: string; user_count: number; keys_count: number; total_spend: number }>
  requests: { total: number; pending: number; approved: number; rejected: number }
  filter?: { start: string; end: string } | null
}>({
  byPerson: [],
  byFaculty: [],
  requests: { total: 0, pending: 0, approved: 0, rejected: 0 }
})

type FilterMode = 'all' | 'month' | 'date' | 'range'
const filterMode = ref<FilterMode>('all')
const filterYear = ref<string>('')
const filterMonth = ref<string>('')
const filterSingleDate = ref<string>('')
const filterStartDate = ref<string>('')
const filterEndDate = ref<string>('')

const facultyTableSearch = ref('')
const facultySortOrder = ref<'asc' | 'desc'>('desc')
const personTableSearch = ref('')
const personSortOrder = ref<'asc' | 'desc'>('desc')

const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

function formatDateThai(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m) return iso
  return `${d || 1} ${monthNames[m - 1]} ${y + 543}`
}

function formatRangeThai(start: string, end: string): string {
  const endDate = new Date(end)
  endDate.setDate(endDate.getDate() - 1)
  const lastDay = endDate.toISOString().slice(0, 10)
  if (start === lastDay) return formatDateThai(start)
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = lastDay.split('-').map(Number)
  const yThai = sy ? sy + 543 : ''
  if (sy === ey && sm === em) return `${sd}–${ed} ${monthNames[sm - 1]} ${yThai}`
  return `${formatDateThai(start)} – ${formatDateThai(lastDay)}`
}

const rangeLabel = computed(() => {
  const f = stats.value.filter
  if (!f?.start || !f?.end) return 'ทั้งหมด'
  return formatRangeThai(f.start, f.end)
})

const rangeLabelShort = computed(() => {
  const f = stats.value.filter
  if (!f?.start || !f?.end) return 'ทั้งหมด'
  return formatRangeThai(f.start, f.end)
})

const filterLabel = computed(() => {
  const f = stats.value.filter
  if (f?.start && f?.end) {
    return `สถิติค่าใช้จ่ายรายคน คณะ และจำนวนการขอใช้งาน — ${rangeLabel.value}`
  }
  return 'สถิติค่าใช้จ่ายรายคน คณะ และจำนวนการขอใช้งาน — สรุปทั้งหมด'
})

const canApplyFilter = computed(() => {
  if (filterMode.value === 'all') return true
  if (filterMode.value === 'month') return !!(filterYear.value && filterMonth.value)
  if (filterMode.value === 'date') return !!filterSingleDate.value
  if (filterMode.value === 'range') return !!(filterStartDate.value && filterEndDate.value && filterStartDate.value <= filterEndDate.value)
  return false
})

function setQuickFilter(which: 'thisMonth' | 'lastMonth') {
  filterMode.value = 'month'
  const d = new Date()
  if (which === 'lastMonth') d.setMonth(d.getMonth() - 1)
  filterYear.value = String(d.getFullYear())
  filterMonth.value = String(d.getMonth() + 1)
  loadStats()
}

function applyFilter() {
  loadStats()
}

const chartPerson = ref<HTMLCanvasElement | null>(null)
const chartFaculty = ref<HTMLCanvasElement | null>(null)
const chartRequests = ref<HTMLCanvasElement | null>(null)
let chartPersonInstance: Chart | null = null
let chartFacultyInstance: Chart | null = null
let chartRequestsInstance: Chart | null = null

const openrouterBalance = ref<number | null>(null)
const openrouterLoading = ref(false)
const openrouterError = ref('')

const totalSpend = computed(() => {
  return (stats.value.byPerson || []).reduce((sum, p) => sum + Number(p.total_spend || 0), 0)
})

const filteredByFaculty = computed(() => {
  let list = [...(stats.value.byFaculty || [])]
  const q = facultyTableSearch.value.trim().toLowerCase()
  if (q) list = list.filter(r => (r.faculty || '').toLowerCase().includes(q))
  list.sort((a, b) => {
    const va = Number(a.total_spend || 0)
    const vb = Number(b.total_spend || 0)
    return facultySortOrder.value === 'desc' ? vb - va : va - vb
  })
  return list
})

const filteredByPerson = computed(() => {
  let list = [...(stats.value.byPerson || [])]
  const q = personTableSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(r =>
      (r.label || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.faculty || '').toLowerCase().includes(q)
    )
  }
  list.sort((a, b) => {
    const va = Number(a.total_spend || 0)
    const vb = Number(b.total_spend || 0)
    return personSortOrder.value === 'desc' ? vb - va : va - vb
  })
  return list
})

const apiBase = useRuntimeConfig().public.apiBase as string
const buildApiPath = (endpoint: string) =>
  apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`

function money(n: unknown) {
  const v = Number(n || 0)
  if (!isFinite(v)) return '0.00'
  if (v === 0) return '0.0000'
  if (v > 0 && v < 1) return v.toFixed(6)
  return v.toFixed(2)
}

function csvEscape(val: string | number): string {
  const s = String(val ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function exportReport() {
  const req = stats.value.requests || {}
  const lines: string[] = []
  const now = new Date()
  const dateStr = now.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  lines.push('UBU AI SERVICE - Dashboard Export')
  lines.push(`วันที่ส่งออก,${dateStr}`)
  if (stats.value.filter?.start && stats.value.filter?.end) {
    lines.push(`ช่วงที่กรอง,${stats.value.filter.start} ถึง ${stats.value.filter.end}`)
  }
  lines.push('')
  lines.push('สรุป')
  lines.push('รายการ,ค่า')
  lines.push(`ยอดคงเหลือ OpenRouter (USD),${openrouterBalance.value != null ? money(openrouterBalance.value) : '-'}`)
  lines.push(`ค่าใช้จ่ายรวม (USD),${totalSpend.value}`)
  lines.push(`จำนวนคำขอทั้งหมด,${req.total ?? 0}`)
  lines.push(`รออนุมัติ,${req.pending ?? 0}`)
  lines.push(`อนุมัติแล้ว,${req.approved ?? 0}`)
  lines.push(`ปฏิเสธ,${req.rejected ?? 0}`)
  lines.push('')
  lines.push('ค่าใช้จ่ายแยกตามคณะ')
  lines.push('คณะ,จำนวนผู้ใช้,จำนวนคีย์,ใช้ไป (USD)')
  for (const r of filteredByFaculty.value) {
    lines.push([csvEscape(r.faculty), r.user_count, r.keys_count, money(r.total_spend)].join(','))
  }
  lines.push('')
  lines.push('ค่าใช้จ่ายรายคน')
  lines.push('ชื่อ,อีเมล,คณะ,จำนวนคีย์,ใช้ไป (USD)')
  for (const r of filteredByPerson.value) {
    lines.push([csvEscape(r.label), csvEscape(r.email), csvEscape(r.faculty), r.keys_count, money(r.total_spend)].join(','))
  }
  const csv = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-export-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function loadOpenRouterCredits() {
  openrouterLoading.value = true
  openrouterError.value = ''
  openrouterBalance.value = null
  try {
    const res = await $fetch(buildApiPath('admin/openrouter/credits'), { credentials: 'include' }) as any
    if (res.balance != null && typeof res.balance === 'number') {
      openrouterBalance.value = res.balance
    } else if (res.error) {
      openrouterError.value = res.error
    } else if (!res.configured) {
      openrouterError.value = 'ยังไม่ได้ตั้งค่า OpenRouter'
    }
  } catch (e: any) {
    openrouterError.value = e?.data?.error || e?.message || 'โหลดยอดไม่สำเร็จ'
  } finally {
    openrouterLoading.value = false
  }
}

function buildStatsParams(): URLSearchParams {
  const params = new URLSearchParams()
  const mode = filterMode.value
  if (mode === 'all') return params
  if (mode === 'month' && filterYear.value && filterMonth.value) {
    params.set('year', filterYear.value)
    params.set('month', filterMonth.value)
    return params
  }
  if (mode === 'date' && filterSingleDate.value) {
    params.set('start', filterSingleDate.value)
    const next = new Date(filterSingleDate.value)
    next.setDate(next.getDate() + 1)
    params.set('end', next.toISOString().slice(0, 10))
    return params
  }
  if (mode === 'range' && filterStartDate.value && filterEndDate.value) {
    params.set('start', filterStartDate.value)
    const endExclusive = new Date(filterEndDate.value)
    endExclusive.setDate(endExclusive.getDate() + 1)
    params.set('end', endExclusive.toISOString().slice(0, 10))
    return params
  }
  return params
}

async function loadStats() {
  loading.value = true
  error.value = ''
  const params = buildStatsParams()
  const qs = params.toString()
  const url = qs ? `${buildApiPath('admin/stats')}?${qs}` : buildApiPath('admin/stats')
  try {
    const [statsRes] = await Promise.all([
      $fetch(url, { credentials: 'include' }) as Promise<any>,
      loadOpenRouterCredits()
    ])
    stats.value = {
      byPerson: statsRes.byPerson || [],
      byFaculty: statsRes.byFaculty || [],
      requests: statsRes.requests || { total: 0, pending: 0, approved: 0, rejected: 0 },
      filter: statsRes.filter ?? null
    }
    await nextTick()
    destroyCharts()
    renderCharts()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'โหลดสถิติไม่สำเร็จ'
    stats.value = { byPerson: [], byFaculty: [], requests: { total: 0, pending: 0, approved: 0, rejected: 0 } }
    await loadOpenRouterCredits()
  } finally {
    loading.value = false
  }
}

function destroyCharts() {
  if (chartPersonInstance) {
    chartPersonInstance.destroy()
    chartPersonInstance = null
  }
  if (chartFacultyInstance) {
    chartFacultyInstance.destroy()
    chartFacultyInstance = null
  }
  if (chartRequestsInstance) {
    chartRequestsInstance.destroy()
    chartRequestsInstance = null
  }
}

function renderCharts() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#e5e7eb' : '#374151'
  const gridColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'

  const byFaculty = stats.value.byFaculty || []
  if (chartFaculty.value && byFaculty.length > 0) {
    chartFacultyInstance = new Chart(chartFaculty.value, {
      type: 'bar',
      data: {
        labels: byFaculty.map((f: any) => f.faculty.length > 20 ? f.faculty.slice(0, 18) + '…' : f.faculty),
        datasets: [{
          label: 'ค่าใช้จ่าย (USD)',
          data: byFaculty.map((f: any) => Number(f.total_spend || 0)),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` $${Number(ctx.raw).toFixed(4)}` } }
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { family: "'Kanit', sans-serif" } },
            grid: { color: gridColor }
          },
          y: {
            ticks: { color: textColor, maxRotation: 0, font: { family: "'Kanit', sans-serif" } },
            grid: { display: false }
          }
        }
      }
    })
  }

  const byPerson = (stats.value.byPerson || []).slice(0, 15)
  if (chartPerson.value && byPerson.length > 0) {
    chartPersonInstance = new Chart(chartPerson.value, {
      type: 'bar',
      data: {
        labels: byPerson.map((p: any) => (p.label || '').length > 12 ? (p.label || '').slice(0, 10) + '…' : p.label),
        datasets: [{
          label: 'ค่าใช้จ่าย (USD)',
          data: byPerson.map((p: any) => Number(p.total_spend || 0)),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` $${Number(ctx.raw).toFixed(4)}` } }
        },
        scales: {
          x: {
            ticks: { color: textColor, maxRotation: 45, font: { family: "'Kanit', sans-serif" } },
            grid: { display: false }
          },
          y: {
            ticks: { color: textColor, font: { family: "'Kanit', sans-serif" } },
            grid: { color: gridColor }
          }
        }
      }
    })
  }

  const req = stats.value.requests || {}
  const pending = Number(req.pending ?? 0)
  const approved = Number(req.approved ?? 0)
  const rejected = Number(req.rejected ?? 0)
  if (chartRequests.value && (pending + approved + rejected > 0)) {
    chartRequestsInstance = new Chart(chartRequests.value, {
      type: 'pie',
      data: {
        labels: ['รออนุมัติ', 'อนุมัติแล้ว', 'ปฏิเสธ'],
        datasets: [{
          data: [pending, approved, rejected],
          backgroundColor: ['rgba(245, 158, 11, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: "'Kanit', sans-serif" } }
          },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} รายการ` },
            titleFont: { family: "'Kanit', sans-serif" },
            bodyFont: { family: "'Kanit', sans-serif" }
          }
        }
      }
    })
  }
}

onMounted(() => {
  loadStats()
})

onBeforeUnmount(() => {
  destroyCharts()
})

useHead({
  title: 'Dashboard สถิติ - UBU AI SERVICE',
  meta: [{ name: 'description', content: 'สถิติค่าใช้จ่ายและจำนวนการขอใช้งาน UBU AI SERVICE' }]
})
</script>
