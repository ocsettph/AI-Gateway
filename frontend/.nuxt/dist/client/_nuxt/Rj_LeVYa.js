import{f as Ve,u as Ge,h as ye,r as l,g as M,i as qe,H as ze,c as r,a as t,b as oe,x as h,l as y,y as k,n as w,F as R,m as V,d as W,t as u,B as Ae,w as ae,E as se,v as He,k as re,I as D,T as we,e as We,o as n,_ as De}from"#entry";const Ye={class:"min-h-screen py-8 md:py-12"},Qe={class:"mx-auto max-w-7xl space-y-8"},Ke={class:"grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"},Xe={class:"rounded-2xl border border-gray-200 bg-white p-5"},Ze={class:"grid gap-4 md:grid-cols-2"},et={class:"space-y-1 text-sm md:col-span-2"},tt={class:"space-y-1 text-sm"},ot={class:"space-y-1 text-sm"},at={class:"space-y-1 text-sm md:col-span-2"},st={class:"mt-2 flex flex-wrap gap-2"},rt=["onClick"],nt={class:"ml-2 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"},lt={class:"mb-2 flex items-center justify-between"},it={class:"flex items-center gap-2"},dt={class:"space-y-2"},ut=["src","alt"],ct={class:"text-sm font-semibold text-gray-800"},bt={class:"text-xs text-gray-600"},pt={class:"rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"},gt=["onChange"],mt={class:"mt-3 space-y-2"},xt={key:0,class:"mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3"},ft={class:"mt-2 overflow-x-auto text-xs text-blue-900"},vt={key:1,class:"mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"},ht={class:"flex items-start gap-3"},yt={class:"min-w-0 flex-1"},wt={key:0,class:"mt-3"},kt={key:1,class:"mt-3 rounded-lg border border-amber-200 bg-white p-3"},Ct={key:0,class:"mt-1 text-xs text-gray-600"},_t={key:2,class:"mt-3 rounded-lg border border-rose-200 bg-white p-3"},St={key:3,class:"mt-3"},Nt={class:"block space-y-1 text-xs"},Tt={class:"block space-y-1 text-xs"},$t={class:"block space-y-1 text-xs"},Bt={class:"block space-y-1 text-xs"},It={class:"flex flex-wrap gap-2"},Ot=["disabled"],Ut={key:0,class:"text-xs text-rose-600"},jt={class:"flex items-center justify-between"},Lt={class:"relative mt-4 h-[470px] overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white p-4"},Et=["src"],Mt={key:1,class:"absolute bottom-4 right-4 flex h-[400px] w-[320px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"},Rt={class:"flex items-center gap-2"},Ft=["src"],Pt={class:"text-xs font-semibold"},Jt={class:"text-[10px] opacity-90"},Vt={class:"flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3"},Gt={class:"flex gap-2"},qt=["src"],zt=["innerHTML"],At=["src"],Ht={key:0},Wt=["innerHTML"],Dt={key:0,class:"flex justify-start"},Yt={class:"flex items-start gap-2"},Qt=["src"],Kt=["disabled"],Xt=["disabled"],Zt={key:0,class:"h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},eo={key:1,class:"h-4 w-4 animate-spin",fill:"none",viewBox:"0 0 24 24"},to={key:0,class:"rounded-2xl border border-gray-200 bg-white p-5"},oo={class:"mt-3 flex flex-wrap gap-2"},ao={class:"self-center text-xs text-gray-500"},so={class:"mt-4 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs"},ro={class:"mt-4 flex flex-wrap gap-2"},no=["onClick"],lo={class:"mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3"},io={class:"text-xs font-semibold uppercase tracking-wide text-gray-600"},uo={class:"mt-2 list-decimal space-y-1 pl-5 text-xs text-gray-700"},co={class:"mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs"},bo={key:0,class:"fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-2xl"},po={class:"w-full max-w-3xl rounded-2xl bg-white p-3 shadow-2xl md:p-4"},go={class:"mb-3 flex items-center justify-between"},mo="/examples/chatbot-demo-flow.json",xo=Ve({__name:"chatbot",setup(fo){Ge({title:"Chatbot Popup Sandbox - UBU AI SERVICE",meta:[{name:"description",content:"ทดสอบ popup chatbot โดยใส่ webhook n8n และมาสคอตของตัวเอง"}]});const m=ye().public.basePath||"/",G=ye().public.apiBase,ne=a=>G.endsWith("/api")||G==="/api"?`${G}/${a}`:`${G}/api/${a}`,_=l(!0),S=l(!1),T=l(""),x=l("พร้อมทดสอบ"),I=l("welcome"),$=l(null),F=l("กำลังโหลดไฟล์ flow..."),Y=l(null),Q=l(null),le=l(null),ie=l(null),de=l(null),ue=l(null),ce=l(null),be=l(null),pe=l(null),c=l("loading"),K=l(null),O=l(!1),q=l(!1),z=l(""),f=l({projectName:"",websiteUrl:"",usageType:"",purpose:""}),C=M(()=>c.value==="approved"),s=l({webhookUrl:"https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat",botName:"น้องบัวบาน",mascotName:"บัวบาน",welcomeMessage:"น้องบัวบาน ยินดีต้อนรับ 🥰",headerColor:"#FFBF00"}),ke=["#4f46e5","#0ea5e9","#16a34a","#f97316","#e11d48","#111827"],X=[{key:"happy",description:"ใช้เมื่อหาข้อมูลพบ (Success) หรือแนะนำเรื่องสนุกๆ"},{key:"thinking",description:"ใช้เมื่อกำลังวิเคราะห์คำถามที่ซับซ้อน"},{key:"searching",description:"ใช้เมื่อหาในไฟล์ไม่เจอและกำลังจะไปหาใน Google/Web"},{key:"sorry",description:"ใช้เมื่อหาข้อมูลไม่เจอจริงๆ หรือต้องแนะนำให้ไปหาเจ้าหน้าที่"},{key:"welcome",description:"ใช้ทักทายตอนเริ่มแชท"}],p=l({happy:`${m}mascots/happy.svg`,thinking:`${m}mascots/thinking.svg`,searching:`${m}mascots/BuaBan.svg`,sorry:`${m}mascots/sorry.svg`,welcome:`${m}mascots/welcome.svg`}),ge={mascot:"บัวบาน",expression:"happy",answer:"สวัสดีครับ นี่คือข้อความตัวอย่างจาก n8n",source:"https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat"},U=l(JSON.stringify(ge,null,2)),Ce=JSON.stringify({mascot:"Ubie",expression:"ชื่อท่าทาง",answer:"เนื้อหาคำตอบของคุณ... รองรับลิงก์แบบ [ข้อความ](https://example.com)",source:"ชื่อไฟล์หรือ URL"},null,2),j=l([]),L=l("html"),me=[{id:"html",label:"HTML/Vanilla JS"},{id:"node",label:"Node.js (Express)"},{id:"php",label:"PHP (cURL)"}],_e=M(()=>({html:`<!-- วางโค้ดนี้ก่อน </body> ในไฟล์หน้าเว็บของคุณ (UI เดียวกับ Chatbot Sandbox) -->
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
      <img id="ubu-chatbot-launcher-img" class="mascot-img" src="${p.value.welcome}" alt="${s.value.mascotName}" />
    </button>
  </div>
  <div id="ubu-chatbot-panel" class="panel" style="display:flex;">
    <div id="ubu-chatbot-header" class="header">
      <div class="header-left">
        <img id="ubu-chatbot-header-img" class="header-avatar" src="${p.value.welcome}" alt="mascot" />
        <div>
          <div id="ubu-chatbot-header-name" class="header-name">${s.value.botName}</div>
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
  webhookUrl: "${s.value.webhookUrl}",
  botName: "${s.value.botName.replace(/"/g,'\\"')}",
  headerColor: "${s.value.headerColor}",
  welcomeMessage: "${s.value.welcomeMessage.replace(/"/g,'\\"')}",
  mascotName: "${s.value.mascotName.replace(/"/g,'\\"')}",
  mascotImages: {
    happy: "${p.value.happy}",
    thinking: "${p.value.thinking}",
    searching: "${p.value.searching}",
    sorry: "${p.value.sorry}",
    welcome: "${p.value.welcome}"
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
<\/script>`,node:`import express from "express";
import fetch from "node-fetch";
const app = express();
app.use(express.json());

const BOT_CONFIG = {
  webhookUrl: "${s.value.webhookUrl}",
  headerColor: "${s.value.headerColor}",
  welcomeMessage: "${s.value.welcomeMessage.replace(/"/g,'\\"')}"
};

app.post("/chat", async (req, res) => {
  const r = await fetch(BOT_CONFIG.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: req.body.message, message: req.body.message })
  });
  const data = await r.json();
  res.json(data);
});`,php:`<?php
$BOT_CONFIG = [
  "webhookUrl" => "${s.value.webhookUrl}",
  "headerColor" => "${s.value.headerColor}",
  "welcomeMessage" => "${s.value.welcomeMessage.replace(/"/g,'\\"')}"
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
?>`})),xe=M(()=>_e.value[L.value]),Se=M(()=>me.find(a=>a.id===L.value)?.label||""),Ne=M(()=>L.value==="html"?["เปิดไฟล์หน้าเว็บหลัก เช่น index.html หรือไฟล์ layout หลัก","วางโค้ดทั้งก้อนจากด้านล่างก่อนแท็กปิด </body>","บันทึกไฟล์และรีโหลดหน้าเว็บ","โหลดหน้าเว็บแล้วแชทจะเปิดทันที ถ้าปิดไปให้กดมาสคอตมุมขวาล่างเพื่อเปิดใหม่"]:L.value==="node"?["เปิดไฟล์ backend เช่น app.js / server.js","วางโค้ดตัวอย่างให้เกิด endpoint /chat","ติดตั้งแพ็กเกจที่จำเป็น (express, node-fetch) และรีสตาร์ตเซิร์ฟเวอร์","ให้ frontend เรียก endpoint /chat ของเว็บตัวเอง"]:["สร้างไฟล์ใหม่ เช่น chatbot-proxy.php","วางโค้ดตัวอย่างลงไฟล์และบันทึก","เรียกไฟล์นี้จากหน้าเว็บด้วย fetch หรือ form POST","ทดสอบว่าคืน JSON ได้ก่อนเชื่อมกับ UI popup"]),N=l({show:!1,message:""});let E=null;const fe=`${m}mascots/UBU_BuaBan.png`,A=l(!1),Z=M(()=>p.value[I.value]||p.value.happy);function ve(a){let e=a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");const i=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;return e.replace(i,(o,d,g)=>`<a href="${g}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline; font-weight: bold;">${d}</a>`)}function Te(a){return new Promise((e,i)=>{const o=new FileReader;o.onload=()=>e(String(o.result||"")),o.onerror=()=>i(new Error("file-read-failed")),o.readAsDataURL(a)})}async function $e(a,e){const o=e.target.files?.[0];if(o)try{const d=await Te(o);p.value[a]=d,x.value=`อัปโหลดรูปท่า ${a} แล้ว`}catch{x.value="อัปโหลดรูปไม่สำเร็จ"}}function Be(){if(!C.value){ee();return}const a=["BuaBan.svg","happy.svg","thinking.svg","searching.svg","sorry.svg","welcome.svg","UBU_BuaBan.png"];for(const e of a){const i=document.createElement("a");i.href=`${m}mascots/${e}`,i.download=e,document.body.appendChild(i),i.click(),i.remove()}x.value="เริ่มดาวน์โหลดชุดมาสคอตแล้ว"}function ee(){O.value=c.value==="none"||c.value==="rejected",pe.value?.scrollIntoView({behavior:"smooth",block:"center"})}async function H(){c.value="loading";try{const a=await $fetch(ne("chatbot/code-access"),{credentials:"include"});if(K.value=a.request||null,a.access){c.value="approved";return}c.value=a.status||"none"}catch(a){(a?.status||a?.statusCode)===401?c.value="unauthenticated":c.value="none"}}async function Ie(){z.value="",q.value=!0;try{await $fetch(ne("chatbot/code-request"),{method:"POST",credentials:"include",body:{projectName:f.value.projectName,websiteUrl:f.value.websiteUrl,purpose:f.value.purpose,usageType:f.value.usageType}}),O.value=!1,c.value="pending",x.value="ส่งคำขอรับโค้ดแล้ว รอผู้ดูแลอนุมัติ",N.value={show:!0,message:"ส่งคำขอเรียบร้อย"},E&&clearTimeout(E),E=setTimeout(()=>{N.value={show:!1,message:""}},1800),await H()}catch(a){z.value=a?.data?.message||a?.data?.error||"ส่งคำขอไม่สำเร็จ กรุณาลองใหม่"}finally{q.value=!1}}function Oe(){A.value=!0}function Ue(){U.value=JSON.stringify({mascot:s.value.mascotName||"MyMascot",expression:"happy",answer:"ข้อความทดสอบจาก payload editor",source:s.value.webhookUrl},null,2)}function je(){try{const a=JSON.parse(U.value);if(!a.answer)throw new Error("invalid");j.value.push({role:"assistant",content:String(a.answer)});const e=String(a.expression||"happy").toLowerCase();I.value=X.some(i=>i.key===e)?e:"sorry",x.value="Apply สำเร็จ"}catch{x.value="JSON ไม่ถูกต้อง"}}function Le(a){const e=v=>{const b=v.trim(),he=b.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);return he?he[1].trim():b},i=v=>{if(typeof v!="string")return v;const b=e(v);if(!b)return v;if(b.startsWith("{")&&b.endsWith("}")||b.startsWith("[")&&b.endsWith("]"))try{return JSON.parse(b)}catch{return v}return v},o=i(a),d=i(o?.output),g=typeof d=="object"&&d!==null?d:o;let J=g?.answer??g?.message??g?.text??g?.response??(typeof g?.output=="string"?g.output:"")??"";if(typeof J=="string"){const v=e(J),b=i(v);typeof b=="object"&&b!==null?J=b.answer??b.message??b.text??v:J=v}return{mascot:String(g?.mascot||o?.mascot||s.value.mascotName||"บัวบาน"),expression:String(g?.expression||o?.expression||"sorry"),answer:String(J||"ไม่มีคำตอบจาก webhook"),source:String(g?.source||o?.source||s.value.webhookUrl)}}async function Ee(){if(!T.value.trim()||S.value)return;const a=T.value.trim();T.value="",j.value.push({role:"user",content:a}),I.value="thinking",S.value=!0;try{const e=await fetch(s.value.webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatInput:a,message:a,mascot:s.value.mascotName,mode:"build"})});if(!e.ok)throw new Error(String(e.status));const i=await e.json(),o=Le(i),d=(o.expression||"").toLowerCase();I.value=X.some(g=>g.key===d)?d:"sorry",j.value.push({role:"assistant",content:o.answer}),x.value=`ตอบกลับจาก ${o.source||"webhook"}`}catch{j.value.push({role:"assistant",content:"เชื่อมต่อ webhook ไม่สำเร็จ กรุณาตรวจสอบ URL หรือ CORS"}),x.value="Webhook error"}finally{S.value=!1}}function Me(){_.value=!1,I.value="welcome",s.value={webhookUrl:"https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat",botName:"UBU AI Bot",mascotName:"บัวบาน",welcomeMessage:"น้องบัวบานแทน",headerColor:"#4f46e5"},p.value={happy:`${m}mascots/happy.svg`,thinking:`${m}mascots/thinking.svg`,searching:`${m}mascots/BuaBan.svg`,sorry:`${m}mascots/sorry.svg`,welcome:`${m}mascots/welcome.svg`},j.value=[],U.value=JSON.stringify(ge,null,2),x.value="รีเซ็ตเรียบร้อย"}async function te(a,e){try{await navigator.clipboard.writeText(a),x.value=e,N.value={show:!0,message:e},E&&clearTimeout(E),E=setTimeout(()=>{N.value={show:!1,message:""}},1800)}catch{x.value="คัดลอกไม่สำเร็จ",N.value={show:!0,message:"คัดลอกไม่สำเร็จ"}}}function Re(){te(U.value,"คัดลอก JSON แล้ว")}function Fe(){te(xe.value,"คัดลอกโค้ดติดตั้งแล้ว")}function Pe(){te(F.value,"คัดลอก n8n flow แล้ว")}function P(a){a&&a.scrollIntoView({behavior:"smooth",block:"center"})}function B(a){if((a==="flow"||a==="install")&&!C.value){ee();return}$.value=a,a==="webhook"?(Y.value?.scrollIntoView({behavior:"smooth",block:"center"}),Y.value?.focus()):a==="profile"?(Q.value?.scrollIntoView({behavior:"smooth",block:"center"}),Q.value?.focus(),le.value?.focus()):a==="color"?P(ie.value):a==="expression"?P(de.value):a==="preview"?(_.value=!0,P(ue.value)):a==="flow"?P(ce.value):a==="install"&&P(be.value),setTimeout(()=>{$.value=null},2500)}function Je(){const a=new Blob([F.value],{type:"application/json;charset=utf-8"}),e=URL.createObjectURL(a),i=document.createElement("a");i.href=e,i.download="chatbot-demo-flow.json",i.click(),URL.revokeObjectURL(e),N.value={show:!0,message:"ดาวน์โหลดไฟล์ flow แล้ว"}}return qe(async()=>{await H(),window.addEventListener("user-login-success",H);try{const a=await fetch(mo);if(!a.ok)throw new Error("flow-load-failed");F.value=await a.text()}catch{F.value=`{
  "error": "โหลดไฟล์ flow ไม่สำเร็จ"
}`}}),ze(()=>{window.removeEventListener("user-login-success",H)}),(a,e)=>{const i=We;return n(),r("div",Ye,[t("div",Qe,[e[63]||(e[63]=t("section",{class:"rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-6 md:p-8"},[t("p",{class:"text-sm font-semibold uppercase tracking-wide text-amber-700"},"Chatbot Popup Sandbox"),t("h1",{class:"mt-2 text-2xl font-bold text-gray-900 md:text-4xl"},"สร้างและทดสอบบอทได้ทันที"),t("p",{class:"mt-2 text-sm text-gray-700"},"ตั้งค่า webhook, สี, รูปท่าทาง และลองแชทกับ popup preview ได้ทันที — พร้อมนำไปใช้งานจริงแล้วสามารถขอรับโค้ดติดตั้งและชุดมาสคอตได้")],-1)),t("section",Ke,[t("article",Xe,[t("div",{class:"mb-4 flex items-center justify-between"},[e[26]||(e[26]=t("h2",{class:"text-lg font-semibold text-gray-900"},"Step 2 · ตั้งค่าบอท",-1)),t("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200",onClick:Me},"รีเซ็ต")]),t("div",Ze,[t("label",et,[e[27]||(e[27]=t("span",{class:"font-medium text-gray-700"},"Webhook URL (n8n)",-1)),y(t("input",{ref_key:"webhookInputRef",ref:Y,"onUpdate:modelValue":e[0]||(e[0]=o=>s.value.webhookUrl=o),class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",type:"url"},null,512),[[k,s.value.webhookUrl]])]),t("label",tt,[e[28]||(e[28]=t("span",{class:"font-medium text-gray-700"},"ชื่อบอท",-1)),y(t("input",{ref_key:"botNameInputRef",ref:Q,"onUpdate:modelValue":e[1]||(e[1]=o=>s.value.botName=o),class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",type:"text"},null,512),[[k,s.value.botName]])]),t("label",ot,[e[29]||(e[29]=t("span",{class:"font-medium text-gray-700"},"ชื่อมาสคอต",-1)),y(t("input",{"onUpdate:modelValue":e[2]||(e[2]=o=>s.value.mascotName=o),class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",type:"text"},null,512),[[k,s.value.mascotName]])]),t("label",at,[e[30]||(e[30]=t("span",{class:"font-medium text-gray-700"},"ข้อความต้อนรับ (welcome)",-1)),y(t("textarea",{ref_key:"welcomeInputRef",ref:le,"onUpdate:modelValue":e[3]||(e[3]=o=>s.value.welcomeMessage=o),rows:"2",class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"},null,512),[[k,s.value.welcomeMessage]])])]),t("div",{ref_key:"colorSectionRef",ref:ie,class:w(["mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3",$.value==="color"?"ring-2 ring-amber-300":""])},[e[32]||(e[32]=t("p",{class:"text-xs font-semibold uppercase tracking-wide text-gray-500"},"สีแถบหัวแชท",-1)),t("div",st,[(n(),r(R,null,V(ke,o=>t("button",{key:o,class:w(["h-8 w-8 rounded-full ring-2 ring-offset-2 transition",s.value.headerColor===o?"ring-gray-800":"ring-transparent"]),style:D({backgroundColor:o}),onClick:d=>s.value.headerColor=o},null,14,rt)),64)),t("label",nt,[e[31]||(e[31]=W(" เลือกสีเอง ",-1)),y(t("input",{"onUpdate:modelValue":e[4]||(e[4]=o=>s.value.headerColor=o),type:"color",class:"h-6 w-8 cursor-pointer border-0 bg-transparent p-0"},null,512),[[k,s.value.headerColor]])])])],2),t("div",{ref_key:"expressionSectionRef",ref:de,class:w(["mt-4 rounded-xl border border-gray-200 p-3",$.value==="expression"?"ring-2 ring-amber-300":""])},[t("div",lt,[e[36]||(e[36]=t("h3",{class:"text-sm font-semibold text-gray-800"},"Step 3 · ใส่รูปตามท่าทาง",-1)),t("div",it,[t("button",{type:"button",class:"inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50",title:"ดูรูปเต็ม",onClick:Oe},[t("img",{src:fe,alt:"UBU BuaBan Poster",class:"h-7 w-7 rounded object-cover"}),e[33]||(e[33]=t("span",{class:"text-xs text-gray-600"},"BuaBan Mascot",-1))]),C.value?(n(),r("button",{key:0,type:"button",class:"inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-50",onClick:Be},[...e[34]||(e[34]=[t("svg",{class:"h-3.5 w-3.5",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"})],-1),W(" ดาวน์โหลดชุดมาสคอต ",-1)])])):(n(),r("button",{key:1,type:"button",class:"inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 transition hover:bg-amber-100",onClick:ee}," ขอดาวน์โหลดชุดมาสคอต ")),e[35]||(e[35]=t("span",{class:"text-xs text-gray-500"},"อัปโหลดไม่ถาวร (รีเฟรชแล้วหาย)",-1))])]),t("div",dt,[(n(),r(R,null,V(X,o=>t("div",{key:o.key,class:"grid gap-2 rounded-lg border border-gray-200 p-2 md:grid-cols-[64px_1fr_auto] md:items-center"},[t("img",{src:p.value[o.key],alt:o.key,class:"h-14 w-14 rounded-lg object-cover"},null,8,ut),t("div",null,[t("p",ct,u(o.key),1),t("p",bt,u(o.description),1)]),t("label",pt,[e[37]||(e[37]=W(" อัปโหลดรูป ",-1)),t("input",{type:"file",accept:"image/*",class:"hidden",onChange:d=>$e(o.key,d)},null,40,gt)])])),64))])],2)]),t("article",{ref_key:"requestPanelRef",ref:pe,class:"rounded-2xl border border-gray-200 bg-white p-5"},[e[52]||(e[52]=t("h3",{class:"text-base font-semibold text-gray-900"},"ขั้นตอนทดสอบ (เปิดให้ทุกคน)",-1)),t("div",mt,[t("button",{type:"button",onClick:e[5]||(e[5]=o=>B("webhook")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 1) กรอก Webhook URL "),t("button",{type:"button",onClick:e[6]||(e[6]=o=>B("profile")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 2) ตั้งชื่อบอท + ข้อความต้อนรับ "),t("button",{type:"button",onClick:e[7]||(e[7]=o=>B("color")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 3) เลือกสีหัวแชท "),t("button",{type:"button",onClick:e[8]||(e[8]=o=>B("expression")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 4) อัปโหลดรูปท่าทางทั้ง 5 expression "),t("button",{type:"button",onClick:e[9]||(e[9]=o=>B("preview")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 5) เปิด Popup Preview และลองคุยจริง "),C.value?(n(),r(R,{key:0},[t("button",{type:"button",onClick:e[10]||(e[10]=o=>B("flow")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 6) ตัวอย่าง n8n Flow (Demo) "),t("button",{type:"button",onClick:e[11]||(e[11]=o=>B("install")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 7) Copy โค้ดไปปลั๊กเว็บของคุณ ")],64)):h("",!0)]),C.value?(n(),r("div",xt,[e[38]||(e[38]=t("p",{class:"text-xs font-medium text-blue-700"},"JSON Contract",-1)),t("pre",ft,u(Ae(Ce)),1)])):(n(),r("div",vt,[t("div",ht,[e[51]||(e[51]=t("div",{class:"rounded-full bg-amber-100 p-2 text-amber-700"},[t("svg",{class:"h-5 w-5",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})])],-1)),t("div",yt,[e[49]||(e[49]=t("p",{class:"text-sm font-semibold text-amber-900"},"ขอรับโค้ดติดตั้งและเอกสารเทคนิค",-1)),e[50]||(e[50]=t("p",{class:"mt-1 text-xs text-amber-800"}," ทดสอบ webhook และ preview ได้เลย เมื่อพร้อมนำไปใช้งานจริง ส่งคำขอพร้อมบอกวัตถุประสงค์เพื่อรับโค้ดปลั๊กเว็บ ชุดมาสคอต และตัวอย่าง n8n ",-1)),c.value==="unauthenticated"?(n(),r("div",wt,[oe(i,{to:"/login",class:"inline-flex rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"},{default:ae(()=>[...e[39]||(e[39]=[W(" เข้าสู่ระบบเพื่อส่งคำขอ ",-1)])]),_:1})])):c.value==="pending"?(n(),r("div",kt,[e[40]||(e[40]=t("p",{class:"text-xs font-semibold text-amber-800"},"คำขอของคุณอยู่ระหว่างรออนุมัติ",-1)),K.value?.project_name?(n(),r("p",Ct,"โปรเจกต์: "+u(K.value.project_name),1)):h("",!0),e[41]||(e[41]=t("p",{class:"mt-1 text-xs text-gray-500"},"ผู้ดูแลระบบจะตรวจสอบและแจ้งผลทางอีเมลหรือระบบแจ้งเตือน",-1))])):c.value==="rejected"?(n(),r("div",_t,[e[42]||(e[42]=t("p",{class:"text-xs font-semibold text-rose-700"},"คำขอล่าสุดถูกปฏิเสธ",-1)),e[43]||(e[43]=t("p",{class:"mt-1 text-xs text-gray-600"},"คุณสามารถส่งคำขอใหม่พร้อมรายละเอียดที่ชัดเจนขึ้นได้",-1)),t("button",{type:"button",class:"mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700",onClick:e[12]||(e[12]=o=>O.value=!0)}," ส่งคำขอใหม่ ")])):c.value==="none"?(n(),r("div",St,[t("button",{type:"button",class:"rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700",onClick:e[13]||(e[13]=o=>O.value=!0)}," ขอรับโค้ดติดตั้ง ")])):h("",!0),O.value&&c.value!=="pending"&&c.value!=="unauthenticated"?(n(),r("form",{key:4,class:"mt-4 space-y-3",onSubmit:se(Ie,["prevent"])},[t("label",Nt,[e[44]||(e[44]=t("span",{class:"font-medium text-gray-700"},"ชื่อโปรเจกต์ / เว็บไซต์ที่จะใช้ *",-1)),y(t("input",{"onUpdate:modelValue":e[14]||(e[14]=o=>f.value.projectName=o),required:"",type:"text",class:"w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100",placeholder:"เช่น เว็บคณะวิศวกรรมศาสตร์"},null,512),[[k,f.value.projectName]])]),t("label",Tt,[e[45]||(e[45]=t("span",{class:"font-medium text-gray-700"},"URL เว็บไซต์ (ถ้ามี)",-1)),y(t("input",{"onUpdate:modelValue":e[15]||(e[15]=o=>f.value.websiteUrl=o),type:"url",class:"w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100",placeholder:"https://example.ubu.ac.th"},null,512),[[k,f.value.websiteUrl]])]),t("label",$t,[e[47]||(e[47]=t("span",{class:"font-medium text-gray-700"},"ประเภทการใช้งาน *",-1)),y(t("select",{"onUpdate:modelValue":e[16]||(e[16]=o=>f.value.usageType=o),required:"",class:"w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"},[...e[46]||(e[46]=[re('<option value="" data-v-ba64d3b0>เลือกประเภท</option><option value="เว็บหน่วยงาน" data-v-ba64d3b0>เว็บหน่วยงาน / คณะ</option><option value="การเรียนการสอน" data-v-ba64d3b0>การเรียนการสอน</option><option value="งานวิจัย" data-v-ba64d3b0>งานวิจัย / โปรเจกต์</option><option value="บริการประชาชน" data-v-ba64d3b0>บริการประชาชน / FAQ</option><option value="อื่นๆ" data-v-ba64d3b0>อื่นๆ</option>',6)])],512),[[He,f.value.usageType]])]),t("label",Bt,[e[48]||(e[48]=t("span",{class:"font-medium text-gray-700"},"จะนำไปใช้อย่างไร? *",-1)),y(t("textarea",{"onUpdate:modelValue":e[17]||(e[17]=o=>f.value.purpose=o),required:"",rows:"4",class:"w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100",placeholder:"อธิบายว่าจะใช้ chatbot ตอบคำถามอะไร ใครเป็นผู้ใช้งาน และจะติดตั้งที่ไหน..."},null,512),[[k,f.value.purpose]])]),t("div",It,[t("button",{type:"submit",disabled:q.value,class:"rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"},u(q.value?"กำลังส่ง...":"ส่งคำขอ"),9,Ot),t("button",{type:"button",class:"rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:e[18]||(e[18]=o=>O.value=!1)}," ยกเลิก ")]),z.value?(n(),r("p",Ut,u(z.value),1)):h("",!0)],32)):h("",!0)])])]))],512)]),t("section",{class:w(["grid gap-6",C.value?"xl:grid-cols-[1fr_1fr]":""])},[t("article",{ref_key:"previewSectionRef",ref:ue,class:w(["rounded-2xl border border-gray-200 bg-white p-5",$.value==="preview"?"ring-2 ring-amber-300":""])},[t("div",jt,[e[53]||(e[53]=t("div",null,[t("h2",{class:"text-lg font-semibold text-gray-900"},"Step 4 · Popup Preview (Realtime)"),t("p",{class:"mt-1 text-sm text-gray-600"},"แก้ค่าด้านบนแล้ว preview เปลี่ยนทันที")],-1)),t("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200",onClick:e[19]||(e[19]=o=>_.value=!_.value)},u(_.value?"ปิด popup":"แสดง popup"),1)]),t("div",Lt,[e[57]||(e[57]=t("div",{class:"absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow"},"Sandbox",-1)),_.value?(n(),r("div",Mt,[t("div",{class:"flex items-center justify-between px-3 py-2 text-white",style:D({backgroundColor:s.value.headerColor})},[t("div",Rt,[t("img",{src:Z.value,alt:"mascot",class:"h-8 w-8 rounded-full bg-white object-cover p-0.5"},null,8,Ft),t("div",null,[t("p",Pt,u(s.value.botName),1),t("p",Jt,u(I.value),1)])]),t("button",{class:"rounded p-1 text-xs hover:bg-black/20",onClick:e[21]||(e[21]=o=>_.value=!1)},"x")],4),t("div",Vt,[t("div",Gt,[t("img",{src:p.value.welcome,alt:"welcome",class:"h-8 w-8 rounded-full object-cover"},null,8,qt),t("div",{class:"max-w-[82%] rounded-xl rounded-tl-none bg-white px-3 py-2 text-xs text-gray-800 shadow-sm",innerHTML:ve(s.value.welcomeMessage)},null,8,zt)]),(n(!0),r(R,null,V(j.value,(o,d)=>(n(),r("div",{key:d,class:w(["flex",o.role==="user"?"justify-end":"justify-start"])},[t("div",{class:w(["flex items-start gap-2",o.role==="user"?"flex-row-reverse":""])},[o.role==="assistant"?(n(),r("img",{key:0,src:Z.value,alt:"assistant",class:"h-8 w-8 rounded-full object-cover"},null,8,At)):h("",!0),t("div",{class:w(["max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-sm",o.role==="user"?"text-white":"bg-white text-gray-800"]),style:D(o.role==="user"?{backgroundColor:s.value.headerColor}:void 0)},[o.role==="user"?(n(),r("span",Ht,u(o.content),1)):(n(),r("span",{key:1,innerHTML:ve(o.content)},null,8,Wt))],6)],2)],2))),128)),S.value?(n(),r("div",Dt,[t("div",Yt,[t("img",{src:p.value.thinking,alt:"assistant-loading",class:"h-8 w-8 rounded-full object-cover"},null,8,Qt),e[54]||(e[54]=re('<div class="rounded-xl bg-white px-3 py-2 text-xs text-gray-700 shadow-sm" data-v-ba64d3b0><span class="inline-flex items-center gap-1" data-v-ba64d3b0><span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" data-v-ba64d3b0></span><span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" data-v-ba64d3b0></span><span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" data-v-ba64d3b0></span><span class="ml-1 text-[11px] text-gray-500" data-v-ba64d3b0>กำลังพิมพ์...</span></span></div>',1))])])):h("",!0)]),t("form",{class:"flex gap-2 border-t border-gray-100 p-2",onSubmit:se(Ee,["prevent"])},[y(t("input",{"onUpdate:modelValue":e[22]||(e[22]=o=>T.value=o),disabled:S.value,placeholder:"พิมพ์ข้อความ...",class:"min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"},null,8,Kt),[[k,T.value]]),t("button",{type:"submit",disabled:S.value||!T.value.trim(),class:"inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white/80 disabled:shadow-none",style:D(!S.value&&T.value.trim()?{backgroundColor:s.value.headerColor}:void 0),"aria-label":"ส่งข้อความ"},[S.value?(n(),r("svg",eo,[...e[56]||(e[56]=[t("circle",{class:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor","stroke-width":"4"},null,-1),t("path",{class:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"},null,-1)])])):(n(),r("svg",Zt,[...e[55]||(e[55]=[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8"},null,-1)])]))],12,Xt)],32)])):(n(),r("button",{key:0,class:"absolute bottom-4 right-4 rounded-full bg-transparent p-0 drop-shadow-lg transition-transform duration-200 hover:scale-105",onClick:e[20]||(e[20]=o=>_.value=!0),"aria-label":"เปิดแชทบอท"},[t("img",{src:Z.value,alt:"mascot",class:"h-14 w-14 animate-bounce object-contain"},null,8,Et)]))])],2),C.value?(n(),r("article",to,[e[58]||(e[58]=t("h2",{class:"text-lg font-semibold text-gray-900"},"Live JSON Inspector",-1)),e[59]||(e[59]=t("p",{class:"mt-1 text-sm text-gray-600"},"ปรับค่าแล้วลองส่งแชทได้ทันที ถ้าต้องการทดสอบแบบ payload ให้วาง JSON ตรงนี้ได้เลย",-1)),y(t("textarea",{"onUpdate:modelValue":e[23]||(e[23]=o=>U.value=o),rows:"8",class:"mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"},null,512),[[k,U.value]]),t("div",oo,[t("button",{class:"rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700",onClick:je},"Apply JSON"),t("button",{class:"rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:Re},"Copy JSON"),t("button",{class:"rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700",onClick:Ue},"เติมค่าพร้อมเทส"),t("span",ao,u(x.value),1)])])):h("",!0)],2),C.value?(n(),r("section",{key:0,ref_key:"flowSectionRef",ref:ce,class:w(["rounded-2xl border border-gray-200 bg-white p-5 md:p-6",$.value==="flow"?"ring-2 ring-amber-300":""])},[t("div",{class:"flex flex-wrap items-center justify-between gap-2"},[e[60]||(e[60]=t("div",null,[t("h2",{class:"text-lg font-semibold text-gray-900"},"ตัวอย่าง n8n Flow (Demo)"),t("p",{class:"text-sm text-gray-600"},"ไฟล์ demo สำหรับนำไป import ใน n8n แล้วแก้ credentials / knowledge base ตามหน่วยงานของคุณ")],-1)),t("div",{class:"flex items-center gap-2"},[t("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:Pe},"Copy flow JSON"),t("button",{class:"rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700",onClick:Je},"Download .json")])]),t("pre",so,u(F.value),1)],2)):h("",!0),C.value?(n(),r("section",{key:1,ref_key:"installSectionRef",ref:be,class:w(["rounded-2xl border border-gray-200 bg-white p-5 md:p-6",$.value==="install"?"ring-2 ring-amber-300":""])},[t("div",{class:"flex flex-wrap items-center justify-between gap-2"},[e[61]||(e[61]=t("div",null,[t("h2",{class:"text-lg font-semibold text-gray-900"},"วิธีนำไปปลั๊กกับเว็บ"),t("p",{class:"text-sm text-gray-600"},"เลือกสแต็กที่ใช้ แล้วทำตามขั้นตอนแบบจับมือทำได้ทันที")],-1)),t("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:Fe},"Copy code")]),t("div",ro,[(n(),r(R,null,V(me,o=>t("button",{key:o.id,class:w(["rounded-lg px-3 py-1.5 text-xs font-semibold",L.value===o.id?"bg-indigo-600 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"]),onClick:d=>L.value=o.id},u(o.label),11,no)),64))]),e[62]||(e[62]=re('<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3" data-v-ba64d3b0><p class="text-xs font-semibold uppercase tracking-wide text-amber-700" data-v-ba64d3b0>ต้องใส่ตรงไหนในเว็บปลายทาง</p><div class="mt-2 space-y-1 text-xs text-amber-900" data-v-ba64d3b0><p data-v-ba64d3b0><strong data-v-ba64d3b0>`headerColor`</strong> -&gt; ใช้เป็นสีพื้นหลังหัวกล่องแชท (chat header)</p><p data-v-ba64d3b0><strong data-v-ba64d3b0>`welcomeMessage`</strong> -&gt; ข้อความแรกที่แสดงตอนเปิด popup</p><p data-v-ba64d3b0><strong data-v-ba64d3b0>`mascotImages`</strong> -&gt; map รูปตามท่าทาง `happy/thinking/searching/sorry/welcome`</p><p data-v-ba64d3b0><strong data-v-ba64d3b0>`webhookUrl`</strong> -&gt; endpoint n8n สำหรับส่งข้อความ</p></div></div>',1)),t("div",lo,[t("p",io,"ขั้นตอนจับมือทำ ("+u(Se.value)+")",1),t("ol",uo,[(n(!0),r(R,null,V(Ne.value,(o,d)=>(n(),r("li",{key:d},u(o),1))),128))])]),t("pre",co,u(xe.value),1)],2)):h("",!0)]),oe(we,{name:"fade"},{default:ae(()=>[N.value.show?(n(),r("div",bo,u(N.value.message),1)):h("",!0)]),_:1}),oe(we,{name:"fade"},{default:ae(()=>[A.value?(n(),r("div",{key:0,class:"fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4",onClick:e[25]||(e[25]=se(o=>A.value=!1,["self"]))},[t("div",po,[t("div",go,[e[64]||(e[64]=t("h4",{class:"text-sm font-semibold text-gray-800"},"BuaBan Mascot Poster",-1)),t("button",{type:"button",class:"rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50",onClick:e[24]||(e[24]=o=>A.value=!1)}," ปิด ")]),t("img",{src:fe,alt:"UBU BuaBan Poster full size",class:"max-h-[78vh] w-full rounded-xl object-contain"})])])):h("",!0)]),_:1})])}}}),ho=De(xo,[["__scopeId","data-v-ba64d3b0"]]);export{ho as default};
