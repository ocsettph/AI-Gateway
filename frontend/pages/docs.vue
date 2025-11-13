<template>
	<div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="mb-12">
				<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Documentation</h1>
				<p class="text-xl text-gray-600 dark:text-gray-300">คู่มือการใช้งาน UBU AI SERVICE</p>
			</div>

			<div class="grid lg:grid-cols-4 gap-8">
				<!-- Sidebar -->
				<div class="lg:col-span-1">
					<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contents</h2>
                        <nav class="space-y-2">
                            <a :href="'#getting-started'" :class="linkClass('getting-started')">Getting Started</a>
                            <a :href="'#api-keys'" :class="linkClass('api-keys')">API Keys</a>
                            <a :href="'#authentication'" :class="linkClass('authentication')">Authentication</a>
                            <a :href="'#endpoints'" :class="linkClass('endpoints')">API Endpoints</a>
                            <a :href="'#examples'" :class="linkClass('examples')">Examples</a>
                            <a :href="'#troubleshooting'" :class="linkClass('troubleshooting')">Troubleshooting</a>
                        </nav>
					</div>
				</div>

				<!-- Main Content -->
				<div class="lg:col-span-3">
					<div class="space-y-8">
						<!-- Getting Started -->
						<section id="getting-started" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h2>
							<p class="text-gray-600 dark:text-gray-300 mb-6">UBU AI SERVICE เป็นศูนย์กลาง AI platform สำหรับชุมชน UBU ที่ช่วยให้นักศึกษา คณาจารย์ และนักวิจัยสามารถเข้าถึงเครื่องมือ AI ชั้นนำได้อย่างง่ายดาย</p>
							
							<div class="space-y-4">
								<div class="flex items-start space-x-3">
									<div class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
										<span class="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
									</div>
									<div>
										<h3 class="font-medium text-gray-900 dark:text-white">Request Access</h3>
										<p class="text-gray-600 dark:text-gray-300 text-sm">ส่งคำขอการใช้งานผ่านหน้า Request Access</p>
									</div>
								</div>
								
								<div class="flex items-start space-x-3">
									<div class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
										<span class="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
									</div>
									<div>
										<h3 class="font-medium text-gray-900 dark:text-white">Get API Key</h3>
										<p class="text-gray-600 dark:text-gray-300 text-sm">รับ API Key หลังจากได้รับการอนุมัติ</p>
									</div>
								</div>
								
								<div class="flex items-start space-x-3">
									<div class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
										<span class="text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
									</div>
									<div>
										<h3 class="font-medium text-gray-900 dark:text-white">Start Using</h3>
										<p class="text-gray-600 dark:text-gray-300 text-sm">เริ่มใช้งาน AI services ผ่าน API</p>
									</div>
								</div>
							</div>
						</section>

						<!-- API Keys -->
						<section id="api-keys" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">API Keys</h2>
							<p class="text-gray-600 dark:text-gray-300 mb-6">API Key เป็นกุญแจสำคัญในการเข้าถึง UBU AI SERVICE services</p>
							
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                <h3 class="font-medium text-gray-900 dark:text-white mb-2">Base URL</h3>
                                <code class="text-blue-600 dark:text-blue-400">{{ docsBase }}</code>
                            </div>
							
							<div class="space-y-4">
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">Creating API Key</h3>
									<p class="text-gray-600 dark:text-gray-300 text-sm">หลังจากได้รับการอนุมัติ คุณสามารถสร้าง API Key ได้ในหน้า API Keys</p>
								</div>
								
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">Usage Limits</h3>
									<p class="text-gray-600 dark:text-gray-300 text-sm">แต่ละ API Key มีลิมิตการใช้งานตามที่กำหนดไว้</p>
								</div>
								
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">Security</h3>
									<p class="text-gray-600 dark:text-gray-300 text-sm">เก็บ API Key ของคุณไว้อย่างปลอดภัย และไม่แชร์ให้ผู้อื่น</p>
								</div>
							</div>
						</section>

						<!-- Authentication -->
						<section id="authentication" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Authentication</h2>
							<p class="text-gray-600 dark:text-gray-300 mb-6">ใช้ API Key ในการยืนยันตัวตน</p>
							
							<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
								<h3 class="font-medium text-gray-900 dark:text-white mb-2">Header</h3>
								<code class="text-blue-600 dark:text-blue-400">Authorization: Bearer YOUR_API_KEY</code>
							</div>
						</section>

						<!-- API Endpoints -->
						<section id="endpoints" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">API Endpoints</h2>
							
            <div class="space-y-6">
                <!-- Models picker -->
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div class="mb-2 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-semibold">MODELS</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">เลือกโมเดลที่ต้องการใช้</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <NuxtLink to="/models" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">เปิดหน้า Models</NuxtLink>
                          <button @click="loadModels" class="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">รีเฟรช</button>
                        </div>
                    </div>
                    <div class="grid md:grid-cols-2 gap-3">
                        <select v-model="selectedModel" class="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white">
                            <option v-for="m in models" :key="m.id" :value="m.id">{{ m.id }}</option>
                        </select>
                        <div class="text-xs text-gray-600 dark:text-gray-300">
                            ตัวอย่างจะใช้โมเดล: <code class="text-blue-600 dark:text-blue-400">{{ selectedModel || 'gpt-4' }}</code>
                        </div>
                    </div>
                </div>
								<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
									<div class="flex items-center space-x-3 mb-2">
										<span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm font-medium">POST</span>
										<code class="text-blue-600 dark:text-blue-400">/chat/completions</code>
									</div>
									<p class="text-gray-600 dark:text-gray-300 text-sm">Chat completion endpoint for GPT models</p>
								</div>
								
								<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
									<div class="flex items-center space-x-3 mb-2">
										<span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm font-medium">POST</span>
										<code class="text-blue-600 dark:text-blue-400">/images/generations</code>
									</div>
									<p class="text-gray-600 dark:text-gray-300 text-sm">Image generation endpoint for DALL-E</p>
								</div>
								
								<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
									<div class="flex items-center space-x-3 mb-2">
										<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm font-medium">GET</span>
										<code class="text-blue-600 dark:text-blue-400">/usage</code>
									</div>
									<p class="text-gray-600 dark:text-gray-300 text-sm">Get your API usage statistics</p>
								</div>
							</div>
						</section>

						<!-- Examples -->
						<section id="examples" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Examples</h2>
							
							<div class="space-y-6">
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">Python Example</h3>
									<div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                    <pre class="text-green-400 text-sm"><code>{{ pythonExample }}</code></pre>
									</div>
								</div>
								
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">JavaScript Example</h3>
									<div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                        <pre class="text-green-400 text-sm"><code>{{ jsExample }}</code></pre>
									</div>
								</div>
							</div>
						</section>

						<!-- Troubleshooting -->
						<section id="troubleshooting" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Troubleshooting</h2>
							
							<div class="space-y-4">
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">401 Unauthorized</h3>
									<p class="text-gray-600 dark:text-gray-300 text-sm">ตรวจสอบ API Key ของคุณและให้แน่ใจว่าได้ใส่ใน header ถูกต้อง</p>
								</div>
								
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">429 Too Many Requests</h3>
									<p class="text-gray-600 dark:text-gray-300 text-sm">คุณได้ใช้ลิมิตการใช้งานแล้ว กรุณารอให้ลิมิตรีเซ็ต</p>
								</div>
								
								<div>
									<h3 class="font-medium text-gray-900 dark:text-white mb-2">500 Internal Server Error</h3>
									<p class="text-gray-600 dark:text-gray-300 text-sm">เกิดข้อผิดพลาดในระบบ กรุณาติดต่อทีมสนับสนุน</p>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useHead, useRuntimeConfig } from 'nuxt/app';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
// @ts-ignore make route explicitly public
definePageMeta({ middleware: [] })

useHead({ 
	title: 'Documentation - UBU AI SERVICE',
	meta: [
		{ name: 'description', content: 'คู่มือการใช้งาน UBU AI SERVICE' }
	]
});

const models = ref<any[]>([])
const selectedModel = ref<string>('gpt-4')

// Build absolute Base URL to backend for docs (works in dev and prod)
const docsBase = computed(() => {
  const apiBase = useRuntimeConfig().public.apiBase as string
  // absolute base if already starts with http
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = /^https?:/i.test(apiBase) ? apiBase : `${origin}${apiBase}`
  return `${base}/api/v1`
})

const loadModels = async () => {
  try {
    const apiBase = useRuntimeConfig().public.apiBase as string
    const res = await $fetch(`${apiBase}/api/models`, { credentials: 'include' }) as { models: any[] }
    models.value = res.models || []
    if (models.value.length && !selectedModel.value) selectedModel.value = models.value[0].id
  } catch {}
}

onMounted(loadModels)

const pythonExample = computed(() => `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'model': '${selectedModel.value || 'gpt-4'}',
    'messages': [
        {'role': 'user', 'content': 'Hello, world!'}
    ]
}

response = requests.post(
    '${docsBase.value}/chat/completions',
    headers=headers,
    json=data
)

print(response.json())`)

const jsExample = computed(() => `const response = await fetch('${docsBase.value}/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: '${selectedModel.value || 'gpt-4'}',
    messages: [
      { role: 'user', content: 'Hello, world!' }
    ]
  })
});

const data = await response.json();
console.log(data);`)

// Sidebar active link handling
const currentSection = ref<string>('getting-started')
const ids = ['getting-started','api-keys','authentication','endpoints','examples','troubleshooting']

const linkClass = (id: string) => {
  return [
    'block',
    currentSection.value === id
      ? 'text-blue-600 dark:text-blue-400 font-semibold'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
  ]
}

const updateFromHash = () => {
  const h = (location.hash || '').replace('#','')
  if (ids.includes(h)) currentSection.value = h
}

let observer: IntersectionObserver | null = null
onMounted(() => {
  updateFromHash()
  window.addEventListener('hashchange', updateFromHash)
  const sections = ids
    .map(id => document.getElementById(id))
    .filter(Boolean) as HTMLElement[]
  observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0]
    if (visible?.target?.id && ids.includes(visible.target.id)) {
      currentSection.value = visible.target.id
    }
  }, { rootMargin: '0px 0px -60% 0px', threshold: [0.25, 0.5, 0.75] })
  sections.forEach(sec => observer?.observe(sec))
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', updateFromHash)
  observer?.disconnect()
})
</script>