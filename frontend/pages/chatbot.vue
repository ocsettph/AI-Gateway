<template>
  <div class="min-h-screen py-8 md:py-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <section class="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-6 md:p-8">
        <p class="text-sm font-semibold uppercase tracking-wide text-amber-700">Chatbot Popup Sandbox</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-900 md:text-4xl">สร้างและทดสอบบอทได้ทันที</h1>
        <p class="mt-2 text-sm text-gray-700">ตั้งค่า webhook, สี, รูปท่าทาง และลองแชทกับ popup preview ได้ทันที — พร้อมนำไปใช้งานจริงแล้วสามารถขอรับโค้ดติดตั้งและชุดมาสคอตได้</p>
      </section>

      <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article class="rounded-2xl border border-gray-200 bg-white p-5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Step 2 · ตั้งค่าบอท</h2>
            <button class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200" @click="resetAll">รีเซ็ต</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-1 text-sm md:col-span-2">
              <span class="font-medium text-gray-700">Webhook URL (n8n)</span>
              <input ref="webhookInputRef" v-model="config.webhookUrl" class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" type="url" />
            </label>
            <label class="space-y-1 text-sm">
              <span class="font-medium text-gray-700">ชื่อบอท</span>
              <input ref="botNameInputRef" v-model="config.botName" class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" type="text" />
            </label>
            <label class="space-y-1 text-sm">
              <span class="font-medium text-gray-700">ชื่อมาสคอต</span>
              <input v-model="config.mascotName" class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" type="text" />
            </label>
            <label class="space-y-1 text-sm md:col-span-2">
              <span class="font-medium text-gray-700">ข้อความต้อนรับ (welcome)</span>
              <textarea ref="welcomeInputRef" v-model="config.welcomeMessage" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>

          <div ref="colorSectionRef" class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3" :class="activeGuideStep === 'color' ? 'ring-2 ring-amber-300' : ''">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">สีแถบหัวแชท</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button v-for="color in presetHeaderColors" :key="color" class="h-8 w-8 rounded-full ring-2 ring-offset-2 transition" :class="config.headerColor === color ? 'ring-gray-800' : 'ring-transparent'" :style="{ backgroundColor: color }" @click="config.headerColor = color" />
              <label class="ml-2 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700">
                เลือกสีเอง
                <input v-model="config.headerColor" type="color" class="h-6 w-8 cursor-pointer border-0 bg-transparent p-0" />
              </label>
            </div>
          </div>

          <div ref="expressionSectionRef" class="mt-4 rounded-xl border border-gray-200 p-3" :class="activeGuideStep === 'expression' ? 'ring-2 ring-amber-300' : ''">
            <div class="mb-2 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-800">Step 3 · ใส่รูปตามท่าทาง</h3>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
                  title="ดูรูปเต็ม"
                  @click="openMascotPosterModal"
                >
                  <img :src="mascotPosterImage" alt="UBU BuaBan Poster" class="h-7 w-7 rounded object-cover" />
                  <span class="text-xs text-gray-600">BuaBan Mascot</span>
                </button>
                <button
                  v-if="hasCodeAccess"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-50"
                  @click="downloadMascotPack"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
                  </svg>
                  ดาวน์โหลดชุดมาสคอต
                </button>
                <button
                  v-else
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 transition hover:bg-amber-100"
                  @click="openRequestPanel"
                >
                  ขอดาวน์โหลดชุดมาสคอต
                </button>
                <span class="text-xs text-gray-500">อัปโหลดไม่ถาวร (รีเฟรชแล้วหาย)</span>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="rule in expressionRules" :key="rule.key" class="grid gap-2 rounded-lg border border-gray-200 p-2 md:grid-cols-[64px_1fr_auto] md:items-center">
                <img :src="expressionImages[rule.key]" :alt="rule.key" class="h-14 w-14 rounded-lg object-cover" />
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ rule.key }}</p>
                  <p class="text-xs text-gray-600">{{ rule.description }}</p>
                </div>
                <label class="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                  อัปโหลดรูป
                  <input type="file" accept="image/*" class="hidden" @change="onExpressionUpload(rule.key, $event)" />
                </label>
              </div>
            </div>
          </div>
        </article>

        <article ref="requestPanelRef" class="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 class="text-base font-semibold text-gray-900">ขั้นตอนทดสอบ (เปิดให้ทุกคน)</h3>
          <div class="mt-3 space-y-2">
            <button type="button" @click="goToGuideStep('webhook')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
              1) กรอก Webhook URL
            </button>
            <button type="button" @click="goToGuideStep('profile')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
              2) ตั้งชื่อบอท + ข้อความต้อนรับ
            </button>
            <button type="button" @click="goToGuideStep('color')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
              3) เลือกสีหัวแชท
            </button>
            <button type="button" @click="goToGuideStep('expression')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
              4) อัปโหลดรูปท่าทางทั้ง 5 expression
            </button>
            <button type="button" @click="goToGuideStep('preview')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
              5) เปิด Popup Preview และลองคุยจริง
            </button>
            <template v-if="hasCodeAccess">
              <button type="button" @click="goToGuideStep('flow')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
                6) ตัวอย่าง n8n Flow (Demo)
              </button>
              <button type="button" @click="goToGuideStep('install')" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100">
                7) Copy โค้ดไปปลั๊กเว็บของคุณ
              </button>
            </template>
          </div>

          <div v-if="hasCodeAccess" class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p class="text-xs font-medium text-blue-700">JSON Contract</p>
            <pre class="mt-2 overflow-x-auto text-xs text-blue-900">{{ schemaText }}</pre>
          </div>

          <div v-else class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div class="flex items-start gap-3">
              <div class="rounded-full bg-amber-100 p-2 text-amber-700">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-amber-900">ขอรับโค้ดติดตั้งและเอกสารเทคนิค</p>
                <p class="mt-1 text-xs text-amber-800">
                  ทดสอบ webhook และ preview ได้เลย เมื่อพร้อมนำไปใช้งานจริง ส่งคำขอพร้อมบอกวัตถุประสงค์เพื่อรับโค้ดปลั๊กเว็บ ชุดมาสคอต และตัวอย่าง n8n
                </p>

                <div v-if="codeAccessStatus === 'unauthenticated'" class="mt-3">
                  <NuxtLink to="/login" class="inline-flex rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">
                    เข้าสู่ระบบเพื่อส่งคำขอ
                  </NuxtLink>
                </div>

                <div v-else-if="codeAccessStatus === 'pending'" class="mt-3 rounded-lg border border-amber-200 bg-white p-3">
                  <p class="text-xs font-semibold text-amber-800">คำขอของคุณอยู่ระหว่างรออนุมัติ</p>
                  <p v-if="latestCodeRequest?.project_name" class="mt-1 text-xs text-gray-600">โปรเจกต์: {{ latestCodeRequest.project_name }}</p>
                  <p class="mt-1 text-xs text-gray-500">ผู้ดูแลระบบจะตรวจสอบและแจ้งผลทางอีเมลหรือระบบแจ้งเตือน</p>
                </div>

                <div v-else-if="codeAccessStatus === 'rejected'" class="mt-3 rounded-lg border border-rose-200 bg-white p-3">
                  <p class="text-xs font-semibold text-rose-700">คำขอล่าสุดถูกปฏิเสธ</p>
                  <p class="mt-1 text-xs text-gray-600">คุณสามารถส่งคำขอใหม่พร้อมรายละเอียดที่ชัดเจนขึ้นได้</p>
                  <button type="button" class="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700" @click="showRequestForm = true">
                    ส่งคำขอใหม่
                  </button>
                </div>

                <div v-else-if="codeAccessStatus === 'none'" class="mt-3">
                  <button type="button" class="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700" @click="showRequestForm = true">
                    ขอรับโค้ดติดตั้ง
                  </button>
                </div>

                <form v-if="showRequestForm && codeAccessStatus !== 'pending' && codeAccessStatus !== 'unauthenticated'" class="mt-4 space-y-3" @submit.prevent="submitCodeRequest">
                  <label class="block space-y-1 text-xs">
                    <span class="font-medium text-gray-700">ชื่อโปรเจกต์ / เว็บไซต์ที่จะใช้ *</span>
                    <input v-model="requestForm.projectName" required type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder="เช่น เว็บคณะวิศวกรรมศาสตร์" />
                  </label>
                  <label class="block space-y-1 text-xs">
                    <span class="font-medium text-gray-700">URL เว็บไซต์ (ถ้ามี)</span>
                    <input v-model="requestForm.websiteUrl" type="url" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder="https://example.ubu.ac.th" />
                  </label>
                  <label class="block space-y-1 text-xs">
                    <span class="font-medium text-gray-700">ประเภทการใช้งาน *</span>
                    <select v-model="requestForm.usageType" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                      <option value="">เลือกประเภท</option>
                      <option value="เว็บหน่วยงาน">เว็บหน่วยงาน / คณะ</option>
                      <option value="การเรียนการสอน">การเรียนการสอน</option>
                      <option value="งานวิจัย">งานวิจัย / โปรเจกต์</option>
                      <option value="บริการประชาชน">บริการประชาชน / FAQ</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </label>
                  <label class="block space-y-1 text-xs">
                    <span class="font-medium text-gray-700">จะนำไปใช้อย่างไร? *</span>
                    <textarea v-model="requestForm.purpose" required rows="4" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder="อธิบายว่าจะใช้ chatbot ตอบคำถามอะไร ใครเป็นผู้ใช้งาน และจะติดตั้งที่ไหน..." />
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <button type="submit" :disabled="submittingRequest" class="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
                      {{ submittingRequest ? 'กำลังส่ง...' : 'ส่งคำขอ' }}
                    </button>
                    <button type="button" class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200" @click="showRequestForm = false">
                      ยกเลิก
                    </button>
                  </div>
                  <p v-if="requestError" class="text-xs text-rose-600">{{ requestError }}</p>
                </form>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-6" :class="hasCodeAccess ? 'xl:grid-cols-[1fr_1fr]' : ''">
        <article ref="previewSectionRef" class="rounded-2xl border border-gray-200 bg-white p-5" :class="activeGuideStep === 'preview' ? 'ring-2 ring-amber-300' : ''">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Step 4 · Popup Preview (Realtime)</h2>
              <p class="mt-1 text-sm text-gray-600">แก้ค่าด้านบนแล้ว preview เปลี่ยนทันที</p>
            </div>
            <button class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200" @click="chatOpen = !chatOpen">{{ chatOpen ? 'ปิด popup' : 'แสดง popup' }}</button>
          </div>

          <div class="relative mt-4 h-[470px] overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white p-4">
            <div class="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow">Sandbox</div>

            <button
              v-if="!chatOpen"
              class="absolute bottom-4 right-4 rounded-full bg-transparent p-0 drop-shadow-lg transition-transform duration-200 hover:scale-105"
              @click="chatOpen = true"
              aria-label="เปิดแชทบอท"
            >
              <img :src="currentMascotImage" alt="mascot" class="h-14 w-14 animate-bounce object-contain" />
            </button>

            <div v-else class="absolute bottom-4 right-4 flex h-[400px] w-[320px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div class="flex items-center justify-between px-3 py-2 text-white" :style="{ backgroundColor: config.headerColor }">
                <div class="flex items-center gap-2">
                  <img :src="currentMascotImage" alt="mascot" class="h-8 w-8 rounded-full bg-white object-cover p-0.5" />
                  <div>
                    <p class="text-xs font-semibold">{{ config.botName }}</p>
                    <p class="text-[10px] opacity-90">{{ lastExpression }}</p>
                  </div>
                </div>
                <button class="rounded p-1 text-xs hover:bg-black/20" @click="chatOpen = false">x</button>
              </div>

              <div class="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3">
                <div class="flex gap-2">
                  <img :src="expressionImages.welcome" alt="welcome" class="h-8 w-8 rounded-full object-cover" />
                  <div class="max-w-[82%] rounded-xl rounded-tl-none bg-white px-3 py-2 text-xs text-gray-800 shadow-sm" v-html="parseMarkdownLinks(config.welcomeMessage)" />
                </div>
                <div v-for="(msg, idx) in messages" :key="idx" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                  <div class="flex items-start gap-2" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
                    <img v-if="msg.role === 'assistant'" :src="currentMascotImage" alt="assistant" class="h-8 w-8 rounded-full object-cover" />
                    <div
                    class="max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-sm"
                    :class="msg.role === 'user' ? 'text-white' : 'bg-white text-gray-800'"
                    :style="msg.role === 'user' ? { backgroundColor: config.headerColor } : undefined"
                  >
                    <span v-if="msg.role === 'user'">{{ msg.content }}</span>
                    <span v-else v-html="parseMarkdownLinks(msg.content)" />
                  </div>
                  </div>
                </div>
                <div v-if="sending" class="flex justify-start">
                  <div class="flex items-start gap-2">
                    <img :src="expressionImages.thinking" alt="assistant-loading" class="h-8 w-8 rounded-full object-cover" />
                    <div class="rounded-xl bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                      <span class="inline-flex items-center gap-1">
                        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]"></span>
                        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]"></span>
                        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></span>
                        <span class="ml-1 text-[11px] text-gray-500">กำลังพิมพ์...</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <form class="flex gap-2 border-t border-gray-100 p-2" @submit.prevent="sendChat">
                <input v-model="inputMessage" :disabled="sending" placeholder="พิมพ์ข้อความ..." class="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400" />
                <button
                  type="submit"
                  :disabled="sending || !inputMessage.trim()"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white/80 disabled:shadow-none"
                  :style="!sending && inputMessage.trim() ? { backgroundColor: config.headerColor } : undefined"
                  aria-label="ส่งข้อความ"
                >
                  <svg
                    v-if="!sending"
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </article>

        <article v-if="hasCodeAccess" class="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="text-lg font-semibold text-gray-900">Live JSON Inspector</h2>
          <p class="mt-1 text-sm text-gray-600">ปรับค่าแล้วลองส่งแชทได้ทันที ถ้าต้องการทดสอบแบบ payload ให้วาง JSON ตรงนี้ได้เลย</p>
          <textarea v-model="payloadText" rows="8" class="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          <div class="mt-3 flex flex-wrap gap-2">
            <button class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700" @click="applyPayload">Apply JSON</button>
            <button class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200" @click="copyPayload">Copy JSON</button>
            <button class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700" @click="fillSample">เติมค่าพร้อมเทส</button>
            <span class="self-center text-xs text-gray-500">{{ statusText }}</span>
          </div>
        </article>
      </section>

      <section v-if="hasCodeAccess" ref="flowSectionRef" class="rounded-2xl border border-gray-200 bg-white p-5 md:p-6" :class="activeGuideStep === 'flow' ? 'ring-2 ring-amber-300' : ''">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">ตัวอย่าง n8n Flow (Demo)</h2>
            <p class="text-sm text-gray-600">ไฟล์ demo สำหรับนำไป import ใน n8n แล้วแก้ credentials / knowledge base ตามหน่วยงานของคุณ</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200" @click="copyFlowExample">Copy flow JSON</button>
            <button class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700" @click="downloadFlowExample">Download .json</button>
          </div>
        </div>
        <pre class="mt-4 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs">{{ n8nFlowExample }}</pre>
      </section>

      <section v-if="hasCodeAccess" ref="installSectionRef" class="rounded-2xl border border-gray-200 bg-white p-5 md:p-6" :class="activeGuideStep === 'install' ? 'ring-2 ring-amber-300' : ''">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">วิธีนำไปปลั๊กกับเว็บ</h2>
            <p class="text-sm text-gray-600">เลือกสแต็กที่ใช้ แล้วทำตามขั้นตอนแบบจับมือทำได้ทันที</p>
          </div>
          <button class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200" @click="copyInstallSnippet">Copy code</button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="tab in installTabs"
            :key="tab.id"
            class="rounded-lg px-3 py-1.5 text-xs font-semibold"
            :class="activeInstallTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="activeInstallTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">ต้องใส่ตรงไหนในเว็บปลายทาง</p>
          <div class="mt-2 space-y-1 text-xs text-amber-900">
            <p><strong>`headerColor`</strong> -> ใช้เป็นสีพื้นหลังหัวกล่องแชท (chat header)</p>
            <p><strong>`welcomeMessage`</strong> -> ข้อความแรกที่แสดงตอนเปิด popup</p>
            <p><strong>`mascotImages`</strong> -> map รูปตามท่าทาง `happy/thinking/searching/sorry/welcome`</p>
            <p><strong>`webhookUrl`</strong> -> endpoint n8n สำหรับส่งข้อความ</p>
          </div>
        </div>

        <div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-600">ขั้นตอนจับมือทำ ({{ activeInstallLabel }})</p>
          <ol class="mt-2 list-decimal space-y-1 pl-5 text-xs text-gray-700">
            <li v-for="(step, index) in activeInstallSteps" :key="index">{{ step }}</li>
          </ol>
        </div>

        <pre class="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs">{{ activeInstallSnippet }}</pre>
      </section>
    </div>

    <Transition name="fade">
      <div
        v-if="copyToast.show"
        class="fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-2xl"
      >
        {{ copyToast.message }}
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showMascotPosterModal"
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
        @click.self="showMascotPosterModal = false"
      >
        <div class="w-full max-w-3xl rounded-2xl bg-white p-3 shadow-2xl md:p-4">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-800">BuaBan Mascot Poster</h4>
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              @click="showMascotPosterModal = false"
            >
              ปิด
            </button>
          </div>
          <img :src="mascotPosterImage" alt="UBU BuaBan Poster full size" class="max-h-[78vh] w-full rounded-xl object-contain" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useHead, useRuntimeConfig } from "nuxt/app"

type Payload = { mascot: string; expression: string; answer: string; source: string }
type Message = { role: "user" | "assistant"; content: string }
type ExpressionKey = "happy" | "thinking" | "searching" | "sorry" | "welcome"
type CodeAccessStatus = "loading" | "unauthenticated" | "none" | "pending" | "approved" | "rejected"
type CodeRequest = {
  id?: number
  project_name?: string
  website_url?: string
  purpose?: string
  usage_type?: string
  status?: string
}

useHead({
  title: "Chatbot Popup Sandbox - UBU AI SERVICE",
  meta: [{ name: "description", content: "ทดสอบ popup chatbot โดยใส่ webhook n8n และมาสคอตของตัวเอง" }]
})

const base = (useRuntimeConfig().public as any).basePath || "/"
const apiBase = useRuntimeConfig().public.apiBase as string
const buildApiPath = (endpoint: string) => apiBase.endsWith("/api") || apiBase === "/api" ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`
const chatOpen = ref(true)
const sending = ref(false)
const inputMessage = ref("")
const statusText = ref("พร้อมทดสอบ")
const lastExpression = ref<ExpressionKey>("welcome")
const activeGuideStep = ref<"webhook" | "profile" | "color" | "expression" | "preview" | "flow" | "install" | null>(null)
const flowFilePath = "/examples/chatbot-demo-flow.json"
const n8nFlowExample = ref("กำลังโหลดไฟล์ flow...")
const webhookInputRef = ref<HTMLInputElement | null>(null)
const botNameInputRef = ref<HTMLInputElement | null>(null)
const welcomeInputRef = ref<HTMLTextAreaElement | null>(null)
const colorSectionRef = ref<HTMLElement | null>(null)
const expressionSectionRef = ref<HTMLElement | null>(null)
const previewSectionRef = ref<HTMLElement | null>(null)
const flowSectionRef = ref<HTMLElement | null>(null)
const installSectionRef = ref<HTMLElement | null>(null)
const requestPanelRef = ref<HTMLElement | null>(null)
const codeAccessStatus = ref<CodeAccessStatus>("loading")
const latestCodeRequest = ref<CodeRequest | null>(null)
const showRequestForm = ref(false)
const submittingRequest = ref(false)
const requestError = ref("")
const requestForm = ref({
  projectName: "",
  websiteUrl: "",
  usageType: "",
  purpose: ""
})
const hasCodeAccess = computed(() => codeAccessStatus.value === "approved")

const config = ref({
  webhookUrl: "https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat",
  botName: "น้องบัวบาน",
  mascotName: "บัวบาน",
  welcomeMessage: "น้องบัวบาน ยินดีต้อนรับ 🥰",
  headerColor: "#FFBF00"
})

const presetHeaderColors = ["#4f46e5", "#0ea5e9", "#16a34a", "#f97316", "#e11d48", "#111827"]
const expressionRules: Array<{ key: ExpressionKey; description: string }> = [
  { key: "happy", description: "ใช้เมื่อหาข้อมูลพบ (Success) หรือแนะนำเรื่องสนุกๆ" },
  { key: "thinking", description: "ใช้เมื่อกำลังวิเคราะห์คำถามที่ซับซ้อน" },
  { key: "searching", description: "ใช้เมื่อหาในไฟล์ไม่เจอและกำลังจะไปหาใน Google/Web" },
  { key: "sorry", description: "ใช้เมื่อหาข้อมูลไม่เจอจริงๆ หรือต้องแนะนำให้ไปหาเจ้าหน้าที่" },
  { key: "welcome", description: "ใช้ทักทายตอนเริ่มแชท" }
]

const expressionImages = ref<Record<ExpressionKey, string>>({
  happy: `${base}mascots/happy.svg`,
  thinking: `${base}mascots/thinking.svg`,
  searching: `${base}mascots/BuaBan.svg`,
  sorry: `${base}mascots/sorry.svg`,
  welcome: `${base}mascots/welcome.svg`
})

const payload: Payload = {
  mascot: "บัวบาน",
  expression: "happy",
  answer: "สวัสดีครับ นี่คือข้อความตัวอย่างจาก n8n",
  source: "https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat"
}
const payloadText = ref(JSON.stringify(payload, null, 2))

const schemaText = JSON.stringify(
  {
    mascot: "Ubie",
    expression: "ชื่อท่าทาง",
    answer: "เนื้อหาคำตอบของคุณ... รองรับลิงก์แบบ [ข้อความ](https://example.com)",
    source: "ชื่อไฟล์หรือ URL"
  },
  null,
  2
)

const messages = ref<Message[]>([])
const activeInstallTab = ref<"html" | "node" | "php">("html")

const installTabs = [
  { id: "html", label: "HTML/Vanilla JS" },
  { id: "node", label: "Node.js (Express)" },
  { id: "php", label: "PHP (cURL)" }
] as const

const installSnippets = computed<Record<"html" | "node" | "php", string>>(() => ({
  html: `<!-- วางโค้ดนี้ก่อน </body> ในไฟล์หน้าเว็บของคุณ (UI เดียวกับ Chatbot Sandbox) -->
<style>
  #ubu-chatbot { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  #ubu-chatbot .panel { position: fixed; right: 16px; bottom: 16px; width: 320px; height: 400px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,.15); display: flex; flex-direction: column; overflow: hidden; }
  #ubu-chatbot .header { color: #fff; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
  #ubu-chatbot .header-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
  #ubu-chatbot .header-avatar { width: 32px; height: 32px; border-radius: 999px; object-fit: cover; background: #fff; padding: 2px; flex: 0 0 auto; }
  #ubu-chatbot .header-name { font-size: 12px; font-weight: 600; line-height: 1.2; }
  #ubu-chatbot .header-expression { font-size: 10px; opacity: .9; line-height: 1.2; }
  #ubu-chatbot .header-close { background: transparent; border: 0; color: #fff; cursor: pointer; border-radius: 4px; padding: 2px 6px; font-size: 12px; }
  #ubu-chatbot .header-close:hover { background: rgba(0,0,0,.2); }
  #ubu-chatbot .body { flex: 1; overflow-y: auto; background: #f9fafb; padding: 12px; }
  #ubu-chatbot .welcome-row, #ubu-chatbot .msg-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
  #ubu-chatbot .msg-row.user { justify-content: flex-end; flex-direction: row-reverse; }
  #ubu-chatbot .msg-avatar { width: 32px; height: 32px; border-radius: 999px; object-fit: cover; flex: 0 0 auto; }
  #ubu-chatbot .bubble { max-width: 85%; padding: 8px 12px; border-radius: 12px; font-size: 12px; line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,.06); word-break: break-word; }
  #ubu-chatbot .bubble.bot { background: #fff; color: #1f2937; border-top-left-radius: 4px; }
  #ubu-chatbot .bubble.welcome { background: #fff; color: #1f2937; border-top-left-radius: 4px; max-width: 82%; }
  #ubu-chatbot .bubble.user { color: #fff; }
  #ubu-chatbot .bubble a { color: #0066cc; text-decoration: underline; font-weight: 600; }
  #ubu-chatbot .loading-dots { display: inline-flex; align-items: center; gap: 4px; }
  #ubu-chatbot .loading-dots span { width: 6px; height: 6px; border-radius: 999px; background: #9ca3af; animation: ubu-dot-bounce 1.2s infinite; }
  #ubu-chatbot .loading-dots span:nth-child(2) { animation-delay: .1s; }
  #ubu-chatbot .loading-dots span:nth-child(3) { animation-delay: .2s; }
  #ubu-chatbot .input { border-top: 1px solid #f3f4f6; padding: 8px; display: flex; gap: 8px; background: #fff; }
  #ubu-chatbot .input input { flex: 1; min-width: 0; border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 8px; font-size: 12px; outline: none; }
  #ubu-chatbot .input input:focus { border-color: #6366f1; }
  #ubu-chatbot .input input:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
  #ubu-chatbot .input button { border: 0; width: 32px; height: 32px; border-radius: 999px; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; flex: 0 0 auto; }
  #ubu-chatbot .input button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,.14); }
  #ubu-chatbot .input button:disabled { background: #d1d5db !important; cursor: not-allowed; box-shadow: none; transform: none; }
  #ubu-chatbot .input button svg { width: 16px; height: 16px; }
  #ubu-chatbot .launcher-wrap { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; }
  #ubu-chatbot .mascot-btn { border: 0; background: transparent; cursor: pointer; padding: 0; animation: ubu-bounce 2s infinite; filter: drop-shadow(0 10px 15px rgba(0,0,0,.15)); }
  #ubu-chatbot .mascot-btn:hover { animation-play-state: paused; transform: scale(1.05); }
  #ubu-chatbot .mascot-img { width: 56px; height: 56px; object-fit: contain; }
  @keyframes ubu-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes ubu-dot-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }
</style>

<div id="ubu-chatbot">
  <div id="ubu-chatbot-launcher" class="launcher-wrap" style="display:none;">
    <button id="ubu-chatbot-fab" class="mascot-btn" aria-label="เปิดแชทบอท">
      <img id="ubu-chatbot-launcher-img" class="mascot-img" src="${expressionImages.value.welcome}" alt="${config.value.mascotName}" />
    </button>
  </div>
  <div id="ubu-chatbot-panel" class="panel" style="display:flex;">
    <div id="ubu-chatbot-header" class="header">
      <div class="header-left">
        <img id="ubu-chatbot-header-img" class="header-avatar" src="${expressionImages.value.welcome}" alt="mascot" />
        <div>
          <div id="ubu-chatbot-header-name" class="header-name">${config.value.botName}</div>
          <div id="ubu-chatbot-header-expression" class="header-expression">welcome</div>
        </div>
      </div>
      <button id="ubu-chatbot-close" class="header-close" type="button" aria-label="ปิดแชท">x</button>
    </div>
    <div id="ubu-chatbot-body" class="body"></div>
    <form id="ubu-chatbot-form" class="input">
      <input id="ubu-chatbot-input" placeholder="พิมพ์ข้อความ..." autocomplete="off" />
      <button id="ubu-chatbot-send" type="submit" aria-label="ส่งข้อความ">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
      </button>
    </form>
  </div>
</div>

<script>
const BOT_CONFIG = {
  webhookUrl: "${config.value.webhookUrl}",
  botName: "${config.value.botName.replace(/"/g, '\\"')}",
  headerColor: "${config.value.headerColor}",
  welcomeMessage: "${config.value.welcomeMessage.replace(/"/g, '\\"')}",
  mascotName: "${config.value.mascotName.replace(/"/g, '\\"')}",
  mascotImages: {
    happy: "${expressionImages.value.happy}",
    thinking: "${expressionImages.value.thinking}",
    searching: "${expressionImages.value.searching}",
    sorry: "${expressionImages.value.sorry}",
    welcome: "${expressionImages.value.welcome}"
  }
};

const panel = document.getElementById("ubu-chatbot-panel");
const launcher = document.getElementById("ubu-chatbot-launcher");
const launcherImg = document.getElementById("ubu-chatbot-launcher-img");
const headerImg = document.getElementById("ubu-chatbot-header-img");
const headerExpression = document.getElementById("ubu-chatbot-header-expression");
const closeBtn = document.getElementById("ubu-chatbot-close");
const header = document.getElementById("ubu-chatbot-header");
const body = document.getElementById("ubu-chatbot-body");
const form = document.getElementById("ubu-chatbot-form");
const input = document.getElementById("ubu-chatbot-input");
const sendBtn = document.getElementById("ubu-chatbot-send");
let currentExpression = "welcome";

header.style.background = BOT_CONFIG.headerColor;
sendBtn.style.background = BOT_CONFIG.headerColor;

function setExpression(expression) {
  const allowed = ["happy", "thinking", "searching", "sorry", "welcome"];
  const exp = allowed.includes(String(expression || "").toLowerCase()) ? String(expression).toLowerCase() : "sorry";
  currentExpression = exp;
  const img = BOT_CONFIG.mascotImages[exp] || BOT_CONFIG.mascotImages.welcome;
  headerImg.src = img;
  launcherImg.src = img;
  headerExpression.textContent = exp;
}

function parseMarkdownLinks(text) {
  let safeText = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const markdownLinkRegex = /\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g;
  safeText = safeText.replace(markdownLinkRegex, (_, linkText, url) =>
    \`<a href="\${url}" target="_blank" rel="noopener noreferrer">\${linkText}</a>\`
  );
  safeText = safeText.replace(/(^|[\\s(])((https?:\\/\\/)[^\\s<]+)/g, (_, prefix, url) =>
    \`\${prefix}<a href="\${url}" target="_blank" rel="noopener noreferrer">\${url}</a>\`
  );
  return safeText;
}

function renderWelcome() {
  const row = document.createElement("div");
  row.className = "welcome-row";
  const avatar = document.createElement("img");
  avatar.className = "msg-avatar";
  avatar.src = BOT_CONFIG.mascotImages.welcome;
  avatar.alt = "welcome";
  const bubble = document.createElement("div");
  bubble.className = "bubble welcome";
  bubble.innerHTML = parseMarkdownLinks(BOT_CONFIG.welcomeMessage);
  row.appendChild(avatar);
  row.appendChild(bubble);
  body.appendChild(row);
}

function addMsg(text, who, expression) {
  const row = document.createElement("div");
  row.className = "msg-row " + who;
  if (who === "bot") {
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = BOT_CONFIG.mascotImages[expression] || BOT_CONFIG.mascotImages.welcome;
    avatar.alt = "bot";
    row.appendChild(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble " + who;
  if (who === "user") {
    bubble.style.background = BOT_CONFIG.headerColor;
    bubble.textContent = text;
  } else {
    bubble.innerHTML = parseMarkdownLinks(text);
  }
  row.appendChild(bubble);
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  input.disabled = isLoading;
  if (isLoading) {
    window.__ubuLoading = document.createElement("div");
    window.__ubuLoading.className = "msg-row bot";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = BOT_CONFIG.mascotImages.thinking || BOT_CONFIG.mascotImages.welcome;
    avatar.alt = "bot-loading";
    const bubble = document.createElement("div");
    bubble.className = "bubble bot";
    bubble.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span><span style="margin-left:6px;color:#6b7280;font-size:11px;">กำลังพิมพ์...</span>';
    window.__ubuLoading.appendChild(avatar);
    window.__ubuLoading.appendChild(bubble);
    body.appendChild(window.__ubuLoading);
    body.scrollTop = body.scrollHeight;
    setExpression("thinking");
  } else if (window.__ubuLoading) {
    window.__ubuLoading.remove();
    window.__ubuLoading = null;
  }
}

function extractAnswer(data) {
  const stripCodeFence = (text) => {
    const trimmed = String(text || "").trim();
    const match = trimmed.match(/^\\\`\\\`\\\`(?:json)?\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\`$/i);
    return match ? match[1].trim() : trimmed;
  };
  const parseMaybeJsonString = (value) => {
    if (typeof value !== "string") return value;
    const trimmed = stripCodeFence(value);
    if (!trimmed) return value;
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try { return JSON.parse(trimmed); } catch { return value; }
    }
    return value;
  };
  const level1 = parseMaybeJsonString(data);
  const outputParsed = parseMaybeJsonString(level1?.output);
  const candidate = typeof outputParsed === "object" && outputParsed !== null ? outputParsed : level1;
  let answerCandidate = candidate?.answer ?? candidate?.message ?? candidate?.text ?? candidate?.response ?? (typeof candidate?.output === "string" ? candidate.output : "") ?? "";
  if (typeof answerCandidate === "string") {
    const cleaned = stripCodeFence(answerCandidate);
    const parsedNested = parseMaybeJsonString(cleaned);
    if (typeof parsedNested === "object" && parsedNested !== null) {
      answerCandidate = parsedNested.answer ?? parsedNested.message ?? parsedNested.text ?? cleaned;
    } else {
      answerCandidate = cleaned;
    }
  }
  return {
    mascot: String(candidate?.mascot || level1?.mascot || BOT_CONFIG.mascotName || "Ubie"),
    expression: String(candidate?.expression || level1?.expression || "sorry"),
    answer: String(answerCandidate || "ไม่มีคำตอบจาก webhook"),
    source: String(candidate?.source || level1?.source || BOT_CONFIG.webhookUrl)
  };
}

async function askBot(message) {
  const res = await fetch(BOT_CONFIG.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: message, message, mascot: BOT_CONFIG.mascotName, mode: "build" })
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  return extractAnswer(data);
}

document.getElementById("ubu-chatbot-fab").onclick = () => {
  panel.style.display = "flex";
  launcher.style.display = "none";
};
closeBtn.onclick = () => {
  panel.style.display = "none";
  launcher.style.display = "block";
};

if (!body.dataset.welcomeShown) {
  renderWelcome();
  setExpression("welcome");
  body.dataset.welcomeShown = "1";
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message || input.disabled) return;
  input.value = "";
  addMsg(message, "user");
  setLoading(true);
  try {
    const bot = await askBot(message);
    setLoading(false);
    setExpression(bot.expression);
    addMsg(bot.answer, "bot", bot.expression);
  } catch (err) {
    setLoading(false);
    setExpression("sorry");
    addMsg("เชื่อมต่อ webhook ไม่สำเร็จ กรุณาตรวจสอบ URL หรือ CORS", "bot", "sorry");
  }
};
<\/script>`,
  node: `import express from "express";
import fetch from "node-fetch";
const app = express();
app.use(express.json());

const BOT_CONFIG = {
  webhookUrl: "${config.value.webhookUrl}",
  headerColor: "${config.value.headerColor}",
  welcomeMessage: "${config.value.welcomeMessage.replace(/"/g, '\\"')}"
};

app.post("/chat", async (req, res) => {
  const r = await fetch(BOT_CONFIG.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: req.body.message, message: req.body.message })
  });
  const data = await r.json();
  res.json(data);
});`,
  php: `<?php
$BOT_CONFIG = [
  "webhookUrl" => "${config.value.webhookUrl}",
  "headerColor" => "${config.value.headerColor}",
  "welcomeMessage" => "${config.value.welcomeMessage.replace(/"/g, '\\"')}"
];

$webhook = $BOT_CONFIG["webhookUrl"];
$payload = json_encode([
  "chatInput" => $_POST["message"] ?? "สวัสดี",
  "message" => $_POST["message"] ?? "สวัสดี"
]);
$ch = curl_init($webhook);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
  CURLOPT_POSTFIELDS => $payload
]);
$result = curl_exec($ch);
curl_close($ch);
header("Content-Type: application/json");
echo $result;
?>`
}))

const activeInstallSnippet = computed(() => installSnippets.value[activeInstallTab.value])
const activeInstallLabel = computed(() => installTabs.find((tab) => tab.id === activeInstallTab.value)?.label || "")
const activeInstallSteps = computed(() => {
  if (activeInstallTab.value === "html") {
    return [
      "เปิดไฟล์หน้าเว็บหลัก เช่น index.html หรือไฟล์ layout หลัก",
      "วางโค้ดทั้งก้อนจากด้านล่างก่อนแท็กปิด </body>",
      "บันทึกไฟล์และรีโหลดหน้าเว็บ",
      "โหลดหน้าเว็บแล้วแชทจะเปิดทันที ถ้าปิดไปให้กดมาสคอตมุมขวาล่างเพื่อเปิดใหม่"
    ]
  }
  if (activeInstallTab.value === "node") {
    return [
      "เปิดไฟล์ backend เช่น app.js / server.js",
      "วางโค้ดตัวอย่างให้เกิด endpoint /chat",
      "ติดตั้งแพ็กเกจที่จำเป็น (express, node-fetch) และรีสตาร์ตเซิร์ฟเวอร์",
      "ให้ frontend เรียก endpoint /chat ของเว็บตัวเอง"
    ]
  }
  return [
    "สร้างไฟล์ใหม่ เช่น chatbot-proxy.php",
    "วางโค้ดตัวอย่างลงไฟล์และบันทึก",
    "เรียกไฟล์นี้จากหน้าเว็บด้วย fetch หรือ form POST",
    "ทดสอบว่าคืน JSON ได้ก่อนเชื่อมกับ UI popup"
  ]
})
const copyToast = ref({ show: false, message: "" })
let copyToastTimer: ReturnType<typeof setTimeout> | null = null
const mascotPosterImage = `${base}mascots/UBU_BuaBan.png`
const showMascotPosterModal = ref(false)

const currentMascotImage = computed(() => {
  return expressionImages.value[lastExpression.value] || expressionImages.value.happy
})

function parseMarkdownLinks(text: string): string {
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

  return safeText.replace(markdownLinkRegex, (_match, linkText: string, url: string) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline; font-weight: bold;">${linkText}</a>`
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("file-read-failed"))
    reader.readAsDataURL(file)
  })
}

async function onExpressionUpload(key: ExpressionKey, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const image = await readFileAsDataUrl(file)
    expressionImages.value[key] = image
    statusText.value = `อัปโหลดรูปท่า ${key} แล้ว`
  } catch {
    statusText.value = "อัปโหลดรูปไม่สำเร็จ"
  }
}

function downloadMascotPack() {
  if (!hasCodeAccess.value) {
    openRequestPanel()
    return
  }
  const mascotFiles = [
    "BuaBan.svg",
    "happy.svg",
    "thinking.svg",
    "searching.svg",
    "sorry.svg",
    "welcome.svg",
    "UBU_BuaBan.png"
  ]
  for (const filename of mascotFiles) {
    const link = document.createElement("a")
    link.href = `${base}mascots/${filename}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
  statusText.value = "เริ่มดาวน์โหลดชุดมาสคอตแล้ว"
}

function openRequestPanel() {
  showRequestForm.value = codeAccessStatus.value === "none" || codeAccessStatus.value === "rejected"
  requestPanelRef.value?.scrollIntoView({ behavior: "smooth", block: "center" })
}

async function fetchCodeAccess() {
  codeAccessStatus.value = "loading"
  try {
    const data = await $fetch(buildApiPath("chatbot/code-access"), { credentials: "include" }) as {
      access?: boolean
      status?: CodeAccessStatus
      request?: CodeRequest
    }
    latestCodeRequest.value = data.request || null
    if (data.access) {
      codeAccessStatus.value = "approved"
      return
    }
    codeAccessStatus.value = data.status || "none"
  } catch (error: any) {
    const statusCode = error?.status || error?.statusCode
    if (statusCode === 401) {
      codeAccessStatus.value = "unauthenticated"
    } else {
      codeAccessStatus.value = "none"
    }
  }
}

async function submitCodeRequest() {
  requestError.value = ""
  submittingRequest.value = true
  try {
    await $fetch(buildApiPath("chatbot/code-request"), {
      method: "POST",
      credentials: "include",
      body: {
        projectName: requestForm.value.projectName,
        websiteUrl: requestForm.value.websiteUrl,
        purpose: requestForm.value.purpose,
        usageType: requestForm.value.usageType
      }
    })
    showRequestForm.value = false
    codeAccessStatus.value = "pending"
    statusText.value = "ส่งคำขอรับโค้ดแล้ว รอผู้ดูแลอนุมัติ"
    copyToast.value = { show: true, message: "ส่งคำขอเรียบร้อย" }
    if (copyToastTimer) clearTimeout(copyToastTimer)
    copyToastTimer = setTimeout(() => {
      copyToast.value = { show: false, message: "" }
    }, 1800)
    await fetchCodeAccess()
  } catch (error: any) {
    requestError.value = error?.data?.message || error?.data?.error || "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่"
  } finally {
    submittingRequest.value = false
  }
}

function openMascotPosterModal() {
  showMascotPosterModal.value = true
}

function fillSample() {
  payloadText.value = JSON.stringify(
    {
      mascot: config.value.mascotName || "MyMascot",
      expression: "happy",
      answer: "ข้อความทดสอบจาก payload editor",
      source: config.value.webhookUrl
    },
    null,
    2
  )
}

function applyPayload() {
  try {
    const parsed = JSON.parse(payloadText.value)
    if (!parsed.answer) throw new Error("invalid")
    messages.value.push({ role: "assistant", content: String(parsed.answer) })
    const exp = String(parsed.expression || "happy").toLowerCase() as ExpressionKey
    lastExpression.value = expressionRules.some((r) => r.key === exp) ? exp : "sorry"
    statusText.value = "Apply สำเร็จ"
  } catch {
    statusText.value = "JSON ไม่ถูกต้อง"
  }
}

function extractAnswer(data: any): Payload {
  const stripCodeFence = (text: string): string => {
    const trimmed = text.trim()
    const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
    return match ? match[1].trim() : trimmed
  }

  const parseMaybeJsonString = (value: unknown): any => {
    if (typeof value !== "string") return value
    const trimmed = stripCodeFence(value)
    if (!trimmed) return value
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return JSON.parse(trimmed)
      } catch {
        return value
      }
    }
    return value
  }

  const level1 = parseMaybeJsonString(data)
  const outputParsed = parseMaybeJsonString(level1?.output)
  const candidate = typeof outputParsed === "object" && outputParsed !== null ? outputParsed : level1

  let answerCandidate =
    candidate?.answer ??
    candidate?.message ??
    candidate?.text ??
    candidate?.response ??
    (typeof candidate?.output === "string" ? candidate.output : "") ??
    ""

  if (typeof answerCandidate === "string") {
    const cleaned = stripCodeFence(answerCandidate)
    const parsedNested = parseMaybeJsonString(cleaned)
    if (typeof parsedNested === "object" && parsedNested !== null) {
      answerCandidate = parsedNested.answer ?? parsedNested.message ?? parsedNested.text ?? cleaned
    } else {
      answerCandidate = cleaned
    }
  }

  return {
    mascot: String(candidate?.mascot || level1?.mascot || config.value.mascotName || "บัวบาน"),
    expression: String(candidate?.expression || level1?.expression || "sorry"),
    answer: String(answerCandidate || "ไม่มีคำตอบจาก webhook"),
    source: String(candidate?.source || level1?.source || config.value.webhookUrl)
  }
}

async function sendChat() {
  if (!inputMessage.value.trim() || sending.value) return
  const text = inputMessage.value.trim()
  inputMessage.value = ""
  messages.value.push({ role: "user", content: text })
  lastExpression.value = "thinking"
  sending.value = true
  try {
    const response = await fetch(config.value.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput: text,
        message: text,
        mascot: config.value.mascotName,
        mode: "build"
      })
    })
    if (!response.ok) throw new Error(String(response.status))
    const data = await response.json()
    const parsed = extractAnswer(data)
    const exp = (parsed.expression || "").toLowerCase() as ExpressionKey
    lastExpression.value = expressionRules.some((r) => r.key === exp) ? exp : "sorry"
    messages.value.push({ role: "assistant", content: parsed.answer })
    statusText.value = `ตอบกลับจาก ${parsed.source || "webhook"}`
  } catch {
    messages.value.push({ role: "assistant", content: "เชื่อมต่อ webhook ไม่สำเร็จ กรุณาตรวจสอบ URL หรือ CORS" })
    statusText.value = "Webhook error"
  } finally {
    sending.value = false
  }
}

function resetAll() {
  chatOpen.value = false
  lastExpression.value = "welcome"
  config.value = {
    webhookUrl: "https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat",
    botName: "UBU AI Bot",
    mascotName: "บัวบาน",
    welcomeMessage: "น้องบัวบานแทน",
    headerColor: "#4f46e5"
  }
  expressionImages.value = {
    happy: `${base}mascots/happy.svg`,
    thinking: `${base}mascots/thinking.svg`,
    searching: `${base}mascots/BuaBan.svg`,
    sorry: `${base}mascots/sorry.svg`,
    welcome: `${base}mascots/welcome.svg`
  }
  messages.value = []
  payloadText.value = JSON.stringify(payload, null, 2)
  statusText.value = "รีเซ็ตเรียบร้อย"
}

async function copyText(text: string, success: string) {
  try {
    await navigator.clipboard.writeText(text)
    statusText.value = success
    copyToast.value = { show: true, message: success }
    if (copyToastTimer) clearTimeout(copyToastTimer)
    copyToastTimer = setTimeout(() => {
      copyToast.value = { show: false, message: "" }
    }, 1800)
  } catch {
    statusText.value = "คัดลอกไม่สำเร็จ"
    copyToast.value = { show: true, message: "คัดลอกไม่สำเร็จ" }
  }
}
function copyPayload() { copyText(payloadText.value, "คัดลอก JSON แล้ว") }
function copyInstallSnippet() { copyText(activeInstallSnippet.value, "คัดลอกโค้ดติดตั้งแล้ว") }
function copyFlowExample() { copyText(n8nFlowExample.value, "คัดลอก n8n flow แล้ว") }
function focusBlock(el: HTMLElement | null) {
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "center" })
}
function goToGuideStep(step: "webhook" | "profile" | "color" | "expression" | "preview" | "flow" | "install") {
  if ((step === "flow" || step === "install") && !hasCodeAccess.value) {
    openRequestPanel()
    return
  }
  activeGuideStep.value = step
  if (step === "webhook") {
    webhookInputRef.value?.scrollIntoView({ behavior: "smooth", block: "center" })
    webhookInputRef.value?.focus()
  } else if (step === "profile") {
    botNameInputRef.value?.scrollIntoView({ behavior: "smooth", block: "center" })
    botNameInputRef.value?.focus()
    welcomeInputRef.value?.focus()
  } else if (step === "color") {
    focusBlock(colorSectionRef.value)
  } else if (step === "expression") {
    focusBlock(expressionSectionRef.value)
  } else if (step === "preview") {
    chatOpen.value = true
    focusBlock(previewSectionRef.value)
  } else if (step === "flow") {
    focusBlock(flowSectionRef.value)
  } else if (step === "install") {
    focusBlock(installSectionRef.value)
  }
  setTimeout(() => {
    activeGuideStep.value = null
  }, 2500)
}

function downloadFlowExample() {
  const blob = new Blob([n8nFlowExample.value], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "chatbot-demo-flow.json"
  a.click()
  URL.revokeObjectURL(url)
  copyToast.value = { show: true, message: "ดาวน์โหลดไฟล์ flow แล้ว" }
}

onMounted(async () => {
  await fetchCodeAccess()
  window.addEventListener("user-login-success", fetchCodeAccess)
  try {
    const response = await fetch(flowFilePath)
    if (!response.ok) throw new Error("flow-load-failed")
    n8nFlowExample.value = await response.text()
  } catch {
    n8nFlowExample.value = "{\n  \"error\": \"โหลดไฟล์ flow ไม่สำเร็จ\"\n}"
  }
})

onUnmounted(() => {
  window.removeEventListener("user-login-success", fetchCodeAccess)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
