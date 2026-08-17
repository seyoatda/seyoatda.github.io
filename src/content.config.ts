import { defineCollection, z } from 'astro:content';

// 文章集合定义
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    // 文章标题
    title: z.string(),
    // 发布日期
    date: z.coerce.date(),
    // 是否草稿
    draft: z.boolean().optional().default(false),
    // 标签
    tags: z.array(z.string()).optional().default([]),
    // 文章摘要
    excerpt: z.string().optional(),
    // 封面图
    heroImage: z.string().optional(),
    // 是否更新时间
    updated: z.coerce.date().optional(),
    // 是否置顶
    pinned: z.boolean().optional().default(false),
    // 置顶排序：数值越小越靠前
    pinnedOrder: z.number().optional().default(0),
  }),
});

export const collections = { posts };
