# Manimood 本地性能、SEO 与 GEO 检查

检查日期：2026-10-12；范围：本地主题与 http://127.0.0.1:9292/。未发布主题，未更改 Shopify 后台 App、Markets、域名或商品 SEO 数据。

## 已实施

- banner-main 使用 picture + 移动端 source + srcset，浏览器按设备选择图片，移除固定尺寸的重复预加载和强制 pjpg。模板第一节第一张图 eager/high，其他图 lazy；保留宽高。
- 首页轮播、商品分类、集合标签、客户评价共享一个 Swiper 加载 Promise，接近视口 200px 时加载与初始化。集合网格不请求 Swiper；编辑器直接初始化。原有交互与配置保留。
- 客户评价主图使用原生懒加载和响应式尺寸。
- 修正第二、第三字体预加载引用，并避免重复字体预加载。
- 修复 viewport 禁止缩放；首页品牌 H1 从 display:none 改为 visually-hidden。
- 优先保留后台 Title/Description；缺失 Description 时按商品、集合、文章、页面正文回退，再回退到商店简介。OG/Twitter 使用相同 Description。
- 搜索、购物车、404、客户页面 noindex,follow。保留 canonical 和 Shopify content_for_header。
- 社交图 HTTPS、1200px 上限；修复部分面包屑 JSON 转义；首页增加 Organization，统一 schema.org HTTPS。

## 本地验证

首页 HTTP 200，HTML 获取约 1965ms；Title=Manimood，Description=Manimood；canonical=https://manimood.com/。H1 一个，文字 Manimood。picture 一个，high 图片一个，没有同步 Swiper script 标签，新加载器已渲染，无 Liquid error。

该耗时不是 FCP/LCP，包含本地开发代理，不代表生产 CDN 或首屏 <=4 秒。当前浏览器连接仅有 MCP Apps，无法进行真实移动端浏览器测速与视觉交互验收。加载器行为模拟通过：视口外不下载、多个组件只请求一次库、网格不请求库。四个修改 section 的 schema JSON 与 inline JS 语法通过。

Shopify Theme Check 已运行，全库发现大量错误（首次结果 267），涉及未修改组件的 HTML、缺失资源和翻译。head_assets 的 t4s_loader.svg 引用被检查器报告缺失，目录内实际有 t4s_loader.svg.liquid，需在 Shopify 渲染端确认其处理方式。完整结果见 theme-check-results.json。技能自带验证器因缺少 @shopify/theme-check-common 无法启动，文档搜索因网络失败，参考官方文档代替。

## 首屏验收标准

定义首屏目标为移动端 LCP <=4s，并争取 <=2.5s；CLS <=0.1、INP <=200ms。上线前在真实浏览器对首页、集合、商品、文章分别进行移动端冷缓存测试，每页至少 3 次取中位数，记录网络/CPU 条件与 FCP、LCP、CLS、脚本执行量。对比相同条件下的优化前后结果；上线后用真实用户数据复核。

CSS/JS 不做全站盲目合并：主题已有压缩核心 JS 和按 section 加载 CSS，合并所有组件会扩大无关页面负载。此次消除重复同步 Swiper 加载；后续按瀑布图决定关键 CSS 合并、非关键 CSS 延迟与未用资源删除。主题核心 global/theme 的依赖链保留。

## 全站 TDK 与标题规范

当前首页 Title/Description 只有品牌名；首页数据同时出现 Kids Magic Clay、DIY Clay Kit 和美甲分类/内容。先确定主营业务，以下按美甲方向给出待后台填写的文案，不能将未确认的配送、材质、效果写成事实。

| 页面 | Title 规划 | Description 规划 | H1 / H2 / H3 |
|---|---|---|---|
| 首页 | Manimood Press-On Nails – Find Your Nail Style | Explore Manimood press-on nail designs, from French and glazed styles to cat-eye and ombre looks. Find a style for your next occasion. | H1 主品牌与品类；H2 分类、推荐、使用指南；H3 单项内容 |
| 集合 | {Collection} Press-On Nails \| Manimood | Browse {Collection} press-on nails from Manimood. Compare available designs, shapes and lengths to find your preferred look. | H1 集合名称；H2 选购指南；H3 款式条目 |
| 商品 | {Product Name} Press-On Nails \| Manimood | {商品真实特色}。查看真实包含物、适配尺寸及佩戴方法；不要编造耐久、材质或认证。 | H1 商品名；H2 详情、尺寸、用法、评价；H3 操作步骤 |
| 博客列表 | Nail Tips & Style Guides \| Manimood | Read Manimood nail style guides and practical tips for choosing, applying and caring for press-on nails. | H1 博客名；H2 文章题目 |
| 文章 | {Article Topic} \| Manimood | 用独立摘要说明文章解决的问题和真实内容，不直接复制首页描述。 | H1 文章题目；H2 主题段落；H3 子步骤 |
| About / Contact / Shipping / Returns | {Page Purpose} \| Manimood | 根据真实品牌故事、联系方式和实际政策分别填写。 | H1 页面用途；H2 政策章节；H3 子条款 |

Title 约 50–60 个英文字符、Description 约 140–160 个字符作为编辑参考，不是搜索引擎硬限制。每页独立且与可见正文匹配，保留后台 SEO 数据优先级；不批量截断商品标题。Keywords 仅作内容研究，不作为主要排名工作。

首页当前只有品牌 H1，建议后续用真实可见主标题表达主营品类并移除品牌备用 H1，避免两个 H1。其他页面动态标题受后台 block 设置影响，需逐模板验收，不能仅凭源码声明全站已符合。

Alt：商品图描述实际款式、颜色、形状/视角；集合图描述集合主题；人物评价图填写实际描述；装饰图 alt=""；Logo 用品牌名。不要用关键词堆积或文件名。当前首屏图缺 alt 时回退品牌名，需要在媒体后台写准确描述。

## App 审查与数量控制

settings_data 中启用 Judge.me Reviews 和 Chatty 两个 App embed；本地首页实际输出多个 Judge.me 域名资源。App embed 数量不等于全部已安装 App 数量，其他注入脚本可能来自 content_for_header、像素和历史代码。

在后台建立 App 台账：用途、负责人、加载页面、JS/CSS 体积、执行时间、业务价值。每个用途尽量保留一个实现；新 App 安装前后在相同条件下测速。Judge.me 保留产品评价用途，核查首页无需的 widget 和脚本配置；Chatty 核查延迟展示/加载选项及实际网络请求。不要直接改写 content_for_header 或卸载业务 App。卸载后复查残留 embed、snippet、像素和外部脚本。

## SEO 与 GEO

- 保留 Shopify CDN asset_url/image_url；全球 CDN 加速由平台提供，本地主题不能开通或证明其全球表现。正式域名、SSL、Markets 要在后台核查。
- 国际地区配置：在 Markets 配置目标国家、语言、独立域名/子目录和本地化内容。Shopify 通过 content_for_header 与 sitemap 自动处理 hreflang，避免手写冲突标签。检查每个地区 canonical、语言与货币，避免强制地区跳转阻碍访问。
- 正式站核查 /robots.txt、/sitemap.xml、重定向、404、集合筛选 URL、索引状态；在 Search Console 提交 sitemap。本地 canonical 保持生产域名是预览行为，不能替换成 127.0.0.1。
- 生成式搜索优化：Organization、Product、Article 的结构化信息必须与可见内容一致；不伪造评价、认证或库存。维护 About、Contact、退换/配送政策、真实作者与更新日期，提供可引用的尺寸、佩戴、取下及保养说明。FAQ 先补真实问答内容，不承诺排名或 AI 引用。
- 没有添加 llms.txt、虚构 GeoCoordinates 或批量 geo meta；这些不能代替真实内容、Markets 和爬虫可访问性。

## 官方参考

- https://shopify.dev/docs/storefronts/themes/best-practices/performance
- https://shopify.dev/docs/storefronts/themes/best-practices/performance/defer-non-critical-resources
- https://shopify.dev/docs/storefronts/themes/seo/hreflang
- https://help.shopify.com/en/manual/markets/seo
