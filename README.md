# 告别蒲蒲｜Vite + Vercel + DeepSeek

这是可直接上传 GitHub 并部署到 Vercel 的完整交互原型。设计尺寸为 390 × 844，前端使用 Vite，唯一的 AI 入口是同源 `POST /api/chat`。

## 已接入的 AI 功能

- 风原：用户先点“开启摇晃抽取”，再摇晃手机触发花瓣落下；DeepSeek 根据栖所中用户自己保存的故事、已完成任务和当前第几步，生成 1 件专属告别小事。无法使用动作传感器时可点按抽取。
- 七步递进：从观察或写一句话开始，逐步到整理、纪念、照顾自己和回看收束；每次换任务会避开已替换标题。
- 故事整理：保存故事时可选择让 AI 识别正文和最多 3 张图片，返回整理正文、摘要、图片说明和版式。视频、私人备注和原始图片文件不会发送。
- 任务记录整理：点击“整理这段记录”后，AI 结合任务、心情、正文和最多 3 张图片整理；C5、D2、D4 共用同一结果。
- 栖所对话：发送最近 8 条对话和最多 6 条栖所故事摘要，让陪伴回应保有上下文。
- 降级保护：AI 未配置、超时或网络失败时，任务改用内置版本，故事和记录改用本机排版；原始内容在当前页面会话中不会因为请求失败而丢失。
- 会话状态：任务、种子、故事和记录只保留在当前页面运行期间；不刷新时可继续查看，刷新或重新打开网站后从 0/7 重新开始，同时清理上一会话上传的媒体。

## 安全约束

- `DEEPSEEK_API_KEY` 只在 `api/chat.js` 中从环境变量读取。
- 前端代码不包含 DeepSeek 密钥或 DeepSeek 官方接口地址，只调用 `/api/chat`。
- Serverless Function 校验同源、动作、文字长度、图片类型、图片数量和请求体大小。
- 图片在浏览器中缩放并压缩后再发送；最多 3 张。Vercel Function 请求体限制为 4.5 MB，本项目在 4.2 MB 前主动拒绝。
- 不记录用户正文、图片或聊天内容到服务端日志。
- `.env`、`.env.local`、`.vercel`、`node_modules` 和 `dist` 已写入 `.gitignore`。

## 本地安装、测试与构建

要求 Node.js 20.19 或更高版本。

```bash
npm install
npm run test
npm run build
```

`npm run build` 输出 `dist/`。只预览静态页面可运行：

```bash
npm run preview
```

## 本地测试真实 DeepSeek 链路

1. 把 `.env.example` 复制为 `.env.local`。
2. 填写：`DEEPSEEK_API_KEY=你的密钥`。
3. 安装或直接调用 Vercel CLI：

```bash
npx vercel dev
```

4. 打开终端显示的地址（通常为 `http://localhost:3000`）。
5. 测试“风原抽取”“整理记录”“栖所故事保存”“陪我说说话”。浏览器网络面板中只应出现 `/api/chat`，不应出现 `api.deepseek.com`。

## 上传 GitHub 与部署 Vercel

1. 解压 ZIP 后，确认当前目录根部直接包含 `package.json`、`api/`、`vercel.json`、`index.html`，不要只上传它们的上一级空壳目录。
2. 将这一层的全部文件上传到 GitHub，尤其要确认 `public/assets/` 与 `public/private-island/` 已经上传；Vite 会把它们原样复制到部署产物。
3. 在 Vercel 导入仓库。Framework Preset 可保持自动识别的 Vite；Build Command 为 `npm run build`，Output Directory 为 `dist`。
4. 在 Vercel → Project Settings → Environment Variables 新建 `DEEPSEEK_API_KEY`，勾选 Production；需要预览环境时也勾选 Preview。
5. 重新部署。

`vercel.json` 没有 `functions.api/chat.js` 的显式匹配项。Vercel 会自动把根目录 `/api/chat.js` 识别为 Node.js Function，这避免了旧包在目录层级或函数匹配错误时出现的 `unused_function` 构建失败。

## 重要说明

- 不要把真实密钥写进 `.env.example`、代码、GitHub、截图或聊天记录。
- 首次让 AI 处理故事或记录时，页面会明确说明发送范围并征求同意。
- 本地自动测试使用模拟 DeepSeek 响应，不消耗你的 API 额度；真实密钥连通性需要你在 `.env.local` 或 Vercel 环境变量配置后验证。
