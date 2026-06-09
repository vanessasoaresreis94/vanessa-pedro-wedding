import React, { useState, useEffect, useRef } from "react";
import { WEDDING_DATE, ADMIN_PASSWORD } from "./config";
import { DEFAULT_CONTENT, DEFAULT_DATA } from "./defaults";
import {
  hasSupabase,
  loadSiteData,
  saveSiteData,
  subscribeSite,
  loadGallery,
  addGalleryItem,
  deleteGalleryItem,
  subscribeGallery,
} from "./supabase";
import { hasCloudinary, uploadToCloudinary } from "./cloudinary";

const NAVY = "#1a2744";
const NAVY_SOFT = "#2a3a5c";
const uid = () => Date.now() + Math.floor(Math.random() * 1000);

/* ---------- countdown ---------- */
function useCountdown(target) {
  const [t, setT] = useState(getDiff(target));
  useEffect(() => {
    const i = setInterval(() => setT(getDiff(target)), 1000);
    return () => clearInterval(i);
  }, [target]);
  return t;
}
function getDiff(target) {
  let d = Math.max(0, target - new Date());
  const days = Math.floor(d / 86400000);
  d -= days * 86400000;
  const hours = Math.floor(d / 3600000);
  d -= hours * 3600000;
  const minutes = Math.floor(d / 60000);
  d -= minutes * 60000;
  const seconds = Math.floor(d / 1000);
  return { days, hours, minutes, seconds };
}

/* ---------- i18n ---------- */
const T = {
  pt: {
    nav: ["Início", "Programa", "Mapa", "Mesas", "Novidades", "Galeria", "Alojamento", "Lista de Desejos", "Preparações"],
    date: "14 de Agosto de 2026",
    days: "Dias", hours: "Horas", minutes: "Minutos", seconds: "Segundos",
    schedule: "Programa do dia", map: "Indicações", openMaps: "Abrir no mapa",
    tables: "Plano de mesas", alerts: "Novidades", gallery: "Galeria",
    galleryHint: "Carrega as tuas fotografias e vídeos — toda a gente vê a galeria em conjunto.",
    upload: "Carregar fotos / vídeos", uploading: "A carregar…",
    admin: "Administração", adminLogin: "Entrar", adminPlaceholder: "Palavra-passe",
    save: "Guardar", add: "Adicionar", delete: "Eliminar", edit: "Editar",
    logout: "Sair", translate: "English", uploadPhoto: "Carregar foto principal",
    saved: "Guardado", saving: "A guardar…", offline: "Sem ligação à base de dados — alterações apenas neste dispositivo.",
    shareGallery: "Partilhar galeria (QR)", guests: "convidados",
    download: "Descarregar",
    tablesLocked: "O plano de mesas estará disponível no dia do casamento, 14 de agosto.",
    searchGuest: "Pesquisar o teu nome…",
    noGuestFound: "Nenhum convidado encontrado com esse nome.",
    wishlist: "Lista de Desejos",
    iban: "IBAN",
    accountHolder: "Titular",
    copy: "Copiar",
    copied: "Copiado!",
    prep: "Preparações do dia 14",
    prepSchedule: "Horários da preparação",
  },
  en: {
    nav: ["Home", "Schedule", "Map", "Tables", "Updates", "Gallery", "Stay", "Wishlist", "Getting Ready"],
    date: "August 14th, 2026",
    days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
    schedule: "Day schedule", map: "Directions", openMaps: "Open in maps",
    tables: "Seating plan", alerts: "Updates", gallery: "Gallery",
    galleryHint: "Upload your photos and videos — everyone shares one gallery.",
    upload: "Upload photos / videos", uploading: "Uploading…",
    admin: "Admin", adminLogin: "Log in", adminPlaceholder: "Password",
    save: "Save", add: "Add", delete: "Delete", edit: "Edit",
    logout: "Log out", translate: "Português", uploadPhoto: "Upload main photo",
    saved: "Saved", saving: "Saving…", offline: "No database connection — changes stay on this device only.",
    shareGallery: "Share gallery (QR)", guests: "guests",
    download: "Download",
    tablesLocked: "The seating plan will be available on the wedding day, August 14th.",
    searchGuest: "Search your name…",
    noGuestFound: "No guest found with that name.",
    wishlist: "Wishlist",
    iban: "IBAN",
    accountHolder: "Account holder",
    copy: "Copy",
    copied: "Copied!",
    prep: "Getting ready — August 14th",
    prepSchedule: "Getting ready schedule",
  },
};

export default function App() {
  const [lang, setLang] = useState("pt");
  const [section, setSection] = useState(0);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [data, setData] = useState(DEFAULT_DATA);
  const [admin, setAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const skipSave = useRef(true);
  const cd = useCountdown(WEDDING_DATE);
  const tr = T[lang];
  const c = content[lang];

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    (async () => {
      if (hasSupabase) {
        const site = await loadSiteData();
        if (site) {
          if (site.content) setContent(site.content);
          if (site.data) setData(site.data);
        }
        const g = await loadGallery();
        setGallery(g);
      }
      setLoaded(true);
      setTimeout(() => (skipSave.current = false), 300);
    })();
  }, []);

  // Realtime: outras pessoas/edições
  useEffect(() => {
    if (!hasSupabase) return;
    const unsubSite = subscribeSite((site) => {
      skipSave.current = true;
      if (site.content) setContent(site.content);
      if (site.data) setData(site.data);
      setTimeout(() => (skipSave.current = false), 300);
    });
    const unsubGal = subscribeGallery(
      (row) => setGallery((g) => (g.find((x) => x.id === row.id) ? g : [row, ...g])),
      (id) => setGallery((g) => g.filter((x) => x.id !== id))
    );
    return () => {
      unsubSite();
      unsubGal();
    };
  }, []);

  // Guardar alterações de conteúdo/dados (admin)
  useEffect(() => {
    if (!loaded || skipSave.current || !hasSupabase) return;
    const tmo = setTimeout(() => saveSiteData({ content, data }), 600);
    return () => clearTimeout(tmo);
  }, [content, data, loaded]);

  return (
    <div style={styles.app}>
      <FontStyles />

      <div style={styles.stickyTop}>
        <header style={styles.header}>
          <div style={styles.logo}>
            Vanessa <span style={{ fontStyle: "italic", fontWeight: 400 }}>&</span> Pedro
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setLang(lang === "pt" ? "en" : "pt")} style={styles.pill}>
              {tr.translate}
            </button>
            <button onClick={() => setShowAdmin(true)} style={{ ...styles.pill, opacity: 0.6 }}>
              {tr.admin}
            </button>
          </div>
        </header>

        <nav style={styles.nav}>
          {tr.nav.map((n, i) => (
            <button
              key={i}
              onClick={() => setSection(i)}
              style={{
                ...styles.navBtn,
                background: section === i ? NAVY : "transparent",
                color: section === i ? "#fff" : NAVY,
              }}
            >
              {n}
            </button>
          ))}
        </nav>
      </div>

      {!hasSupabase && (
        <div style={styles.offlineBar}>{tr.offline}</div>
      )}

      <main style={styles.main}>
        {section === 0 && <Home tr={tr} c={c} cd={cd} data={data} />}
        {section === 1 && <Schedule tr={tr} lang={lang} data={data} />}
        {section === 2 && <MapSec tr={tr} lang={lang} data={data} />}
        {section === 3 && <Tables tr={tr} lang={lang} data={data} />}
        {section === 4 && <Alerts tr={tr} lang={lang} data={data} />}
        {section === 5 && (
          <Gallery tr={tr} gallery={gallery} setGallery={setGallery} admin={admin} />
        )}
        {section === 6 && <Accommodation tr={tr} lang={lang} c={c} data={data} />}
        {section === 7 && <Wishlist tr={tr} lang={lang} c={c} data={data} />}
        {section === 8 && <Prep tr={tr} lang={lang} data={data} />}
      </main>

      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          admin={admin}
          setAdmin={setAdmin}
          tr={tr}
          content={content}
          setContent={setContent}
          data={data}
          setData={setData}
        />
      )}
    </div>
  );
}

/* ===================== Sections ===================== */

function Home({ tr, c, cd, data }) {
  return (
    <section>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <p style={{ letterSpacing: 4, fontSize: 13, color: NAVY_SOFT, marginBottom: 14 }}>
          {tr.date.toUpperCase()}
        </p>
        <h1 style={styles.bigName}>
          Vanessa<br />
          <span style={{ fontStyle: "italic", fontSize: 40 }}>&</span><br />
          Pedro
        </h1>
      </div>

      <div style={styles.countGrid}>
        {[[cd.days, tr.days], [cd.hours, tr.hours], [cd.minutes, tr.minutes], [cd.seconds, tr.seconds]].map(
          ([v, l], i) => (
            <div key={i} style={styles.countBox}>
              <div style={styles.countNum}>{String(v).padStart(2, "0")}</div>
              <div style={styles.countLbl}>{l.toUpperCase()}</div>
            </div>
          )
        )}
      </div>

      <Card>
        <h2 style={styles.h2}>{c.welcomeTitle}</h2>
        <p style={styles.body}>{c.welcomeBody}</p>
      </Card>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        {data.heroPhoto ? (
          <img src={data.heroPhoto} alt="Vanessa & Pedro" style={styles.heroImg} />
        ) : (
          <div style={styles.heroPlaceholder}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>
              Vanessa & Pedro
            </p>
            <p style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>
              Adiciona a vossa foto em Administração → Foto
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Schedule({ tr, lang, data }) {
  return (
    <section>
      <h2 style={styles.h2Big}>{tr.schedule}</h2>
      <div style={{ marginTop: 24 }}>
        {data.schedule.map((s) => (
          <div key={s.id} style={styles.scheduleRow}>
            <div style={styles.scheduleTime}>{s.time}</div>
            <div style={{ fontSize: 17 }}>{s[lang]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MapSec({ tr, lang, data }) {
  return (
    <section>
      <h2 style={styles.h2Big}>{tr.map}</h2>
      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {data.locations.map((l) => (
          <Card key={l.id}>
            <h3 style={{ ...styles.h2, marginBottom: 6 }}>{l[lang]}</h3>
            <p style={{ ...styles.body, marginBottom: 14 }}>{l.address}</p>
            <a href={l.maps} target="_blank" rel="noreferrer" style={styles.linkBtn}>
              {tr.openMaps} →
            </a>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Tables({ tr, lang, data }) {
  const [query, setQuery] = useState("");
  // Mesas ficam visíveis a partir de 14/08/2026, ou se o admin tiver desbloqueado.
  const unlockDate = new Date("2026-08-14T00:00:00+01:00");
  const isUnlocked = data.tablesUnlocked === true || new Date() >= unlockDate;

  if (!isUnlocked) {
    return (
      <section>
        <h2 style={styles.h2Big}>{tr.tables}</h2>
        <div style={styles.tablesLocked}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <p style={{ ...styles.body, fontSize: 17 }}>{tr.tablesLocked}</p>
        </div>
      </section>
    );
  }

  const q = query.trim().toLowerCase();
  // Mesas a mostrar: se houver pesquisa, só as que têm um convidado correspondente.
  const visibleTables = q
    ? data.tables.filter((t) => t.guests.some((g) => g.name.toLowerCase().includes(q)))
    : data.tables;

  return (
    <section>
      <h2 style={styles.h2Big}>{tr.tables}</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tr.searchGuest}
        style={styles.tableSearch}
      />
      {q && visibleTables.length === 0 && (
        <p style={{ ...styles.body, marginTop: 16 }}>{tr.noGuestFound}</p>
      )}

      <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
        {visibleTables.map((t) => (
          <div key={t.id} style={styles.tableCard}>
            <div style={styles.tableHead}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600 }}>
                {t.name}
              </h3>
              <span style={{ fontSize: 13, color: NAVY_SOFT }}>
                {t.guests.length} {tr.guests}
              </span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {t.guests.map((g, i) => {
                const match = q && g.name.toLowerCase().includes(q);
                return (
                  <div
                    key={g.id}
                    style={{
                      ...styles.guestRow,
                      ...(match
                        ? { background: `${NAVY}10`, borderRadius: 8, padding: "6px 10px", fontWeight: 600 }
                        : {}),
                    }}
                  >
                    <span style={{ color: NAVY_SOFT, minWidth: 22, fontSize: 13 }}>{i + 1}.</span>
                    <span>{g.name}</span>
                    {g.age && (
                      <span style={styles.ageTag}>
                        {g.age}{" "}
                        {Number(g.age) === 1
                          ? lang === "pt" ? "ano" : "yr"
                          : lang === "pt" ? "anos" : "yrs"}
                      </span>
                    )}
                    {g.note && <span style={styles.noteTag}>⚠ {g.note}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Alerts({ tr, lang, data }) {
  return (
    <section>
      <h2 style={styles.h2Big}>{tr.alerts}</h2>
      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        {data.alerts.map((a) => (
          <div key={a.id} style={styles.alertBox}>
            {a[lang]}
          </div>
        ))}
      </div>
    </section>
  );
}

function Gallery({ tr, gallery, setGallery, admin }) {
  const inputRef = useRef();
  const [uploads, setUploads] = useState({}); // id -> progress
  const [showQR, setShowQR] = useState(false);
  const [lightbox, setLightbox] = useState(null); // media a mostrar em grande
  const [mine, setMine] = useState(() => loadMine()); // ids que este telemóvel carregou
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const markMine = (id) => {
    setMine((prev) => {
      const next = Array.from(new Set([...prev, id]));
      saveMine(next);
      return next;
    });
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    for (const f of files) {
      const tmpId = uid();
      setUploads((u) => ({ ...u, [tmpId]: 0 }));
      try {
        if (hasCloudinary) {
          const res = await uploadToCloudinary(f, (p) =>
            setUploads((u) => ({ ...u, [tmpId]: p }))
          );
          const item = { url: res.url, type: res.type, public_id: res.publicId };
          const saved = await addGalleryItem(item);
          const final = saved || { id: tmpId, ...item };
          setGallery((g) => [final, ...g]);
          markMine(final.id);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            const item = { id: tmpId, url: reader.result, type: f.type.startsWith("video") ? "video" : "image" };
            setGallery((g) => [item, ...g]);
            markMine(tmpId);
          };
          reader.readAsDataURL(f);
        }
      } catch (err) {
        alert("Erro no upload: " + err.message);
      } finally {
        setUploads((u) => {
          const n = { ...u };
          delete n[tmpId];
          return n;
        });
      }
    }
  };

  const remove = async (id) => {
    setGallery((g) => g.filter((x) => x.id !== id));
    setLightbox(null);
    await deleteGalleryItem(id);
  };

  const canDelete = (m) => admin || mine.includes(m.id);
  const uploadList = Object.entries(uploads);

  return (
    <section>
      <h2 style={styles.h2Big}>{tr.gallery}</h2>
      <p style={{ ...styles.body, marginTop: 10, fontSize: 14 }}>{tr.galleryHint}</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button onClick={() => inputRef.current.click()} style={styles.linkBtn}>
          {tr.upload}
        </button>
        <button onClick={() => setShowQR(!showQR)} style={styles.pill}>
          {tr.shareGallery}
        </button>
      </div>

      {showQR && (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <img
            alt="QR"
            style={{ width: 200, height: 200, borderRadius: 12 }}
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
              pageUrl
            )}`}
          />
          <p style={{ ...styles.body, fontSize: 13, marginTop: 8 }}>{pageUrl}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFiles}
        style={{ display: "none" }}
      />

      {uploadList.length > 0 && (
        <div style={{ marginTop: 16, display: "grid", gap: 6 }}>
          {uploadList.map(([id, p]) => (
            <div key={id} style={styles.progressWrap}>
              <div style={{ ...styles.progressBar, width: `${p}%` }} />
              <span style={styles.progressTxt}>{tr.uploading} {p}%</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.galleryGrid}>
        {gallery.map((m) => (
          <div key={m.id} style={{ position: "relative" }}>
            <div onClick={() => setLightbox(m)} style={{ cursor: "pointer" }}>
              {m.type === "video" ? (
                <div style={{ position: "relative" }}>
                  <video src={m.url} style={styles.thumb} />
                  <div style={styles.playBadge}>▶</div>
                </div>
              ) : (
                <img src={m.url} alt="" style={styles.thumb} loading="lazy" />
              )}
            </div>
            {canDelete(m) && (
              <button onClick={(e) => { e.stopPropagation(); remove(m.id); }} style={styles.delThumb}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div style={styles.lightbox} onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} style={styles.lbClose}>✕</button>
          <div style={styles.lbContent} onClick={(e) => e.stopPropagation()}>
            {lightbox.type === "video" ? (
              <video src={lightbox.url} controls autoPlay style={styles.lbMedia} />
            ) : (
              <img src={lightbox.url} alt="" style={styles.lbMedia} />
            )}
            <div style={styles.lbActions}>
              <a href={downloadUrl(lightbox.url)} download style={styles.linkBtn}>
                ↓ {tr.download}
              </a>
              {canDelete(lightbox) && (
                <button onClick={() => remove(lightbox.id)} style={styles.lbDelete}>
                  {tr.delete}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Marca (no próprio navegador) os media que este telemóvel carregou.
function loadMine() {
  try {
    return JSON.parse(localStorage.getItem("vp_my_uploads") || "[]");
  } catch {
    return [];
  }
}
function saveMine(arr) {
  try {
    localStorage.setItem("vp_my_uploads", JSON.stringify(arr));
  } catch {}
}

// Constrói um URL do Cloudinary que força o download (fl_attachment).
function downloadUrl(url) {
  if (url && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

function Accommodation({ tr, lang, c, data }) {
  return (
    <section>
      <h2 style={styles.h2Big}>{c.accommodationTitle}</h2>
      {/* texto introdutório em parágrafos separados */}
      <div style={{ marginTop: 14 }}>
        {(c.accommodationBody || "").split("\n").filter((p) => p.trim()).map((par, i) => (
          <p key={i} style={{ ...styles.body, marginBottom: 12 }}>{par}</p>
        ))}
      </div>
      <div style={{ marginTop: 24, display: "grid", gap: 18 }}>
        {data.accommodation.map((a) => {
          const title = a[lang + "Title"] || a.title || "";
          const text = a[lang] || "";
          return (
            <div key={a.id} style={styles.accomCard}>
              {a.photo && (
                <img src={a.photo} alt="" style={styles.accomImg} loading="lazy" />
              )}
              <div style={{ padding: a.photo ? "18px 22px" : "22px" }}>
                {title && (
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
                    {title}
                  </h3>
                )}
                {text.split("\n").filter((p) => p.trim()).map((par, i) => (
                  <p key={i} style={{ ...styles.body, marginBottom: 8 }}>{par}</p>
                ))}
                {a.maps && (
                  <a href={a.maps} target="_blank" rel="noreferrer" style={{ ...styles.linkBtn, marginTop: 10 }}>
                    {tr.openMaps} →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ===================== Admin ===================== */

function Wishlist({ tr, lang, c, data }) {
  const [copied, setCopied] = useState(false);
  const w = data.wishlist || {};
  const title = w[lang + "Title"] || (lang === "pt" ? "Lista de Desejos" : "Wishlist");
  const text = w[lang] || "";

  const copyIban = () => {
    const iban = (w.iban || "").replace(/\s/g, "");
    try {
      navigator.clipboard.writeText(iban);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section>
      <h2 style={styles.h2Big}>{tr.wishlist}</h2>

      {w.photo && (
        <img src={w.photo} alt="" style={{ width: "100%", borderRadius: 16, marginTop: 18 }} />
      )}

      <div style={{ marginTop: 18 }}>
        {text.split("\n").filter((p) => p.trim()).map((par, i) => (
          <p key={i} style={{ ...styles.body, marginBottom: 12 }}>{par}</p>
        ))}
      </div>

      {(w.iban || w.holder) && (
        <div style={styles.ibanCard}>
          {w.holder && (
            <div style={{ marginBottom: 10 }}>
              <span style={styles.fieldLabel}>{tr.accountHolder}</span>
              <div style={{ fontSize: 17 }}>{w.holder}</div>
            </div>
          )}
          {w.iban && (
            <div>
              <span style={styles.fieldLabel}>{tr.iban}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                <span style={{ fontSize: 17, letterSpacing: 0.5, fontFamily: "monospace" }}>{w.iban}</span>
                <button onClick={copyIban} style={styles.pill}>
                  {copied ? tr.copied : tr.copy}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Prep({ tr, lang, data }) {
  const p = data.prep || {};
  const name = p[lang + "Name"] || p.name || "";
  const intro = p[lang] || "";
  const schedule = p.schedule || [];

  return (
    <section>
      <h2 style={styles.h2Big}>{tr.prep}</h2>

      {intro && (
        <div style={{ marginTop: 14 }}>
          {intro.split("\n").filter((x) => x.trim()).map((par, i) => (
            <p key={i} style={{ ...styles.body, marginBottom: 12 }}>{par}</p>
          ))}
        </div>
      )}

      {/* Alojamento da preparação */}
      {(name || p.maps || p.photo) && (
        <div style={{ ...styles.accomCard, marginTop: 20 }}>
          {p.photo && <img src={p.photo} alt="" style={styles.accomImg} loading="lazy" />}
          <div style={{ padding: p.photo ? "18px 22px" : "22px" }}>
            {name && (
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
                {name}
              </h3>
            )}
            {p.maps && (
              <a href={p.maps} target="_blank" rel="noreferrer" style={styles.linkBtn}>
                {tr.openMaps} →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Horários */}
      {schedule.length > 0 && (
        <>
          <h3 style={{ ...styles.h2, marginTop: 30 }}>{tr.prepSchedule}</h3>
          <div style={{ marginTop: 8 }}>
            {schedule.map((s) => (
              <div key={s.id} style={styles.prepRow}>
                <div style={styles.prepTime}>{s.time}</div>
                <div>
                  <div style={{ fontSize: 16 }}>{s.name}</div>
                  {s.note && <div style={{ ...styles.body, fontSize: 14 }}>{s.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AdminPanel({ onClose, admin, setAdmin, tr, content, setContent, data, setData }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const login = () => {
    if (pw === ADMIN_PASSWORD) {
      setAdmin(true);
      setErr(false);
    } else setErr(true);
  };
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>{tr.admin}</h2>
          <button onClick={onClose} style={{ ...styles.pill, padding: "4px 12px" }}>✕</button>
        </div>
        {!admin ? (
          <div style={{ marginTop: 24 }}>
            <input
              type="password"
              value={pw}
              placeholder={tr.adminPlaceholder}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={styles.input}
            />
            {err && <p style={{ color: "#c0392b", fontSize: 13 }}>✕</p>}
            <button onClick={login} style={{ ...styles.linkBtn, marginTop: 14 }}>
              {tr.adminLogin}
            </button>
          </div>
        ) : (
          <AdminEditor
            tr={tr}
            content={content}
            setContent={setContent}
            data={data}
            setData={setData}
            onLogout={() => setAdmin(false)}
          />
        )}
      </div>
    </div>
  );
}

function AdminEditor({ tr, content, setContent, data, setData, onLogout }) {
  const [tab, setTab] = useState("text");
  const photoRef = useRef();

  const setText = (lang, key, val) =>
    setContent((c) => ({ ...c, [lang]: { ...c[lang], [key]: val } }));
  const updateList = (k, id, f, v) =>
    setData((d) => ({ ...d, [k]: d[k].map((it) => (it.id === id ? { ...it, [f]: v } : it)) }));
  const addItem = (k, tmpl) =>
    setData((d) => ({ ...d, [k]: [...d[k], { id: uid(), ...tmpl }] }));
  const delItem = (k, id) =>
    setData((d) => ({ ...d, [k]: d[k].filter((it) => it.id !== id) }));

  const onPhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setData((d) => ({ ...d, heroPhoto: r.result }));
    r.readAsDataURL(f);
  };

  const tabs = [
    ["text", "Textos"], ["schedule", "Programa"], ["locations", "Mapa"],
    ["tables", "Mesas"], ["alerts", "Novidades"], ["accommodation", "Alojamento"], ["wishlist", "Lista Desejos"], ["prep", "Preparações"], ["photo", "Foto"],
  ];

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ ...styles.pill, background: tab === k ? NAVY : "transparent", color: tab === k ? "#fff" : NAVY }}
          >
            {l}
          </button>
        ))}
        <button onClick={onLogout} style={{ ...styles.pill, marginLeft: "auto" }}>{tr.logout}</button>
      </div>

      {tab === "text" && (
        <div style={{ display: "grid", gap: 16 }}>
          {["pt", "en"].map((lg) => (
            <div key={lg}>
              <p style={styles.fieldLabel}>{lg.toUpperCase()}</p>
              <input style={styles.input} value={content[lg].welcomeTitle}
                onChange={(e) => setText(lg, "welcomeTitle", e.target.value)} placeholder="Título boas-vindas" />
              <textarea style={{ ...styles.input, minHeight: 90 }} value={content[lg].welcomeBody}
                onChange={(e) => setText(lg, "welcomeBody", e.target.value)} placeholder="Mensagem boas-vindas" />
              <input style={styles.input} value={content[lg].accommodationTitle}
                onChange={(e) => setText(lg, "accommodationTitle", e.target.value)} placeholder="Título alojamento" />
              <textarea style={{ ...styles.input, minHeight: 80 }} value={content[lg].accommodationBody}
                onChange={(e) => setText(lg, "accommodationBody", e.target.value)} placeholder="Texto alojamento" />
            </div>
          ))}
        </div>
      )}

      {tab === "schedule" && (
        <ListEditor items={data.schedule} tr={tr}
          fields={[["time", "Hora"], ["pt", "PT"], ["en", "EN"]]}
          onChange={(id, f, v) => updateList("schedule", id, f, v)}
          onAdd={() => addItem("schedule", { time: "00:00", pt: "", en: "" })}
          onDelete={(id) => delItem("schedule", id)} />
      )}
      {tab === "locations" && (
        <ListEditor items={data.locations} tr={tr}
          fields={[["pt", "Nome PT"], ["en", "Nome EN"], ["address", "Morada"], ["maps", "Link mapa"]]}
          onChange={(id, f, v) => updateList("locations", id, f, v)}
          onAdd={() => addItem("locations", { pt: "", en: "", address: "", maps: "https://maps.google.com" })}
          onDelete={(id) => delItem("locations", id)} />
      )}
      {tab === "tables" && <TablesEditor tr={tr} data={data} setData={setData} />}
      {tab === "alerts" && (
        <ListEditor items={data.alerts} tr={tr}
          fields={[["pt", "PT"], ["en", "EN"]]}
          onChange={(id, f, v) => updateList("alerts", id, f, v)}
          onAdd={() => addItem("alerts", { pt: "", en: "" })}
          onDelete={(id) => delItem("alerts", id)} />
      )}
      {tab === "accommodation" && (
        <AccommodationEditor tr={tr} data={data} setData={setData} />
      )}
      {tab === "wishlist" && (
        <WishlistEditor tr={tr} data={data} setData={setData} />
      )}
      {tab === "prep" && (
        <PrepEditor tr={tr} data={data} setData={setData} />
      )}
      {tab === "photo" && (
        <div>
          <p style={styles.fieldLabel}>{tr.uploadPhoto}</p>
          {data.heroPhoto && <img src={data.heroPhoto} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 12 }} />}
          <button onClick={() => photoRef.current.click()} style={styles.linkBtn}>{tr.uploadPhoto}</button>
          <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          {data.heroPhoto && (
            <button onClick={() => setData((d) => ({ ...d, heroPhoto: "" }))} style={{ ...styles.pill, marginTop: 10 }}>
              {tr.delete}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PrepEditor({ tr, data, setData }) {
  const [uploading, setUploading] = useState(false);
  const p = data.prep || {};
  const upd = (field, val) =>
    setData((d) => ({ ...d, prep: { ...(d.prep || {}), [field]: val } }));

  const schedule = p.schedule || [];
  const setSchedule = (fn) =>
    setData((d) => ({ ...d, prep: { ...(d.prep || {}), schedule: fn((d.prep || {}).schedule || []) } }));
  const updSlot = (id, field, val) =>
    setSchedule((arr) => arr.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  const addSlot = () =>
    setSchedule((arr) => [...arr, { id: uid(), time: "00h00", name: "", note: "" }]);
  const delSlot = (id) => setSchedule((arr) => arr.filter((s) => s.id !== id));

  const onPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      if (hasCloudinary) {
        const res = await uploadToCloudinary(file);
        upd("photo", res.url);
      } else {
        const r = new FileReader();
        r.onload = () => upd("photo", r.result);
        r.readAsDataURL(file);
      }
    } catch (e) {
      alert("Erro no upload: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p style={styles.fieldLabel}>Texto introdutório (PT)</p>
      <textarea style={{ ...styles.input, minHeight: 70 }} value={p.pt || ""}
        onChange={(e) => upd("pt", e.target.value)} placeholder="Mensagem opcional…" />
      <p style={styles.fieldLabel}>Texto introdutório (EN)</p>
      <textarea style={{ ...styles.input, minHeight: 70 }} value={p.en || ""}
        onChange={(e) => upd("en", e.target.value)} placeholder="Optional message…" />

      <div style={{ border: `1px solid ${NAVY}20`, borderRadius: 12, padding: 14 }}>
        <p style={{ ...styles.fieldLabel, fontWeight: 600 }}>Alojamento da preparação</p>
        <p style={styles.fieldLabel}>Nome (PT)</p>
        <input style={styles.input} value={p.ptName || ""}
          onChange={(e) => upd("ptName", e.target.value)} placeholder="Ex: Casa da Preparação" />
        <p style={styles.fieldLabel}>Nome (EN)</p>
        <input style={styles.input} value={p.enName || ""}
          onChange={(e) => upd("enName", e.target.value)} placeholder="Ex: Getting Ready House" />
        <p style={styles.fieldLabel}>Link do mapa</p>
        <input style={styles.input} value={p.maps || ""}
          onChange={(e) => upd("maps", e.target.value)} placeholder="https://maps.google.com/..." />
        <p style={styles.fieldLabel}>Foto</p>
        {p.photo && <img src={p.photo} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 8 }} />}
        <label style={{ ...styles.linkBtn, display: "inline-block", cursor: "pointer" }}>
          {uploading ? tr.uploading : (p.photo ? "Mudar foto" : "Carregar foto")}
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => onPhoto(e.target.files[0])} />
        </label>
        {p.photo && (
          <button onClick={() => upd("photo", "")} style={{ ...styles.pill, marginLeft: 8 }}>
            Remover foto
          </button>
        )}
      </div>

      <p style={{ ...styles.fieldLabel, fontWeight: 600, marginTop: 6 }}>Horários da preparação</p>
      {schedule.map((s) => (
        <div key={s.id} style={{ border: `1px solid ${NAVY}20`, borderRadius: 12, padding: 12, display: "grid", gap: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 6, alignItems: "center" }}>
            <input style={{ ...styles.input, marginBottom: 0, textAlign: "center" }} value={s.time}
              onChange={(e) => updSlot(s.id, "time", e.target.value)} placeholder="15h00" />
            <input style={{ ...styles.input, marginBottom: 0 }} value={s.name}
              onChange={(e) => updSlot(s.id, "name", e.target.value)} placeholder="Nome" />
            <button onClick={() => delSlot(s.id)} style={{ ...styles.pill, padding: "6px 10px" }}>✕</button>
          </div>
          <input style={{ ...styles.input, marginBottom: 0 }} value={s.note || ""}
            onChange={(e) => updSlot(s.id, "note", e.target.value)} placeholder="Nota / descrição (opcional)" />
        </div>
      ))}
      <button onClick={addSlot} style={styles.linkBtn}>+ {tr.add} horário</button>
    </div>
  );
}

function WishlistEditor({ tr, data, setData }) {
  const [uploading, setUploading] = useState(false);
  const w = data.wishlist || {};
  const upd = (field, val) =>
    setData((d) => ({ ...d, wishlist: { ...(d.wishlist || {}), [field]: val } }));

  const onPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      if (hasCloudinary) {
        const res = await uploadToCloudinary(file);
        upd("photo", res.url);
      } else {
        const r = new FileReader();
        r.onload = () => upd("photo", r.result);
        r.readAsDataURL(file);
      }
    } catch (e) {
      alert("Erro no upload: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p style={styles.fieldLabel}>Título (PT)</p>
      <input style={styles.input} value={w.ptTitle || ""}
        onChange={(e) => upd("ptTitle", e.target.value)} placeholder="Lista de Desejos" />
      <p style={styles.fieldLabel}>Título (EN)</p>
      <input style={styles.input} value={w.enTitle || ""}
        onChange={(e) => upd("enTitle", e.target.value)} placeholder="Wishlist" />
      <p style={styles.fieldLabel}>Texto (PT)</p>
      <textarea style={{ ...styles.input, minHeight: 90 }} value={w.pt || ""}
        onChange={(e) => upd("pt", e.target.value)} placeholder="Mensagem para os convidados…" />
      <p style={styles.fieldLabel}>Texto (EN)</p>
      <textarea style={{ ...styles.input, minHeight: 90 }} value={w.en || ""}
        onChange={(e) => upd("en", e.target.value)} placeholder="Message for guests…" />
      <p style={styles.fieldLabel}>Titular da conta</p>
      <input style={styles.input} value={w.holder || ""}
        onChange={(e) => upd("holder", e.target.value)} placeholder="Ex: Vanessa & Pedro" />
      <p style={styles.fieldLabel}>IBAN</p>
      <input style={styles.input} value={w.iban || ""}
        onChange={(e) => upd("iban", e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" />
      <p style={styles.fieldLabel}>Imagem</p>
      {w.photo && <img src={w.photo} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 8 }} />}
      <div>
        <label style={{ ...styles.linkBtn, display: "inline-block", cursor: "pointer" }}>
          {uploading ? tr.uploading : (w.photo ? "Mudar imagem" : "Carregar imagem")}
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => onPhoto(e.target.files[0])} />
        </label>
        {w.photo && (
          <button onClick={() => upd("photo", "")} style={{ ...styles.pill, marginLeft: 8 }}>
            Remover imagem
          </button>
        )}
      </div>
    </div>
  );
}

function AccommodationEditor({ tr, data, setData }) {
  const [uploading, setUploading] = useState(null);
  const setList = (fn) => setData((d) => ({ ...d, accommodation: fn(d.accommodation || []) }));
  const upd = (id, field, val) =>
    setList((items) => items.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  const add = () =>
    setList((items) => [
      ...items,
      { id: uid(), ptTitle: "", enTitle: "", pt: "", en: "", maps: "", photo: "" },
    ]);
  const del = (id) => setList((items) => items.filter((it) => it.id !== id));

  const onPhoto = async (id, file) => {
    if (!file) return;
    setUploading(id);
    try {
      if (hasCloudinary) {
        const res = await uploadToCloudinary(file);
        upd(id, "photo", res.url);
      } else {
        const r = new FileReader();
        r.onload = () => upd(id, "photo", r.result);
        r.readAsDataURL(file);
      }
    } catch (e) {
      alert("Erro no upload: " + e.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ ...styles.fieldLabel, marginBottom: 0 }}>
        Dica: para parágrafos separados, carrega Enter entre eles no campo de texto.
      </p>
      {(data.accommodation || []).map((a) => (
        <div key={a.id} style={{ border: `1px solid ${NAVY}20`, borderRadius: 12, padding: 14 }}>
          <p style={styles.fieldLabel}>Título (PT)</p>
          <input style={styles.input} value={a.ptTitle || ""}
            onChange={(e) => upd(a.id, "ptTitle", e.target.value)} placeholder="Ex: Hotel Mar Azul" />
          <p style={styles.fieldLabel}>Título (EN)</p>
          <input style={styles.input} value={a.enTitle || ""}
            onChange={(e) => upd(a.id, "enTitle", e.target.value)} placeholder="Ex: Mar Azul Hotel" />
          <p style={styles.fieldLabel}>Texto (PT)</p>
          <textarea style={{ ...styles.input, minHeight: 80 }} value={a.pt || ""}
            onChange={(e) => upd(a.id, "pt", e.target.value)} placeholder="Descrição, morada, contacto…" />
          <p style={styles.fieldLabel}>Texto (EN)</p>
          <textarea style={{ ...styles.input, minHeight: 80 }} value={a.en || ""}
            onChange={(e) => upd(a.id, "en", e.target.value)} placeholder="Description, address, contact…" />
          <p style={styles.fieldLabel}>Link do mapa / localização</p>
          <input style={styles.input} value={a.maps || ""}
            onChange={(e) => upd(a.id, "maps", e.target.value)} placeholder="https://maps.google.com/..." />
          <p style={styles.fieldLabel}>Foto</p>
          {a.photo && (
            <img src={a.photo} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 8 }} />
          )}
          <label style={{ ...styles.linkBtn, display: "inline-block", cursor: "pointer" }}>
            {uploading === a.id ? tr.uploading : (a.photo ? "Mudar foto" : "Carregar foto")}
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => onPhoto(a.id, e.target.files[0])} />
          </label>
          {a.photo && (
            <button onClick={() => upd(a.id, "photo", "")} style={{ ...styles.pill, marginLeft: 8 }}>
              Remover foto
            </button>
          )}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => del(a.id)} style={styles.pill}>{tr.delete}</button>
          </div>
        </div>
      ))}
      <button onClick={add} style={styles.linkBtn}>+ {tr.add} alojamento</button>
    </div>
  );
}

function TablesEditor({ tr, data, setData }) {
  const [open, setOpen] = useState(null);
  const setTables = (fn) => setData((d) => ({ ...d, tables: fn(d.tables) }));
  const updTableName = (tid, val) => setTables((ts) => ts.map((t) => (t.id === tid ? { ...t, name: val } : t)));
  const addTable = () => setTables((ts) => [...ts, { id: uid(), name: "Nova mesa", guests: [] }]);
  const delTable = (tid) => setTables((ts) => ts.filter((t) => t.id !== tid));
  const updGuest = (tid, gid, field, val) =>
    setTables((ts) => ts.map((t) => t.id === tid
      ? { ...t, guests: t.guests.map((g) => (g.id === gid ? { ...g, [field]: val } : g)) } : t));
  const addGuest = (tid) =>
    setTables((ts) => ts.map((t) => t.id === tid
      ? { ...t, guests: [...t.guests, { id: uid(), name: "", age: "", note: "" }] } : t));
  const delGuest = (tid, gid) =>
    setTables((ts) => ts.map((t) => (t.id === tid ? { ...t, guests: t.guests.filter((g) => g.id !== gid) } : t)));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ border: `1px solid ${NAVY}20`, borderRadius: 12, padding: 14, background: `${NAVY}05` }}>
        <p style={styles.fieldLabel}>Visibilidade das mesas para os convidados</p>
        <p style={{ ...styles.body, fontSize: 14, marginBottom: 10 }}>
          Por defeito, as mesas só ficam visíveis a 14 de agosto. Podes desbloquear já aqui.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 15 }}>
          <input
            type="checkbox"
            checked={data.tablesUnlocked === true}
            onChange={(e) => setData((d) => ({ ...d, tablesUnlocked: e.target.checked }))}
          />
          Mostrar as mesas já agora (desbloqueado)
        </label>
      </div>
      {data.tables.map((t) => (
        <div key={t.id} style={{ border: `1px solid ${NAVY}20`, borderRadius: 12 }}>
          <div style={styles.tableEditHead} onClick={() => setOpen(open === t.id ? null : t.id)}>
            <span style={{ fontSize: 14, color: NAVY_SOFT }}>{open === t.id ? "▼" : "▶"}</span>
            <input style={{ ...styles.input, marginBottom: 0, flex: 1 }} value={t.name}
              onClick={(e) => e.stopPropagation()} onChange={(e) => updTableName(t.id, e.target.value)} />
            <span style={{ fontSize: 12, color: NAVY_SOFT, whiteSpace: "nowrap" }}>{t.guests.length} 👤</span>
          </div>
          {open === t.id && (
            <div style={{ padding: "0 12px 12px" }}>
              {t.guests.map((g) => (
                <div key={g.id} style={styles.guestEditRow}>
                  <input style={{ ...styles.input, marginBottom: 0 }} placeholder="Nome" value={g.name}
                    onChange={(e) => updGuest(t.id, g.id, "name", e.target.value)} />
                  <input style={{ ...styles.input, marginBottom: 0, textAlign: "center" }} placeholder="idade" value={g.age}
                    onChange={(e) => updGuest(t.id, g.id, "age", e.target.value)} />
                  <input style={{ ...styles.input, marginBottom: 0 }} placeholder="alergia / intolerância" value={g.note}
                    onChange={(e) => updGuest(t.id, g.id, "note", e.target.value)} />
                  <button onClick={() => delGuest(t.id, g.id)} style={{ ...styles.pill, padding: "6px 10px" }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => addGuest(t.id)} style={styles.linkBtn}>+ {tr.add} convidado</button>
                <button onClick={() => delTable(t.id)} style={styles.pill}>{tr.delete} mesa</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={addTable} style={styles.linkBtn}>+ {tr.add} mesa</button>
    </div>
  );
}

function ListEditor({ items, fields, onChange, onAdd, onDelete, tr }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {items.map((it) => (
        <div key={it.id} style={{ border: `1px solid ${NAVY}20`, borderRadius: 12, padding: 14 }}>
          {fields.map(([f, label]) => (
            <div key={f} style={{ marginBottom: 8 }}>
              <p style={styles.fieldLabel}>{label}</p>
              {["pt", "en"].includes(f) ? (
                <textarea style={{ ...styles.input, minHeight: 50 }} value={it[f]}
                  onChange={(e) => onChange(it.id, f, e.target.value)} />
              ) : (
                <input style={styles.input} value={it[f]} onChange={(e) => onChange(it.id, f, e.target.value)} />
              )}
            </div>
          ))}
          <button onClick={() => onDelete(it.id)} style={styles.pill}>{tr.delete}</button>
        </div>
      ))}
      <button onClick={onAdd} style={styles.linkBtn}>+ {tr.add}</button>
    </div>
  );
}

/* ===================== UI bits ===================== */
const Card = ({ children }) => <div style={styles.card}>{children}</div>;

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background:#fff; }
      ::selection { background:${NAVY}; color:#fff; }
      input, textarea { font-family:'Jost',sans-serif; }
    `}</style>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#fff", color: NAVY, fontFamily: "'Jost',sans-serif" },
  stickyTop: { position: "sticky", top: 0, zIndex: 50, background: "#fff" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${NAVY}15`, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)" },
  nav: { display: "flex", gap: 6, overflowX: "auto", padding: "14px 24px", borderBottom: `1px solid ${NAVY}10`, background: "#fff" },
  logo: { fontFamily: "'Cormorant Garamond',serif", fontSize: 24, letterSpacing: 1, fontWeight: 600 },
  navBtn: { border: "none", padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 14, whiteSpace: "nowrap", letterSpacing: 0.3, transition: "all .2s" },
  offlineBar: { background: "#fff7e6", color: "#8a6d3b", fontSize: 12.5, padding: "8px 24px", textAlign: "center" },
  main: { maxWidth: 760, margin: "0 auto", padding: "40px 24px 100px" },
  bigName: { fontFamily: "'Cormorant Garamond',serif", fontSize: 56, fontWeight: 500, lineHeight: 1.05 },
  countGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 50 },
  countBox: { background: NAVY, color: "#fff", borderRadius: 14, padding: "18px 6px", textAlign: "center" },
  countNum: { fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, lineHeight: 1 },
  countLbl: { fontSize: 11, letterSpacing: 1, marginTop: 6, opacity: 0.8 },
  card: { background: `${NAVY}06`, borderRadius: 16, padding: "26px 24px" },
  h2: { fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 600, marginBottom: 12 },
  h2Big: { fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 500 },
  body: { fontSize: 16, lineHeight: 1.7, color: NAVY_SOFT, fontWeight: 300 },
  heroImg: { width: "100%", borderRadius: 18, objectFit: "cover" },
  heroPlaceholder: { border: `2px dashed ${NAVY}30`, borderRadius: 18, padding: "60px 20px", color: NAVY_SOFT },
  scheduleRow: { display: "flex", gap: 18, padding: "16px 0", borderBottom: `1px solid ${NAVY}12`, alignItems: "baseline" },
  scheduleTime: { fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, minWidth: 64 },
  tableCard: { border: `1px solid ${NAVY}20`, borderRadius: 16, padding: "20px 22px" },
  tableHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, borderBottom: `1px solid ${NAVY}12`, paddingBottom: 10 },
  guestRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 15.5 },
  ageTag: { background: `${NAVY}10`, borderRadius: 100, padding: "2px 10px", fontSize: 12.5, color: NAVY },
  noteTag: { background: "#fbeaea", color: "#a23b3b", borderRadius: 100, padding: "2px 10px", fontSize: 12.5 },
  alertBox: { background: `${NAVY}08`, borderLeft: `4px solid ${NAVY}`, borderRadius: 8, padding: "14px 18px", fontSize: 16 },
  linkBtn: { display: "inline-block", background: NAVY, color: "#fff", padding: "11px 22px", borderRadius: 100, textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 14, letterSpacing: 0.3 },
  pill: { border: `1px solid ${NAVY}30`, background: "transparent", color: NAVY, padding: "6px 14px", borderRadius: 100, cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13 },
  galleryGrid: { marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 8 },
  thumb: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, background: `${NAVY}08` },
  playBadge: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, textShadow: "0 2px 8px rgba(0,0,0,0.6)", pointerEvents: "none" },
  lightbox: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 },
  lbClose: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 100, width: 40, height: 40, fontSize: 18, cursor: "pointer", zIndex: 210 },
  lbContent: { maxWidth: "100%", maxHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  lbMedia: { maxWidth: "100%", maxHeight: "80vh", borderRadius: 10, objectFit: "contain" },
  lbActions: { display: "flex", gap: 10, alignItems: "center" },
  lbDelete: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", padding: "11px 22px", borderRadius: 100, cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 14 },
  delThumb: { position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 100, width: 26, height: 26, cursor: "pointer" },
  dlThumb: { position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 100, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 16, fontWeight: 600 },
  accomCard: { border: `1px solid ${NAVY}20`, borderRadius: 16, overflow: "hidden" },
  accomImg: { width: "100%", maxHeight: 260, objectFit: "cover", display: "block" },
  ibanCard: { marginTop: 24, border: `1px solid ${NAVY}20`, borderRadius: 16, padding: "22px 24px", background: `${NAVY}05` },
  prepRow: { display: "flex", gap: 18, padding: "14px 0", borderBottom: `1px solid ${NAVY}12`, alignItems: "baseline" },
  prepTime: { fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, minWidth: 72 },
  tableSearch: { width: "100%", border: `1px solid ${NAVY}25`, borderRadius: 100, padding: "12px 20px", fontSize: 15, marginTop: 18, color: NAVY, background: "#fff" },
  tablesLocked: { textAlign: "center", padding: "50px 24px", marginTop: 24, border: `1px solid ${NAVY}15`, borderRadius: 16, background: `${NAVY}05` },
  progressWrap: { position: "relative", height: 26, background: `${NAVY}10`, borderRadius: 100, overflow: "hidden" },
  progressBar: { position: "absolute", left: 0, top: 0, bottom: 0, background: NAVY, transition: "width .2s" },
  progressTxt: { position: "relative", fontSize: 12, color: "#fff", lineHeight: "26px", paddingLeft: 12, mixBlendMode: "difference" },
  overlay: { position: "fixed", inset: 0, background: "rgba(26,39,68,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, zIndex: 100, overflowY: "auto" },
  modal: { background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 560, marginTop: 40, marginBottom: 40 },
  input: { width: "100%", border: `1px solid ${NAVY}25`, borderRadius: 10, padding: "11px 14px", fontSize: 15, marginBottom: 8, color: NAVY, background: "#fff" },
  fieldLabel: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: NAVY_SOFT, marginBottom: 4 },
  tableEditHead: { display: "flex", alignItems: "center", gap: 8, padding: 12, cursor: "pointer" },
  guestEditRow: { display: "grid", gridTemplateColumns: "1fr 56px 1fr auto", gap: 6, marginBottom: 6, alignItems: "center" },
};
