(function () {
  "use strict";

  /* THEME */
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var themeIcon = document.getElementById('themeIcon');
  var themeLabel = document.getElementById('themeLabel');
  function setTheme(mode) {
    if (mode === 'light') { root.setAttribute('data-theme', 'light'); themeIcon.textContent = '☾'; themeLabel.textContent = 'โหมดกลางคืน'; }
    else { root.removeAttribute('data-theme'); themeIcon.textContent = '☀'; themeLabel.textContent = 'โหมดกลางวัน'; }
  }
  setTheme('dark');
  themeToggle.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });

  /* PLACES: สถานที่ + tag ลักษณะเสียง แบ่งตาม 5 มิติที่ใช้ในคำถาม
     1) ระดับเสียงรอบตัว: เงียบ / กึ่งกลาง / คึกคัก            — Furnham & Strbac (2002); Söderlund et al. (2007)
     2) เสียงพูด: ไม่มีเสียงพูด / มีเสียงพูด                    — Vasilev et al. (2018); Perham & Currie (2014)
     3) ประเภทเสียง: น้ำ / ธรรมชาติ / ไฟ / จังหวะสม่ำเสมอ / ผู้คน — Axelsson et al. (2010); Alvarsson et al. (2010)
     4) Eventfulness: นิ่งสงบ / เคลื่อนไหวเบา / มีชีวิตชีวา      — Axelsson et al. (2010); ISO 12913-1
     5) ลักษณะงานอ่าน: ใช้ tag ของมิติ 1–2 หรือ ผ่อนคลาย         — Thompson et al. (2012)
     แก้ไข/เพิ่มสถานที่ได้ที่นี่ที่เดียว ระบบให้คะแนนคำนวณใหม่อัตโนมัติ */
  var PLACES = [
    { id: 'cafe',       name: 'คาเฟ่ยามเช้า',          tags: ['คึกคัก', 'มีเสียงพูด', 'ผู้คน', 'มีชีวิตชีวา', 'ผ่อนคลาย'] },
    { id: 'library',    name: 'ห้องสมุดเงียบ',          tags: ['เงียบ', 'ไม่มีเสียงพูด', 'นิ่งสงบ'] },
    { id: 'train',      name: 'บนรถไฟ',                tags: ['กึ่งกลาง', 'ไม่มีเสียงพูด', 'จังหวะสม่ำเสมอ', 'เคลื่อนไหวเบา'] },
    { id: 'waterfall',  name: 'ใกล้น้ำตก/ลำธาร',        tags: ['กึ่งกลาง', 'ไม่มีเสียงพูด', 'น้ำ', 'ธรรมชาติ', 'เคลื่อนไหวเบา', 'ผ่อนคลาย'] },
    { id: 'fireplace',  name: 'ห้องนั่งเล่นมีเตาผิง',    tags: ['เงียบ', 'ไม่มีเสียงพูด', 'ไฟ', 'นิ่งสงบ', 'ผ่อนคลาย'] },
    { id: 'beach',      name: 'ริมทะเล/ชายหาด',         tags: ['กึ่งกลาง', 'ไม่มีเสียงพูด', 'น้ำ', 'ธรรมชาติ', 'เคลื่อนไหวเบา', 'ผ่อนคลาย'] },
    { id: 'forest',     name: 'ในป่า/แคมป์ปิ้ง',         tags: ['เงียบ', 'ไม่มีเสียงพูด', 'ธรรมชาติ', 'เคลื่อนไหวเบา'] },
    { id: 'bookshop',   name: 'ร้านหนังสือเก่า',         tags: ['กึ่งกลาง', 'ไม่มีเสียงพูด', 'ผู้คน', 'นิ่งสงบ'] },
    { id: 'park',       name: 'สวนสาธารณะยามบ่าย',     tags: ['คึกคัก', 'มีเสียงพูด', 'ผู้คน', 'ธรรมชาติ', 'มีชีวิตชีวา', 'ผ่อนคลาย'] },
    { id: 'rainynight', name: 'คืนฝนตกในห้อง',          tags: ['เงียบ', 'ไม่มีเสียงพูด', 'น้ำ', 'นิ่งสงบ'] }
  ];

  /* ชื่อมิติของแต่ละคำถาม ใช้แสดงเหตุผลในหน้าผลลัพธ์ */
  var DIMENSIONS = { 1: 'ระดับเสียง', 2: 'เสียงพูด', 3: 'ประเภทเสียง', 4: 'ความเคลื่อนไหว', 5: 'ลักษณะงานอ่าน' };

  var step = 1;
  var totalSteps = 6;
  var answerTags = {}; // step -> array of tags
  var steps = document.querySelectorAll('.step');
  var progBars = [1, 2, 3, 4, 5, 6].map(function (n) { return document.getElementById('p' + n); });
  var backBtn = document.getElementById('backBtn');
  var nextBtn = document.getElementById('nextBtn');
  var navRow = document.getElementById('navRow');

  function renderStep() {
    steps.forEach(function (s) { s.classList.toggle('active', Number(s.dataset.step) === step); });
    progBars.forEach(function (bar, i) { bar.style.width = (i < step ? 100 : 0) + '%'; });
    backBtn.disabled = step === 1;
    navRow.style.display = step === totalSteps ? 'none' : 'flex';
    if (step === totalSteps) { renderResults(); }
    else { nextBtn.textContent = step === totalSteps - 1 ? 'ดูผลลัพธ์' : 'ถัดไป'; nextBtn.disabled = !answerTags[step]; }
  }

  document.querySelectorAll('.options').forEach(function (group) {
    var q = Number(group.dataset.q);
    group.querySelectorAll('.option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        group.querySelectorAll('.option').forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        answerTags[q] = opt.dataset.tags.split(',');
        nextBtn.disabled = false;
      });
    });
  });

  backBtn.addEventListener('click', function () { if (step > 1) { step--; renderStep(); } });
  nextBtn.addEventListener('click', function () { if (step < totalSteps) { step++; renderStep(); } });
  document.getElementById('restartBtn').addEventListener('click', function () {
    answerTags = {};
    document.querySelectorAll('.option').forEach(function (o) { o.classList.remove('selected'); });
    step = 1;
    renderStep();
  });

  function renderResults() {
    // ให้คะแนนรายข้อ: คำตอบข้อใดมี tag ตรงกับสถานที่อย่างน้อย 1 tag ได้ 1 คะแนน (เต็ม 5)
    // นับรายข้อแทนการนับ tag รวม เพื่อไม่ให้ข้อที่มีหลาย tag มีน้ำหนักมากกว่าข้ออื่น
    var scored = PLACES.map(function (p) {
      var hits = {};
      var score = 0;
      for (var q = 1; q <= 5; q++) {
        var hit = (answerTags[q] || []).some(function (t) { return p.tags.indexOf(t) !== -1; });
        hits[q] = hit;
        if (hit) score++;
      }
      return { place: p, score: score, hits: hits };
    }).sort(function (a, b) { return b.score - a.score; });

    // เอาอย่างน้อย 3 อันดับแรก รวมสถานที่ที่คะแนนเท่ากับอันดับ 3 ด้วย (ตัดเท่าไม่ตัดทิ้ง)
    var minShow = 3;
    var cutoffScore = scored[minShow - 1] ? scored[minShow - 1].score : 0;
    var results = scored.filter(function (r, i) { return i < minShow || r.score >= cutoffScore; });

    var html = '';
    results.forEach(function (r, i) {
      var why = '';
      for (var q = 1; q <= 5; q++) {
        why += '<span class="' + (r.hits[q] ? 'hit' : '') + '">' + (r.hits[q] ? '✓ ' : '') + DIMENSIONS[q] + '</span>';
      }
      html += '<div class="result-card' + (i === 0 ? ' rank-1' : '') + '">' +
        '<div class="result-rank">' + (i + 1) + '</div>' +
        '<div style="flex:1"><div class="result-name">' + r.place.name + '</div>' +
        '<div class="result-score">ตรงกับคำตอบของคุณ ' + r.score + ' จาก 5 ด้าน</div>' +
        '<div class="result-tags">' + r.place.tags.join(' · ') + '</div>' +
        '<div class="result-why">' + why + '</div></div>' +
        '</div>';
    });
    document.getElementById('resultList').innerHTML = html;
  }

  renderStep();
})();
