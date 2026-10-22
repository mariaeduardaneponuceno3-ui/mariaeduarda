import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { montarEntrada, formatarData } from "../../lib/historico.mjs";

const sql = await readFile(new URL("../../supabase/migrations/202610220001_respostas_historico.sql", import.meta.url), "utf8");
const pessoaA = "12345678-1234-4234-8234-123456789abc";
const pessoaB = "22345678-1234-4234-8234-123456789abc";

async function preparar(db) {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    insert into auth.users values ('${pessoaA}'), ('${pessoaB}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to public;
    grant usage on schema public to authenticated, anon;
  `);
}

async function sessao(db, pessoa) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [pessoa]);
  await db.exec("set role authenticated");
}

test("entrada mantém rótulos, conteúdo e quebras de linha; data usa Brasília", () => {
  assert.equal(montarEntrada([{ id: "a", rotulo: "Pergunta A" }, { id: "b", rotulo: "Pergunta B" }], { a: "linha 1\nlinha 2" }), "Pergunta A:\nlinha 1\nlinha 2\n\nPergunta B:\n");
  assert.equal(formatarData("2026-10-22T12:30:00Z"), "22/10/2026, 09:30");
  assert.equal(formatarData(null), "Data não registrada");
});

test("migração preserva tabela antiga e RLS isola pessoas mesmo com política permissiva existente", async () => {
  const db = new PGlite();
  try {
    await preparar(db);
    await db.exec(`
      create table public.respostas (id bigint generated always as identity primary key, entrada text, resposta text);
      insert into public.respostas (entrada, resposta) values ('legado sem dona', 'preservado');
      alter table public.respostas enable row level security;
      create policy legacy_allow_all on public.respostas for all to public using (true) with check (true);
    `);
    await db.exec(sql);
    await db.exec(sql); // Reexecutar não perde registros nem enfraquece as políticas.
    const legado = await db.query("select entrada, user_id, created_at from public.respostas where id = 1");
    assert.deepEqual(legado.rows, [{ entrada: "legado sem dona", user_id: null, created_at: null }]);
    await sessao(db, pessoaA);
    await db.query("insert into public.respostas (entrada, resposta) values ($1, $2)", ["entrada A", "resposta A"]);
    assert.deepEqual((await db.query("select entrada from public.respostas")).rows, [{ entrada: "entrada A" }]);
    await assert.rejects(db.query("insert into public.respostas (user_id, entrada, resposta) values ($1, 'forjada', 'erro')", [pessoaB]), error => error.code === "42501");
    await sessao(db, pessoaB);
    assert.equal((await db.query("select * from public.respostas")).rows.length, 0);
    await db.query("insert into public.respostas (entrada, resposta) values ('entrada B', 'resposta B')");
    assert.deepEqual((await db.query("select entrada from public.respostas")).rows, [{ entrada: "entrada B" }]);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select * from public.respostas"), error => error.code === "42501");
    await db.exec("reset role");
    assert.equal((await db.query("select count(*)::int as total from public.respostas")).rows[0].total, 3);
  } finally {
    await db.close();
  }
});

test("migração também cria tabela nova com proprietária e data automáticas", async () => {
  const db = new PGlite();
  try {
    await preparar(db);
    await db.exec(sql);
    await sessao(db, pessoaA);
    const { rows } = await db.query("insert into public.respostas (entrada, resposta) values ('texto', 'avaliação') returning id, user_id, created_at");
    assert.equal(rows[0].user_id, pessoaA);
    assert.ok(rows[0].id);
    assert.ok(rows[0].created_at);
  } finally {
    await db.close();
  }
});
