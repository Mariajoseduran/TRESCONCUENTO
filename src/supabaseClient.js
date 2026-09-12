import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa el archivo .env (local) o las variables de entorno en Vercel."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
