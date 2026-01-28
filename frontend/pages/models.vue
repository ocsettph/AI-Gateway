<template>
	<div class="min-h-screen py-10 bg-transparent dark:bg-transparent">
		<div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Models</h1>
					<div v-if="lastUpdated" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						อัพเดทล่าสุด: {{ lastUpdated }} • รวม {{ filteredModels.length }} โมเดล
					</div>
				</div>
				<div class="flex items-center gap-3">
					<button
						@click="showCompare = !showCompare"
						:class="[
							'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
							showCompare
								? 'bg-indigo-600 text-white shadow-md'
								: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
						]"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
						</svg>
						Compare
						<span v-if="compareList.length > 0" class="ml-1 px-1.5 py-0.5 bg-indigo-700 dark:bg-indigo-500 rounded text-xs">
							{{ compareList.length }}
						</span>
					</button>
					<button
						@click="viewMode = 'list'"
						:class="[
							'p-2 rounded-lg transition-all duration-200',
							viewMode === 'list'
								? 'bg-indigo-600 text-white'
								: 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
						]"
						title="List View"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</button>
					<button
						@click="viewMode = 'grid'"
						:class="[
							'p-2 rounded-lg transition-all duration-200',
							viewMode === 'grid'
								? 'bg-indigo-600 text-white'
								: 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
						]"
						title="Grid View"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
						</svg>
					</button>
					<button 
						@click="load" 
						:disabled="loading"
						class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						<svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						<svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						{{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}
					</button>
				</div>
			</div>

			<!-- Compare Modal -->
			<div v-if="showCompare" class="fixed inset-0 z-50 overflow-y-auto" @click.self="showCompare = false">
				<div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
					<div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showCompare = false"></div>
					<div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
						<div class="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
									Compare Models ({{ compareList.length }}/3)
								</h3>
								<button @click="showCompare = false" class="text-gray-400 hover:text-gray-500">
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
									</svg>
								</button>
							</div>
						</div>
						<div class="bg-white dark:bg-gray-800 px-6 py-4">
							<div v-if="compareList.length === 0" class="text-center py-12">
								<p class="text-gray-500 dark:text-gray-400 mb-4">ยังไม่มีโมเดลที่เลือกไว้สำหรับเปรียบเทียบ</p>
								<p class="text-sm text-gray-400 dark:text-gray-500">คลิกที่ปุ่ม "Add to Compare" ในโมเดลที่ต้องการเปรียบเทียบ</p>
							</div>
							<div v-else class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
									<thead class="bg-gray-50 dark:bg-gray-900">
										<tr>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Input ($/1M tokens)</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Output ($/1M tokens)</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Context (tokens)</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
											<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
										</tr>
									</thead>
									<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
										<tr v-for="modelId in compareList" :key="modelId">
											<td class="px-4 py-4 whitespace-nowrap">
												<div class="flex items-center">
													<div>
														<div class="text-sm font-medium text-gray-900 dark:text-white">
															{{ getModelDisplayName(modelId) }}
														</div>
														<div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
															{{ modelId }}
														</div>
													</div>
												</div>
											</td>
											<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{{ getModelById(modelId)?.pricing?.prompt_display || '$0.000' }}
											</td>
											<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{{ getModelById(modelId)?.pricing?.completion_display || '$0.000' }}
											</td>
											<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{{ formatNumber(getModelById(modelId)?.context_length || 0) }}
											</td>
											<td class="px-4 py-4 whitespace-nowrap">
												<span class="px-2 py-1 text-xs font-medium rounded" :class="getCategoryBadgeClass(getModelCategory(modelId))">
													{{ getCategoryName(getModelCategory(modelId)) }}
												</span>
											</td>
											<td class="px-4 py-4 whitespace-nowrap text-sm">
												<button @click="removeFromCompare(modelId)" class="text-red-600 hover:text-red-800">
													Remove
												</button>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Loading State -->
			<div v-if="loading" class="text-center py-20">
				<div class="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูลโมเดล...</p>
			</div>

			<!-- Error State -->
			<div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
				<svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">ไม่สามารถโหลดข้อมูลโมเดลได้</h3>
				<p class="text-sm text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
				<button @click="load" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
					ลองอีกครั้ง
				</button>
			</div>

			<!-- Main Content -->
			<div v-else class="flex flex-col lg:flex-row gap-6">
				<!-- Left Sidebar Filters -->
				<div class="lg:w-64 flex-shrink-0">
					<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
						<h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
						
						<!-- Search -->
						<div class="mb-6">
							<input 
								v-model="q" 
								type="text" 
								placeholder="Search models..." 
								class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
							/>
						</div>
						
						<!-- Output Modalities -->
						<div class="mb-6">
							<h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Output Modalities</h4>
							<div class="space-y-2">
								<label v-for="cat in categories.filter(c => c.id !== 'all')" :key="cat.id" class="flex items-center cursor-pointer group">
									<input 
										type="checkbox" 
										:checked="selectedCategory === cat.id"
										@change="selectedCategory = selectedCategory === cat.id ? 'all' : cat.id"
										class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
									/>
									<span class="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
										{{ cat.icon }} {{ cat.name }}
									</span>
									<span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
										({{ getCategoryCount(cat.id) }})
									</span>
								</label>
							</div>
						</div>
						
						<!-- Sort Options -->
						<div class="mb-6">
							<h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Sort By</h4>
							<select v-model="sortBy" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
								<option value="newest">Newest</option>
								<option value="popular">Most Popular</option>
								<option value="pricing-low">Pricing: Low to High</option>
								<option value="pricing-high">Pricing: High to Low</option>
								<option value="context-high">Context: High to Low</option>
								<option value="name">Name (A-Z)</option>
							</select>
						</div>
						
						<!-- Free Models Only -->
						<div class="mb-6">
							<label class="flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									v-model="onlyFree"
									class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
								/>
								<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Free Models Only</span>
							</label>
						</div>
						
						<!-- Model Count -->
						<div class="pt-4 border-t border-gray-200 dark:border-gray-700">
							<div class="text-xs text-gray-500 dark:text-gray-400">
								<span v-if="selectedCategory === 'all' && !q && !onlyFree">
									{{ list.length }} models
								</span>
								<span v-else>
									{{ filteredModels.length }} of {{ list.length }} models
								</span>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Main Content Area -->
				<div class="flex-1">
					<!-- Search and Sort Bar -->
					<div class="mb-4 flex items-center justify-between">
						<div class="text-sm text-gray-600 dark:text-gray-400">
							{{ filteredModels.length }} models
						</div>
						<select v-model="sortBy" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
							<option value="newest">Newest</option>
							<option value="popular">Most Popular</option>
							<option value="pricing-low">Pricing: Low to High</option>
							<option value="pricing-high">Pricing: High to Low</option>
							<option value="context-high">Context: High to Low</option>
							<option value="name">Name (A-Z)</option>
						</select>
					</div>

					<!-- List View -->
					<div v-if="viewMode === 'list'" class="space-y-2">
						<div
							v-for="model in filteredModels"
							:key="model.id"
							class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-2">
										<h3 class="text-base font-semibold text-gray-900 dark:text-white">
											{{ getModelDisplayName(model.id) }}
											<span v-if="isFreeModel(model)" class="ml-2 text-xs text-green-600 dark:text-green-400">(free)</span>
										</h3>
										<button
											@click="toggleCompare(model.id)"
											:disabled="compareList.length >= 3 && !compareList.includes(model.id)"
											:class="[
												'px-2 py-1 text-xs rounded transition-colors',
												compareList.includes(model.id)
													? 'bg-indigo-600 text-white'
													: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
											]"
											:title="compareList.includes(model.id) ? 'Remove from compare' : 'Add to compare'"
										>
											{{ compareList.includes(model.id) ? '✓' : '+' }}
										</button>
									</div>
									<p v-if="model.description" class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
										{{ model.description }}
									</p>
									<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
										<span>by {{ model.by || 'unknown' }}</span>
										<span v-if="model.context_length">Context: {{ formatNumber(model.context_length) }}</span>
									</div>
								</div>
								<div class="ml-4 flex-shrink-0 text-right">
									<div class="text-sm font-medium text-gray-900 dark:text-white mb-1">
										{{ model.pricing?.prompt_display || '$0.000' }} / {{ model.pricing?.completion_display || '$0.000' }}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										Input / Output
									</div>
									<span class="mt-2 inline-block px-2 py-1 text-xs font-medium rounded" :class="getCategoryBadgeClass(getModelCategory(model.id))">
										{{ getCategoryName(getModelCategory(model.id)) }}
									</span>
								</div>
							</div>
							<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
								<code class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ model.id }}</code>
								<button
									@click="copyModelId(model.id)"
									class="ml-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
									title="Copy Model ID"
								>
									<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
									</svg>
								</button>
							</div>
						</div>
					</div>

					<!-- Grid View -->
					<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div
							v-for="model in filteredModels"
							:key="model.id"
							class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200"
						>
							<div class="flex items-start justify-between mb-2">
								<h3 class="text-sm font-semibold text-gray-900 dark:text-white flex-1">
									{{ getModelDisplayName(model.id) }}
									<span v-if="isFreeModel(model)" class="ml-1 text-xs text-green-600 dark:text-green-400">(free)</span>
								</h3>
								<button
									@click="toggleCompare(model.id)"
									:disabled="compareList.length >= 3 && !compareList.includes(model.id)"
									:class="[
										'ml-2 p-1 rounded transition-colors flex-shrink-0',
										compareList.includes(model.id)
											? 'bg-indigo-600 text-white'
											: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
									]"
									:title="compareList.includes(model.id) ? 'Remove from compare' : 'Add to compare'"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
									</svg>
								</button>
							</div>
							<p v-if="model.description" class="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
								{{ model.description }}
							</p>
							<div class="space-y-2 text-xs">
								<div class="flex justify-between">
									<span class="text-gray-500 dark:text-gray-400">Input:</span>
									<span class="text-gray-900 dark:text-white font-medium">{{ model.pricing?.prompt_display || '$0.000' }}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500 dark:text-gray-400">Output:</span>
									<span class="text-gray-900 dark:text-white font-medium">{{ model.pricing?.completion_display || '$0.000' }}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500 dark:text-gray-400">Context:</span>
									<span class="text-gray-900 dark:text-white font-medium">{{ formatNumber(model.context_length || 0) }}</span>
								</div>
							</div>
							<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
								<span class="inline-block px-2 py-1 text-xs font-medium rounded mb-2" :class="getCategoryBadgeClass(getModelCategory(model.id))">
									{{ getCategoryName(getModelCategory(model.id)) }}
								</span>
								<code class="block text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{{ model.id }}</code>
							</div>
						</div>
					</div>

					<!-- Empty State -->
					<div v-if="filteredModels.length === 0" class="text-center py-20 text-gray-600 dark:text-gray-300">
						<svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
						</svg>
						<p class="mb-4">ไม่พบโมเดล</p>
						<button @click="q = ''; onlyFree = false; selectedCategory = 'all'" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
							ล้างตัวกรอง
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHead, useRuntimeConfig } from 'nuxt/app'

useHead({ title: 'Models - UBU AI SERVICE' })

const list = ref<any[]>([])
const loading = ref(true)
const error = ref<string>('')
const q = ref('')
const onlyFree = ref(false)
const lastUpdated = ref<string>('')
const selectedCategory = ref<string>('all')
const sortBy = ref<string>('newest')
const viewMode = ref<'list' | 'grid'>('list')
const showCompare = ref(false)
const compareList = ref<string[]>([])
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Categories
const categories = [
	{ id: 'all', name: 'ทั้งหมด', icon: '📋' },
	{ id: 'chat', name: 'Chat', icon: '💬' },
	{ id: 'image', name: 'สร้างรูปภาพ', icon: '🎨' },
	{ id: 'video', name: 'วิดีโอ', icon: '🎬' },
	{ id: 'embedding', name: 'Text Embedding', icon: '🔤' },
	{ id: 'code', name: 'Code', icon: '💻' },
	{ id: 'audio', name: 'เสียง', icon: '🎵' }
]

// Format time for display
const formatTime = (date: Date) => {
	return date.toLocaleTimeString('th-TH', { 
		hour: '2-digit', 
		minute: '2-digit',
		second: '2-digit'
	})
}

// Format number with commas
const formatNumber = (num: number) => {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Get model category
const getModelCategory = (modelId: string): string => {
	const model = getModelById(modelId)
	
	// First check if backend marked it as embedding
	if (model?.isEmbedding) {
		return 'embedding'
	}
	
	const id = modelId.toLowerCase()
	// Check for embedding models first (most specific) - comprehensive list
	// Match backend detection logic exactly
	if (id.includes('text-embedding') || 
	    id.includes('embed-') || 
	    id.includes('embedding') ||
	    id.includes('voyage') || 
	    id.includes('nomic-embed') || 
	    id.includes('jina-embeddings') ||
	    id.includes('jina-embed') ||
	    id.includes('m2-bert') || 
	    id.includes('multilingual-e5') || 
	    id.includes('bge-') || 
	    id.includes('all-minilm') || 
	    id.includes('all-mpnet') ||
	    id.includes('e5-') ||
	    id.includes('gte-') ||
	    id.includes('instructor-') ||
	    id.includes('sentence-transformers') ||
	    id.includes('paraphrase-') ||
	    id.includes('stella-') ||
	    id.includes('gemini-embedding') ||
	    id.includes('qwen-embedding') ||
	    id.includes('cohere-embed') ||
	    id.includes('embedding-001') ||
	    id.includes('embedding-002') ||
	    id.includes('embedding-003')) {
		return 'embedding'
	}
	
	// Also check modalities field if available
	const modalities = String(model?.modalities || '').toLowerCase()
	if (modalities.includes('embedding') || modalities.includes('vector')) {
		return 'embedding'
	}
	// Check for image generation
	if (id.includes('dall-e') || id.includes('image') || id.includes('stable-diffusion') || 
	    id.includes('midjourney') || id.includes('flux') || id.includes('imagen')) {
		return 'image'
	}
	// Check for video
	if (id.includes('video') || id.includes('runway') || id.includes('pika') || 
	    id.includes('sora') || id.includes('veo')) {
		return 'video'
	}
	// Check for code
	if (id.includes('code') || id.includes('coder') || id.includes('starcoder') || 
	    id.includes('deepseek-coder') || id.includes('code-')) {
		return 'code'
	}
	// Check for audio
	if (id.includes('whisper') || id.includes('audio') || id.includes('tts') || 
	    id.includes('speech') || id.includes('voice')) {
		return 'audio'
	}
	// Default to chat
	return 'chat'
}

// Get category name
const getCategoryName = (category: string): string => {
	const cat = categories.find(c => c.id === category)
	return cat ? cat.name : category
}

// Get category badge class
const getCategoryBadgeClass = (category: string): string => {
	const classes: Record<string, string> = {
		chat: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
		image: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
		video: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
		embedding: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
		code: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
		audio: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
	}
	return classes[category] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

// Get model display name
const getModelDisplayName = (modelId: string): string => {
	const parts = modelId.split('/')
	if (parts.length > 1) {
		return parts[parts.length - 1]
	}
	return modelId
}

// Get model by ID
const getModelById = (modelId: string) => {
	return list.value.find(m => m.id === modelId)
}

// Check if model is free
const isFreeModel = (model: any): boolean => {
	const pIn = Number(model?.pricing?.prompt_usd_per_m)
	const pOut = Number(model?.pricing?.completion_usd_per_m)
	return (!isFinite(pIn) || pIn === 0) && (!isFinite(pOut) || pOut === 0)
}

// Get category count - count from all models, not filtered ones
const getCategoryCount = (categoryId: string): number => {
	if (categoryId === 'all') return list.value.length
	// Count from all models (list.value) to show accurate counts regardless of current filter
	return list.value.filter(m => getModelCategory(m.id) === categoryId).length
}

// Get filtered and sorted models
const filteredModels = computed(() => {
	let items = list.value
	
	// Search filter
	if (q.value) {
		const s = q.value.toLowerCase()
		items = items.filter(m => 
			String(m.id).toLowerCase().includes(s) || 
			String(m.name || '').toLowerCase().includes(s) ||
			String(m.description || '').toLowerCase().includes(s)
		)
	}
	
	// Free filter
	if (onlyFree.value) {
		items = items.filter(m => isFreeModel(m))
	}
	
	// Category filter
	if (selectedCategory.value !== 'all') {
		items = items.filter(m => getModelCategory(m.id) === selectedCategory.value)
	}
	
	// Sort models
	items = [...items].sort((a, b) => {
		switch (sortBy.value) {
			case 'newest':
				return String(b.id).localeCompare(String(a.id))
			case 'popular':
				return String(a.name || a.id).localeCompare(String(b.name || b.id))
			case 'pricing-low':
				const priceA = (Number(a.pricing?.prompt_usd_per_m) || 0) + (Number(a.pricing?.completion_usd_per_m) || 0)
				const priceB = (Number(b.pricing?.prompt_usd_per_m) || 0) + (Number(b.pricing?.completion_usd_per_m) || 0)
				return priceA - priceB
			case 'pricing-high':
				const priceA2 = (Number(a.pricing?.prompt_usd_per_m) || 0) + (Number(a.pricing?.completion_usd_per_m) || 0)
				const priceB2 = (Number(b.pricing?.prompt_usd_per_m) || 0) + (Number(b.pricing?.completion_usd_per_m) || 0)
				return priceB2 - priceA2
			case 'context-high':
				const ctxA = Number(a.context_length) || 0
				const ctxB = Number(b.context_length) || 0
				return ctxB - ctxA
			case 'name':
				return String(a.name || a.id).localeCompare(String(b.name || b.id))
			default:
				return 0
		}
	})
	
	return items
})

// Compare functions
const toggleCompare = (modelId: string) => {
	const index = compareList.value.indexOf(modelId)
	if (index > -1) {
		compareList.value.splice(index, 1)
	} else {
		if (compareList.value.length < 3) {
			compareList.value.push(modelId)
		}
	}
}

const removeFromCompare = (modelId: string) => {
	const index = compareList.value.indexOf(modelId)
	if (index > -1) {
		compareList.value.splice(index, 1)
	}
}

// Copy model ID
const copyModelId = async (modelId: string) => {
	try {
		await navigator.clipboard.writeText(modelId)
		try {
			const Swal = (await import('sweetalert2')).default
			await Swal.fire({ 
				icon: 'success', 
				title: 'คัดลอกแล้ว', 
				text: `คัดลอก Model ID: ${modelId}`,
				timer: 2000,
				showConfirmButton: false
			})
		} catch {}
	} catch (error) {
		console.error('Error copying model ID:', error)
	}
}

// Load models
const load = async () => {
	loading.value = true
	error.value = ''
	try {
		const apiBase = useRuntimeConfig().public.apiBase as string
		// Use refresh=true to force fresh fetch from OpenRouter
		const apiPath = apiBase.endsWith('/api') || apiBase === '/api' 
			? `${apiBase}/models?refresh=true` 
			: `${apiBase}/api/models?refresh=true`
		console.log(`🔄 Fetching models from: ${apiPath}`)
		
		const res = await $fetch(apiPath, { credentials: 'include' }) as { models: any[] }
		
		console.log(`📦 Received response:`, { 
			hasModels: !!res.models, 
			modelsLength: res.models?.length || 0,
			modelsType: Array.isArray(res.models) ? 'array' : typeof res.models
		})
		
		if (!res || !res.models) {
			console.error('❌ Invalid response structure:', res)
			throw new Error('Invalid response from server: missing models array')
		}
		
		if (!Array.isArray(res.models)) {
			console.error('❌ Models is not an array:', res.models)
			throw new Error('Invalid response: models is not an array')
		}
		
		list.value = res.models || []
		lastUpdated.value = formatTime(new Date())
		
		// Log statistics - check both isEmbedding flag and ID patterns
		const embeddingByFlag = list.value.filter(m => m.isEmbedding === true).length
		const embeddingByPattern = list.value.filter(m => {
			const id = String(m?.id || '').toLowerCase()
			return id.includes('embedding') || id.includes('embed-') || id.includes('text-embedding') ||
			       id.includes('voyage') || id.includes('nomic-embed') || id.includes('jina-embeddings') ||
			       id.includes('bge-') || id.includes('multilingual-e5') || id.includes('e5-') ||
			       id.includes('all-minilm') || id.includes('all-mpnet') || id.includes('m2-bert') ||
			       id.includes('sentence-transformers') || id.includes('cohere-embed')
		}).length
		
		console.log(`✅ Loaded ${list.value.length} models`)
		console.log(`   📊 Embedding models: ${embeddingByFlag} (by flag), ${embeddingByPattern} (by pattern)`)
		
		if (embeddingByFlag === 0 && embeddingByPattern > 0) {
			console.warn(`⚠️  Warning: Backend is not setting isEmbedding flag correctly!`)
			console.warn(`   Found ${embeddingByPattern} embedding models by pattern but 0 by flag`)
		}
		
		if (embeddingByFlag === 0 && embeddingByPattern === 0) {
			console.warn(`⚠️  Warning: No embedding models found at all!`)
			// Log sample of model IDs to help debug
			const sampleIds = list.value.slice(0, 20).map(m => m.id)
			console.log(`   Sample model IDs: ${sampleIds.join(', ')}`)
		}
		
		if (list.value.length === 0) {
			error.value = 'ไม่พบโมเดล กรุณาลองรีเฟรชอีกครั้งหรือติดต่อผู้ดูแลระบบ'
		}
	} catch (e: any) {
		console.error('❌ Error loading models:', e)
		list.value = []
		
		if (e?.message?.includes('fetch') || e?.message?.includes('network') || e?.message?.includes('CONNECTION_REFUSED')) {
			error.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend server กำลังทำงานอยู่'
		} else if (e?.status === 500) {
			error.value = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
		} else if (e?.status === 401 || e?.status === 403) {
			error.value = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบก่อน'
		} else {
			error.value = e?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลโมเดล'
		}
	} finally {
		loading.value = false
	}
}

// Auto-refresh models every 5 minutes
const startAutoRefresh = () => {
	if (refreshInterval) {
		clearInterval(refreshInterval)
	}
	refreshInterval = setInterval(() => {
		console.log('🔄 Auto-refreshing models list...')
		load()
	}, 5 * 60 * 1000) // 5 minutes
}

// Stop auto-refresh
const stopAutoRefresh = () => {
	if (refreshInterval) {
		clearInterval(refreshInterval)
		refreshInterval = null
	}
}

onMounted(() => {
	load()
	startAutoRefresh()
})

onBeforeUnmount(() => {
	stopAutoRefresh()
})
</script>
