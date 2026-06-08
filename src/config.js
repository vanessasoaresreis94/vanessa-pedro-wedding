// ============================================================
//  CONFIGURAÇÃO  — as chaves vêm das variáveis de ambiente.
//  No Vercel (e no ficheiro .env local) define:
//    VITE_SUPABASE_URL
//    VITE_SUPABASE_ANON_KEY
//    VITE_CLOUDINARY_CLOUD_NAME
//    VITE_CLOUDINARY_UPLOAD_PRESET
//  A palavra-passe de administração também pode vir daqui:
//    VITE_ADMIN_PASSWORD   (se não definida, usa "14082026")
// ============================================================

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "14082026";

export const WEDDING_DATE = new Date("2026-08-14T16:00:00+01:00");
