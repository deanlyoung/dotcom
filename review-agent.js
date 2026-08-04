#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const REVIEW_OUTPUT_DIR = path.join(ROOT, 'review-output');
const STANDARD_PATH = path.join(ROOT, 'EDITORIAL-STANDARD.md');

// Ollama configuration
const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://localhost:11434';
const MODEL = 'qwen3.6:35b-mlx';
const FETCH_TIMEOUT_MS = 90000; // 90 seconds for large model loading

// Dynamically load editorial criteria from EDITORIAL-STANDARD.md
function loadEditorialStandard() {
  const raw = fs.readFileSync(STANDARD_PATH, 'utf8');
  const lines = raw.split('\n');
  const criteria = [];

   // Find the "## Editorial Criteria" section
  let inCriteriaSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '## Editorial Criteria') {
      inCriteriaSection = true;
      continue;
     }

    if (inCriteriaSection && line.startsWith('###')) {
       // This is a criterion heading: "### 1. `personally_specific`" or "### `personally_specific`"
      const match = line.match(/^###\s+\d*\.\s+`([^`]+)`/);
      if (match) {
        const name = match[1];

         // Collect definition lines after the heading
        let definitionLines = [];
        let j = i + 1;

        while (j < lines.length && !lines[j].startsWith('###')) {
          const defLine = lines[j].trim();
          if (defLine === '' || defLine.startsWith('**Ask:**')) break;
          definitionLines.push(defLine);
          j++;
         }

         // Collect **Ask:** line
        let question = '';
        while (j < lines.length) {
          const askLine = lines[j].trim();
          if (askLine.startsWith('**Ask:**')) {
            question = askLine.replace(/^\*\*Ask:\s*/i, '').replace(/\*\*$/, '').trim();
            break;
           } else {
            break;
           }
          j++;
         }

        let defRaw = definitionLines.join(' ').replace(/^>\s*/, '');
        if (definitionLines.length === 0 && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('> ')) {
            defRaw = nextLine.replace(/^>\s*/, '');
           }
         }

        criteria.push({
          name,
          definition: defRaw || 'Not found in EDITORIAL-STANDARD.md',
          question: question || '',
          headingNumber: match[0].replace(/^###\s+/, '').trim(),
         });
       }
     }
   }

  return criteria;
}

// Parse CLI arguments
function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    dryRun: false,
    apply: false,
    batch: false,
    postFile: null,
   };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--apply') parsed.apply = true;
    else if (arg === '--batch') parsed.batch = true;
    else if (arg === '--post' && i + 1 < args.length) {
      parsed.postFile = args[i + 1];
      i++;
     }
   }
   // Default: if no flags, act as --dry-run
  if (!parsed.dryRun && !parsed.apply && !parsed.batch) {
    parsed.dryRun = true;
   }
  return parsed;
}

// Get the markdown file path for a given file
function getPostPath(filename) {
  return path.join(CONTENT_DIR, filename);
}

// Check if a post is "locked" (editorial review completed — reviewed: true with date set)
// Gating: only posts with editorial_review.reviewed === true AND date present can be published
function isLocked(parsedMatter) {
  const review = parsedMatter.data.editorial_review;
  if (!review || typeof review !== 'object') return false;
  if (review.reviewed !== true) return false;
  if (!review.date || String(review.date).trim() === '') return false;
  return true;
}

// Build the LLM prompt for a single criterion — score only, no pass/fail
function buildCriterionPrompt(criterion, content) {
  const prompt = [
     `You are an editorial reviewer evaluating a blog post against the "${criterion.name}" editorial standard.`,
     '',
     `Definition: ${criterion.definition}`,
     '',
     `Self-assessment question: ${criterion.question}`,
     '',
       `Your task: Assign a score from 0 to 100 based on how well the post meets this criterion.`,
       `Provide a "improvements" field — a concise list of actionable suggestions to improve the post on this criterion, IF applicable. Each suggestion must be specific enough that the author can act on it without re-reading the full post.`,
     '',
     `Post content:`,
    content.slice(0, 6000), // Cap content length to avoid exceeding token limits
     '',
     'Return JSON ONLY (no markdown fences, no extra text):',
     '{',
     '   "score": number between 0 and 100,',
     '   "notes": "brief summary of your assessment",',
     '   "improvements": [',
     '     "specific, actionable suggestion 1 that the author can act on",',
     '     "specific, actionable suggestion 2"',
     '   ]',
     '}',
   ].join('\n');
  return prompt;
}

// Call ollama API to evaluate a post against one criterion
async function evaluateCriterion(criterion, content) {
  const prompt = buildCriterionPrompt(criterion, content);

  const body = JSON.stringify({
    model: MODEL,
    prompt: prompt,
    format: {
      type: 'object',
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        notes: { type: 'string' },
        improvements: {
          type: 'array',
          items: { type: 'string' },
         },
       },
      },
     stream: false,
    });

   // Create an AbortController with a timeout to prevent hanging on slow inference
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(OLLAMA_BASE + '/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      signal: controller.signal,
     });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('ollama HTTP error: ' + response.status + ' ' + response.statusText);
     }

    const data = await response.json();
    let jsonStr = (data.response || '').trim();

     // Try to extract JSON from code blocks if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n([\s\S]*?)\n```\s*/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
     }

     // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*"score"[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
     }

    const result = JSON.parse(jsonStr);

    return {
      score: (typeof result.score === 'number' && result.score >= 0 && result.score <= 100) ? result.score : 0,
      notes: result.notes || 'Could not parse assessment notes.',
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
     };
   } catch (err) {
    clearTimeout(timeoutId);
     // If it was an abort (timeout), report that
    if (err.name === 'AbortError') {
      return { score: 0, notes: 'ollama request timed out after ' + (FETCH_TIMEOUT_MS / 1000) + ' seconds', improvements: [] };
     }
     // For all other errors (HTTP, JSON parse), report as API error
    return { score: 0, notes: 'LLM API error: ' + err.message, improvements: [] };
   }
}

// Evaluate a single post against all criteria — score only, no pass/fail
async function evaluatePost(filepath, filename) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const matter = require('gray-matter');
  const parsed = matter(raw);

   // Skip locked posts — no LLM calls (reviewed: true + date set = can publish)
  if (isLocked(parsed)) {
    return {
      filename,
      locked: true,
      results: null,
     };
   }

  const criteria = loadEditorialStandard();
  const results = [];

  for (const criterion of criteria) {
    const result = await evaluateCriterion(criterion, parsed.content);
    results.push({ criterion: criterion.name, ...result });
   }

  return {
    filename,
    locked: false,
    results,
   };
}

// Ensure the review output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(REVIEW_OUTPUT_DIR)) {
    fs.mkdirSync(REVIEW_OUTPUT_DIR, { recursive: true });
   }
}

// Generate the REVIEW-REPORT.md (score-only, no pass/fail)
function generateReport(postResults, mode) {
  ensureOutputDir();

  const criteriaCount = loadEditorialStandard().length;

  var report = '# Editorial Review Report (' + mode + ')\n\n';
  report += 'Date: ' + new Date().toISOString() + '\n';
  report += 'Model: ' + MODEL + '\n\n';
  report += '## Summary Table\n\n';
  report += '| Post | Avg Score |\n';
  report += '|------|-----------|\n';

  for (var ri = 0; ri < postResults.length; ri++) {
    var res = postResults[ri];
    if (!res.results || !res.results.length) {
      report += '| ' + res.filename + ' | (locked) |\n';
      continue;
     }
    var avgScore = Math.round(res.results.reduce(function(s, r) { return s + r.score; }, 0) / res.results.length);
    report += '| ' + res.filename + ' | ' + avgScore + '% |\n';
   }

  report += '\n## Details\n\n';

  for (var pi = 0; pi < postResults.length; pi++) {
    var result = postResults[pi];
    if (result.locked) {
      report += '### ' + result.filename + ' (locked — editorial review completed)\n\n';
      report += 'Editorial review is complete (`reviewed: true`). No re-evaluation was performed.\n\n';
      continue;
     }

    report += '### ' + result.filename + '\n\n';
    var avgScore = Math.round(result.results.reduce(function(s, r) { return s + r.score; }, 0) / result.results.length);
    report += '**Average Score: ' + avgScore + '%**\n\n';
    report += '| Criterion | Score |\n';
    report += '|-----------|-------|\n';

    for (var ci2 = 0; ci2 < result.results.length; ci2++) {
      var cr = result.results[ci2];
      report += '| ' + cr.criterion + ' | ' + cr.score + ' |\n';
     }

    report += '\n';
   }

   // Calculate totals
  var total = postResults.length;
  var locked = 0;
  var evaluated = [];
  for (var ti = 0; ti < postResults.length; ti++) {
    if (postResults[ti].locked) locked++;
    else evaluated.push(postResults[ti]);
   }

  report += '\n## Totals\n\n';
  report += '- Total posts: ' + total + '\n';
  report += '- Locked (reviewed): ' + locked + '\n';
  report += '- Evaluated: ' + evaluated.length + '\n\n';

  var reportPath = path.join(REVIEW_OUTPUT_DIR, 'REVIEW-REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log('Report written to: ' + reportPath);

  return { total: total, locked: locked, evaluated: evaluated.length };
}

// Generate detailed per-post analysis files with score-only output in review-output/
function generateAnalysisFiles(postResults) {
  ensureOutputDir();
  const criteria = loadEditorialStandard();

  for (const result of postResults) {
      // Skip locked posts — no results to analyze
    if (result.locked || !result.results) {
      console.log('  Skipping (locked): ' + result.filename);
      continue;
      }

    const baseName = path.basename(result.filename, '.md');
    const analysisPath = path.join(REVIEW_OUTPUT_DIR, baseName + '-analysis.md');

    var analysis = '# Editorial Analysis: ' + result.filename + '\n\n';
    analysis += 'Date: ' + new Date().toISOString() + '\n';
    analysis += 'Model: ' + MODEL + '\n\n';

    var avgScore = Math.round(result.results.reduce(function(s, r) { return s + r.score; }, 0) / result.results.length);
    analysis += '**Overall Average Score: ' + avgScore + '%**\n\n';

    for (const criterionResult of result.results) {
      const criterion = criteria.find(c => c.name === criterionResult.criterion);
      const criterionDef = criterion ? criterion.definition : 'Unknown criterion';
      const criterionQ = criterion ? criterion.question : '';

      analysis += '## ' + criterionResult.criterion + '\n\n';
      analysis += '**Score: ' + criterionResult.score + '/100**\n\n';
      analysis += '**Assessment:** ' + criterionResult.notes + '\n\n';

      if (criterionDef) {
        analysis += '> **Criterion Definition:** ' + criterionDef + '\n\n';
       }

      if (criterionQ) {
        analysis += '> **Self-Assessment Question:** ' + criterionQ + '\n\n';
       }

      // Always show improvements when available
      if (criterionResult.improvements && criterionResult.improvements.length > 0) {
        analysis += '### Suggestions for Improvement\n\n';
        for (var si = 0; si < criterionResult.improvements.length; si++) {
          analysis += (si + 1) + '. ' + criterionResult.improvements[si] + '\n';
         }
        analysis += '\n';
       }

      analysis += '\n---\n\n';
     }

     // Summary section
    analysis += '## Summary & Next Steps\n\n';
    if (avgScore >= 70) {
      analysis += 'This post has strong scores across all criteria. It is ready for editorial review and publication.\n\n';
     } else {
      analysis += 'This post could benefit from improvements based on the scoring below.\n\n';
      analysis += 'Address the suggestions above, then re-run the editorial agent to reassess.\n\n';
     }

    fs.writeFileSync(analysisPath, analysis);
    console.log('  Analysis written: review-output/' + baseName + '-analysis.md');
   }
}

// Write editorial_review frontmatter with score-only values
// Gating: editorial_review.reviewed === true AND date present = can be published
// Uses dynamic criteria from EDITORIAL-STANDARD.md
function applyFrontmatter(postResults) {
  const criteria = loadEditorialStandard();
  let passedCount = 0;
  let skippedCount = 0;

  ensureOutputDir();

  for (const result of postResults) {
     // Skip locked posts — never touch editorial_review when already reviewed
    if (result.locked) {
      skippedCount++;
      continue;
     }

     // Build the review block: reviewed date + each criterion's scored value
    const today = new Date();
    const dateStr = today.getUTCFullYear() + '-' +
      String(today.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(today.getUTCDate()).padStart(2, '0');

    const reviewBlock = { reviewed: true, date: dateStr };
    for (const criterion of criteria) {
       // Store the numeric score from LLM evaluation
      const critResult = result.results.find(r => r.criterion === criterion.name);
      reviewBlock[criterion.name + '_score'] = critResult ? critResult.score : 0;
     }

     // Read the current file, update ONLY the frontmatter, leave body untouched
    const filepath = getPostPath(result.filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    const matter = require('gray-matter');
    const parsed = matter(raw);

    parsed.data.editorial_review = reviewBlock;
    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filepath, updated);

     // Log result
    if (result.results && result.results.length > 0) {
      var avg = Math.round(result.results.reduce(function(s, r) { return s + r.score; }, 0) / result.results.length);
      console.log('  Frontmatter updated: ' + result.filename + ' (avg score: ' + avg + '%)');
     } else {
      console.log('  Frontmatter updated: ' + result.filename + ' (no scores available)');
     }

     passedCount++;
   }

  return { passedCount: passedCount, skippedCount: skippedCount };
}

// Main function
async function main() {
  const args = parseArgs(process.argv);

   // Load and display criteria
  const criteria = loadEditorialStandard();
  console.log('');
  console.log('=== LLM-Powered Editorial Agent ===');
  console.log('Criteria loaded from EDITORIAL-STANDARD.md: ' + criteria.length + ' criteria (score only, no pass/fail)');
  for (let ci = 0; ci < criteria.length; ci++) {
    console.log('      - ' + criteria[ci].name);
   }
  console.log('');

  console.log('Mode: ' + (args.dryRun ? '--dry-run' : args.apply ? '--apply' : args.batch ? '--batch (dry-run first)' : 'default') + '\n');
  console.log('Ollama endpoint: ' + OLLAMA_BASE);
  console.log('Model: ' + MODEL);
  console.log('Fetch timeout: ' + (FETCH_TIMEOUT_MS / 1000) + ' seconds\n');

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('ERROR: Content directory does not exist:', CONTENT_DIR);
    process.exit(1);
   }

  const markdownFiles = fs.readdirSync(CONTENT_DIR).filter(name => name.endsWith('.md'));
  if (markdownFiles.length === 0) {
    console.log('No blog posts found.');
    process.exit(0);
   }

  let targetFiles = markdownFiles;

   // If --post is specified, only evaluate that file
  if (args.postFile) {
    const target = markdownFiles.find(f => f === args.postFile || f === args.postFile + '.md');
    if (!target) {
      console.error('ERROR: Post not found: ' + args.postFile);
      process.exit(1);
     }
    targetFiles = [target];
    console.log('Targeted post: ' + target + '\n');
   }

  console.log('Evaluating ' + targetFiles.length + ' post(s)...\n');

  const results = [];

  for (let fi = 0; fi < targetFiles.length; fi++) {
    const filename = targetFiles[fi];
    const filepath = path.join(CONTENT_DIR, filename);
    console.log('Evaluating: ' + filename + '...');
    const result = await evaluatePost(filepath, filename);
    results.push(result);

    if (result.locked) {
      console.log('      -> ' + filename + ': LOCKED (review complete — can publish)');
     } else if (result.results && result.results.length > 0) {
      var scores = result.results.map(r => r.score).join(', ');
      var avg = Math.round(result.results.reduce(function(s, r) { return s + r.score; }, 0) / result.results.length);
      console.log('      -> ' + filename + ': SCORES [' + avg + '%] (' + scores + ')');
     }

     // Small delay to avoid overwhelming the LLM
    await new Promise(resolve => setTimeout(resolve, 500));
   }

  console.log('');

   // Generate detailed per-post analysis files with improvement suggestions
  console.log('Generating detailed analysis files...');
  generateAnalysisFiles(results);
  console.log('');

   // Generate report (summary table)
  const reportMode = args.dryRun ? 'DRY RUN' : args.apply ? 'APPLY' : 'BATCH';
  const reportStats = generateReport(results, reportMode);

  console.log('\nReport: ' + reportStats.total + ' posts, ' +
    reportStats.locked + ' reviewed (can publish), ' +
    reportStats.evaluated + ' evaluated');

   // Apply mode: write frontmatter for ALL non-locked posts (score-only)
  if (args.apply || args.batch) {
    const applyResults = applyFrontmatter(results);
    console.log('\nAPPLY results:');
    console.log('  Updated: ' + applyResults.passedCount + ' post(s) with scores');
    console.log('  Skipped (already reviewed): ' + applyResults.skippedCount + ' post(s)');

    if (!args.batch) {
       // Interactive prompt (only in --apply mode, not --batch which is automated)
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      console.log('\nFailing posts have detailed analysis in review-output/ directory.');
      console.log('Review the -analysis.md files for specific improvement suggestions.');

      const answer = await new Promise(resolve => {
        rl.question('\nCommit these changes? [y/N]: ', resolve);
       });
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Changes not committed. Review and commit manually.');
       } else {
        console.log('Proceed with git commit after review.');
       }
     }

    if (args.batch) {
      console.log('\nFailing posts have detailed analysis in review-output/ directory.');
     }
   }

   // In --batch mode, show both report and apply results
  if (args.batch) {
    console.log('\nBATCH complete: ' + reportStats.total + ' evaluated.');
    console.log('Review analysis files in review-output/ for detailed improvement suggestions.');
   }

  console.log('');
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});