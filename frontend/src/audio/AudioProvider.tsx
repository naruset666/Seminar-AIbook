import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { presetsApi } from '../api/presets';
import { questionnaireApi } from '../api/questionnaire';
import { settingsApi } from '../api/settings';
import type { Preset, SoundLayer, UserSettings } from '../types';
import { AudioEngine, type LayerParams } from './AudioEngine';

const SAVE_DELAY = 800;
const LOCAL_KEYS = { masterVolume: 'soundscape.masterVolume', showPan: 'soundscape.showPan' };

// Per-viewer UI conveniences only; real settings live in the database.
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

// A saved questionnaire result ("mood") and the place chosen in it.
export interface MoodOption {
  id: number;
  name: string;
  presetId: string;
  presetName: string;
}

interface AudioContextValue {
  presets: Preset[];
  moods: MoodOption[];
  preset: Preset | null;
  loading: boolean;
  playing: boolean;
  masterVolume: number;
  showPan: boolean;
  layerParams: (layer: SoundLayer) => LayerParams;
  selectPreset: (presetId: string) => void;
  togglePlay: () => void;
  setMasterVolume: (volume: number) => void;
  setShowPan: (show: boolean) => void;
  updateLayer: (layer: SoundLayer, changes: Partial<LayerParams>) => void;
  resetLayers: () => void;
}

const SoundContext = createContext<AudioContextValue | null>(null);

// Owns the single AudioEngine for the reading room, so sound keeps playing while
// tabs switch, files open/close or uploads run. Volume/pan per layer and the chosen
// preset are saved to user_settings (layer_settings is keyed by layer id).
export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = useRef<AudioEngine | null>(null);
  if (!engine.current) engine.current = new AudioEngine();

  const [presets, setPresets] = useState<Preset[]>([]);
  const [moods, setMoods] = useState<MoodOption[]>([]);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [layerSettings, setLayerSettings] = useState<UserSettings['layer_settings']>({});
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(() => readLocal(LOCAL_KEYS.masterVolume, 0.8));
  const [showPan, setShowPanState] = useState(() => readLocal(LOCAL_KEYS.showPan, false));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([presetsApi.list(), settingsApi.get(), questionnaireApi.history()])
      .then(([{ presets }, { settings }, { preferences }]) => {
        setPresets(presets);
        // Only the places the user saved as moods are offered in the panel.
        const moodOptions = preferences
          .filter((p) => p.chosen_preset)
          .map((p, i) => ({
            id: p.id,
            name: p.label || `ความชอบครั้งที่ ${preferences.length - i}`,
            presetId: p.chosen_preset!.id,
            presetName: p.chosen_preset!.name,
          }));
        setMoods(moodOptions);
        setLayerSettings(settings.layer_settings ?? {});

        // Use the saved preset if it belongs to one of the moods; otherwise the newest mood.
        const current = settings.current_preset_id;
        if (moodOptions.some((m) => m.presetId === current)) {
          setPresetId(current);
        } else if (moodOptions.length > 0) {
          setPresetId(moodOptions[0].presetId);
          setDirty(true);
        } else {
          setPresetId(presets.some((p) => p.id === current) ? current : presets[0]?.id ?? null);
        }
      })
      .catch((err) => console.error('Loading soundscape failed:', err))
      .finally(() => setLoading(false));
    const current = engine.current;
    return () => current?.dispose();
  }, []);

  const preset = useMemo(() => presets.find((p) => p.id === presetId) ?? null, [presets, presetId]);

  const layerParams = useCallback(
    (layer: SoundLayer): LayerParams => {
      const saved = layerSettings[layer.id];
      return {
        volume: saved?.volume ?? layer.volume,
        pan: saved?.pan ?? layer.pan,
        muted: saved?.muted ?? false,
      };
    },
    [layerSettings]
  );

  // Load the preset's layers into the engine whenever the preset changes.
  const paramsRef = useRef(layerParams);
  paramsRef.current = layerParams;
  useEffect(() => {
    if (!preset) return;
    engine.current!.setLayers(
      preset.layers.map((layer) => ({ id: layer.id, src: layer.src, params: paramsRef.current(layer) }))
    );
  }, [preset]);

  useEffect(() => engine.current!.setMasterVolume(masterVolume), [masterVolume]);

  // Save the preset and layer settings (debounced).
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      setDirty(false);
      settingsApi
        .update({ current_preset_id: presetId, layer_settings: layerSettings })
        .catch((err) => console.error('Saving soundscape failed:', err));
    }, SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [dirty, presetId, layerSettings]);

  const selectPreset = useCallback((id: string) => {
    setPresetId(id);
    setDirty(true);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = engine.current!;
    const action = audio.playing ? audio.pause() : audio.play();
    action.then(() => setPlaying(audio.playing)).catch((err) => console.error(err));
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    writeLocal(LOCAL_KEYS.masterVolume, volume);
  }, []);

  const setShowPan = useCallback((show: boolean) => {
    setShowPanState(show);
    writeLocal(LOCAL_KEYS.showPan, show);
  }, []);

  const updateLayer = useCallback(
    (layer: SoundLayer, changes: Partial<LayerParams>) => {
      const next = { ...layerParams(layer), ...changes };
      engine.current!.setLayerParams(layer.id, next);
      setLayerSettings((all) => ({ ...all, [layer.id]: next }));
      setDirty(true);
    },
    [layerParams]
  );

  // Back to the preset's default mix.
  const resetLayers = useCallback(() => {
    if (!preset) return;
    setLayerSettings((all) => {
      const next = { ...all };
      for (const layer of preset.layers) {
        delete next[layer.id];
        engine.current!.setLayerParams(layer.id, { volume: layer.volume, pan: layer.pan, muted: false });
      }
      return next;
    });
    setDirty(true);
  }, [preset]);

  const value = useMemo(
    () => ({
      presets, moods, preset, loading, playing, masterVolume, showPan, layerParams,
      selectPreset, togglePlay, setMasterVolume, setShowPan, updateLayer, resetLayers,
    }),
    [
      presets, moods, preset, loading, playing, masterVolume, showPan, layerParams,
      selectPreset, togglePlay, setMasterVolume, setShowPan, updateLayer, resetLayers,
    ]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSoundscape(): AudioContextValue {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSoundscape must be used inside AudioProvider');
  return context;
}
