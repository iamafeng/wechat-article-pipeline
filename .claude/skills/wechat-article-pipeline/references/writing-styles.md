# 写作风格：放置方式与关联机制

## 一、机制：为什么是并列目录

Agent Skills 的发现规则是：

```
<skills 根>/<技能名>/SKILL.md
```

**目录名就是技能名**，由 SKILL.md 的 `name` 字段确认。因此：

- 风格技能**必须**与流水线并列放在同一个 skills 根目录下，**不能**塞进
  `wechat-article-pipeline/` 的子目录 —— 那样它不会被任何运行时发现，等于不存在。
- 一个风格 = 一个独立目录。想加几个风格就加几个目录。

仓库里的实际形态（三套平台目录同构）：

```
.codex/skills/            .claude/skills/           .workbuddy/skills/
├─ wechat-article-pipeline/   （流水线本体，唯一入口）
├─ khazix-writer/             （风格 A：人格化长文）
├─ writing-style-plain/       （风格 B：中性干净）
└─ writing-style-healing/     （风格 C：治愈系，需显式指定）
```

## 二、关联方式：参数 + 本文件

流水线不与任何风格硬编码耦合，通过两条线关联：

1. **显式指定**：输入参数 `writing_skill: <技能名>`。
   Codex 下写作 `$<技能名>`，Claude Code / WorkBuddy 下加载同名技能。
2. **未指定时的默认选择**：按下一节的顺序挑一个可用的。

**本文件是风格注册表**。Agent 无法"扫描目录发现风格"，所以新增风格后必须在这里登记，
否则流水线不知道它存在。

## 三、内置风格

| 技能名 | 定位 | 适用 | 许可 |
|---|---|---|---|
| `khazix-writer` | 人格化。数字生命卡兹克的公众号长文口吻，"有见识的普通人在认真聊一件打动他的事" | 想要鲜明个人风格、偏 AI/科技叙事的长文 | MIT（版权：数字生命卡兹克，见该目录 LICENSE） |
| `writing-style-plain` | 中性。干净直白，不带人格面具，去 AI 腔 | 技术解读、产品说明、行业观察；或"不想像某个具体的人"时 | 本仓库自研，MIT |
| `writing-style-healing` | 治愈系。温暖克制、不煽情不鸡汤，把"说不出口的小东西"准确写出，留余味 | 情绪类选题、人物故事、生活观察、品牌软文；或读者"想被理解一次"时 | 本仓库自研，MIT |

**默认顺序**：未指定 `writing_skill` 时，优先 `khazix-writer`；若环境中没有，退到
`writing-style-plain`；两个都没有才要求用户指定。`writing-style-healing` 不进默认自动选择，
**需显式写 `writing_skill: writing-style-healing`** —— 它只适合情绪/生活类选题，硬核、数据驱动、
争议性强或需要明确结论的题材用它反而会拧巴。

把 khazix-writer 放前面是因为它自带完整的四层自检和素材消费规则，长文质量更稳。
想要中性文风时显式写 `writing_skill: writing-style-plain`；想要治愈系时显式写
`writing_skill: writing-style-healing`，并尽量提供真实个人素材（治愈系一旦虚构，信任会崩塌）。

## 四、如何新增一个风格

1. 在 skills 根目录下建目录，名字即技能名（建议 `writing-style-<标识>` 便于识别）。
2. 目录内放 `SKILL.md`，frontmatter 至少包含 `name` 与 `description`（description 里写清
   触发词，让运行时能自动匹配）。
3. 若引用了外部作品，**必须**在该目录内附带对方的 LICENSE 原件。
4. **在本文件第三节的表格里加一行**，并说明何时该选它。
5. 三套平台目录（`.codex/`、`.claude/`、`.workbuddy/`）各放一份，保持一致。

一个风格技能应该提供：语言规则、结构要求、事实与诚实规则、如何消费流水线的交接块、
自带质检清单。流水线在成稿后会执行"写作技能自带的质检"，没有质检章节的风格会让这一环落空。

## 五、已验证可接入的外部风格（MIT）

这些未内置，需要时按第四节步骤自行接入：

| 项目 | 定位 | 许可 |
|---|---|---|
| `yaoleifly/wechat-writing-style` | 个人化公众号风格，出海/独立开发者视角 | MIT |
| `op7418/Humanizer-zh` | 不是写作风格，是后处理：识别 24 类 AI 痕迹并改写 | 需自行确认当前许可 |

接入第三方技能前先看一遍它的 SKILL.md —— 技能可以读写本地文件、执行脚本，
来源不明的不要装。
