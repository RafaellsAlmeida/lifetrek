import { test, expect } from "../../support/merged-fixtures";

test("chatbot buffers quick follow-up messages into a single backend call", async ({ page }) => {
  let requestCount = 0;
  let lastPayload: Record<string, unknown> | null = null;

  await page.route("**/functions/v1/website-bot", async (route) => {
    requestCount += 1;
    lastPayload = route.request().postDataJSON();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Sim, a Vetmaker aparece no nosso portfólio aprovado na frente veterinária. Posso te direcionar ao comercial se você quiser seguir.",
      }),
    });
  });

  await page.goto("/contact");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Abrir chat do Assistente Trek" }).click();
  const input = page.getByPlaceholder("Digite sua dúvida...");

  await input.fill("Gostaria de saber se possuem implantes para veterinária?");
  await input.press("Enter");

  await input.fill("tem alguma fabricação para a empresa VETMAKER");
  await input.press("Enter");

  await page.waitForTimeout(2500);
  expect(requestCount).toBe(0);

  await page.waitForTimeout(3500);
  await expect.poll(() => requestCount).toBe(1);

  const clientBuffer = lastPayload?.clientBuffer as Record<string, unknown>;
  const requestMessages = lastPayload?.messages as Array<{ content: string }>;

  expect(clientBuffer?.grouped).toBe(true);
  expect(clientBuffer?.count).toBe(2);
  expect(clientBuffer?.windowMs).toBe(5000);
  expect(clientBuffer?.rawMessages).toEqual([
    "Gostaria de saber se possuem implantes para veterinária?",
    "tem alguma fabricação para a empresa VETMAKER",
  ]);
  expect(requestMessages.at(-1)?.content).toContain("Mensagens enviadas em sequência pelo usuário:");
  expect(requestMessages.at(-1)?.content).toContain("1. Gostaria de saber se possuem implantes para veterinária?");
  expect(requestMessages.at(-1)?.content).toContain("2. tem alguma fabricação para a empresa VETMAKER");

  await expect(page.getByText("Sim, a Vetmaker aparece no nosso portfólio aprovado na frente veterinária.")).toBeVisible({
    timeout: 15000,
  });
});
