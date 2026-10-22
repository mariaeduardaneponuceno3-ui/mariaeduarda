const { test, expect } = require("@playwright/test");

async function entrar(page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-correta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
}

test("API rejeita visitante sem sessão", async ({ request }) => {
  const response = await request.post("/api/ia", { data: { vaga: "Teste" } });
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain("Entre na sua conta");
});

test("formulário usa desafio e recebe texto de exemplo pela API", async ({ page }) => {
  await entrar(page);
  await expect(page.getByRole("heading", { name: "Treino de entrevista" })).toBeVisible();
  await expect(page.getByText("Cole a vaga, responda e receba um retorno honesto", { exact: true })).toBeVisible();
  const campos = [
    ["Cole aqui a descrição da vaga", "5", "Vaga de aprendiz"],
    ["Me fale um pouco sobre você", "4", "Gosto de aprender"],
    ["Por que você quer esta vaga?", "4", "Quero aprender a atender"],
    ["Conte uma situação difícil que você resolveu", "4", "Organizei uma tarefa na escola"],
  ];
  for (const [rotulo, linhas, valor] of campos) {
    await expect(page.getByLabel(rotulo)).toHaveAttribute("rows", linhas);
    await page.getByLabel(rotulo).fill(valor);
  }
  await expect(page.locator(".aviso")).toContainText("Esta resposta foi escrita por uma inteligência artificial");
  let liberar;
  const aguardar = new Promise(resolve => { liberar = resolve; });
  await page.route("**/api/ia", async route => {
    expect(route.request().postDataJSON()).toEqual({ vaga: campos[0][2], resposta1: campos[1][2], resposta2: campos[2][2], resposta3: campos[3][2] });
    await aguardar;
    await route.continue();
  });
  await page.getByRole("button", { name: "Avaliar minhas respostas" }).click();
  await expect(page.getByRole("button", { name: "Analisando...", exact: true })).toBeDisabled();
  liberar();
  await expect(page.locator(".resposta")).toContainText("EXEMPLO — MODO DE TESTE");
  expect(await page.locator(".resposta").textContent()).toContain("\n\nRESPOSTA 1\n");
  await expect(page.locator(".resposta")).toHaveCSS("white-space", "pre-wrap");
  await expect(page.getByRole("button", { name: "Avaliar minhas respostas" })).toBeEnabled();
  const badJson = await page.request.post("/api/ia", { data: "{", headers: { "Content-Type": "application/json" } });
  expect(badJson.status()).toBe(400);
  const badFields = await page.request.post("/api/ia", { data: { vaga: 123 } });
  expect(badFields.status()).toBe(400);
});

for (const [status, mensagem] of [[429, "Você atingiu o limite de uso de hoje."], [401, "Chave da IA inválida."], [500, "Não foi possível avaliar suas respostas."]]) {
  test(`erro ${status} é mostrado em português e permite tentar novamente`, async ({ page }) => {
    await entrar(page);
    await page.route("**/api/ia", route => route.fulfill({ status, contentType: "text/plain", body: "Internal upstream error" }));
    await page.getByRole("button", { name: "Avaliar minhas respostas" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(mensagem);
    await expect(page.getByRole("button", { name: "Avaliar minhas respostas" })).toBeEnabled();
    await expect(page.locator(".resposta")).toBeEmpty();
  });
}
