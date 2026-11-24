const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Marked } = require('marked');
const markedFootnote = require('marked-footnote');

// NOTE: Editorial review logic has been removed from build.js.
// Structural/formatting checks are now in review.js (called by npm run review).
// The editorial agent is in review-agent.js (called by npm run editorial-agent).

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const OUTPUT_DIR = path.join(ROOT, 'blog');

function slugify(value) {
  return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
}

function parseDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00Z`);
    }
  return new Date(value);
}

function formatDate(isoDate) {
  const d = parseDate(isoDate);
  if (Number.isNaN(d.getTime())) {
    return isoDate;
    }
  const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPostTemplate(post) {
  const postUrl = post.url + '/index.html';
  return `<!doctype html>
<html lang="en">
<head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${post.title} &mdash; Dean L. Young</title>
      <meta name="description" content="${escapeMarkup(post.summary)}">
      <meta name="theme-color" content="#F1E9DC">
      <meta name="robots" content="index,follow">
      <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
      <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
      <link rel="canonical" href="https://deanlyoung.com/${postUrl}">
      <meta property="og:title" content="${post.title} &mdash; Dean L. Young">
      <meta property="og:type" content="article">
      <meta property="og:url" content="https://deanlyoung.com/${postUrl}">
      <meta property="og:image" content="https://deanlyoung.com/assets/dly-logo-color-1024.png">
      <meta property="og:description" content="${escapeMarkup(post.summary)}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${post.title} &mdash; Dean L. Young">
      <meta name="twitter:description" content="${escapeMarkup(post.summary)}">
      <meta name="twitter:image" content="https://deanlyoung.com/assets/dly-logo-color-1024.png">
      <link rel="stylesheet" href="/css/styles.css">
      <!-- Google Analytics -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-HH352NDPHL"></script>
      <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-HH352NDPHL');
      </script>
      <!-- End Google Analytics -->
</head>
<body>
     <div class="site-shell">
       <header class="site-header">
        <div>
          <nav class="nav">
            <a href="/about">About</a>
            <a href="/resume">Resume</a>
            <a href="/projects">Projects</a>
            <a href="/blog"><span class="wordmark"><span class="one">1</span><span class="three">3</span>log</span></a>
          </nav>
        </div>
       </header>

        <main class="content page-content">
         <article class="post">
           <p class="post-meta">${formatDate(post.date)}</p>
           <h1>${post.title}</h1>
           ${post.html}
          </article>
        </main>

        <footer class="site-footer">
         <p>Find me on <a href="https://linkedin.com/in/deanlyoung" target="_blank" rel="noopener">LinkedIn</a>. Visit the <a href="/philosophy">Philosophy</a> and <a href="/craft">Craft</a> pages.</p>
         <p><a href="/blog/rss.xml">Blog RSS feed</a></p>
         <p><a href="/disclosures">Disclosures</a></p>
         <p>&copy; Dean L. Young 2026</p>
       </footer>
     </div>
     <script src="/js/scripts.js"></script>
</body>
</html>`;
}

function buildIndex(posts) {
  const listItems = posts.map(post => `          <li>\n             <div class="post-header">\n               <a href="/${post.url}/index.html" class="post-title">${post.title}</a>\n               <time datetime="${post.date}" class="post-date">${formatDate(post.date)}</time>\n             </div>\n             <p>${escapeMarkup(post.summary)}</p>\n           </li>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Blog &mdash; Dean L. Young</title>
      <meta name="description" content="Short-form writing from Dean L. Young on product, design, and building teams.">
      <meta name="theme-color" content="#F1E9DC">
      <meta name="robots" content="index,follow">
      <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
      <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
      <link rel="canonical" href="https://deanlyoung.com/blog/">
      <meta property="og:title" content="Blog &mdash; Dean L. Young">
      <meta property="og:type" content="website">
      <meta property="og:url" content="https://deanlyoung.com/blog/">
      <meta property="og:image" content="https://deanlyoung.com/assets/dly-logo-color-1024.png">
      <meta property="og:description" content="Short-form writing from Dean L. Young on product, design, and building teams.">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Blog &mdash; Dean L. Young">
      <meta name="twitter:description" content="Short-form writing from Dean L. Young on product, design, and building teams.">
      <meta name="twitter:image" content="https://deanlyoung.com/assets/dly-logo-color-1024.png">
      <link rel="stylesheet" href="/css/styles.css">
      <!-- Google Analytics -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-HH352NDPHL"></script>
      <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-HH352NDPHL');
      </script>
      <!-- End Google Analytics -->
</head>
<body>
     <div class="site-shell">
       <header class="site-header">
        <div>
          <nav class="nav">
            <a href="/about">About</a>
            <a href="/resume">Resume</a>
            <a href="/projects">Projects</a>
            <a href="/blog"><span class="wordmark"><span class="one">1</span><span class="three">3</span>log</span></a>
          </nav>
        </div>
       </header>

        <main class="content page-content">
         <h1>Writing</h1>
         <p class="section-lead">Short notes on product strategy, design, and working on better teams.</p>
         <ul class="post-list">
${listItems}
          </ul>
        </main>

        <footer class="site-footer">
         <p>Find me on <a href="https://linkedin.com/in/deanlyoung" target="_blank" rel="noopener">LinkedIn</a>. Visit the <a href="/philosophy">Philosophy</a> and <a href="/craft">Craft</a> pages.</p>
         <p><a href="/blog/rss.xml">Blog RSS feed</a></p>
         <p><a href="/disclosures">Disclosures</a></p>
         <p>&copy; Dean L. Young 2026</p>
       </footer>
     </div>
     <script src="/js/scripts.js"></script>
</body>
</html>`;
}

function feedArticleHTML(html, postUrl) {
  return html.replace(/<[a-z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*>/gi, tag =>
    tag.replace(/\s(?:[^\s=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, attribute => {
      const match = attribute.match(/^(\s(?:href|src)\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s>]+))$/i);
      if (!match) return attribute;
      const [, prefix, doubleQuoted, singleQuoted, unquoted] = match;
      const value = doubleQuoted ?? singleQuoted ?? unquoted;
      if (!value || /^(?:#|[a-z][a-z\d+.-]*:)/i.test(value) || !URL.canParse(value, postUrl)) {
        return attribute;
      }
      const quote = singleQuoted === undefined ? '"' : "'";
      return prefix + quote + new URL(value, postUrl).href + quote;
    })
  );
}

function buildRSS(posts) {
  const updated = posts[0] ? posts[0].parsedDate.toUTCString() : new Date().toUTCString();
  const items = posts.map(post => {
    const postUrl = `https://deanlyoung.com/${post.url}/index.html`;
    return `      <item>
        <title>${escapeMarkup(post.title)}</title>
        <link>${postUrl}</link>
        <guid isPermaLink="true">${postUrl}</guid>
        <pubDate>${post.parsedDate.toUTCString()}</pubDate>
        <description>${escapeMarkup(post.summary)}</description>
        <content:encoded>${escapeMarkup(feedArticleHTML(post.html, postUrl))}</content:encoded>
      </item>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
     <title>Dean L. Young</title>
     <link>https://deanlyoung.com/</link>
     <description>Short-form product writing from Dean L. Young.</description>
     <lastBuildDate>${updated}</lastBuildDate>
${items}
</channel>
</rss>`;
}

// Check if a post passes editorial review gating.
// A post is "published" if it has editorial_review.reviewed set to true.
function isPostPublished(metadata) {
  const er = metadata.editorial_review;
  if (!er || typeof er !== 'object') return false;
  return er.reviewed === true;
}

// Read frontmatter metadata from a markdown file.
function loadPostMetadata(filename) {
  const file = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const metadata = parsed.data;
  const rawDate = metadata.date;
  let dateStr = String(rawDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = parseDate(rawDate);
    dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
     }
  const title = metadata.title || path.basename(filename, '.md');
  const summary = metadata.summary || '';
  const slug = metadata.slug || slugify(title);
  const url = `blog/${dateStr}/${slug}`;
  return { filename, title, summary, date: dateStr, slug, url, parsedDate: parseDate(dateStr), metadata, content: parsed.content };
}

// Write a single post's HTML to the output directory.
function buildPost(post) {
  const postDir = path.join(OUTPUT_DIR, post.date, post.slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, 'index.html'), buildPostTemplate(post));
  console.log(`Built: /blog/${post.date}/${post.slug}/index.html — "${post.title}"`);
}

// Load all post sources, sorted newest first.
function loadAllPostMetadata() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory does not exist:', CONTENT_DIR);
    process.exit(1);
     }
  const markdownFiles = fs.readdirSync(CONTENT_DIR).filter(name => name.endsWith('.md'));
  const posts = markdownFiles.map(loadPostMetadata);
  posts.sort((a, b) => b.parsedDate - a.parsedDate);
  return posts;
}

// Remove blog output folders for posts that no longer have a markdown source,
// or are missing editorial review, and clean up stale _data.json files.
function cleanOrphans(posts) {
  if (!fs.existsSync(OUTPUT_DIR)) return;

  const expectedKeys = new Set(posts.map(post => `${post.date}/${post.slug}`));

  const dateDirs = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name));

  dateDirs.forEach(dateDir => {
    const datePath = path.join(OUTPUT_DIR, dateDir.name);
    const entries = fs.readdirSync(datePath, { withFileTypes: true });

    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const key = `${dateDir.name}/${entry.name}`;
        if (!expectedKeys.has(key)) {
          const orphanPath = path.join(datePath, entry.name);
          console.log(`Removing orphan: ${key}`);
          fs.rmSync(orphanPath, { recursive: true, force: true });
          } else {
            // Remove stale _data.json from old build process
          const dataPath = path.join(datePath, entry.name, '_data.json');
          if (fs.existsSync(dataPath)) {
            fs.unlinkSync(dataPath);
            console.log(`Removed stale: ${key}/_data.json`);
            }
          }
        }
      });

     // Remove empty date directories
    const remaining = fs.readdirSync(datePath);
    if (remaining.length === 0) {
      fs.rmSync(datePath, { recursive: true, force: true });
      }
    });
}

// Rebuild the listing and feed from the same published posts.
function buildIndexAndRSS(posts) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), buildIndex(posts));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'rss.xml'), buildRSS(posts));
  console.log(`Rebuilt blog/index.html and blog/rss.xml with ${posts.length} post(s).`);
}

function main() {
  const args = process.argv.slice(2);
  const onlyIndex = args.indexOf('--only');
  const allPosts = loadAllPostMetadata();
  const posts = allPosts
    .filter(post => isPostPublished(post.metadata))
    .map(post => ({ ...post, html: new Marked(markedFootnote()).parse(post.content) }));

  cleanOrphans(posts);
  if (onlyIndex === -1) {
    posts.forEach(buildPost);
  } else {
    const changedFiles = new Set(args.slice(onlyIndex + 1)
      .filter(arg => !arg.startsWith('--') && arg.endsWith('.md'))
      .map(file => path.basename(file)));
    posts.filter(post => changedFiles.has(post.filename)).forEach(buildPost);
  }

  buildIndexAndRSS(posts);
  console.log(`${posts.length} of ${allPosts.length} post(s) published.`);
}

main();
