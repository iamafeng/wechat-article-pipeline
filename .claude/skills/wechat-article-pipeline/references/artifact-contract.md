# 任务产物约定

每次运行建立独立目录（默认；可通过输入参数 `output_dir` 覆盖）：

    finn/公众号草稿/<YYYY-MM-DD>-<slug>/
    ├── workflow-state.json
    ├── sources/
    │   ├── 01-<source>.md
    │   ├── 01-<source>.json
    │   └── ...
    ├── source-brief.md
    ├── writing-brief.md
    ├── article.md
    ├── writing-qa.md
    ├── article-wechat.html
    ├── layout-manifest.md
    ├── PROMPTS.md
    └── assets/
        ├── cover.*
        └── body-01.*

不要覆盖同名任务。目录已存在时使用 -v2、-v3。

## 来源 JSON

    {
      "url": "https://example.com/article",
      "final_url": "https://example.com/article",
      "title": "Article title",
      "author": "Author",
      "published_at": "2026-08-14T00:54:00+08:00",
      "retrieved_at": "2026-08-14T12:00:00+08:00",
      "method": "http|cdp|connector",
      "content_characters": 2427,
      "blocked": false,
      "status": "ok|partial|failed",
      "error": null
    }

对应 Markdown 保存清洗后的正文，并在顶部保留来源 URL 与抓取时间。

## 工作流状态

    {
      "version": 3,
      "target": "draft",
      "stage": "read|write|layout|publish|complete|blocked",
      "stages": {
        "read": "pending|complete|failed",
        "write": "pending|complete|failed",
        "layout": "pending|complete|failed",
        "publish": "pending|complete|failed"
      },
      "article_title": null,
      "source_count": 0,
      "successful_sources": 0,
      "body_characters": 0,
      "image_count": 0,
      "image_generation": {
        "required": true,
        "skipped_by_user": false,
        "capability": "unknown|built_in|cli_api|unavailable",
        "backend": "unknown|built_in|agnes",
        "method": null,
        "agnes_model": null,
        "status": "pending|complete|blocked|skipped",
        "planned_cover": 1,
        "planned_body_images": 0,
        "generated_cover": 0,
        "generated_body_images": 0,
        "validated_files": 0,
        "blocker": null
      },
      "cover_candidates": [
        {
          "path": null,
          "filename": null,
          "sha256": null,
          "bytes": 0,
          "width": 0,
          "height": 0,
          "state": "generated|validated|uploaded|applied|persisted|rejected",
          "visual_distinct_from": [],
          "evidence": null
        }
      ],
      "wechat_draft": {
        "author": "吖枫",
        "saved": false,
        "verified": false,
        "draft_id": null,
        "draft_url": null,
        "saved_at": null,
        "verified_at": null,
        "title_verified": false,
        "author_verified": false,
        "summary_verified": false,
        "body_verified": false,
        "body_verified_at": null,
        "body_images_uploaded": 0,
        "body_images_verified": false,
        "cover_uploaded": false,
        "cover_applied": false,
        "cover_persisted": false,
        "cover_verified": false,
        "browser_preflight": {
          "browser_connected": false,
          "logged_in": false,
          "account_name": null,
          "upload_permission": false,
          "cover_file_valid": false,
          "checked_at": null
        },
        "platform_status": "unknown|draft|published_by_user",
        "platform_status_reported_at": null
      },
      "blocker": null
    }

每完成一个阶段立即更新状态，保持 JSON 有效。失败时记录可操作的 blocker，不要删除已完成产物。

生图能力预检后立即更新 `image_generation.capability` 与 `image_generation.backend`（内置为 `built_in`，Agnes 后端为 `agnes`）。`image_count` 只统计任务目录中存在、可解码且像素尺寸有效的最终图片，不统计空白图、灰色占位框、HTML 容器、远程来源图或未通过质检的文件。内置能力不可用且用户未明确选择并已配置 Agnes 后端时，将状态设为 `blocked`；用户明确选择无图时才可设为 `skipped`。

`stages.publish` 为兼容现有产物保留，其含义仅为“保存公众号草稿阶段”，不代表正式发表。

`wechat_draft.author` 默认是「吖枫」，只有用户在当次任务中明确指定其他作者时才覆盖。来源文章作者不得自动写入该字段。

`wechat_draft.saved` 只表示后台出现了明确的保存成功状态。`verified` 只有在重新载入同一草稿后，标题、作者、摘要、正文结构与首尾锚点、正文图片和封面等必需分项全部通过时才能设为 true。作者不一致、正文扁平或末尾缺失、封面尚未完成时可以保留 `saved: true`，但整体 `verified` 必须为 false。

`browser_preflight` 在改写公众号公开字段前完成。上传权限失败时保留本地产物并设置可操作的 blocker，不创建新的半成品草稿。`draft_url` 保存后台编辑地址，用于浏览器断连后恢复同一草稿。

`platform_status` 记录平台后续状态：成功保存草稿后设为 `draft`；只有用户明确告知已经自行发表时才设为 `published_by_user` 并记录 `platform_status_reported_at`。该字段不得反向改变流水线的保存、验证和完成结果，也不得用于声称流水线执行了正式发表。

## 图片记录

PROMPTS.md 对每张最终图片记录：

- 用途与插入位置。
- 最终提示词。
- 本地绝对路径。
- 像素尺寸和文件大小。
- 生成方式与最终检查结果。
- 文件解码结果、像素尺寸验证和是否计入 image_count。

article-wechat.html 中的每个本地图片引用都必须能映射到一条最终图片记录。计划中的封面或正文图片只要有一张未生成或未通过验证，`image_generation.status` 就不能设为 `complete`。
## 排版记录

layout-manifest.md 至少记录：

- 主题名称、正文/标题字号、行高、强调色。
- 实际使用的语义模块及其对应文章位置。
- 表格、代码块、链接和图片采用的兼容性降级。
- 写入公众号编辑器后的回读结果，以及被微信清洗后做过的调整。
- 标题是否只存在于标题字段、摘要净化结果，以及公开成稿禁用内容扫描结果。
- 目标作者及保存前后作者核验结果。
- 重新载入后正文块数量、章节标题数量、首尾锚点、正文图片数量、采用的后台图片标识或线上地址、封面 CDN 状态和各分项验证时间。

writing-qa.md 必须记录主题纯度和公开内容净化检查。来源归属、原始链接、抓取与核验记录保留在 source-brief.md、sources/ 和质检文件中，不进入 article.md、摘要或 article-wechat.html。
