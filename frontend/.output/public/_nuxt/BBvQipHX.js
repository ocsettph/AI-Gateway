import{f as Be,u as Ie,h as Oe,r,g as j,i as Ne,c as l,a as e,b as se,l as C,y as _,n as x,F as R,m as M,d as D,t as u,B as $e,H as L,x as P,k as ae,E as ne,w as re,T as le,o as i,_ as Te}from"#entry";const Ue={class:"min-h-screen py-8 md:py-12"},je={class:"mx-auto max-w-7xl space-y-8"},Re={class:"grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"},Me={class:"rounded-2xl border border-gray-200 bg-white p-5"},Ee={class:"grid gap-4 md:grid-cols-2"},Le={class:"space-y-1 text-sm md:col-span-2"},Pe={class:"space-y-1 text-sm"},Fe={class:"space-y-1 text-sm"},Je={class:"space-y-1 text-sm md:col-span-2"},Ge={class:"mt-2 flex flex-wrap gap-2"},Ve=["onClick"],ze={class:"ml-2 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"},Ae={class:"space-y-2"},De=["src","alt"],He={class:"text-sm font-semibold text-gray-800"},We={class:"text-xs text-gray-600"},qe={class:"rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"},Ye=["onChange"],Ke={class:"rounded-2xl border border-gray-200 bg-white p-5"},Qe={class:"mt-3 space-y-2"},Xe={class:"mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3"},Ze={class:"mt-2 overflow-x-auto text-xs text-blue-900"},et={class:"grid gap-6 xl:grid-cols-[1fr_1fr]"},tt={class:"flex items-center justify-between"},ot={class:"relative mt-4 h-[470px] overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white p-4"},st=["src"],at={key:1,class:"absolute bottom-4 right-4 flex h-[400px] w-[320px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"},nt={class:"flex items-center gap-2"},rt=["src"],lt={class:"text-xs font-semibold"},it={class:"text-[10px] opacity-90"},dt={class:"flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3"},ut={class:"flex gap-2"},ct=["src"],bt={class:"max-w-[82%] rounded-xl rounded-tl-none bg-white px-3 py-2 text-xs text-gray-800 shadow-sm"},pt=["src"],gt={key:0,class:"flex justify-start"},mt={class:"flex items-start gap-2"},xt=["src"],ft=["disabled"],yt=["disabled"],ht={key:0,class:"h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},vt={key:1,class:"h-4 w-4 animate-spin",fill:"none",viewBox:"0 0 24 24"},wt={class:"rounded-2xl border border-gray-200 bg-white p-5"},kt={class:"mt-3 flex flex-wrap gap-2"},Ct={class:"self-center text-xs text-gray-500"},_t={class:"mt-4 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs"},St={class:"mt-4 flex flex-wrap gap-2"},Bt=["onClick"],It={class:"mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3"},Ot={class:"text-xs font-semibold uppercase tracking-wide text-gray-600"},Nt={class:"mt-2 list-decimal space-y-1 pl-5 text-xs text-gray-700"},$t={class:"mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs"},Tt={key:0,class:"fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-2xl"},Ut={class:"w-full max-w-3xl rounded-2xl bg-white p-3 shadow-2xl md:p-4"},jt={class:"mb-3 flex items-center justify-between"},Rt="/examples/osd-flow-full.json",Mt=Be({__name:"chatbot",setup(Et){Ie({title:"Chatbot Popup Sandbox - UBU AI SERVICE",meta:[{name:"description",content:"ทดสอบ popup chatbot โดยใส่ webhook n8n และมาสคอตของตัวเอง"}]});const b=Oe().public.basePath||"/",f=r(!0),y=r(!1),v=r(""),g=r("พร้อมทดสอบ"),S=r("welcome"),w=r(null),$=r("กำลังโหลดไฟล์ flow..."),F=r(null),J=r(null),H=r(null),W=r(null),q=r(null),Y=r(null),K=r(null),Q=r(null),a=r({webhookUrl:"https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat",botName:"น้องบัวบาน",mascotName:"บัวบาน",welcomeMessage:"น้องบัวบาน ยินดีต้อนรับ 🥰",headerColor:"#FFBF00"}),ie=["#4f46e5","#0ea5e9","#16a34a","#f97316","#e11d48","#111827"],G=[{key:"happy",description:"ใช้เมื่อหาข้อมูลพบ (Success) หรือแนะนำเรื่องสนุกๆ"},{key:"thinking",description:"ใช้เมื่อกำลังวิเคราะห์คำถามที่ซับซ้อน"},{key:"searching",description:"ใช้เมื่อหาในไฟล์ไม่เจอและกำลังจะไปหาใน Google/Web"},{key:"sorry",description:"ใช้เมื่อหาข้อมูลไม่เจอจริงๆ หรือต้องแนะนำให้ไปหาเจ้าหน้าที่"},{key:"welcome",description:"ใช้ทักทายตอนเริ่มแชท"}],c=r({happy:`${b}mascots/happy.svg`,thinking:`${b}mascots/thinking.svg`,searching:`${b}mascots/BuaBan.svg`,sorry:`${b}mascots/sorry.svg`,welcome:`${b}mascots/welcome.svg`}),X={mascot:"บัวบาน",expression:"happy",answer:"สวัสดีครับ นี่คือข้อความตัวอย่างจาก n8n",source:"https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat"},B=r(JSON.stringify(X,null,2)),de=JSON.stringify({mascot:"บัวบาน",expression:"ชื่อท่าทาง",answer:"เนื้อหาคำตอบของคุณ...",source:"ชื่อไฟล์หรือ URL"},null,2),I=r([]),O=r("html"),Z=[{id:"html",label:"HTML/Vanilla JS"},{id:"node",label:"Node.js (Express)"},{id:"php",label:"PHP (cURL)"}],ue=j(()=>({html:`<!-- วางโค้ดนี้ก่อน </body> ในไฟล์หน้าเว็บของคุณ -->
<style>
  #ubu-chatbot { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  #ubu-chatbot .panel { width: 340px; height: 470px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 20px 40px rgba(0,0,0,.15); display: flex; flex-direction: column; overflow: hidden; }
  #ubu-chatbot .header { color: #fff; padding: 10px 12px; font-size: 14px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
  #ubu-chatbot .body { flex: 1; overflow: auto; background: #f8fafc; padding: 10px; }
  #ubu-chatbot .msg-row { display: flex; align-items: flex-end; gap: 8px; margin: 8px 0; }
  #ubu-chatbot .msg-row.user { justify-content: flex-end; }
  #ubu-chatbot .msg-row.bot { justify-content: flex-start; }
  #ubu-chatbot .msg-avatar { width: 26px; height: 26px; border-radius: 999px; object-fit: cover; background: #fff; border: 1px solid #e5e7eb; flex: 0 0 auto; }
  #ubu-chatbot .msg { max-width: 85%; margin: 0; padding: 8px 10px; border-radius: 12px; font-size: 13px; line-height: 1.35; white-space: pre-wrap; }
  #ubu-chatbot .msg.bot { background: #fff; border: 1px solid #e5e7eb; color: #111827; }
  #ubu-chatbot .msg.user { margin-left: auto; color: #fff; }
  #ubu-chatbot .input { border-top: 1px solid #e5e7eb; padding: 8px; display: flex; gap: 6px; background: #fff; }
  #ubu-chatbot .input input { flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 7px 9px; font-size: 13px; }
  #ubu-chatbot .input button { border: 0; width: 34px; height: 34px; border-radius: 999px; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, background-color .2s ease; }
  #ubu-chatbot .input button:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,.14); }
  #ubu-chatbot .input button:disabled { background: #d1d5db !important; cursor: not-allowed; box-shadow: none; transform: none; }
  #ubu-chatbot .input button svg { width: 16px; height: 16px; }
  #ubu-chatbot .launcher-wrap { position: fixed; right: 24px; bottom: 16px; display: flex; align-items: center; justify-content: center; z-index: 3; }
  #ubu-chatbot .mascot-btn { border: 0; background: transparent; cursor: pointer; padding: 0; animation: ubu-bounce 2s infinite; }
  #ubu-chatbot .mascot-btn:hover { animation-play-state: paused; transform: scale(1.04); }
  #ubu-chatbot .mascot-img { width: 90px; height: 90px; object-fit: contain; filter: drop-shadow(0 12px 20px rgba(0,0,0,.16)); }
  @keyframes ubu-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
</style>

<div id="ubu-chatbot">
  <div id="ubu-chatbot-launcher" class="launcher-wrap">
    <button id="ubu-chatbot-fab" class="mascot-btn" aria-label="แสดงหน้าต่างแชท">
      <img id="ubu-chatbot-launcher-img" class="mascot-img" src="${c.value.welcome}" alt="${a.value.mascotName}" />
    </button>
  </div>
  <div id="ubu-chatbot-panel" class="panel" style="display:flex;">
    <div id="ubu-chatbot-header" class="header">
      <span>${a.value.botName}</span>
      <button id="ubu-chatbot-close" style="background:transparent;border:0;color:#fff;font-weight:700;cursor:pointer;">x</button>
    </div>
    <div id="ubu-chatbot-body" class="body"></div>
    <form id="ubu-chatbot-form" class="input">
      <input id="ubu-chatbot-input" placeholder="พิมพ์ข้อความ..." />
      <button id="ubu-chatbot-send" type="submit" aria-label="ส่งข้อความ">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
      </button>
    </form>
  </div>
</div>

<script>
const BOT_CONFIG = {
  webhookUrl: "${a.value.webhookUrl}",
  headerColor: "${a.value.headerColor}",
  welcomeMessage: "${a.value.welcomeMessage.replace(/"/g,'\\"')}",
  mascotImages: {
    happy: "${c.value.happy}",
    thinking: "${c.value.thinking}",
    searching: "${c.value.searching}",
    sorry: "${c.value.sorry}",
    welcome: "${c.value.welcome}"
  }
};

const panel = document.getElementById("ubu-chatbot-panel");
const fab = document.getElementById("ubu-chatbot-fab");
const launcher = document.getElementById("ubu-chatbot-launcher");
const launcherImg = document.getElementById("ubu-chatbot-launcher-img");
const closeBtn = document.getElementById("ubu-chatbot-close");
const header = document.getElementById("ubu-chatbot-header");
const body = document.getElementById("ubu-chatbot-body");
const form = document.getElementById("ubu-chatbot-form");
const input = document.getElementById("ubu-chatbot-input");
const sendBtn = document.getElementById("ubu-chatbot-send");
header.style.background = BOT_CONFIG.headerColor;
sendBtn.style.background = BOT_CONFIG.headerColor;
launcher.style.display = "none";
if (!body.dataset.welcomeShown) {
  addMsg(BOT_CONFIG.welcomeMessage, "bot", "welcome");
  body.dataset.welcomeShown = "1";
}

function addMsg(text, who, expression = "welcome") {
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
  bubble.className = "msg " + who;
  if (who === "user") bubble.style.background = BOT_CONFIG.headerColor;
  bubble.textContent = text;
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
    bubble.className = "msg bot";
    bubble.textContent = "กำลังพิมพ์...";
    window.__ubuLoading.appendChild(avatar);
    window.__ubuLoading.appendChild(bubble);
    body.appendChild(window.__ubuLoading);
    body.scrollTop = body.scrollHeight;
  } else if (window.__ubuLoading) {
    window.__ubuLoading.remove();
    window.__ubuLoading = null;
  }
}

async function askBot(message) {
  const res = await fetch(BOT_CONFIG.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: message, message, mascot: "${a.value.mascotName}" })
  });
  const data = await res.json();
  return {
    answer: data.answer || data.message || "ไม่พบคำตอบ",
    expression: data.expression || "sorry"
  };
}

fab.onclick = () => {
  panel.style.display = "flex";
  launcher.style.display = "none";
};
closeBtn.onclick = () => {
  panel.style.display = "none";
  launcher.style.display = "flex";
};

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
    addMsg(bot.answer, "bot", bot.expression);
    const nextImg = BOT_CONFIG.mascotImages[bot.expression] || BOT_CONFIG.mascotImages.welcome;
    if (nextImg) launcherImg.src = nextImg;
  } catch (err) {
    setLoading(false);
    addMsg("เชื่อมต่อไม่สำเร็จ", "bot", "sorry");
  }
};
<\/script>`,node:`import express from "express";
import fetch from "node-fetch";
const app = express();
app.use(express.json());

const BOT_CONFIG = {
  webhookUrl: "${a.value.webhookUrl}",
  headerColor: "${a.value.headerColor}",
  welcomeMessage: "${a.value.welcomeMessage.replace(/"/g,'\\"')}"
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
  "webhookUrl" => "${a.value.webhookUrl}",
  "headerColor" => "${a.value.headerColor}",
  "welcomeMessage" => "${a.value.welcomeMessage.replace(/"/g,'\\"')}"
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
?>`})),ee=j(()=>ue.value[O.value]),ce=j(()=>Z.find(s=>s.id===O.value)?.label||""),be=j(()=>O.value==="html"?["เปิดไฟล์หน้าเว็บหลัก เช่น index.html หรือไฟล์ layout หลัก","วางโค้ดทั้งก้อนจากด้านล่างก่อนแท็กปิด </body>","บันทึกไฟล์และรีโหลดหน้าเว็บ","โหลดหน้าเว็บแล้วแชทจะเปิดทันที ถ้าปิดไปให้กดมาสคอตมุมขวาล่างเพื่อเปิดใหม่"]:O.value==="node"?["เปิดไฟล์ backend เช่น app.js / server.js","วางโค้ดตัวอย่างให้เกิด endpoint /chat","ติดตั้งแพ็กเกจที่จำเป็น (express, node-fetch) และรีสตาร์ตเซิร์ฟเวอร์","ให้ frontend เรียก endpoint /chat ของเว็บตัวเอง"]:["สร้างไฟล์ใหม่ เช่น chatbot-proxy.php","วางโค้ดตัวอย่างลงไฟล์และบันทึก","เรียกไฟล์นี้จากหน้าเว็บด้วย fetch หรือ form POST","ทดสอบว่าคืน JSON ได้ก่อนเชื่อมกับ UI popup"]),N=r({show:!1,message:""});let V=null;const te=`${b}mascots/UBU_BuaBan.png`,E=r(!1),z=j(()=>c.value[S.value]||c.value.happy);function pe(s){return new Promise((t,o)=>{const n=new FileReader;n.onload=()=>t(String(n.result||"")),n.onerror=()=>o(new Error("file-read-failed")),n.readAsDataURL(s)})}async function ge(s,t){const n=t.target.files?.[0];if(n)try{const h=await pe(n);c.value[s]=h,g.value=`อัปโหลดรูปท่า ${s} แล้ว`}catch{g.value="อัปโหลดรูปไม่สำเร็จ"}}function me(){const s=["BuaBan.svg","happy.svg","thinking.svg","searching.svg","sorry.svg","welcome.svg","UBU_BuaBan.png"];for(const t of s){const o=document.createElement("a");o.href=`${b}mascots/${t}`,o.download=t,document.body.appendChild(o),o.click(),o.remove()}g.value="เริ่มดาวน์โหลดชุดมาสคอตแล้ว"}function xe(){E.value=!0}function fe(){B.value=JSON.stringify({mascot:a.value.mascotName||"MyMascot",expression:"happy",answer:"ข้อความทดสอบจาก payload editor",source:a.value.webhookUrl},null,2)}function ye(){try{const s=JSON.parse(B.value);if(!s.answer)throw new Error("invalid");I.value.push({role:"assistant",content:String(s.answer)});const t=String(s.expression||"happy").toLowerCase();S.value=G.some(o=>o.key===t)?t:"sorry",g.value="Apply สำเร็จ"}catch{g.value="JSON ไม่ถูกต้อง"}}function he(s){const t=p=>{const d=p.trim(),oe=d.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);return oe?oe[1].trim():d},o=p=>{if(typeof p!="string")return p;const d=t(p);if(!d)return p;if(d.startsWith("{")&&d.endsWith("}")||d.startsWith("[")&&d.endsWith("]"))try{return JSON.parse(d)}catch{return p}return p},n=o(s),h=o(n?.output),m=typeof h=="object"&&h!==null?h:n;let U=m?.answer??m?.message??m?.text??m?.response??(typeof m?.output=="string"?m.output:"")??"";if(typeof U=="string"){const p=t(U),d=o(p);typeof d=="object"&&d!==null?U=d.answer??d.message??d.text??p:U=p}return{mascot:String(m?.mascot||n?.mascot||a.value.mascotName||"บัวบาน"),expression:String(m?.expression||n?.expression||"sorry"),answer:String(U||"ไม่มีคำตอบจาก webhook"),source:String(m?.source||n?.source||a.value.webhookUrl)}}async function ve(){if(!v.value.trim()||y.value)return;const s=v.value.trim();v.value="",I.value.push({role:"user",content:s}),S.value="thinking",y.value=!0;try{const t=await fetch(a.value.webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatInput:s,message:s,mascot:a.value.mascotName,mode:"build"})});if(!t.ok)throw new Error(String(t.status));const o=await t.json(),n=he(o),h=(n.expression||"").toLowerCase();S.value=G.some(m=>m.key===h)?h:"sorry",I.value.push({role:"assistant",content:n.answer}),g.value=`ตอบกลับจาก ${n.source||"webhook"}`}catch{I.value.push({role:"assistant",content:"เชื่อมต่อ webhook ไม่สำเร็จ กรุณาตรวจสอบ URL หรือ CORS"}),g.value="Webhook error"}finally{y.value=!1}}function we(){f.value=!1,S.value="welcome",a.value={webhookUrl:"https://n8n.ubu.ac.th/webhook/f80778cf-c9b6-495a-88a9-e7ed43ef8fa7/chat",botName:"UBU AI Bot",mascotName:"บัวบาน",welcomeMessage:"น้องบัวบานแทน",headerColor:"#4f46e5"},c.value={happy:`${b}mascots/happy.svg`,thinking:`${b}mascots/thinking.svg`,searching:`${b}mascots/BuaBan.svg`,sorry:`${b}mascots/sorry.svg`,welcome:`${b}mascots/welcome.svg`},I.value=[],B.value=JSON.stringify(X,null,2),g.value="รีเซ็ตเรียบร้อย"}async function A(s,t){try{await navigator.clipboard.writeText(s),g.value=t,N.value={show:!0,message:t},V&&clearTimeout(V),V=setTimeout(()=>{N.value={show:!1,message:""}},1800)}catch{g.value="คัดลอกไม่สำเร็จ",N.value={show:!0,message:"คัดลอกไม่สำเร็จ"}}}function ke(){A(B.value,"คัดลอก JSON แล้ว")}function Ce(){A(ee.value,"คัดลอกโค้ดติดตั้งแล้ว")}function _e(){A($.value,"คัดลอก n8n flow แล้ว")}function T(s){s&&s.scrollIntoView({behavior:"smooth",block:"center"})}function k(s){w.value=s,s==="webhook"?(F.value?.scrollIntoView({behavior:"smooth",block:"center"}),F.value?.focus()):s==="profile"?(J.value?.scrollIntoView({behavior:"smooth",block:"center"}),J.value?.focus(),H.value?.focus()):s==="color"?T(W.value):s==="expression"?T(q.value):s==="preview"?(f.value=!0,T(Y.value)):s==="flow"?T(K.value):s==="install"&&T(Q.value),setTimeout(()=>{w.value=null},2500)}function Se(){const s=new Blob([$.value],{type:"application/json;charset=utf-8"}),t=URL.createObjectURL(s),o=document.createElement("a");o.href=t,o.download="osd-flow-full.json",o.click(),URL.revokeObjectURL(t),N.value={show:!0,message:"ดาวน์โหลดไฟล์ flow แล้ว"}}return Ne(async()=>{try{const s=await fetch(Rt);if(!s.ok)throw new Error("flow-load-failed");$.value=await s.text()}catch{$.value=`{
  "error": "โหลดไฟล์ flow ไม่สำเร็จ"
}`}}),(s,t)=>(i(),l("div",Ue,[e("div",je,[t[43]||(t[43]=e("section",{class:"rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-6 md:p-8"},[e("p",{class:"text-sm font-semibold uppercase tracking-wide text-amber-700"},"Chatbot Popup Sandbox"),e("h1",{class:"mt-2 text-2xl font-bold text-gray-900 md:text-4xl"},"สร้างและทดสอบบอทได้ทันที"),e("p",{class:"mt-2 text-sm text-gray-700"},"ตั้งค่า webhook, สี, รูปท่าทาง และลองแชทกับ popup preview แบบ realtime ในหน้าเดียว")],-1)),e("section",Re,[e("article",Me,[e("div",{class:"mb-4 flex items-center justify-between"},[t[19]||(t[19]=e("h2",{class:"text-lg font-semibold text-gray-900"},"Step 2 · ตั้งค่าบอท",-1)),e("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200",onClick:we},"รีเซ็ต")]),e("div",Ee,[e("label",Le,[t[20]||(t[20]=e("span",{class:"font-medium text-gray-700"},"Webhook URL (n8n)",-1)),C(e("input",{ref_key:"webhookInputRef",ref:F,"onUpdate:modelValue":t[0]||(t[0]=o=>a.value.webhookUrl=o),class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",type:"url"},null,512),[[_,a.value.webhookUrl]])]),e("label",Pe,[t[21]||(t[21]=e("span",{class:"font-medium text-gray-700"},"ชื่อบอท",-1)),C(e("input",{ref_key:"botNameInputRef",ref:J,"onUpdate:modelValue":t[1]||(t[1]=o=>a.value.botName=o),class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",type:"text"},null,512),[[_,a.value.botName]])]),e("label",Fe,[t[22]||(t[22]=e("span",{class:"font-medium text-gray-700"},"ชื่อมาสคอต",-1)),C(e("input",{"onUpdate:modelValue":t[2]||(t[2]=o=>a.value.mascotName=o),class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",type:"text"},null,512),[[_,a.value.mascotName]])]),e("label",Je,[t[23]||(t[23]=e("span",{class:"font-medium text-gray-700"},"ข้อความต้อนรับ (welcome)",-1)),C(e("textarea",{ref_key:"welcomeInputRef",ref:H,"onUpdate:modelValue":t[3]||(t[3]=o=>a.value.welcomeMessage=o),rows:"2",class:"w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"},null,512),[[_,a.value.welcomeMessage]])])]),e("div",{ref_key:"colorSectionRef",ref:W,class:x(["mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3",w.value==="color"?"ring-2 ring-amber-300":""])},[t[25]||(t[25]=e("p",{class:"text-xs font-semibold uppercase tracking-wide text-gray-500"},"สีแถบหัวแชท",-1)),e("div",Ge,[(i(),l(R,null,M(ie,o=>e("button",{key:o,class:x(["h-8 w-8 rounded-full ring-2 ring-offset-2 transition",a.value.headerColor===o?"ring-gray-800":"ring-transparent"]),style:L({backgroundColor:o}),onClick:n=>a.value.headerColor=o},null,14,Ve)),64)),e("label",ze,[t[24]||(t[24]=D(" เลือกสีเอง ",-1)),C(e("input",{"onUpdate:modelValue":t[4]||(t[4]=o=>a.value.headerColor=o),type:"color",class:"h-6 w-8 cursor-pointer border-0 bg-transparent p-0"},null,512),[[_,a.value.headerColor]])])])],2),e("div",{ref_key:"expressionSectionRef",ref:q,class:x(["mt-4 rounded-xl border border-gray-200 p-3",w.value==="expression"?"ring-2 ring-amber-300":""])},[e("div",{class:"mb-2 flex items-center justify-between"},[t[29]||(t[29]=e("h3",{class:"text-sm font-semibold text-gray-800"},"Step 3 · ใส่รูปตามท่าทาง",-1)),e("div",{class:"flex items-center gap-2"},[e("button",{type:"button",class:"inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50",title:"ดูรูปเต็ม",onClick:xe},[e("img",{src:te,alt:"UBU BuaBan Poster",class:"h-7 w-7 rounded object-cover"}),t[26]||(t[26]=e("span",{class:"text-xs text-gray-600"},"BuaBan Mascot",-1))]),e("button",{type:"button",class:"inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-50",onClick:me},[...t[27]||(t[27]=[e("svg",{class:"h-3.5 w-3.5",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"})],-1),D(" ดาวน์โหลดชุดมาสคอต ",-1)])]),t[28]||(t[28]=e("span",{class:"text-xs text-gray-500"},"อัปโหลดไม่ถาวร (รีเฟรชแล้วหาย)",-1))])]),e("div",Ae,[(i(),l(R,null,M(G,o=>e("div",{key:o.key,class:"grid gap-2 rounded-lg border border-gray-200 p-2 md:grid-cols-[64px_1fr_auto] md:items-center"},[e("img",{src:c.value[o.key],alt:o.key,class:"h-14 w-14 rounded-lg object-cover"},null,8,De),e("div",null,[e("p",He,u(o.key),1),e("p",We,u(o.description),1)]),e("label",qe,[t[30]||(t[30]=D(" อัปโหลดรูป ",-1)),e("input",{type:"file",accept:"image/*",class:"hidden",onChange:n=>ge(o.key,n)},null,40,Ye)])])),64))])],2)]),e("article",Ke,[t[32]||(t[32]=e("h3",{class:"text-base font-semibold text-gray-900"},"ขั้นตอนแบบคลิกตามได้เลย",-1)),e("div",Qe,[e("button",{type:"button",onClick:t[5]||(t[5]=o=>k("webhook")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 1) กรอก Webhook URL "),e("button",{type:"button",onClick:t[6]||(t[6]=o=>k("profile")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 2) ตั้งชื่อบอท + ข้อความต้อนรับ "),e("button",{type:"button",onClick:t[7]||(t[7]=o=>k("color")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 3) เลือกสีหัวแชท "),e("button",{type:"button",onClick:t[8]||(t[8]=o=>k("expression")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 4) อัปโหลดรูปท่าทางทั้ง 5 expression "),e("button",{type:"button",onClick:t[9]||(t[9]=o=>k("preview")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 5) เปิด Popup Preview และลองคุยจริง "),e("button",{type:"button",onClick:t[10]||(t[10]=o=>k("flow")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 6) ตัวอย่าง n8n Flow (ตามชุด OSD) "),e("button",{type:"button",onClick:t[11]||(t[11]=o=>k("install")),class:"w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"}," 7) Copy โค้ดไปปลั๊กเว็บของคุณ ")]),e("div",Xe,[t[31]||(t[31]=e("p",{class:"text-xs font-medium text-blue-700"},"JSON Contract",-1)),e("pre",Ze,u($e(de)),1)])])]),e("section",et,[e("article",{ref_key:"previewSectionRef",ref:Y,class:x(["rounded-2xl border border-gray-200 bg-white p-5",w.value==="preview"?"ring-2 ring-amber-300":""])},[e("div",tt,[t[33]||(t[33]=e("div",null,[e("h2",{class:"text-lg font-semibold text-gray-900"},"Step 4 · Popup Preview (Realtime)"),e("p",{class:"mt-1 text-sm text-gray-600"},"แก้ค่าด้านบนแล้ว preview เปลี่ยนทันที")],-1)),e("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200",onClick:t[12]||(t[12]=o=>f.value=!f.value)},u(f.value?"ปิด popup":"แสดง popup"),1)]),e("div",ot,[t[37]||(t[37]=e("div",{class:"absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow"},"Sandbox",-1)),f.value?(i(),l("div",at,[e("div",{class:"flex items-center justify-between px-3 py-2 text-white",style:L({backgroundColor:a.value.headerColor})},[e("div",nt,[e("img",{src:z.value,alt:"mascot",class:"h-8 w-8 rounded-full bg-white object-cover p-0.5"},null,8,rt),e("div",null,[e("p",lt,u(a.value.botName),1),e("p",it,u(S.value),1)])]),e("button",{class:"rounded p-1 text-xs hover:bg-black/20",onClick:t[14]||(t[14]=o=>f.value=!1)},"x")],4),e("div",dt,[e("div",ut,[e("img",{src:c.value.welcome,alt:"welcome",class:"h-8 w-8 rounded-full object-cover"},null,8,ct),e("div",bt,u(a.value.welcomeMessage),1)]),(i(!0),l(R,null,M(I.value,(o,n)=>(i(),l("div",{key:n,class:x(["flex",o.role==="user"?"justify-end":"justify-start"])},[e("div",{class:x(["flex items-start gap-2",o.role==="user"?"flex-row-reverse":""])},[o.role==="assistant"?(i(),l("img",{key:0,src:z.value,alt:"assistant",class:"h-8 w-8 rounded-full object-cover"},null,8,pt)):P("",!0),e("div",{class:x(["max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-sm",o.role==="user"?"text-white":"bg-white text-gray-800"]),style:L(o.role==="user"?{backgroundColor:a.value.headerColor}:void 0)},u(o.content),7)],2)],2))),128)),y.value?(i(),l("div",gt,[e("div",mt,[e("img",{src:c.value.thinking,alt:"assistant-loading",class:"h-8 w-8 rounded-full object-cover"},null,8,xt),t[34]||(t[34]=ae('<div class="rounded-xl bg-white px-3 py-2 text-xs text-gray-700 shadow-sm" data-v-0737255b><span class="inline-flex items-center gap-1" data-v-0737255b><span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" data-v-0737255b></span><span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" data-v-0737255b></span><span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" data-v-0737255b></span><span class="ml-1 text-[11px] text-gray-500" data-v-0737255b>กำลังพิมพ์...</span></span></div>',1))])])):P("",!0)]),e("form",{class:"flex gap-2 border-t border-gray-100 p-2",onSubmit:ne(ve,["prevent"])},[C(e("input",{"onUpdate:modelValue":t[15]||(t[15]=o=>v.value=o),disabled:y.value,placeholder:"พิมพ์ข้อความ...",class:"min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"},null,8,ft),[[_,v.value]]),e("button",{type:"submit",disabled:y.value||!v.value.trim(),class:"inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white/80 disabled:shadow-none",style:L(!y.value&&v.value.trim()?{backgroundColor:a.value.headerColor}:void 0),"aria-label":"ส่งข้อความ"},[y.value?(i(),l("svg",vt,[...t[36]||(t[36]=[e("circle",{class:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor","stroke-width":"4"},null,-1),e("path",{class:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"},null,-1)])])):(i(),l("svg",ht,[...t[35]||(t[35]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8"},null,-1)])]))],12,yt)],32)])):(i(),l("button",{key:0,class:"absolute bottom-4 right-4 rounded-full bg-transparent p-0 drop-shadow-lg transition-transform duration-200 hover:scale-105",onClick:t[13]||(t[13]=o=>f.value=!0),"aria-label":"เปิดแชทบอท"},[e("img",{src:z.value,alt:"mascot",class:"h-14 w-14 animate-bounce object-contain"},null,8,st)]))])],2),e("article",wt,[t[38]||(t[38]=e("h2",{class:"text-lg font-semibold text-gray-900"},"Live JSON Inspector",-1)),t[39]||(t[39]=e("p",{class:"mt-1 text-sm text-gray-600"},"ปรับค่าแล้วลองส่งแชทได้ทันที ถ้าต้องการทดสอบแบบ payload ให้วาง JSON ตรงนี้ได้เลย",-1)),C(e("textarea",{"onUpdate:modelValue":t[16]||(t[16]=o=>B.value=o),rows:"8",class:"mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"},null,512),[[_,B.value]]),e("div",kt,[e("button",{class:"rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700",onClick:ye},"Apply JSON"),e("button",{class:"rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:ke},"Copy JSON"),e("button",{class:"rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700",onClick:fe},"เติมค่าพร้อมเทส"),e("span",Ct,u(g.value),1)])])]),e("section",{ref_key:"flowSectionRef",ref:K,class:x(["rounded-2xl border border-gray-200 bg-white p-5 md:p-6",w.value==="flow"?"ring-2 ring-amber-300":""])},[e("div",{class:"flex flex-wrap items-center justify-between gap-2"},[t[40]||(t[40]=e("div",null,[e("h2",{class:"text-lg font-semibold text-gray-900"},"ตัวอย่าง n8n Flow (ตามชุด OSD)"),e("p",{class:"text-sm text-gray-600"},"นำไปวางใน n8n import workflow ได้ และแก้ credentials/collection ตามระบบจริง")],-1)),e("div",{class:"flex items-center gap-2"},[e("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:_e},"Copy flow JSON"),e("button",{class:"rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700",onClick:Se},"Download .json")])]),e("pre",_t,u($.value),1)],2),e("section",{ref_key:"installSectionRef",ref:Q,class:x(["rounded-2xl border border-gray-200 bg-white p-5 md:p-6",w.value==="install"?"ring-2 ring-amber-300":""])},[e("div",{class:"flex flex-wrap items-center justify-between gap-2"},[t[41]||(t[41]=e("div",null,[e("h2",{class:"text-lg font-semibold text-gray-900"},"วิธีนำไปปลั๊กกับเว็บ"),e("p",{class:"text-sm text-gray-600"},"เลือกสแต็กที่ใช้ แล้วทำตามขั้นตอนแบบจับมือทำได้ทันที")],-1)),e("button",{class:"rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200",onClick:Ce},"Copy code")]),e("div",St,[(i(),l(R,null,M(Z,o=>e("button",{key:o.id,class:x(["rounded-lg px-3 py-1.5 text-xs font-semibold",O.value===o.id?"bg-indigo-600 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"]),onClick:n=>O.value=o.id},u(o.label),11,Bt)),64))]),t[42]||(t[42]=ae('<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3" data-v-0737255b><p class="text-xs font-semibold uppercase tracking-wide text-amber-700" data-v-0737255b>ต้องใส่ตรงไหนในเว็บปลายทาง</p><div class="mt-2 space-y-1 text-xs text-amber-900" data-v-0737255b><p data-v-0737255b><strong data-v-0737255b>`headerColor`</strong> -&gt; ใช้เป็นสีพื้นหลังหัวกล่องแชท (chat header)</p><p data-v-0737255b><strong data-v-0737255b>`welcomeMessage`</strong> -&gt; ข้อความแรกที่แสดงตอนเปิด popup</p><p data-v-0737255b><strong data-v-0737255b>`mascotImages`</strong> -&gt; map รูปตามท่าทาง `happy/thinking/searching/sorry/welcome`</p><p data-v-0737255b><strong data-v-0737255b>`webhookUrl`</strong> -&gt; endpoint n8n สำหรับส่งข้อความ</p></div></div>',1)),e("div",It,[e("p",Ot,"ขั้นตอนจับมือทำ ("+u(ce.value)+")",1),e("ol",Nt,[(i(!0),l(R,null,M(be.value,(o,n)=>(i(),l("li",{key:n},u(o),1))),128))])]),e("pre",$t,u(ee.value),1)],2)]),se(le,{name:"fade"},{default:re(()=>[N.value.show?(i(),l("div",Tt,u(N.value.message),1)):P("",!0)]),_:1}),se(le,{name:"fade"},{default:re(()=>[E.value?(i(),l("div",{key:0,class:"fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4",onClick:t[18]||(t[18]=ne(o=>E.value=!1,["self"]))},[e("div",Ut,[e("div",jt,[t[44]||(t[44]=e("h4",{class:"text-sm font-semibold text-gray-800"},"BuaBan Mascot Poster",-1)),e("button",{type:"button",class:"rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50",onClick:t[17]||(t[17]=o=>E.value=!1)}," ปิด ")]),e("img",{src:te,alt:"UBU BuaBan Poster full size",class:"max-h-[78vh] w-full rounded-xl object-contain"})])])):P("",!0)]),_:1})]))}}),Pt=Te(Mt,[["__scopeId","data-v-0737255b"]]);export{Pt as default};
