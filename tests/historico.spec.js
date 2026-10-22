const { test, expect } = require("@playwright/test");

async function entrar(page, email = "maria@example.com") {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-correta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
}

test("histórico redireciona visitantes para login", async ({ request }) => {
  const response = await request.get("/historico", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/login");
});

test("salva campos rotulados e IA, lista por data decrescente e ignora user_id enviado", async ({ page }) => {
  await entrar(page);
  for (const vaga of ["Histórico primeiro", "Histórico mais recente"]) {
    const response = await page.request.post("/api/ia", { data: { vaga, resposta1: "Sou estudante", resposta2: "Quero aprender", resposta3: "Organizei a turma", user_id: "22345678-1234-4234-8234-123456789abc" } });
    expect(response.status()).toBe(200);
    expect(response.headers()["x-historico-salvo"]).toBe("true");
  }
  await page.getByRole("link", { name: "Meu histórico" }).click();
  await expect(page).toHaveURL(/\/historico$/);
  const artigos = page.locator("article");
  await expect(artigos.nth(0)).toContainText("Histórico mais recente");
  await expect(artigos.nth(1)).toContainText("Histórico primeiro");
  for (const texto of ["Cole aqui a descrição da vaga:\nHistórico mais recente", "Me fale um pouco sobre você:\nSou estudante", "Por que você quer esta vaga?:\nQuero aprender", "Conte uma situação difícil que você resolveu:\nOrganizei a turma", "AVALIAÇÃO SIMULADA"]) {
    expect(await artigos.nth(0).textContent()).toContain(texto);
  }
  await expect(artigos.nth(0).locator("time")).toContainText("22/10/2026");
  await expect(artigos.nth(0).locator("time")).toContainText("09:");
  await expect(page.getByRole("banner")).toContainText("maria@example.com");
  await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao treino" }).click();
  await page.getByLabel("Cole aqui a descrição da vaga").fill("Histórico depois de visitar a página");
  await page.getByRole("button", { name: "Avaliar minhas respostas" }).click();
  await expect(page.locator(".resposta")).toContainText("AVALIAÇÃO SIMULADA");
  await page.getByRole("link", { name: "Meu histórico" }).click();
  await expect(page.locator("article").first()).toContainText("Histórico depois de visitar a página");
});

test("cada pessoa vê apenas o próprio histórico", async ({ page, browser }) => {
  await entrar(page);
  await page.request.post("/api/ia", { data: { vaga: "REGISTRO_PRIVADO_MARIA" } });
  const outraContext = await browser.newContext();
  try {
    const outra = await outraContext.newPage();
    await entrar(outra, "outra@example.com");
    await outra.request.post("/api/ia", { data: { vaga: "REGISTRO_PRIVADO_OUTRA" } });
    await outra.goto("/historico");
    await expect(outra.locator("main")).toContainText("REGISTRO_PRIVADO_OUTRA");
    await expect(outra.locator("main")).not.toContainText("REGISTRO_PRIVADO_MARIA");
    await page.goto("/historico");
    await expect(page.locator("main")).toContainText("REGISTRO_PRIVADO_MARIA");
    await expect(page.locator("main")).not.toContainText("REGISTRO_PRIVADO_OUTRA");
  } finally {
    await outraContext.close();
  }
});

test("histórico vazio informa que ainda não há avaliações", async ({ page }) => {
  await entrar(page, "vazia@example.com");
  await page.goto("/historico");
  await expect(page.getByText("Você ainda não tem avaliações salvas.")).toBeVisible();
});

test("falha ao salvar preserva avaliação e avisa a pessoa", async ({ page }) => {
  await entrar(page);
  await page.getByLabel("Cole aqui a descrição da vaga").fill("FALHAR_SALVAMENTO_TESTE");
  await page.getByRole("button", { name: "Avaliar minhas respostas" }).click();
  await expect(page.locator(".resposta")).toContainText("AVALIAÇÃO SIMULADA");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("não foi salva no histórico");
  await page.goto("/historico");
  await expect(page.locator("main")).not.toContainText("FALHAR_SALVAMENTO_TESTE");
});

test("paginação permite consultar avaliações antigas sem perder a ordem", async ({ page }) => {
  await entrar(page, "outra@example.com");
  for (let i = 0; i < 21; i++) {
    const response = await page.request.post("/api/ia", { data: { vaga: `PAGINAÇÃO ${i}` } });
    expect(response.headers()["x-historico-salvo"]).toBe("true");
  }
  await page.goto("/historico");
  await expect(page.locator("article")).toHaveCount(20);
  await expect(page.locator("article").first()).toContainText("PAGINAÇÃO 20");
  await page.getByRole("link", { name: "Mais antigas" }).click();
  await expect(page).toHaveURL(/pagina=2$/);
  await expect(page.locator("article").first()).toContainText("PAGINAÇÃO 0");
  await page.getByRole("link", { name: "Mais recentes" }).click();
  await expect(page.locator("article").first()).toContainText("PAGINAÇÃO 20");
});
