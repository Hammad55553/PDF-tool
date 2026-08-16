import { ImageResponse } from 'next/og';

// Dynamically generated social-share image (1200x630) used as the default
// Open Graph / Twitter card. Next.js renders this JSX to a PNG at build/request
// time via next/og — no static asset or extra package needed.
export const runtime = 'edge';
export const alt = 'PDForo — Free Online PDF Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4F63F7 0%, #0FB8AB 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>PDForo</div>
        <div style={{ marginTop: 12, fontSize: 40, fontWeight: 600, opacity: 0.95 }}>
          Free Online PDF Tools
        </div>
        <div style={{ marginTop: 24, fontSize: 28, opacity: 0.85, maxWidth: 900, textAlign: 'center' }}>
          Merge · Split · Compress · Convert · Watermark · Protect
        </div>
      </div>
    ),
    { ...size },
  );
}
