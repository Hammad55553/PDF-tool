# PDForo — Setup checklist for remaining tools

Ye file un cheezon ki list hai jo **aapko** apne end se karni hain taake baaki
tools live ho jayein. Har tool ke aage likha hai: kya chahiye, free/paid, aur
`.env.local` mein kaunsi key daalni hai.

Jaise-jaise main tools ka code wire karta jaunga, ye file update hoti rahegi.

---

## ✅ Already installed / done by you
- Node + npm (site chal rahi hai)
- Python + rembg (Background Remover) — `pip install rembg pillow onnxruntime`
- Supabase project (auth + plan DB)
- Stripe test keys + Pro price ID
- AdSense publisher ID (approval pending)
- Google Student domain: pdforo.app

---

## 🔧 Tools that need something from YOU

### 1. Office conversions (PDF↔Word/Excel/PowerPoint)  — ALREADY WIRED
- **Needs:** LibreOffice installed on the machine running the site.
- **Do:** `brew install --cask libreoffice`  (macOS)
- **Verify:** `soffice --version`
- No key needed. Once installed, these tools work.

### 2. Real PDF encryption (Protect / Unlock)  — ALREADY WIRED
- **Needs:** `qpdf` for real AES-256 (otherwise metadata-only fallback).
- **Do:** `brew install qpdf`
- No key needed.

### 3. HTML to PDF
- **Needs:** a headless browser (Playwright) to render the page.
- **Do:** `npm i playwright` then `npx playwright install chromium`
- No key needed. (Heavy on serverless — best on a normal server.)

### 4. OCR PDF (make scans searchable)
- **Needs:** `ocrmypdf` (uses Tesseract).
- **Do:** `brew install ocrmypdf`  (installs Tesseract too)
- **Verify:** `ocrmypdf --version`
- No key needed.

### 5. PDF to Markdown  /  PDF to Text
- **Needs:** nothing extra — done in pure Node (pdfjs-dist, already installed).
- No action from you.

### 6. PDF to PDF/A
- **Needs:** LibreOffice (same as #1) OR Ghostscript.
- **Do:** already covered if you did #1. (Optional: `brew install ghostscript`.)

### 7. Repair PDF
- **Needs:** `qpdf` (same as #2) — qpdf can rebuild broken PDFs.
- **Do:** already covered if you did #2.

### 8. AI tools — Summarizer, Translate  (and future ATS checker)
- **Needs:** an AI API key. Cheapest good options:
  - OpenAI: https://platform.openai.com/api-keys  → `OPENAI_API_KEY`
  - or Google Gemini (has a free tier): https://aistudio.google.com/apikey → `GEMINI_API_KEY`
- **Do:** create a key, paste into `.env.local`:
  ```
  OPENAI_API_KEY=
  # or
  GEMINI_API_KEY=
  ```
- Paid per use (very cheap for text). Free tier available on Gemini.

### 9. Watermark Remover (image) + Upscale + Blur Face  (AI)
- **Needs:** an image-AI provider. Easiest = Replicate (pay per run):
  https://replicate.com/account/api-tokens → `REPLICATE_API_TOKEN`
- **Do:** paste into `.env.local`:
  ```
  REPLICATE_API_TOKEN=
  ```
- Paid per image (cheap). Alternatively self-host a model (heavy).

### 10. Video tools (Watermark remove, Compress, Video→GIF, Trim)
- **Needs:** `ffmpeg` on the server.
- **Do:** `brew install ffmpeg`
- **Verify:** `ffmpeg -version`
- No key needed for compress/gif/trim. Video watermark removal needs an AI
  model (Replicate, same token as #9) — heavier.

### 11. Resume Suite
- **Templates:** nothing extra (React + PDF).
- **LaTeX editor (Overleaf-style):** needs a LaTeX compiler. Options:
  - server: `brew install --cask mactex-no-gui` (big), or
  - browser WASM compiler (SwiftLaTeX) — no install, added in code.
- **ATS checker:** uses the AI key from #8.

---

## 📋 One place to paste all keys (.env.local)
Add these lines to `.env.local` as you obtain them:

```
# AI (summarize, translate, ATS)
OPENAI_API_KEY=
GEMINI_API_KEY=

# Image/Video AI (watermark remover, upscale, blur face)
REPLICATE_API_TOKEN=
```

CLI installs (run once in Terminal):
```
brew install --cask libreoffice
brew install qpdf
brew install ocrmypdf
brew install ffmpeg
npx playwright install chromium   # after: npm i playwright
```
