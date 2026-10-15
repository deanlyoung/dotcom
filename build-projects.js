const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content', 'projects');
const MANIFEST = path.join(CONTENT_DIR, 'projects.json');
const OUTPUT_DIR = path.join(ROOT, 'projects');
const MATURITY = new Set(['Shipped', 'In use', 'In progress']);
const ACCESS = new Set(['Public', 'Personal use', 'Pre-release', 'Limited public access', 'Private']);
const LINK_TYPES = new Set(['source', 'download', 'website', 'documentation']);
const REQUIRED_HEADINGS = [
  'At a glance', 'Background and opportunity', 'Business justification',
  'Goals, success measures, and non-goals', 'Personas and stakeholders',
  'Requirements', 'Solution and experience', 'Decisions and tradeoffs',
  'Risks and mitigations', 'Outcomes and evidence', 'Build it',
  'What I learned', 'What remains'
];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function validateDescription(description) {
  if (typeof description !== 'string' || !description.trim()) return 'must be a non-empty string';
  if (description.length > 220) return 'must be 220 characters or fewer';
  const endings = description.match(/[.!?](?:["')\]]|$)/g) || [];
  if (endings.length !== 1 || !/[.!?]$/.test(description.trim())) return 'must be exactly one complete sentence';
  return null;
}

function loadProjects() {
  const projects = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  if (!Array.isArray(projects) || projects.length === 0) throw new Error('projects.json must contain a non-empty array.');
  const slugs = new Set();
  const orders = new Set();
  const errors = [];

  projects.forEach((project, index) => {
    const label = project.slug || `entry ${index + 1}`;
    const requiredStrings = ['title', 'slug', 'description', 'maturity', 'access', 'hero_image', 'hero_alt', 'role', 'timeframe'];
    requiredStrings.forEach(field => {
      if (typeof project[field] !== 'string' || !project[field].trim()) errors.push(`${label}: ${field} must be a non-empty string`);
    });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug || '')) errors.push(`${label}: slug is invalid`);
    if (slugs.has(project.slug)) errors.push(`${label}: duplicate slug`); else slugs.add(project.slug);
    if (!Number.isInteger(project.sort_order) || project.sort_order < 1) errors.push(`${label}: sort_order must be a positive integer`);
    if (orders.has(project.sort_order)) errors.push(`${label}: duplicate sort_order`); else orders.add(project.sort_order);
    if (typeof project.featured !== 'boolean') errors.push(`${label}: featured must be a boolean`);
    if (!MATURITY.has(project.maturity)) errors.push(`${label}: unsupported maturity`);
    if (!ACCESS.has(project.access)) errors.push(`${label}: unsupported access`);
    const descriptionError = validateDescription(project.description);
    if (descriptionError) errors.push(`${label}: description ${descriptionError}`);
    if (!Array.isArray(project.platforms) || project.platforms.length === 0 || project.platforms.some(item => typeof item !== 'string' || !item.trim())) errors.push(`${label}: platforms must be a non-empty string array`);
    if (!Array.isArray(project.links)) errors.push(`${label}: links must be an array`);
    else project.links.forEach((link, linkIndex) => {
      if (!LINK_TYPES.has(link.type)) errors.push(`${label}: link ${linkIndex + 1} has unsupported type`);
      if (typeof link.label !== 'string' || !link.label.trim()) errors.push(`${label}: link ${linkIndex + 1} needs a label`);
      try { if (new URL(link.url).protocol !== 'https:') throw new Error(); } catch { errors.push(`${label}: link ${linkIndex + 1} must be a valid HTTPS URL`); }
    });

    const imagePath = path.join(ROOT, String(project.hero_image || '').replace(/^\//, ''));
    if (!fs.existsSync(imagePath)) errors.push(`${label}: hero image does not exist`);
    const markdownPath = path.join(CONTENT_DIR, `${project.slug}.md`);
    if (!fs.existsSync(markdownPath)) errors.push(`${label}: matching Markdown file does not exist`);
    else {
      const markdown = fs.readFileSync(markdownPath, 'utf8');
      REQUIRED_HEADINGS.forEach(heading => {
        if (!markdown.includes(`## ${heading}`)) errors.push(`${label}: missing heading “${heading}”`);
      });
      project.markdown = markdown;
    }
  });

  if (errors.length) throw new Error(`Project validation failed:\n- ${errors.join('\n- ')}`);
  return projects.sort((a, b) => a.sort_order - b.sort_order);
}

function nav(active) {
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' class="nav-active" aria-current="page"' : ''}>${label}</a>`;
  return `${link('/about', 'About', 'about')}\n            ${link('/resume', 'Resume', 'resume')}\n            ${link('/projects', 'Projects', 'projects')}\n            <a href="/blog"><span class="wordmark"><span class="one">1</span><span class="three">3</span>log</span></a>`;
}

function head({ title, description, canonical, image }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const fullImage = image.startsWith('http') ? image : `https://deanlyoung.com${image}`;
  return `<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${fullImage}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${fullImage}">
    <meta name="theme-color" content="#F1E9DC">
    <meta name="robots" content="index, follow">
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="icon" href="/assets/favicon.svg">
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">`;
}

function footer() {
  return `<footer class="site-footer">
        <p>Find me on <a href="https://linkedin.com/in/deanlyoung" target="_blank" rel="noopener">LinkedIn</a>. Visit the <a href="/philosophy">Philosophy</a> and <a href="/craft">Craft</a> pages.</p>
        <p><a href="/blog/rss.xml">Blog RSS feed</a></p>
        <p><a href="/disclosures">Disclosures</a></p>
        <p>&copy; Dean L. Young 2026</p>
      </footer>`;
}

function badges(project) {
  return `<span class="project-badge project-badge--maturity">${escapeHtml(project.maturity)}</span><span class="project-badge project-badge--access">${escapeHtml(project.access)}</span>`;
}

function projectIndex(projects) {
  const cards = projects.map(project => `<article class="project-card">
          <a class="project-card__link" href="/projects/${project.slug}/" aria-label="Explore the ${escapeHtml(project.title)} project">
            <div class="project-card__media"><img src="${project.hero_image}" alt="${escapeHtml(project.hero_alt)}" width="1200" height="675"${project.sort_order > 2 ? ' loading="lazy"' : ''}></div>
            <div class="project-card__body">
              <div class="project-badges">${badges(project)}</div>
              <h2>${escapeHtml(project.title)}</h2>
              ${project.subtitle ? `<p class="project-subtitle">${escapeHtml(project.subtitle)}</p>` : ''}
              <p>${escapeHtml(project.description)}</p>
              <span class="project-card__cta">Explore project <span aria-hidden="true">→</span></span>
            </div>
          </a>
        </article>`).join('\n');
  return `<!doctype html><html lang="en"><head>${head({title: 'Projects — Dean L. Young', description: 'Project scopes and build notes from Dean L. Young across hardware, software, AI, and the connected home.', canonical: 'https://deanlyoung.com/projects/', image: '/assets/projects/awair-local/hero.svg'})}</head>
<body><div class="site-shell site-shell--projects"><header class="site-header"><nav class="nav">${nav('projects')}</nav></header>
<main class="content page-content projects-index"><header class="projects-intro"><p class="eyebrow">Selected work</p><h1>Products, systems, and the decisions behind them.</h1><p class="section-lead">Public product briefs with the practical details needed to understand what shipped, what remains, and how each project was built.</p></header><div class="project-grid">${cards}</div></main>${footer()}</div><script src="/js/scripts.js"></script></body></html>`;
}

function projectPage(project) {
  const platforms = project.platforms.map(escapeHtml).join(' · ');
  const links = project.links.length ? `<div class="project-links">${project.links.map(link => `<a class="button button--secondary" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join('')}</div>` : '<p class="project-availability">No public source or download is available.</p>';
  const rendered = marked.parse(project.markdown);
  const body = rendered.replace(/<h2>(.*?)<\/h2>\n([\s\S]*?)(?=<h2>|$)/g, '<section class="project-section"><h2>$1</h2><div class="project-section__body">$2</div></section>');
  return `<!doctype html><html lang="en"><head>${head({title: `${project.title} — Projects — Dean L. Young`, description: project.description, canonical: `https://deanlyoung.com/projects/${project.slug}/`, image: project.hero_image})}</head>
<body><div class="site-shell site-shell--projects"><header class="site-header"><nav class="nav">${nav('projects')}</nav></header>
<main class="content page-content project-detail"><p class="project-back"><a href="/projects/">← All projects</a></p><header class="project-hero"><div class="project-hero__copy"><div class="project-badges">${badges(project)}</div><p class="eyebrow">Project scope</p><h1>${escapeHtml(project.title)}</h1>${project.subtitle ? `<p class="project-hero__subtitle">${escapeHtml(project.subtitle)}</p>` : ''}<p class="project-dek">${escapeHtml(project.description)}</p>${links}</div><img src="${project.hero_image}" alt="${escapeHtml(project.hero_alt)}" width="1200" height="675"></header>
<dl class="project-facts"><div><dt>Role</dt><dd>${escapeHtml(project.role)}</dd></div><div><dt>Timeframe</dt><dd>${escapeHtml(project.timeframe)}</dd></div><div><dt>Platforms</dt><dd>${platforms}</dd></div></dl>
<article class="project-brief">${body}</article></main>${footer()}</div><script src="/js/scripts.js"></script></body></html>`;
}

function main() {
  const projects = loadProjects();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), projectIndex(projects));
  projects.forEach(project => {
    const dir = path.join(OUTPUT_DIR, project.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), projectPage(project));
    console.log(`Built: /projects/${project.slug}/`);
  });
  console.log(`Built Projects index with ${projects.length} projects.`);
}

main();
