// 站点配置 — 从 Hugo config.toml 迁移
export const SITE = {
  // 站点标题
  title: '三天前的灵魂',
  // 副标题/座右铭
  motto: '生活在经验里，直到大厦崩塌。',
  // 作者
  author: 'seyoatda',
  email: 'seyoatda@foxmail.com',
  // 描述
  description: '三天前的灵魂 — seyoatda 的个人博客',
  // 站点 URL
  url: 'https://seyoatda.github.io',
  // 版权信息
  copyright: 'CC BY-NC-SA 4.0',
  copyrightUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh',
  // 语言
  lang: 'zh-CN',
  // 头像
  avatar: '/avatar.png',
} as const;

// 导航菜单
export const NAV = [
  { name: '技术', href: '/tech/', weight: 1 },
  { name: '诗', href: '/poetry/', weight: 2 },
  { name: '遐思', href: '/life/', weight: 3 },
  { name: '标签', href: '/tags/', weight: 4 },
  { name: '关于', href: '/about/', weight: 5 },
] as const;
