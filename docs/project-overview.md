# Project Overview: lifetrek

## Executive Summary

Lifetrek is a website + CRM + content engine designed for Lifetrek Medical. It integrates clinical knowledge, content orchestration, and sales tools into a unified web application.

Recent update (2026-03-05): the Social Media Workspace now supports smart background selection (real asset first, AI fallback by threshold) and manual per-slide background override with version history.

## Core Information

- **Type:** Monolith React SPA
- **Primary Language:** TypeScript
- **Architecture:** Component-based Frontend with Supabase Backend-as-a-Service (BaaS)
- **Status:** Active Development (Vite/React 18)

## Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **UI Library**| Shadcn UI, Radix UI, Framer Motion |
| **Backend** | Supabase (Auth, Postgres, Storage) |
| **Compute** | Supabase Edge Functions (Deno) |
| **Testing** | Playwright (E2E & API) |
| **Video** | Remotion |
| **Graphics** | Three.js, Recharts, Konva |

## Project Documentation Index

- [Project Context AI Rules](../_bmad-output/project-context.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Internal Processes](./INTERNAL_PROCESSES.md)
- [Onboarding Guide](./ONBOARDING.md)
- [Testing in Cloud](./TESTING_IN_CLOUD.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Content Engine Guide](./content-engine-guide.md)
- [Social Media Workspace Testing Plan](./testing/SOCIAL_MEDIA_WORKSPACE_TESTING_PLAN.md)

## Getting Started

To run the project locally:

1. `npm install`
2. `npm run dev`
3. Ensure `.env.local` is configured with Supabase keys.

## Domain

lifetrek-medical.com

## Admin

lifetrek-medical.com/admin

## Login

<rafacrvg@icloud.com>
Lifetrek2026

or

_@Raju05022005
