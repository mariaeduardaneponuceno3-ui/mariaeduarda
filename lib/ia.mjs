export class ErroIA extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
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
  if (!chave) throw new ErroIA("O serviço de IA ainda não está configurado. Tente novamente mais tarde.", 503);
  let response;
  try {
    response = await fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.modelo, max_tokens: 900, messages: [{ role: "user", content: montarPrompt(config, valores) }] }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new ErroIA("Não foi possível conectar ao serviço de IA. Tente novamente em alguns instantes.", 502);
  }
  if (response.status === 429) throw new ErroIA("Você atingiu o limite de uso de hoje.", 429);
  if (response.status === 401) throw new ErroIA("Chave da IA inválida.", 401);
  if (!response.ok) throw new ErroIA("O serviço de IA está indisponível. Tente novamente em alguns instantes.", 502);
  let data;
  try { data = await response.json(); } catch {
    throw new ErroIA("O serviço de IA retornou uma resposta inválida. Tente novamente.", 502);
  }
  const texto = data?.choices?.[0]?.message?.content;
  if (typeof texto !== "string" || !texto.trim()) throw new ErroIA("A IA não retornou uma resposta. Tente novamente.", 502);
  return texto;
}
