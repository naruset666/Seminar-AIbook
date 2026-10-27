import { Link } from 'react-router-dom';
import { useSoundscape } from '../../audio/AudioProvider';
import LayerControl from './LayerControl';
import '../../styles/ink-range.css';
import './SoundPanel.css';

interface SoundPanelProps {
  onClose: () => void;
}

// Soundscape mixer on the right of the board: the user's saved moods, master
// play/volume, and one control per sound layer. "ปรับซ้าย-ขวา" reveals the pan
// slider of every layer.
export default function SoundPanel({ onClose }: SoundPanelProps) {
  const {
    moods, preset, loading, playing, masterVolume, showPan, layerParams,
    selectPreset, togglePlay, setMasterVolume, setShowPan, updateLayer, resetLayers,
  } = useSoundscape();

  return (
    <aside className="sound-panel" aria-label="เสียงบรรยากาศ">
      <header className="sound-head">
        <h2>Soundscape</h2>
        <button type="button" className="sound-close" onClick={onClose} aria-label="ซ่อนแผงเสียง" title="ซ่อนแผงเสียง">
          »
        </button>
      </header>

      {loading ? (
        <p className="sound-empty">กำลังโหลดเสียง…</p>
      ) : !preset ? (
        <p className="sound-empty">ยังไม่มีบรรยากาศ</p>
      ) : (
        <>
          <select
            className="sound-preset"
            value={moods.find((m) => m.presetId === preset.id)?.id ?? 'current'}
            onChange={(e) => {
              const mood = moods.find((m) => String(m.id) === e.target.value);
              if (mood) selectPreset(mood.presetId);
            }}
            aria-label="เลือก mood"
          >
            {!moods.some((m) => m.presetId === preset.id) && <option value="current">{preset.name}</option>}
            {moods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.presetName} · {m.name}
              </option>
            ))}
          </select>
          <Link to="/preferences" className="sound-moods-link">
            จัดการ mood ของคุณ →
          </Link>

          <div className="sound-master">
            <button
              type="button"
              className={`sound-play ${playing ? 'playing' : ''}`}
              onClick={togglePlay}
              aria-label={playing ? 'หยุดเสียง' : 'เล่นเสียง'}
              title={playing ? 'หยุดเสียง' : 'เล่นเสียงบรรยากาศ'}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <label className="sound-master-volume">
              <span>ความดังรวม</span>
              <input
                className="ink-range"
                type="range"
                min={0}
                max={100}
                value={Math.round(masterVolume * 100)}
                aria-label="ความดังรวม"
                onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
              />
            </label>
          </div>

          <div className="sound-options">
            <label className="sound-check">
              <input type="checkbox" checked={showPan} onChange={(e) => setShowPan(e.target.checked)} />
              <span className="sound-check-box" aria-hidden="true" />
              ปรับซ้าย-ขวา (ใช้หูฟัง)
            </label>
            <button type="button" className="sound-reset" onClick={resetLayers} title="กลับไปใช้ค่าเริ่มต้นของบรรยากาศนี้">
              รีเซ็ต
            </button>
          </div>

          <div className="sound-layers">
            {preset.layers.map((layer) => (
              <LayerControl
                key={layer.id}
                layer={layer}
                params={layerParams(layer)}
                showPan={showPan}
                onChange={(changes) => updateLayer(layer, changes)}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
