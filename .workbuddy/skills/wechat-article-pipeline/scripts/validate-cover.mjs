#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const args = process.argv.slice(2);
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const file = value('--file');
const against = args.flatMap((_, i) => args[i] === '--against' ? [args[i + 1]] : []).filter(Boolean);
const json = args.includes('--json');
if (!file) { console.error('Usage: node validate-cover.mjs --file <path> [--against <path>] [--json]'); process.exit(2); }
const result = { file: path.resolve(file), exists: fs.existsSync(file), bytes: 0, sha256: null, width: null, height: null, duplicateOf: [], visualReviewRequired: false, valid: false };
if (result.exists) {
  const buf = fs.readFileSync(file); result.bytes = buf.length; result.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  if (buf.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { result.width = buf.readUInt32BE(16); result.height = buf.readUInt32BE(20); }
  else if (buf.subarray(0, 2).equals(Buffer.from([0xff,0xd8])) ) { let p=2; while(p+9<buf.length){ if(buf[p]!==0xff){p++;continue;} const marker=buf[p+1], len=buf.readUInt16BE(p+2); if(marker>=0xc0&&marker<=0xc3){result.height=buf.readUInt16BE(p+5);result.width=buf.readUInt16BE(p+7);break;} p+=2+len; } }
  for (const candidate of against) if (fs.existsSync(candidate)) { const h=crypto.createHash('sha256').update(fs.readFileSync(candidate)).digest('hex'); if(h===result.sha256) result.duplicateOf.push(path.resolve(candidate)); }
  result.valid = result.bytes > 0 && Number.isInteger(result.width) && result.width > 0 && Number.isInteger(result.height) && result.height > 0 && result.duplicateOf.length === 0;
  result.visualReviewRequired = result.valid && against.length > 0;
}
console.log(json ? JSON.stringify(result, null, 2) : `file=${result.file}\nexists=${result.exists}\nbytes=${result.bytes}\nsha256=${result.sha256 || ''}\ndimensions=${result.width || '?'}x${result.height || '?'}\nduplicateOf=${result.duplicateOf.join(',') || 'none'}\nvisualReviewRequired=${result.visualReviewRequired}\nvalid=${result.valid}`);
process.exit(result.valid ? 0 : 1);
