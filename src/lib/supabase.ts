import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Service = {
  id: string;
  title: string;
  image: string;
  price_clp_min: number;
  price_clp_max: number;
  price_usd_min: number;
  price_usd_max: number;
  category: string;
  description: string;
  is_available: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Extra = {
  id: string;
  title: string;
  description: string;
  icon: string;
  price_clp: number;
  price_usd: number;
  only_for: string[];
  is_available: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  title: string;
  description: string;
  service_type: string;
  order_index: number;
  is_visible: boolean;
  created_at: string;
};

export type Rule = {
  id: string;
  text: string;
  is_allowed: boolean;
  icon: string;
  order_index: number;
  created_at: string;
};

export type DetailLevel = {
  id: string;
  service_id: string;
  level_name: string;
  level_label: string;
  price_clp: number;
  price_usd: number;
  description: string | null;
  includes: string | null; // Qué incluye cada nivel
  recommendations: string[]; // Recomendaciones según uso
  example_image: string | null;
  order_index: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceVariant = {
  id: string;
  service_id: string;
  variant_name: string;
  variant_label: string;
  price_clp: number;
  price_usd: number;
  description: string | null;
  preview_image: string;
  order_index: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Testimonial = {
  id: string;
  client_name: string;
  client_avatar: string | null;
  rating: number; // 1-5 estrellas
  comment: string;
  gallery_item_id: string | null;
  service_type: string | null;
  is_featured: boolean;
  is_visible: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type EmoteConfig = {
  id: string;
  service_id: string;
  emote_number: number;
  custom_label: string | null;
  description: string | null;
  preview_image: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type EmoteExtraAvailability = {
  id: string;
  extra_id: string;
  emote_number: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionTheme = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  is_available: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};
