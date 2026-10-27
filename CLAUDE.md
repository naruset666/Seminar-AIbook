# Reading Soundscape — Project Context

> ไฟล์นี้อธิบายโปรเจคทั้งหมดให้ AI ผู้ช่วยเขียนโค้ดเข้าใจบริบท ให้อ่านส่วน **"ขอบเขตเฟส 1 (Demo)"** ก่อนเขียนโค้ดทุกครั้ง

## 1. โปรเจคนี้คืออะไร

**ชื่อโครงงาน:** การสังเคราะห์เสียงและสภาพแวดล้อมของการอ่านหนังสือโดยใช้ระบบแนะนำด้วย AI
**English:** AI-Based Recommendation System for Synthesizing Reading Soundscapes and Environment
**ประเภท:** โครงงานปริญญาตรี (CP353761 สัมมนาทางวิทยาการคอมพิวเตอร์) สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น

เว็บแอปพลิเคชัน "คาเฟ่อ่านหนังสือออนไลน์" ผู้ใช้อัปโหลดไฟล์ PDF แล้วเปิดอ่านได้หลายไฟล์พร้อมกันแบบหลายแท็บ ระหว่างอ่าน ระบบจะเปิดเสียงบรรยากาศ (soundscape) ที่เหมาะกับผู้ใช้แต่ละคนไปพร้อมกัน เช่น เสียงฝน เสียงคาเฟ่ หรือห้องสมุดเงียบ ผู้ใช้ปรับความดังของเสียงแต่ละชั้น และเลือกให้เสียงอยู่หูซ้ายหรือขวาได้เอง

**ปัญหาที่แก้:** แอปเสียงบรรยากาศทั่วไปให้ผู้ใช้เลือกเสียงเอง และแยกการอ่านออกจากการฟังเสียง งานวิจัยชี้ว่าแต่ละคนตอบสนองต่อเสียงพื้นหลังไม่เหมือนกัน จึงไม่มีบรรยากาศชุดเดียวที่เหมาะกับทุกคน

## 2. วิสัยทัศน์ระบบเต็ม (เป้าหมายปลายทาง — ยังไม่ทำในเฟส 1)

1. **แบบสอบถาม → ระดับ 3 ระดับ:** ประเมินความต้องการสิ่งเร้าทางเสียงของผู้ใช้เป็นระดับ ต่ำ / กลาง / สูง
2. **AI เลือกสถานที่:** เทียบเวกเตอร์ผู้ใช้กับเวกเตอร์สถานที่ (มิติ Pleasantness และ Eventfulness ตาม Circumplex Model of Soundscape Perception) ด้วย Cosine Similarity
3. **AI สร้างเสียง:** ใช้แบบจำลอง Text-to-Audio (Stable Audio Open, AudioGen) สร้างเสียงแต่ละชั้นจากคำบรรยาย **ไว้ล่วงหน้า** แล้วตัดต่อเป็น seamless loop ไม่ได้สร้างแบบ real-time
4. **ผสมเสียงสดบนเบราว์เซอร์:** ใช้ Web Audio API ให้แต่ละชั้นมี GainNode กับ StereoPannerNode ของตัวเอง
5. **เรียนรู้จากผลตอบรับ:** ใช้ Collaborative Filtering ปรับคำแนะนำจากการปรับเสียงและคะแนนความพึงพอใจของผู้ใช้

---

## 3. ⚠️ ขอบเขตเฟส 1 (Demo สำหรับนำเสนอเทอม 1) — สิ่งที่ต้องทำตอนนี้

> **สำคัญ: เฟสนี้ยังไม่มีการใช้ AI สร้างเสียงบรรยากาศ และยังไม่มีโมเดล ML**
> เสียงทั้งหมดเป็นไฟล์เสียงสำเร็จรูปที่เราเตรียมไว้ใน `public/sounds/` การแนะนำบรรยากาศใช้ **กฎแบบ rule-based จากคะแนนแบบสอบถาม** เท่านั้น
> ห้ามเพิ่มการเรียกโมเดล AI หรือ ML library, GPU หรือ API ภายนอกในเฟสนี้ ให้ออกแบบโค้ดให้เปลี่ยนเป็น AI ได้ภายหลัง (ดูหัวข้อ 9)

เป้าหมายของเฟสนี้คือ **demo เล็ก ๆ ที่ทำงานได้จริงตั้งแต่ต้นจนจบ** ใช้ประกอบการนำเสนอแนวคิดและงานวิจัย ไม่ใช่ระบบสมบูรณ์

### ฟีเจอร์และลำดับความสำคัญ

| ลำดับ | ฟีเจอร์ | ความสำคัญ |
|---|---|---|
| 1 | Register / Login / Logout เก็บบัญชีในฐานข้อมูล | ต้องมี |
| 2 | แบบสอบถาม → ประเมินระดับ → แนะนำบรรยากาศจากชุดที่เตรียมไว้ | ต้องมี |
| 3 | **หน้าอ่าน: อัปโหลด PDF หลายไฟล์ + เปิดอ่านหลายแท็บ** | ⭐ **จุดขายหลักของการนำเสนอ ต้องทำให้ดีที่สุด** |
| 4 | เล่นเสียงบรรยากาศระหว่างอ่าน ปรับความดังแยกแต่ละชั้น | ต้องมี |
| 5 | ปรับตำแหน่งเสียงซ้าย-ขวา (pan) แยกแต่ละชั้น | ควรมี |
| 6 | จำหน้าล่าสุดที่อ่านของแต่ละไฟล์ และข้ามแบบสอบถามเมื่อกลับมาใช้อีกครั้ง | ควรมี |

### ไม่อยู่ในขอบเขตเฟส 1
- การสร้างเสียงด้วย AI (Stable Audio Open / AudioGen)
- Cosine similarity, Collaborative Filtering, ระบบเรียนรู้จากผลตอบรับ
- ระบบเลือกที่นั่งในคาเฟ่, วิดีโอบรรยากาศ, social features
- Deploy ขึ้น production (รัน local หรือ Docker ก็พอ)

---

## 4. User Flow (เฟส 1)

```
[Landing] → [Register / Login]
                 │
                 ├─ ผู้ใช้ใหม่ / ยังไม่เคยทำแบบสอบถาม → [Questionnaire] → [Result: บรรยากาศที่แนะนำ] → [Reading Room]
                 │
                 └─ เคยทำแล้ว → [Reading Room] (โหลด preset ล่าสุด + แท็บ PDF เดิม)
```

- หน้า Result แสดงบรรยากาศที่แนะนำพร้อมเหตุผลสั้น ๆ มีปุ่ม "ฟังตัวอย่าง" และให้ผู้ใช้เปลี่ยนไปใช้บรรยากาศอื่นเองได้
- ใน Reading Room ผู้ใช้ทำแบบสอบถามใหม่ได้จากเมนูโปรไฟล์
- หน้า "ความชอบของคุณ" (`/preferences`) แสดงผลแบบทดสอบทุกครั้งที่เคยทำ ผู้ใช้ตั้งชื่อ mood เลือกกลับมาใช้ เปลี่ยนสถานที่ภายใน mood นั้น หรือลบได้

## 5. แบบสอบถามและการประเมิน (rule-based, tag matching)

ใช้แบบสอบถาม 5 ข้อจาก `reading-place-quiz/` (ต้นฉบับ HTML ของทีม) แต่ละข้อวัด 1 มิติและอิงงานวิจัย ข้อมูลคำถามอยู่ที่ `backend/src/services/questions.js`

| ข้อ | `id` | มิติ | งานวิจัยที่รองรับ |
|---|---|---|---|
| 1 | `noise_level` | ระดับเสียงรอบตัว (เงียบ / กึ่งกลาง / คึกคัก) | Furnham & Strbac (2002); Söderlund et al. (2007) |
| 2 | `speech_sensitivity` | ความไวต่อเสียงพูด | Vasilev et al. (2018); Perham & Currie (2014) |
| 3 | `sound_type` | ประเภทเสียงที่ชอบ (Pleasantness) | Axelsson et al. (2010); Alvarsson et al. (2010) |
| 4 | `eventfulness` | ความเคลื่อนไหวของบรรยากาศ (Eventfulness) | Axelsson et al. (2010); ISO 12913-1 (2014) |
| 5 | `reading_style` | ลักษณะงานอ่าน (เชิงลึก / ทั่วไป / ผ่อนคลาย) | Thompson et al. (2012); Perham & Currie (2014) |

**การคิดคะแนน:** ตัวเลือกแต่ละข้อมี tag และสถานที่ (preset) แต่ละแห่งก็มี tag ถ้าคำตอบข้อใดมี tag ตรงกับสถานที่อย่างน้อย 1 tag สถานที่นั้นได้ 1 คะแนน รวมเต็ม 5 นับรายข้อเพื่อให้ทุกข้อมีน้ำหนักเท่ากัน แสดงอย่างน้อย 3 อันดับ (รวมอันดับที่คะแนนเท่ากับอันดับ 3) อันดับ 1 จะกลายเป็น preset ที่ใช้อยู่ทันที และผู้ใช้เลือกอันดับอื่นแทนได้ในหน้าผลลัพธ์
- `level` (low/medium/high) ที่บันทึกคู่กับคำตอบ มาจากคำตอบข้อ 1
- ตรรกะนี้อยู่ใน `TagMatchRecommender` ใน `backend/src/services/recommender.js` ที่เดียว (ดูหัวข้อ 9)
- เก็บคำตอบดิบ (raw answers) และผลลัพธ์ลงฐานข้อมูล เพราะจะใช้เป็นข้อมูลฝึกโมเดลในอนาคต
- **ข้อจำกัดที่ต้องบอกตอนนำเสนอ:** แบบสอบถามนี้ทีมออกแบบเองจากแนวคิดในงานวิจัย ไม่ใช่แบบสอบถามมาตรฐาน และ tag ของสถานที่เป็นค่าที่ทีมกำหนดเอง

## 6. Soundscape Presets (ไฟล์เสียงสำเร็จรูป)

แต่ละ preset คือ **ชุดของเสียงหลายชั้น (layers)** ที่เล่นซ้อนกัน แต่ละชั้นมีค่าความดังและ pan เริ่มต้นของตัวเอง

```ts
// ตัวอย่างโครงสร้าง (frontend/src/data/presets.ts หรือ seed ลง DB)
{
  id: "cafe",
  name: "คาเฟ่",
  description: "เสียงคนคุยเบา ๆ เสียงแก้วกาแฟ เหมาะกับคนที่อ่านได้ดีเมื่อมีเสียงรอบตัว",
  level: "high",
  tags: ["คึกคัก", "มีเสียงพูด", "ผู้คน", "มีชีวิตชีวา", "ผ่อนคลาย"],
  layers: [
    { id: "cafe_chatter", label: "เสียงคนคุย", src: "/sounds/cafe_chatter.wav", volume: 0.5, pan: 0 },
    { id: "cups",         label: "แก้วกาแฟ",   src: "/sounds/cups.wav",         volume: 0.3, pan: 0.4 },
    { id: "light_rain",   label: "ฝนเบา ๆ",    src: "/sounds/light_rain.wav",   volume: 0.2, pan: -0.3 }
  ]
}
```

- ไฟล์เสียงใช้ไฟล์ที่ใช้ได้อย่างถูกต้อง เช่น CC0 จาก Freesound หรือ Pixabay ทุกไฟล์ต้องเป็น **seamless loop**
- **ห้ามใช้เสียงที่มีเนื้อร้องหรือเสียงพูดที่ฟังรู้เรื่อง** เพราะรบกวนการอ่านมากที่สุด (Vasilev et al., 2018) เสียงคนคุยในคาเฟ่ต้องเป็นเสียงจอแจที่ฟังไม่ออก
- Presets คือสถานที่ 10 แห่งจากแบบสอบถาม (`cafe`, `library`, `train`, `waterfall`, `fireplace`, `beach`, `forest`, `bookshop`, `park`, `rainynight`) seed อยู่ใน `backend/src/db/seed.sql` พร้อม `tags` สำหรับจับคู่
- ไฟล์เสียงต้นฉบับของทีมอยู่ใน `SOUND FOR AI BOOK/<ชื่อสถานที่>/` (33 ไฟล์) สคริปต์ `python frontend/scripts/prepare_sounds.py` (ต้องมี ffmpeg) สร้างสำเนาสำหรับเว็บไว้ที่ `frontend/public/sounds/<preset_id>/<ชื่อไฟล์>.mp3` คือ ตัดยาวไม่เกิน 90 วิ, ทำ crossfade ให้วนต่อเนื่อง, mono 44.1 kHz (ให้ pan ทำงานตรง), ปรับความดัง EBU R128 ที่ −20 LUFS ถ้าเพิ่ม/เปลี่ยนไฟล์เสียงให้รันสคริปต์ใหม่แล้วแก้ `seed.sql`

## 7. ⭐ Reading Room — Multi-PDF Multi-Tab (ฟีเจอร์หลัก)

นี่คือส่วนที่จะนำเสนอเป็นหลัก ต้องลื่น สวย และไม่มีบั๊ก

### ความต้องการ
- **อัปโหลด:** ลากวาง (drag & drop) หรือกดเลือกไฟล์ อัปโหลดหลายไฟล์พร้อมกันได้ รับเฉพาะ `.pdf` ตรวจทั้งนามสกุลและ MIME type จำกัดขนาด 50 MB ต่อไฟล์ และแสดงความคืบหน้าการอัปโหลด
- **คลังเอกสาร (sidebar):** แสดงรายการ PDF ที่ผู้ใช้เคยอัปโหลด กดเพื่อเปิดในแท็บใหม่ได้ และลบไฟล์ได้
- **แท็บ:**
  - เปิดหลายไฟล์พร้อมกัน แต่ละแท็บแสดงชื่อไฟล์ (ยาวเกินให้ตัดด้วย …) และมีปุ่มปิด
  - สลับแท็บแล้ว **ตำแหน่งหน้า, ระดับซูม และตำแหน่ง scroll ของแต่ละแท็บต้องคงอยู่**
  - ถ้ากดเปิดไฟล์ที่เปิดอยู่แล้ว ให้สลับไปแท็บนั้น ไม่เปิดซ้ำ
  - คีย์ลัด: `Ctrl+Tab` / `Ctrl+Shift+Tab` สลับแท็บ และ `Ctrl+W` ปิดแท็บ (เฉพาะเมื่อโฟกัสอยู่ในแอป)
  - ถ้ามีเวลา: ลากจัดลำดับแท็บ (drag to reorder)
- **ตัวอ่าน PDF:**
  - ใช้ PDF.js (`pdfjs-dist` หรือ `react-pdf`)
  - มีปุ่มหน้าถัดไป/ก่อนหน้า ช่องกรอกเลขหน้า "หน้า X / Y" ซูมเข้า/ออก และพอดีความกว้าง
  - render แบบ lazy ทีละหน้าที่มองเห็น (virtualize) เพื่อให้ไฟล์ใหญ่ไม่หน่วง
  - แท็บที่ไม่ได้แสดงอยู่ไม่ต้อง render canvas แต่ต้องเก็บ state ไว้
- **บันทึกความคืบหน้า:** บันทึก `last_page` ของแต่ละไฟล์ลงฐานข้อมูล (debounce ประมาณ 1–2 วินาที) เปิดไฟล์ครั้งถัดไปให้ไปที่หน้าล่าสุดทันที และจำว่าแท็บไหนเปิดค้างไว้เพื่อคืนค่าเมื่อเข้าใช้ครั้งถัดไป
- **ทำงานร่วมกับเสียง:** เสียงบรรยากาศ **ต้องเล่นต่อเนื่องไม่สะดุด** ขณะสลับแท็บ เปิด/ปิดไฟล์ หรืออัปโหลดไฟล์ ให้เก็บ audio engine ไว้ที่ระดับ layout/context ไม่ใช่ในคอมโพเนนต์ของแท็บ

### สถานะปัจจุบัน (หน้า `/reading`)
- ทำแล้ว: กระดานไม้ก๊อกขนาดใหญ่ (ดีไซน์ตามภาพอ้างอิงของทีม) มีปุ่ม Upload PDF ตรงกลาง ลากวางไฟล์บนกระดานได้ อัปโหลดหลายไฟล์พร้อม progress bar ตรวจนามสกุล, MIME, ขนาด 50 MB และ signature `%PDF-` (ทั้งฝั่ง browser และ backend) แท็บแบบป้ายกระดาษ ปุ่ม `+` เปิดคลังเอกสาร (การ์ดโน้ตปักหมุด) ตัวอ่าน PDF แบบเลื่อนต่อเนื่อง render canvas เฉพาะหน้าใกล้จอ จำตำแหน่ง/ซูมของแต่ละแท็บ บันทึก `last_page` (debounce 1.5 วิ) และแท็บที่เปิดไว้ลง DB ปุ่ม ←/→ เปลี่ยนหน้า ตัวละครจากหน้าแรกย่อขนาดอยู่ใต้กระดาน (`DeskScene`)
- เครื่องมือ annotation: อ่าน/เลื่อน, ไฮไลต์ (5 สี, ink แบบ multiply), ปากกา (4 สี), ยางลบ (ลบทีละเส้น), ย้อนกลับ (Ctrl+Z, สูงสุด 50 ขั้น) บันทึกอัตโนมัติลงตาราง `document_annotations` (debounce 1 วิ) พิกัดเก็บเป็นหน่วย PDF.js viewport scale 1 ไม่รวมการหมุนของผู้ใช้ จึงถูกต้องทุกระดับซูม/การหมุน
- ปุ่มหมุนหน้า 90° (ต่อแท็บ ไม่บันทึกลง DB), ปุ่มเต็มจอ (Fullscreen API บน `.board`), ปุ่ม Export PDF: ใช้ `pdf-lib` วาดเส้นเป็น vector ลงสำเนาไฟล์ต้นฉบับแล้วดาวน์โหลด (`frontend/src/reader/exportPdf.ts`) ข้อความเดิมยังเลือก/ค้นหาได้ ไฟล์ที่เข้ารหัสอาจ export ไม่ได้
- ช่องซูมพิมพ์ตัวเลขได้ (30–400%) ทั้งโหมดปกติและเต็มจอ
- โหมดแยกสองหน้า (ปุ่มในแถบเครื่องมือ) มี 2 แบบ สลับด้วยปุ่ม 🔗 บนป้ายหัว: "ต่อกัน" = `PdfPane` เดียวแบบ `spread` จัดหน้าเป็นคู่ต่อแถว (1|2, 3|4, …) เลื่อนพร้อมกันเหมือน Two page view ของ Edge ปุ่มหน้าถัดไป/ลูกศรขยับทีละ 2 หน้า; "อิสระ" = `PdfPane` สองอันซ้าย/ขวา แต่ละฝั่งพิมพ์เลขหน้าเองใน `PaneHeader` ปุ่ม/ลูกศร/ซูมทำงานกับฝั่งที่เลือก (คลิกหรือเลื่อนล้อเมาส์) ตำแหน่งอ่านเก็บเป็น "index หน้าแรกของแถว + เศษ" จึงสลับโหมดแล้วยังอยู่หน้าเดิม เก็บใน `TabState` (`split`, `rightPage`, `linked`) ไม่บันทึกลง DB
- โหมดเต็มจอ (`FloatingToolbarDock`): แถบเครื่องมือซ่อนอยู่ โผล่เมื่อเมาส์อยู่ใกล้ขอบล่าง 90px มีที่จับลากได้ วางชิดซ้าย/ขวา (140px) = แถบแนวตั้ง วางที่อื่น = ค้างตำแหน่งนั้น แถบที่ถูกย้ายจะกลับไปอยู่ด้านล่างเมื่อเมาส์กลับไปที่ขอบล่าง ตำแหน่งไม่บันทึกข้ามการเข้าเต็มจอแต่ละครั้ง
- แผงเสียง (`frontend/src/components/soundscape/`): อยู่ด้านขวาของกระดาน ย่อเก็บได้ด้วยปุ่ม » หรือโน้ตสีเหลือง ♪ มุมกระดาน เลือกบรรยากาศ (10 แห่ง), ปุ่มเล่น/หยุดรวม, ความดังรวม (เก็บใน localStorage), แต่ละชั้นเปิด/ปิดและปรับความดังได้, ติ๊ก "ปรับซ้าย-ขวา" เพื่อแสดง slider L–R (ดับเบิลคลิกกลับกลาง), ปุ่มรีเซ็ตกลับค่าเริ่มต้น ค่าต่อชั้นและบรรยากาศที่เลือกบันทึกลง `user_settings` (debounce 0.8 วิ) Audio engine อยู่ที่ `frontend/src/audio/` (`AudioEngine.ts` + `AudioProvider.tsx` ครอบทั้งห้องอ่าน เสียงจึงไม่สะดุดตอนสลับแท็บ/อัปโหลด) ตัดช่วงเงียบหัวท้ายที่ encoder ใส่ใน MP3 ออกจาก loop อัตโนมัติ
- ยังไม่ทำ: ปุ่ม "ฟังตัวอย่าง" ในหน้าผลแบบสอบถาม, dark mode, ลากจัดลำดับแท็บ, ไฮไลต์แบบเลือกข้อความ (ต้องมี text layer), คีย์ลัด Ctrl+Tab / Ctrl+W (Chrome สงวนคีย์เหล่านี้ให้เบราว์เซอร์ หน้าเว็บดักไม่ได้)
- โค้ด: `frontend/src/store/ReaderContext.tsx` (state แท็บ/เอกสาร/การบันทึก), `frontend/src/reader/pdfCache.ts` (โหลด PDF.js), `frontend/src/components/reader/*`

### Layout แนะนำ (เดิม)
```
┌───────────────────────────────────────────────────────────────┐
│ Logo   [แท็บ: บทที่1.pdf ×][paper.pdf ×][+]          Profile ▾ │
├──────────────┬────────────────────────────────┬───────────────┤
│ คลังเอกสาร    │                                │ Soundscape    │
│ + อัปโหลด     │        PDF Viewer              │ Preset: คาเฟ่ ▾│
│ • บทที่1.pdf  │                                │ ▶ / ❚❚ Master │
│ • paper.pdf  │                                │ ☕ คนคุย  ▬▬▬  │
│ • note.pdf   │                                │   L ◀──●──▶ R │
│              │   ◀  หน้า 12 / 40  ▶   − 100% + │ 🌧 ฝน    ▬▬▬  │
└──────────────┴────────────────────────────────┴───────────────┘
```
- ธีมโทนอุ่นแบบคาเฟ่ lofi สบายตา และควรมี dark mode สำหรับอ่านตอนกลางคืน
- แผงเสียงทางขวาย่อเก็บได้ เพื่อให้มีพื้นที่อ่านมากขึ้น

## 8. Audio Engine (Web Audio API)

```
AudioBufferSourceNode(loop=true) → GainNode(volume) → StereoPannerNode(pan) ─┐
AudioBufferSourceNode(loop=true) → GainNode(volume) → StereoPannerNode(pan) ─┼→ MasterGain → destination
AudioBufferSourceNode(loop=true) → GainNode(volume) → StereoPannerNode(pan) ─┘
```
- 1 ชั้นเสียง = 1 สาย ประกอบด้วย source, GainNode และ StereoPannerNode
- `volume` 0–1 ผูกกับ slider 0–100% และ `pan` -1 (ซ้าย) ถึง 1 (ขวา)
- ปรับค่าด้วย `setTargetAtTime` เพื่อไม่ให้เกิดเสียงคลิก และ fade in/out ประมาณ 1 วินาทีเมื่อเปลี่ยน preset
- สร้าง `AudioContext` หลังผู้ใช้กดปุ่มครั้งแรกเท่านั้น เพราะเบราว์เซอร์บล็อก autoplay
- ใช้ AudioContext เดียวทั้งแอป (singleton) ผ่าน React Context หรือ store
- ใช้ `AudioBufferSourceNode` กับ `loop = true` แทน `<audio loop>` เพราะวนซ้ำได้ไม่มีช่องว่าง
- บันทึกค่าความดังและ pan ที่ผู้ใช้ปรับลงฐานข้อมูล เพื่อใช้เป็นข้อมูลผลตอบรับในเฟสถัดไป

## 9. ออกแบบให้ต่อยอดเป็น AI ได้ (สำคัญต่อเฟส 2)

- แยกตรรกะการแนะนำไว้ใน service เดียว: `backend/src/services/recommender.js` → `recommend(answers) -> RecommendationResult`
  - เฟส 1 ใช้ `TagMatchRecommender` (`recommend(answers, presets)`)
  - เฟส 2 จะเพิ่ม `SimilarityRecommender` (Cosine Similarity บนมิติ Pleasantness/Eventfulness) และ Collaborative Filtering โดย interface เดิมไม่เปลี่ยน
- ให้ preset แต่ละตัวมีฟิลด์ `pleasantness` และ `eventfulness` (ค่า -1..1) ไว้เลย แม้เฟส 1 ยังไม่ได้ใช้
- ให้ชั้นเสียงแต่ละชั้นมีฟิลด์ `source_type: "library" | "generated"` เฟส 1 ใช้ `"library"` ทั้งหมด ส่วนเฟส 2 จะเพิ่มเสียงที่สร้างจาก Text-to-Audio โดยเก็บ `prompt` ที่ใช้สร้างไว้ด้วย

## 10. Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React + TypeScript + Vite, React Router, CSS แยกไฟล์ตามหน้า/คอมโพเนนต์ (ดีไซน์จาก Seminar-AIbook) |
| PDF | PDF.js (`pdfjs-dist` / `react-pdf`) |
| Audio | Web Audio API (ไม่ต้องใช้ library เพิ่ม) |
| State | React Context หรือ Zustand |
| Backend | Node.js + Express, express-validator |
| Auth | JWT (access token, `jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Database | PostgreSQL + `pg` (SQL ล้วน, schema ใน `backend/src/db/schema.sql`, รันด้วย `npm run db:migrate`) |
| File storage | โฟลเดอร์ `backend/storage/pdfs/{user_id}/` เก็บไฟล์ ส่วน DB เก็บแค่ path |
| Tools | Git/GitHub, Postman, Vitest |

## 11. Database Schema (เฟส 1)

```
users            (id, email UNIQUE, password_hash, display_name, created_at)
questionnaire_responses (id, user_id FK, answers JSON, score INT, level TEXT, recommended_preset_id, label TEXT NULL, chosen_preset_id, created_at)
                 -- 1 แถว = 1 "ความชอบ" (mood) ที่บันทึกไว้ ผู้ใช้ทำแบบทดสอบได้หลายครั้งและสลับกลับมาใช้ได้
presets          (id TEXT PK, name, description, level, pleasantness FLOAT, eventfulness FLOAT, tags TEXT[], sort_order INT)
sound_layers     (id TEXT PK, preset_id FK, label, file_path, default_volume FLOAT, default_pan FLOAT, source_type TEXT, prompt TEXT NULL)
user_settings    (user_id PK/FK, current_preset_id, layer_settings JSON  -- {layer_id: {volume, pan, muted}}, open_tabs JSON, active_tab_doc_id)
documents        (id, user_id FK, original_name, stored_path, size_bytes, page_count, last_page INT DEFAULT 1, uploaded_at, last_opened_at)
document_annotations (document_id PK/FK, strokes JSONB  -- {"<page>": [{tool, color, width, points}]}, updated_at)
```
- ผู้ใช้ต้องเข้าถึงได้เฉพาะเอกสารของตัวเอง ทุก query ต้องกรองด้วย `user_id` จาก token

## 12. API Endpoints (เฟส 1)

```
POST   /api/auth/register          {email, password, display_name}
POST   /api/auth/login             {email, password} → {access_token}
GET    /api/auth/me

GET    /api/questionnaire          → รายการคำถาม
POST   /api/questionnaire          {answers} → {score, level, preset}
GET    /api/questionnaire/latest   → ผลล่าสุด (null = ยังไม่เคยทำ)
GET    /api/questionnaire/history  → ความชอบทั้งหมดของผู้ใช้ (ใหม่สุดก่อน)
PATCH  /api/questionnaire/{id}     {label?, chosen_preset_id?} → ตั้งชื่อ mood / เลือกสถานที่ (ตั้งเป็น preset ปัจจุบันด้วย)
DELETE /api/questionnaire/{id}

GET    /api/presets                → presets ทั้งหมดพร้อม layers
GET    /api/settings               / PUT /api/settings   (preset ปัจจุบัน, ค่า volume/pan, แท็บที่เปิด)

POST   /api/documents              multipart (หลายไฟล์) → รายการเอกสาร
GET    /api/documents              → คลังเอกสารของผู้ใช้
GET    /api/documents/{id}/file    → stream ไฟล์ PDF (ต้องมี auth)
PATCH  /api/documents/{id}         {last_page}
DELETE /api/documents/{id}
GET    /api/documents/{id}/annotations   → {strokes}
PUT    /api/documents/{id}/annotations   {strokes} (ตรวจรูปแบบใน backend/src/services/annotations.js)
```

## 13. โครงสร้างโฟลเดอร์ที่แนะนำ

```
/
├── CLAUDE.md
├── frontend/
│   ├── public/sounds/            # ไฟล์เสียง loop
│   └── src/
│       ├── api/                  # เรียก backend
│       ├── audio/                # AudioEngine, AudioProvider
│       ├── components/
│       │   ├── reader/           # TabBar, PdfViewer, Library, UploadDropzone
│       │   └── soundscape/       # SoundPanel, LayerControl
│       ├── pages/                # Login, Register, Questionnaire, Result, ReadingRoom
│       ├── store/                # tabs store, auth store
│       └── data/
└── backend/
    ├── src/
    │   ├── server.js  app.js
    │   ├── config/               # env.js
    │   ├── db/                   # pool.js, schema.sql, seed.sql, migrate.js
    │   ├── middleware/           # auth, upload, validate, errorHandler
    │   ├── routes/               # 1 ไฟล์ต่อกลุ่ม endpoint
    │   ├── controllers/          # logic ของแต่ละ endpoint
    │   ├── models/               # SQL query ของแต่ละตาราง
    │   └── services/             # recommender.js, questions.js
    └── storage/pdfs/{user_id}/
```

## 14. เกณฑ์ว่า Demo พร้อมนำเสนอ (Definition of Done)

- [ ] สมัคร → ล็อกอิน → ทำแบบสอบถาม → เห็นบรรยากาศที่แนะนำ → เข้าห้องอ่านได้ ครบในครั้งเดียวโดยไม่ error
- [ ] อัปโหลด PDF 3 ไฟล์พร้อมกัน แล้วเปิด 3 แท็บได้ สลับแท็บแล้วหน้า/ซูมของแต่ละแท็บไม่หาย
- [ ] เปิดไฟล์ 100+ หน้าแล้วเลื่อนอ่านได้ลื่น
- [ ] เสียงเล่นต่อเนื่องไม่สะดุดระหว่างสลับแท็บและอัปโหลดไฟล์
- [ ] ปรับความดังและ pan ซ้าย-ขวาแต่ละชั้นแล้วได้ยินผลทันที
- [ ] ล็อกเอาต์แล้วล็อกอินใหม่ จะข้ามแบบสอบถาม แท็บเดิมกลับมา และเปิดที่หน้าล่าสุด
- [ ] ผู้ใช้ A เปิดไฟล์ของผู้ใช้ B ไม่ได้

## 15. แนวทางการเขียนโค้ด

- ข้อความบน UI เป็นภาษาไทย ส่วนโค้ด ชื่อตัวแปร และ comment เป็นภาษาอังกฤษ
- TypeScript strict mode ฝั่ง frontend
- อย่า hardcode secret ให้ใช้ `.env` และมี `.env.example`
- ถ้าต้องเลือกระหว่าง "ฟีเจอร์เยอะ" กับ "Reading Room ลื่นและสวย" **ให้เลือก Reading Room ก่อนเสมอ**
- ทำงานเป็นส่วนเล็ก ๆ ที่รันได้จริง และไม่เพิ่ม dependency โดยไม่จำเป็น

## 16. งานวิจัยอ้างอิงหลัก (ใช้ประกอบการตัดสินใจออกแบบ)

- **Axelsson et al. (2010):** แบบจำลองการรับรู้ภูมิทัศน์เสียง 2 มิติ (Pleasantness / Eventfulness) ใช้ในการนิยาม preset
- **Vasilev et al. (2018); Perham & Currie (2014):** เสียงพูดและเพลงที่มีเนื้อร้องรบกวนการอ่านมากที่สุด → ไม่ใช้เสียงเหล่านี้
- **Thompson et al. (2012):** เสียงที่ทั้งเร็วและดังรบกวนการอ่าน → ให้ผู้ใช้คุมความดังเอง
- **Furnham & Strbac (2002); Söderlund et al. (2007):** แต่ละคนต้องการระดับเสียงต่างกัน → ใช้แบบสอบถามแบ่ง 3 ระดับ
- **Braunhofer et al. (2013); Ooi et al. (2023):** การจับคู่เสียงกับสถานที่ และการเลือกเสียงจากข้อมูลผู้ฟัง → แนวทางของระบบแนะนำในเฟส 2
- **Evans et al. (2024) Stable Audio Open; Kreuk et al. (2023) AudioGen:** แบบจำลองสร้างเสียงที่จะใช้ในเฟส 2 (ยังไม่ใช้ในเฟส 1)
