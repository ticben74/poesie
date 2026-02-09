
export interface Poem {
  id: number;
  title: string;
  poet: string;
  image: string;
  audioUrl: string;
  content: string; // نص القصيدة
  x: number; 
  y: number;
  z?: number; // العمق في الفضاء الثلاثي الأبعاد
}

// Narrative is used interchangeably with Poem in some spatial components
export type Narrative = Poem;

export interface CityContext {
  name: string;
  location: string;
  description: string;
  story?: string; // Additional field used in creation flows
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

// Exhibition is the primary interface for diwans in the app's UI
export type Exhibition = PoetryDiwan;
