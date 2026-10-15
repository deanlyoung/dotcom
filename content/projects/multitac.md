## At a glance

Multitac is a native document workspace for Apple platforms where prose, calculations, results, interactive inputs, and connections to earlier notes remain together in readable files.

## Background and opportunity

Spreadsheets are powerful but impose a grid, note apps lose calculation context, and calculator histories are poor working documents. Multitac explores a more natural medium: write what you are thinking, calculate in place, change an assumption, and keep the reasoning readable.

## Business justification

A focused native app can serve people who repeatedly mix notes and calculations while differentiating through Apple-platform integration, local-first documents, and on-device assistance. A shared Swift implementation makes a near-universal app feasible without flattening every platform into the same interface.

## Goals, success measures, and non-goals

The goals are trustworthy calculation semantics, portable documents, responsive native editing, and feature parity adapted to iPhone, iPad, Mac, and Vision Pro. Automated compatibility and lifecycle tests measure correctness. Currency data, a cloud database, and silent use of remembered values are intentional non-goals.

## Personas and stakeholders

- **Everyday problem solvers** want calculations to remain understandable later.
- **Technical users** want units, functions, and plain-text portability.
- **Apple-platform users** expect native documents, windows, input methods, and accessibility.
- **The maintainer** needs deterministic arithmetic separated from optional model suggestions.

## Requirements

- Mix prose, variables, expressions, units, and results in one document.
- Store ordinary TAC source first as readable UTF-8 text.
- Support coordinated document reads, writes, autosave, undo, and file-provider access.
- Keep memory indexes on device and never silently override calculation variables.
- Label optional on-device model suggestions separately from deterministic results.
- Adapt navigation and interaction to each supported Apple platform.

## Solution and experience

The SwiftUI app uses a shared calculation and document engine with platform-specific presentation. A library opens personal TACs, guided prompts, and an Inspiration catalog. Results can become interactive cards, and local memory can surface related passages with their source.

## Decisions and tradeoffs

Plain-text-first `.mtac` files favor durability and inspection over opaque rich-document storage. A local memory index improves privacy but is rebuilt independently on each device. Broad calculation compatibility creates long-tail semantic work, so known gaps stay measured instead of hidden.

## Risks and mitigations

- Incorrect arithmetic would break trust; keep calculations deterministic and extensively tested.
- AI suggestions can sound authoritative; label, cite, review, and separate them from results.
- Cross-device documents can conflict; use Apple's document infrastructure and require signed-device validation.
- Universal scope can create lowest-common-denominator UI; share capabilities while adapting presentation per platform.

## Outcomes and evidence

**Verified outcome:** The repository reports required automated tests and successful compilation for Mac, iOS and iPadOS Simulator, and visionOS Simulator, with remaining gaps recorded rather than treated as complete.

**Verified limitation:** Signed cross-device iCloud behavior and some physical-device interactions remain release gates.

## Build it

Development requires Xcode 27 and the local Swift package in the Multitac repository. The calculation engine bundles Nerdamer under its MIT license; the application has no general third-party package download requirement. Distribution is not available yet, so the product website is informational.

## What I learned

Trustworthy calculation software is as much about explicit boundaries, recoverable documents, and honest validation as it is about the expression parser.

## What remains

Complete signed multi-device and accessibility validation, close release-critical compatibility gaps, finish distribution assets and review requirements, and replace the identity artwork here with approved product screenshots when they are ready for publication.
