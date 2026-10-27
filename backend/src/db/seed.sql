-- Soundscape presets = the 10 reading places from the questionnaire (reading-place-quiz).
-- tags: the 5 questionnaire dimensions (noise level, speech, sound type, eventfulness, reading style).
-- level follows the noise-level tag. pleasantness/eventfulness are team estimates for phase 2.
-- Audio files live in frontend/public/sounds/<preset>/ (made by frontend/scripts/prepare_sounds.py
-- from the team's recordings in "SOUND FOR AI BOOK"). Re-running updates existing rows.

BEGIN;

INSERT INTO presets (id, name, description, level, pleasantness, eventfulness, tags, sort_order) VALUES
  ('cafe', 'คาเฟ่ยามเช้า', 'เสียงคนคุยจอแจที่ฟังไม่ออก เสียงชงกาแฟและน้ำแข็งกระทบแก้ว เหมาะกับคนที่อ่านได้ดีเมื่อมีเสียงรอบตัว', 'high', 0.3, 0.7,
    ARRAY['คึกคัก','มีเสียงพูด','ผู้คน','มีชีวิตชีวา','ผ่อนคลาย'], 1),
  ('library', 'ห้องสมุดเงียบ', 'บรรยากาศเงียบสงบ มีเพียงเสียงพลิกหน้ากระดาษเบา ๆ เหมาะกับการอ่านที่ต้องใช้สมาธิสูง', 'low', 0.4, -0.8,
    ARRAY['เงียบ','ไม่มีเสียงพูด','นิ่งสงบ'], 2),
  ('train', 'บนรถไฟ', 'เสียงล้อรถไฟกระทบรางเป็นจังหวะสม่ำเสมอ ช่วยกลบเสียงรบกวนอื่น', 'medium', 0.2, 0.1,
    ARRAY['กึ่งกลาง','ไม่มีเสียงพูด','จังหวะสม่ำเสมอ','เคลื่อนไหวเบา'], 3),
  ('waterfall', 'ใกล้น้ำตก/ลำธาร', 'เสียงน้ำไหลต่อเนื่องและนกร้องไกล ๆ ให้ความรู้สึกสดชื่น', 'medium', 0.8, 0.2,
    ARRAY['กึ่งกลาง','ไม่มีเสียงพูด','น้ำ','ธรรมชาติ','เคลื่อนไหวเบา','ผ่อนคลาย'], 4),
  ('fireplace', 'ห้องนั่งเล่นมีเตาผิง', 'เสียงไฟปะทุเบา ๆ ในห้องอบอุ่น เงียบและผ่อนคลาย', 'low', 0.7, -0.5,
    ARRAY['เงียบ','ไม่มีเสียงพูด','ไฟ','นิ่งสงบ','ผ่อนคลาย'], 5),
  ('beach', 'ริมทะเล/ชายหาด', 'เสียงคลื่นซัดฝั่งเป็นจังหวะ และสายลมทะเล', 'medium', 0.8, 0.3,
    ARRAY['กึ่งกลาง','ไม่มีเสียงพูด','น้ำ','ธรรมชาติ','เคลื่อนไหวเบา','ผ่อนคลาย'], 6),
  ('forest', 'ในป่า/แคมป์ปิ้ง', 'เสียงนก ลม และใบไม้ไหวในป่าที่เงียบสงบ', 'low', 0.8, -0.3,
    ARRAY['เงียบ','ไม่มีเสียงพูด','ธรรมชาติ','เคลื่อนไหวเบา'], 7),
  ('bookshop', 'ร้านหนังสือเก่า', 'ร้านหนังสือเงียบ ๆ มีเสียงพลิกหน้ากระดาษและฝีเท้าคนเดินเลือกหนังสือ', 'medium', 0.5, -0.4,
    ARRAY['กึ่งกลาง','ไม่มีเสียงพูด','ผู้คน','นิ่งสงบ'], 8),
  ('park', 'สวนสาธารณะยามบ่าย', 'เสียงผู้คนทำกิจกรรมไกล ๆ นกร้อง และลมพัดใบไม้', 'high', 0.6, 0.6,
    ARRAY['คึกคัก','มีเสียงพูด','ผู้คน','ธรรมชาติ','มีชีวิตชีวา','ผ่อนคลาย'], 9),
  ('rainynight', 'คืนฝนตกในห้อง', 'เสียงฝนตกสม่ำเสมอนอกหน้าต่างและฟ้าร้องไกล ๆ', 'low', 0.6, -0.6,
    ARRAY['เงียบ','ไม่มีเสียงพูด','น้ำ','นิ่งสงบ'], 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  pleasantness = EXCLUDED.pleasantness,
  eventfulness = EXCLUDED.eventfulness,
  tags = EXCLUDED.tags,
  sort_order = EXCLUDED.sort_order;

INSERT INTO sound_layers (id, preset_id, label, file_path, default_volume, default_pan, source_type, sort_order) VALUES
  ('cafe_chatter', 'cafe', 'เสียงคนคุยในคาเฟ่', '/sounds/cafe/cafe_chatter.mp3', 0.55, 0, 'library', 1),
  ('cafe_light_rain', 'cafe', 'ฝนเบา ๆ นอกร้าน', '/sounds/cafe/light_rain.mp3', 0.25, -0.3, 'library', 2),
  ('cafe_coffee', 'cafe', 'ชงกาแฟ', '/sounds/cafe/coffee.mp3', 0.3, 0.35, 'library', 3),
  ('cafe_ice', 'cafe', 'น้ำแข็งกระทบแก้ว', '/sounds/cafe/ice.mp3', 0.15, 0.5, 'library', 4),
  ('library_room', 'library', 'เสียงห้องเงียบ', '/sounds/library/room_tone.mp3', 0.5, 0, 'library', 1),
  ('library_pages', 'library', 'พลิกหน้ากระดาษ', '/sounds/library/page_turn.mp3', 0.25, -0.3, 'library', 2),
  ('library_keyboard', 'library', 'เสียงพิมพ์คีย์บอร์ด', '/sounds/library/keyboard_sound.mp3', 0.15, 0.4, 'library', 3),
  ('train_wheels', 'train', 'ล้อรถไฟ', '/sounds/train/train_wheels.mp3', 0.5, 0, 'library', 1),
  ('train_wheels2', 'train', 'ล้อรถไฟ (อีกขบวน)', '/sounds/train/train_wheels2.mp3', 0.2, -0.3, 'library', 2),
  ('train_hum', 'train', 'เสียงในตู้โดยสาร', '/sounds/train/train_hum.mp3', 0.35, 0.2, 'library', 3),
  ('train_bell', 'train', 'ระฆังรถไฟ', '/sounds/train/train_bell.mp3', 0.1, 0.5, 'library', 4),
  ('waterfall_water', 'waterfall', 'น้ำตก', '/sounds/waterfall/waterfall.mp3', 0.55, 0, 'library', 1),
  ('waterfall_birds', 'waterfall', 'เสียงนก', '/sounds/waterfall/birds.mp3', 0.3, -0.4, 'library', 2),
  ('fireplace_fire', 'fireplace', 'ไฟในเตาผิง', '/sounds/fireplace/fire_crackle.mp3', 0.55, 0, 'library', 1),
  ('fireplace_room', 'fireplace', 'เสียงในห้อง', '/sounds/fireplace/room_tone.mp3', 0.3, 0, 'library', 2),
  ('fireplace_wind', 'fireplace', 'ลมนอกบ้าน', '/sounds/fireplace/wind.mp3', 0.2, -0.4, 'library', 3),
  ('beach_waves', 'beach', 'คลื่นทะเล', '/sounds/beach/waves.mp3', 0.55, 0, 'library', 1),
  ('beach_birds', 'beach', 'เสียงนกทะเล', '/sounds/beach/birds.mp3', 0.25, 0.4, 'library', 2),
  ('beach_people', 'beach', 'ผู้คนริมหาด', '/sounds/beach/people.mp3', 0.15, -0.4, 'library', 3),
  ('forest_birds', 'forest', 'เสียงนก', '/sounds/forest/birds.mp3', 0.4, 0.3, 'library', 1),
  ('forest_insects', 'forest', 'เสียงแมลง', '/sounds/forest/insects.mp3', 0.3, -0.3, 'library', 2),
  ('forest_leaves', 'forest', 'ลมพัดใบไม้', '/sounds/forest/leaves_wind.mp3', 0.3, 0, 'library', 3),
  ('forest_wind', 'forest', 'ลมในป่า', '/sounds/forest/wind.mp3', 0.2, 0, 'library', 4),
  ('forest_fire', 'forest', 'กองไฟ', '/sounds/forest/fire.mp3', 0.25, 0.2, 'library', 5),
  ('bookshop_room', 'bookshop', 'เสียงในร้าน', '/sounds/bookshop/room_tone.mp3', 0.45, 0, 'library', 1),
  ('bookshop_pages', 'bookshop', 'พลิกหน้ากระดาษ', '/sounds/bookshop/page_turn.mp3', 0.25, -0.3, 'library', 2),
  ('bookshop_book', 'bookshop', 'หยิบ-วางหนังสือ', '/sounds/bookshop/book.mp3', 0.2, 0.4, 'library', 3),
  ('park_murmur', 'park', 'เสียงผู้คนในสวน', '/sounds/park/park_murmur.mp3', 0.35, 0, 'library', 1),
  ('park_birds', 'park', 'เสียงนก', '/sounds/park/birds.mp3', 0.35, -0.4, 'library', 2),
  ('park_leaves', 'park', 'ลมพัดใบไม้', '/sounds/park/leaves_wind.mp3', 0.3, 0.3, 'library', 3),
  ('park_people', 'park', 'ผู้คนเดินเล่น', '/sounds/park/people.mp3', 0.2, 0.2, 'library', 4),
  ('rainynight_rain', 'rainynight', 'เสียงฝน', '/sounds/rainynight/rain.mp3', 0.5, 0, 'library', 1),
  ('rainynight_rain2', 'rainynight', 'ฝนกระทบหน้าต่าง', '/sounds/rainynight/rain2.mp3', 0.3, -0.4, 'library', 2),
  ('rainynight_rain3', 'rainynight', 'ฝนตกหนักไกล ๆ', '/sounds/rainynight/rain3.mp3', 0.2, 0.4, 'library', 3),
  ('rainynight_morning', 'rainynight', 'ฝนเช้ามืด', '/sounds/rainynight/morning_rain.mp3', 0.2, 0, 'library', 4)
ON CONFLICT (id) DO UPDATE SET
  preset_id = EXCLUDED.preset_id,
  label = EXCLUDED.label,
  file_path = EXCLUDED.file_path,
  default_volume = EXCLUDED.default_volume,
  default_pan = EXCLUDED.default_pan,
  source_type = EXCLUDED.source_type,
  sort_order = EXCLUDED.sort_order;

-- Remove presets/layers dropped from this file (e.g. the earlier quiet_library/rainy_room),
-- detaching any user rows that still point at them.
CREATE TEMP TABLE kept_presets (id TEXT) ON COMMIT DROP;
INSERT INTO kept_presets VALUES
  ('cafe'),('library'),('train'),('waterfall'),('fireplace'),('beach'),('forest'),('bookshop'),('park'),('rainynight');

UPDATE user_settings SET current_preset_id = NULL, layer_settings = '{}'::jsonb
  WHERE current_preset_id IS NOT NULL AND current_preset_id NOT IN (SELECT id FROM kept_presets);
UPDATE questionnaire_responses SET recommended_preset_id = NULL
  WHERE recommended_preset_id IS NOT NULL AND recommended_preset_id NOT IN (SELECT id FROM kept_presets);
UPDATE questionnaire_responses SET chosen_preset_id = NULL
  WHERE chosen_preset_id IS NOT NULL AND chosen_preset_id NOT IN (SELECT id FROM kept_presets);
DELETE FROM presets WHERE id NOT IN (SELECT id FROM kept_presets);
DELETE FROM sound_layers WHERE id NOT IN (
  'cafe_chatter','cafe_light_rain','cafe_coffee','cafe_ice','library_room','library_pages','library_keyboard','train_wheels','train_wheels2','train_hum','train_bell','waterfall_water','waterfall_birds','fireplace_fire','fireplace_room','fireplace_wind','beach_waves','beach_birds','beach_people','forest_birds','forest_insects','forest_leaves','forest_wind','forest_fire','bookshop_room','bookshop_pages','bookshop_book','park_murmur','park_birds','park_leaves','park_people','rainynight_rain','rainynight_rain2','rainynight_rain3','rainynight_morning'
);

COMMIT;
