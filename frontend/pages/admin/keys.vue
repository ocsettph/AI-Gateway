<template>
  <div class="min-h-screen bg-transparent dark:bg-transparent py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">จัดการ API Keys (Admin)</h1>
          <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">ดูและแก้ไขเครดิต/สถานะของคีย์ทั้งหมด</p>
        </div>
        <NuxtLink to="/" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm whitespace-nowrap text-center">กลับ</NuxtLink>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ค้นหา (ชื่อคีย์/ผู้ใช้/อีเมล)</label>
            <input v-model="q" type="text" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="พิมพ์คำค้น..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">กรองตามคณะ/หน่วยงาน</label>
            <select v-model="department" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
              <option value="">ทั้งหมด</option>
              <option v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button @click="fetchKeys" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">ค้นหา</button>
          </div>
        </div>
        
        <!-- Admin Settings Section -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">ตั้งค่าการปิดการใช้งานอัตโนมัติ</h3>
          </div>
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 md:p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    จำนวนวันที่ไม่ได้ใช้งานก่อนปิดอัตโนมัติ (วัน)
                  </span>
                </label>
                <div class="relative">
                  <input 
                    v-model.number="autoDisableDays" 
                    type="number" 
                    min="1" 
                    class="w-full px-4 py-2.5 border-2 border-indigo-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all" 
                    placeholder="30"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">วัน</div>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">API keys ที่ไม่ได้ใช้งานเกินจำนวนวันนี้จะถูกปิดอัตโนมัติ</p>
              </div>
              <div class="flex flex-col gap-2">
                <button 
                  @click="saveSettings" 
                  :disabled="savingSettings"
                  class="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg v-if="!savingSettings" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
                </button>
                <button 
                  @click="runAutoDisable" 
                  :disabled="runningAutoDisable"
                  class="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg v-if="!runningAutoDisable" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ runningAutoDisable ? 'กำลังดำเนินการ...' : 'ปิดการใช้งานอัตโนมัติ' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-base md:text-lg font-medium text-gray-900 dark:text-white">รายการคีย์ทั้งหมด ({{ keys.length }})</h3>
        </div>
        <!-- Mobile Card View -->
        <div class="md:hidden p-4 space-y-4">
          <div v-for="k in keys" :key="k.id" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 
                    v-if="!editingNames[k.id]"
                    class="text-sm font-semibold text-gray-900 dark:text-white break-words"
                  >
                    {{ k.name }}
                  </h3>
                  <div v-else class="flex items-center gap-2 flex-1">
                    <input
                      v-model="editingNames[k.id]"
                      @keyup.enter="saveKeyName(k)"
                      @keyup.esc="cancelEditName(k.id)"
                      :data-key-id="k.id"
                      class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autofocus
                    />
                    <button
                      @click="saveKeyName(k)"
                      class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    >
                      บันทึก
                    </button>
                    <button
                      @click="cancelEditName(k.id)"
                      class="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                  <button
                    v-if="!editingNames[k.id]"
                    @click="startEditName(k)"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                    title="แก้ไขชื่อ"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{{ k.key_value?.slice(0,16) }}…</div>
              </div>
              <button @click="adminToggle(k)" :class="k.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'" class="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap flex-shrink-0 ml-2">
                {{ k.is_active ? 'Active' : 'Disabled' }}
              </button>
            </div>
            
            <div class="space-y-2 text-sm">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">ผู้ใช้:</span>
                <div class="text-gray-900 dark:text-white break-words">{{ k.fullname }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 break-all">{{ k.email }}</div>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">คณะ/หน่วยงาน:</span>
                <span class="text-gray-900 dark:text-white">{{ k.faculty || 'ไม่ระบุ' }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">ใช้งานแล้ว:</span>
                <span class="text-gray-900 dark:text-white">${{ money((k._used ?? k.current_spend) || 0) }}</span>
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">เครดิต (USD)</label>
              <div class="flex items-center gap-2">
                <input type="number" min="0" step="0.01" v-model.number="k._credit" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white text-sm"/>
                <span class="text-xs text-gray-500">USD</span>
              </div>
            </div>
            
            <div class="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button @click="openOverview(k)" class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white rounded text-gray-900 text-sm font-medium">
                รายละเอียด
              </button>
              <div class="grid grid-cols-2 gap-2">
                <button @click="save(k)" class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium">
                  บันทึก
                </button>
                <button @click="adminDelete(k)" class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto -mx-4 md:mx-0">
          <table class="min-w-full text-xs md:text-sm divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
            <thead class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium">ชื่อคีย์</th>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium">ผู้ใช้</th>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium">คณะ/หน่วยงาน</th>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium">เครดิต</th>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium">ใช้งานแล้ว</th>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium">สถานะ</th>
                <th class="px-3 md:px-4 lg:px-6 py-3 text-right text-xs font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
              <tr v-for="k in keys" :key="k.id">
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 min-w-0">
                      <div 
                        v-if="!editingNames[k.id]"
                        class="text-xs md:text-sm font-medium break-words"
                      >
                        {{ k.name }}
                      </div>
                      <div v-else class="flex items-center gap-2">
                        <input
                          v-model="editingNames[k.id]"
                          @keyup.enter="saveKeyName(k)"
                          @keyup.esc="cancelEditName(k.id)"
                          :data-key-id="k.id"
                          class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autofocus
                        />
                        <button
                          @click="saveKeyName(k)"
                          class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          บันทึก
                        </button>
                        <button
                          @click="cancelEditName(k.id)"
                          class="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                    <button
                      v-if="!editingNames[k.id]"
                      @click="startEditName(k)"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                      title="แก้ไขชื่อ"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">{{ k.key_value?.slice(0,8) }}…</div>
                </td>
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <div class="break-words">{{ k.fullname }}</div>
                  <div class="text-xs text-gray-400 break-all">{{ k.email }}</div>
                </td>
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-xs md:text-sm">{{ k.faculty || '-' }}</td>
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <div class="flex items-center gap-1 md:gap-2">
                    <input type="number" min="0" step="0.01" v-model.number="k._credit" class="w-16 md:w-20 lg:w-24 px-1 md:px-2 py-1 border rounded dark:bg-gray-700 dark:text-white text-xs"/>
                    <span class="text-xs text-gray-500 whitespace-nowrap">USD</span>
                  </div>
                </td>
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-xs md:text-sm">${{ money((k._used ?? k.current_spend) || 0) }}</td>
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <button @click="adminToggle(k)" :class="k.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'" class="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                    {{ k.is_active ? 'Active' : 'Disabled' }}
                  </button>
                </td>
                <td class="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-xs md:text-sm text-right">
                  <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1 md:gap-2">
                    <button @click="openOverview(k)" class="px-2 md:px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded text-gray-900 whitespace-nowrap text-xs">รายละเอียด</button>
                    <button @click="save(k)" class="px-2 md:px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 whitespace-nowrap text-xs">บันทึก</button>
                    <button @click="adminDelete(k)" class="px-2 md:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap text-xs">ลบ</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Overview Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md md:w-[520px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">รายละเอียดคีย์</h3>
            <button @click="showModal=false" class="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
          </div>
          <div class="space-y-2 text-sm">
            <div><span class="font-medium">ชื่อ:</span> {{ selected?.name }}</div>
            <div><span class="font-medium">ผู้ใช้:</span> {{ selected?.fullname }} ({{ selected?.email }})</div>
            <div><span class="font-medium">คณะ/หน่วยงาน:</span> {{ selected?.faculty || '-' }}</div>
            <div><span class="font-medium">สถานะ:</span> <span :class="selected?.is_active ? 'text-green-600' : 'text-red-600'">{{ selected?.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}</span></div>
            <div class="mt-2"><span class="font-medium">คีย์:</span> <code class="break-all bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">{{ selected?.key_value }}</code></div>
            <div class="mt-3">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">การใช้งาน</span>
                <span class="text-xs">${{ money(selected?._used ?? selected?.current_spend) }} / ${{ money(selected?._credit||selected?.credit_limit || 0) }}</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-neutral-700 rounded h-2">
                <div 
                  :class="[
                    usagePercent >= 100 || ((selected?._credit || selected?.credit_limit || 0) <= 0 && (selected?._used ?? selected?.current_spend) > 0) 
                      ? 'bg-red-600' 
                      : 'bg-indigo-600'
                  ]"
                  class="h-2 rounded transition-colors" 
                  :style="{ width: Math.min(100, usagePercent) + '%' }"
                ></div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Limit</div>
                <div class="font-medium">${{ money(selected?._credit||selected?.credit_limit) }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Used</div>
                <div class="font-medium">${{ money(selected?._used ?? selected?.current_spend) }}</div>
              </div>
            </div>
          </div>
          <div class="mt-5 flex justify-end space-x-2">
            <button @click="showModal=false" class="px-3 py-2 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded">ปิด</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'
// @ts-ignore Nuxt macro available at runtime
definePageMeta({ middleware: 'admin-only' })

const q = ref('')
const department = ref('')
const keys = ref<any[]>([])
const showModal = ref(false)
const selected = ref<any>(null)
const editingNames = ref<Record<number, string>>({})
const autoDisableDays = ref(30)
const savingSettings = ref(false)
const runningAutoDisable = ref(false)
const usagePercent = computed(() => {
  if (!selected.value) return 0
  const used = Number((selected.value._used ?? selected.value.current_spend) || 0)
  const limit = Number(selected.value._credit || selected.value.credit_limit || 0)
  
  // If limit is 0 or not set, show 0% (no limit) or 100% if used > 0 (exceeded)
  if (limit <= 0) {
    return used > 0 ? 100 : 0
  }
  
  // Calculate percentage, cap at 100%
  const percent = (used / limit) * 100
  return Math.min(100, Math.max(0, percent))
})

const departmentOptions = computed(() => {
  const set = new Set<string>()
  for (const k of keys.value) {
    if (k.faculty) set.add(k.faculty)
  }
  return Array.from(set).sort()
})

const apiBase = useRuntimeConfig().public.apiBase as string

const fetchKeys = async () => {
  const data = await $fetch(`${apiBase}/api/admin/keys`, { params: { q: q.value, department: department.value }, credentials: 'include' }) as { keys: any[] }
  keys.value = (data.keys || []).map(k => ({ ...k, _credit: Number(k.credit_limit || 0) }))
  // load precise usage total for each key for high-precision display
  await Promise.all(keys.value.map(async (it: any) => {
    try {
      const u: any = await $fetch(`${apiBase}/api/keys/usage`, { params: { value: it.key_value }, credentials: 'include' })
      it._used = Number(u?.total?.cost_usd || 0)
    } catch { it._used = Number(it.current_spend || 0) }
  }))
}

const save = async (k: any) => {
  try {
    await $fetch(`${apiBase}/api/admin/keys/${k.id}`, { method: 'PATCH', body: { credit_limit: k._credit, is_active: k.is_active }, credentials: 'include' })
    await fetchKeys()
  } catch (e) {
	try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ' }) } catch {}
  }
}

const startEditName = (k: any) => {
  editingNames.value[k.id] = k.name
  setTimeout(() => {
    const input = document.querySelector(`input[data-key-id="${k.id}"]`) as HTMLInputElement
    if (input) input.focus()
  }, 0)
}

const saveKeyName = async (k: any) => {
  const newName = editingNames.value[k.id]?.trim()
  if (!newName || newName === k.name) {
    cancelEditName(k.id)
    return
  }
  
  try {
    await $fetch(`${apiBase}/api/admin/keys/${k.id}`, {
      method: 'PATCH',
      body: { name: newName },
      credentials: 'include'
    })
    
    // Update local state
    k.name = newName
    delete editingNames.value[k.id]
    
    try {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'แก้ไขชื่อ API Key เรียบร้อยแล้ว' })
    } catch {}
  } catch (error) {
    console.error('Error updating key name:', error)
    try {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถแก้ไขชื่อ API Key ได้' })
    } catch {}
  }
}

const cancelEditName = (keyId: number) => {
  delete editingNames.value[keyId]
}

const openOverview = (k: any) => {
  selected.value = { ...k }
  showModal.value = true
}

const adminDelete = async (k: any) => {
  try {
    const Swal = (await import('sweetalert2')).default
    const res = await Swal.fire({ icon: 'warning', title: 'ลบคีย์นี้?', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!res.isConfirmed) return
  } catch {}
  try {
    await $fetch(`${apiBase}/api/admin/keys/${k.id}`, { method: 'DELETE', credentials: 'include' })
    await fetchKeys()
  } catch (e) {
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ลบคีย์ไม่สำเร็จ' }) } catch {}
  }
}

const adminToggle = async (k: any) => {
  try {
    await $fetch(`${apiBase}/api/admin/keys/${k.id}`, { method: 'PATCH', body: { is_active: !k.is_active }, credentials: 'include' })
    await fetchKeys()
  } catch (e) {
    // ignore
  }
}

async function loadSettings() {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const res = await $fetch(`${apiBase}/api/admin/settings`, { credentials: 'include' }) as { settings: any }
    if (res.settings?.auto_disable_inactive_days?.value) {
      autoDisableDays.value = Number(res.settings.auto_disable_inactive_days.value)
    }
  } catch (e) {
    console.error('Error loading settings:', e)
  }
}

async function saveSettings() {
  if (!autoDisableDays.value || autoDisableDays.value < 1) {
    try {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({ 
        icon: 'warning', 
        title: 'กรุณากรอกจำนวนวันให้ถูกต้อง',
        text: 'จำนวนวันต้องมากกว่า 0'
      })
    } catch {}
    return
  }
  
  savingSettings.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const res = await $fetch(`${apiBase}/api/admin/settings`, {
      method: 'PATCH',
      credentials: 'include',
      body: { key: 'auto_disable_inactive_days', value: autoDisableDays.value }
    })
    
    console.log('✅ Settings saved:', res)
    
    try {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({ 
        icon: 'success', 
        title: 'บันทึกการตั้งค่าสำเร็จ',
        html: `
          <div class="text-left">
            <p class="mb-2">บันทึกการตั้งค่าการปิดการใช้งานอัตโนมัติเรียบร้อยแล้ว</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              จำนวนวันที่ตั้งค่า: <strong>${autoDisableDays.value}</strong> วัน
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      })
    } catch {}
  } catch (e: any) {
    console.error('❌ Error saving settings:', e)
    try {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({ 
        icon: 'error', 
        title: 'บันทึกการตั้งค่าไม่สำเร็จ',
        text: e?.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า'
      })
    } catch {}
  } finally {
    savingSettings.value = false
  }
}

async function runAutoDisable() {
  try {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการปิดการใช้งานอัตโนมัติ',
      html: `
        <div class="text-left">
          <p class="mb-2">คุณต้องการปิดการใช้งาน API keys ที่ไม่ได้ใช้งานอัตโนมัติหรือไม่?</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            ระบบจะปิดการใช้งาน API keys ที่ไม่ได้ใช้งานเกิน <strong>${autoDisableDays.value}</strong> วัน
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280'
    })
    
    if (!result.isConfirmed) return
    
    runningAutoDisable.value = true
    const apiBase = useRuntimeConfig().public.apiBase as string
    const res = await $fetch(`${apiBase}/api/admin/auto-disable-inactive`, {
      method: 'POST',
      credentials: 'include'
    }) as { success: boolean, disabled_count: number, days: number, message: string }
    
    await Swal.fire({ 
      icon: res.disabled_count > 0 ? 'success' : 'info', 
      title: res.disabled_count > 0 ? 'สำเร็จ' : 'ไม่พบ API keys ที่ต้องปิด',
      html: `
        <div class="text-left">
          <p class="mb-2">${res.message || `ปิดการใช้งาน ${res.disabled_count} API keys`}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            จำนวนวันที่ตั้งค่า: <strong>${res.days}</strong> วัน
          </p>
        </div>
      `,
      confirmButtonColor: '#10b981'
    })
    
    // Refresh keys list
    await fetchKeys()
  } catch (e: any) {
    console.error('Error running auto-disable:', e)
    try {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({ 
        icon: 'error', 
        title: 'ปิดการใช้งานอัตโนมัติไม่สำเร็จ',
        text: e?.message || 'เกิดข้อผิดพลาดในการปิดการใช้งานอัตโนมัติ'
      })
    } catch {}
  } finally {
    runningAutoDisable.value = false
  }
}

onMounted(async () => {
  await loadSettings()
  await fetchKeys()
})

function money(v: any) {
  const n = Number(v || 0)
  if (!isFinite(n) || n === 0) return '0.00'
  if (n > 0 && n < 0.01) return n.toFixed(4)
  return n.toFixed(2)
}
</script>


