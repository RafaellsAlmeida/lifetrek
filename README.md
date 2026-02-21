# Lifetrek

## Overview
Lifetrek is a medical manufacturing platform that combines web presence, operational workflows, and AI-assisted content tooling.

## Problem
Manufacturing teams need a unified system to manage technical marketing content, sales enablement assets, and operational delivery workflows.

## Solution
This repository centralizes Lifetrek’s web app, media pipeline, automation scripts, and supporting operational tooling in a single deployable codebase.

## Architecture
- `src/`: core frontend application.
- `supabase/`: database, policies, and edge functions.
- `scripts/`: workflow and automation utilities.
- `public/`: site/media assets.
- `docs/`: setup and testing documentation.

## Tech Stack
- React + TypeScript + Vite
- Supabase
- Remotion (media automation)
- Playwright (E2E/API checks)

## Setup
1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env`
3. Start development: `npm run dev`
4. Build: `npm run build`
5. Run tests: `npm run test:e2e`

## Results
- Unified codebase for marketing + operational delivery workflows.
- Faster content production cycles with reusable automation.
- Better handoff between sales, ops, and technical teams.

## Screenshots
Store portfolio screenshots under `docs/screenshots/` and link them here.

## Tradeoffs
- Repository currently includes broad operational scope, increasing maintenance complexity.
- Media-heavy workflows can increase local setup and storage requirements.

## Additional Notes
- Canonical public repository: `RafaellsAlmeida/lifetrek`
- Legacy repository archived: `RafaellsAlmeida/Lifetrek-App`
