import{f as Q,r as m,h as te,g,c as n,o as r,a as e,x,t as u,F as G,m as M,n as w,d as l,b as D,B as y,D as T,k as I,N as $,_ as oe,A as ae,u as le,w as ne,e as de}from"#entry";const ie={class:"space-y-6"},ue={class:"rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 shadow-sm p-5 sm:p-6"},ce={class:"flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"},me={class:"inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-semibold"},pe={class:"mt-3 text-xl font-bold text-gray-900 dark:text-white"},ge={class:"mt-1 text-sm text-gray-600 dark:text-gray-300"},be={class:"mt-5 grid sm:grid-cols-2 gap-3"},fe=["onClick"],xe={class:"flex items-center gap-2"},ye={class:"text-sm font-semibold text-gray-900 dark:text-white"},ve={class:"mt-2 text-xs text-gray-600 dark:text-gray-300"},ke={key:0,class:"rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-6"},he={class:"mt-1 text-sm text-gray-600 dark:text-gray-300"},we={class:"space-y-4"},_e={class:"flex gap-3"},Ue={class:"flex-1"},Te={class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},Ae={class:"px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded font-semibold"},Ce={class:"flex gap-3"},Se={class:"flex-1"},Oe={key:0,class:"mt-2 text-[11px] text-gray-500 dark:text-gray-400"},$e={key:1,class:"mt-2 text-[11px] text-gray-500 dark:text-gray-400"},De={class:"flex gap-3"},Ee={class:"flex-1"},Be={class:"mt-2 flex flex-wrap gap-2"},Ie=["onClick"],Re={class:"flex gap-3"},Ne={class:"flex-1"},je={class:"flex gap-3"},Pe={class:"flex-1"},Xe={class:"mt-1 list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-0.5"},Le={key:0},Ge={key:1,class:"rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-6"},Me={class:"space-y-4"},We={class:"flex gap-3"},qe={class:"flex-1"},Fe={class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},He={key:0,class:"flex gap-3"},ze={class:"flex-1"},Ke={key:1,class:"flex gap-3"},Je={class:"flex-1"},Ye={class:"flex gap-3"},Ve={class:"flex-1"},Qe={class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},Ze={class:"px-1 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded font-semibold"},et={class:"mt-2 flex flex-wrap gap-2"},tt=["onClick"],ot={class:"flex gap-3"},at={class:"flex-1"},st={class:"rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-3"},rt={class:"cursor-pointer text-sm font-medium text-gray-900 dark:text-white flex items-center justify-between gap-3"},lt=["innerHTML"],nt=`{
  "docUrl": "https://docs.google.com/document/d/XXXXXXXX/edit",
  "docId": "XXXXXXXX"
}`,dt=Q({__name:"DocAutomateIntegrationGuide",props:{mode:{}},setup(E){const W=E,c=Q({name:"IntegrationCodeSnippet",props:{code:{type:String,required:!0},lang:{type:String,default:"text"},id:{type:String,required:!0},onCopy:{type:Function,required:!0},copiedId:{type:String,default:""}},setup(o){return()=>$("div",{class:"mt-2 rounded-lg overflow-hidden border border-slate-700 bg-slate-900"},[$("div",{class:"flex items-center justify-between px-3 py-1.5 bg-slate-800/80"},[$("span",{class:"text-[10px] font-mono uppercase tracking-wider text-emerald-300"},o.lang),$("button",{type:"button",class:"text-[11px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-gray-100 transition",onClick:()=>o.onCopy(o.code,o.id)},o.copiedId===o.id?"✓ คัดลอกแล้ว":"คัดลอก")]),$("pre",{class:"p-3 text-[12px] leading-relaxed text-gray-100 overflow-x-auto whitespace-pre font-mono"},$("code",null,o.code))])}}),v=m("webhook"),k=m("curl"),f=m("fetch"),d=m(""),B=te().public.apiBase||"",b=g(()=>{const o=B.trim();return o?o.startsWith("http")?o.replace(/\/api\/?$/,"").replace(/\/$/,""):typeof window<"u"?window.location.origin:"https://ai.ubu.ac.th":"https://ai.ubu.ac.th"}),i=g(()=>W.mode==="submit"),_=g(()=>i.value?"แนบหลักฐาน":"ทำสำเนาไฟล์"),h=g(()=>i.value?"โหมดนี้ส่งไฟล์หลักฐาน (รูปภาพ) ไปยัง n8n เพื่อสร้าง Google Doc พร้อมข้อมูลในรูปแบบ base64":"โหมดนี้ทำสำเนาไฟล์เอกสารต้นฉบับโดยไม่ต้องอัปโหลดไฟล์ ส่งเพียง metadata ของผู้ใช้และเอกสาร"),A=g(()=>i.value?"/submit":"/copy"),C=g(()=>i.value?"N8N_DOC_AUTOMATE_WEBHOOK_URL":"N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL"),S=[{id:"webhook",index:1,title:"เรียก n8n Webhook",subtitle:"เหมาะกับ Backend ที่เรียกอัตโนมัติแบบ Server-to-Server"},{id:"api",index:2,title:"ฟอร์มเอง + Gateway API",subtitle:"มี UI เอง ให้ Gateway เป็นคนเรียก n8n"}],U=[{id:"curl",label:"cURL"},{id:"node",label:"Node.js"},{id:"python",label:"Python"},{id:"php",label:"PHP"}],Z=[{id:"fetch",label:"Vanilla JS (fetch)"},{id:"react",label:"React"},{id:"vue",label:"Vue 3"}],O=g(()=>i.value?`{
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
}`:`{
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
}`),R=g(()=>i.value?`curl -X POST "$N8N_DOC_AUTOMATE_WEBHOOK_URL" \\
  -H "Content-Type: application/json" \\
  -H "X-Auth-Token: $YOUR_SECRET_TOKEN" \\
  --data-binary @payload.json`:`curl -X POST "$N8N_DOC_AUTOMATE_COPY_WEBHOOK_URL" \\
  -H "Content-Type: application/json" \\
  -H "X-Auth-Token: $YOUR_SECRET_TOKEN" \\
  -d '{
    "event": "ubu_doc_automate_submit",
    "timestamp": "'$(date -u +%FT%TZ)'",
    "actor": { "email": "user@ubu.ac.th", "fullName": "นายตัวอย่าง ใจดี", "role": "ADMIN" },
    "document": { "title": "UBU DocAutomate - copy - '$(date +%F)'" }
  }'`),F=g(()=>i.value?`import axios from 'axios'
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

console.log('Google Doc URL:', data.docUrl)`:`import axios from 'axios'

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

console.log('Copied Google Doc URL:', data.docUrl)`),H=g(()=>i.value?`import os, base64, requests
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
print("Google Doc URL:", resp.json()["docUrl"])`:`import os, requests
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
print("Copied Google Doc URL:", resp.json()["docUrl"])`),z=g(()=>i.value?`<?php
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
echo $data['docUrl'];`:`<?php
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
echo $data['docUrl'];`),N=g(()=>i.value?`<form id="ubu-doc-form">
  <input type="file" id="ubu-file" accept="image/*" required />
  <button type="submit">ส่งสร้าง Google Doc</button>
</form>
<div id="ubu-result"></div>`:`<button id="ubu-copy-btn" type="button">ทำสำเนาไฟล์เอกสาร</button>
<div id="ubu-result"></div>`),K=g(()=>i.value?`const form = document.getElementById('ubu-doc-form')
const fileInput = document.getElementById('ubu-file')
const out = document.getElementById('ubu-result')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const file = fileInput.files[0]
  if (!file) return

  const buf = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))

  const res = await fetch('${b.value}/api/admin/doc-automate/submit', {
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
})`:`const btn = document.getElementById('ubu-copy-btn')
const out = document.getElementById('ubu-result')

btn.addEventListener('click', async () => {
  btn.disabled = true
  out.textContent = 'กำลังทำสำเนาไฟล์...'
  try {
    // โหมดนี้ไม่ต้องส่ง file สามารถส่ง body ว่างหรือ metadata ก็ได้
    const res = await fetch('${b.value}/api/admin/doc-automate/copy', {
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
})`),J=g(()=>i.value?`import { useState } from 'react'

const API = '${b.value}'

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
}`:`import { useState } from 'react'

const API = '${b.value}'

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
}`),j=g(()=>i.value?`<script setup>
import { ref } from 'vue'

const API = '${b.value}'
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
</template>`:`<script setup>
import { ref } from 'vue'

const API = '${b.value}'
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
</template>`),Y=g(()=>i.value?`{
  "success": true,
  "message": "สร้าง Google Doc สำเร็จ",
  "docUrl": "https://docs.google.com/document/d/XXXXXXXX/edit",
  "docId": "XXXXXXXX"
}`:`{
  "success": true,
  "message": "เริ่มทำสำเนาไฟล์สำเร็จ",
  "docUrl": "https://docs.google.com/document/d/XXXXXXXX/edit",
  "docId": "XXXXXXXX"
}`),P=g(()=>{const o=[{q:"ใช้กับเว็บที่อยู่คนละโดเมนได้ไหม?",a:"ได้ แต่ต้องให้ผู้ดูแลระบบเพิ่มโดเมนของคุณเข้า CORS allowlist ในตัวแปร <code>FRONTEND_URL</code> ของ Backend และต้องเปิด <code>credentials: include</code> เพื่อส่ง cookie session ข้ามโดเมน"},{q:"ทำไมเรียก API แล้วได้ 403 Admin access required?",a:"เพราะ endpoint <code>/api/admin/doc-automate/*</code> ต้องการ session cookie ของผู้ใช้ที่มี role = ADMIN เท่านั้น ตรวจสอบว่า user login ผ่าน UBU SSO และมีสิทธิ์ Admin จริง"},{q:"response กลับมาแต่ไม่มี docUrl?",a:"ตรวจ workflow ใน n8n ว่ามี node <code>Respond to Webhook</code> และตอบ JSON ที่มี key <code>docUrl</code> หรือ <code>url</code> หรือ <code>googleDocUrl</code> อย่างใดอย่างหนึ่ง"},{q:"จะรู้ได้ยังไงว่า workflow ของ n8n active?",a:"ทดสอบโดยกดเรียกผ่านหน้า <code>/admin/doc-automate</code> นี้ก่อน หากใช้งานได้ปกติ แสดงว่า workflow active แล้ว ค่อยเปิดให้ระบบอื่นเรียก"}];return i.value?[{q:"ส่งไฟล์ใหญ่เกินทำอย่างไร?",a:"แนะนำลดขนาดรูปก่อน base64 (ไม่เกิน ~1.2MB) เพราะมีลิมิตที่ nginx (<code>client_max_body_size</code>) และ n8n payload ภายใน หากเกินจะได้ error 413"},{q:"รองรับไฟล์ประเภทใดบ้าง?",a:"ปัจจุบันรองรับเฉพาะ<strong>รูปภาพ</strong> (image/*, JPG/PNG/WebP) ขนาดไม่เกิน 5MB หากต้องการประเภทอื่น ต้องปรับ workflow n8n และ validation ฝั่ง Backend"},...o,{q:'อยากเปลี่ยนไปใช้โหมด "ทำสำเนาไฟล์" ต้องทำอย่างไร?',a:'กลับไปแท็บ "ทำสำเนาไฟล์" แล้วเลือก "วิธีนำไปใช้กับระบบอื่น" เพราะ payload และ endpoint ต่างกันโดยสิ้นเชิง (ไม่ต้องส่งไฟล์)'}]:[{q:"ทำไมไม่ต้องส่งไฟล์?",a:'เพราะโหมด "ทำสำเนาไฟล์" จะใช้ <strong>เอกสารต้นฉบับที่กำหนดไว้แล้ว</strong>ใน workflow n8n เพื่อทำสำเนาให้ผู้ใช้ใหม่ ไม่ต้องอัปโหลดอะไรเพิ่ม'},{q:"ส่ง body เป็น object ว่างได้ไหม?",a:"ได้ — endpoint นี้ไม่ได้ตรวจ field ใด ๆ จาก body แต่แนะนำให้ส่ง metadata อย่างน้อย <code>source</code>, <code>requestedAt</code> เพื่อช่วยใน logging/audit"},...o,{q:'อยากเปลี่ยนไปใช้โหมด "แนบหลักฐาน" ต้องทำอย่างไร?',a:'กลับไปแท็บ "แนบหลักฐาน" แล้วเลือก "วิธีนำไปใช้กับระบบอื่น" เพราะ payload และ endpoint ต่างกันโดยสิ้นเชิง (ต้องส่งไฟล์ base64)'}]});async function a(o,t){if(!(typeof window>"u"))try{await navigator.clipboard.writeText(o),d.value=t,setTimeout(()=>{d.value===t&&(d.value="")},1500)}catch{const s=document.createElement("textarea");s.value=o,document.body.appendChild(s),s.select();try{document.execCommand("copy")}catch{}document.body.removeChild(s),d.value=t,setTimeout(()=>{d.value===t&&(d.value="")},1500)}}return(o,t)=>(r(),n("div",ie,[e("div",ue,[e("div",ce,[e("div",null,[e("div",me," Usage Guide · "+u(_.value),1),e("h2",pe,' คู่มือนำ "'+u(_.value)+'" ไปใช้กับเว็บ/ระบบอื่น ',1),e("p",ge,u(h.value),1)])]),e("div",be,[(r(),n(G,null,M(S,s=>e("button",{key:s.id,type:"button",onClick:p=>v.value=s.id,class:w(["text-left rounded-xl border p-4 transition",v.value===s.id?"border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-200 dark:ring-emerald-800":"border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-emerald-300 dark:hover:border-emerald-700"])},[e("div",xe,[e("span",{class:w(["inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",v.value===s.id?"bg-emerald-600 text-white":"bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"])},u(s.index),3),e("span",ye,u(s.title),1)]),e("p",ve,u(s.subtitle),1)],10,fe)),64))]),t[0]||(t[0]=e("div",{class:"mt-5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 text-xs text-amber-900 dark:text-amber-100"},[e("p",{class:"font-semibold text-sm"},"ตำแหน่งของ n8n Webhook"),e("ul",{class:"mt-2 space-y-1 list-disc list-inside leading-relaxed"},[e("li",null,[e("strong",null,"เรียก n8n Webhook:"),l(" เก็บ webhook URL ไว้ที่ backend หรือ "),e("code",null,".env"),l(" เท่านั้น ห้ามวางใน frontend/browser")]),e("li",null,[e("strong",null,"ฟอร์มเอง + Gateway API:"),l(" เว็บอื่นเรียก API ของ AI Gateway และ AI Gateway เป็นคนถือ webhook n8n ไว้ฝั่ง server")])])],-1))]),v.value==="webhook"?(r(),n("div",ke,[e("div",null,[t[1]||(t[1]=e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white"},"วิธีที่ 1 · เรียก n8n Webhook โดยตรง (Server-to-Server)",-1)),e("p",he,' เหมาะกับ Backend ของระบบอื่น (PHP/Node/Python/Go) ที่ต้องการเรียก "'+u(_.value)+'" อัตโนมัติ ',1)]),e("ol",we,[e("li",_e,[t[5]||(t[5]=e("span",{class:"step-bubble"},"1",-1)),e("div",Ue,[t[4]||(t[4]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"ขอ Webhook URL จากผู้ดูแลระบบ",-1)),e("p",Te,[t[2]||(t[2]=l(" สำหรับโหมดนี้ใช้ตัวแปร ",-1)),e("code",Ae,u(C.value),1),t[3]||(t[3]=l(" ห้ามเปิดเผยใน Frontend ให้เก็บไว้ที่ Backend ของคุณเท่านั้น ",-1))])])]),e("li",Ce,[t[10]||(t[10]=e("span",{class:"step-bubble"},"2",-1)),e("div",Se,[t[8]||(t[8]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"เตรียม Payload ตาม Schema",-1)),t[9]||(t[9]=e("p",{class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},[l(" ส่ง JSON ไปที่ webhook ด้วย method "),e("code",null,"POST"),l(" และ header "),e("code",null,"Content-Type: application/json")],-1)),D(y(c),{code:O.value,lang:"json",id:"wh-payload","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"]),E.mode==="submit"?(r(),n("p",Oe,[...t[6]||(t[6]=[l(" * ",-1),e("code",null,"contentBase64",-1),l(" คือเนื้อหาไฟล์ในรูปแบบ base64 (ไม่ต้องมี prefix ",-1),e("code",null,"data:image/...;base64,",-1),l(") ขนาดสูงสุด 5MB ",-1)])])):(r(),n("p",$e,[...t[7]||(t[7]=[l(" * ",-1),e("strong",null,"ไม่ต้องส่งไฟล์",-1),l(" ใน payload สำหรับโหมดสำเนาไฟล์ ส่งเพียง metadata ของ actor และ document เท่านั้น ",-1)])]))])]),e("li",De,[t[12]||(t[12]=e("span",{class:"step-bubble"},"3",-1)),e("div",Ee,[t[11]||(t[11]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"เรียก Webhook ด้วยภาษาที่คุณใช้",-1)),e("div",Be,[(r(),n(G,null,M(U,s=>e("button",{key:s.id,type:"button",onClick:p=>k.value=s.id,class:w(["px-3 py-1 rounded-full text-xs font-medium border transition",k.value===s.id?"bg-emerald-600 text-white border-emerald-600":"bg-white dark:bg-slate-900/40 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-emerald-400"])},u(s.label),11,Ie)),64))]),k.value==="curl"?(r(),T(y(c),{key:0,code:R.value,lang:"bash",id:"wh-curl","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])):k.value==="node"?(r(),T(y(c),{key:1,code:F.value,lang:"javascript",id:"wh-node","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])):k.value==="python"?(r(),T(y(c),{key:2,code:H.value,lang:"python",id:"wh-py","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])):(r(),T(y(c),{key:3,code:z.value,lang:"php",id:"wh-php","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"]))])]),e("li",Re,[t[15]||(t[15]=e("span",{class:"step-bubble"},"4",-1)),e("div",Ne,[t[13]||(t[13]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},[l("อ่าน Response และนำ "),e("code",null,"docUrl"),l(" ไปใช้")],-1)),t[14]||(t[14]=e("p",{class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},[l(" n8n จะตอบกลับ JSON ที่มี "),e("code",null,"docUrl"),l(" และ "),e("code",null,"docId"),l(" นำลิงก์ไปแสดงในหน้าเว็บ หรือบันทึกในฐานข้อมูลของคุณ ")],-1)),D(y(c),{code:nt,lang:"json",id:"wh-resp","on-copy":a,"copied-id":d.value},null,8,["copied-id"])])]),e("li",je,[t[20]||(t[20]=e("span",{class:"step-bubble"},"5",-1)),e("div",Pe,[t[19]||(t[19]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"รองรับ Error และ Timeout",-1)),e("ul",Xe,[E.mode==="submit"?(r(),n("li",Le,[...t[16]||(t[16]=[e("strong",null,"413 Payload too large",-1),l(" → ลดขนาดรูปก่อน base64 (แนะนำ ≤ 1.2MB)",-1)])])):x("",!0),t[17]||(t[17]=e("li",null,[e("strong",null,"504 Timeout"),l(" → workflow อาจไม่ active หรือใช้เวลานานเกิน, ตั้ง timeout ฝั่ง client ≥ 60s")],-1)),t[18]||(t[18]=e("li",null,[e("strong",null,[l("response ไม่มี "),e("code",null,"docUrl")]),l(" → ตรวจ "),e("code",null,"Respond to Webhook"),l(" ใน n8n ว่าตอบกลับ field ถูกต้อง")],-1))])])])]),t[21]||(t[21]=e("div",{class:"rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 p-3 text-xs text-rose-800 dark:text-rose-200"},[e("p",{class:"font-semibold"},"ข้อควรระวังด้านความปลอดภัย"),e("ul",{class:"mt-1 list-disc list-inside space-y-0.5"},[e("li",null,"ห้ามเรียก webhook จาก Browser โดยตรง เพราะ URL จะหลุดออกไป"),e("li",null,[l("ตั้ง Header เพิ่ม เช่น "),e("code",null,"X-Auth-Token"),l(" ใน n8n IF/Auth node เพื่อจำกัดผู้เรียก")]),e("li",null,[l("เก็บ webhook URL ไว้ใน "),e("code",null,".env"),l(" ของ Backend เท่านั้น")])])],-1))])):x("",!0),v.value==="api"?(r(),n("div",Ge,[t[43]||(t[43]=e("div",null,[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white"},"วิธีที่ 2 · สร้างฟอร์มของคุณเอง + เรียก Gateway API"),e("p",{class:"mt-1 text-sm text-gray-600 dark:text-gray-300"}," เหมาะกับเว็บที่อยากมี UI ของตัวเอง แต่ใช้ Authentication / Logging / Quota ของ AI Gateway ร่วมกัน ")],-1)),e("ol",Me,[e("li",We,[t[29]||(t[29]=e("span",{class:"step-bubble"},"1",-1)),e("div",qe,[t[28]||(t[28]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"ให้ผู้ใช้ล็อกอินผ่าน UBU SSO ก่อน",-1)),e("p",Fe,[t[22]||(t[22]=l(" ผู้ใช้ต้องมี role เป็น ",-1)),t[23]||(t[23]=e("strong",null,"ADMIN",-1)),t[24]||(t[24]=l(" และต้องมี cookie ",-1)),t[25]||(t[25]=e("code",null,"session",-1)),t[26]||(t[26]=l(" ของ AI Gateway ใน browser (เปิด ",-1)),e("code",null,u(b.value||"https://ai.ubu.ac.th"),1),t[27]||(t[27]=l(" และ login หนึ่งครั้ง) ",-1))])])]),E.mode==="submit"?(r(),n("li",He,[t[32]||(t[32]=e("span",{class:"step-bubble"},"2",-1)),e("div",ze,[t[30]||(t[30]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"สร้างฟอร์มอัปโหลดไฟล์ในเว็บของคุณ",-1)),t[31]||(t[31]=e("p",{class:"mt-1 text-xs text-gray-600 dark:text-gray-300"}," รองรับเฉพาะรูปภาพ ขนาด ≤ 5MB และแปลงเป็น base64 ก่อนส่ง ",-1)),D(y(c),{code:N.value,lang:"html",id:"form-html","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])])])):(r(),n("li",Ke,[t[35]||(t[35]=e("span",{class:"step-bubble"},"2",-1)),e("div",Je,[t[33]||(t[33]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},'วางปุ่ม "ทำสำเนาไฟล์" ในเว็บของคุณ',-1)),t[34]||(t[34]=e("p",{class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},[l(" โหมดนี้ "),e("strong",null,"ไม่ต้องอัปโหลดไฟล์"),l(" เพียงแค่กดปุ่มเพื่อให้ระบบทำสำเนาเอกสาร ")],-1)),D(y(c),{code:N.value,lang:"html",id:"form-html","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])])])),e("li",Ye,[t[38]||(t[38]=e("span",{class:"step-bubble"},"3",-1)),e("div",Ve,[t[37]||(t[37]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},[l("เรียก API พร้อม "),e("code",null,"credentials: 'include'")],-1)),e("p",Qe,[t[36]||(t[36]=l(" ใช้ endpoint ",-1)),e("code",Ze,"POST "+u(b.value)+"/api/admin/doc-automate"+u(A.value),1)]),e("div",et,[(r(),n(G,null,M(Z,s=>e("button",{key:s.id,type:"button",onClick:p=>f.value=s.id,class:w(["px-3 py-1 rounded-full text-xs font-medium border transition",f.value===s.id?"bg-emerald-600 text-white border-emerald-600":"bg-white dark:bg-slate-900/40 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-emerald-400"])},u(s.label),11,tt)),64))]),f.value==="fetch"?(r(),T(y(c),{key:0,code:K.value,lang:"javascript",id:"api-fetch","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])):f.value==="react"?(r(),T(y(c),{key:1,code:J.value,lang:"jsx",id:"api-react","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])):(r(),T(y(c),{key:2,code:j.value,lang:"vue",id:"api-vue","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"]))])]),t[42]||(t[42]=I('<li class="flex gap-3" data-v-5a881700><span class="step-bubble" data-v-5a881700>4</span><div class="flex-1" data-v-5a881700><p class="text-sm font-semibold text-gray-900 dark:text-white" data-v-5a881700>ตั้งค่า CORS ให้รองรับโดเมนของคุณ</p><p class="mt-1 text-xs text-gray-600 dark:text-gray-300" data-v-5a881700> หากเว็บของคุณอยู่คนละโดเมนกับ AI Gateway ต้องให้ผู้ดูแลเพิ่มโดเมนของคุณใน CORS allowlist และต้องเปิด <code data-v-5a881700>credentials: true</code> ทั้งสองฝั่ง </p></div></li>',1)),e("li",ot,[t[41]||(t[41]=e("span",{class:"step-bubble"},"5",-1)),e("div",at,[t[39]||(t[39]=e("p",{class:"text-sm font-semibold text-gray-900 dark:text-white"},"รองรับ Response และเปิด Google Doc",-1)),t[40]||(t[40]=e("p",{class:"mt-1 text-xs text-gray-600 dark:text-gray-300"},[l(" ระบบจะส่งกลับ "),e("code",null,"{ success, docUrl, docId }"),l(" นำ "),e("code",null,"docUrl"),l(" ไปเปิดในแท็บใหม่หรือฝัง ")],-1)),D(y(c),{code:Y.value,lang:"json",id:"api-resp","on-copy":a,"copied-id":d.value},null,8,["code","copied-id"])])])]),t[44]||(t[44]=e("div",{class:"rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-xs text-emerald-800 dark:text-emerald-200"},[e("p",{class:"font-semibold"},"ข้อดีของวิธีนี้"),e("ul",{class:"mt-1 list-disc list-inside space-y-0.5"},[e("li",null,"มี logging / quota / role check ของ AI Gateway ครบ"),e("li",null,"ไม่ต้องเปิดเผย n8n webhook URL ออกสู่อินเทอร์เน็ต"),e("li",null,"ใช้ session เดิมที่ user login กับ UBU SSO อยู่แล้ว")])],-1))])):x("",!0),e("div",st,[t[46]||(t[46]=e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white"},"FAQ / Troubleshooting",-1)),(r(!0),n(G,null,M(P.value,(s,p)=>(r(),n("details",{key:p,class:"group rounded-lg border border-gray-200 dark:border-slate-700 p-3 open:bg-gray-50 dark:open:bg-slate-900/40"},[e("summary",rt,[e("span",null,u(s.q),1),t[45]||(t[45]=e("span",{class:"text-xs text-gray-400 group-open:rotate-180 transition-transform"},"▼",-1))]),e("p",{class:"mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed",innerHTML:s.a},null,8,lt)]))),128))])]))}}),it=oe(dt,[["__scopeId","data-v-5a881700"]]),ut=ae("/assets/n8n_docimg.png"),ct=ae("/assets/n8n_doc.png"),mt={class:"min-h-screen bg-transparent dark:bg-transparent py-8"},pt={class:"max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"},gt={class:"rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-6 shadow-sm"},bt={class:"flex flex-col md:flex-row md:items-start md:justify-between gap-4"},ft={key:0,class:"grid lg:grid-cols-2 gap-6"},xt={key:1,class:"space-y-6"},yt={class:"flex flex-wrap items-center justify-between gap-3"},vt={class:"inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 shadow-inner"},kt={key:1,class:"grid lg:grid-cols-2 gap-6"},ht={class:"rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4"},wt={class:"rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-4 bg-indigo-50/40 dark:bg-indigo-900/20"},_t={key:0,class:"rounded-lg border border-gray-200 dark:border-slate-700 p-3"},Ut={class:"text-sm text-gray-700 dark:text-gray-200"},Tt={class:"text-xs text-gray-500 dark:text-gray-400 mt-1"},At={key:1,class:"rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"},Ct=["src"],St=["src"],Ot=["disabled"],$t={key:0,class:"doc-loading-spinner","aria-hidden":"true"},Dt={key:1,class:"doc-loading-dots","aria-hidden":"true"},Et={key:2,role:"status","aria-live":"polite",class:"rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3"},Bt={key:4,class:"rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-2"},It={class:"text-sm text-emerald-800 dark:text-emerald-300 break-all"},Rt={key:2,class:"space-y-6"},Nt={class:"flex flex-wrap items-center justify-between gap-3"},jt={class:"inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 shadow-inner"},Pt={key:1,class:"rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-5"},Xt=["disabled"],Lt={key:0,class:"doc-loading-spinner","aria-hidden":"true"},Gt={key:1,class:"rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-2"},Mt={class:"text-sm text-emerald-800 dark:text-emerald-300 break-all"},Wt=Q({__name:"doc-automate",setup(E){const W=m(null),c=m("menu"),v=m("use"),k=m("use"),f=m(null),d=m(""),q=m(!0),B=m(null),b=m(!1),i=m(""),_=m(!1),h=m(""),A=m(!1),C=m(""),S=m(!1),U=m(""),O=te().public.apiBase,R=a=>O.endsWith("/api")||O==="/api"?`${O}/${a}`:`${O}/api/${a}`,F=g(()=>!!f.value);function H(a){if(!Number.isFinite(a)||a<=0)return"0 B";const o=["B","KB","MB","GB"];let t=a,s=0;for(;t>=1024&&s<o.length-1;)t/=1024,s+=1;return`${t.toFixed(t>=10?0:1)} ${o[s]}`}function z(a){const o=a.target,t=o.files?.[0]||null;if(i.value="",_.value=!1,h.value="",d.value="",f.value=null,B.value=null,!t)return;if(!t.type.startsWith("image/")){i.value="รองรับเฉพาะไฟล์รูปภาพเท่านั้น",o&&(o.value="");return}if(t.size>5*1024*1024){i.value="ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ใหม่",o&&(o.value="");return}f.value=t;const s=t.type.startsWith("image/");q.value=s,d.value=URL.createObjectURL(t)}async function N(a){if(!a.type.startsWith("image/")||typeof window>"u"||a.size<=900*1024)return a;const o=await createImageBitmap(a),s=Math.min(1,1400/o.width),p=Math.max(1,Math.round(o.width*s)),X=Math.max(1,Math.round(o.height*s)),L=document.createElement("canvas");L.width=p,L.height=X;const ee=L.getContext("2d");if(!ee)return a;ee.drawImage(o,0,0,p,X);const V=await new Promise(se=>{L.toBlob(re=>se(re),"image/jpeg",.8)});return!V||V.size>=a.size?a:new File([V],a.name.replace(/\.[^.]+$/,".jpg"),{type:"image/jpeg"})}function K(a){return new Promise((o,t)=>{const s=new FileReader;s.onload=()=>{const p=String(s.result||""),X=p.includes(",")?p.split(",")[1]:p;o(X)},s.onerror=()=>t(new Error("อ่านไฟล์ไม่สำเร็จ")),s.readAsDataURL(a)})}async function J(){if(f.value){b.value=!0,i.value="",_.value=!1,h.value="";try{B.value=await N(f.value);const a=B.value||f.value;if(!a.type.startsWith("image/"))throw new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น");if(a.size>1200*1024)throw new Error("ไฟล์ใหญ่เกินกว่าที่ n8n รับได้ในตอนนี้ กรุณาใช้รูปเล็กลงหรือลดความละเอียด");const o=await K(a),t={file:{name:a.name,mimeType:a.type||"application/octet-stream",size:a.size,contentBase64:o}},s=await $fetch(R("admin/doc-automate/submit"),{method:"POST",credentials:"include",body:t});_.value=!0,h.value=String(s?.docUrl||""),i.value=s?.message||"สร้าง Google Doc สำเร็จแล้ว",h.value&&j()}catch(a){_.value=!1,i.value=a?.data?.error||a?.data?.message||a?.message||"ส่งเข้า n8n ไม่สำเร็จ"}finally{b.value=!1}}}function j(){h.value&&typeof window<"u"&&window.open(h.value,"_blank","noopener,noreferrer")}async function Y(){C.value="",S.value=!1,U.value="",A.value=!0;try{const a=await $fetch(R("admin/doc-automate/copy"),{method:"POST",credentials:"include",body:{source:"admin-doc-automate",mode:"copy-file",requestedAt:new Date().toISOString()}});U.value=String(a?.docUrl||""),S.value=!0,C.value=a?.message||"เรียกใช้งานโหมดทำสำเนาไฟล์สำเร็จแล้ว",U.value&&P()}catch(a){S.value=!1,C.value=a?.data?.error||a?.data?.message||a?.message||"เรียกใช้งานโหมดทำสำเนาไฟล์ไม่สำเร็จ"}finally{A.value=!1}}function P(){U.value&&typeof window<"u"&&window.open(U.value,"_blank","noopener,noreferrer")}return le({title:"UBU DocAutomate - Admin",meta:[{name:"description",content:"Admin tool สำหรับสร้างเอกสารจาก Google Doc template ผ่าน n8n"}]}),(a,o)=>{const t=de,s=it;return r(),n("div",mt,[e("div",pt,[e("div",gt,[e("div",bt,[o[9]||(o[9]=e("div",null,[e("p",{class:"inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-semibold"},"Admin Automation"),e("h1",{class:"mt-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"},"UBU DocAutomate"),e("p",{class:"mt-2 text-sm text-gray-600 dark:text-gray-300"}," อัปโหลดไฟล์หลักฐาน + กำหนดตำแหน่งใน Google Doc Template เพื่อส่งเข้า n8n ")],-1)),D(t,{to:"/",class:"inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 text-sm"},{default:ne(()=>[...o[8]||(o[8]=[l(" กลับหน้าหลัก ",-1)])]),_:1})])]),c.value==="menu"?(r(),n("div",ft,[e("button",{type:"button",class:"doc-menu-card group relative rounded-2xl overflow-hidden shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl","aria-label":"ทดลองแนบหลักฐาน",onClick:o[0]||(o[0]=p=>c.value="upload")},[...o[10]||(o[10]=[I('<img src="'+ut+'" alt="ทดลองแนบหลักฐาน" class="block w-full h-auto transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy" data-v-6e0f44ef><span class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800/60" data-v-6e0f44ef><span class="relative flex w-1.5 h-1.5" data-v-6e0f44ef><span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" data-v-6e0f44ef></span><span class="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" data-v-6e0f44ef></span></span> Integration ready </span><span class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-indigo-600/0 via-transparent to-cyan-400/0 group-hover:from-indigo-600/10 group-hover:to-cyan-400/10 transition-all duration-300" data-v-6e0f44ef></span>',3)])]),e("button",{type:"button",class:"doc-menu-card group relative rounded-2xl overflow-hidden shadow-md focus:outline-none focus:ring-4 focus:ring-cyan-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl","aria-label":"ทำสำเนาไฟล์มาทำต่อ",onClick:o[1]||(o[1]=p=>c.value="copy")},[...o[11]||(o[11]=[I('<img src="'+ct+'" alt="ทำสำเนาไฟล์" class="block w-full h-auto transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy" data-v-6e0f44ef><span class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800/60" data-v-6e0f44ef><span class="relative flex w-1.5 h-1.5" data-v-6e0f44ef><span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" data-v-6e0f44ef></span><span class="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" data-v-6e0f44ef></span></span> Integration ready </span><span class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-cyan-600/0 via-transparent to-blue-400/0 group-hover:from-cyan-600/10 group-hover:to-blue-400/10 transition-all duration-300" data-v-6e0f44ef></span>',3)])])])):c.value==="upload"?(r(),n("div",xt,[e("div",yt,[e("div",vt,[e("button",{type:"button",class:w(["px-4 py-1.5 rounded-lg text-sm font-medium transition",v.value==="use"?"bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow":"text-gray-600 dark:text-gray-300 hover:text-gray-900"]),onClick:o[2]||(o[2]=p=>v.value="use")},"ใช้งาน",2),e("button",{type:"button",class:w(["px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5",v.value==="integration"?"bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow":"text-gray-600 dark:text-gray-300 hover:text-gray-900"]),onClick:o[3]||(o[3]=p=>v.value="integration")},[...o[12]||(o[12]=[e("span",null,"วิธีนำไปใช้กับระบบอื่น",-1),e("span",{class:"text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"},"DEV",-1)])],2)]),e("button",{type:"button",class:"inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60",onClick:o[4]||(o[4]=p=>c.value="menu")}," กลับเมนู ")]),v.value==="integration"?(r(),T(s,{key:0,mode:"submit"})):(r(),n("div",kt,[o[18]||(o[18]=I('<div class="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4" data-v-6e0f44ef><div class="flex items-center justify-between gap-3" data-v-6e0f44ef><h2 class="text-lg font-semibold text-gray-900 dark:text-white" data-v-6e0f44ef>วิธีใช้งาน (แนบหลักฐาน)</h2></div><div class="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 p-4" data-v-6e0f44ef><ol class="space-y-2 text-sm text-gray-700 dark:text-gray-200" data-v-6e0f44ef><li data-v-6e0f44ef>1) อัปโหลดไฟล์หลักฐาน (รูปภาพเท่านั้น)</li><li data-v-6e0f44ef>2) กดปุ่ม “ส่งเข้า n8n เพื่อสร้าง Google Doc”</li><li data-v-6e0f44ef>3) ระบบจะสร้าง Google Doc ของผู้ใช้ที่ล็อกอิน จากเทมเพลตที่เตรียมไว้ให้อัตโนมัติ</li></ol><p class="mt-3 text-xs text-gray-500 dark:text-gray-400" data-v-6e0f44ef> หมายเหตุ: ตำแหน่งการวางไฟล์หลักฐานในเอกสารถูกกำหนดไว้ใน n8n workflow แล้ว </p></div></div>',1)),e("div",ht,[o[17]||(o[17]=e("h2",{class:"text-lg font-semibold text-gray-900 dark:text-white"},"แนบไฟล์หลักฐาน",-1)),e("div",wt,[e("input",{ref_key:"fileInput",ref:W,type:"file",accept:"image/*,.jpg,.jpeg,.png,.webp",class:"block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-700",onChange:z},null,544),o[13]||(o[13]=e("p",{class:"mt-2 text-xs text-gray-500 dark:text-gray-400"},"รองรับเฉพาะรูปภาพ ขนาดไม่เกิน 5MB",-1))]),f.value?(r(),n("div",_t,[e("p",Ut,[o[14]||(o[14]=e("span",{class:"font-medium"},"ไฟล์:",-1)),l(" "+u(f.value.name),1)]),e("p",Tt,"ขนาด: "+u(H(f.value.size)),1)])):x("",!0),d.value?(r(),n("div",At,[q.value?(r(),n("img",{key:0,src:d.value,alt:"Preview",class:"w-full max-h-72 object-contain"},null,8,Ct)):(r(),n("iframe",{key:1,src:d.value,class:"w-full h-72"},null,8,St))])):x("",!0),e("button",{disabled:b.value||!F.value,onClick:J,class:"w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"},[b.value?(r(),n("span",$t)):x("",!0),e("span",null,u(b.value?"กำลังส่งเข้า n8n":"ส่งเข้า n8n เพื่อสร้าง Google Doc"),1),b.value?(r(),n("span",Dt,[...o[15]||(o[15]=[e("span",null,".",-1),e("span",null,".",-1),e("span",null,".",-1)])])):x("",!0)],8,Ot),b.value?(r(),n("div",Et,[...o[16]||(o[16]=[e("p",{class:"text-sm font-medium text-amber-800 dark:text-amber-200"},"ระบบกำลังประมวลผลการสร้างเอกสาร กรุณารอสักครู่",-1),e("p",{class:"mt-1 text-xs text-amber-700/90 dark:text-amber-300/90"},"เพื่อป้องกันข้อมูลไม่ครบถ้วน โปรดอย่าปิดหน้าต่างหรือรีเฟรชหน้านี้จนกว่าระบบจะแจ้งผลสำเร็จ",-1),e("div",{class:"mt-3 h-1.5 rounded-full bg-amber-200/70 dark:bg-amber-800/70 overflow-hidden"},[e("div",{class:"doc-loading-progress h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"})],-1)])])):x("",!0),i.value?(r(),n("div",{key:3,class:w(["rounded-lg p-3 text-sm",_.value?"bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300":"bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"])},u(i.value),3)):x("",!0),h.value?(r(),n("div",Bt,[e("p",It,"Google Doc: "+u(h.value),1),e("button",{type:"button",onClick:j,class:"inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium"}," เปิด Google Doc ")])):x("",!0)])]))])):c.value==="copy"?(r(),n("div",Rt,[e("div",Nt,[e("div",jt,[e("button",{type:"button",class:w(["px-4 py-1.5 rounded-lg text-sm font-medium transition",k.value==="use"?"bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow":"text-gray-600 dark:text-gray-300 hover:text-gray-900"]),onClick:o[5]||(o[5]=p=>k.value="use")},"ใช้งาน",2),e("button",{type:"button",class:w(["px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5",k.value==="integration"?"bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow":"text-gray-600 dark:text-gray-300 hover:text-gray-900"]),onClick:o[6]||(o[6]=p=>k.value="integration")},[...o[19]||(o[19]=[e("span",null,"วิธีนำไปใช้กับระบบอื่น",-1),e("span",{class:"text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"},"DEV",-1)])],2)]),e("button",{type:"button",class:"inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60",onClick:o[7]||(o[7]=p=>c.value="menu")}," กลับเมนู ")]),k.value==="integration"?(r(),T(s,{key:0,mode:"copy"})):(r(),n("div",Pt,[o[20]||(o[20]=I('<div class="flex items-center justify-between gap-3 flex-wrap" data-v-6e0f44ef><div data-v-6e0f44ef><h2 class="text-lg font-semibold text-gray-900 dark:text-white" data-v-6e0f44ef>ทำสำเนาไฟล์มาทำต่อ</h2><p class="mt-1 text-sm text-gray-600 dark:text-gray-300" data-v-6e0f44ef> นี้ถูกแยกออกจากการแนบหลักฐาน เพื่อรองรับขั้นตอนทำสำเนาไฟล์ก่อนส่งงานต่อ </p></div></div><div class="rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-900/20 p-4" data-v-6e0f44ef><p class="text-sm text-gray-700 dark:text-gray-200" data-v-6e0f44ef> กดปุ่มด้านล่างเพื่อเริ่มทำสำเนาไฟล์ จากนั้นระบบจะเตรียมเอกสารให้พร้อมใช้งานต่อทันที </p><p class="mt-2 text-xs text-gray-500 dark:text-gray-400" data-v-6e0f44ef> เมนูนี้ใช้สำหรับงานทำสำเนาไฟล์โดยเฉพาะ เพื่อให้แยกจากเมนูแนบหลักฐานอย่างชัดเจน </p></div>',2)),e("button",{type:"button",disabled:A.value,onClick:Y,class:"w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"},[A.value?(r(),n("span",Lt)):x("",!0),e("span",null,u(A.value?"กำลังทำสำเนาไฟล์":"ทำสำเนาไฟล์"),1)],8,Xt),C.value?(r(),n("div",{key:0,class:w(["rounded-lg p-3 text-sm",S.value?"bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300":"bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"])},u(C.value),3)):x("",!0),U.value?(r(),n("div",Gt,[e("p",Mt,"Google Doc: "+u(U.value),1),e("button",{type:"button",onClick:P,class:"inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium"}," เปิด Google Doc ")])):x("",!0)]))])):x("",!0)])])}}}),Ft=oe(Wt,[["__scopeId","data-v-6e0f44ef"]]);export{Ft as default};
