<template>
  <!-- Chatbot Button (Floating) -->
  <div
    v-if="!isOpen && isVisible"
    class="fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center group"
  >
    <!-- Close Button -->
    <button
      @click.stop="isVisible = false"
      class="absolute -top-2 -right-2 z-10 w-7 h-7 md:w-8 md:h-8 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
      aria-label="ปิดน้องยูบี"
      title="ปิด"
    >
      <svg class="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>

    <!-- Chatbot Button -->
    <button
      @click="toggleChat"
      class="bg-transparent hover:opacity-90 transition-all duration-300 flex flex-col items-center justify-center animate-bounce hover:animate-none cursor-pointer"
      aria-label="เปิดแชทบอท"
    >
      <!-- Name Label -->
      <div class="mb-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50">
        <span class="text-xs md:text-sm font-semibold text-gray-800">น้องยูบี</span>
      </div>
      
      <!-- Bot Image -->
      <img
        :src="base + 'assets/UB_AIBot_V2.png'"
        alt="น้องยูบี"
        class="w-32 h-32 md:w-40 md:h-40 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
      />
      
      <!-- Notification Badge -->
      <span
        v-if="hasNewMessage"
        class="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold animate-pulse shadow-xl border-2 border-white"
      >
        !
      </span>
    </button>
  </div>

  <!-- Show Chatbot Button (when hidden) -->
  <button
    v-if="!isOpen && !isVisible"
    @click="isVisible = true"
    class="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer bg-transparent shadow-none"
    aria-label="แสดงน้องยูบี"
    title="แสดงน้องยูบี"
  >
    <img
      :src="base + 'assets/UB_AIBot_V2.png'"
      alt="น้องยูบี"
      class="w-10 h-10 md:w-12 md:h-12 object-contain"
    />
    <span
      v-if="hasNewMessage"
      class="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse shadow-xl border-2 border-white"
    >
      !
    </span>
  </button>

  <!-- Chatbot Window -->
  <div
    v-if="isOpen"
    class="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] md:w-96 h-[calc(100vh-8rem)] md:h-[600px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col border border-gray-200/50 overflow-hidden"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img
          :src="base + 'assets/UB_AIBot_V2.png'"
          alt="น้องยูบี"
          class="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
        />
        <div>
          <h3 class="text-white font-semibold text-base md:text-lg">น้องยูบี</h3>
          <p class="text-blue-100 text-xs md:text-sm">UBU AI Assistant</p>
        </div>
      </div>
      <button
        @click="toggleChat"
        class="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        aria-label="ปิดแชทบอท"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Messages Container -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent"
      style="scroll-behavior: smooth;"
    >
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="flex items-start gap-3">
        <img
          :src="base + 'assets/UB_AIBot_V2.png'"
          alt="น้องยูบี"
          class="w-14 h-14 md:w-16 md:h-16 object-contain flex-shrink-0 drop-shadow-md"
        />
        <div class="flex-1">
          <div class="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200">
            <p class="text-gray-800 text-sm md:text-base">
              <template v-if="currentUser">
                สวัสดีคุณ<strong>{{ currentUser.fullname || currentUser.username || '' }}</strong>ครับ! 👋<br>
              </template>
              <template v-else>
                สวัสดีครับ! 👋<br>
              </template>
              ผมคือ <strong>น้องยูบี</strong> <img :src="base + 'assets/UB_AIBot_V2.png'" alt="น้องยูบี" class="inline-block w-5 h-5 md:w-6 md:h-6 align-middle ml-1 object-contain" /><br>
              ผมพร้อมช่วยตอบคำถามเกี่ยวกับ UBU AI SERVICE ครับ<br>
              มีอะไรให้ช่วยไหมครับ?
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-1 ml-2">ตอนนี้</p>
        </div>
      </div>

      <!-- Messages -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'flex items-start gap-3',
          message.role === 'user' ? 'flex-row-reverse' : ''
        ]"
      >
        <!-- Bot Avatar -->
        <img
          v-if="message.role === 'assistant'"
          :src="base + 'assets/UB_AIBot_V2.png'"
          alt="น้องยูบี"
          class="w-14 h-14 md:w-16 md:h-16 object-contain flex-shrink-0 drop-shadow-md"
        />
        <!-- User Avatar -->
        <div
          v-else
          class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
        >
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
          </svg>
        </div>

        <div :class="['flex-1', message.role === 'user' ? 'items-end' : 'items-start']">
          <div
            :class="[
              'rounded-2xl px-4 py-3 shadow-sm max-w-[85%] md:max-w-[80%]',
              message.role === 'user'
                ? 'bg-blue-500 text-white rounded-tr-none ml-auto'
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
            ]"
          >
            <p class="text-sm md:text-base whitespace-pre-wrap break-words">{{ message?.content ?? '' }}</p>
          </div>
          <p class="text-xs text-gray-500 mt-1" :class="message.role === 'user' ? 'text-right mr-2' : 'ml-2'">
            {{ formatTime(message.timestamp) }}
          </p>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="flex items-start gap-3">
        <img
          :src="base + 'assets/UB_AIBot_V2.png'"
          alt="น้องยูบี"
          class="w-14 h-14 md:w-16 md:h-16 object-contain flex-shrink-0 drop-shadow-md"
        />
        <div class="flex-1">
          <div class="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200 inline-block">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm p-4">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="พิมพ์ข้อความ..."
          class="flex-1 px-4 py-2 md:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
          :disabled="isTyping"
        />
        <button
          type="submit"
          :disabled="!inputMessage.trim() || isTyping"
          class="w-10 h-10 md:w-12 md:h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
          aria-label="ส่งข้อความ"
        >
          <svg
            v-if="!isTyping"
            class="w-5 h-5 md:w-6 md:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
          <svg
            v-else
            class="w-5 h-5 md:w-6 md:h-6 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </form>
      <p class="text-xs text-gray-500 text-center mt-2">
        น้องยูบีพร้อมช่วยเหลือคุณเสมอ
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'

const base = (useRuntimeConfig().public as any).basePath || '/'
const webhookUrl = 'https://n8n.ubu.ac.th/webhook/chat'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const isOpen = ref(false)
const isTyping = ref(false)
const inputMessage = ref('')
const messages = ref<Message[]>([])
const hasNewMessage = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const currentUser = ref<any>(null)
const apiBase = (useRuntimeConfig().public as any).apiBase || ''
const isVisible = ref(true) // Control chatbot button visibility

  // Fetch current user info (non-blocking - don't wait for it)
  const fetchCurrentUser = async () => {
    try {
      // apiBase already includes /api prefix for production
      const mePath = apiBase.endsWith('/api') || apiBase === '/api' 
        ? `${apiBase}/me` 
        : `${apiBase}/api/me`
      const me: any = await $fetch(mePath, { credentials: 'include' })
      currentUser.value = me?.user || null
    } catch (error) {
      // Silently fail - user can still use chatbot without login
      currentUser.value = null
    }
  }

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    hasNewMessage.value = false
    // Fetch user info when opening chat to ensure it's up to date
    fetchCurrentUser()
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  })

  nextTick(() => {
    scrollToBottom()
  })

  // Show typing indicator
  isTyping.value = true
  hasNewMessage.value = true

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

    // Try to fetch user info in background (non-blocking)
    // Don't wait for it - chatbot should work even without login
    if (!currentUser.value) {
      fetchCurrentUser().catch(() => {
        // Silently fail - continue without user info
      })
    }

    // Prepare request body
    // n8n workflow expects 'chatInput' field for AI Agent node
    // Include user info if available, otherwise send null
    // n8n will use Retriever Flow if no userEmail, API UBU AI GATEWAY if has userEmail
    // Always allow data retrieval even without login
    const requestBody = {
      chatInput: userMessage,
      message: userMessage, // Keep for backward compatibility
      chatId: 'ubu-ai-gateway-chat',
      chatid: 'ubu-ai-gateway-chat', // Some workflows use lowercase
      userEmail: currentUser.value?.email || null,
      userId: currentUser.value?.id || null,
      userName: currentUser.value?.fullname || currentUser.value?.username || null,
      apiBase: apiBase, // Provide API base URL for n8n to call
      allowDataRetrieval: true, // Always allow data retrieval even without login
      requireLogin: false // Explicitly tell n8n that login is not required for data retrieval
    }
    
    console.log('Sending to n8n webhook:', {
      url: webhookUrl,
      body: requestBody
    })

    // Send to n8n webhook
    const fetchResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Check if response is ok
    if (!fetchResponse.ok) {
      // Try to get error details from response body
      let errorDetails = ''
      try {
        const errorBody = await fetchResponse.text()
        errorDetails = errorBody
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorBody)
          errorDetails = JSON.stringify(errorJson, null, 2)
        } catch {
          // Keep as text if not JSON
        }
      } catch {
        errorDetails = 'No error details available'
      }
      
      console.error(`n8n webhook error (${fetchResponse.status}):`, errorDetails)
      
      const error = new Error(`HTTP error! status: ${fetchResponse.status} ${fetchResponse.statusText}`)
      ;(error as any).status = fetchResponse.status
      ;(error as any).statusText = fetchResponse.statusText
      ;(error as any).details = errorDetails
      throw error
    }

    // Parse response
    const response = await fetchResponse.json()

    console.log('Chatbot response received:', response)

    // Extract response text (support multiple response formats from n8n)
    let botResponse = ''
    if (typeof response === 'string') {
      botResponse = response.trim()
    } else if (response && typeof response === 'object') {
      // Type assertion for accessing properties
      const resp = response as any
      console.log('Parsing response object:', resp)
      
      // Try common response fields (use optional chaining to avoid "reading 'content' of undefined")
      botResponse = resp?.message ||
                    resp?.text ||
                    resp?.response ||
                    resp?.answer ||
                    (Array.isArray(resp?.output) && resp.output.length > 0
                      ? (typeof resp.output[0] === 'string'
                          ? resp.output[0]
                          : resp.output[0]?.content?.[0]?.text ?? resp.output[0]?.content ?? resp.output[0]?.text ?? '')
                      : resp?.output) ||
                    resp?.data?.message ||
                    resp?.data?.text ||
                    resp?.data?.response ||
                    resp?.data?.answer ||
                    resp?.result ||
                    resp?.content ||
                    resp?.reply ||
                    (Array.isArray(resp) && resp.length > 0 ? (typeof resp[0] === 'string' ? resp[0] : resp[0]?.message ?? resp[0]?.content ?? resp[0]?.text ?? '') : '') ||
                    (resp?.choices?.[0]?.message?.content) ||
                    ''
      
      // If still empty, try to stringify and extract meaningful content
      if (!botResponse || botResponse.trim() === '') {
        const jsonStr = JSON.stringify(response)
        console.log('Response JSON string:', jsonStr)
        // Try to extract text from JSON structure
        const textMatch = jsonStr.match(/"message":\s*"([^"]+)"/) || 
                         jsonStr.match(/"text":\s*"([^"]+)"/) ||
                         jsonStr.match(/"response":\s*"([^"]+)"/) ||
                         jsonStr.match(/"answer":\s*"([^"]+)"/) ||
                         jsonStr.match(/"reply":\s*"([^"]+)"/)
        if (textMatch) {
          botResponse = textMatch[1]
        }
      }
      
      // If response is an array of objects, try to get the first meaningful value
      if ((!botResponse || botResponse.trim() === '') && Array.isArray(resp) && resp.length > 0) {
        const firstItem = resp[0]
        if (typeof firstItem === 'object' && firstItem !== null) {
          botResponse = firstItem?.message ?? firstItem?.content ?? firstItem?.text ?? firstItem?.response ?? firstItem?.answer ?? ''
        }
      }
    }

    if (!botResponse || botResponse.trim() === '') {
      console.warn('Empty bot response, using fallback message')
      botResponse = 'ขออภัยครับ ไม่สามารถประมวลผลได้ในขณะนี้ กรุณาลองใหม่อีกครั้งครับ'
    }

    // Add bot response
    messages.value.push({
      role: 'assistant',
      content: botResponse,
      timestamp: new Date()
    })

    if (!isOpen.value) {
      hasNewMessage.value = true
    }
  } catch (error: any) {
    console.error('Chatbot error:', error)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    })
    
    let errorMessage = 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งครับ'
    
    // Provide more specific error messages
    if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('timeout')) {
      errorMessage = 'ขออภัยครับ การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้งครับ'
    } else if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
      errorMessage = 'ขออภัยครับ ไม่พบบริการ chatbot ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลังครับ'
    } else if (error?.status === 500 || error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
      // Check if error details contain specific n8n workflow error
      const errorDetails = (error as any)?.details || ''
      if (errorDetails.includes('Error in workflow') || errorDetails.includes('workflow')) {
        errorMessage = 'ขออภัยครับ เกิดข้อผิดพลาดในระบบ chatbot (n8n workflow error) กรุณาลองใหม่อีกครั้งภายหลัง หรือติดต่อผู้ดูแลระบบครับ'
      } else {
        errorMessage = 'ขออภัยครับ เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ chatbot กรุณาลองใหม่อีกครั้งภายหลังครับ'
      }
      console.error('n8n webhook 500 error details:', errorDetails)
    } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      errorMessage = 'ขออภัยครับ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้งครับ'
    }
    
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date()
    })
  } finally {
    isTyping.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// Auto-scroll when new messages arrive
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// Close on escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    toggleChat()
  }
}

// Handle logout event - reset chatbot state
const handleLogout = () => {
  // Clear user info
  currentUser.value = null
  // Clear messages
  messages.value = []
  // Clear input
  inputMessage.value = ''
  // Close chat if open
  if (isOpen.value) {
    isOpen.value = false
  }
  // Clear new message indicator
  hasNewMessage.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  // Listen for logout event
  window.addEventListener('user-logout', handleLogout)
  // Listen for login success event to refresh user data
  window.addEventListener('user-login-success', fetchCurrentUser)
  // Fetch user info when component mounts
  fetchCurrentUser()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
  window.removeEventListener('user-logout', handleLogout)
  window.removeEventListener('user-login-success', fetchCurrentUser)
})
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

