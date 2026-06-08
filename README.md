# Vanessa & Pedro — App de Casamento (14.08.2026)

App em React (Vite) com:
- Contagem decrescente, programa, mapa, plano de mesas com idades e alergias, alertas, alojamento
- Português + tradução para inglês
- **Modo administração** (palavra-passe) que edita/adiciona/elimina tudo
- **Persistência permanente** no Supabase (grátis)
- **Galeria partilhada** com upload de fotos/vídeos via Cloudinary (25 GB grátis) + QR code
- Alertas e galeria em **tempo real** entre todos os telemóveis

---

## Passo 1 — Supabase (guardar tudo de forma permanente)

1. Cria conta em https://supabase.com → **New project** (escolhe região Europa, ex: Frankfurt).
2. Quando o projeto estiver pronto, vai a **SQL Editor → New query**, cola o conteúdo de
   `supabase_setup.sql` (incluído neste projeto) e clica **Run**.
3. Vai a **Project Settings → API** e copia:
   - **Project URL** → será o `VITE_SUPABASE_URL`
   - **anon public key** → será o `VITE_SUPABASE_ANON_KEY`

## Passo 2 — Cloudinary (galeria de fotos/vídeos)

1. Cria conta grátis em https://cloudinary.com.
2. No **Dashboard** copia o **Cloud name** → `VITE_CLOUDINARY_CLOUD_NAME`.
3. Vai a **Settings → Upload → Upload presets → Add upload preset**:
   - **Signing Mode: Unsigned**
   - Dá-lhe um nome (ex: `wedding_unsigned`) → será o `VITE_CLOUDINARY_UPLOAD_PRESET`
   - (Opcional) em *Folder* põe `wedding`; em *Allowed formats* limita a imagens/vídeos.
   - Guarda.

## Passo 3 — Variáveis de ambiente

Copia `.env.example` para `.env` e preenche os 4 valores + a palavra-passe de admin.

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=wedding_unsigned
VITE_ADMIN_PASSWORD=14082026
```

## Passo 4 — Correr localmente (opcional)

```bash
npm install
npm run dev
```

## Passo 5 — Publicar no Vercel

1. Põe este projeto num repositório GitHub.
2. No Vercel: **Add New → Project → Import** o repositório.
   - Framework: **Vite** (detetado automaticamente). Build: `npm run build`. Output: `dist`.
3. Em **Settings → Environment Variables**, adiciona as mesmas 5 variáveis do `.env`.
4. **Deploy.** O teu link `vanessa-pedro-wedding.vercel.app` passa a usar esta versão.

> Se já tens o projeto ligado ao Vercel, basta substituir os ficheiros pelo conteúdo
> desta pasta, adicionar as variáveis de ambiente e voltar a fazer deploy.

---

## Como usar

- **Administração**: botão "Administração" no topo → palavra-passe. Editas textos (PT/EN),
  programa, locais do mapa, **mesas e convidados** (nome, idade, alergia/intolerância),
  alertas e alojamento, e carregas a foto principal. Tudo guarda automaticamente no Supabase.
- **Galeria**: separador "Galeria" → "Carregar fotos/vídeos". Qualquer convidado, no seu
  telemóvel, carrega e todos veem. O botão **"Partilhar galeria (QR)"** mostra um QR code
  com o link do app para distribuíres (mesas, convites, etc.).
- **Apagar fotos**: só aparece o ✕ nas fotos quando estás autenticado como admin.

## Notas

- Limites grátis: Supabase 500 MB base de dados (chega de sobra — só guarda texto e links) e
  Cloudinary 25 GB para os media.
- O projeto Supabase grátis adormece após 7 dias sem uso; basta abrir o dashboard para o reativar
  (ou, perto do casamento, mantém-no ativo com um acesso ocasional).
- Sem as variáveis configuradas, o app continua a abrir mas em modo local (as alterações ficam
  só no dispositivo) — vês um aviso amarelo no topo.
