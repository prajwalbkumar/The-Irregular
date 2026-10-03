---
paths:
  - "src/_includes/**"
  - "src/sitemap.njk"
  - "src/robots.njk"
  - "src/content/posts/**"
  - "src/js/70-reader.js"
---
# SEO & standalone post pages

Every generated page (home + each post) gets the full set, resolved from `config.site` / `config.social` / frontmatter. Implemented in `src/_includes/head-seo.njk`.

## Meta
- `<title>`: `{pageTitle} — {site.title}` (just `site.title` on home) · `description` · `canonical` · `robots` (`noindex, nofollow` if `noIndex`, else `index, follow`).
- Open Graph: type (default `website`), title, description, url, image (default `config.seo.ogImage`, 1200×630), site_name. Twitter: card (`config.seo.twitterCard`), title, description, image.
- Posts add `article:published_time`, `article:section` (tag), `article:tag`.

## JSON-LD
- Home: `@graph` of `WebSite` + `Person` (name, url, `sameAs` = config.social links, jobTitle "Architect & Computational Designer", address from `based`).
- Posts (not briefs/quotes/morgue): `BlogPosting` (`Article` if long): headline, description (=`excerpt`), datePublished/Modified, author+publisher = Person @id, articleSection = tag, image if any.
- Interpolate strings with `| dump | safe`.

## sitemap / robots / headings
- `sitemap.njk` → `/sitemap.xml`: indexable pages, **exclude morgue**; priority lead 0.9 / longform 0.8 / story 0.7.
- `robots.njk` → `/robots.txt`: `Allow: /`, `Disallow: /assets/`, `Sitemap: {site.url}/sitemap.xml`.
- Exactly one `<h1>` per page (masthead on home; post title on standalone). Section heads `<h2>`; never skip levels. Reader overlay title is the `<h1>` only on the standalone route.
- Morgue is automatically `noindex, nofollow`.

## Standalone post pages
1. Static route: every post also builds at `/posts/[slug]/` (`content/posts/posts.json` directory data: permalink `posts/{{ page.fileSlug }}/`, layout `layouts/post.njk` — minimal dark page: masthead + article + back-to-field link, full SEO/JSON-LD/canonical).
2. Inline overlay: opening a post in the reader writes `#open=NUM` AND `history.pushState` to `/posts/{slug}/`; close restores the field URL; `popstate` re-syncs. Hash deep-links remain as fallback.
