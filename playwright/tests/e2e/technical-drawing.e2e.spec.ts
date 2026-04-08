import path from "path";
import type { Page } from "@playwright/test";
import { expect, test } from "../../support/merged-fixtures";

const hasAdminCreds = !!process.env.TEST_ADMIN_EMAIL && !!process.env.TEST_ADMIN_PASSWORD;
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

const eixoFixturePath = path.resolve(
  process.cwd(),
  "public/engineering-drawing/fixtures/eixo-roscado-sketch.jpg",
);
const chatoFixturePath = path.resolve(
  process.cwd(),
  "public/engineering-drawing/fixtures/chato-complexo-sketch.jpg",
);

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.waitForLoadState("domcontentloaded");

  await page.locator("#email").fill(adminEmail ?? "");
  await page.locator("#password").fill(adminPassword ?? "");
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page).not.toHaveURL(/\/admin\/login/);
}

async function openTechnicalDrawing(page: Page) {
  await page.goto("/admin/desenho-tecnico", { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Título da peça")).toBeVisible({ timeout: 30000 });
}

async function resolveFirstAmbiguity(page: Page) {
  const resolveButton = page.getByRole("button", { name: "Marcar como resolvida" }).first();
  if (await resolveButton.isVisible()) {
    await resolveButton.click();
  }
}

async function markReviewAsComplete(page: Page) {
  const reviewCheckbox = page.getByTestId("review-confirm-checkbox");
  if (!(await reviewCheckbox.isChecked())) {
    await reviewCheckbox.click({ force: true });
  }
  await expect(reviewCheckbox).toBeChecked();

  const semanticCheckbox = page.getByTestId("semantic-review-confirm-checkbox");
  if (await semanticCheckbox.isEnabled()) {
    if (!(await semanticCheckbox.isChecked())) {
      await semanticCheckbox.click({ force: true });
    }
    await expect(semanticCheckbox).toBeChecked();
  }
}

test.describe("Desenho técnico admin", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "gera 2D e 3D, persiste GLB e restaura a sessão ao recarregar",
    { annotation: [{ type: "skipNetworkMonitoring" }] },
    async ({ page }) => {
      test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

      await loginAsAdmin(page);
      await openTechnicalDrawing(page);

      await page.locator('input[type="file"]').setInputFiles(eixoFixturePath);
      await expect(page.getByLabel("Título da peça")).toHaveValue("Eixo roscado M2");

      await resolveFirstAmbiguity(page);
      await markReviewAsComplete(page);
      await page.getByTestId("save-review-button").click();
      await expect(page.getByText("Revisão salva.")).toBeVisible();

      await page.getByTestId("generate-2d-button").click();
      await expect(page.getByText("Desenho 2D gerado com sucesso.")).toBeVisible();
      await expect(page.getByTestId("engineering-drawing-preview")).toBeVisible();
      await expect(page.getByTestId("export-png-button")).toBeEnabled();

      await page.getByTestId("generate-3d-button").click();
      await expect(page.getByText("Preview 3D e GLB gerados com sucesso.")).toBeVisible();
      await expect(page.getByTestId("engineering-drawing-3d-preview")).toBeVisible();
      await expect(page.getByTestId("export-glb-button")).toBeEnabled();

      await page.screenshot({
        path: "playwright/test-results/technical-drawing-3d-happy-path.png",
        fullPage: true,
      });

      await page.reload({ waitUntil: "domcontentloaded" });
      const renderedSessionButton = page.getByRole("button", { name: /rendered_3d/i }).first();
      await expect(renderedSessionButton).toBeVisible({ timeout: 30000 });
      await renderedSessionButton.click();

      await expect(page.getByTestId("export-glb-button")).toBeEnabled();
      await expect(page.getByTestId("engineering-drawing-3d-preview")).toBeVisible();
    },
  );

  test(
    "bloqueia exportações com conflito dimensional até a correção",
    { annotation: [{ type: "skipNetworkMonitoring" }] },
    async ({ page }) => {
      test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

      await loginAsAdmin(page);
      await openTechnicalDrawing(page);

      await page.locator('input[type="file"]').setInputFiles(eixoFixturePath);
      await expect(page.getByLabel("Título da peça")).toHaveValue("Eixo roscado M2");

      await resolveFirstAmbiguity(page);
      await markReviewAsComplete(page);

      const totalLengthInput = page.getByTestId("total-length-input");
      await totalLengthInput.fill("7,10");
      await page.getByTestId("save-review-button").click();
      await expect(page.getByText("Revisão salva.")).toBeVisible();
      await page.getByTestId("generate-2d-button").click();

      await expect(
        page.getByText("A soma dos trechos (6,50 mm) não bate com o comprimento total (7,10 mm).", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("export-png-button")).toBeDisabled();
      await expect(page.getByTestId("export-pdf-button")).toBeDisabled();
      await expect(page.getByTestId("export-glb-button")).toBeDisabled();

      await page.getByTestId("generate-3d-button").click();
      await expect(page.getByTestId("export-glb-button")).toBeDisabled();

      await totalLengthInput.fill("6,50");
      await markReviewAsComplete(page);
      await page.getByTestId("save-review-button").click();
      await page.getByTestId("generate-2d-button").click();
      await expect(page.getByText("Desenho 2D gerado com sucesso.")).toBeVisible();

      await page.getByTestId("generate-3d-button").click();
      await expect(page.getByText("Preview 3D e GLB gerados com sucesso.")).toBeVisible();
      await expect(page.getByTestId("export-png-button")).toBeEnabled();
      await expect(page.getByTestId("export-glb-button")).toBeEnabled();
    },
  );

  test(
    "exige revisão semântica de GD&T antes de liberar export",
    { annotation: [{ type: "skipNetworkMonitoring" }] },
    async ({ page }) => {
      test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

      await loginAsAdmin(page);
      await openTechnicalDrawing(page);

      await page.getByTestId("engineering-drawing-fixture-synthetic-review-standard").click();
      await expect(page.getByLabel("Título da peça")).toHaveValue("Perpendicularidade com norma pendente");
      await expect(page.getByTestId("gdt-review-panel")).toBeVisible();

      await markReviewAsComplete(page);
      await page.getByTestId("save-review-button").click();
      await page.getByTestId("generate-2d-button").click();

      await expect(page.getByText("Norma do desenho obrigatória para interpretar GD&T.")).toBeVisible();
      await expect(page.getByTestId("export-png-button")).toBeDisabled();

      await page.getByTestId("gdt-standard-select").click();
      await page.getByRole("option", { name: "ASME" }).click();
      await page.getByTestId("callout-review-callout-1").click();
      await page.getByRole("option", { name: "Confirmado" }).click();
      await resolveFirstAmbiguity(page);
      await markReviewAsComplete(page);
      await page.getByTestId("save-review-button").click();
      await page.getByTestId("generate-2d-button").click();

      await expect(page.getByTestId("gdt-review-panel")).toBeVisible();
      await expect(page.getByText("Sem conflitos bloqueantes", { exact: true })).toBeVisible();
      await expect(page.getByTestId("export-png-button")).toBeEnabled();

      await page.screenshot({
        path: "playwright/test-results/technical-drawing-gdt-review.png",
        fullPage: true,
      });
    },
  );

  test(
    "sinaliza feature fora do escopo e mantém 3D bloqueado",
    { annotation: [{ type: "skipNetworkMonitoring" }] },
    async ({ page }) => {
      test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

      await loginAsAdmin(page);
      await openTechnicalDrawing(page);

      await page.locator('input[type="file"]').setInputFiles(chatoFixturePath);
      await expect(page.getByLabel("Título da peça")).toHaveValue("Peça com chato lateral");
      await expect(page.getByTestId("unsupported-features-panel")).toBeVisible();
      await expect(page.getByTestId("unsupported-features-panel")).toContainText("Chato lateral");

      await resolveFirstAmbiguity(page);
      await markReviewAsComplete(page);
      await page.getByTestId("save-review-button").click();
      await page.getByTestId("generate-3d-button").click();

      await expect(page.getByTestId("export-glb-button")).toBeDisabled();
      await expect(page.getByText(/fora do escopo axisimétrico/i)).toBeVisible();
    },
  );
});
