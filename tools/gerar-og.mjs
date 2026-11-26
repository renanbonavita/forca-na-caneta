// Gera og-image.png (1200×630), a prévia do link no WhatsApp/Instagram: node tools/gerar-og.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const raiz = new URL('..', import.meta.url).pathname;
const logo = readFileSync(raiz + 'icons/logo.svg', 'utf8').replace('<svg ', '<svg width="260" height="260" ');
const html = `<body style="margin:0;width:1200px;height:630px;background:#FFFBF8;display:flex;align-items:center;gap:64px;padding:0 96px;box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#2A1A14">
${logo}<div><div style="font-size:76px;font-weight:800;line-height:1.05">Dose de Força</div>
<div style="font-size:40px;margin-top:20px;color:#6B5850">Treino de força de 5 min em casa.<br>Cadeira, toalha e bora.</div>
<div style="margin-top:32px;display:inline-block;background:#FF6B4A;border:3px solid #B23A1C;border-radius:20px;padding:14px 28px;font-size:34px;font-weight:800">Grátis · sem cadastro</div></div></body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.screenshot({ path: raiz + 'og-image.png' });
await b.close();
console.log('og-image.png gerado');
