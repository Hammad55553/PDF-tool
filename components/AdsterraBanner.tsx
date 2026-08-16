'use client';

import { useEffect, useRef } from 'react';

/**
 * Renders a single Adsterra BANNER ad inside an isolated <iframe>.
 *
 * Why an iframe: Adsterra's banner snippet sets a GLOBAL `atOptions` object and
 * then loads invoke.js, which reads that global. If you drop two banners on the
 * same page directly, the second overwrites the first's options. Sandboxing
 * each unit in its own iframe document gives every banner its own clean global,
 * so multiple banners work and Adsterra's script can't touch our main page.
 *
 * We only use the clean banner format here — NO popunder / social-bar / push,
 * because those hurt UX and SEO.
 *
 * key   = your Adsterra ad-unit key (from the banner unit's code)
 * width/height = the size you picked when creating the unit (e.g. 728x90, 300x250)
 */
export default function AdsterraBanner({
  adKey,
  width,
  height,
}: {
  adKey: string;
  width: number;
  height: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Minimal HTML document that runs exactly Adsterra's banner snippet.
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}</style></head><body>
<script type="text/javascript">
  atOptions = {
    'key' : '${adKey}',
    'format' : 'iframe',
    'height' : ${height},
    'width' : ${width},
    'params' : {}
  };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/${adKey}/invoke.js"></script>
</body></html>`);
    doc.close();
  }, [adKey, width, height]);

  return (
    <iframe
      ref={iframeRef}
      title="Advertisement"
      width={width}
      height={height}
      scrolling="no"
      frameBorder={0}
      style={{ border: 0, display: 'block', margin: '0 auto', maxWidth: '100%' }}
    />
  );
}
