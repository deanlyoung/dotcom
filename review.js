#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Normalize a Date object or string to YYYY-MM-DD for validation.
function normalizeDateForValidation(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  return String(value || '');
}

/**
 * Validate a single markdown file's structure and formatting.
 * Returns an array of error strings (empty means all checks passed).
 */
function validatePost(filepath, filename) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const errors = [];

  // Parse frontmatter using gray-matter
  const matter = require('gray-matter');
  const { data, content } = matter(raw);

  // --- Frontmatter field checks ---
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('frontmatter: title is missing or empty');
  }

  const dateStr = normalizeDateForValidation(data.date);
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    errors.push(`frontmatter: date is missing or not YYYY-MM-DD (got: "${String(data.date || '')}")`);
  }

  if (!data.summary || typeof data.summary !== 'string' || data.summary.trim() === '') {
    errors.push('frontmatter: summary is missing or empty');
  } else if (data.summary.length > 300) {
    errors.push(`frontmatter: summary is ${data.summary.length} chars (max 300 recommended for SEO)`);
  }

  if (!data.slug || typeof data.slug !== 'string') {
    errors.push('frontmatter: slug is missing');
  } else if (!SLUG_REGEX.test(data.slug)) {
    errors.push(`frontmatter: slug "${data.slug}" should be lowercase, hyphenated, alphanumeric only`);
  }

  // --- Reference link checks ---
  const refUsageRegex = /\[([^\]]*)\]\[([^\]]*)\]/g;
  const usedRefs = new Set();
  let match;
  while ((match = refUsageRegex.exec(content)) !== null) {
    const refLabel = (match[2] || match[1]).trim().toLowerCase();
    if (refLabel) usedRefs.add(refLabel);
  }
  const refDefRegex = /^\[(?!\^)([^\]]+)\]:\s+\S+/gm;
  const definedRefs = new Set();
  while ((match = refDefRegex.exec(content)) !== null) {
    definedRefs.add(match[1].trim().toLowerCase());
  }
  for (const ref of usedRefs) {
    if (!definedRefs.has(ref)) {
      errors.push(`markdown: reference link [${ref}] is used but never defined`);
    }
  }
  for (const ref of definedRefs) {
    if (!usedRefs.has(ref)) {
      errors.push(`markdown: reference definition [${ref}]: is defined but never used`);
    }
  }

  // --- Footnote checks ---
  const fnRefRegex = /\[\^([^\]]+)\](?!:)/g;
  const usedFootnotes = new Set();
  while ((match = fnRefRegex.exec(content)) !== null) {
    usedFootnotes.add(match[1].trim());
  }
  const fnDefRegex = /^\[\^([^\]]+)\]:\s+/gm;
  const definedFootnotes = new Set();
  while ((match = fnDefRegex.exec(content)) !== null) {
    definedFootnotes.add(match[1].trim());
  }
  for (const fn of usedFootnotes) {
    if (!definedFootnotes.has(fn)) {
      errors.push(`markdown: footnote [^${fn}] is referenced but never defined`);
    }
  }
  for (const fn of definedFootnotes) {
    if (!usedFootnotes.has(fn)) {
      errors.push(`markdown: footnote [^${fn}]: is defined but never referenced`);
    }
  }

  // --- Heading hierarchy check ---
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let prevLevel = 0;
  let firstHeading = true;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    if (text === '') {
      errors.push(`markdown: heading level ${level} is empty`);
    }
    if (!firstHeading && level > prevLevel + 1) {
      errors.push(`markdown: heading hierarchy skips from h${prevLevel} to h${level} — "${text}"`);
    }
    prevLevel = level;
    firstHeading = false;
  }

  // --- Image alt text check ---
  const imgRegex = /!\[([^\]]*)\]\([^)]+\)/g;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1].trim() === '') {
      errors.push('markdown: image has empty alt text — add a description for accessibility');
    }
  }

  // --- Trailing whitespace check ---
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/[ \t]+$/.test(lines[i])) {
      errors.push(`markdown: trailing whitespace on line ${i + 1}`);
    }
  }

  // --- Excessive blank lines check ---
  let blankCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      blankCount++;
      if (blankCount >= 3) {
        errors.push(`markdown: 3+ consecutive blank lines at line ${i + 1}`);
        break;
      }
    } else {
      blankCount = 0;
    }
  }

  // --- Content present check ---
  if (content.trim() === '') {
    errors.push('markdown: post body is empty (no content after frontmatter)');
  }

  return errors;
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('ERROR: Content directory does not exist:', CONTENT_DIR);
    process.exit(1);
  }

  const markdownFiles = fs.readdirSync(CONTENT_DIR).filter(name => name.endsWith('.md'));
  if (markdownFiles.length === 0) {
    console.log('No blog posts found.');
    process.exit(0);
  }

  let totalErrors = 0;
  let hasFailures = false;

  console.log(`\nEditorial Review — Structural/Formatting Checks`);
  console.log(`Checking ${markdownFiles.length} post(s)...\n`);

  for (const filename of markdownFiles) {
    const filepath = path.join(CONTENT_DIR, filename);
    const errors = validatePost(filepath, filename);

    if (errors.length === 0) {
      console.log(`   ✓ ${filename}`);
    } else {
      hasFailures = true;
      totalErrors += errors.length;
      console.log(`   ✗ ${filename} (${errors.length} error(s))`);
      for (const err of errors) {
        console.log(`       → ${err}`);
      }
    }
  }

  console.log('');

  if (hasFailures) {
    console.log(`FAILED: ${markdownFiles.length} post(s) checked, ${totalErrors} error(s) found.`);
    console.log('Fix the errors above and re-run npm run review.\n');
    process.exit(1);
  } else {
    console.log(`PASSED: All ${markdownFiles.length} post(s) passed structural/formatting checks.`);
    process.exit(0);
  }
}

main();