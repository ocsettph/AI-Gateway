<template>
	<div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
            <div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">จัดการ API Keys</h1>
				<p class="text-gray-600 dark:text-gray-300">ดูและจัดการ API Key ที่ได้รับการอนุมัติแล้ว</p>
            </div>

			<!-- API Keys List -->
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-8">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">API Keys ของคุณ</h2>
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button @click="refreshUsage" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap">รีเฟรช usage</button>
                <NuxtLink 
                  to="/request" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap text-center"
                >
                  + ขอ API Key ใหม่
                </NuxtLink>
              </div>
				</div>
				
				<div v-if="loading" class="text-center py-8">
					<div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p class="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
				</div>
				
				<div v-else-if="keys.length === 0" class="text-center py-12">
					<div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"></path>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">ยังไม่มี API Key</h3>
					<p class="text-gray-500 dark:text-gray-400 mb-6">คุณยังไม่มี API Key ที่ได้รับการอนุมัติ</p>
					<NuxtLink 
						to="/request" 
						class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						ขอ API Key ใหม่
					</NuxtLink>
				</div>
				
				<div v-else class="space-y-4">
					<div 
						v-for="key in keys" 
						:key="key.id" 
						class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
					>
						<div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2">
									<h3 
										v-if="!editingNames[key.id]"
										class="font-semibold text-gray-900 dark:text-white break-words"
									>
										{{ key.name }}
									</h3>
									<div v-else class="flex items-center gap-2 flex-1">
										<input
											v-model="editingNames[key.id]"
											@keyup.enter="saveKeyName(key)"
											@keyup.esc="cancelEditName(key.id)"
											:data-key-id="key.id"
											class="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											autofocus
										/>
										<button
											@click="saveKeyName(key)"
											class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
										>
											บันทึก
										</button>
										<button
											@click="cancelEditName(key.id)"
											class="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
										>
											ยกเลิก
										</button>
									</div>
									<button
										v-if="!editingNames[key.id]"
										@click="startEditName(key)"
										class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
										title="แก้ไขชื่อ"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
										</svg>
									</button>
								</div>
								<p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
									<span class="font-medium">Key:</span> 
									<input 
										:value="key.key_value" 
										readonly 
										class="mt-1 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
									/>
								</p>
								<div class="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500 dark:text-gray-400">
									<span class="whitespace-nowrap">เครดิต: ${{ Number(key.credit_limit || 0).toFixed(2) }}</span>
									<span class="whitespace-nowrap">ใช้งานแล้ว: ${{ money((key._used ?? key.current_spend) || 0) }}</span>
									<span class="whitespace-nowrap">คงเหลือ: ${{ money(Number(key.credit_limit || 0) - Number((key._used ?? key.current_spend) || 0)) }}</span>
									<span 
										class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
										:class="key.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
									>
										{{ key.is_active ? 'ใช้งานได้' : 'ปิดใช้งาน' }}
									</span>
								</div>
								<div class="mt-2 text-xs text-gray-400 dark:text-gray-500">
									สร้างเมื่อ: {{ formatDate(key.created_at) }}
								</div>
							</div>
                            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
							<button 
								@click="toggleKey(key)"
								:class="key.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'"
								class="px-3 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap"
							>
								{{ key.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}
							</button>
                              <button
                                @click="confirmDeleteKey(key)"
                                class="px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                ลบ
                              </button>
							<button 
								@click="copyKey(key.key_value)"
								class="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded text-sm font-medium transition-colors whitespace-nowrap"
							>
								คัดลอก Key
							</button>
						</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Pending Requests -->
			<div v-if="requests.length > 0" class="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-8">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">คำขอที่รอการอนุมัติ</h2>
				
				<div class="space-y-4">
					<div 
						v-for="request in requests" 
						:key="request.id" 
						class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 md:p-6 border border-yellow-200 dark:border-yellow-800"
					>
						<div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-gray-900 dark:text-white mb-2 break-words">{{ request.api_key_name }}</h3>
								<div class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
									<p><span class="font-medium">ชื่อ:</span> {{ request.first_name }} {{ request.last_name }}</p>
									<p><span class="font-medium">อีเมล:</span> {{ request.email }}</p>
									<p><span class="font-medium">คณะ:</span> {{ request.department || 'ไม่ระบุ' }}</p>
									<p><span class="font-medium">เครดิต:</span> ${{ request.credit_limit }}</p>
								</div>
								<div class="mt-2 text-xs text-gray-400 dark:text-gray-500">
									ส่งคำขอเมื่อ: {{ formatDate(request.created_at) }}
								</div>
							</div>
                            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
							<span 
								class="px-3 py-1 rounded-full text-sm font-medium text-center whitespace-nowrap"
								:class="getStatusClass(request.status)"
							>
								{{ getStatusText(request.status) }}
							</span>
                                <button
                                    v-if="request.status === 'pending'"
                                    @click="confirmDeleteRequest(request)"
                                    class="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    ลบคำขอ
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
import { ref, onMounted } from 'vue';
import { useHead, useRuntimeConfig } from 'nuxt/app';

useHead({ 
	title: 'จัดการ API Keys - UBU AI FLOW',
	meta: [
		{ name: 'description', content: 'ดูและจัดการ API Key ที่ได้รับการอนุมัติแล้ว' }
	]
});

const keys = ref<any[]>([]);
const requests = ref<any[]>([]);
const loading = ref(true);
const editingNames = ref<Record<number, string>>({});

const fetchData = async () => {
	try {
    const apiBase = useRuntimeConfig().public.apiBase as string
		
		// Fetch approved API keys
		const keysResponse = await $fetch(`${apiBase}/api/keys`, {
			credentials: 'include'
		}) as { keys: any[] }
		keys.value = keysResponse.keys
		// Load precise usage per key
		await Promise.all(keys.value.map(async (k: any) => {
			try {
				const u: any = await $fetch(`${apiBase}/api/keys/usage`, { params: { value: k.key_value }, credentials: 'include' })
				k._used = Number(u?.total?.cost_usd || 0)
			} catch { k._used = Number(k.current_spend || 0) }
		}))
		
		// Fetch pending requests
		const requestsResponse = await $fetch(`${apiBase}/api/requests`, {
			credentials: 'include'
		}) as { requests: any[] }
		requests.value = requestsResponse.requests.filter(r => r.status === 'pending')
		
	} catch (error) {
		console.error('Error fetching data:', error)
	} finally {
		loading.value = false
	}
}

const toggleKey = async (key: any) => {
	try {
    const apiBase = useRuntimeConfig().public.apiBase as string
		await $fetch(`${apiBase}/api/keys/${key.id}/toggle`, {
			method: 'PATCH',
			credentials: 'include'
		})
		
		// Update local state
		key.is_active = !key.is_active
	} catch (error) {
		console.error('Error toggling key:', error)
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเปลี่ยนสถานะ API Key ได้' })
		} catch {}
	}
}

const copyKey = async (keyValue: string) => {
	try {
		await navigator.clipboard.writeText(keyValue)
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({ icon: 'success', title: 'คัดลอกแล้ว', text: 'คัดลอก API Key เรียบร้อยแล้ว' })
		} catch {}
	} catch (error) {
		console.error('Error copying key:', error)
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({ icon: 'error', title: 'คัดลอกไม่สำเร็จ', text: 'ไม่สามารถคัดลอก API Key ได้' })
		} catch {}
	}
}

const refreshUsage = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    await $fetch(`${apiBase}/api/keys/refresh`, { method: 'POST', credentials: 'include' })
    await fetchData()
  } catch (e) {
    // ignore
  }
}

const confirmDeleteKey = async (key: any) => {
  try {
    const Swal = (await import('sweetalert2')).default
    const res = await Swal.fire({
      icon: 'warning',
      title: 'ลบ API Key นี้?',
      text: 'การลบไม่สามารถย้อนกลับได้',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })
    if (!res.isConfirmed) return
  } catch {}

  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    await $fetch(`${apiBase}/api/keys/${key.id}`, { method: 'DELETE', credentials: 'include' })
    await fetchData()
  } catch (e) {
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: 'เกิดข้อผิดพลาดในการลบ API Key' })
		} catch {}
  }
}

const startEditName = (key: any) => {
	editingNames.value[key.id] = key.name;
	// Focus input after Vue updates DOM
	setTimeout(() => {
		const input = document.querySelector(`input[data-key-id="${key.id}"]`) as HTMLInputElement;
		if (input) input.focus();
	}, 0);
};

const saveKeyName = async (key: any) => {
	const newName = editingNames.value[key.id]?.trim();
	if (!newName || newName === key.name) {
		cancelEditName(key.id);
		return;
	}
	
	try {
		const apiBase = useRuntimeConfig().public.apiBase as string;
		const response = await $fetch(`${apiBase}/api/keys/${key.id}`, {
			method: 'PATCH',
			body: { name: newName },
			credentials: 'include'
		}) as { key: any };
		
		// Update local state
		key.name = newName;
		delete editingNames.value[key.id];
		
		try {
			const Swal = (await import('sweetalert2')).default;
			await Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'แก้ไขชื่อ API Key เรียบร้อยแล้ว' });
		} catch {}
	} catch (error) {
		console.error('Error updating key name:', error);
		try {
			const Swal = (await import('sweetalert2')).default;
			await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถแก้ไขชื่อ API Key ได้' });
		} catch {}
	}
};

const cancelEditName = (keyId: number) => {
	delete editingNames.value[keyId];
};

const confirmDeleteRequest = async (reqItem: any) => {
    try {
        const Swal = (await import('sweetalert2')).default
        const res = await Swal.fire({
            icon: 'warning',
            title: 'ลบคำขอใช่หรือไม่?',
            text: 'การลบนี้ไม่สามารถย้อนกลับได้',
            showCancelButton: true,
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        })
        if (!res.isConfirmed) return
    } catch {
        // no-op
    }

    try {
    const apiBase = useRuntimeConfig().public.apiBase as string
        await $fetch(`${apiBase}/api/requests/${reqItem.id}`, { method: 'DELETE', credentials: 'include' })
        // remove locally
        requests.value = requests.value.filter(r => r.id !== reqItem.id)
    } catch (e) {
        console.error('Error deleting request:', e)
    }
}

const getStatusClass = (status: string) => {
	switch (status) {
		case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
		case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
		case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
		default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
	}
}

const getStatusText = (status: string) => {
	switch (status) {
		case 'pending': return 'รอการอนุมัติ'
		case 'approved': return 'อนุมัติแล้ว'
		case 'rejected': return 'ปฏิเสธ'
		default: return 'ไม่ทราบ'
	}
}

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
	})
}

function money(v: any) {
  const n = Number(v || 0)
  if (!isFinite(n) || n === 0) return '0.00'
  if (n > 0 && n < 0.01) return n.toFixed(4)
  return n.toFixed(2)
}

onMounted(() => {
	fetchData()
  // Fetch and display notifications (e.g., rejected requests)
  ;(async () => {
    try {
    const apiBase = useRuntimeConfig().public.apiBase as string
      const res = await $fetch(`${apiBase}/api/notifications`, { credentials: 'include' }) as { notifications: any[] }
      const list = res.notifications || []
      if (list.length > 0) {
        try {
          const Swal = (await import('sweetalert2')).default
          for (const n of list) {
            await Swal.fire({ icon: 'info', title: n.title, text: n.message, confirmButtonText: 'รับทราบ' })
          }
        } catch {
          // ignore if SweetAlert not available
        }
        await $fetch(`${apiBase}/api/notifications/read`, { method: 'PATCH', credentials: 'include' })
      }
    } catch (e) {
      // ignore
    }
  })()
})
</script>