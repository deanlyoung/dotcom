## At a glance

AI School is a 16-week, portfolio-driven curriculum for a product leader to build first-hand fluency across training, evaluation, agents, infrastructure, inference, and launch decisions.

## Background and opportunity

Product leaders increasingly need to reason with researchers and engineers about model behavior, data, evaluation, cost, and deployment. Reading alone does not create the practical judgment needed to diagnose failures or defend a launch decision.

## Business justification

A structured, time-bounded curriculum turns a broad learning goal into reusable evidence: experiments, evaluation records, technical explanations, and one coherent portfolio system. It focuses effort on product decisions instead of collecting disconnected tutorials.

## Goals, success measures, and non-goals

Success means explaining core domains clearly, connecting product failures to lifecycle choices, reproducing representative experiments, and defending metrics and constraints. The curriculum is a hiring-readiness sprint, not a claim of research mastery or completed production experience.

## Personas and stakeholders

- **The learner** needs a realistic sequence, feedback loops, and bounded cost.
- **Hiring teams** need concrete evidence of technical product judgment.
- **Researchers and engineers** need a product counterpart who understands interfaces and limitations.
- **Future contributors** need licensed sources and reproducible exercises.

## Requirements

- Tie theory to an implementation or decision each week.
- Keep train, validation, and test evidence separate.
- Record negative results and pin model, data, code, and cost details.
- Calibrate model judges against human labels where they are used.
- Separate personally implemented work from assisted work.
- Build toward one integrated Model Operations Lab.

## Solution and experience

The curriculum combines weekly study guides, labs, interview briefs, experiment templates, a progress ledger, and a capstone with model comparison, support diagnosis, and cited research-analysis surfaces. Local Apple Silicon work is combined with bounded hosted comparisons and one planned NVIDIA serving experiment.

## Decisions and tradeoffs

A single portfolio spine favors depth and a coherent story over many flashy demos. A fixed budget forces explicit cost decisions but limits large training runs. Delaying the formal start protects the intended learning cadence, though it means the present project demonstrates preparation rather than completed mastery.

## Risks and mitigations

- Breadth can become superficial; require implementation, teach-backs, and failure analysis.
- Test leakage can invalidate results; freeze splits and forbid tuning on test items.
- Assisted coding can obscure understanding; record provenance and require explanation and repair.
- Fast-moving APIs can age the curriculum; pin versions and prefer primary sources.

## Outcomes and evidence

**Verified outcome:** The private working repository contains the curriculum, calendar, lab scaffolds, deterministic evaluation code, tests, datasets, and evidence rules.

**Verified limitation:** The repository explicitly describes the portfolio as active study and experimentation; it is not evidence that the full curriculum or capstone has been completed.

## Build it

The current curriculum targets a 128 GB Apple Silicon Mac, Python virtual environments, local MLX experiments, bounded hosted API use, and one rental GPU experiment. The working repository is not linked publicly from this page. Public release would require a license and source review for every included model, dataset, paper, and exercise.

## What I learned

The curriculum itself is a product: a learner needs sequencing, acceptance criteria, cost constraints, feedback, and a credible definition of done.

## What remains

Execute the scheduled curriculum, publish only completed evidence, assess the capstone against its launch rubric, and decide which source materials can be released publicly.
