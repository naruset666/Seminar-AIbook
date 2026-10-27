// Questionnaire: 5 questions, each grounded in a reading/soundscape study
// (ported from reading-place-quiz). Option `tags` are matched against preset tags
// by the recommender; they are not sent to the client.

const QUESTIONS = [
  {
    id: 'noise_level',
    dimension: 'ระดับเสียง',
    label: 'ระดับเสียงรอบตัว',
    text: 'ตอนอ่านหนังสือ คุณชอบให้รอบตัวมีเสียงมากแค่ไหน',
    options: [
      { value: 'quiet', label: 'เงียบที่สุด ยิ่งไม่มีเสียงยิ่งดี', tags: ['เงียบ'] },
      { value: 'moderate', label: 'มีเสียงเบา ๆ เป็นพื้นหลังกำลังดี', tags: ['กึ่งกลาง'] },
      { value: 'lively', label: 'ชอบมีเสียงรอบตัวพอสมควร ช่วยให้ตื่นตัว', tags: ['คึกคัก'] },
    ],
    basis: 'แต่ละคนต้องการระดับเสียงรอบตัวไม่เท่ากัน บางคนอ่านได้ดีในที่เงียบ บางคนต้องมีเสียงพื้นหลังจึงมีสมาธิ',
    references: 'Furnham & Strbac (2002); Söderlund et al. (2007)',
  },
  {
    id: 'speech_sensitivity',
    dimension: 'เสียงพูด',
    label: 'ความไวต่อเสียงพูด',
    text: 'ถ้าได้ยินคนพูดคุยกันแบบฟังรู้เรื่อง คุณเสียสมาธิในการอ่านแค่ไหน',
    options: [
      { value: 'high', label: 'เสียสมาธิมาก อ่านต่อไม่ได้', tags: ['ไม่มีเสียงพูด', 'เงียบ'] },
      { value: 'medium', label: 'รบกวนบ้าง ถ้าเสียงไม่ดังก็พอไหว', tags: ['กึ่งกลาง'] },
      { value: 'low', label: 'แทบไม่รบกวน รู้สึกเหมือนมีเพื่อนนั่งอ่านด้วย', tags: ['มีเสียงพูด'] },
    ],
    basis: 'เสียงพูดที่ฟังรู้เรื่องและเพลงที่มีเนื้อร้อง รบกวนความเข้าใจในการอ่านมากกว่าเสียงประเภทอื่น',
    references: 'Vasilev et al. (2018); Perham & Currie (2014)',
  },
  {
    id: 'sound_type',
    dimension: 'ประเภทเสียง',
    label: 'ประเภทเสียงที่ชอบ',
    text: 'เสียงแบบไหนที่ทำให้คุณรู้สึกผ่อนคลายที่สุด',
    options: [
      { value: 'water', label: 'เสียงน้ำ (ฝน คลื่น ลำธาร)', tags: ['น้ำ'] },
      { value: 'nature', label: 'เสียงธรรมชาติอื่น ๆ (นก แมลง ลม ใบไม้)', tags: ['ธรรมชาติ'] },
      { value: 'fire', label: 'เสียงไฟปะทุในเตาผิง', tags: ['ไฟ'] },
      { value: 'steady', label: 'เสียงจังหวะสม่ำเสมอ (ล้อรถไฟ พัดลม)', tags: ['จังหวะสม่ำเสมอ'] },
      { value: 'people', label: 'เสียงผู้คนและกิจกรรมรอบตัว (แก้วกาแฟ ฝีเท้า)', tags: ['ผู้คน'] },
    ],
    basis: 'เสียงแต่ละประเภทให้ความรู้สึกน่าฟัง (Pleasantness) ต่างกัน และเสียงธรรมชาติช่วยให้ร่างกายฟื้นตัวจากความเครียดได้เร็วกว่าเสียงจราจร',
    references: 'Axelsson et al. (2010); Alvarsson et al. (2010)',
  },
  {
    id: 'eventfulness',
    dimension: 'ความเคลื่อนไหว',
    label: 'ความเคลื่อนไหวของบรรยากาศ',
    text: 'คุณอยากให้บรรยากาศรอบตัวเป็นแบบไหน',
    options: [
      { value: 'calm', label: 'นิ่ง สงบ แทบไม่มีอะไรเปลี่ยนแปลง', tags: ['นิ่งสงบ'] },
      { value: 'gentle', label: 'มีความเคลื่อนไหวเบา ๆ เป็นจังหวะ', tags: ['เคลื่อนไหวเบา'] },
      { value: 'lively', label: 'มีชีวิตชีวา มีเรื่องราวเกิดขึ้นรอบตัว', tags: ['มีชีวิตชีวา'] },
    ],
    basis: 'ใช้มิติ Eventfulness ของ Circumplex Model ซึ่งวัดว่าผู้ฟังรับรู้บรรยากาศเสียงว่าสงบนิ่งหรือมีความเคลื่อนไหว ตามกรอบแนวคิด Soundscape',
    references: 'Axelsson et al. (2010); ISO 12913-1 (2014)',
  },
  {
    id: 'reading_style',
    dimension: 'ลักษณะงานอ่าน',
    label: 'ลักษณะงานอ่าน',
    text: 'ส่วนใหญ่คุณอ่านหนังสือแบบไหน',
    options: [
      { value: 'deep', label: 'อ่านเชิงลึก ต้องทำความเข้าใจหรือจำ (ตำรา งานวิจัย)', tags: ['เงียบ', 'ไม่มีเสียงพูด'] },
      { value: 'general', label: 'อ่านทั่วไป (บทความ ข่าว สรุปเนื้อหา)', tags: ['กึ่งกลาง'] },
      { value: 'leisure', label: 'อ่านเพื่อผ่อนคลาย (นิยาย การ์ตูน เรื่องสั้น)', tags: ['ผ่อนคลาย'] },
    ],
    basis: 'เสียงพื้นหลังที่ดังหรือมีจังหวะเร็วลดความเข้าใจในการอ่าน การอ่านที่ต้องใช้สมาธิสูงจึงควรใช้เสียงที่เบาและไม่มีเสียงพูด',
    references: 'Thompson et al. (2012); Perham & Currie (2014)',
  },
];

// Client-facing copy without the matching tags.
const publicQuestions = () =>
  QUESTIONS.map(({ options, ...question }) => ({
    ...question,
    options: options.map(({ value, label }) => ({ value, label })),
  }));

module.exports = { QUESTIONS, publicQuestions };
