# ROADMAP

## 项目状态

纯前端图片工具站（Next.js 16 + next-intl + Tailwind 4），四个功能页（压缩、转换、尺寸调整、背景替换）均已实现并通过构建；无后端、无数据库，全部处理在浏览器 Canvas 完成。

## 最近完成

- 2026-10-15 17:29 视觉三期：工具页体验细节。新增共享组件 `src/components/download-button.tsx`（绿色 CTA，处理中 spinner、点击后 2 秒对勾成功反馈，四页统一接入）和 `src/components/preview-empty-state.tsx`（预览空状态引导，四页右列接入）；四页统一 `processing` 派生（结果 pending 即视为处理中），resize 页移除冗余的 `processingKey` 状态；新增 `common` i18n 命名空间。上传 dropzone 的虚线框和拖拽高亮此前已存在，无需改动。
- 2026-10-15 17:19 视觉二期：首页视觉升级。Hero 加渐变背景与品牌色光斑装饰、顶部 Badge、主次双 CTA（开始使用 / 查看功能锚点）和压缩效果演示卡片（2.4 MB → 386 KB、-84% 体积条）；功能卡片 hover 改为上浮加阴影的 200ms 微交互；页脚此前已存在（隐私说明 + 版权），无需新增。
- 2026-10-15 17:05 视觉一期：品牌色设计令牌落地。`src/app/globals.css` 从 shadcn 默认中性灰改为品牌配色（浅色主色 navy `#1E3A5F`、背景 `#F8FAFC`，暗色主色 `#2563EB`、背景 `#020617`），新增 `success` 语义令牌（浅色 `#047857`、暗色 `#10B981`）；四个工具页下载按钮改为 CTA 绿；header logo 图标加品牌色；新增品牌图标 `src/app/icon.svg`，移除默认 `favicon.ico` 和 5 个未引用的 Next.js 占位 SVG。
- 2026-10-15 16:18 压缩页新增「按大小」压缩模式：`src/lib/image-utils.ts` 新增 `compressToTargetSize()`（二分搜索最高可达标 quality，quality 触底后按 0.85 递减尺寸重试，最多 6 轮，最小边 64px；不可达时返回最小结果并标记 `achieved: false`），编码逻辑抽取为 `encodeImage()` 复用；压缩页支持「按质量 / 按大小」切换，目标输入支持 KB/MB，未达标时提示实际压缩结果；i18n 文案同步补充。
- 2026-10-15 15:50 修复拖动参数时下载按钮跳动：compress/convert/resize 三个页面的大小统计块改用放宽匹配的 `statsBlob`（属于当前图片即显示），新结果 pending 期间统计块不再卸载，下载按钮位置稳定；下载按钮的可用状态仍走精确匹配的 `currentBlob`。
- 2026-10-15 15:41 将预览防跳动修复推广到其余三个工具页：`src/app/[locale]/convert/page.tsx`、`resize/page.tsx`、`background/page.tsx` 的预览显示条件同样放宽为「预览由当前图片生成」，切换格式、输入尺寸、调整颜色期间保留上一帧，下载与统计逻辑不变。
- 2026-10-15 15:37 修复压缩页拖动质量拉杆时右侧预览图跳动：`src/app/[locale]/compress/page.tsx` 的预览显示条件从「processedKey 与当前参数精确匹配」放宽为「预览由当前图片生成」，新结果处理期间保留上一帧，不再卸载预览 Card；下载和大小统计仍使用精确匹配，结果错配防护不变。
- 2026-10-15 15:03 修复首页与桌面、移动导航的嵌套交互元素：导航按钮使用 Base UI 的 `render` 属性直接渲染为链接，避免 `<a>` 内再包含 `<button>`；`buttonVariants` 从 `src/components/ui/button.tsx`（客户端组件）抽取至 `src/components/ui/button-variants.ts`，供服务端组件和导航链接复用。
- 2026-10-15 14:55 修复图片处理的结果错配和上传错误：四个工具页只展示、下载与当前图片和参数对应的结果，并忽略过期异步任务；JPEG 导出前铺白底，避免透明区域变黑；不支持的 Canvas 输出格式不再被错误命名；上传时拒绝不支持的格式，提示超限或损坏文件，并防止较早加载的图片覆盖较新选择；尺寸调整页和处理函数仅接受 1 至 10000 的整数像素宽高。
- 2026-09-24 16:32 代码审查后的低风险修复：
  - `src/app/[locale]/background/page.tsx` ：吸管取色改为从当前显示的预览图采样，修复背景替换后取色与画面不一致的问题。
  - `src/lib/image-utils.ts` ：`pickColorFromImage` 按 `object-contain` 等比缩放并扣除居中信箱边距映射坐标，且钳制像素坐标到图片范围内，修复边缘/信箱区域点击越界或取错色的问题。
  - `src/components/image-upload.tsx` ：选择文件后重置 input value，修复重复选择同一文件不触发 onChange 的问题。
  - `src/app/[locale]/compress/page.tsx` ：移除未使用的 `CardDescription` 导入和从未读取的 `processing` 状态；处理改为 200ms 防抖调用。
  - `src/app/[locale]/convert/page.tsx` ：处理改为 200ms 防抖调用，消除 `react-hooks/set-state-in-effect` lint 错误，与 resize/background 页模式一致。

## 最近验证

- 2026-10-15 17:35 浏览器实机回归（用户本机手动验证）通过：四个工具页功能、按大小压缩模式、拖杆/输入时预览与布局稳定性、三期视觉效果（品牌色、首页 Hero、下载反馈、空状态）均正常。
- 2026-10-15 17:29 验证视觉三期：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 8 项通过；`npm run build` 生产构建成功，13 个静态页面生成；开发服务 `/zh/compress`、`/zh/convert`、`/zh/resize`、`/zh/background` 均返回 HTTP 200。浏览器视觉效果待实机确认。
- 2026-10-15 17:19 验证视觉二期：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 8 项通过；`npm run build` 生产构建成功，13 个静态页面生成；开发服务 `/zh`、`/en` 均返回 HTTP 200，首页含 `#features` 锚点。浏览器视觉效果待实机确认。
- 2026-10-15 17:05 验证视觉一期：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 8 项通过；`npm run build` 生产构建成功；构建产物 CSS 含全部品牌色（`#1E3A5F`/`#2563EB`/`#047857`/`#10B981`）；开发服务 `/zh` 与 `/icon.svg` 均返回 HTTP 200，首页 HTML 已引用新图标。浏览器视觉效果待实机确认。
- 2026-10-15 16:18 验证按大小压缩功能：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 回归测试 8 项通过（新增目标大小二分搜索、尺寸回退、不可达结果、非法目标校验 4 项）；`npm run build` 生产构建成功，13 个静态页面生成；开发服务 `/zh/compress` 返回 HTTP 200。浏览器实机回归待确认。
- 2026-10-15 15:50 验证下载按钮跳动修复：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 回归测试 4 项通过；`npm run build` 生产构建成功，13 个静态页面生成。浏览器实机回归待确认。
- 2026-10-15 15:41 验证三个工具页预览防跳动修复：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 回归测试 4 项通过；`npm run build` 生产构建成功，13 个静态页面生成。浏览器实机回归待确认。
- 2026-10-15 15:37 验证压缩页预览跳动修复：`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm test` 回归测试 4 项通过；`npm run build` 生产构建成功，13 个静态页面生成。浏览器拖动实机回归待确认。
- 2026-10-15 15:31 验证 Codex 中断后的完整工作区：`npm test` 回归测试 4 项通过；`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm run build` 生产构建成功，13 个静态页面生成；解析中文首页与压缩页的生产 HTML，`<a>` 与 `<button>` 互相嵌套均为 0。
- 2026-10-15 15:03 验证导航语义与本地预览：`npx tsc --noEmit`、`npm run lint` 和 `npm run build` 通过；解析中文首页与压缩页的生产 HTML，嵌套 `<button>` 均为 0；重启开发服务后 `/zh` 返回 HTTP 200。
- 2026-10-15 14:56 验证图片格式、JPEG 透明区域、不支持的输出格式和尺寸边界：`npm test` 回归测试 4 项通过；`npx tsc --noEmit` 通过；`npm run lint` 0 error、5 个既有 `<img>` warning；`npm run build` 生产构建成功，13 个静态页面生成；本地 `/zh` 返回 HTTP 200。构建首次因沙箱无法连接 Google Fonts 失败，允许网络访问后通过。
- 2026-09-24 16:32 验证 `npx tsc --noEmit`、`npm run lint`、`npm run build`：类型检查通过；lint 0 error、5 个 warning（均为既有 `<img>` 提示，blob 预览场景不适用 `next/image`）；生产构建成功，全部路由静态预渲染正常。

## 待确认 / 后续建议

- `src/components/ui/` 下 `tabs`、`switch`、`separator`、`dropdown-menu` 四个组件无任何引用，属 shadcn 生成残留，可按需清理（本次未删除）。
- README.md 仍是 create-next-app 模板，与项目真实状态不符，建议安排重写（项目简介、功能列表、开发命令）。
