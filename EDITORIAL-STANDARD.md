# Editorial Standard

## Baseline

> Publish writing that is personally specific, intellectually honest, and generous to the people it describes. Separate observation from fact; date-bound advice stays dated; strong opinions earn their force through evidence, scope, and consequences; remove AI-slop patterns; publish only material you have the right to share.

This standard applies to **every blog post** before it is built into an HTML post and published through automated workflow. No post is deployed without a completed Editorial Review that passes that point in time's Editorial Criteria, which may be subject to change over time, but should not apply to previous articles that passed review and published successfully.

---

## How It Is Enforced

Every post's markdown source (`content/blog/*.md`) must pass two layers of review:

1. **Editorial standard** — the `editorial_review` frontmatter block is complete with all eight criteria set to `false` initially, then the article is systematically and in full assessed (by an Agent) against each Editorial Criteria.
2. **Markdown formatting** — the post is technically correct: frontmatter fields are valid, reference links and footnotes are defined and used, heading hierarchy doesn't skip levels, images have alt text, no trailing whitespace, and content is present.

The build pipeline checks both layers in two places:

| Check | Where | Behavior |
|-------|-------|----------|
| **Strict review** | `npm run review` (and CI) | Exits non-zero if any post fails editorial or formatting checks. Blocks deployment. |
| **Build warning** | `npm run build` | Prints warnings for posts that fail review but still builds them. Allows local preview of drafts. |

The CI workflow (`.github/workflows/build.yml`) runs `npm run review` **before** the build step. If any post fails review, the workflow stops and nothing is published.

---

## Frontmatter Format

Append this block to every post's frontmatter if it does not already exist. Note: future posts could gain new or lose old Editorial Criteria items, so this block will need to be updated as the criteria change over time.

```yaml
editorial_review:
  reviewed: false
  date: current date in yyyy-MM-dd format
  personally_specific: false
  intellectually_honest: false
  generous_to_subjects: false
  observation_separated_from_fact: false
  date_bound_advice_dated: false
  opinions_earned: false
  rights_cleared: false
  no_ai_slop: false
```

Through Editorial Review, all Editorial Criteria must be `true` in order to pass. The `date` field records when the review was performed (yyyy-MM-dd format), regardless of whether each criteria resulted in a `true` or `false`. Each boolean represents that Editorial Review's result on the date it was last run. It will not run again and update the date if all criteria passed with `true`. That post is considered reviewed and published. If a criterion does not apply to a given post (e.g., no date-bound advice), mark it `true` — the criterion is therefore satisfied. The Editorial Criteria may change over time, but new or removed criteria only apply to non-passed and published posts. The frontmatter `editorial_review` data should remain constant the moment Editorial Review passes with `true` on every item, and the frontmatter is therefore locked. Content such as typos, grammar fixes, fixing broken links, etc. may be fixed in the future, but those would not trigger a new Editorial Review workflow and would not update frontmatter `editorial_review` values. Therefore, those types of changes to articles would not trigger a new Editorial Review.

---

## Editorial Criteria

### 1. `personally_specific`
The writing is grounded in your own experience, perspective, or analysis. It is not generic commentary that anyone could have written. A reader should come away knowing what *you* think, not just what was said.

**Ask:** Could only I have written this? Does it reflect my specific vantage point?

### 2. `intellectually_honest`
You are honest about what you know, what you don't know, and where your reasoning is speculative. You don't overstate certainty or hide counterarguments. If you changed your mind, you say so.

**Ask:** Am I presenting speculation as fact? Am I acknowledging what I don't know?

### 3. `generous_to_subjects`
People described in the writing are treated fairly. You characterize their views and actions charitably, even when critiquing them. You don't strawman, mock, or reduce people to caricature.

**Ask:** Would the people I describe recognize themselves and feel fairly represented?

### 4. `observation_separated_from_fact`
Observations (what you saw, experienced, or believe) are distinguishable from facts (things that are verifiably true). You use language that marks the difference — "I observed," "in my experience," "I believe" vs. stating something as established fact.

**Ask:** Can a reader tell which of my claims are personal observations and which are verifiable facts?

### 5. `date_bound_advice_dated`
Advice or recommendations that are tied to a specific moment in time (pricing, product availability, market conditions, tool recommendations) are explicitly dated. Readers can tell when the advice was current and won't mistake it for evergreen guidance.

**Ask:** If someone reads this in two years, will they know which parts were time-specific?

### 6. `opinions_earned`
Strong opinions are backed by evidence, defined scope, and consideration of consequences. You don't make sweeping claims without grounding them. You specify what your opinion applies to and what it doesn't. You've thought about what happens if you're wrong.

**Ask:** Have I earned this opinion? What evidence supports it? What's the scope? What are the consequences if I'm wrong?

### 7. `rights_cleared`
You have the right to publish all material in the post. Quoted text is attributed and used fairly. Images, data, and references are either yours, properly licensed, or used within fair use/fair dealing. You don't publish confidential or private information without consent.

**Ask:** Is everything in this post mine to share? Are quotes attributed? Are images licensed?

### 8. `no_ai_slop`
The writing reads like it was written by a human, not generated by an AI model. It avoids the common patterns of AI-generated text: binary contrasts ("It's not X. It's Y."), throat-clearing openers ("Here's the thing..."), faux-insight setups ("What nobody tells you..."), colon reveals, superficial analysis trailing clauses ("-ing" phrases), importance puffery, weasel attribution, fake-strong verbs, synonym cycling, negative listing, dramatic fragmentation, robotic rhythm, rhetorical setups, fake-profound kickers, summary-recap endings, banned words (delve, foster, leverage, etc.), often-empty adverbs/phrases, and formatting slop (emoji in headings, mid-sentence bold for emphasis). The writing uses active voice, concrete examples, and specific details. It has a recognizable human voice — vocabulary, cadence, bluntness, humor, uncertainty, digressions — that no AI model could replicate.

**Ask:** Would someone reading this know it was written by me? Are there any generic AI patterns I should cut? References: [no-ai-slop repo](https://github.com/petergyang/no-ai-slop).

---

## Markdown Formatting Checks

In addition to the editorial criteria, `npm run review` validates the technical correctness of every post's markdown:

| Check | What it catches |
|-------|----------------|
| **Frontmatter fields** | `title`, `date`, `summary`, and `slug` are present and valid. Date must be YYYY-MM-DD. Summary max 300 chars (SEO). Slug must be lowercase hyphenated alphanumeric. |
| **Reference links** | Every `[text][ref]` has a matching `[ref]: url` definition. Unused definitions are also flagged. |
| **Footnotes** | Every `[^id]` reference has a matching `[^id]: text` definition. Unused definitions are also flagged. |
| **Heading hierarchy** | No skipping levels (e.g., `# Heading 1` followed by `### Heading 3` without an `## Heading 2` in between). |
| **Image alt text** | All images `![alt](url)` must have non-empty alt text for accessibility. |
| **Trailing whitespace** | No lines ending with spaces or tabs. |
| **Excessive blank lines** | No 3+ consecutive blank lines. |
| **Content present** | Post body must not be empty after frontmatter. |

---

## Workflow

1. (Human) **Write** the post in `content/blog/your-post.md`
2. (Agent) **Review** the post against the eight editorial criteria above
3. (Agent) **Fill in** the `editorial_review` frontmatter block, setting each criterion to `true` and dating the review
4. (Agent) **Check locally:** `npm run review` — confirms all posts pass both editorial and formatting checks
5. (Agent) **Preview locally:** `npm run build && npm run serve` — builds and serves the site
6. (Agent) **Publish:** Push to `main`. CI runs `npm run review` first (blocks if any post fails), then builds and deploys.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run review` | Check all posts against the editorial standard and markdown formatting. Exits non-zero on failure. |
| `npm run build` | Build all posts. Warns about posts that fail review but does not block. |
| `npm run serve` | Start local dev server on port 8000. |
| `npm start` | Build then serve. |

---

## Adding a New Post

```bash
# 1. Create the markdown file
touch content/blog/my-new-post.md
```

Note: future posts could gain new or lose old Editorial Criteria items, so this block will need to be updated as the criteria change over time.

```yaml
# 2. Ensure frontmatter exists (including editorial_review)
---
title: "My New Post"
date: 2026-08-01
summary: "A brief description for listings and SEO."
slug: my-new-post
editorial_review:
  reviewed: true
  date: 2026-08-01
  personally_specific: true
  intellectually_honest: true
  generous_to_subjects: true
  observation_separated_from_fact: true
  date_bound_advice_dated: true
  opinions_earned: true
  rights_cleared: true
  no_ai_slop: true
---

Post content here...
```

```bash
# 3. Review and build
npm run review
npm run build && npm run serve