import { createClient } from '@supabase/supabase-js';

// Usa el MISMO proyecto Supabase que el panel de clientes,
// para que este negocio aparezca en sus estadísticas.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
