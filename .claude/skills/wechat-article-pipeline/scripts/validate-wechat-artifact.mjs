#!/usr/bin/env node
import fs from 'node:fs';
const args=process.argv.slice(2); const val=(n)=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const article=val('--article'), html=val('--html'), first=val('--first'), last=val('--last'), json=args.includes('--json');
if(!article||!html){console.error('Usage: node validate-wechat-artifact.mjs --article <md> --html <html> [--first text] [--last text] [--json]');process.exit(2);}
const md=fs.readFileSync(article,'utf8'), page=fs.readFileSync(html,'utf8');
const forbidden=[/资料来源/i,/原文链接/i,/抓取时间/i,/浏览器异常/i,/保存草稿/i,/关注公众号/i,/点赞转发/i,/投稿邮箱/i,/data:image/i,/file:/i];
const hits=forbidden.flatMap(r=>{const m=page.match(r);return m?[m[0]]:[]});
const blocks=(page.match(/<(p|h1|h2|h3|blockquote|table)\b/gi)||[]).length;
const images=(page.match(/<img\b/gi)||[]).length;
const localPathHits=(page.match(/(?:file:|data:image|[A-Za-z]:\\)/gi)||[]).length;
const result={articleCharacters:md.replace(/[#*_>`]/g,'').length, htmlCharacters:page.replace(/<[^>]+>/g,'').length, blocks, images, firstPresent:first?md.includes(first):null, lastPresent:last?md.includes(last):null, forbiddenHits:hits, localPathHits, valid:hits.length===0&&localPathHits===0&&blocks>0&&(!first||md.includes(first))&&(!last||md.includes(last))};
console.log(json?JSON.stringify(result,null,2):`articleCharacters=${result.articleCharacters}\nhtmlCharacters=${result.htmlCharacters}\nblocks=${blocks}\nimages=${images}\nforbiddenHits=${hits.join(',')||'none'}\nvalid=${result.valid}`); process.exit(result.valid?0:1);
