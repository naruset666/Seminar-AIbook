import type { LayerParams } from '../../audio/AudioEngine';
import type { SoundLayer } from '../../types';
import '../../styles/ink-range.css';
import './LayerControl.css';

interface LayerControlProps {
  layer: SoundLayer;
  params: LayerParams;
  showPan: boolean;
  onChange: (changes: Partial<LayerParams>) => void;
}

// Pan values this close to the middle (out of ±100) snap to exactly centre.
const PAN_SNAP = 8;
const snapPan = (value: number) => (Math.abs(value) <= PAN_SNAP ? 0 : value);

const SpeakerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// One sound layer: on/off, volume and (optionally) left-right position.
export default function LayerControl({ layer, params, showPan, onChange }: LayerControlProps) {
  const on = !params.muted;

  return (
    <div className={`layer-control ${on ? '' : 'off'}`}>
      <div className="layer-title">
        <span className="layer-name">{layer.label}</span>
        <button
          type="button"
          className="layer-toggle"
          aria-pressed={on}
          aria-label={on ? `ปิดเสียง${layer.label}` : `เปิดเสียง${layer.label}`}
          title={on ? 'ปิดเสียงชั้นนี้' : 'เปิดเสียงชั้นนี้'}
          onClick={() => onChange({ muted: on })}
        >
          {on ? '❚❚' : '▶'}
        </button>
      </div>

      <label className="layer-slider">
        <span className="slider-icon" title="ความดัง">
          <SpeakerIcon />
        </span>
        <input
          className="ink-range"
          type="range"
          min={0}
          max={100}
          value={Math.round(params.volume * 100)}
          aria-label={`ความดัง ${layer.label}`}
          onChange={(e) => onChange({ volume: Number(e.target.value) / 100, muted: false })}
        />
      </label>

      {showPan && (
        <label className="layer-slider pan">
          <span className="slider-side">L</span>
          <span className={`pan-track ${params.pan === 0 ? 'centered' : ''}`}>
            <input
              className="ink-range"
              type="range"
              min={-100}
              max={100}
              value={Math.round(params.pan * 100)}
              aria-label={`ซ้าย-ขวา ${layer.label}`}
              title="ตรงกลาง = เส้นขีด (ใกล้เส้นจะดูดเข้ากลาง, ดับเบิลคลิกเพื่อกลับกลาง)"
              onChange={(e) => onChange({ pan: snapPan(Number(e.target.value)) / 100 })}
              onDoubleClick={() => onChange({ pan: 0 })}
            />
          </span>
          <span className="slider-side">R</span>
        </label>
      )}
    </div>
  );
}
