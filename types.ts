
export interface Poem {
  id: number;
  title: string;
  poet: string;
  image: string;
  audioUrl: string;
  content: string; 
  x: number; 
  y: number;
  z?: number; 
  lat?: number;
  lng?: number;
  opacity?: number;
  type?: 'poem' | 'mural'; // تمييز النوع: قصيدة أم جدارية
  style?: 'stencil' | 'urban' | 'ancient' | 'neon'; // أسلوب الرسم الجداري
}

export type Narrative = Poem;

export interface CityContext {
  name: string;
  location: string;
  description: string;
  story?: string;
  lat?: number;
  lng?: number;
}

export interface PoetryDiwan {
  id: string;
  slug: string;
  context: CityContext;
  items: Poem[];
  createdAt: number;
  aiIntro?: string;
  status?: 'published' | 'draft' | 'archived';
}

export type Exhibition = PoetryDiwan;
