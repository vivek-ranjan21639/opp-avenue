-- Drop blog-related tables from content schema (they're already in public)
DROP TABLE IF EXISTS content.blog_tags CASCADE;
DROP TABLE IF EXISTS content.comments CASCADE;
DROP TABLE IF EXISTS content.blogs CASCADE;
DROP TABLE IF EXISTS content.authors CASCADE;
DROP TABLE IF EXISTS content.tags CASCADE;

-- Drop the content schema
DROP SCHEMA IF EXISTS content CASCADE;