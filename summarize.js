#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const MAX_SUMMARY_LENGTH = 297; // 300 total minus "..." (3 chars)

// Parse CLI arguments
function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    batch: false,
    postFile: null,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--batch') parsed.batch = true;
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--post' && i + 1 < args.length) {
      parsed.postFile = args[i + 1];
      i++;
    }
  }
  return parsed;
}

// Strip markdown links `[text](url)` → `text`
function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
}

// Strip reference-style link definitions `[label]: url`
function stripReferenceDefinitions(text) {
  return text.replace(/^\s*\[[^\]]+\]:\s+.+$/gm, '');
}

// Remove all URLs and URL patterns from text
function stripUrls(text) {
   // Remove bare URLs (http://, https://, ftp://)
  text = text.replace(/(?:https?:\/\/|ftp:\/\/)[^\s]*/g, '');
   // Remove email links mailto:
  text = text.replace(/mailto:[^\s]*/g, '');
   // Remove image markdown with URLs ![alt](url) → alt (but keep alt for accessibility)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  return text;
}

// Strip frontmatter (YAML block between --- delimiters)
function stripFrontmatter(raw) {
  const trimmed = raw.trimStart();
   // Match YAML frontmatter: starts with --- and has closing ---
  if (!trimmed.startsWith('---')) return raw;
  
  const closingDelimiter = trimmed.indexOf('---', 3);
  if (closingDelimiter === -1) return raw;
  
   // Return everything after the closing --- and any trailing blank lines
  const afterFrontmatter = trimmed.substring(closingDelimiter + 3).trimStart();
  return afterFrontmatter;
}

// Process body text into a clean summary string
function summarizeBody(body) {
   // Step 1: Strip frontmatter (just in case there's residual)
  let text = stripFrontmatter(body);
  
   // Step 2: Strip markdown links — keep the link text, remove URL
  text = stripMarkdownLinks(text);
  
   // Step 3: Strip reference-style definitions
  text = stripReferenceDefinitions(text);
  
   // Step 4: Remove URLs
  text = stripUrls(text);
  
   // Step 5: Remove headings (## markers)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
   // Step 6: Replace newlines with spaces (collapse paragraphs)
  text = text.replace(/\r\n/g, ' ');   // Windows line endings
  text = text.replace(/\n/g, ' ');      // Unix line endings
  
   // Step 7: Collapse multiple spaces into one
  text = text.replace(/ {2,}/g, ' ');
  
   // Step 8: Trim leading/trailing whitespace
  text = text.trim();
  
   // Step 9: Truncate to ≤ 297 chars at a word boundary
  if (text.length > MAX_SUMMARY_LENGTH) {
     // Find the last space before position 297
    let cutOff = text.lastIndexOf(' ', MAX_SUMMARY_LENGTH);
    
     // If no space found, hard-truncate
    if (cutOff === -1 || cutOff < MAX_SUMMARY_LENGTH * 0.5) {
      cutOff = MAX_SUMMARY_LENGTH;
       // Back up to nearest space from the hard cutoff
      let backupCut = text.lastIndexOf(' ', MAX_SUMMARY_LENGTH);
      if (backupCut > 0) {
        cutOff = backupCut;
       }
    }
    
    text = text.substring(0, cutOff).trim();
  }
  
   // Step 10: Append ellipsis
  text = text + '...';
  
  return text;
}

// Process a single post file
function processPost(filepath, filename) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const matter = require('gray-matter');
  const parsed = matter(raw);
  
   // Summarize the body
  const summary = summarizeBody(parsed.content);
  
  return {
    filepath,
    filename,
    oldSummary: parsed.data.summary || '(empty)',
    newSummary: summary,
    matter: parsed,
  };
}

// Update a post's frontmatter summary field
function updatePost(filepath, newSummary) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const matter = require('gray-matter');
  const parsed = matter(raw);
  
   // Replace the summary field
  parsed.data.summary = newSummary;
  
   // Rewrite the file with updated frontmatter
  const updated = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filepath, updated);
}

function main() {
  const args = parseArgs(process.argv);
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('ERROR: Content directory does not exist:', CONTENT_DIR);
    process.exit(1);
  }
  
  let targetFiles;
  
  if (args.postFile) {
     // Process a single specified file
    const exists = fs.existsSync(path.join(CONTENT_DIR, args.postFile));
    if (!exists) {
      console.error(`ERROR: Post not found: ${args.postFile}`);
      process.exit(1);
    }
    targetFiles = [args.postFile];
     console.log(`Targeted post: ${args.postFile}\n`);
   } else {
     // Batch mode: process all markdown files
    targetFiles = fs.readdirSync(CONTENT_DIR).filter(name => name.endsWith('.md'));
     console.log(`Processing ${targetFiles.length} posts...\n`);
  }
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const filename of targetFiles) {
    const filepath = path.join(CONTENT_DIR, filename);
    
     // Skip already-locked posts (editorial_review all true) — optional, but useful in batch
     // We process ALL posts in summarize since summaries are independent of editorial review
    
    try {
      const result = processPost(filepath, filename);
      
       // Print summary for each post
      console.log(`  ${filename}`);
      console.log(`    Old: "${result.oldSummary}"`);
      console.log(`    New: "${result.newSummary}"`);
      console.log(`    Length: ${result.newSummary.length} chars (max 300)\n`);
      
      if (args.dryRun) {
         // In dry-run mode, just print — don't modify files
        console.log(`  [DRY RUN] Would update: ${filename}`);
        console.log('');
       } else {
         // Write the updated summary to frontmatter
        updatePost(filepath, result.newSummary);
        console.log(`  ✓ Updated: ${filename}`);
        console.log('');
        updatedCount++;
       }
     } catch (err) {
      console.log(`  ✗ ERROR processing ${filename}: ${err.message}\n`);
      skippedCount++;
    }
  }
  
   // Summary output
  if (args.dryRun) {
    console.log(`\nDRY RUN COMPLETE. No files were modified.`);
    console.log(`Would process ${targetFiles.length} post(s).\n`);
   } else {
    console.log(`\nSUMMARIZE COMPLETE.`);
    console.log(`Updated: ${updatedCount} post(s)`);
    console.log(`Skipped: ${skippedCount} post(s)\n`);
  }
}

main();