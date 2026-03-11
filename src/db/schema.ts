import { pgTable, text, timestamp, uuid, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── sources 테이블 ────────────────────────────────────────────────
export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  websiteUrl: text('website_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('sources_name_idx').on(t.name),
]);

// ─── categories 테이블 ────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('categories_slug_idx').on(t.slug),
]);

// ─── articles 테이블 ─────────────────────────────────────────────
export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  sourceUrl: text('source_url').notNull().unique(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => sources.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('articles_published_at_idx').on(t.publishedAt),
  index('articles_source_id_idx').on(t.sourceId),
]);

// ─── articleCategories 조인 테이블 ───────────────────────────────
export const articleCategories = pgTable('article_categories', {
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.articleId, t.categoryId] }),
  index('article_categories_category_id_idx').on(t.categoryId),
]);

// ─── userBookmarks 테이블 ────────────────────────────────────────
export const userBookmarks = pgTable('user_bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('user_bookmarks_clerk_user_id_idx').on(t.clerkUserId),
  index('user_bookmarks_article_id_idx').on(t.articleId),
]);

// ─── Relations 정의 ──────────────────────────────────────────────
export const sourcesRelations = relations(sources, ({ many }) => ({
  articles: many(articles),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articleCategories: many(articleCategories),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
  articleCategories: many(articleCategories),
  bookmarks: many(userBookmarks),
}));

export const articleCategoriesRelations = relations(articleCategories, ({ one }) => ({
  article: one(articles, {
    fields: [articleCategories.articleId],
    references: [articles.id],
  }),
  category: one(categories, {
    fields: [articleCategories.categoryId],
    references: [categories.id],
  }),
}));

export const userBookmarksRelations = relations(userBookmarks, ({ one }) => ({
  article: one(articles, {
    fields: [userBookmarks.articleId],
    references: [articles.id],
  }),
}));
