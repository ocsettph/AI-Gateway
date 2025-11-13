<template>
	<div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="mb-8 flex items-center justify-between">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Models</h1>
				<NuxtLink to="/docs#endpoints" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">กลับสู่ Docs</NuxtLink>
			</div>

			<!-- Controls -->
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
				<div class="grid md:grid-cols-3 gap-3">
					<div class="md:col-span-2">
						<input v-model="q" type="text" placeholder="ค้นหาโมเดล..." class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
					</div>
					<div class="flex items-center gap-2">
						<label class="inline-flex items-center text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="onlyFree" class="mr-2"/>เฉพาะโมเดลฟรี</label>
						<button @click="load" class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">รีเฟรช</button>
					</div>
				</div>
			</div>

			<div v-if="loading" class="text-center py-10 text-gray-600 dark:text-gray-300">กำลังโหลด...</div>
			<div v-else class="space-y-4">
                <div v-for="m in filtered" :key="m.id" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ m.id }}</h3>
							<p v-if="m.by" class="text-xs text-gray-500 dark:text-gray-400 mt-1">by {{ m.by }}</p>
						</div>
                    <div class="text-right text-xs text-gray-600 dark:text-gray-300">
                        <span class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{{ m.pricing?.prompt_display }} input • {{ m.pricing?.completion_display }} output</span>
                    </div>
					</div>
                    <div v-if="m.context_length" class="mt-2 text-xs text-gray-500 dark:text-gray-400">context ~ {{ m.context_length }}</div>
                    <p v-if="m.description" class="mt-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{{ m.description }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from 'nuxt/app'

useHead({ title: 'Models - UBU AI SERVICE' })

const list = ref<any[]>([])
const loading = ref(true)
const q = ref('')
const onlyFree = ref(false)

const load = async () => {
	loading.value = true
	try {
    const apiBase = useRuntimeConfig().public.apiBase as string
		const res = await $fetch(`${apiBase}/api/models`, { credentials: 'include' }) as { models: any[] }
		list.value = res.models || []
	} catch {
		list.value = []
	} finally {
		loading.value = false
	}
}

onMounted(load)

const filtered = computed(() => {
	let items = list.value
	if (q.value) {
		const s = q.value.toLowerCase()
		items = items.filter(m => String(m.id).toLowerCase().includes(s) || String(m.name||'').toLowerCase().includes(s))
	}
    if (onlyFree.value) {
        items = items.filter(m => {
            const pIn = Number(m?.pricing?.prompt_usd_per_m)
            const pOut = Number(m?.pricing?.completion_usd_per_m)
            const freeIn = !isFinite(pIn) || pIn === 0
            const freeOut = !isFinite(pOut) || pOut === 0
            return freeIn && freeOut
        })
    }
	return items
})

const toPrice = (v: any) => {
    if (v === null || v === undefined) return '—'
    const n = Number(v)
    if (!isFinite(n)) return '—'
    return n.toFixed(3)
}
</script>


