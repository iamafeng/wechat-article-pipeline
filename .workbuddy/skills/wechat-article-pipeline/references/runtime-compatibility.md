# 运行时兼容说明（Codex / Claude Code / WorkBuddy）

本流水线是运行时无关的：核心逻辑只用普通文件与 Node 脚本，不依赖任何单一平台的私有 API。三平台的差异只在「能力怎么拿到」，不在流程本身。

## 技能位置

| 运行时 | 项目级（推荐，clone 即用） | 用户级 |
| --- | --- | --- |
| Codex | 由根目录 `AGENTS.md` 指向共享目录 `skills/` | `~/.codex/skills/` |
| Claude Code | 由根目录 `CLAUDE.md` 指向共享目录 `skills/` | `~/.claude/skills/` |
| WorkBuddy | `.workbuddy/skills/` | `~/.workbuddy/skills/` |

Codex 与 Claude Code **共用同一份** `skills/`，不重复维护；两者分别通过 `AGENTS.md` 与 `CLAUDE.md` 获知技能位置与调用方式。

## 能力映射

| 能力 | Codex | Claude Code | WorkBuddy |
| --- | --- | --- | --- |
| 调用写作技能 | `$khazix-writer` | 加载 khazix-writer 技能 | 加载项目技能 khazix-writer |
| 浏览器自动化 | CDP / chrome-devtools MCP | Playwright MCP 或 chrome-devtools MCP | agent-browser skill |
| 内置生图 | 无 | 无 | 内置 ImageGen（腾讯混元） |
| 外部生图后端 | `scripts/generate-image-agnes.mjs` | 同左 | 同左（需用户明确选择） |
| 运行时定义 | `agents/openai.yaml` | 不需要 | 不需要 |

## 生图后端降级顺序

1. **运行时内置生图**（仅 WorkBuddy 有）：ImageGen／腾讯混元，免费、按积分、无需 Key。默认使用。
2. **外部 OpenAI 兼容后端**：`scripts/generate-image-agnes.mjs`。读环境变量：
   - `AGNES_API_KEY`（必填，缺失则标记 blocked）
   - `AGNES_BASE_URL`（可选，未设置时用默认网关 `https://apihub.agnes-ai.com/v1`，注意是 apihub 不是 api）
   - `AGNES_MODEL`（可选，默认 `agnes-image-2.0-flash`）
   
   Codex 与 Claude Code 无内置生图，这条即默认外部后端。
3. **都不可用**：保留文章与 PROMPTS.md，配图阶段标记 `blocked`。不得用空白图、灰色占位框或来源图片冒充完成。

**切换门禁**：WorkBuddy 下从内置切到 Agnes 必须同时满足 (a) 用户当次明确选择；(b) `AGNES_API_KEY` 存在。绝不静默走外部计费路径。

## 浏览器自动化差异

三者的操作对象一致（已登录的微信后台会话），只是驱动方式不同：

- **Codex** → CDP 或 chrome-devtools MCP
- **Claude Code** → Playwright MCP 或 chrome-devtools MCP
- **WorkBuddy** → agent-browser skill

无论哪种，遇到二维码、登录失效、验证码、风控或账号选择时都要**停下并交回用户处理**，不得尝试绕过验证。公众号后台 UI 会变，先读当前 DOM、可见文本与可访问名称再定位元素，不要依赖永久 CSS 选择器。

## 环境变量速查

| 变量 | 必需性 | 说明 |
| --- | --- | --- |
| `AGNES_API_KEY` | 使用 Agnes 后端时必填 | 从系统/用户环境变量读取，不硬编码进任何文件 |
| `AGNES_BASE_URL` | 可选 | 默认 `https://apihub.agnes-ai.com/v1` |
| `AGNES_MODEL` | 可选 | 默认 `agnes-image-2.0-flash` |

## 脚本

`scripts/*.mjs` 为纯 Node 脚本（Node 18+），三平台通用，无平台专属依赖：

- `validate-cover.mjs` 校验封面身份（尺寸、SHA-256、去重）
- `generate-image-agnes.mjs` 外部生图后端
- `build-static-motion.mjs` 静态动感排版

解析自身目录统一使用 `fileURLToPath(import.meta.url)`，避免中文路径被编码导致写文件失败。
