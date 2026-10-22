# Asset provenance

## 籽语 D1-D4 扩展

- `crops/d1-garden.png`, `crops/d1-seed-active.png`, `crops/d1-seed-empty.png`：裁自用户提供的 `D1.png`，仅复用无文字水彩装饰与种子罩视觉。
- `crops/d2-memory-header.png`：裁自用户提供的 `D3.png`（画面内容为“查看回忆”）。
- `crops/d3-edit-header.png`：裁自用户提供的 `D4.png`（画面内容为“编辑种子”）。
- `crops/d4-share-cloud-band.png`：裁自用户提供的 `D2.png`（画面内容为“分享这颗种子”）。
- `generated/seed-arrival-dome.png`：由 OpenAI 内置 imagegen（gpt-image-2）依据 `D1.png` 的水彩风格生成，用于新种子首次入柜动效；完整提示词见同名 `.prompt.txt`。

## Exact-source crops

Files under `assets/crops/` are unretouched pixel crops from the user-supplied `C1.png` through `C6.png`. The source copies are in `reference/`. They provide illustration and icon material only; live text, progress, buttons, form fields, uploaded media, and cards are implemented in HTML/CSS.

`c4-camera-transparent.png` and `c4-microphone-transparent.png` are local alpha-cleaned derivatives of the supplied C4 icon crops. Only the flat white image backgrounds were removed; the pink symbols were preserved.

## Generated animation particle

`assets/generated/dandelion-seed-sprites.png` and `dandelion-seed-single.png` were generated with the built-in image generation tool using C6 as the strict style reference. Prompt intent: eight isolated white dandelion seed parachutes with warm golden seed bodies, no character, flower gate, UI, text, or background scene. They are used only at tiny scale for C6 motion and do not replace original artwork.

## Generated seven-stage flower overlay

`assets/generated/dandelion-mature-head.png` was generated with the built-in image generation tool using C1 as the strict style reference. It is an isolated alpha PNG of one mature white dandelion seed head. The live interface reveals one seventh of this asset after each archived task, then displays the complete white seed head at 7/7. The exact production prompt is stored alongside the image.

## 栖所 E1–E7 扩展

- `assets/E/generated/e1-home-scene-image2.png`、`e2-story-cabinet-image2.png`、`e3-scrapbook-image2.png`、`e6-chat-scene-image2.png`、`e7-quiet-scene-image2.png`：由 OpenAI 内置 Image2 依据用户提供的 E1/E4/E5/E6/E7 高保真图生成无文字场景底图；所有标题、卡片、按钮与输入内容继续由 HTML/CSS 实现。
- `assets/E/generated/story-icons-sheet-image2.png` 与 `sound-icons-sheet-image2.png`：由 Image2 生成的故事分类与环境声图标母版；`assets/E/icons/` 中同名图标为透明裁切版本。
- `assets/E/media/pupu-avatar-image2.png`：裁自 Image2 生成的栖所场景，用作聊天中蒲团子的头像。
- `assets/E/media/demo-*.png`：从用户提供的 E2、E3、E5 高保真参考图中裁取，仅用于演示“故事照片/视频”排版，不声称为用户真实上传内容。
- 上述 22 张新增栅格图均已将生成或派生说明写入 PNG 元数据，可由 `impeccable embed-prompt --scan` 审计。
