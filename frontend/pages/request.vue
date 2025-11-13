<template>
	<div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="mb-12 text-center">
				<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Request Access</h1>
				<p class="text-xl text-gray-600 dark:text-gray-300">ขอสิทธิ์การใช้งาน UBU AI SERVICE</p>
			</div>

			<!-- Request Form -->
			<div class="bg-white dark:!bg-[#1B1B1B] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/60 p-8">
				<form @submit.prevent="submitRequest" class="space-y-6">
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อ</label>
							<input 
								v-model="form.firstName"
								type="text" 
								id="firstName" 
								required
								readonly
								class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
								placeholder="ชื่อจริง"
							>
						</div>
						
						<div>
							<label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">นามสกุล</label>
							<input 
								v-model="form.lastName"
								type="text" 
								id="lastName" 
								required
								readonly
								class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
								placeholder="นามสกุล"
							>
						</div>
					</div>
					
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">อีเมล UBU</label>
						<input 
							v-model="form.email"
							type="email" 
							id="email" 
							required
							readonly
							class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
							placeholder="your.email@ubu.ac.th"
						>
					</div>
					
					<div>
						<label for="studentId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">รหัสนักศึกษา/บุคลากร</label>
						<input 
							v-model="form.studentId"
							type="text" 
							id="studentId" 
							required
							readonly
							class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
							placeholder="รหัสนักศึกษา หรือ รหัสบุคลากร"
						>
					</div>
					
					<div>
						<label for="department" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">คณะ/หน่วยงาน</label>
						<input 
							v-model="form.department"
							type="text" 
							id="department" 
							required
							readonly
							class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
							placeholder="คณะ/หน่วยงาน"
						>
					</div>

					<!-- API Key Name Field -->
					<div>
						<label for="apiKeyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อ API Key</label>
						<input 
							v-model="form.apiKeyName"
							type="text" 
							id="apiKeyName" 
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
							placeholder="เช่น My Project API Key"
						>
					</div>
					
					<div>
						<label for="purpose" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">วัตถุประสงค์การใช้งาน</label>
						<textarea 
							v-model="form.purpose"
							id="purpose" 
							rows="4"
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
							placeholder="อธิบายวัตถุประสงค์การใช้งาน AI services..."
						></textarea>
					</div>
					
					<div>
						<label for="expectedUsage" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">การใช้งานที่คาดหวัง</label>
						<select 
							v-model="form.expectedUsage"
							id="expectedUsage" 
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						>
							<option value="">เลือกการใช้งานที่คาดหวัง</option>
							<option value="research">งานวิจัย</option>
							<option value="education">การเรียนการสอน</option>
							<option value="project">โปรเจค/วิทยานิพนธ์</option>
							<option value="personal">การใช้งานส่วนตัว</option>
							<option value="other">อื่นๆ</option>
						</select>
					</div>

					<!-- Course Name Field (shown when "education" is selected) -->
					<div v-if="form.expectedUsage === 'education'">
						<label for="courseName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ขอใช้ในรายวิชา</label>
						<input 
							v-model="form.courseName"
							type="text" 
							id="courseName" 
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
							placeholder="เช่น CS101, วิชาโปรแกรมมิ่ง"
						>
					</div>

					<!-- Other Details Field (shown when "other" is selected) -->
					<div v-if="form.expectedUsage === 'other'">
						<label for="otherDetails" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">รายละเอียด</label>
						<textarea 
							v-model="form.otherDetails"
							id="otherDetails" 
							rows="3"
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
							placeholder="กรุณาระบุรายละเอียดการใช้งาน..."
						></textarea>
					</div>

					<!-- Credit Limit Info -->
					<div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
						<div class="flex items-center">
							<svg class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
							</svg>
							<span class="text-sm font-medium text-green-800 dark:text-green-200">
								ระบบจะกำหนดค่าเริ่มต้นเครดิตที่ 10 USD สำหรับ API Key นี้
							</span>
						</div>
					</div>
					
					<div class="flex items-start space-x-3">
						<input 
							v-model="form.agreeTerms"
							type="checkbox" 
							id="agreeTerms" 
							required
							class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
						>
						<label for="agreeTerms" class="text-sm text-gray-600 dark:text-gray-300">
							ฉันยอมรับ 
							<a href="/terms" class="text-blue-600 dark:text-blue-400 hover:underline">ข้อกำหนดการใช้งาน</a> 
							และ 
							<a href="/privacy" class="text-blue-600 dark:text-blue-400 hover:underline">นโยบายความเป็นส่วนตัว</a>
						</label>
					</div>
					
					<button 
						type="submit"
						:disabled="submitting"
						class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
					>
						{{ submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอการใช้งาน' }}
					</button>
				</form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHead, useRuntimeConfig } from 'nuxt/app';
import { useRouter } from 'vue-router';

useHead({ 
	title: 'Request Access - UBU AI SERVICE',
	meta: [
		{ name: 'description', content: 'ขอสิทธิ์การใช้งาน UBU AI SERVICE' }
	]
});

const form = ref({
	firstName: '',
	lastName: '',
	email: '',
	studentId: '',
	department: '',
	apiKeyName: '',
	purpose: '',
	expectedUsage: '',
	courseName: '',
	otherDetails: '',
	agreeTerms: false
});

const submitting = ref(false);
const router = useRouter();

const fetchCurrentUser = async () => {
	try {
    const apiBase = useRuntimeConfig().public.apiBase as string
		const me = await $fetch(`${apiBase}/api/me`, { credentials: 'include' }) as any
		
		if (me?.user) {
			// Auto-fill form with current user data
			form.value.firstName = me.user.fullname?.split(' ')[0] || ''
			form.value.lastName = me.user.fullname?.split(' ').slice(1).join(' ') || ''
			form.value.email = me.user.email || ''
			form.value.studentId = me.user.personcode || ''
			// Use department_name if available, otherwise use faculty
			form.value.department = me.user.department_name || me.user.faculty || ''
		}
	} catch (error) {
		console.error('Error fetching user data:', error)
	}
}

const submitRequest = async () => {
	// Validate conditional fields
	if (form.value.expectedUsage === 'education' && !form.value.courseName?.trim()) {
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({
				icon: 'warning',
				title: 'กรุณากรอกข้อมูล',
				text: 'กรุณาระบุรายวิชาที่จะใช้',
				confirmButtonText: 'ตกลง'
			})
		} catch {
			showToast('error', 'กรุณาระบุรายวิชาที่จะใช้')
		}
		return
	}
	
	if (form.value.expectedUsage === 'other' && !form.value.otherDetails?.trim()) {
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({
				icon: 'warning',
				title: 'กรุณากรอกข้อมูล',
				text: 'กรุณาระบุรายละเอียดการใช้งาน',
				confirmButtonText: 'ตกลง'
			})
		} catch {
			showToast('error', 'กรุณาระบุรายละเอียดการใช้งาน')
		}
		return
	}
	
	submitting.value = true;
	
	try {
    const apiBase = useRuntimeConfig().public.apiBase as string
		const response = await $fetch(`${apiBase}/api/requests`, {
			method: 'POST',
			body: {
				...form.value,
				creditLimit: 10 // Default 10 USD
			},
			credentials: 'include'
		})
		
		// Reset form
		form.value = {
			firstName: '',
			lastName: '',
			email: '',
			studentId: '',
			department: '',
			apiKeyName: '',
			purpose: '',
			expectedUsage: '',
			courseName: '',
			otherDetails: '',
			agreeTerms: false
		};
		
		// Re-fetch user data to reset form
		await fetchCurrentUser()
		
		// Show success message (SweetAlert2 if available, else toast fallback)
    try {
        const Swal = (await import('sweetalert2')).default
        await Swal.fire({
            icon: 'success',
            title: 'คำขอถูกส่งแล้ว',
            text: 'รอการอนุมัติจากทีมงาน',
            confirmButtonText: 'ดูสถานะคำขอ'
        })
    } catch {
        showToast('success', 'ส่งคำขอเรียบร้อยแล้ว! รอการอนุมัติจากทีมงาน')
    }
    // Redirect to keys page to view pending request
    router.push('/keys')
	} catch (error) {
		console.error('Error submitting request:', error)
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({
				icon: 'error',
				title: 'ส่งคำขอล้มเหลว',
				text: 'กรุณาลองใหม่อีกครั้ง',
				confirmButtonText: 'ปิด'
			})
		} catch {
			showToast('error', 'เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง')
		}
	} finally {
		submitting.value = false;
	}
};

onMounted(() => {
	fetchCurrentUser()
})

// Lightweight toast fallback (Tailwind-based)
function showToast(type: 'success' | 'error', message: string) {
  const wrap = document.createElement('div')
  wrap.className = 'fixed inset-0 flex items-start justify-center pointer-events-none'
  wrap.style.zIndex = '9999'

  const toast = document.createElement('div')
  toast.className = `mt-6 px-4 py-3 rounded-lg shadow-lg text-white pointer-events-auto ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`
  toast.textContent = message

  wrap.appendChild(toast)
  document.body.appendChild(wrap)
  setTimeout(() => {
    wrap.remove()
  }, 3000)
}
</script>