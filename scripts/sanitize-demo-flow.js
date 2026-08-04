import fs from "fs";
import { execSync } from "child_process";

const src = "c:/Users/topza-pc/Downloads/UBU Chatbot University - DEMO.json";
const dest = "d:/CursorAI/ai-gateway/frontend/public/examples/chatbot-demo-flow.json";

let s = fs.readFileSync(src, "utf8");

const reps = [
  ["น้องบัวบาน", "น้องยูบิ"],
  ["มหาวิทยาลัยอุบลราชธานี", "องค์กรตัวอย่าง (Demo Organization)"],
  ["ม.อุบลฯ", "องค์กรของคุณ"],
  ["UBU Chatbot University", "Chatbot Popup Demo Workflow"],
  ["## UBU Chatbot OSD", "## Chatbot Popup Demo"],
  ["UBU AI GATEWAY", "AI GATEWAY (ตั้งค่า credentials ของคุณ)"],
  ["UBUChat_", "DemoChat_"],
  ["Q_ubu_information", "Q_demo_org_info"],
  ["Tool_ubu_information", "Tool_org_information"],
  ["ubu_information_sheets", "org_information_sheets"],
  ['"ubu_information"', '"org_information"'],
  ["ubu_information", "org_information"],
  ["ubu_map", "org_map"],
  ["Tool_UBU_Web", "Tool_Web_Search"],
  ["https://www.ubu.ac.th/UBU2025/", "https://example.com/docs/"],
  ["https://n8n.ubu.ac.th/", "https://your-n8n.example.com/"],
  ["@ubu.ac.th", "@example.org"],
  ["@ubu", "@example"],
  ["ubu.ac.th", "example.org"],
  ["บัวบาน", "ยูบิ"],
  ["BuaBan", "Ubie"],
  ["GuayJub", "Ubie"],
  ["ฐานข้อมูลมหาวิทยาลัยอุบลราชธานี", "ฐานข้อมูล demo (แก้ตามองค์กรของคุณ)"],
  ["ระบบฐานข้อมูลมหาวิทยาลัยอุบลราชธานี", "ระบบฐานข้อมูล demo"],
  ["ข้อมูลมหาวิทยาลัย", "ข้อมูลองค์กรตัวอย่าง"],
  ["เกี่ยวกับมหาวิทยาลัย", "เกี่ยวกับองค์กรของคุณ"],
  ["ภายในมหาวิทยาลัยอุบลราชธานี", "ภายในองค์กรของคุณ"],
  [" (UBU)", " (Demo)"],
  ["ประจำมหาวิทยาลัย", "ประจำองค์กร"],
  ["UBU_Knowledge", "Demo_Knowledge"],
  ["UBU คำถามที่พบบ่อย (FAQ)", "Demo คำถามที่พบบ่อย (FAQ)"],
  ["18CezxhgUny2h1RQvs1G9MuHpYmzJjJ4Ooy_mwoyQG-Y", "YOUR_GOOGLE_SHEET_DOCUMENT_ID"],
  ["ของมหาวิทยาลัย", "ขององค์กร"],
  ["มหาวิทยาลัย", "องค์กร"],
  ["เว็บมอ", "เว็บหน่วยงาน"],
  [" (Demo Organization) (Demo)", " (Demo Organization)"],
];

for (const [a, b] of reps) s = s.split(a).join(b);

const data = JSON.parse(s);
data.name = "Chatbot Popup Demo Workflow";

const walk = (obj) => {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) return obj.forEach(walk);
  for (const k of Object.keys(obj)) {
    if (k === "name" && typeof obj[k] === "string") {
      const v = obj[k];
      if (/^(น้อง)?ยูบิ$|บัว|ubu/i.test(v) && v.length < 50) {
        obj[k] = "Demo Chatbot";
      }
    }
    walk(obj[k]);
  }
};
walk(data);

const str = JSON.stringify(data);
const patterns = [/ubu/i, /อุบล/, /บัวบาน/i, /BuaBan/i, /เว็บมอ/i, /UBUChat/];
for (const p of patterns) {
  const m = str.match(new RegExp(p.source, p.flags + "g"));
  if (m) console.log(p.source, "=>", m.length);
}

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
console.log("Written:", dest);
console.log("Nodes:", data.nodes.length, "Size:", str.length);

execSync("node scripts/theme-demo-flow.js", { cwd: "d:/CursorAI/ai-gateway", stdio: "inherit" });
