import fs from "fs";

const flowPath = "d:/CursorAI/ai-gateway/frontend/public/examples/chatbot-demo-flow.json";
const data = JSON.parse(fs.readFileSync(flowPath, "utf8"));

const BRAND = "มหาวิทยาลัยตัวอย่าง";
const BRAND_EN = "Demo University Portal";
const DEMO_URL = "https://demo-university.example.edu";
const MASCOT_TH = "ยูบิ";
const MASCOT_EN = "Ubie";

// รองรับทั้งชื่อเดิม (UBU/sanitize), Bloom Café และชื่อใหม่
const nameMap = {
  // Bloom Café → University
  Online_Order: "Admissions",
  Menu: "Registrar",
  Catering: "Graduate",
  Seasonal: "Curriculum",
  Workshop: "Internship",
  Promotions: "GeneralEd",
  Stores: "Campus",
  Mobile_App: "ITServices",
  branches: "Departments",
  Tool_OnlineOrder: "Tool_Admissions",
  Tool_Menu: "Tool_Registrar",
  Tool_Catering: "Tool_Graduate",
  Tool_Seasonal: "Tool_Curriculum",
  Tool_Workshop: "Tool_Internship",
  Tool_Promotions: "Tool_GeneralEd",
  Tool_Stores: "Tool_Campus",
  Tool_MobileApp: "Tool_ITServices",
  Tool_Branches: "Tool_Departments",
  Q_OnlineOrder: "Q_Admissions",
  Q_Menu: "Q_Registrar",
  Q_Catering: "Q_Graduate",
  Q_Seasonal: "Q_Curriculum",
  Q_Workshop: "Q_Internship",
  Q_Promotions: "Q_GeneralEd",
  Q_Stores: "Q_Campus",
  Q_MobileApp: "Q_ITServices",
  BloomCafe_Order: "EduPortal_Admissions",
  BloomCafe_Menu: "EduPortal_Registrar",
  BloomCafe_Catering: "EduPortal_Graduate",
  BloomCafe_Seasonal: "EduPortal_Curriculum",
  BloomCafe_Workshop: "EduPortal_Internship",
  BloomCafe_Promo: "EduPortal_GeneralEd",
  BloomCafe_Stores: "EduPortal_Campus",
  BloomCafe_FAQ: "EduPortal_FAQ",
  BloomCafe_App: "EduPortal_IT",
  Q_bloom_branches: "Q_edu_departments",
  Bloom_Knowledge: "EduPortal_Knowledge",
  branch_directory_sheets: "dept_website_directory",
  store_map: "campus_map",
  "Bloom Café — คำถามที่พบบ่อย (FAQ)": `${BRAND} — คำถามที่พบบ่อย (FAQ)`,
  "Bloom Café Bot": `${BRAND} Bot`,
  "Bloom Café": BRAND,
  menu_prices: "registrar_calendar",
  "bloomcafe-demo.example.com": "demo-university.example.edu",
  // Original / sanitize names → University
  CWIE: "Internship",
  GE: "GeneralEd",
  Building: "Campus",
  IT: "ITServices",
  Tool_Admission: "Tool_Admissions",
  Tool_CWIE: "Tool_Internship",
  Tool_GE: "Tool_GeneralEd",
  Tool_Building: "Tool_Campus",
  Tool_IT: "Tool_ITServices",
  Tool_org_information: "Tool_Departments",
  Q_Admission: "Q_Admissions",
  Q_CWIE: "Q_Internship",
  Q_GE: "Q_GeneralEd",
  Q_Building: "Q_Campus",
  Q_IT: "Q_ITServices",
  DemoChat_Admission: "EduPortal_Admissions",
  DemoChat_REG: "EduPortal_Registrar",
  DemoChat_Graduate: "EduPortal_Graduate",
  DemoChat_Curriculum: "EduPortal_Curriculum",
  DemoChat_CWIE: "EduPortal_Internship",
  DemoChat_GE: "EduPortal_GeneralEd",
  DemoChat_Building: "EduPortal_Campus",
  DemoChat_QA: "EduPortal_FAQ",
  DemoChat_IT: "EduPortal_IT",
  Q_demo_org_info: "Q_edu_departments",
  Demo_Knowledge: "EduPortal_Knowledge",
  org_information_sheets: "dept_website_directory",
  org_information: "Departments",
  org_map: "campus_map",
  "องค์กรตัวอย่าง (Demo Organization)": BRAND,
  "องค์กรของคุณ": BRAND,
  "ข้อมูลองค์กรตัวอย่าง": `ทำเนียบเว็บไซต์หน่วยงาน ${BRAND}`,
  "ฐานข้อมูลองค์กรตัวอย่าง": `ฐานข้อมูล ${BRAND}`,
  "Demo Chatbot": `${BRAND} Bot`,
  "Demo คำถามที่พบบ่อย (FAQ)": `${BRAND} — คำถามที่พบบ่อย (FAQ)`,
  "งานทะเบียน": "registrar_calendar",
};

const toolDescriptions = {
  Tool_Admissions:
    "ข้อมูลรับสมัครนักศึกษาใหม่ TCAS รอบ Portfolio โควตา เกณฑ์การคัดเลือก ค่าธรรมเนียม และประกาศจากเว็บงานรับเข้า",
  Tool_Registrar:
    "ปฏิทินการศึกษา วันเปิด-ปิดภาคเรียน ลงทะเบียน ค่าเทอม การขอเอกสาร และข้อมูลจากเว็บสำนักทะเบียน",
  Tool_Graduate:
    "ระดับบัณฑิตศึกษา ป.โท-เอก อาจารย์ที่ปรึกษา วิทยานิพนธ์ และข้อมูลจากเว็บบัณฑิตวิทยาลัย",
  Tool_Curriculum:
    "หลักสูตรแต่ละสาขา คู่มือนักศึกษา มคอ. และข้อมูลจากเว็บสำนักวิชาการ/หลักสูตร",
  Tool_Internship:
    "สหกิจศึกษา ฝึกงาน อาจารย์นิเทศ และข้อมูลจากเว็บสำนักสหกิจ",
  Tool_GeneralEd:
    "วิชาศึกษาทั่วไป (GE) แผนการเรียน รายวิชาพื้นฐาน และข้อมูลจากเว็บศูนย์ GE",
  Tool_Campus:
    "อาคารเรียน ห้องประชุม แผนผังวิทยาเขต ที่จอดรถ และข้อมูลจากเว็บอาคารสถานที่",
  Tool_ITServices:
    "อีเมลนักศึกษา (@student.demo-university.example.edu) WiFi VPN Microsoft 365 และเว็บสำนักเทคโนโลยีสารสนเทศ",
  Tool_FAQ:
    "คำถามที่พบบ่อย ช่องทางติดต่อส่วนกลาง เบอร์โทรสำนักงานอธิการบดี (ด่านรองก่อนค้นเว็บ)",
  Tool_Departments:
    `ทำเนียบเว็บไซต์คณะ สำนัก หน่วยงาน — URL เบอร์โทร อีเมล Facebook ของแต่ละหน่วยงานใน${BRAND}`,
};

const MAIN_SYSTEM_PROMPT = `คุณคือ "${MASCOT_TH}" (${MASCOT_EN}) มาสคอต AI ผู้ช่วยประจำ "${BRAND}" (${BRAND_EN})
⚠️ นี่คือระบบเดโม — ไม่ใช่ข้อมูลมหาวิทยาลัยจริง

**บทบาทหลัก:** ช่วยนักศึกษา บุคลากร และผู้สนใจค้นหาข้อมูลจาก **เว็บไซต์แต่ละหน่วยงาน** (คณะ สำนัก ศูนย์) และตอบคำถามด้านการศึกษา

**[พฤติกรรม Multi-Tool]**
- เรียกหลาย Tool ได้ถ้าคำถามครอบคลุมหลายหน่วยงาน
- ถาม "เว็บคณะ..." "ติดต่อสำนัก..." "หน่วยงานไหนดูแล..." → **Tool_Departments ก่อนเสมอ**
- ถามรับสมัคร TCAS โควตา → Tool_Admissions
- ถามลงทะเบียน ค่าเทอม ปฏิทิน → Tool_Registrar
- ถามป.โท ป.เอก วิทยานิพนธ์ → Tool_Graduate
- ถามหลักสูตร มคอ. → Tool_Curriculum
- ถามฝึกงาน สหกิจ → Tool_Internship
- ถามวิชา GE แผนการเรียน → Tool_GeneralEd
- ถามอาคาร แผนที่วิทยาเขต → Tool_Campus
- ถามอีเมล WiFi ระบบ IT → Tool_ITServices
- ไม่พบใน Tool หลัก → Tool_FAQ แล้วค่อย Tool_Web_Search

**[กฎเลือกเครื่องมือ]**
1. Tool_Departments — เว็บไซต์/ติดต่อคณะ สำนัก หน่วยงาน (dept_website_directory)
2. Tool_Admissions — งานรับเข้านักศึกษา
3. Tool_Registrar — งานทะเบียนและปฏิทินการศึกษา
4. Tool_Graduate — บัณฑิตศึกษา
5. Tool_Curriculum — หลักสูตรและคู่มือ
6. Tool_Internship — สหกิจศึกษา/ฝึกงาน
7. Tool_GeneralEd — วิชาศึกษาทั่วไป
8. Tool_Campus — อาคารและแผนที่วิทยาเขต (campus_map)
9. Tool_ITServices — ระบบสารสนเทศและอีเมล
10. Tool_FAQ — คำถามพบบ่อยส่วนกลาง
11. Tool_Web_Search — ค้นเว็บ ${DEMO_URL} เมื่อข้อมูลในระบบไม่พอ

**[รูปแบบการตอบ]**
- ปรับภาษาตามผู้ใช้
- แทนตัวเองว่า "${MASCOT_TH}" หรือ "หนู" ลงท้าย "ค่ะ/คะ"
- ถ้ามี URL เว็บหน่วยงาน ให้ใส่ลิงก์ดิบใน answer
- ระบุ source ทุกแหล่ง (เช่น "อ้างอิงจาก: เว็บคณะวิศวกรรมศาสตร์ และ งานทะเบียน")
- ตอบเป็น JSON เท่านั้น (ห้ามใส่ \`\`\`json):
{
  "mascot": "${MASCOT_EN}",
  "expression": "happy/thinking/searching/sorry/welcome",
  "answer": "เนื้อหาคำตอบ...",
  "source": "อ้างอิงจาก: [แหล่งข้อมูล]"
}`;

const INFO_SYSTEM_PROMPT = `คุณคือ "${MASCOT_TH}" (${MASCOT_EN}) ผู้ช่วยตอบข้อมูลหน่วยงานของ "${BRAND}"

หน้าที่: ตอบข้อมูลคณะ สำนัก หน่วยงาน — **เว็บไซต์ URL** เบอร์โทร อีเมล Facebook ที่ตั้ง จาก dept_website_directory เท่านั้น
ถ้าไม่พบ → Tool_Web_Search หรือ campus_map สำหรับแผนที่อาคาร

[กฎการตอบ]
- เน้นให้ลิงก์เว็บไซต์หน่วยงานที่ถูกต้อง
- ตอบสั้น กระชับ
- แทนตัวเองว่า "${MASCOT_TH}" ลงท้าย "ค่ะ/คะ"
- ตอบเป็น JSON เท่านั้น:
{
  "mascot": "${MASCOT_EN}",
  "expression": "happy",
  "answer": "...",
  "source": "อ้างอิงจาก: ทำเนียบเว็บไซต์หน่วยงาน ${BRAND}"
}`;

const INTENT_ROUTER_CODE = `const query = ($json.chatInput || $json.body?.message?.text || "").trim();
const q = query.toLowerCase();

const INTENT_MAP = {
  DIRECT_HI: [
    "hi", "hello", "hey", "สวัสดี", "หวัดดี", "ดีจ้า", "ดีครับ", "ดีค่ะ",
    "ฮัลโหล", "เฮลโล", "ทักทาย", "ยินดีที่ได้รู้จัก", "yo", "good morning",
    "ยูบิช่วยหน่อย", "ช่วยหน่อย", "สอบถามหน่อย", "ขอถามหน่อย"
  ],
  DIRECT_INFO: [
    "คณะ", "สำนัก", "หน่วยงาน", "ภาควิชา", "วิทยาลัย", "ศูนย์",
    "เว็บ", "เว็บไซต์", "website", "url", "ลิงก์", "link",
    "facebook", "fb", "เพจ", "line",
    "โทร", "เบอร์", "email", "อีเมล", "@student",
    "ที่อยู่", "location", "แผนที่", "map", "ติดต่อ", "ช่องทาง"
  ]
};

let bestIntent = "AI_FALLBACK";
let bestScore = 0;
for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
  const score = keywords.filter(k => q.includes(k)).length;
  if (score > bestScore) { bestScore = score; bestIntent = intent; }
}

const COLLECTION_MAP = {
  DIRECT_INFO: "Q_edu_departments",
  DIRECT_HI: "",
  AI_FALLBACK: "EduPortal_Knowledge"
};

const SOURCE_MAP = {
  DIRECT_INFO: "ทำเนียบเว็บไซต์หน่วยงาน ${BRAND}",
  DIRECT_HI: "ระบบต้อนรับอัตโนมัติ",
  AI_FALLBACK: "ฐานข้อมูลกลาง ${BRAND}"
};

return [{
  json: {
    chatInput: query || "สวัสดี",
    query: query || "สวัสดี",
    intent: bestIntent,
    collection: COLLECTION_MAP[bestIntent] || "",
    source: SOURCE_MAP[bestIntent] || "ทำเนียบเว็บไซต์หน่วยงาน ${BRAND}"
  }
}];`;

const STICKY_NOTES = {
  "Sticky Note1": `### 📚 Load Data Flow (${BRAND})

**เตรียมข้อมูล Qdrant จากเว็บ/เอกสารแต่ละหน่วยงาน**
1. ตั้งค่า Qdrant + OpenAI Embeddings credentials
2. อัปโหลด PDF/เอกสารจากเว็บคณะ-สำนัก ลง Google Drive
3. แก้ folder ID ในโหนด Download แต่ละหมวด
4. รัน Load Data เพื่อสร้าง collection:
   - EduPortal_Admissions, Registrar, Graduate, Curriculum
   - Internship, GeneralEd, Campus, FAQ, IT
   - Q_edu_departments (ทำเนียบเว็บหน่วยงาน)
5. ตรวจ collection ครบก่อนเปิด Chat`,

  "Sticky Note2": `### 🔍 Retriever Flow — หน่วยงาน/เว็บไซต์

AI Agent เรียก Tool ตามหน่วยงาน:
- **Tool_Departments** — เว็บไซต์คณะ/สำนัก/หน่วยงาน ⭐
- **Tool_Admissions** — รับสมัครนักศึกษา
- **Tool_Registrar** — ทะเบียน/ปฏิทิน
- **Tool_Graduate** — บัณฑิตศึกษา
- **Tool_Curriculum** — หลักสูตร
- **Tool_Internship** — สหกิจ/ฝึกงาน
- **Tool_GeneralEd** — วิชา GE
- **Tool_Campus** — อาคาร/แผนที่
- **Tool_ITServices** — อีเมล/WiFi/IT
- **Tool_FAQ** — คำถามพบบ่อย`,

  Sticky: `### ⚙️ AI Gateway

ตั้งค่า credentials:
- OpenAI / OpenRouter
- Qdrant API
- Google Drive & Sheets (ทำเนียบเว็บหน่วยงาน)
- Tavily (ค้นเว็บสำรอง)`,

  "Sticky Note4": `### 🧠 Knowledge Base

ธีมเดโม: **${BRAND}**
- เน้นข้อมูลจาก **เว็บไซต์แต่ละหน่วยงาน** (คณะ สำนัก ศูนย์)
- ไม่ใช่ข้อมูลมหาวิทยาลัยจริง
- แทนที่ไฟล์ต้นทางด้วย PDF/Sheet ของคุณ
- ชื่อ collection ต้องตรงกับ Tool nodes`,

  "Sticky Note6": `## 🎓 Chatbot Popup Demo — ${BRAND}

**วิธีใช้งาน (Quick Start)**
1. Import workflow เข้า n8n
2. ตั้งค่า credentials ทุกโหนด 🔑
3. เตรียม Google Sheet ทำเนียบเว็บหน่วยงาน (คอลัมน์: ชื่อหน่วยงาน, URL, โทร, อีเมล)
4. รัน Load Data flow index ข้อมูลแต่ละหน่วยงาน
5. Activate workflow → คัดลอก Webhook URL
6. วาง URL ในโค้ดติดตั้งจากหน้า Chatbot Sandbox

**ทดสอบถาม**
- "เว็บคณะวิศวกรรมคืออะไร"
- "สำนักทะเบียนเปิดกี่โมง"
- "ลงทะเบียนเมื่อไหร่"
- "อีเมลนักศึกษาใช้ยังไง"

**JSON ตอบกลับ:** \`{ mascot, expression, answer, source }\``,

  "Sticky Note9": `## Qdrant Setup

Collections:
\`EduPortal_Admissions\` \`EduPortal_Registrar\` \`EduPortal_Graduate\`
\`EduPortal_Curriculum\` \`EduPortal_Internship\` \`EduPortal_GeneralEd\`
\`EduPortal_Campus\` \`EduPortal_FAQ\` \`EduPortal_IT\`
\`Q_edu_departments\` ← ทำเนียบเว็บหน่วยงาน

ลบ collection เก่าก่อน re-index ถ้าข้อมูลเปลี่ยน`,

  "Usage Guide": `### 📖 คู่มือ Workflow เดโมมหาวิทยาลัย

**หลัง Import ต้องทำ**
1. เชื่อม credentials (OpenAI, Qdrant, Google, Tavily)
2. เปลี่ยน \`YOUR_GOOGLE_SHEET_DOCUMENT_ID\` และ \`YOUR_GOOGLE_DRIVE_FOLDER_ID\`
3. สร้าง Sheet **ทำเนียบเว็บหน่วยงาน** — แต่ละแถว = 1 หน่วยงาน (ชื่อ, URL, โทร, อีเมล, Facebook)
4. อัปโหลดเอกสาร/PDF จากแต่ละหน่วยงานลง Google Drive แยกโฟลเดอร์
5. Execute Load Data จนครบทุก collection
6. Activate → นำ Webhook URL ไปใส่ Chatbot Sandbox

**ตัวอย่างคำถาม**
- "เว็บคณะบริหารธุรกิจ"
- "ติดต่อสำนักทะเบียนยังไง"
- "ปฏิทินเปิดเทอมเมื่อไหร่"
- "คณะไหนดูแลหลักสูตรคอมพิวเตอร์"
- "WiFi นักศึกษาใช้ยังไง"

⚠️ เดโม "${BRAND}" — ปรับชื่อหน่วยงาน/collection ให้ตรงกับมหาวิทยาลัยของคุณ`,
};

function replaceInValue(value) {
  if (typeof value === "string") {
    let s = value;
    const sorted = Object.entries(nameMap).sort((a, b) => b[0].length - a[0].length);
    for (const [from, to] of sorted) s = s.split(from).join(to);
    s = s.split("https://bloomcafe-demo.example.com/").join(`${DEMO_URL}/`);
    s = s.split("https://example.com/docs/").join(`${DEMO_URL}/`);
    s = s.split("@example.org").join("@student.demo-university.example.edu");
    s = s.split("example.org").join("demo-university.example.edu");
    return s;
  }
  if (Array.isArray(value)) return value.map(replaceInValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = replaceInValue(v);
    return out;
  }
  return value;
}

const themed = replaceInValue(data);
themed.name = `${BRAND} — Chatbot Popup Demo Workflow`;

for (const node of themed.nodes) {
  if (node.type === "n8n-nodes-base.stickyNote" && STICKY_NOTES[node.name]) {
    node.parameters.content = STICKY_NOTES[node.name];
  }
  if (node.name === "Sticky Note") {
    node.parameters.content = STICKY_NOTES.Sticky;
  }
  if (node.name === "AI Agent") {
    node.parameters.options.systemMessage = MAIN_SYSTEM_PROMPT;
  }
  if (node.name === "AI Agent information") {
    node.parameters.options.systemMessage = INFO_SYSTEM_PROMPT;
  }
  if (node.name === "Intent Router") {
    node.parameters.jsCode = INTENT_ROUTER_CODE;
  }
  if (node.name === "When chat message received") {
    node.parameters.initialMessages = `ยินดีต้อนรับสู่ ${BRAND}! 🎓\nนี่คือน้อง${MASCOT_TH} ผู้ช่วยค้นหาข้อมูลและเว็บไซต์หน่วยงานต่างๆ (เดโม)`;
  }
  if (toolDescriptions[node.name]) {
    node.parameters.toolDescription = toolDescriptions[node.name];
  }
  if (node.parameters?.queryString?.includes("in parents")) {
    node.parameters.queryString = "'YOUR_GOOGLE_DRIVE_FOLDER_ID' in parents";
  }
  if (node.parameters?.jsCode?.includes("ปิดปรับปรุงชั่วคราว")) {
    node.parameters.jsCode = `// กำหนดข้อความแจ้งปรับปรุงระบบโดยตรง
const systemMaintenanceMessage = "สวัสดีค่ะ ขณะนี้น้อง${MASCOT_TH}อยู่ระหว่างปรับปรุงระบบชั่วคราว ขออภัยในความไม่สะดวกนะคะ 🎓";
return [{
  json: {
    output: systemMaintenanceMessage,
    mascot: "${MASCOT_EN}",
    expression: "sorry",
    answer: systemMaintenanceMessage,
    source: "ระบบฐานข้อมูล ${BRAND} (ปิดปรับปรุงชั่วคราว)"
  }
}];`;
  }
  if (node.name === "WEB" || node.name === "campus_map") {
    if (node.parameters?.options?.include_domains) {
      node.parameters.options.include_domains = ["demo-university.example.edu"];
    }
  }
}

const hiNode = themed.nodes.find((n) => n.name === "Edit Fields hi");
if (hiNode) {
  hiNode.parameters.jsonOutput = `{\n  "mascot": "${MASCOT_EN}",\n  "expression": "welcome",\n  "answer": "สวัสดีค่ะ! หนูชื่อ \\"${MASCOT_TH}\\" ผู้ช่วยของ${BRAND} 🎓 วันนี้อยากถามเรื่องเว็บหน่วยงาน การรับสมัคร ทะเบียน หรือระบบ IT ดีคะ?",\n  "source": "ระบบต้อนรับอัตโนมัติ"\n}`;
}

if (!themed.nodes.some((n) => n.name === "Usage Guide")) {
  themed.nodes.push({
    parameters: {
      content: STICKY_NOTES["Usage Guide"],
      height: 560,
      width: 480,
      color: 4,
    },
    type: "n8n-nodes-base.stickyNote",
    position: [-5600, -2128],
    typeVersion: 1,
    id: "demo-usage-guide-note",
    name: "Usage Guide",
  });
}

function remapConnections(connections, map) {
  const walk = (obj) => {
    if (Array.isArray(obj)) return obj.map(walk);
    if (obj && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === "node" && typeof v === "string" && map[v]) out[k] = map[v];
        else out[k] = walk(v);
      }
      return out;
    }
    return obj;
  };
  const next = {};
  for (const [key, value] of Object.entries(connections)) {
    next[map[key] || key] = walk(value);
  }
  return next;
}

themed.connections = remapConnections(themed.connections, nameMap);

themed.connections.Tool_Departments = {
  ai_tool: [
    [
      { node: "AI Agent", type: "ai_tool", index: 0 },
      { node: "AI Agent information", type: "ai_tool", index: 0 },
    ],
  ],
};

fs.writeFileSync(flowPath, JSON.stringify(themed, null, 2));

const out = JSON.stringify(themed);
const bad = [/Bloom Café|BloomCafe_|Tool_OnlineOrder|bloomcafe/i];
const good = [/EduPortal_|Tool_Departments|มหาวิทยาลัยตัวอย่าง|เว็บไซต์หน่วยงาน/];
for (const re of bad) console.log("removed?", re, out.match(re) ? "STILL FOUND" : "ok");
for (const re of good) console.log("present?", re, out.match(re) ? "ok" : "MISSING");
console.log("Nodes:", themed.nodes.length);
console.log("Written:", flowPath);
