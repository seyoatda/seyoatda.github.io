// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 站点地址，用于生成 sitemap 和 RSS
  site: 'https://seyoatda.github.io',
  // GitHub Pages 部署到 https://seyoatda.github.io/，无需子路径
  base: '/',
  // 构建输出目录
  output: 'static',
  build: {
    // 内联小样式以减少请求
    inlineStylesheets: 'auto',
  },
  // Markdown 渲染配置
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'rose-pine-moon',
      wrap: true,
    },
  },
  // 集成列表
  integrations: [],
});
