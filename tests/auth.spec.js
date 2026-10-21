const { test, expect } = require("@playwright/test");

test("visitante é redirecionada sem receber o analisador", async ({ request, page }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/login");
  expect(await response.text()).not.toContain("Meu Analisador");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
});

test("validação e credenciais inválidas mostram mensagens em português", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe um e-mail válido.");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
  await expect(page).toHaveURL(/\/login$/);
});

test("cadastro pede confirmação de e-mail sem liberar a página protegida", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("nova@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("A senha deve ter pelo menos 6 caracteres.");
  await page.getByLabel("Senha", { exact: true }).fill("senha-forte");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("status")).toContainText("Verifique seu e-mail");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("login persiste após recarregar e sair remove o acesso", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-correta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByRole("banner")).toContainText("maria@example.com");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Meu Analisador" })).toBeVisible();
  await page.getByRole("textbox").fill("Texto de exemplo");
  await page.getByRole("button", { name: "Analisar", exact: true }).click();
  await expect(page.locator(".resposta")).toHaveText("Texto de exemplo");
  await page.goto("/login");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("retorno de confirmação inválido exibe erro em português", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/login\?erro=confirmacao$/);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Não foi possível confirmar seu e-mail");
});

test("confirmação troca o código por uma sessão e abre o analisador", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-correta");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("status")).toContainText("Verifique seu e-mail");
  await page.goto("/auth/callback?code=test-confirmation-code");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByRole("banner")).toContainText("maria@example.com");
});

test("cookie com identidade forjada não libera a página", async ({ context, page }) => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256" })}.${encode({ sub: "forjada", exp: Math.floor(Date.now() / 1000) + 3600 })}.forged`;
  const session = { access_token: token, refresh_token: "forged", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: "forjada", email: "forjada@example.com" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + encode(session), domain: "127.0.0.1", path: "/" }]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Meu Analisador" })).toHaveCount(0);
});
