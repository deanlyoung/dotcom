# Projects Portfolio Plan

## Purpose

Build a Projects section for deanlyoung.com that works equally well as a product-management portfolio and as a practical starting point for fellow builders. Each project scope should read as a concise, public product brief: clear about the problem, the decision process, the evidence, the tradeoffs, and what another person would need to recreate the work.

This document is the durable source of truth for the section. Agents must update it when the project content model, evidence policy, or publishing requirements change.

## Launch portfolio

| Order | Project | Subtitle | Maturity | Access |
|---:|---|---|---|---|
| 1 | Awair Local | Local-first Homebridge integration | Shipped | Public |
| 2 | HomeLite | Family Dashboard | In use | Personal use |
| 3 | Multitac | Multiple Thoughts, Any Calculation | In progress | Pre-release |
| 4 | AI School | A hands-on AI product and model-operations curriculum | In progress | Verify before publication |
| 5 | License Plate Project | Working title | In progress | Private |

Maturity and access are separate facts. Do not combine them into an ambiguous status. Order projects by narrative strength and readiness rather than chronology.

## Visitor experience

### Projects index

Create `/projects/` as one editorial list rather than separate status groups. Each card contains:

- A real screenshot or photograph when an honest representative image exists.
- A restrained branded fallback when it does not.
- Project title and optional subtitle.
- One-sentence description.
- Separate maturity and access labels.
- A link to the directory route for the full project scope.

The design should extend the site's warm-paper, ink, oxblood, moss, and ochre palette. Use generous spacing, strong image crops, readable metadata, keyboard-visible links, and responsive layouts. Work in progress belongs in the main list with its current state stated plainly.

### Project scope pages

Use directory routes such as `/projects/homelite/index.html`. Every page follows this order:

1. **At a glance:** one-sentence summary, role, timeframe, maturity, access, platforms, and honest links.
2. **Background and opportunity:** the user problem, context, and why the project exists.
3. **Business justification:** expected value, alternatives, and why building was reasonable.
4. **Goals, success measures, and non-goals:** separate intended measures from observed outcomes.
5. **Personas and stakeholders:** users, operators, maintainers, affected parties, and their needs.
6. **Requirements:** prioritized functional, experience, technical, privacy, accessibility, and operational requirements.
7. **Solution and experience:** key workflows, architecture or system diagram, and representative screenshots.
8. **Decisions and tradeoffs:** options considered, chosen approach, constraints, and consequences.
9. **Risks and mitigations:** product, technical, privacy, support, dependency, and adoption risks.
10. **Outcomes and evidence:** separately label verified results, qualitative observations, hypotheses, and proposed measurements.
11. **Build it:** BOM, dependencies, source or download availability, setup outline, skill level, and known limitations.
12. **What I learned / What remains:** product judgment, retrospective, current gaps, and roadmap.

## Content system

Store project narratives as plain Markdown in `content/projects/*.md`. Keep card metadata and build configuration in `content/projects/projects.json`; project pages do not use frontmatter. Generate the Projects index and detail pages with a dedicated build module integrated into `npm run build`. Generated HTML remains version controlled like the existing blog output.

Required manifest fields:

| Field | Contract |
|---|---|
| `title` | Non-empty project name. |
| `slug` | Unique lowercase directory-safe identifier. |
| `description` | Exactly one sentence. |
| `maturity` | One of `Shipped`, `In use`, or `In progress`. |
| `access` | One of `Public`, `Personal use`, `Pre-release`, `Limited public access`, or `Private`. |
| `hero_image` | Root-relative path to an existing local image. |
| `hero_alt` | Meaningful description of that image. Empty only for a documented decorative fallback. |
| `featured` | Boolean. |
| `sort_order` | Unique positive integer. |
| `role` | Dean's role, stated without inflating ownership. |
| `timeframe` | Honest date or ongoing range. |
| `platforms` | Non-empty list. |

Optional fields are `subtitle` and `links`. Each link must contain a supported type (`source`, `download`, `website`, or `documentation`), a label, and an HTTPS URL. A link may appear only when the destination is genuinely available.

The build must reject manifest entries without matching Markdown files, duplicate slugs or sort orders, unsupported enum values, missing images, empty alt text for non-fallback imagery, invalid links, missing required sections, and descriptions that are empty, contain more than one sentence, or exceed the agreed card length.

## Authoring guide

Before drafting a project page:

1. Inspect the project's repository, requirements, release state, tests, and available visual artifacts.
2. Record which statements are confirmed by source, confirmed by runtime evidence, recalled personally by Dean, proposed, or still unknown.
3. Ask Dean only for material product intent or personal history that the artifacts cannot establish.
4. Never infer adoption, success, availability, or completion from code presence.
5. Never convert a proposed feature or unverified runtime state into a shipped claim.
6. Use public evidence and clearly identified personal recollection for the Awair origin story. Exclude confidential company information.
7. State `Personal use`, `Private`, or `Pre-release` availability directly. Never imply that a repository, download, or generalized installer exists when it does not.
8. Prefer real screenshots and hardware photographs. Do not use a generated mockup as evidence of a product experience.

Use these evidence labels in the Outcomes section:

- **Verified outcome:** supported by a repository, test, release, public listing, or recorded runtime evidence.
- **Qualitative observation:** experienced or observed but not quantified.
- **Personal account:** Dean's recollection, clearly attributed.
- **Hypothesis:** a belief that still needs testing.
- **Proposed measure:** how a future release could evaluate the hypothesis.

## Reusable project template

```markdown
## At a glance

## Background and opportunity

## Business justification

## Goals, success measures, and non-goals

## Personas and stakeholders

## Requirements

## Solution and experience

## Decisions and tradeoffs

## Risks and mitigations

## Outcomes and evidence

## Build it

## What I learned

## What remains
```

Add the corresponding metadata object to `content/projects/projects.json`; do not add YAML frontmatter to the Markdown file.

## Portfolio boundaries

- Keep the license plate project visibly incomplete and use its working title until its final name and publishable artifacts are established.
- Keep Lowell Applied Research Group in the backlog as a possible **Initiative** project scope. Add it only if the portfolio expands beyond products and buildable systems.
- Do not include the EPUB editor unless Dean's original contribution and ownership can be established.
- Use older Awair repositories as evidence for the Awair Local story rather than separate portfolio entries.
- Add future work only when there is a distinct problem, meaningful personal contribution, supporting evidence, and enough visual material for a credible project scope.

## Implementation requirements

- Add Projects to navigation on static pages and generated blog/project templates.
- Add project routes to `sitemap.xml` and give each page accurate canonical and social metadata.
- Extend GitHub Actions path filters and build behavior to include project content, project templates, project imagery, navigation, and styles.
- Keep project generation isolated from blog editorial metadata and review output.
- Use lazy-loaded, dimensioned images below the fold and responsive image treatment.
- Support semantic heading order, visible focus, useful alt text, adequate contrast, reduced motion, long titles, tables, diagrams, and narrow screens without horizontal page overflow.

## Test and acceptance plan

- Validate the complete manifest and body contract, including enums, one-sentence descriptions, unique routes and order, image paths and alt text, supported links, matching Markdown files, and required sections.
- Run the existing editorial review and site build without modifying blog review data.
- Confirm every Projects route, canonical URL, social image, navigation link, sitemap entry, and public dependency or source link.
- Review desktop, tablet, and narrow mobile layouts for card rhythm, hero cropping, long titles, PRD tables, BOMs, diagrams, focus order, and overflow.
- Verify claims against repositories and public sources. Keep personal recollection labeled and unresolved claims out of publication.
- Keep implementation commits scoped; do not stage unrelated editorial work already present in the checkout.

## Publication gate

Do not deploy or publish the Projects section until Dean reviews the claims, private information, maturity/access labels, and visual assets. Local builds and previews are allowed before that review.
