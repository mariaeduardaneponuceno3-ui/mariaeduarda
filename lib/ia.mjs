export class ErroIA extends Error {
  constructor(message, status, codigo = "erro_ia") {
    super(message);
    this.status = status;
    this.codigo = codigo;
  }
}

export function normalizarChave(valor) {
  let chave = typeof valor === "string" ? valor.trim() : "";
  function tirarAspas(texto) {
    if ((texto.startsWith('"') && texto.endsWith('"')) || (texto.startsWith("'") && texto.endsWith("'"))) return texto.slice(1, -1).trim();
    return texto;
  }
  chave = tirarAspas(chave).replace(/^Bearer\s+/i, "").trim();
  chave = tirarAspas(chave);
  if (!chave) throw new ErroIA("O serviço de IA ainda não está configurado. Tente novamente mais tarde.", 503, "chave_ausente");
  if (/[\s\u200B-\u200D\uFEFF]/.test(chave)) {
    throw new ErroIA("A configuração da chave de IA contém caracteres inválidos. Avise a responsável pelo site.", 503, "formato_chave_invalido");
  }
  return chave;
}

export function montarPrompt(config, valores) {
  const ids = new Set(config.campos.map(({ id }) => id));
  // One pass keeps placeholders or "$&" inside user text literal.
  return config.prompt.replace(/\{([^{}]+)\}/g, (marcador, id) => ids.has(id) ? valores[id] || "" : marcador);
}

export async function avaliarRespostas(config, valores, { chave, fetcher = fetch } = {}) {
  if (!valores || typeof valores !== "object" || Array.isArray(valores) || config.campos.some(({ id }) => valores[id] !== undefined && typeof valores[id] !== "string")) {
    throw new ErroIA("Envie os campos do formulário como texto.", 400);
  }
  if (config.modoTeste) {
    return `EXEMPLO — MODO DE TESTE
Esta é uma demonstração. Suas respostas ainda não foram avaliadas pela IA.

RESPOSTA 1
NOTA: 7 de 10 (exemplo)
O QUE FICOU BOM: Uma boa apresentação liga seus interesses à vaga.
O QUE MELHORAR: Acrescente uma situação real que mostre uma habilidade sua.
COMO FICARIA MELHOR: Conte quem você é, o que gosta de aprender e uma atividade que realmente fez.

RESPOSTA 2
NOTA: 7 de 10 (exemplo)
O QUE FICOU BOM: Explicar seu interesse ajuda a mostrar sua motivação.
O QUE MELHORAR: Relacione seu interesse a uma atividade descrita na vaga.
COMO FICARIA MELHOR: Escolha uma tarefa da vaga e explique por que gostaria de aprender a realizá-la.

RESPOSTA 3
NOTA: 7 de 10 (exemplo)
O QUE FICOU BOM: Uma situação real ajuda a mostrar como você resolve problemas.
O QUE MELHORAR: Explique sua ação e o resultado, sem inventar detalhes.
COMO FICARIA MELHOR: Descreva o problema, o que você fez e o que aprendeu.

Praticar e revisar suas respostas é um passo que você já está dando.`;
  }
  const chaveLimpa = normalizarChave(chave);
  let response;
  try {
    response = await fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${chaveLimpa}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.modelo, max_tokens: 900, messages: [{ role: "user", content: montarPrompt(config, valores) }] }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new ErroIA("A IA demorou demais para responder. Tente novamente em alguns instantes.", 504, "tempo_esgotado");
    }
    throw new ErroIA("Não foi possível conectar ao serviço de IA. Tente novamente em alguns instantes.", 502, "falha_conexao");
  }
  if (response.status === 429) throw new ErroIA("Você atingiu o limite de uso de hoje.", 429, "limite_requisicoes");
  if (response.status === 401) throw new ErroIA("Chave da IA inválida.", 401, "chave_recusada_openrouter");
  if (response.status === 402) throw new ErroIA("O serviço de IA está sem créditos ou atingiu o limite financeiro da chave.", 402, "creditos_insuficientes");
  if (!response.ok) throw new ErroIA("O serviço de IA está indisponível. Tente novamente em alguns instantes.", 502);
  let data;
  try { data = await response.json(); } catch {
    throw new ErroIA("O serviço de IA retornou uma resposta inválida. Tente novamente.", 502);
  }
  const texto = data?.choices?.[0]?.message?.content;
  if (typeof texto !== "string" || !texto.trim()) throw new ErroIA("A IA não retornou uma resposta. Tente novamente.", 502);
  return texto;
}
