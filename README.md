# Lifetrek

## Overview

Lifetrek is an internal operations platform for Lifetrek Medical. This repository combines the admin application, Supabase backend, technical drawing flows, CRM, analytics, editorial tooling, and supporting automation.

## Current Scope

Primary product areas:

- stakeholder approval by email
- blog generator/editor
- CRM and lead operations
- unified analytics
- technical drawing
- controlled social-content support

Image/video editing may still appear in legacy code paths, but it is not the main product story.

## Problem

Technical commercial teams need one system for content approval, technical blogging, lead management, analytics, and engineering-support workflows.

## Solution

This repository centralizes Lifetrek's admin app, backend functions, technical content workflows, CRM, analytics, and technical drawing support in a single codebase.

## Architecture

- `src/`: core frontend application
- `supabase/`: database, policies, migrations, and edge functions
- `scripts/`: workflow and automation utilities
- `public/`: site and media assets
- `docs/`: product, technical, and operational documentation

## Documentation

For agents and developers, start here:

1. `docs/bmad-standard-documentation.md`
2. `_bmad-output/project-context.md`
3. `_bmad-output/planning-artifacts/`
4. Relevant technical docs under `docs/`

For stakeholder-facing, shareable Portuguese documentation, use:

- `docs/bmad-standard-documentation-pt.md`
- `docs/sectors/`

## Tech Stack

- React + TypeScript + Vite
- Supabase
- Remotion
- Playwright

## Setup

1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env`
3. Start development: `npm run dev`
4. Build: `npm run build`
5. Run tests: `npm run test:e2e`

## Results

- Unified codebase for approval, editorial, CRM, analytics, and technical workflows
- Better handoff between sales, operations, marketing, and engineering
- Shareable stakeholder documentation in Portuguese plus agent-facing BMAD docs in English

## Tradeoffs

- The repository has broad operational scope, which increases maintenance complexity.
- Legacy media-heavy workflows still increase setup and maintenance complexity even though they are no longer central.

## Additional Notes

- Canonical public repository: `RafaellsAlmeida/lifetrek`
- Legacy repository archived: `RafaellsAlmeida/Lifetrek-App`
