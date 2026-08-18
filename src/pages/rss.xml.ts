import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export const GET: APIRoute = async ({ site }) => {
  // 获取所有已发布的文章，置顶在前（按 pinnedOrder 升序），其余按日期降序
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => {
      const ap = a.data.pinned ? 0 : 1;
      const bp = b.data.pinned ? 0 : 1;
      if (ap !== bp) return ap - bp;
      if (a.data.pinned && b.data.pinned) return a.data.pinnedOrder - b.data.pinnedOrder;
      return b.data.date.getTime() - a.data.date.getTime();
    });

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: site ?? SITE.url,
    language: 'zh-CN',
    items: posts.map((post) => {
      const { title, date, excerpt, tags } = post.data;
      return {
        title,
        description: excerpt || '',
        pubDate: date,
        link: `/posts/${post.id.replace(/\.md$/, '')}/`,
        categories: tags,
      };
    }),
    customData: `<language>zh-CN</language>`,
  });
};
