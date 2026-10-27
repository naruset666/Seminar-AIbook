// Shapes returned by the backend API (snake_case, matching the DB columns).

export interface User {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
}

export type StimulationLevel = 'low' | 'medium' | 'high';

export interface SoundLayer {
  id: string;
  label: string;
  src: string;
  volume: number;
  pan: number;
  source_type: 'library' | 'generated';
  prompt: string | null;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  level: StimulationLevel;
  pleasantness: number;
  eventfulness: number;
  tags: string[];
  layers: SoundLayer[];
}

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  dimension: string;
  label: string;
  text: string;
  options: QuestionOption[];
  basis: string;
  references: string;
}

export type Answers = Record<string, string>;

// One ranked place: score = number of questions (0-5) whose answer matches the place.
export interface PlaceMatch {
  preset: Preset;
  score: number;
  hits: Record<string, boolean>;
}

export interface QuestionnaireResponse {
  id: number;
  answers: Answers;
  score: number;
  level: StimulationLevel;
  recommended_preset_id: string | null;
  chosen_preset_id: string | null; // place the user picked from this result
  label: string | null; // user-given mood name
  created_at: string;
  preset: Preset | null;
  chosen_preset: Preset | null;
  results: PlaceMatch[];
}

export interface QuestionnaireSubmitResult {
  response: Omit<QuestionnaireResponse, 'preset' | 'chosen_preset' | 'results'>;
  level: StimulationLevel;
  score: number;
  results: PlaceMatch[];
}

export interface DocumentInfo {
  id: number;
  original_name: string;
  size_bytes: number;
  page_count: number | null;
  last_page: number;
  uploaded_at: string;
  last_opened_at: string | null;
}

export interface UserSettings {
  current_preset_id: string | null;
  layer_settings: Record<string, { volume: number; pan: number; muted?: boolean }>;
  open_tabs: number[];
  active_tab_doc_id: number | null;
}

// Annotation strokes drawn over PDF pages. Coordinates are PDF.js viewport units at
// scale 1 without the user's view rotation (top-left origin), so they stay correct at any zoom.
export type StrokeTool = 'pen' | 'highlight';

export interface Stroke {
  tool: StrokeTool;
  color: string; // #rrggbb
  width: number;
  points: [number, number][];
}

// Strokes per page number ("1", "2", ...).
export type PageStrokes = Record<string, Stroke[]>;

export type AnnotationTool = 'read' | StrokeTool | 'eraser';
