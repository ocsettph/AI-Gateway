# UBU Send Email API — Prompt Reference

ใช้ไฟล์นี้เป็น prompt / spec สำหรับให้ AI หรือนักพัฒนา implement การส่งอีเมลในโปรเจกต์อื่น  
**ส่งเมลตรงผ่าน UBU Mail Gateway เท่านั้น — ไม่ใช้ n8n, ไม่ใช้ AI Gateway wrapper**

---

## สิ่งที่ต้องทำ

Implement ฟังก์ชันส่งอีเมลโดยเรียก HTTP POST ไปที่ UBU Mail Gateway

---

## API Spec

| รายการ | ค่า |
|--------|-----|
| Method | `POST` |
| URL | `http://202.28.49.210:8000` |
| Content-Type | `application/json` |
| Timeout แนะนำ | 10 วินาที |

### Request body (JSON)

```json
{
  "to": "user@ubu.ac.th",
  "subject": "หัวข้ออีเมล",
  "text": "เนื้อหา plain text",
  "html": "<p>เนื้อหา HTML</p>",
  "system": "SWDEV2"
}
```

| Field | บังคับ | คำอธิบาย |
|-------|--------|----------|
| `to` | ✅ | อีเมลผู้รับ |
| `subject` | ✅ | หัวข้ออีเมล |
| `html` | แนะนำ | เนื้อหา HTML |
| `text` | แนะนำ | เนื้อหา plain text (fallback สำหรับ client ที่ไม่รองรับ HTML) |
| `system` | แนะนำ | ชื่อระบบต้นทาง เช่น `"SWDEV2"` หรือชื่อโปรเจกต์ของคุณ |

### Response

- สำเร็จ: HTTP 2xx (ไม่มี schema มาตรฐานที่แน่นอน — ถือว่าสำเร็จเมื่อ status 2xx)
- ล้มเหลว: HTTP 4xx/5xx หรือ timeout — ให้ log error และ return false / throw

---

## ข้อจำกัดสำคัญ

1. **เครือข่ายภายใน UBU** — URL `202.28.49.210:8000` ใช้ได้จากเซิร์ฟเวอร์ในเครือข่าย UBU เท่านั้น (ไม่เปิด public internet)
2. **ไม่ต้องใช้ n8n** — ห้ามเรียก `/api/n8n/send-email` หรือ workflow n8n
3. **ไม่ต้องใช้ API key** — endpoint นี้ไม่มี authentication header
4. ส่งทั้ง `html` และ `text` ถ้าเป็นไปได้ เพื่อความ compatible

---

## ตัวอย่าง cURL

```bash
curl -X POST "http://202.28.49.210:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@ubu.ac.th",
    "subject": "ทดสอบส่งอีเมล",
    "text": "สวัสดีครับ",
    "html": "<p>สวัสดีครับ</p>",
    "system": "SWDEV2"
  }'
```

---

## ตัวอย่าง Node.js (axios)

```javascript
async function sendEmail(to, subject, html, text, system = 'SWDEV2') {
  const axios = require('axios');
  try {
    await axios.post(
      process.env.MAIL_API_URL || 'http://202.28.49.210:8000',
      { to, subject, html, text, system },
      { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.error('sendEmail failed:', err?.message || err);
    return false;
  }
}

// ใช้งาน
await sendEmail(
  'user@ubu.ac.th',
  'หัวข้อทดสอบ',
  '<p>เนื้อหา <strong>HTML</strong></p>',
  'เนื้อหา plain text'
);
```

---

## ตัวอย่อง Node.js (fetch)

```javascript
async function sendEmail(to, subject, html, text, system = 'SWDEV2') {
  const res = await fetch(process.env.MAIL_API_URL || 'http://202.28.49.210:8000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, text, system }),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`Mail API ${res.status}`);
  return true;
}
```

---

## ตัวอย่าง PHP

```php
function sendEmail(string $to, string $subject, string $html, string $text, string $system = 'SWDEV2'): bool {
    $url = getenv('MAIL_API_URL') ?: 'http://202.28.49.210:8000';
    $payload = json_encode([
        'to' => $to,
        'subject' => $subject,
        'html' => $html,
        'text' => $text,
        'system' => $system,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $status >= 200 && $status < 300;
}
```

---

## ตัวอย่าง Python

```python
import os
import requests

def send_email(to: str, subject: str, html: str, text: str, system: str = "SWDEV2") -> bool:
    url = os.getenv("MAIL_API_URL", "http://202.28.49.210:8000")
    try:
        r = requests.post(
            url,
            json={"to": to, "subject": subject, "html": html, "text": text, "system": system},
            timeout=10,
        )
        r.raise_for_status()
        return True
    except Exception as e:
        print("send_email failed:", e)
        return False
```

---

## Environment variables (แนะนำ)

```env
MAIL_API_URL=http://202.28.49.210:8000
MAIL_API_SYSTEM=SWDEV2
```

---

## Prompt สั้น ๆ (copy-paste ให้ AI)

```
Implement email sending using UBU Mail Gateway only (no n8n).

POST http://202.28.49.210:8000
Content-Type: application/json
Body: { to, subject, html, text, system }

Required: to, subject
Recommended: send both html and text
system: use project name or "SWDEV2"
Timeout: 10 seconds
Must run from UBU internal network.
Return boolean success/failure and log errors.
```

---

## อ้างอิงจากโปรเจกต์ ai-gateway

Implementation ต้นฉบับ: `backend/server.js` → function `sendEmail()`
