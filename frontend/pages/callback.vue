<template>
	<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-md w-full space-y-8">
			<div class="text-center">
				<div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<img src="/assets/UBU_AI_FLOW_icon.png" alt="UBU AI SERVICE" class="h-10 w-10 object-contain">
				</div>
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white">กำลังเข้าสู่ระบบ</h2>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
					กรุณารอสักครู่ กำลังตรวจสอบข้อมูลจาก UBU Portal
				</p>
			</div>
			
			<div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
				<div class="text-center">
					<!-- Loading Spinner -->
					<div class="flex justify-center mb-6">
						<svg class="w-12 h-12 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
					</div>
					
					<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">กำลังประมวลผล</h3>
					<p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
						ระบบกำลังตรวจสอบข้อมูลการเข้าสู่ระบบจาก UBU Portal
					</p>
					
					<!-- Progress Steps -->
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
								<svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<span class="text-sm text-gray-600 dark:text-gray-300">รับข้อมูลจาก UBU Portal</span>
						</div>
						
						<div class="flex items-center space-x-3">
							<div class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
								<div class="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
							</div>
							<span class="text-sm text-gray-600 dark:text-gray-300">ตรวจสอบข้อมูลผู้ใช้</span>
						</div>
						
						<div class="flex items-center space-x-3">
							<div class="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
								<div class="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
							</div>
							<span class="text-sm text-gray-400 dark:text-gray-500">สร้างเซสชัน</span>
						</div>
					</div>
					
					<!-- Status Message -->
					<div v-if="status" class="mt-6 p-4 rounded-lg" :class="statusClass">
						<p class="text-sm font-medium">{{ statusMessage }}</p>
					</div>
					
					<!-- Error Message -->
					<div v-if="error" class="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<div class="flex">
							<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
							</svg>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-red-800 dark:text-red-200">เกิดข้อผิดพลาด</h3>
								<p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
							</div>
						</div>
						<div class="mt-4">
							<button 
								@click="retry"
								class="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
							>
								ลองใหม่
							</button>
						</div>
					</div>
				</div>
			</div>
			
			<div class="text-center">
				<p class="text-sm text-gray-600 dark:text-gray-300">
					หากมีปัญหาในการเข้าสู่ระบบ 
					<NuxtLink to="/login" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">
						ลองเข้าสู่ระบบใหม่
					</NuxtLink>
				</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHead, navigateTo, useRuntimeConfig } from 'nuxt/app';

useHead({ 
	title: 'กำลังเข้าสู่ระบบ - UBU AI SERVICE',
	meta: [
		{ name: 'description', content: 'กำลังประมวลผลการเข้าสู่ระบบจาก UBU Portal' }
	]
});

const status = ref('');
const statusMessage = ref('');
const statusClass = ref('');
const error = ref('');

onMounted(async () => {
    try {
        status.value = 'processing';
        statusMessage.value = 'กำลังตรวจสอบข้อมูล...';
        statusClass.value = 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';

        const url = new URL(window.location.href)
        const username = url.searchParams.get('username')
        const code = url.searchParams.get('code')
        // Support multiple parameter names from portal
        const accessToken =
          url.searchParams.get('accessToken') ||
          url.searchParams.get('access_token') ||
          url.searchParams.get('token') ||
          null

        const apiBase = (useRuntimeConfig().public.apiBase as string)
        
        if (username) {
            // บางระบบจะส่ง username กลับมาที่ callback ได้เลย
            await $fetch(`${apiBase}/api/oauth-login`, { method: 'POST', body: { username }, credentials: 'include' })
        } else if (code || accessToken) {
            // บางระบบส่ง code มา ต้องให้ backend แลกเป็น session
            await $fetch(`${apiBase}/api/oauth/callback`, { method: 'POST', body: { code, accessToken }, credentials: 'include' })
        } else {
            throw new Error('ไม่พบข้อมูลจาก UBU Portal (username/code)')
        }

        status.value = 'success';
        statusMessage.value = 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนเส้นทาง...';
        statusClass.value = 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
        
        // Force refresh user data in app.vue by triggering a custom event
        window.dispatchEvent(new CustomEvent('user-login-success'));
        
        await navigateTo('/')
    } catch (err: any) {
        error.value = err?.data?.message || err?.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง';
        status.value = 'error';
    }
});

const retry = () => {
	error.value = '';
	status.value = '';
	window.location.reload();
};
</script>
