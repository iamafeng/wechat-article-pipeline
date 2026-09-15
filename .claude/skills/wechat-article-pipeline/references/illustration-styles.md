# 配图风格表

阶段三生图时，先定风格再写提示词。风格决定画面的材质、笔触和情绪，也决定它和文风搭不搭。

用法：

1. 按「风格与文风配对」选定一种风格。
2. 取该风格的提示词骨架，替换其中方括号里的**场景内容**为本文实际要画的东西。
3. 骨架里的材质/光线/约束部分保持不变，那是风格本身。
4. 记录到 PROMPTS.md：风格名、最终提示词、模型、尺寸。

---

## 风格与文风配对

| 写作风格 | 推荐配图风格 | 理由 |
| --- | --- | --- |
| `writing-style-healing` | `hand-drawn-watercolor` | 暖色与可见笔触承接情绪，柔化边缘对应"不喊"的克制 |
| `writing-style-plain` | `flat-vector` | 干净利落，不干扰信息传达 |
| `khazix-writer` | `flat-vector` 或 `ink-wash` | 人格化长文配扁平插画；中式选题可走水墨 |
| 未指定 / 其他 | `flat-vector` | 最稳的通用默认 |

配图风格**跟随写作风格自动选择**，用户明确指定时以用户为准。

---

## hand-drawn-watercolor（手绘水彩）

适用：治愈系、人物故事、生活观察、情绪类选题。

**中文提示词骨架：**

```
手绘水彩插画，[场景内容：一个具体的画面或物件，例如"深夜巷口亮着灯的小面馆"]，
温暖柔和的配色（米白、暖黄、低饱和的橘与灰绿），可见的手绘笔触与水彩晕染边缘，
纸张纹理质感，柔和自然光，大量留白，画面安静不喧闹，
无文字，无人物面部特写，无水印
```

**English skeleton:**

```
hand-painted watercolor illustration, [scene],
warm muted palette (cream, warm yellow, desaturated orange and sage green),
visible brushstrokes and watercolor bleeding edges, paper texture,
soft natural light, generous negative space, quiet mood,
no text, no face close-up, no watermark
```

**要点：**

- 必须可见笔触与纸纹，否则会退化成普通 AI 渲染图，失去手绘感。
- 边缘要"柔化"，不要锐利的矢量描边。
- 留白要多，画面安静。治愈系最怕画面元素堆满。
- 不画人物面部特写 —— 五官是 AI 最容易崩的部分，且会让画面变具体、侵入读者想象。画背影、手部、或空场景更安全。

---

## flat-vector（扁平插画）

适用：通用默认、技术解读、产品说明、行业观察。

**中文提示词骨架：**

```
极简扁平插画，[场景内容]，单一强调色配合中性底色，
几何化的形状，清晰的图形层级，大量留白，现代清爽，
无文字，无渐变噪点，无水印
```

**English skeleton:**

```
minimal flat vector illustration, [scene],
single accent color with neutral background, geometric shapes,
clear visual hierarchy, generous negative space, clean and modern,
no text, no gradient noise, no watermark
```

**要点：**

- 一个强调色即可，不要多色混战。
- 与文章主题的强调色保持一致（暖陶主题用 `#C96B3D`）。

---

## ink-wash（水墨留白）

适用：中式选题、文化类、个人随笔。

**中文提示词骨架：**

```
中国水墨风格插画，[场景内容]，淡墨晕染与大面积留白，
简笔造型，少量暖色点缀，宣纸质感，意境清远，
无文字，无印章，无水印
```

**English skeleton:**

```
Chinese ink-wash illustration, [scene],
light ink bleeding with expansive negative space, minimal forms,
a touch of warm accent color, rice-paper texture, serene atmosphere,
no text, no seal stamp, no watermark
```

---

## 通用约束（所有风格都适用）

- **不生成文字。** 画面的文字由排版 HTML 负责，AI 生图的中文几乎必错。需要标题字时改用确定性渲染或后期叠加。
- **封面要画得出具体场景**，不要抽象装饰。读者看封面判断的是"这篇文章讲什么"。
- **同一篇内多图保持同一家族**：同一风格、同一套配色、同一光线逻辑。
- **封面与近期文章做 SHA-256 去重**，并检查构图、主体、主色是否有明显差异。
- 所有图片先落 `assets/`，通过解码与像素尺寸检查后才计入 `image_count`。
