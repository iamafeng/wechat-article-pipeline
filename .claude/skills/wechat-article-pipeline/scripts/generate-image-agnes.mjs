#!/usr/bin/env node
// generate-image-agnes.mjs
// WorkBuddy 公众号流水线 · 可选生图后端（Agnes）
//
// 仅当用户在当次任务中明确选择 Agnes 后端、且当前进程能读到 AGNES_API_KEY 时才调用。
// 调用 Agnes 的 OpenAI 兼容图像接口 (/v1/images/generations)，将图片写入任务目录 assets/。
//
// 用法：
//   node generate-image-agnes.mjs --prompt "..." --out "assets/cover.png" --size "1024x1024" [--model "..."] [--count 1]
//
// 环境变量（从系统/用户环境变量读取，不在脚本内硬编码）：
//   AGNES_API_KEY   必填，缺失则报错退出（退回内置 ImageGen）
//   AGNES_BASE_URL  可选；未设置时回退到下方 DEFAULT_AGNES_BASE_URL
//                   官方 API 网关：https://apihub.agnes-ai.com/v1
//                   ⚠️ 域名是 apihub.agnes-ai.com，不是 api.agnes-ai.com（后者连不上）
//                   生图模型默认 agnes-image-2.0-flash（也可用 agnes-image-2.1-flash）
//
// 输出：写入 --out 指定的文件，并打印 JSON 结果（path/bytes/width/height/model）。
//       失败一律非零退出，由上层流水线标记为 blocked，绝不用占位图冒充。

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// 目录解析必须用 fileURLToPath，避免中文路径被 %E5... 编码导致写文件失败。
const __dirname = dirname(fileURLToPath(import.meta.url));

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const prompt = arg('prompt');
const out = arg('out');
const size = arg('size') || '1024x1024';
const model = arg('model') || process.env.AGNES_MODEL || 'agnes-image-2.0-flash';
const count = parseInt(arg('count') || '1', 10);

if (!prompt || !out) {
  console.error('Usage: node generate-image-agnes.mjs --prompt "<prompt>" --out "<path.png>" --size "<WxH>" [--model "<model>"] [--count N]');
  process.exit(2);
}

const DEFAULT_AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';

const apiKey = process.env.AGNES_API_KEY;
// 未显式设置 AGNES_BASE_URL 时回退到官方默认网关；无需退出。
const baseUrl = process.env.AGNES_BASE_URL || DEFAULT_AGNES_BASE_URL;

if (!apiKey) {
  console.error('AGNES_API_KEY 未设置（需从系统/用户环境变量读取）。退回内置 ImageGen。');
  process.exit(3);
}

const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/generations`;

async function fetchImage(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text.slice(0, 500)}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return { kind: 'json', data: await res.json() };
  return { kind: 'binary', data: Buffer.from(await res.arrayBuffer()) };
}

function decodeBase64(b64) {
  return Buffer.from(b64, 'base64');
}

function getImageBytes(payload) {
  // OpenAI 兼容返回：{ data: [ { url } | { b64_json } ] }
  const arr = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('接口未返回图片数据');
  const first = arr[0];
  if (first.b64_json) return decodeBase64(first.b64_json);
  if (first.url) return null; // 远程 URL，需二次下载
  throw new Error('无法解析图片返回结构');
}

async function saveBuffer(buf, target) {
  const abs = resolve(__dirname, '..', target);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  return abs;
}

(async () => {
  try {
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      model,
      prompt,
      n: count,
      size,
      response_format: 'b64_json',
    });

    const { kind, data } = await fetchImage(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    let buf = null;
    if (kind === 'binary') {
      buf = data;
    } else {
      buf = getImageBytes(data);
      if (!buf) {
        // 返回的是远程 URL：尝试下载
        const url = (Array.isArray(data) ? data : data.data)[0].url;
        const dl = await fetchImage(url, {});
        buf = dl.kind === 'binary' ? dl.data : null;
      }
    }
    if (!buf) throw new Error('未能取得图片二进制数据');

    const abs = await saveBuffer(buf, out);
    const stat = await readFile(abs);
    // 用 magic number 推断尺寸（仅基础解码验证，不依赖外部库）
    let width = 0, height = 0;
    if (stat[0] === 0x89 && stat[1] === 0x50) {
      width = stat.readUInt32BE(16);
      height = stat.readUInt32BE(20);
    } else if (stat[0] === 0xff && stat[1] === 0xd8) {
      // JPEG：简单扫描 SOF 标记
      let i = 2;
      while (i < stat.length - 9) {
        if (stat[i] !== 0xff) { i++; continue; }
        const m = stat[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          height = stat.readUInt16BE(i + 5);
          width = stat.readUInt16BE(i + 7);
          break;
        }
        i += 2 + stat.readUInt16BE(i + 2);
      }
    }

    console.log(JSON.stringify({
      ok: true,
      path: abs,
      bytes: stat.length,
      width,
      height,
      model,
      backend: 'agnes',
    }));
  } catch (err) {
    console.error(`Agnes 生图失败：${err.message}`);
    process.exit(1);
  }
})();
