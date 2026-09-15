#!/usr/bin/env node
import fs from 'node:fs';

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const input = val('--input'), output = val('--output'), anchorsFile = val('--anchors');
if (!input || !output) { console.error('Usage: node build-static-motion.mjs --input <html> --output <html>'); process.exit(2); }
let html = fs.readFileSync(input, 'utf8');
const defaults = [
  ['说到内容，', '内容飞轮'],
  ['但内容能不能被看见', '内容怎么被看见'],
  ['还有一个更反直觉的判断', '别急着找饥饿市场'],
  ['产品从哪来？', '把自己当成客户'],
  ['变现路径也没有那么多花样', '三条变现路径']
];
let anchors = defaults;
if (anchorsFile) {
  const parsed = JSON.parse(fs.readFileSync(anchorsFile, 'utf8'));
  if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item.needle !== 'string' || typeof item.label !== 'string')) {
    throw new Error('--anchors must be a JSON array of {"needle":"...","label":"..."}');
  }
  anchors = parsed.map(({ needle, label }) => [needle, label]);
}
let index = 0;
for (const [needle, label] of anchors) {
  const escaped = needle.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  const before = html;
  // The article already owns its h2 chapter heading. Count the anchor for QA,
  // but do not inject a second visual title/number block into the editor.
  if (new RegExp(escaped).test(html)) index++;
}
fs.writeFileSync(output, html, 'utf8');
console.log(JSON.stringify({theme:'static-motion', chapters:index, output}));
