# wechat-article-pipeline

把「给几个链接 → 一篇可以直接发在公众号里的文章」这件事，做成一条**有状态、可恢复、有质量门**的流水线。

它是一个 Agent Skill（技能），跑在 **Codex / Claude Code / WorkBuddy** 三个运行时上，逻辑完全一致，差异只在能力怎么拿到。

> 仓库地址：<https://github.com/iamafeng/wechat-article-pipeline>

## 它做什么

四个阶段，每阶段结束有一道质量门，过了才往下走，没过就停在原地，不会带着半成品硬冲：

| 阶段 | 做什么 | 关键产物 |
| --- | --- | --- |
| 一、读取与解析 | 逐个读 URL，公开页直接抓，公众号/登录页走浏览器自动化 | `source-brief.md` |
| 二、原创写作 | 交给**你指定的写作技能**重写，跑它自带的质检 | `article.md`、`writing-qa.md` |
| 三、排版与配图 | 生成公众号安全的内联样式 HTML + 真实封面 | `article-wechat.html`、`PROMPTS.md` |
| 四、保存草稿 | 用已登录浏览器写进公众号草稿箱 | `workflow-state.json` |

全过程用 `workflow-state.json` 记状态，中断后从**上一个已验证阶段**续跑，不用重头再来。

### 几条写死的红线

- **只存草稿，绝不群发**。不碰发表、定时发表、转载授权、广告投放。
- **不编造**作者的经历、测试结果、对话、花费、情绪。缺就标「待补充」。
- **不用占位图冒充完成**。图片没生成或没过校验，配图阶段就标记 `blocked`。
- **内部证据链与公开成稿分离**。来源、抓取方法、质检记录留在任务产物里，不写进正文。

## 安装

仓库里已经内置了三套**标准原生目录**，clone 下来在你常用的那个运行时里打开项目即可直接用：

```
.codex/skills/       ← Codex
.claude/skills/      ← Claude Code
.workbuddy/skills/   ← WorkBuddy
```

想装成**用户级**（所有项目可用）就把它复制到对应位置：

| 运行时 | 用户级路径 |
| --- | --- |
| Codex | `~/.codex/skills/` |
| Claude Code | `~/.claude/skills/` |
| WorkBuddy | `~/.workbuddy/skills/` |

```bash
git clone https://github.com/iamafeng/wechat-article-pipeline.git
cd wechat-article-pipeline
# 例：装到 WorkBuddy 用户级
cp -r .workbuddy/skills/* ~/.workbuddy/skills/
```

## 用法

把链接丢给它就行：

```
用这几个链接写一篇公众号文章：<URL1> <URL2>
终点是存草稿
```

常用参数：

- `writing_skill` 指定写作技能名（可插拔，见下）
- `output_dir` 输出目录，**已预设**为 `公众号草稿/<日期>-<slug>/`
- 终点：`素材` / `成稿` / `排版` / `草稿`

### 草稿落在哪

默认输出到**项目根目录下已预设的** `公众号草稿/<YYYY-MM-DD>-<slug>/`，产物直接落在仓库内。该目录已在 `.gitignore` 中，草稿只留在本地、不会随仓库推送。想换位置就传 `output_dir`。

## 写作风格：内置两个，可继续加

流水线不绑定单一文风，通过 `writing_skill: <技能名>` 指定（Codex 下用 `$<技能名>`，Claude Code / WorkBuddy 下加载同名技能）。**仓库已内置两个风格，clone 下来就能写**：

| 技能名 | 定位 | 适用 | 许可 |
| --- | --- | --- | --- |
| `khazix-writer` | 人格化。数字生命卡兹克的公众号长文口吻 | 想要鲜明个人风格、偏 AI/科技叙事的长文 | MIT，版权归数字生命卡兹克，LICENSE 原件在其目录内 |
| `writing-style-plain` | 中性。干净直白、去 AI 腔，不带人格面具 | 技术解读、产品说明、行业观察；或「不想像某个具体的人」 | MIT（本仓库自研） |

未指定时按此顺序选：`khazix-writer` → `writing-style-plain`。
想要中性文风就显式写 `writing_skill: writing-style-plain`。

### 再加一个风格

风格技能必须**与流水线并列**放在同一个 skills 根目录下 —— Agent Skills 的发现规则是
`<skills 根>/<技能名>/SKILL.md`，塞进流水线子目录里不会被任何运行时发现。

1. 在 skills 根目录下建目录，目录名即技能名（建议 `writing-style-<标识>` 便于识别）。
2. 目录内放 `SKILL.md`，frontmatter 带 `name` 与 `description`（description 写清触发词）。
3. 若引用外部作品，**必须**在目录内附对方的 LICENSE 原件。
4. 在 `wechat-article-pipeline/references/writing-styles.md` 的表格里登记一行。
5. 三套平台目录各放一份，保持一致。

风格技能应提供：语言规则、结构要求、事实与诚实规则、如何消费「写作交接块」、自带质检清单。
流水线成稿后会执行写作技能自带的质检，没有质检章节的风格会让这一环落空。

## 配置

### 生图后端（可选）

| 运行时 | 默认 | 外部后端 |
| --- | --- | --- |
| WorkBuddy | 内置 ImageGen（腾讯混元，免费按积分、无需 Key） | Agnes（需用户明确选择） |
| Codex / Claude Code | 无内置，走 Agnes 外部后端 | `scripts/generate-image-agnes.mjs` |

Agnes 后端读系统环境变量，**不硬编码任何密钥**：

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `AGNES_API_KEY` | 是 | 缺失则配图阶段标记 `blocked` |
| `AGNES_BASE_URL` | 否 | 默认 `https://apihub.agnes-ai.com/v1`（注意是 apihub，不是 api） |
| `AGNES_MODEL` | 否 | 默认 `agnes-image-2.0-flash` |

**切换门禁**：WorkBuddy 下从内置切到 Agnes 必须同时满足「用户当次明确选择」+「环境变量存在」，绝不静默走外部计费路径。

### 浏览器自动化

存草稿和读受登录保护的公众号内容都需要它，按运行时自动选用：

- Codex → CDP / chrome-devtools MCP
- Claude Code → Playwright MCP / chrome-devtools MCP
- WorkBuddy → agent-browser

遇到二维码、登录失效、验证码、风控会**停下交回你处理**，不尝试绕过。

## 依赖

- **Node 18+**（`scripts/` 下是纯 Node 脚本，无第三方依赖）
- **一个写作风格技能**：已内置 `khazix-writer` 与 `writing-style-plain`，无需额外安装
- 保存草稿需要**已登录的公众号后台浏览器会话**

## 目录结构

```
wechat-article-pipeline/
├─ README.md
├─ LICENSE
├─ THIRD-PARTY-NOTICES.md   ← 第三方组件署名与许可
├─ .gitignore
├─ 公众号草稿/              ← 草稿产物（已预设，不推送）
├─ .codex/skills/           ← Codex
│  ├─ wechat-article-pipeline/   ← 流水线本体
│  ├─ khazix-writer/             ← 风格 A（MIT，第三方）
│  └─ writing-style-plain/       ← 风格 B（自研）
├─ .claude/skills/          ← Claude Code（同构）
└─ .workbuddy/skills/       ← WorkBuddy（同构）
```

流水线目录内含 `SKILL.md`、`agents/`（Codex 运行时定义）、`references/`（质量门、产物契约、排版规范、浏览器规则、运行时兼容、**写作风格注册表**）、`scripts/`（封面校验、外部生图、静态动感排版）。

## License

MIT，见 [LICENSE](LICENSE)。

> 第三方组件的许可与署名见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
