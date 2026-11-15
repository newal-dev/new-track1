// Renders docs/team-testing-guide.html to docs/Team-Testing-Guide.pdf. Run: node tools/make-guide-pdf.mjs
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const html = pathToFileURL(path.resolve('docs/team-testing-guide.html')).href;
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(html);
await p.pdf({
  path: 'docs/Team-Testing-Guide.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: "<div style='font-size:8px;width:100%;text-align:center;color:#666'>Inclusive Access · team testing guide · page <span class='pageNumber'></span> of <span class='totalPages'></span></div>",
  margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' },
});
await b.close();
console.log('Wrote docs/Team-Testing-Guide.pdf');
