# Social Media Workspace Testing Plan

This document outlines the comprehensive testing strategy for the Social Media Workspace feature and the Content Factory Ingestion skill.

## Overview

**Components Under Test:**
1. **Social Media Workspace UI** (`src/pages/Admin/SocialMediaWorkspace.tsx`)
2. **Content Factory Ingestion Skill** (`skills/content_factory/`)
   - `ingest_docs.js` - Document ingestion into `knowledge_base`
   - `ingest_assets.js` - Image/asset ingestion into `product_catalog`
3. **Core Embedded Components:**
   - `ContentOrchestratorCore`
   - `ImageEditorCore`
   - `ContentApprovalCore`

---

## Part 1: Content Factory Ingestion Testing

### 1.1 Prerequisites Checklist

Before running ingestion tests, verify:

```bash
# 1. Check environment variables
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."
```

| Requirement | Status | Notes |
|-------------|--------|-------|
| `SUPABASE_URL` set | [ ] | From `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` set | [ ] | Service role key (not anon) |
| `OPENAI_API_KEY` set | [ ] | Required for embeddings |
| Supabase project running | [ ] | Not paused |
| `content_assets` bucket exists | [ ] | **Must create - currently missing!** |

### 1.2 Create Missing Storage Bucket

The `content_assets` bucket is required but doesn't exist. Create it:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('content_assets', 'content_assets', true)
ON CONFLICT (id) DO NOTHING;
```

Or via Dashboard: Storage > New Bucket > Name: `content_assets` > Public: Yes

### 1.3 Document Ingestion Tests (`ingest_docs.js`)

**Target Table:** `knowledge_base`
**Vector Dimensions:** 768 (text-embedding-3-small with `dimensions: 768`)

#### Test Case 1.3.1: Basic Document Ingestion

```bash
# Create test directory with sample docs
mkdir -p test-assets/docs
echo "# LifeTrek Brand Guidelines\n\nOur brand voice is professional and technical." > test-assets/docs/brand.md
echo "Titanium Ti-6Al-4V is our primary material for implants." > test-assets/docs/materials.txt

# Run ingestion
node skills/content_factory/ingest_docs.js test-assets/docs
```

**Expected Results:**
- [ ] Console shows "Loaded .env file"
- [ ] Console shows "Linked to Supabase Knowledge Base"
- [ ] Each file shows chunk count
- [ ] Final message: "Ingestion Complete!"

**Verification Query:**
```sql
SELECT id, LEFT(content, 100) as content_preview,
       metadata->>'filename' as filename,
       array_length(embedding, 1) as vector_dim
FROM knowledge_base
WHERE metadata->>'filename' IN ('brand.md', 'materials.txt')
ORDER BY created_at DESC;
```

#### Test Case 1.3.2: Chunking Behavior

Test with a larger document (>2000 chars) to verify chunking:

```bash
# Create longer doc
cat > test-assets/docs/large.md << 'EOF'
# Chapter 1: Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit...
[Continue with ~3000 chars of content]
EOF

node skills/content_factory/ingest_docs.js test-assets/docs
```

**Expected:** Multiple chunks created with `chunk_index` 0, 1, 2...

#### Test Case 1.3.3: Error Handling - Missing API Key

```bash
# Temporarily unset key
OPENAI_API_KEY="" node skills/content_factory/ingest_docs.js test-assets/docs
```

**Expected:** Error message about missing OpenAI API key, script exits.

---

### 1.4 Asset Ingestion Tests (`ingest_assets.js`)

**Target Table:** `product_catalog`
**Target Bucket:** `content_assets`
**Vector Dimensions:** 1536 (text-embedding-3-small default)

#### Test Case 1.4.1: Basic Image Ingestion

```bash
# Create test directory with sample images
mkdir -p test-assets/images
# Copy a test image (JPG/PNG/WebP)
cp /path/to/sample-cleanroom.jpg test-assets/images/

# Run ingestion
node skills/content_factory/ingest_assets.js test-assets/images
```

**Expected Results:**
- [ ] Console shows "Loaded .env file"
- [ ] Console shows bucket check (may auto-create)
- [ ] For each image:
  - [ ] "Processing: filename"
  - [ ] "Uploaded: [public URL]"
  - [ ] "Analyzing with GPT-4o Vision..."
  - [ ] "Description: [AI description preview]..."
  - [ ] "Successfully Indexed"

**Verification Query:**
```sql
SELECT id, name, LEFT(description, 100) as desc_preview,
       image_url, metadata->>'vision_model' as model,
       array_length(embedding, 1) as vector_dim
FROM product_catalog
WHERE metadata->>'original_path' LIKE '%test-assets%'
ORDER BY created_at DESC;
```

#### Test Case 1.4.2: Storage Bucket Missing

```bash
# Test with non-existent bucket (script should try to create)
# First, ensure bucket doesn't exist, then run:
node skills/content_factory/ingest_assets.js test-assets/images
```

**Expected:** Script attempts to create bucket. If it fails, clear error message.

#### Test Case 1.4.3: Unsupported File Types

```bash
# Add non-image files
echo "not an image" > test-assets/images/readme.txt
node skills/content_factory/ingest_assets.js test-assets/images
```

**Expected:** .txt file is silently skipped (only .jpg/.jpeg/.png/.webp processed)

#### Test Case 1.4.4: Vision API Failure

Test behavior when GPT-4o Vision fails (e.g., invalid image):

```bash
# Create a corrupted "image"
echo "not valid image data" > test-assets/images/fake.jpg
node skills/content_factory/ingest_assets.js test-assets/images
```

**Expected:** Error logged, embedding skipped for that file, continues to next.

---

### 1.5 Semantic Search Validation

After ingestion, validate the RAG retrieval works:

#### Test Case 1.5.1: Knowledge Base Search

```sql
-- First, create a test embedding (replace with actual 768-dim vector)
SELECT * FROM match_knowledge_base(
  -- You'll need to generate this via API
  '[0.1, 0.2, ...]'::vector(768),
  0.5,  -- threshold
  3     -- limit
);
```

**Manual Test via Edge Function:**
```bash
# If you have a search endpoint, test:
curl -X POST https://your-project.supabase.co/functions/v1/search-knowledge \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"query": "titanium materials"}'
```

#### Test Case 1.5.2: Product Catalog Search

```sql
SELECT * FROM match_product_assets(
  '[0.1, 0.2, ...]'::vector(1536),
  0.7,  -- threshold
  3     -- limit
);
```

---

## Part 2: Social Media Workspace UI Testing

### 2.1 Manual UI Test Cases

**Test Environment:**
- URL: `http://localhost:8080/admin/social-workspace`
- Credentials: See `AGENTS.md`

#### Test Case 2.1.1: Page Load & Layout

1. Navigate to Social Media Workspace
2. **Verify:**
   - [ ] Header shows "Social Media Workspace"
   - [ ] Subtitle shows "Crie, edite, aprove e agende..."
   - [ ] 4 tabs visible: Criar, Design, Aprovar, Agendar
   - [ ] Context sidebar visible on xl screens
   - [ ] Stats cards show in sidebar

#### Test Case 2.1.2: Tab Navigation

For each tab (Criar, Design, Aprovar, Agendar):
1. Click tab
2. **Verify:**
   - [ ] Tab becomes active (highlighted)
   - [ ] Correct content loads
   - [ ] Description text updates below tabs
   - [ ] Sidebar tips update for context

#### Test Case 2.1.3: Create Tab (ContentOrchestratorCore)

1. Select "Criar" tab
2. **Verify:**
   - [ ] ContentOrchestratorCore renders embedded
   - [ ] Form fields visible (topic, audience, pain points)
   - [ ] Generation button works
   - [ ] No layout overflow issues

#### Test Case 2.1.4: Design Tab (ImageEditorCore)

1. Select "Design" tab
2. **Verify:**
   - [ ] ImageEditorCore renders at 80vh height
   - [ ] Editor canvas visible
   - [ ] Tools/controls accessible
   - [ ] No scrollbar issues

#### Test Case 2.1.5: Approve Tab (ContentApprovalCore)

1. Select "Aprovar" tab
2. **Verify:**
   - [ ] Content list loads
   - [ ] Approval/rejection actions work
   - [ ] Status updates correctly

#### Test Case 2.1.6: Calendar Tab

1. Select "Agendar" tab
2. **Verify:**
   - [ ] Placeholder card shown
   - [ ] "Ver Calendário" button navigates to `/admin/content-calendar`

#### Test Case 2.1.7: Responsive Layout

1. Resize browser to different widths
2. **Verify:**
   - [ ] Sidebar hides on screens < xl
   - [ ] Tabs remain accessible on mobile
   - [ ] Content areas scale appropriately

---

### 2.2 Component Integration Tests

#### Test Case 2.2.1: Embedded vs Standalone Mode

Compare behavior when components render in workspace vs standalone pages:

| Component | Standalone URL | Embedded Location |
|-----------|---------------|-------------------|
| ContentOrchestrator | `/admin/orchestrator` | Workspace "Criar" tab |
| ImageEditor | `/admin/image-editor` | Workspace "Design" tab |
| ContentApproval | `/admin/content-approval` | Workspace "Approve" tab |

**Verify for each:**
- [ ] Functionality identical
- [ ] No duplicate headers/navigation
- [ ] Data loads correctly
- [ ] Actions complete successfully

---

## Part 3: End-to-End Workflow Tests

### 3.1 Content Generation → Approval Flow

1. **Ingest Knowledge** (run once):
   ```bash
   node skills/content_factory/ingest_docs.js docs/brand
   ```

2. **Generate Content:**
   - Go to Workspace > Criar tab
   - Enter topic: "Precision CNC Machining for Medical Devices"
   - Generate carousel

3. **Verify RAG Integration:**
   - [ ] Generated content references brand knowledge
   - [ ] Tone matches brand guidelines

4. **Design (Optional):**
   - Switch to Design tab
   - Modify visual if needed

5. **Approve:**
   - Switch to Aprovar tab
   - Find generated content
   - Approve or reject

6. **Verify Database:**
   ```sql
   SELECT topic, status, created_at
   FROM linkedin_carousels
   ORDER BY created_at DESC LIMIT 1;
   ```

---

### 3.2 Asset Pipeline Integration

1. **Ingest Product Images:**
   ```bash
   node skills/content_factory/ingest_assets.js assets/products/
   ```

2. **Generate Content with Asset Reference:**
   - Use orchestrator with topic requiring product imagery
   - Verify Designer Agent can retrieve relevant assets

3. **Verify Asset Usage:**
   ```sql
   SELECT topic, assets_used
   FROM linkedin_carousels
   WHERE assets_used IS NOT NULL
   ORDER BY created_at DESC LIMIT 5;
   ```

---

## Part 4: Automated E2E Tests (Playwright)

### 4.1 New Test File Structure

Create: `playwright/tests/ui/social-workspace.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/auth';

test.describe('Social Media Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/social-workspace');
  });

  test('should load workspace with all tabs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Social Media Workspace');
    await expect(page.getByRole('tab', { name: 'Criar' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Design' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Aprovar' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Agendar' })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Design' }).click();
    await expect(page.locator('[data-state="active"]')).toHaveAttribute('value', 'design');
  });

  test('should show context sidebar on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await expect(page.getByText('Designer Agent')).toBeVisible();
  });

  test('should hide sidebar on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect(page.getByText('Designer Agent')).not.toBeVisible();
  });
});
```

### 4.2 Run Tests

```bash
# Run workspace tests
npm run test:e2e -- --grep "Social Media Workspace"

# With UI for debugging
npm run test:e2e:ui -- --grep "Social Media Workspace"
```

---

## Part 5: Known Issues & Troubleshooting

### Issue 1: Missing `content_assets` Bucket

**Status:** Active (needs creation)

**Solution:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('content_assets', 'content_assets', true);
```

### Issue 2: Vector Dimension Mismatch

**Context:**
- `knowledge_base` uses 768-dim vectors
- `product_catalog` uses 1536-dim vectors
- `ingest_docs.js` correctly uses `dimensions: 768`
- `ingest_assets.js` uses default 1536 (correct for product_catalog)

**No action needed** - dimensions are correctly configured per table.

### Issue 3: Supabase Project Paused

**Symptom:** `getaddrinfo ENOTFOUND` errors

**Solution:**
1. Go to Supabase Dashboard
2. Check project status
3. Click "Restore" if paused

### Issue 4: OpenAI API Quota

**Symptom:** Rate limit or quota errors during batch ingestion

**Solution:**
- Add delay between requests in ingestion scripts
- Consider using cheaper embedding model for testing

---

## Test Environment Setup Checklist

```bash
# 1. Verify env file
cat .env | grep -E '^(SUPABASE_|OPENAI_)'

# 2. Start dev server
npm run dev:web

# 3. Create test asset directories
mkdir -p test-assets/{docs,images}

# 4. Create content_assets bucket (if missing)
# See SQL above or use Dashboard

# 5. Run ingestion tests
node skills/content_factory/ingest_docs.js test-assets/docs
node skills/content_factory/ingest_assets.js test-assets/images

# 6. Verify in UI
# Navigate to http://localhost:8080/admin/social-workspace
```

---

## Sign-Off Criteria

| Category | Criteria | Pass |
|----------|----------|------|
| Document Ingestion | Successfully ingests .md/.txt files | [ ] |
| Document Ingestion | Creates correct 768-dim embeddings | [ ] |
| Document Ingestion | Chunks large documents properly | [ ] |
| Asset Ingestion | Uploads images to storage | [ ] |
| Asset Ingestion | Generates Vision AI descriptions | [ ] |
| Asset Ingestion | Creates correct 1536-dim embeddings | [ ] |
| UI - Workspace | All 4 tabs render correctly | [ ] |
| UI - Workspace | Tab switching works | [ ] |
| UI - Workspace | Responsive sidebar behavior | [ ] |
| UI - Core Components | ContentOrchestratorCore embedded works | [ ] |
| UI - Core Components | ImageEditorCore embedded works | [ ] |
| UI - Core Components | ContentApprovalCore embedded works | [ ] |
| Integration | RAG retrieval returns relevant results | [ ] |
| Integration | Generated content uses ingested knowledge | [ ] |

---

*Last Updated: 2026-02-05*
*Author: Claude Code*
