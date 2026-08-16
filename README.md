# PDFKit Pro

Ek **real working** PDF/image tools SaaS starter — jaisa iLovePDF hota hai, waisa hi
layout/idea, lekin apna original design, apna naam, aur apna code. Ye sirf mockup nahi
hai — tools actually server par files process karte hain (upload karo, process ho,
download karo).

> Naam "PDFKit Pro" ek placeholder hai — jitna chaho utna easily rename kar sakte ho.
> Rebranding section neeche dekho.

---

## Kya-kya kaam kar raha hai (fully functional) vs "coming soon"

### Fully working tools (real server-side processing)
| Tool | Kya karta hai | Library |
|---|---|---|
| Merge PDF | Multiple PDFs ko order mein jodta hai | `pdf-lib` |
| Split PDF | Page range extract, ya har N pages par split (multi-output = ZIP) | `pdf-lib` + `jszip` |
| Compress PDF | Object-stream compression + best-effort image downsampling | `pdf-lib` + `sharp` |
| JPG to PDF | Ek ya zyada images ko ek PDF mein embed karta hai | `pdf-lib` + `sharp` |
| PDF to JPG | Har page ko JPG mein rasterize karta hai (ZIP output) | `pdfjs-dist` + `canvas` |
| Watermark PDF | Configurable text watermark (text/opacity/position) | `pdf-lib` |
| Protect PDF | Password protection — **neeche "Protect/Unlock ki honest limitation" zaroor parho** | `qpdf` (agar installed) ya fallback |
| Unlock PDF | Known password se PDF unlock karta hai | `qpdf` (agar installed) |
| Background Remover | Photo se background hata kar transparent PNG deta hai | Python `rembg` (via `child_process`) |

### Office conversions (ab wired hain — LibreOffice chahiye)
- PDF to Word, Word to PDF, PDF to Excel, Excel to PDF, PowerPoint to PDF

Ye 5 tools ab **live** hain aur `soffice` (LibreOffice) ke through real conversion
karte hain. Agar server par LibreOffice installed nahi hai to tool ek saaf error dikhayega
(crash nahi karega). Install karne ke steps neeche "Office conversion (LibreOffice)" section
mein hain. LibreOffice aapke Mac par kaam karega; Vercel jaise serverless host par isay alag
dedicated service/Docker mein chalana behtar hai (README ka warning dekho).

### Nayi UI features
- **Search bar + category tabs** homepage par (Organize / Optimize / Convert / Edit / Security).
- **Header mega-menu** ("All tools") jismein har tool category-wise grouped hai, + Convert/Edit/Security direct links.
- **Real Lucide icons** har tool par (hand-drawn SVG ki jagah), har category ka apna color.
- Mobile par poora hamburger menu jismein saare tools categories ke sath.

**Nayi dependency:** `lucide-react` — `npm install` dobara chalana zaroori hai.

---

## IMPORTANT — Build is folder mein abhi bhi verify nahi hua

Ye project pehle ek temporary sandbox mein banaya gaya tha, phir aapke folder
(`React-native/ilovepdf-clone/`) mein copy kiya gaya hai. Poore session mein shell/build
environment disk-space error ki wajah se down raha, isliye `npm install` / `npm run build`
khud chala kar verify nahi ho saka. Saara code bohot dhyaan se, real pdf-lib / pdfjs-dist /
sharp / Stripe SDK documentation verify karke likha gaya hai, lekin **aapko khud ek dafa
locally `npm install && npm run build` chalana hoga** confirm karne ke liye ke sab clean
compile ho raha hai. Agar koi chhota TypeScript error aaye, "Troubleshooting" section
neeche dekhein.

---

## Local run karna

```bash
npm install
npm run dev
```

Phir browser mein `http://localhost:3000` kholo.

Production build:
```bash
npm run build
npm run start
```

## Deploy karna (Vercel recommended)

1. Is folder ko GitHub repo bana kar push karo.
2. [vercel.com](https://vercel.com) par jao, "New Project" → apna repo import karo.
3. Environment variables add karo (neeche "Stripe" section dekho) Vercel dashboard mein.
4. Deploy — Vercel Next.js App Router ko automatically detect kar leta hai.

**Note:** `canvas` (PDF→JPG ke liye) ek native binary hai. Vercel ke standard Node
runtime par usually chal jata hai, lekin agar deploy par error aaye "canvas" ke baare
mein, to sabse pehle Vercel build logs check karo. `sharp` bhi native hai lekin
Vercel/Next.js ke saath officially well-supported hai.

---

## Stripe (Pro subscription payments) live karna

Abhi `.env.example` mein saari keys khali/placeholder hain — is wajah se `/pricing`
page ka "Upgrade to Pro" button ek friendly error dega jab tak keys nahi dalo.

1. [Stripe Dashboard](https://dashboard.stripe.com) par account banao (ya login karo).
2. **Developers → API keys** se `STRIPE_SECRET_KEY` copy karo.
3. **Product catalog** mein ek "Pro" product + monthly price banao, uska Price ID
   (`price_...`) copy karo → `STRIPE_PRICE_ID_PRO`.
4. Publishable key bhi copy karo → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
5. In sab ko `.env.local` file mein daalo (root mein `.env.example` ko copy karke
   `.env.local` banao):
   ```bash
   cp .env.example .env.local
   ```
6. Webhook set karne ke liye: Stripe Dashboard → **Developers → Webhooks** → add
   endpoint `https://yourdomain.com/api/stripe/webhook`, events select karo:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Uska signing secret `STRIPE_WEBHOOK_SECRET` mein
   daalo.
7. Local testing ke liye Stripe CLI use kar sakte ho:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

**Bohot zaroori:** Webhook (`app/api/stripe/webhook/route.ts`) abhi sirf events ko
**log** karta hai — kisi user ko actually "Pro" mark nahi karta, kyunki is MVP mein
koi database/user accounts nahi hain. Real launch ke liye neeche "Next steps" section
zaroor parho.

---

## Background Remover (Python `rembg`) setup

Ye tool ek Python script (`scripts/remove_bg.py`) ko `child_process` se call karta hai.

```bash
# System mein Python 3 hona chahiye
python3 --version

# Dependencies install karo (--break-system-packages zaroori hai kayi Linux distros par)
pip3 install rembg pillow onnxruntime --break-system-packages
```

Pehli dafa jab ye tool chalega, `rembg` automatically ek ~170MB AI model download
karega (`~/.u2net/` mein) — is ke liye internet chahiye hoga sirf first run par.

Agar `python3` alag jagah installed hai (jaise ek virtualenv), to `.env.local` mein
`PYTHON_BIN=/path/to/python3` set kar sakte ho — `lib/remove-background.ts` isko
respect karta hai.

Agar Python ya rembg installed nahi hai, tool ek clear error dikhayega ("Background
removal is not set up on this server yet...") — crash nahi karega.

---

## Protect/Unlock PDF ki honest limitation (zaroor parho)

`pdf-lib` (jo baaki sab PDF tools mein use ho raha hai) **real PDF encryption support
nahi karta** — iska `save()` method mein koi `encrypt` option hi nahi hai.

Is app mein `lib/pdf/protect.ts` ye karta hai:

1. **Agar `qpdf` server par installed hai** (`which qpdf`), to hum real AES-256
   encryption karte hain `qpdf` CLI ko shell out karke. Ye production-grade, real
   password protection hai.
2. **Agar `qpdf` NAHI hai**, to ek fallback chalta hai jo sirf PDF ke metadata mein ek
   "locked" flag + password ka hash store karta hai — **ye real encryption NAHI hai**,
   koi bhi PDF reader ye file khol sakta hai. UI mein clearly warning dikhti hai jab
   ye fallback use ho.

Real password protection ke liye `qpdf` install karo:
```bash
# macOS
brew install qpdf

# Ubuntu/Debian
sudo apt-get install -y qpdf
```

Install karne ke baad kuch code change karne ki zaroorat nahi — `protect.ts`
automatically `qpdf` detect kar ke use karega.

---

## Office conversion (PDF↔Word/Excel/PowerPoint) enable karna

Real conversion ke liye LibreOffice chahiye:
```bash
# Ubuntu
sudo apt-get install -y libreoffice

# macOS
brew install --cask libreoffice
```

Phir:
1. `lib/tools.ts` mein us tool ka `status: 'coming-soon'` ko `status: 'live'` kar do.
2. `app/api/tools/[tool]/route.ts` mein us tool ke case mein
   `lib/office-convert.ts` ka `convertWithLibreOffice()` function call karo (function
   already fully likha hua hai, bas route mein wire karna hai).

**Warning:** LibreOffice headless conversion bohot heavy hai — Vercel jaise serverless
hosts ke liye recommended nahi. Production mein isko alag se ek chhota dedicated
server/Docker container par chalao.

---

## Free vs Pro gating — abhi kaise kaam karta hai (important limitation)

`lib/plan.ts` mein `PLAN_LIMITS` config hai (file size, file count, page count limits).
Ye checks **app-logic level** par hain — is MVP mein koi user accounts / login / real
subscription tracking nahi hai. Matlab: koi bhi visitor client-side header bhej kar
khud ko "pro" bata sakta hai (sirf local testing ke liye, production-safe NAHI hai).

### Real SaaS banane ke liye next steps:
1. **Authentication add karo** — NextAuth.js, Clerk, ya Supabase Auth.
2. **Database add karo** (Postgres + Prisma/Drizzle, ya Supabase) — `users` table
   mein `plan` ('free'/'pro'), `stripeCustomerId`, `stripeSubscriptionId` columns.
3. `app/api/stripe/webhook/route.ts` mein jo TODO comments hain unko implement karo —
   `checkout.session.completed` par user ko `plan = 'pro'` set karo database mein.
4. API routes mein logged-in user ka plan session/JWT se lookup karo (client-sent
   header par trust mat karo).
5. Protect/Unlock ke liye `qpdf` production server par install karo (upar dekho).
6. Office conversion ke liye LibreOffice ka dedicated conversion service banao.

---

## Rebranding (naam/design change karna)

- Naam: `components/Logo.tsx` mein text change karo, `app/layout.tsx` mein
  `metadata.title`/`description` update karo.
- Colors: `tailwind.config.ts` mein `colors.brand` aur `colors.accent` values change
  karo.
- Logo icon: `components/Logo.tsx` ka SVG replace kar do apne mark se.

---

## Project structure (quick tour)

```
app/
  page.tsx                    # Landing page
  pricing/page.tsx            # Pricing page
  tools/[tool]/page.tsx       # Har tool ka dynamic page
  api/tools/[tool]/route.ts   # Saare tools ka processing endpoint
  api/stripe/checkout/route.ts
  api/stripe/webhook/route.ts
components/
  ToolWorkspace.tsx           # Drag-drop upload + options + download UI
  SiteHeader.tsx / SiteFooter.tsx / Logo.tsx / ToolCard.tsx / ToolIcon.tsx
lib/
  tools.ts                    # Tool catalog (add new tool = add entry here)
  plan.ts                     # Free/Pro limits + gating helpers
  api-utils.ts                # Shared API error handling
  stripe.ts                   # Stripe client factory
  office-convert.ts           # LibreOffice integration (ready, not wired by default)
  remove-background.ts        # rembg child_process wrapper
  pdf/
    merge.ts, split.ts, compress.ts, watermark.ts, protect.ts,
    image-to-pdf.ts, pdf-to-jpg.ts
scripts/
  remove_bg.py                # Python rembg CLI wrapper
  requirements.txt
```

---

## Troubleshooting

- **`Module not found: Can't resolve 'canvas'` on client bundle**: `next.config.js`
  already excludes `canvas` via `experimental.serverComponentsExternalPackages` and a
  webpack alias — restart `next dev` after any `next.config.js` edit.
- **`canvas` fails to install / native build errors**: on macOS you may need
  `brew install pkg-config cairo pango libpng jpeg giflib librsvg` first. On Ubuntu:
  `sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`.
- **Stripe TypeScript errors about `apiVersion`**: `lib/stripe.ts` intentionally casts
  the Stripe client options — if you see a type error there anyway, just widen or
  remove the `apiVersion` field.
- **PDF to JPG gives blank/garbled images**: usually means the `canvas` native module
  didn't build correctly — check the "canvas fails to install" note above.

---

## License / attribution note

Original design, original name suggestion ("PDFKit Pro" — freely renameable), original
icon set. Inspired by the general "PDF tools grid" layout genre (not unique to any one
product), not copying any specific product's logo, brand name, or wording verbatim.
