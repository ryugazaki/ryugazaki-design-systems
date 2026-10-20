export type ColorMode = 'light' | 'dark';

export interface FontSpec {
  family: string;
  role: string;
  weights: number[];
  googleFontsUrl: string;
}

export interface PaletteEntry {
  token: string;
  light: string;
  dark: string;
  role: string;
}

export interface TypeScale {
  ratio: number;
  steps: Record<string, string>;
}

export interface AllowedGradient {
  pattern: string;
  reason: string;
}

export interface ComponentEntry {
  id: string;
  name: string;
  file: string;
  notes: string;
}

export interface PageEntry {
  id: string;
  name: string;
  file: string;
}

export interface Manifest {
  slug: string;
  number: number;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  defaultMode: ColorMode;
  useCases: string[];
  fonts: FontSpec[];
  typeScale: TypeScale;
  palette: PaletteEntry[];
  allowedGradients: AllowedGradient[];
  rules: { do: string[]; dont: string[] };
  components: ComponentEntry[];
  pages: PageEntry[];
}

/** A component or page after its file was fetched. snippet is null when the file failed to load or has no markers. */
export interface LoadedItem {
  id: string;
  name: string;
  notes: string;
  file: string;
  snippet: string | null;
}

export interface SystemBundle {
  manifest: Manifest;
  theme: string;
  components: LoadedItem[];
  pages: LoadedItem[];
}

/** manifest is null when it failed to load or validate. */
export interface CatalogEntry {
  slug: string;
  manifest: Manifest | null;
}

export const SECTIONS = ['overview', 'tokens', 'components', 'pages', 'rules'] as const;
export type Section = (typeof SECTIONS)[number];
