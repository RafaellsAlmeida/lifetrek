import path from "path";
import type { Page } from "@playwright/test";
import { test, expect } from "../../support/merged-fixtures";

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

test.describe("Desenho técnico admin", () => {
  test(
    "gera 2D, bloqueia export com conflito e libera após correção",
    { annotation: [{ type: "skipNetworkMonitoring" }] },
    async ({ page }) => {
    test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

    await loginAsAdmin(page);
    await page.goto("/admin/desenho-tecnico");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);

    await page.locator('input[type="file"]').setInputFiles(eixoFixturePath);
    await expect(page.getByLabel("Título da peça")).toHaveValue("Eixo roscado M2");

    const totalLengthInput = page.getByTestId("total-length-input");
    await totalLengthInput.fill("7,10");
    await expect(totalLengthInput).toHaveValue("7,1");
    await page.getByTestId("review-confirm-checkbox").check();
    await page.getByTestId("save-review-button").click();
    await expect(page.getByText("Revisão salva.")).toBeVisible();
    await page.getByTestId("generate-2d-button").click();
    await expect(page.getByText("2D gerado com conflitos bloqueantes para exportação.")).toBeVisible();

    await expect(
      page.getByText("A soma dos trechos (6,50 mm) não bate com o comprimento total (7,10 mm).", { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("engineering-drawing-preview")).toBeVisible();
    await expect(page.getByTestId("export-png-button")).toBeDisabled();
    await expect(page.getByTestId("export-pdf-button")).toBeDisabled();

    await totalLengthInput.fill("6,50");
    await expect(totalLengthInput).toHaveValue("6,5");
    await page.getByTestId("save-review-button").click();
    await expect(page.getByText("Revisão salva.")).toBeVisible();
    await page.getByTestId("generate-2d-button").click();
    await expect(page.getByText("Desenho 2D gerado com sucesso.")).toBeVisible();

    await expect(page.getByText("Sem conflitos bloqueantes", { exact: true })).toBeVisible();
    await expect(page.getByTestId("export-png-button")).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-png-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("eixo-roscado-m2");

    await page.screenshot({
      path: "playwright/test-results/technical-drawing-final.png",
      fullPage: true,
    });
    },
  );

  test(
    "sinaliza feature fora do escopo no sketch complexo",
    { annotation: [{ type: "skipNetworkMonitoring" }] },
    async ({ page }) => {
    test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

    await loginAsAdmin(page);
    await page.goto("/admin/desenho-tecnico");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="file"]').setInputFiles(chatoFixturePath);
    await expect(page.getByLabel("Título da peça")).toHaveValue("Peça com chato lateral");
    await expect(page.getByTestId("unsupported-features-panel")).toBeVisible();
    await expect(page.getByTestId("unsupported-features-panel")).toContainText("Chato lateral");
    },
  );
});
