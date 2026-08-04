# Editorial Review-to-Publish Automation Plan

## Overview

This document describes the plan for automating the editorial review process for deanlyoung.com's blog posts. The system uses a local LLM (ollama with qwen3.6:35b-mlx) to evaluate posts against 7 editorial criteria defined in `EDITORIAL-STANDARD.md`, then automatically writes frontmatter when all criteria pass.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL (your machine)                                         │
│                                                               │
│   1. npm run editorial-agent --dry-run    ← LLM reviews all  │
│      content/blog/*.md via ollama qwen3.6:35b-mlx            │
│                                                               │
│   2. Fix any failing posts manually                             │
│                                                               │
│   3. npm run editorial-agent --apply      ← Writes           │
│      editorial_review frontmatter (all true)                   │
│       ...but ONLY for posts that pass ALL 7 criteria          │
│      Posts with failures get a REVIEW-REPORT.md instead       │
│                                                               │
│   4. npm run review                       ← Structural       │
│      checks only (fast, no LLM). Exits non-zero if fail      │
│                                                               │
│   5. npm run build                        ← HTML generation  │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             │ git push origin main
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (cloud, .github/workflows/build.yml)          │
│                                                               │
│  Step 1: npm install                                           │
│  Step 2: npm run review    ← structural checks                 │
│          Exits non-zero → workflow STOPS                        │
│          Passes → workflow continues                           │
│  Step 3: npm build → generates HTML                            │
│  Step 4: Commit/push generated files to main                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `review.js` | **CREATE** | Structural/formatting checks. Replaces the missing `review.js`. `npm run review` runs this. Exits non-zero on failure. CI uses this. |
| `review-agent.js` | **CREATE** | LLM-powered editorial agent. `npm run editorial-agent -- --batch --dry-run`. Connects to ollama at `http://localhost:11434`, model `qwen3.6:35b-mlx`. |
| `build.js` | **MODIFY** | Stripped down — HTML generation only, no editorial logic removed. |

### Package.json Change

```json
"editorial-agent": "node review-agent.js"
```

---

## `review.js` — Structural Checks (detailed spec)

**CLI:** `npm run review` → `node review.js`

**Behavior:**
- Reads all `content/blog/*.md` files
- For each file, validates:
  1. **Frontmatter:** `title` (non-empty string), `date` (YYYY-MM-DD pattern), `summary` (≤300 chars, non-empty), `slug` (lowercase hyphenated alphanumeric matching `/^[a-z0-9]+(-[a-z0-9]+)*$/`)
  2. **Reference links:** every `[ref]` used is defined and every defined ref is used
  3. **Footnotes:** every `[^id]` referenced is defined and every defined footnote is referenced
  4. **Heading hierarchy:** no level skips (e.g., # to ### without ##)
  5. **Images:** all `![alt](url)` have non-empty alt text
  6. **Trailing whitespace:** no lines end with spaces/tabs
  7. **Blank lines:** no 3+ consecutive blank lines
  8. **Content:** body is non-empty after frontmatter

**Output:**
- Lists each file with pass/fail status
- For failures, shows which checks failed and why
- **Exits 0** if ALL files pass ALL checks
- **Exits 1** if ANY file fails ANY check

---

## `review-agent.js` — LLM Editorial Agent (detailed spec)

### CLI Options

```
npm run editorial-agent -- --dry-run       → Evaluate without modifying anything, output REVIEW-REPORT.md
npm run editorial-agent -- --apply         → Write frontmatter for passing posts only
npm run editorial-agent -- --batch         → Combine dry-run + apply (skip human confirmation prompt)
npm run editorial-agent -- --post FILE     → Process only the specified markdown file
```

### Core Logic

1. Scans `content/blog/*.md` for unreviewed posts
2. A post is **"unreviewed"** if:
   - No `editorial_review` block exists, OR
   - `editorial_review.reviewed !== true`, OR
   - Any of the 7 criteria booleans are not `true`
3. **A post is "locked"** and SKIPPED entirely if:
   - `editorial_review.reviewed === true` AND all 7 criteria are `true`
4. For each unreviewed post, calls ollama API with criterion-specific prompts
5. Each criterion returns `{ pass: boolean, score: 0-100, notes: string }`
6. **All 7 must pass** for the post to receive frontmatter update

### Per-Criterion Prompt Templates

Each criterion gets a tailored prompt that gives the LLM context about what to evaluate. Example for `personally_specific`:

```
You are an editorial reviewer evaluating a blog post against the "personally_specific" criterion.

Definition: The writing is grounded in your own experience, perspective, or analysis.
It is not generic commentary that anyone could have written. A reader should come away
knowing what YOU think, not just what was said.

Self-assessment question: Could only I have written this? Does it reflect my specific vantage point?

Post content:
{CONTENT}

Respond with JSON ONLY (no markdown fences, no extra text):
{
  "pass": true/false,
  "score": 0-100,
  "notes": "brief explanation of your assessment"
}
```

### How review-agent.js Uses Ollama qwen3.6:35b-mlx (Detailed)

The editorial agent uses ollama as a **local inference server** running on `http://localhost:11434`. No API keys, no cloud calls — everything runs entirely on your machine's GPU/CPU.

#### Step 1: Pre-flight Check
Before any LLM calls, the script performs a simple HTTP GET to verify ollama is reachable:
```javascript
const healthCheck = await fetch('http://localhost:11434/api/tags');
```
If this fails (ollama not running, model not pulled), it prints an error and exits immediately — no LLM calls are wasted.

#### Step 2: Criterion Discovery (Dynamic, Not Hardcoded)
The script reads `EDITORIAL-STANDARD.md` and parses all `### N. \`criteria_name\`` headings using regex. Each criterion's name, definition, and self-assessment question are extracted into an array at runtime. This means if you add/remove/modify criteria in the markdown file, the agent automatically picks them up — no code changes needed.

For 36 posts with 7 criteria, that's up to 252 individual LLM calls (36 × 7). For a batch run with --batch, it does all 36 posts; for --post, just one.

#### Step 3: Per-Criterion Evaluation Loop
For each unreviewed post, the script iterates through every loaded criterion and makes an **individual ollama API call per criterion**. This is not a single prompt evaluating all criteria at once — it's N separate calls, one per criterion.

Each API call follows this exact structure:

**a) Prompt Construction:**
The prompt is built as a multi-line string:
```
You are an editorial reviewer evaluating a blog post against the "personally_specific" criterion.

Definition: The writing is grounded in your own experience, perspective, or analysis.
It is not generic commentary that anyone could have written...

Self-assessment question: Could only I have written this? Does it reflect my specific vantage point?

Post content:
{INSERTS ENTIRE BLOG POST BODY (stripped of frontmatter)}

Evaluate the post strictly against this criterion. Return JSON ONLY (no markdown fences, no extra text):
{
   "pass": true/false,
   "score": 0-100,
   "notes": "brief explanation"
}
```

**b) ollama API Request:**
The request is a POST to `http://localhost:11434/api/generate` with this exact JSON body:
```json
{
  "model": "qwen3.6:35b-mlx",
  "prompt": "...the prompt text above...",
  "format": {
    "type": "object",
    "properties": {
      "pass": { "type": "boolean" },
      "score": { "type": "integer", "minimum": 0, "maximum": 100 },
      "notes": { "type": "string" }
    }
  },
  "stream": false
}
```

**c) Key ollama-specific details:**
- **`model: "qwen3.6:35b-mlx"`** — The `mlx` variant is Apple's MLX quantized format, optimized for Apple Silicon (M1/M2/M3) Macs. This model has 35 billion parameters and uses mixed-precision loading to fit in your Mac's unified memory.
- **`format:`** — ollama's structured output feature forces the model to return valid JSON matching this schema. Without this, the LLM could return freeform text that would fail parsing. The `format` parameter is an ollama-native feature (not OpenAI-compatible).
- **`stream: false`** — Returns the complete response in a single HTTP response. This is important because we need valid JSON to parse; streaming would make it impossible.
- **No temperature/top_p override** — ollama uses its defaults (typically temperature=0.6, top_p=0.9) which provide a balance of creativity and determinism suitable for editorial evaluation.

**d) Response Parsing:**
The ollama response is JSON with this structure:
```json
{
  "model": "qwen3.6:35b-mlx",
  "created_at": "...",
  "response": "{\"pass\":true,\"score\":92,\"notes\":\"...\"}",
  "done": true,
  "total_duration": 4500000000,
  "load_duration": 1200000000,
  "prompt_eval_count": 1500
}
```
The `response` field is a **stringified JSON** (ollama returns it as raw text). The script calls `JSON.parse(data.response)` to extract the actual evaluation object.

#### Step 4: Response Parsing & Validation
For each criterion result, the script validates:
- **`pass`** must be a boolean (`true` or `false`). If missing or wrong type → defaults to `false`.
- **`score`** must be a number between 0-100. If missing or out of range → defaults to `0`.
- **`notes`** must be a string. If missing → defaults to `"Could not parse assessment notes."`.

If the ollama call throws an error (network timeout, model not found, OOM), the criterion is marked as `{ pass: false, score: 0, notes: "LLM API error: <error message>" }`. This ensures a failing LLM connection will flag posts for human review rather than auto-approving them.

#### Step 5: Aggregation Per Post
After all N criteria are evaluated for a single post, the script checks:
- **If ALL criteria returned `pass: true`** → the post passes editorial review.
- **If ANY criterion returned `pass: false`** → the post fails and gets feedback written to `review-output/<slug>-feedback.md`.

A post only receives the `editorial_review` frontmatter lock (all true) when every single criterion passed.

#### Step 6: Output Generation
Depending on the mode:
- **`--dry-run`**: Writes `review-output/REVIEW-REPORT.md` — a markdown table showing each post, each criterion's pass/fail/score/notes. Does NOT touch any `content/blog/*.md` files.
- **`--apply`**: For posts passing all criteria, writes or overwrites the `editorial_review` frontmatter block. Sets `reviewed: true`, adds current date, and sets every loaded criterion to `true`. Failing posts get individual feedback files in `review-output/`. Locked posts (already approved) are completely skipped — no LLM calls, no file reads, no writes.
- **`--batch`**: Same as --apply but skips the human confirmation prompt.

#### Full Request/Response Cycle for One Criterion Call

```
┌──────────────────────────┐
|  review-agent.js         |
|                          |
|  For post "lemons.md"    |
|  For criterion           |
|  "personally_specific":  |
|                          |
|  1. BUILD PROMPT        |
|     (post body + def + q) |
|                          |
|  2. POST to             |
|     localhost:11434/      |
|     api/generate         |
|     model: qwen3.6:35b-mlx|
|                          |
├──────────────────────────┤
|    ollama server         |
|    (running locally)     |
|                          |
|    Loads qwen3.6:35b-mlx  |
|    into MLX/VRAM memory   |
|    (if not already loaded)|
|                          |
|    Runs inference:       |
|    input = prompt        |
|    output = JSON string   |
└────────────┬─────────────┘
             │
             │ HTTP Response (JSON)
             │ {
             │   "response": "{\"pass\":true,\"score\":90,\"notes\":\"...\"}",
             │   "done": true,
             │   "total_duration": 4200000000
             │ }
             ▼
┌──────────────────────────┐
|  review-agent.js         |
|                          |
|  JSON.parse(response)   |
|  → { pass: true,        |
|      score: 90,          |
|      notes: "..." }      |
|                          |
|  Store in results[]     |
|  (for this post)         |
└──────────────────────────┘
```

#### ollama Server Requirements

The script assumes ollama is installed and the model is pre-pulled:
```bash
# Pull the model once before running
ollama pull qwen3.6:35b-mlx

# Verify it's loaded
ollama list
```

Start the local server with:
```bash
# Usually automatic if ollama is installed
# Or manually:
ollama serve
```

The script does NOT check for model availability — you must ensure `qwen3.6:35b-mlx` is pulled and running on port 11434 before the first run. If ollama is not running, every criterion call will fail with a connection error and each post will be flagged for human review.

#### Performance Characteristics

- **Model size**: ~22 GB RAM for qwen3.6:35b-mlx (MLX quantized format)
- **First-call latency**: ~3-10 seconds (model load into unified memory on Apple Silicon)
- **Subsequent calls**: ~1-3 seconds per criterion (model already in VRAM/RAM)
- **36 posts × 7 criteria** = ~252 LLM calls
- **Estimated total time**: 7-15 minutes (batch mode, local machine)
- **Memory usage**: Peak ~25 GB RAM on a Mac with 32 GB (model + Node.js overhead)

### Output Modes

- **`--dry-run`**: Writes `review-output/REVIEW-REPORT.md` with a table of all posts and pass/fail per criterion. Does NOT modify any content files.
- **`--apply`**: For each post where all 7 criteria passed, appends or updates the `editorial_review` frontmatter block. For failing posts, creates `review-output/<slug>.md` with detailed feedback. DOES NOT touch locked posts (all true).
- **`--batch`**: Runs dry-run first, prints report, then prompts "Apply changes? [y/N]". If yes, runs apply logic.

### Lock Behavior (critical)

Once a post has `editorial_review.reviewed === true` and all 7 criteria `true`, the script MUST:
- Skip the post entirely (no LLM call)
- Not read, not touch, not modify its frontmatter
- Count it as "already approved" in the report

---

## `build.js` — Stripped Down

### Removed
- `EDITORIAL_CRITERIA` array
- `editorialReviewWarnings()` function
- `isEditoriallyApproved()` function
- `printEditorialWarnings()` function
- The call to `printEditorialWarnings()` in `main()`
- All editorial gating from the build loop (posts are no longer skipped based on review status — build generates HTML for all posts)

### Kept
- All HTML template building functions
- Metadata loading (slug, title, summary, date)
- Index and RSS generation
- Orphan cleanup (`cleanOrphans()`)

---

## Post-Implementation Workflow

1. **Run `npm run review`** on all 40 existing posts to verify structural integrity
2. **Run `npm run editorial-agent -- --batch --dry-run`** to assess all 40 against the 7 criteria
3. **Iterate on failing posts** manually (edit markdown content) + re-run agent until they pass
4. **Run `npm run editorial-agent -- --batch --apply`** to lock frontmatter on all passing posts
5. **Commit and push** — CI runs `npm run review`, then `npm run build`, deploys

---

## Editorial Criteria Summary

| Criterion | Definition Summary | Self-Assessment Question |
|-----------|-------------------|-------------------------|
| `personally_specific` | Grounded in your own experience, perspective, or analysis | Could only I have written this? Does it reflect my specific vantage point? |
| `intellectually_honest` | Honest about what you know/don't know, not overstating certainty | Am I presenting speculation as fact? Am I acknowledging what I don't know? |
| `generous_to_subjects` | People described are treated fairly, charitably represented | Would the people I describe recognize themselves and feel fairly represented? |
| `observation_separated_from_fact` | Observations distinguishable from verifiable facts | Can a reader tell which of my claims are personal observations and which are verifiable facts? |
| `date_bound_advice_dated` | Time-specific advice is explicitly dated | If someone reads this in two years, will they know which parts were time-specific? |
| `opinions_earned` | Strong opinions backed by evidence, scope, consequences | Have I earned this opinion? What evidence supports it? What's the scope? |
| `rights_cleared` | Right to publish all material, quoted text attributed | Is everything in this post mine to share? Are quotes attributed? Are images licensed? |

All 7 criteria must be `true` for a post to pass editorial review.

---

## GitHub Action Gate (build.yml)

**No changes needed.** The existing `.github/workflows/build.yml` already:
1. Runs `npm run review` before build (exits non-zero on failure → blocks deployment)
2. Runs `npm run build` after review passes (generates HTML)

The new `review.js` simply replaces the missing one and provides the structural check layer that CI depends on. The LLM-powered editorial agent runs locally, not in CI.

---

## Human-in-the-Loop Workflow (for New Posts Going Forward)

For every NEW post created going forward:

1. Human writes `content/blog/my-post.md` with proper frontmatter + `editorial_review` block (all false initially)
2. Human runs `npm run editorial-agent --dry-run` to assess
3. Human edits post content based on feedback
4. Re-runs until all 7 criteria pass
5. Commits and opens PR
6. CI runs `npm run review` (structural checks) → passes
7. CI runs `npm run build` → generates HTML

---

## File Structure After Implementation

```
.clinerules
.gitignore
build.js               ← cleaned up, HTML-only (no editorial logic)
review.js              ← NEW: structural/formatting checks (exits non-zero)
review-agent.js        ← NEW: LLM-powered editorial agent (ollama)
EDITORIAL-STANDARD.md ← unchanged
package.json           ← adds "editorial-agent": "node review-agent.js"
.github/workflows/build.yml   ← unchanged (already calls npm run review)
content/blog/*.md      ← all gain editorial_review frontmatter during bulk review