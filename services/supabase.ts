
import { createClient } from '@supabase/supabase-js';
import { INITIAL_DIWAN } from '../constants';

const supabaseUrl = 'https://dctqkijmfbctnegnbzyn.supabase.co';
const supabaseKey = 'sb_publishable_bJl6SA2oK943Hby3Gan-Kg_uGXg2JrW';

export const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_STORAGE_KEY = 'poetry_cities_backup';

// Renamed to Exhibition and exported to satisfy imports in App.tsx and dashboards
export interface Exhibition {
  id: string;
  slug: string;
  context: {
    name: string;
    location: string;
    description: string;
    story?: string;
    lat?: number;
    lng?: number;
  };
  items: any[];
  createdAt: number;
  aiIntro?: string;
  status?: 'published' | 'draft' | 'archived';
}

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Exporting generateId as generateExhibitionId for usage in coordination components
export const generateId = () => `poem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
export const generateExhibitionId = generateId;

export const db = {
  async getExhibitions() {
    try {
      const { data, error } = await supabase
        .from('exhibitions') // نستخدم نفس الجدول تقنياً لكن بمحتوى مختلف
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      const list = data || [];
      const hasModel = list.some(e => e.id === INITIAL_DIWAN.id);
      const finalData = hasModel ? list : [INITIAL_DIWAN, ...list];
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalData));
      return finalData;
    } catch (error) {
      const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
      return backup ? JSON.parse(backup) : [INITIAL_DIWAN];
    }
  },

  async getExhibition(idOrSlug: string) {
    if (idOrSlug === INITIAL_DIWAN.id) return INITIAL_DIWAN;
    
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (backup) {
        const list = JSON.parse(backup);
        return list.find((e: any) => e.id === idOrSlug || e.slug === idOrSlug);
      }
      return null;
    }
  },

  async saveExhibition(diwan: any) {
    const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = backup ? JSON.parse(backup) : [];
    const index = list.findIndex((e: any) => e.id === diwan.id);
    if (index > -1) list[index] = diwan;
    else list.unshift(diwan);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .upsert({
          id: diwan.id,
          slug: diwan.slug || slugify(diwan.context.name),
          context: diwan.context,
          items: diwan.items,
          aiIntro: diwan.aiIntro,
          status: diwan.status || 'published',
          createdAt: diwan.createdAt || Date.now()
        })
        .select();
      if (error) throw error;
      return data?.[0];
    } catch (error) {
      return diwan;
    }
  },

  async deleteExhibition(id: string) {
    if (id === INITIAL_DIWAN.id) return;
    const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (backup) {
      const list = JSON.parse(backup).filter((e: any) => e.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
    try {
      await supabase.from('exhibitions').delete().eq('id', id);
    } catch (error) {}
  }
};
