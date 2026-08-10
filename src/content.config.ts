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
    // 分类（对应 Hugo 的 section：tech / poetry / life）
    category: z.enum(['tech', 'poetry', 'life']),
    // 文章摘要
    excerpt: z.string().optional(),
    // 封面图
    heroImage: z.string().optional(),
    // 是否更新时间
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { posts };
