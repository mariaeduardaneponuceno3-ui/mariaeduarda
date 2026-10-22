// Local Supabase Auth protocol fixture. No external service or real credentials.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const user = { id: "12345678-1234-4234-8234-123456789abc", email: "maria@example.com", aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() };
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.test-signature`;
const session = { access_token: token, refresh_token: "test-refresh-token", token_type: "bearer", expires_in: 3600, user };
const contas = [session];
for (const [id, email] of [["22345678-1234-4234-8234-123456789abc", "outra@example.com"], ["32345678-1234-4234-8234-123456789abc", "vazia@example.com"]]) {
  const pessoa = { ...user, id, email };
  contas.push({ ...session, user: pessoa, access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.test-signature` });
}
const registros = [];

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
  res.setHeader("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info, x-supabase-api-version");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "X-Supabase-Api-Version");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Supabase-Api-Version", "2024-01-01");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const conta = contas.find(item => req.headers.authorization === `Bearer ${item.access_token}`);
  if (path === "/auth/v1/token") {
    const login = contas.find(item => item.user.email === body.email && body.password === "senha-correta");
    if (login) res.end(JSON.stringify(login));
    else if (body.auth_code === "test-confirmation-code" && body.code_verifier) res.end(JSON.stringify(session));
    else { res.statusCode = 400; res.end(JSON.stringify({ code: "invalid_credentials", msg: "Invalid login credentials" })); }
  } else if (path === "/auth/v1/signup") {
    res.end(JSON.stringify({ ...user, email: body.email, identities: [] }));
  } else if (path === "/auth/v1/user") {
    if (conta) res.end(JSON.stringify(conta.user));
    else { res.statusCode = 401; res.end(JSON.stringify({ code: "bad_jwt", msg: "Invalid token" })); }
  } else if (path === "/auth/v1/logout") {
    res.writeHead(204).end();
  } else if (path === "/rest/v1/respostas") {
    if (!conta) { res.statusCode = 401; res.end(JSON.stringify({ code: "42501" })); return; }
    if (req.method === "POST") {
      if (body.user_id !== conta.user.id) { res.statusCode = 403; res.end(JSON.stringify({ code: "42501" })); return; }
      if (body.entrada.includes("FALHAR_SALVAMENTO_TESTE")) { res.statusCode = 500; res.end(JSON.stringify({ code: "XX000" })); return; }
      registros.push({ ...body, id: registros.length + 1, created_at: new Date(Date.UTC(2026, 9, 22, 12, registros.length)).toISOString() });
      res.writeHead(201).end();
    } else {
      if (url.searchParams.get("user_id") !== `eq.${conta.user.id}` || !url.searchParams.get("order")?.startsWith("created_at.desc")) {
        res.statusCode = 400; res.end(JSON.stringify({ code: "TEST_BAD_QUERY" })); return;
      }
      const itens = registros.filter(item => item.user_id === conta.user.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
      const offset = Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || itens.length);
      res.setHeader("Content-Range", `${offset}-${Math.max(offset, Math.min(offset + limit, itens.length) - 1)}/${itens.length}`);
      res.end(JSON.stringify(itens.slice(offset, offset + limit)));
    }
  } else { res.statusCode = 404; res.end(JSON.stringify({ msg: "Unknown mock endpoint" })); }
});
await new Promise(resolve => server.listen(4400, "127.0.0.1", resolve));
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3100"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --require ${fileURLToPath(new URL("./openrouter.cjs", import.meta.url))}`,
    OPENROUTER_API_KEY: "test-openrouter-key",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:4400",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-public-key",
  },
});
function stop() { app.kill("SIGTERM"); server.close(); }
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
app.on("exit", code => { server.close(); process.exit(code ?? 0); });
