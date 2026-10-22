import test from "node:test";
import assert from "node:assert/strict";
import { desafio } from "../../desafio.js";
import { avaliarRespostas, montarPrompt, normalizarChave } from "../../lib/ia.mjs";

const valores = { vaga: "Aprendiz", resposta1: "Sou estudante", resposta2: "Quero aprender", resposta3: "Ajudei minha turma" };
const real = { ...desafio, modoTeste: false };

test("modo de teste não chama IA nem exige chave", async () => {
  const texto = await avaliarRespostas({ ...desafio, modoTeste: true }, valores, { fetcher: () => assert.fail("Não deveria acessar a rede") });
  assert.match(texto, /EXEMPLO — MODO DE TESTE/);
  assert.match(texto, /RESPOSTA 3/);
});

test("chave copiada com espaços, aspas ou Bearer é normalizada antes de enviar", async () => {
  for (const chave of ["  teste  \n", '"teste"', "'teste'", "Bearer teste", '"Bearer teste"', 'Bearer "teste"']) {
    assert.equal(normalizarChave(chave), "teste");
    await avaliarRespostas(real, valores, { chave, fetcher: async (_, options) => {
      assert.equal(options.headers.Authorization, "Bearer teste");
      return Response.json({ choices: [{ message: { content: "ok" } }] });
    } });
  }
  for (const chave of ["", "  ", "parte parte", "parte\nparte", "parte\u200Bparte"]) {
    assert.throws(() => normalizarChave(chave), error => error.status === 503);
  }
});

test("sem créditos e tempo esgotado não são tratados como chave inválida", async () => {
  await assert.rejects(avaliarRespostas(real, valores, { chave: "teste", fetcher: async () => new Response(null, { status: 402 }) }), error => error.status === 402 && error.codigo === "creditos_insuficientes");
  await assert.rejects(avaliarRespostas(real, valores, { chave: "teste", fetcher: async () => { throw new DOMException("Timed out", "TimeoutError"); } }), error => error.status === 504 && error.codigo === "tempo_esgotado");
});

test("substituição usa todos os ids e preserva texto literal sem substituir recursivamente", () => {
  const texto = montarPrompt(desafio, { ...valores, resposta1: "$& {resposta2}" });
  assert.ok(texto.includes("VAGA: Aprendiz"));
  assert.ok(texto.includes("RESPOSTA 1 (sobre você): $& {resposta2}"));
  assert.ok(texto.includes("RESPOSTA 2 (por que esta vaga): Quero aprender"));
  assert.ok(texto.includes("RESPOSTA 3 (situação difícil): Ajudei minha turma"));
  assert.ok(montarPrompt(desafio, {}).includes("VAGA: \n"));
});

test("modo real usa OpenRouter, chave, modelo e 900 tokens e retorna somente conteúdo", async () => {
  let chamadas = 0;
  const resultado = await avaliarRespostas(real, valores, {
    chave: "chave-ficticia-de-teste",
    fetcher: async (url, options) => {
      chamadas++;
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer chave-ficticia-de-teste");
      assert.deepEqual(JSON.parse(options.body), { model: desafio.modelo, max_tokens: 900, messages: [{ role: "user", content: montarPrompt(desafio, valores) }] });
      return Response.json({ choices: [{ message: { content: "RESPOSTA 1\nNOTA: 7" } }] });
    },
  });
  assert.equal(chamadas, 1);
  assert.equal(resultado, "RESPOSTA 1\nNOTA: 7");
});

for (const [status, message] of [[429, "Você atingiu o limite de uso de hoje."], [401, "Chave da IA inválida."], [500, "O serviço de IA está indisponível. Tente novamente em alguns instantes."]]) {
  test(`erro HTTP ${status} é traduzido sem expor o corpo do provedor`, async () => {
    await assert.rejects(avaliarRespostas(real, valores, { chave: "teste", fetcher: async () => new Response("Sensitive provider detail", { status }) }), error => error.status === (status === 500 ? 502 : status) && error.message === message);
  });
}

test("campos inválidos são rejeitados e chave ausente não faz requisição", async () => {
  for (const body of [null, [], "texto", { vaga: 123 }]) {
    await assert.rejects(avaliarRespostas(desafio, body), error => error.status === 400);
  }
  await assert.rejects(avaliarRespostas(real, valores, { fetcher: () => assert.fail("Não deveria acessar a rede") }), error => error.status === 503);
});

test("falhas de rede, JSON inválido e conteúdo vazio têm mensagem em português", async () => {
  for (const fetcher of [async () => { throw Error("network failure"); }, async () => new Response("invalid JSON"), async () => Response.json({ choices: [] }), async () => Response.json({ choices: [{ message: { content: " " } }] })]) {
    await assert.rejects(avaliarRespostas(real, valores, { chave: "teste", fetcher }), error => error.status === 502 && /Não foi possível|inválida|não retornou/.test(error.message));
  }
});
