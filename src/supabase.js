import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const hasSupabase = !!supabase;

// O app guarda tudo num único registo JSON na tabela `site`
// (linha com id = 1, coluna `data` do tipo jsonb).
// A galeria vive na tabela `gallery` (uma linha por media).

export async function loadSiteData() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site")
    .select("data")
    .eq("id", 1)
    .single();
  if (error) {
    console.warn("loadSiteData:", error.message);
    return null;
  }
  return data?.data || null;
}

export async function saveSiteData(payload) {
  if (!supabase) return;
  const { error } = await supabase
    .from("site")
    .upsert({ id: 1, data: payload, updated_at: new Date().toISOString() });
  if (error) console.warn("saveSiteData:", error.message);
}

export function subscribeSite(onChange) {
  if (!supabase) return () => {};
  const ch = supabase
    .channel("site-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site", filter: "id=eq.1" },
      (payload) => {
        if (payload.new?.data) onChange(payload.new.data);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// ---------- Galeria ----------
export async function loadGallery() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("loadGallery:", error.message);
    return [];
  }
  return data || [];
}

export async function addGalleryItem(item) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("gallery")
    .insert(item)
    .select()
    .single();
  if (error) {
    console.warn("addGalleryItem:", error.message);
    return null;
  }
  return data;
}

export async function deleteGalleryItem(id) {
  if (!supabase) return;
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) console.warn("deleteGalleryItem:", error.message);
}

export function subscribeGallery(onInsert, onDelete) {
  if (!supabase) return () => {};
  const ch = supabase
    .channel("gallery-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "gallery" },
      (p) => onInsert(p.new)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "gallery" },
      (p) => onDelete(p.old?.id)
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}
