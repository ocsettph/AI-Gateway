<template>
  <div class="min-h-screen bg-transparent dark:bg-transparent py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">จัดการผู้ใช้</h1>
            <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">จัดการข้อมูลผู้ใช้และสิทธิ์การเข้าถึง</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:space-x-3">
            <button
              @click="showAddModal = true"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span>เพิ่มผู้ใช้</span>
            </button>
            <NuxtLink 
              to="/" 
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              <span>กลับ</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">ผู้ใช้ทั้งหมด</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalUsers }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">ผู้ใช้ที่ใช้งาน</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.activeUsers }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Admin</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.adminUsers }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">ผู้ใช้ใหม่วันนี้</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.newUsersToday }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filter Controls -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-4">ค้นหาและกรองผู้ใช้</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ค้นหาชื่อผู้ใช้</label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="พิมพ์ชื่อผู้ใช้..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <!-- Role Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by role</label>
              <select
                v-model="roleFilter"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            
            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by status</label>
              <select
                v-model="statusFilter"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          
          <!-- Clear Filters Button -->
          <div class="mt-4 flex justify-center sm:justify-end">
            <button
              @click="clearFilters"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors w-full sm:w-auto"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 class="text-base md:text-lg font-medium text-gray-900 dark:text-white">รายชื่อผู้ใช้ ({{ filteredUsers.length }} คน)</h3>
            <div class="flex items-center gap-2">
              <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">แสดง</span>
              <select
                v-model="itemsPerPage"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">รายการต่อหน้า</span>
            </div>
          </div>
        </div>
        
        <!-- Mobile Card View -->
        <div class="md:hidden p-4 space-y-4">
          <div v-for="user in paginatedUsers" :key="user.id" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <svg v-if="isMale(user.fullname)" class="w-6 h-6 text-blue-700 dark:text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v1h14v-1c0-2.761-3.134-5-7-5z"/>
                    </svg>
                    <svg v-else class="w-6 h-6 text-pink-700 dark:text-pink-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm3 2h-1.268A7.962 7.962 0 0012 13c-1.012 0-1.98.188-2.732.532H8c-2.761 0-5 2.014-5 4.5V21h18v-2.968C21 16.014 18.761 14 16 14z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ user.fullname }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ user.ubuaccount }}</div>
                </div>
              </div>
            </div>
            <div class="space-y-1 text-sm">
              <div><span class="font-medium text-gray-700 dark:text-gray-300">คณะ:</span> <span class="text-gray-900 dark:text-white">{{ user.faculty }}</span></div>
              <div><span class="font-medium text-gray-700 dark:text-gray-300">หน่วยงาน:</span> <span class="text-gray-900 dark:text-white">{{ user.department_name }}</span></div>
              <div><span class="font-medium text-gray-700 dark:text-gray-300">ตำแหน่ง:</span> <span class="text-gray-900 dark:text-white">{{ user.position }}</span></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span :class="getStatusClass(user.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                {{ getStatusText(user.status) }}
              </span>
              <span :class="getRoleClass(user.role)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                {{ getRoleText(user.role) }}
              </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              สมัครเมื่อ: {{ formatDate(user.created_at) }}
            </div>
            <div class="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                @click="editUser(user)"
                class="flex-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 border border-indigo-600 dark:border-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                แก้ไข
              </button>
              <button
                @click="deleteUser(user)"
                class="flex-1 px-3 py-2 text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
        
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ผู้ใช้</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">คณะ/หน่วยงาน</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ตำแหน่ง</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">บทบาท</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่สมัคร</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <!-- Default avatar as person icon: male if name starts with 'นาย', otherwise female -->
                        <svg v-if="isMale(user.fullname)" class="w-6 h-6 text-blue-700 dark:text-blue-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v1h14v-1c0-2.761-3.134-5-7-5z"/>
                        </svg>
                        <svg v-else class="w-6 h-6 text-pink-700 dark:text-pink-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm3 2h-1.268A7.962 7.962 0 0012 13c-1.012 0-1.98.188-2.732.532H8c-2.761 0-5 2.014-5 4.5V21h18v-2.968C21 16.014 18.761 14 16 14z"/>
                        </svg>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{{ user.fullname }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ user.ubuaccount }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ user.faculty }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ user.department_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ user.position }}</div>
                  <div v-if="user.level_name" class="text-sm text-gray-500 dark:text-gray-400">{{ user.level_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(user.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(user.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getRoleClass(user.role)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getRoleText(user.role) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="editUser(user)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      แก้ไข
                    </button>
                    <button
                      @click="deleteUser(user)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              แสดง {{ (currentPage - 1) * itemsPerPage + 1 }} ถึง {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} 
              จาก {{ filteredUsers.length }} รายการ
            </div>
            <div class="flex items-center flex-wrap justify-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                    'px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md',
                    page === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ page }}
                </button>
              </div>
              
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">เพิ่มผู้ใช้ใหม่</h3>
          
          <!-- HR Search -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ค้นหาจากระบบ HR</label>
            <div class="relative">
              <input
                v-model="searchHrQuery"
                type="text"
                placeholder="พิมพ์ชื่อ, นามสกุล, หรือ UBU Account..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <!-- HR Results Dropdown -->
              <div v-if="searchHrQuery && filteredHrData.length > 0" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div
                  v-for="person in filteredHrData"
                  :key="person.personcode"
                  @click="selectHrPerson(person)"
                  class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                >
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ person.prefix_name || '' }}{{ person.fname || '' }} {{ person.lname || '' }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ person.ubuaccount || 'ไม่มี UBU Account' }} | {{ person.faculty_name || 'ไม่ระบุคณะ' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="addUser">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อ-นามสกุล</label>
              <input
                v-model="newUser.fullname"
                type="text"
                required
                :disabled="isHrDataSelected"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white',
                  isHrDataSelected 
                    ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                ]"
                placeholder="กรอกชื่อ-นามสกุล"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UBU Account</label>
              <input
                v-model="newUser.ubuaccount"
                type="text"
                required
                :disabled="isHrDataSelected"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white',
                  isHrDataSelected 
                    ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                ]"
                placeholder="กรอก UBU Account"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">อีเมล</label>
              <input
                v-model="newUser.email"
                type="email"
                :disabled="isHrDataSelected"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white',
                  isHrDataSelected 
                    ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                ]"
                placeholder="กรอกอีเมล"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">คณะ</label>
              <input
                v-model="newUser.faculty"
                type="text"
                :disabled="isHrDataSelected"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white',
                  isHrDataSelected 
                    ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                ]"
                placeholder="กรอกคณะ"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <select
                v-model="newUser.role"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                v-model="newUser.status"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showAddModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                เพิ่มผู้ใช้
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">แก้ไขผู้ใช้</h3>
          <form @submit.prevent="saveUser">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อ-นามสกุล</label>
              <input
                v-model="editingUser.fullname"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                readonly
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <select
                v-model="editingUser.role"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                v-model="editingUser.status"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showEditModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useHead, useRuntimeConfig } from 'nuxt/app'

// Apply admin-only middleware
// @ts-ignore - Nuxt macro available at runtime
definePageMeta({
  middleware: 'admin-only'
})

useHead({ title: 'จัดการผู้ใช้ - UBU AI SERVICE' })

// Type definitions
interface User {
  id: number
  ubuaccount: string
  personcode?: string
  fullname: string
  faculty?: string
  department_name?: string
  email?: string
  position?: string
  level_name?: string
  role: 'USER' | 'ADMIN'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

const users = ref<User[]>([])
const loading = ref(false)
const showEditModal = ref(false)
const showAddModal = ref(false)
const editingUser = ref<User>({} as User)
const newUser = ref<Partial<User>>({
	fullname: '',
	ubuaccount: '',
	email: '',
	faculty: '',
	role: 'USER',
	status: 'active'
})

// Filter and search
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(25)

const stats = computed(() => {
  const totalUsers = users.value.length
  const activeUsers = users.value.filter(u => u.status === 'active').length
  const adminUsers = users.value.filter(u => u.role === 'ADMIN').length
  const newUsersToday = users.value.filter(u => {
    const today = new Date().toDateString()
    const userDate = new Date(u.created_at).toDateString()
    return today === userDate
  }).length

  return { totalUsers, activeUsers, adminUsers, newUsersToday }
})

// Filtered users based on search and filters
const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.fullname?.toLowerCase().includes(query) ||
      user.ubuaccount?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value)
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(user => user.status === statusFilter.value)
  }

  return filtered
})

// Pagination computed properties
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  // Show up to 5 pages around current page
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  // Adjust if we're near the beginning or end
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else {
      start = Math.max(1, end - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const response = await $fetch(`${apiBase}/api/admin/users`, {
      credentials: 'include'
    }) as { users: User[] }
    users.value = response.users
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

// HR API data for auto-fill
const hrData = ref<any[]>([])
const searchHrQuery = ref('')
const isHrDataSelected = ref(false) // Track if HR data is selected
const filteredHrData = computed(() => {
  // ชุด UBU accounts ที่มีอยู่ในระบบแล้ว (lowercase)
  const existingAccounts = new Set(
    users.value
      .map(u => (u.ubuaccount || '').toLowerCase())
      .filter(Boolean)
  )

  const dataset = hrData.value.filter(p => {
    const acc = (p.ubuaccount || '').toLowerCase()
    // ตัดผลลัพธ์ที่มีอยู่ในระบบแล้วออก
    return acc && !existingAccounts.has(acc)
  })

  if (!searchHrQuery.value) return dataset.slice(0, 10) // Show first 10 if no search
  
  const query = searchHrQuery.value.toLowerCase()
  return dataset.filter(person => 
    person.fname?.toLowerCase().includes(query) ||
    person.lname?.toLowerCase().includes(query) ||
    person.ubuaccount?.toLowerCase().includes(query) ||
    person.personcode?.includes(query)
  ).slice(0, 10)
})

const fetchHrData = async () => {
  try {
    const response = await $fetch<any[]>('https://dev.ubu.ac.th/api_hr/get_person_name')
    hrData.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error fetching HR data:', error)
  }
}

const selectHrPerson = (person: any) => {
  newUser.value = {
    fullname: `${person.prefix_name || ''}${person.fname || ''} ${person.lname || ''}`.trim(),
    ubuaccount: person.ubuaccount || '',
    email: person.email || '',
    faculty: person.faculty_name || '',
    department_name: person.department_name || '',
    position: person.positiontype_name || '',
    level_name: person.level_name || '',
    personcode: person.personcode || '',
    role: 'USER',
    status: 'active'
  }
  searchHrQuery.value = ''
  isHrDataSelected.value = true // Mark that HR data is selected
}

const addUser = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
		const response = await $fetch(`${apiBase}/api/admin/users`, {
			method: 'POST',
			body: newUser.value,
			credentials: 'include'
		}) as { user: User }
		
		// Add to local data
		users.value.push(response.user)
		
		// Reset form
		newUser.value = {
			fullname: '',
			ubuaccount: '',
			email: '',
			faculty: '',
			role: 'USER',
			status: 'active'
		}
		
		showAddModal.value = false
		isHrDataSelected.value = false // Reset HR selection flag
	} catch (error) {
		console.error('Error adding user:', error)
	}
}

const editUser = (user: User) => {
  editingUser.value = { ...user }
  showEditModal.value = true
}

const saveUser = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    await $fetch(`${apiBase}/api/admin/users/${editingUser.value.id}`, {
      method: 'PATCH',
      body: {
        role: editingUser.value.role,
        status: editingUser.value.status
      },
      credentials: 'include'
    })
    
    // Update local data
    const index = users.value.findIndex(u => u.id === editingUser.value.id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...editingUser.value }
    }
    
    showEditModal.value = false
  } catch (error) {
    console.error('Error updating user:', error)
  }
}

const deleteUser = async (user: User) => {
  try {
    const Swal = (await import('sweetalert2')).default
    const res = await Swal.fire({
      icon: 'warning',
      title: `ลบผู้ใช้ ${user.fullname}?`,
      text: 'การลบไม่สามารถย้อนกลับได้',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })
    if (!res.isConfirmed) return
  } catch {}

  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    await $fetch(`${apiBase}/api/admin/users/${user.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    users.value = users.value.filter(u => u.id !== user.id)
  } catch (error) {
    console.error('Error deleting user:', error)
    try { const Swal = (await import('sweetalert2')).default; await Swal.fire({ icon: 'error', title: 'ลบผู้ใช้ไม่สำเร็จ' }) } catch {}
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active'
    case 'inactive': return 'Inactive'
    case 'suspended': return 'Suspended'
    default: return 'Unknown'
  }
}

const getRoleClass = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'USER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getRoleText = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'Admin'
    case 'USER': return 'User'
    default: return 'Unknown'
  }
}

const isMale = (fullname: string | undefined) => {
  if (!fullname) return false
  return fullname.trim().startsWith('นาย')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchUsers()
  fetchHrData()
})
</script>
