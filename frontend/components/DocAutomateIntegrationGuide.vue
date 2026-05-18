<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 shadow-sm p-5 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-semibold">
            Usage Guide · {{ modeLabel }}
          </div>
          <h2 class="mt-3 text-xl font-bold text-gray-900 dark:text-white">
            คู่มือนำ "{{ modeLabel }}" ไปใช้กับเว็บ/ระบบอื่น
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {{ modeDescription }}
          </p>
        </div>
      </div>

      <div class="mt-5 grid sm:grid-cols-2 gap-3">
        <button
          v-for="m in methods"
          :key="m.id"
          type="button"
          @click="method = m.id"
          :class="[
            'text-left rounded-xl border p-4 transition',
            method === m.id
              ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-200 dark:ring-emerald-800'
              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-emerald-300 dark:hover:border-emerald-700'
          ]"
        >
          <div class="flex items-center gap-2">
            <span :class="[
              'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
              method === m.id ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
            ]">{{ m.index }}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ m.title }}</span>
          </div>
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-300">{{ m.subtitle }}</p>
        </button>
      </div>

      <div class="mt-5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 text-xs text-amber-900 dark:text-amber-100">
        <p class="font-semibold text-sm">ตำแหน่งของ n8n Webhook</p>
        <ul class="mt-2 space-y-1 list-disc list-inside leading-relaxed">
          <li><strong>เรียก n8n Webhook:</strong> เก็บ webhook URL ไว้ที่ backend หรือ <code>.env</code> เท่านั้น ห้ามวางใน frontend/browser</li>
          <li><strong>ฟอร์มเอง + Gateway API:</strong> เว็บอื่นเรียก API ของ AI Gateway และ AI Gateway เป็นคนถือ webhook n8n ไว้ฝั่ง server</li>
        </ul>
      </div>
    </div>

    <div v-if="method === 'webhook'" class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">วิธีที่ 1 · เรียก n8n Webhook โดยตรง (Server-to-Server)</h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          เหมาะกับ Backend ของระบบอื่น (PHP/Node/Python/Go) ที่ต้องการเรียก "{{ modeLabel }}" อัตโนมัติ
        </p>
      </div>

      <ol class="space-y-4">
        <li class="flex gap-3">
          <span class="step-bubble">1</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">ขอ Webhook URL จากผู้ดูแลระบบ</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              สำหรับโหมดนี้ใช้ตัวแปร <code class="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded font-semibold">{{ webhookEnv }}</code>
              ห้ามเปิดเผยใน Frontend ให้เก็บไว้ที่ Backend ของคุณเท่านั้น
            </p>
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">2</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">เตรียม Payload ตาม Schema</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              ส่ง JSON ไปที่ webhook ด้วย method <code>POST</code> และ header
              <code>Content-Type: application/json</code>
            </p>
            <CodeSnippet :code="codeWebhookPayload" lang="json" id="wh-payload" :on-copy="copyToClipboard" :copied-id="copiedId" />
            <p v-if="mode === 'submit'" class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              * <code>contentBase64</code> คือเนื้อหาไฟล์ในรูปแบบ base64 (ไม่ต้องมี prefix
              <code>data:image/...;base64,</code>) ขนาดสูงสุด 5MB
            </p>
            <p v-else class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              * <strong>ไม่ต้องส่งไฟล์</strong> ใน payload สำหรับโหมดสำเนาไฟล์ ส่งเพียง metadata ของ actor และ document เท่านั้น
            </p>
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">3</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">เรียก Webhook ด้วยภาษาที่คุณใช้</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="lang in webhookLangs"
                :key="lang.id"
                type="button"
                @click="webhookLang = lang.id"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium border transition',
                  webhookLang === lang.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900/40 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-emerald-400'
                ]"
              >{{ lang.label }}</button>
            </div>

            <CodeSnippet v-if="webhookLang === 'curl'" :code="codeWebhookCurl" lang="bash" id="wh-curl" :on-copy="copyToClipboard" :copied-id="copiedId" />
            <CodeSnippet v-else-if="webhookLang === 'node'" :code="codeWebhookNode" lang="javascript" id="wh-node" :on-copy="copyToClipboard" :copied-id="copiedId" />
            <CodeSnippet v-else-if="webhookLang === 'python'" :code="codeWebhookPython" lang="python" id="wh-py" :on-copy="copyToClipboard" :copied-id="copiedId" />
            <CodeSnippet v-else :code="codeWebhookPhp" lang="php" id="wh-php" :on-copy="copyToClipboard" :copied-id="copiedId" />
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">4</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">อ่าน Response และนำ <code>docUrl</code> ไปใช้</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              n8n จะตอบกลับ JSON ที่มี <code>docUrl</code> และ <code>docId</code> นำลิงก์ไปแสดงในหน้าเว็บ
              หรือบันทึกในฐานข้อมูลของคุณ
            </p>
            <CodeSnippet :code="codeWebhookResponse" lang="json" id="wh-resp" :on-copy="copyToClipboard" :copied-id="copiedId" />
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">5</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">รองรับ Error และ Timeout</p>
            <ul class="mt-1 list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
              <li v-if="mode === 'submit'"><strong>413 Payload too large</strong> → ลดขนาดรูปก่อน base64 (แนะนำ ≤ 1.2MB)</li>
              <li><strong>504 Timeout</strong> → workflow อาจไม่ active หรือใช้เวลานานเกิน, ตั้ง timeout ฝั่ง client ≥ 60s</li>
              <li><strong>response ไม่มี <code>docUrl</code></strong> → ตรวจ <code>Respond to Webhook</code> ใน n8n ว่าตอบกลับ field ถูกต้อง</li>
            </ul>
          </div>
        </li>
      </ol>

      <div class="rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 p-3 text-xs text-rose-800 dark:text-rose-200">
        <p class="font-semibold">ข้อควรระวังด้านความปลอดภัย</p>
        <ul class="mt-1 list-disc list-inside space-y-0.5">
          <li>ห้ามเรียก webhook จาก Browser โดยตรง เพราะ URL จะหลุดออกไป</li>
          <li>ตั้ง Header เพิ่ม เช่น <code>X-Auth-Token</code> ใน n8n IF/Auth node เพื่อจำกัดผู้เรียก</li>
          <li>เก็บ webhook URL ไว้ใน <code>.env</code> ของ Backend เท่านั้น</li>
        </ul>
      </div>
    </div>

    <div v-if="method === 'api'" class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">วิธีที่ 2 · สร้างฟอร์มของคุณเอง + เรียก Gateway API</h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          เหมาะกับเว็บที่อยากมี UI ของตัวเอง แต่ใช้ Authentication / Logging / Quota ของ AI Gateway ร่วมกัน
        </p>
      </div>

      <ol class="space-y-4">
        <li class="flex gap-3">
          <span class="step-bubble">1</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">ให้ผู้ใช้ล็อกอินผ่าน UBU SSO ก่อน</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              ผู้ใช้ต้องมี role เป็น <strong>ADMIN</strong> และต้องมี cookie <code>session</code> ของ AI Gateway
              ใน browser (เปิด <code>{{ apiOrigin || 'https://ai.ubu.ac.th' }}</code> และ login หนึ่งครั้ง)
            </p>
          </div>
        </li>
        <li v-if="mode === 'submit'" class="flex gap-3">
          <span class="step-bubble">2</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">สร้างฟอร์มอัปโหลดไฟล์ในเว็บของคุณ</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              รองรับเฉพาะรูปภาพ ขนาด ≤ 5MB และแปลงเป็น base64 ก่อนส่ง
            </p>
            <CodeSnippet :code="codeFormHtml" lang="html" id="form-html" :on-copy="copyToClipboard" :copied-id="copiedId" />
          </div>
        </li>
        <li v-else class="flex gap-3">
          <span class="step-bubble">2</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">วางปุ่ม "ทำสำเนาไฟล์" ในเว็บของคุณ</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              โหมดนี้ <strong>ไม่ต้องอัปโหลดไฟล์</strong> เพียงแค่กดปุ่มเพื่อให้ระบบทำสำเนาเอกสาร
            </p>
            <CodeSnippet :code="codeFormHtml" lang="html" id="form-html" :on-copy="copyToClipboard" :copied-id="copiedId" />
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">3</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">เรียก API พร้อม <code>credentials: 'include'</code></p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              ใช้ endpoint
              <code class="px-1 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded font-semibold">POST {{ apiOrigin }}/api/admin/doc-automate{{ endpoint }}</code>
            </p>

            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="lang in apiLangs"
                :key="lang.id"
                type="button"
                @click="apiLang = lang.id"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium border transition',
                  apiLang === lang.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900/40 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-emerald-400'
                ]"
              >{{ lang.label }}</button>
            </div>

            <CodeSnippet v-if="apiLang === 'fetch'" :code="codeApiFetch" lang="javascript" id="api-fetch" :on-copy="copyToClipboard" :copied-id="copiedId" />
            <CodeSnippet v-else-if="apiLang === 'react'" :code="codeApiReact" lang="jsx" id="api-react" :on-copy="copyToClipboard" :copied-id="copiedId" />
            <CodeSnippet v-else :code="codeApiVue" lang="vue" id="api-vue" :on-copy="copyToClipboard" :copied-id="copiedId" />
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">4</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">ตั้งค่า CORS ให้รองรับโดเมนของคุณ</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              หากเว็บของคุณอยู่คนละโดเมนกับ AI Gateway ต้องให้ผู้ดูแลเพิ่มโดเมนของคุณใน CORS allowlist
              และต้องเปิด <code>credentials: true</code> ทั้งสองฝั่ง
            </p>
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-bubble">5</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">รองรับ Response และเปิด Google Doc</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              ระบบจะส่งกลับ <code>{ success, docUrl, docId }</code> นำ <code>docUrl</code> ไปเปิดในแท็บใหม่หรือฝัง
            </p>
            <CodeSnippet :code="codeApiResponse" lang="json" id="api-resp" :on-copy="copyToClipboard" :copied-id="copiedId" />
          </div>
        </li>
      </ol>

      <div class="rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-xs text-emerald-800 dark:text-emerald-200">
        <p class="font-semibold">ข้อดีของวิธีนี้</p>
        <ul class="mt-1 list-disc list-inside space-y-0.5">
          <li>มี logging / quota / role check ของ AI Gateway ครบ</li>
          <li>ไม่ต้องเปิดเผย n8n webhook URL ออกสู่อินเทอร์เน็ต</li>
          <li>ใช้ session เดิมที่ user login กับ UBU SSO อยู่แล้ว</li>
        </ul>
      </div>
    </div>

    <div class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">FAQ / Troubleshooting</h3>
      <details v-for="(item, idx) in faq" :key="idx" class="group rounded-lg border border-gray-200 dark:border-slate-700 p-3 open:bg-gray-50 dark:open:bg-slate-900/40">
        <summary class="cursor-pointer text-sm font-medium text-gray-900 dark:text-white flex items-center justify-between gap-3">
          <span>{{ item.q }}</span>
          <span class="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <p class="mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed" v-html="item.a"></p>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'

const props = defineProps<{
  mode: 'submit' | 'copy'
}>()

const CodeSnippet = defineComponent({
  name: 'IntegrationCodeSnippet',
  props: {
    code: { type: String, required: true },
    lang: { type: String, default: 'text' },
    id: { type: String, required: true },
    onCopy: { type: Function as unknown as () => (code: string, id: string) => void, required: true },
    copiedId: { type: String, default: '' }
  },
  setup(p) {
    return () =>
      h('div', { class: 'mt-2 rounded-lg overflow-hidden border border-slate-700 bg-slate-900' }, [
        h('div', { class: 'flex items-center justify-between px-3 py-1.5 bg-slate-800/80' }, [
          h('span', { class: 'text-[10px] font-mono uppercase tracking-wider text-emerald-300' }, p.lang),
          h(
            'button',
            {
              type: 'button',
              class: 'text-[11px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-gray-100 transition',
              onClick: () => p.onCopy(p.code, p.id)
            },
            p.copiedId === p.id ? '✓ คัดลอกแล้ว' : 'คัดลอก'
          )
        ]),
        h(
          'pre',
          { class: 'p-3 text-[12px] leading-relaxed text-gray-100 overflow-x-auto whitespace-pre font-mono' },
          h('code', null, p.code)
        )
      ])
  }
})

const method = ref<'webhook' | 'api'>('webhook')
const webhookLang = ref<'curl' | 'node' | 'python' | 'php'>('curl')
const apiLang = ref<'fetch' | 'react' | 'vue'>('fetch')
const copiedId = ref('')

const runtimeConfig = useRuntimeConfig()
const apiBase = (runtimeConfig.public.apiBase as string) || ''

const apiOrigin = computed(() => {
  const base = apiBase.trim()
  if (!base) return 'https://ai.ubu.ac.th'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '').replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://ai.ubu.ac.th'
})

const isSubmit = computed(() => props.mode === 'submit')
const modeLabel = computed(() => (isSubmit.value ? 'แนบหลักฐาน' : 'ทำสำเนาไฟล์'))
const modeDescription = computed(() =>
  isSubmit.value
    ? 'โหมดนี้ส่งไฟล์หลักฐาน (รูปภาพ) ไปยัง n8n เพื่อสร้าง Google Doc พร้อมข้อมูลในรูปแบบ base64'
    : 'โหมดนี้ทำสำเนาไฟล์เอกสารต้นฉบับโดยไม่ต้องอัปโหลดไฟล์ ส่งเพียง metadata ของผู้ใช้และเอกสาร'
)

const endpoint = computed(() => (isSubmit.value ? '/submit' : '/copy'))
const webhookEnv = computed(() =>
  isSubmit.value ? 'N8N_DOC_AUTOMATE_WEBHOOK_URL' : 'N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL'
)

const methods = [
  {
    id: 'webhook' as const,
    index: 1,
    title: 'เรียก n8n Webhook',
    subtitle: 'เหมาะกับ Backend ที่เรียกอัตโนมัติแบบ Server-to-Server'
  },
  {
    id: 'api' as const,
    index: 2,
    title: 'ฟอร์มเอง + Gateway API',
    subtitle: 'มี UI เอง ให้ Gateway เป็นคนเรียก n8n'
  }
]

const webhookLangs = [
  { id: 'curl' as const, label: 'cURL' },
  { id: 'node' as const, label: 'Node.js' },
  { id: 'python' as const, label: 'Python' },
  { id: 'php' as const, label: 'PHP' }
]

const apiLangs = [
  { id: 'fetch' as const, label: 'Vanilla JS (fetch)' },
  { id: 'react' as const, label: 'React' },
  { id: 'vue' as const, label: 'Vue 3' }
]

const codeWebhookPayload = computed(() =>
  isSubmit.value
    ? `{
  "event": "ubu_doc_automate_submit",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "actor": {
    "id": 123,
    "email": "user@ubu.ac.th",
    "fullName": "นายตัวอย่าง ใจดี",
    "department": "สำนักคอมพิวเตอร์",
    "faculty": "-",
    "role": "ADMIN"
  },
  "document": {
    "title": "UBU DocAutomate - นายตัวอย่าง ใจดี - 2025-01-15",
    "file": {
      "name": "evidence.jpg",
      "mimeType": "image/jpeg",
      "size": 245678,
      "contentBase64": "/9j/4AAQSkZJRgABAQEAYABgAAD..."
    }
  }
}`
    : `{
  "event": "ubu_doc_automate_submit",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "actor": {
    "id": 123,
    "email": "user@ubu.ac.th",
    "fullName": "นายตัวอย่าง ใจดี",
    "department": "สำนักคอมพิวเตอร์",
    "faculty": "-",
    "role": "ADMIN"
  },
  "document": {
    "title": "UBU DocAutomate - นายตัวอย่าง ใจดี - 2025-01-15"
  }
}`
)

const codeWebhookResponse = `{
  "docUrl": "https://docs.google.com/document/d/XXXXXXXX/edit",
  "docId": "XXXXXXXX"
}`

const codeWebhookCurl = computed(() =>
  isSubmit.value
    ? `curl -X POST "$N8N_DOC_AUTOMATE_WEBHOOK_URL" \\
  -H "Content-Type: application/json" \\
  -H "X-Auth-Token: $YOUR_SECRET_TOKEN" \\
  --data-binary @payload.json`
    : `curl -X POST "$N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL" \\
  -H "Content-Type: application/json" \\
  -H "X-Auth-Token: $YOUR_SECRET_TOKEN" \\
  -d '{
    "event": "ubu_doc_automate_submit",
    "timestamp": "'$(date -u +%FT%TZ)'",
    "actor": { "email": "user@ubu.ac.th", "fullName": "นายตัวอย่าง ใจดี", "role": "ADMIN" },
    "document": { "title": "UBU DocAutomate - copy - '$(date +%F)'" }
  }'`
)

const codeWebhookNode = computed(() =>
  isSubmit.value
    ? `import axios from 'axios'
import fs from 'node:fs/promises'

const buf = await fs.readFile('./evidence.jpg')

const payload = {
  event: 'ubu_doc_automate_submit',
  timestamp: new Date().toISOString(),
  actor: {
    email: 'user@ubu.ac.th',
    fullName: 'นายตัวอย่าง ใจดี',
    role: 'ADMIN'
  },
  document: {
    title: \`UBU DocAutomate - \${new Date().toISOString().slice(0,10)}\`,
    file: {
      name: 'evidence.jpg',
      mimeType: 'image/jpeg',
      size: buf.length,
      contentBase64: buf.toString('base64')
    }
  }
}

const { data } = await axios.post(
  process.env.N8N_DOC_AUTOMATE_WEBHOOK_URL,
  payload,
  { timeout: 60_000, headers: { 'X-Auth-Token': process.env.SECRET } }
)

console.log('Google Doc URL:', data.docUrl)`
    : `import axios from 'axios'

const payload = {
  event: 'ubu_doc_automate_submit',
  timestamp: new Date().toISOString(),
  actor: {
    email: 'user@ubu.ac.th',
    fullName: 'นายตัวอย่าง ใจดี',
    role: 'ADMIN'
  },
  document: {
    title: \`UBU DocAutomate - copy - \${new Date().toISOString().slice(0,10)}\`
  }
  // หมายเหตุ: ไม่ต้องส่ง file ในโหมดสำเนาไฟล์
}

const { data } = await axios.post(
  process.env.N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL,
  payload,
  { timeout: 60_000, headers: { 'X-Auth-Token': process.env.SECRET } }
)

console.log('Copied Google Doc URL:', data.docUrl)`
)

const codeWebhookPython = computed(() =>
  isSubmit.value
    ? `import os, base64, requests
from datetime import datetime, timezone

with open('evidence.jpg', 'rb') as f:
    raw = f.read()

payload = {
    "event": "ubu_doc_automate_submit",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "actor": {
        "email": "user@ubu.ac.th",
        "fullName": "นายตัวอย่าง ใจดี",
        "role": "ADMIN",
    },
    "document": {
        "title": f"UBU DocAutomate - {datetime.utcnow():%Y-%m-%d}",
        "file": {
            "name": "evidence.jpg",
            "mimeType": "image/jpeg",
            "size": len(raw),
            "contentBase64": base64.b64encode(raw).decode("ascii"),
        },
    },
}

resp = requests.post(
    os.environ["N8N_DOC_AUTOMATE_WEBHOOK_URL"],
    json=payload,
    headers={"X-Auth-Token": os.environ["SECRET"]},
    timeout=60,
)
resp.raise_for_status()
print("Google Doc URL:", resp.json()["docUrl"])`
    : `import os, requests
from datetime import datetime, timezone

payload = {
    "event": "ubu_doc_automate_submit",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "actor": {
        "email": "user@ubu.ac.th",
        "fullName": "นายตัวอย่าง ใจดี",
        "role": "ADMIN",
    },
    "document": {
        "title": f"UBU DocAutomate - copy - {datetime.utcnow():%Y-%m-%d}"
    },
    # หมายเหตุ: ไม่ต้องมี key 'file' ในโหมดสำเนาไฟล์
}

resp = requests.post(
    os.environ["N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL"],
    json=payload,
    headers={"X-Auth-Token": os.environ["SECRET"]},
    timeout=60,
)
resp.raise_for_status()
print("Copied Google Doc URL:", resp.json()["docUrl"])`
)

const codeWebhookPhp = computed(() =>
  isSubmit.value
    ? `<?php
$raw = file_get_contents('evidence.jpg');
$payload = [
    'event'     => 'ubu_doc_automate_submit',
    'timestamp' => date('c'),
    'actor'     => [
        'email'    => 'user@ubu.ac.th',
        'fullName' => 'นายตัวอย่าง ใจดี',
        'role'     => 'ADMIN',
    ],
    'document'  => [
        'title' => 'UBU DocAutomate - ' . date('Y-m-d'),
        'file'  => [
            'name'          => 'evidence.jpg',
            'mimeType'      => 'image/jpeg',
            'size'          => strlen($raw),
            'contentBase64' => base64_encode($raw),
        ],
    ],
];

$ch = curl_init(getenv('N8N_DOC_AUTOMATE_WEBHOOK_URL'));
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'X-Auth-Token: ' . getenv('SECRET'),
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 60,
]);
$res = curl_exec($ch);
curl_close($ch);
$data = json_decode($res, true);
echo $data['docUrl'];`
    : `<?php
$payload = [
    'event'     => 'ubu_doc_automate_submit',
    'timestamp' => date('c'),
    'actor'     => [
        'email'    => 'user@ubu.ac.th',
        'fullName' => 'นายตัวอย่าง ใจดี',
        'role'     => 'ADMIN',
    ],
    'document'  => [
        'title' => 'UBU DocAutomate - copy - ' . date('Y-m-d'),
    ],
    // หมายเหตุ: ไม่ต้องมี key 'file' ในโหมดสำเนาไฟล์
];

$ch = curl_init(getenv('N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL'));
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'X-Auth-Token: ' . getenv('SECRET'),
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 60,
]);
$res = curl_exec($ch);
curl_close($ch);
$data = json_decode($res, true);
echo $data['docUrl'];`
)

const codeFormHtml = computed(() =>
  isSubmit.value
    ? `<form id="ubu-doc-form">
  <input type="file" id="ubu-file" accept="image/*" required />
  <button type="submit">ส่งสร้าง Google Doc</button>
</form>
<div id="ubu-result"></div>`
    : `<button id="ubu-copy-btn" type="button">ทำสำเนาไฟล์เอกสาร</button>
<div id="ubu-result"></div>`
)

const codeApiFetch = computed(() =>
  isSubmit.value
    ? `const form = document.getElementById('ubu-doc-form')
const fileInput = document.getElementById('ubu-file')
const out = document.getElementById('ubu-result')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const file = fileInput.files[0]
  if (!file) return

  const buf = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))

  const res = await fetch('${apiOrigin.value}/api/admin/doc-automate/submit', {
    method: 'POST',
    credentials: 'include', // ส่ง cookie session ของ UBU SSO
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        contentBase64: base64
      }
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    out.textContent = err.message || 'ส่งไม่สำเร็จ'
    return
  }

  const { docUrl } = await res.json()
  out.innerHTML = \`<a href="\${docUrl}" target="_blank">เปิด Google Doc</a>\`
})`
    : `const btn = document.getElementById('ubu-copy-btn')
const out = document.getElementById('ubu-result')

btn.addEventListener('click', async () => {
  btn.disabled = true
  out.textContent = 'กำลังทำสำเนาไฟล์...'
  try {
    // โหมดนี้ไม่ต้องส่ง file สามารถส่ง body ว่างหรือ metadata ก็ได้
    const res = await fetch('${apiOrigin.value}/api/admin/doc-automate/copy', {
      method: 'POST',
      credentials: 'include', // ส่ง cookie session ของ UBU SSO
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'my-website',
        mode: 'copy-file',
        requestedAt: new Date().toISOString()
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      out.textContent = err.message || 'ทำสำเนาไม่สำเร็จ'
      return
    }

    const { docUrl } = await res.json()
    out.innerHTML = \`<a href="\${docUrl}" target="_blank">เปิด Google Doc</a>\`
  } finally {
    btn.disabled = false
  }
})`
)

const codeApiReact = computed(() =>
  isSubmit.value
    ? `import { useState } from 'react'

const API = '${apiOrigin.value}'

export default function DocAutomate() {
  const [docUrl, setDocUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    const file = e.target.elements.file.files[0]
    if (!file) return

    setLoading(true); setError(''); setDocUrl('')
    try {
      const buf = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))

      const res = await fetch(\`\${API}/api/admin/doc-automate/submit\`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: { name: file.name, mimeType: file.type, size: file.size, contentBase64: base64 }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'ส่งไม่สำเร็จ')
      setDocUrl(data.docUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="file" type="file" accept="image/*" required />
      <button disabled={loading}>{loading ? 'กำลังส่ง…' : 'สร้าง Google Doc'}</button>
      {error && <p style={{color:'red'}}>{error}</p>}
      {docUrl && <a href={docUrl} target="_blank">เปิด Google Doc</a>}
    </form>
  )
}`
    : `import { useState } from 'react'

const API = '${apiOrigin.value}'

export default function DocAutomateCopy() {
  const [docUrl, setDocUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onCopy() {
    setLoading(true); setError(''); setDocUrl('')
    try {
      const res = await fetch(\`\${API}/api/admin/doc-automate/copy\`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'my-website',
          mode: 'copy-file',
          requestedAt: new Date().toISOString()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'ทำสำเนาไม่สำเร็จ')
      setDocUrl(data.docUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={onCopy} disabled={loading}>
        {loading ? 'กำลังทำสำเนาไฟล์…' : 'ทำสำเนาไฟล์'}
      </button>
      {error && <p style={{color:'red'}}>{error}</p>}
      {docUrl && <a href={docUrl} target="_blank">เปิด Google Doc</a>}
    </div>
  )
}`
)

const codeApiVue = computed(() =>
  isSubmit.value
    ? `<script setup>
import { ref } from 'vue'

const API = '${apiOrigin.value}'
const file = ref(null)
const docUrl = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (!file.value) return
  loading.value = true; error.value = ''; docUrl.value = ''
  try {
    const buf = await file.value.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))

    const res = await fetch(\`\${API}/api/admin/doc-automate/submit\`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: { name: file.value.name, mimeType: file.value.type, size: file.value.size, contentBase64: base64 }
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'ส่งไม่สำเร็จ')
    docUrl.value = data.docUrl
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
<\/script>

<template>
  <form @submit.prevent="onSubmit">
    <input type="file" accept="image/*" @change="e => file = e.target.files[0]" />
    <button :disabled="loading">{{ loading ? 'กำลังส่ง…' : 'สร้าง Google Doc' }}</button>
    <p v-if="error" style="color:red">{{ error }}</p>
    <a v-if="docUrl" :href="docUrl" target="_blank">เปิด Google Doc</a>
  </form>
</template>`
    : `<script setup>
import { ref } from 'vue'

const API = '${apiOrigin.value}'
const docUrl = ref('')
const loading = ref(false)
const error = ref('')

async function onCopy() {
  loading.value = true; error.value = ''; docUrl.value = ''
  try {
    const res = await fetch(\`\${API}/api/admin/doc-automate/copy\`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'my-website',
        mode: 'copy-file',
        requestedAt: new Date().toISOString()
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'ทำสำเนาไม่สำเร็จ')
    docUrl.value = data.docUrl
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
<\/script>

<template>
  <div>
    <button :disabled="loading" @click="onCopy">
      {{ loading ? 'กำลังทำสำเนาไฟล์…' : 'ทำสำเนาไฟล์' }}
    </button>
    <p v-if="error" style="color:red">{{ error }}</p>
    <a v-if="docUrl" :href="docUrl" target="_blank">เปิด Google Doc</a>
  </div>
</template>`
)

const codeApiResponse = computed(() =>
  isSubmit.value
    ? `{
  "success": true,
  "message": "สร้าง Google Doc สำเร็จ",
  "docUrl": "https://docs.google.com/document/d/XXXXXXXX/edit",
  "docId": "XXXXXXXX"
}`
    : `{
  "success": true,
  "message": "เริ่มทำสำเนาไฟล์สำเร็จ",
  "docUrl": "https://docs.google.com/document/d/XXXXXXXX/edit",
  "docId": "XXXXXXXX"
}`
)

const faq = computed(() => {
  const common = [
    {
      q: 'ใช้กับเว็บที่อยู่คนละโดเมนได้ไหม?',
      a: 'ได้ แต่ต้องให้ผู้ดูแลระบบเพิ่มโดเมนของคุณเข้า CORS allowlist ในตัวแปร <code>FRONTEND_URL</code> ของ Backend และต้องเปิด <code>credentials: include</code> เพื่อส่ง cookie session ข้ามโดเมน'
    },
    {
      q: 'ทำไมเรียก API แล้วได้ 403 Admin access required?',
      a: 'เพราะ endpoint <code>/api/admin/doc-automate/*</code> ต้องการ session cookie ของผู้ใช้ที่มี role = ADMIN เท่านั้น ตรวจสอบว่า user login ผ่าน UBU SSO และมีสิทธิ์ Admin จริง'
    },
    {
      q: 'response กลับมาแต่ไม่มี docUrl?',
      a: 'ตรวจ workflow ใน n8n ว่ามี node <code>Respond to Webhook</code> และตอบ JSON ที่มี key <code>docUrl</code> หรือ <code>url</code> หรือ <code>googleDocUrl</code> อย่างใดอย่างหนึ่ง'
    },
    {
      q: 'จะรู้ได้ยังไงว่า workflow ของ n8n active?',
      a: 'ทดสอบโดยกดเรียกผ่านหน้า <code>/admin/doc-automate</code> นี้ก่อน หากใช้งานได้ปกติ แสดงว่า workflow active แล้ว ค่อยเปิดให้ระบบอื่นเรียก'
    }
  ]

  if (isSubmit.value) {
    return [
      {
        q: 'ส่งไฟล์ใหญ่เกินทำอย่างไร?',
        a: 'แนะนำลดขนาดรูปก่อน base64 (ไม่เกิน ~1.2MB) เพราะมีลิมิตที่ nginx (<code>client_max_body_size</code>) และ n8n payload ภายใน หากเกินจะได้ error 413'
      },
      {
        q: 'รองรับไฟล์ประเภทใดบ้าง?',
        a: 'ปัจจุบันรองรับเฉพาะ<strong>รูปภาพ</strong> (image/*, JPG/PNG/WebP) ขนาดไม่เกิน 5MB หากต้องการประเภทอื่น ต้องปรับ workflow n8n และ validation ฝั่ง Backend'
      },
      ...common,
      {
        q: 'อยากเปลี่ยนไปใช้โหมด "ทำสำเนาไฟล์" ต้องทำอย่างไร?',
        a: 'กลับไปแท็บ "ทำสำเนาไฟล์" แล้วเลือก "วิธีนำไปใช้กับระบบอื่น" เพราะ payload และ endpoint ต่างกันโดยสิ้นเชิง (ไม่ต้องส่งไฟล์)'
      }
    ]
  }

  return [
    {
      q: 'ทำไมไม่ต้องส่งไฟล์?',
      a: 'เพราะโหมด "ทำสำเนาไฟล์" จะใช้ <strong>เอกสารต้นฉบับที่กำหนดไว้แล้ว</strong>ใน workflow n8n เพื่อทำสำเนาให้ผู้ใช้ใหม่ ไม่ต้องอัปโหลดอะไรเพิ่ม',
    },
    {
      q: 'ส่ง body เป็น object ว่างได้ไหม?',
      a: 'ได้ — endpoint นี้ไม่ได้ตรวจ field ใด ๆ จาก body แต่แนะนำให้ส่ง metadata อย่างน้อย <code>source</code>, <code>requestedAt</code> เพื่อช่วยใน logging/audit'
    },
    ...common,
    {
      q: 'อยากเปลี่ยนไปใช้โหมด "แนบหลักฐาน" ต้องทำอย่างไร?',
      a: 'กลับไปแท็บ "แนบหลักฐาน" แล้วเลือก "วิธีนำไปใช้กับระบบอื่น" เพราะ payload และ endpoint ต่างกันโดยสิ้นเชิง (ต้องส่งไฟล์ base64)'
    }
  ]
})

async function copyToClipboard(text: string, id: string) {
  if (typeof window === 'undefined') return
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = ''
    }, 1500)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = ''
    }, 1500)
  }
}
</script>

<style scoped>
.step-bubble {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 4px 14px -6px rgba(16, 185, 129, 0.55);
}
</style>

