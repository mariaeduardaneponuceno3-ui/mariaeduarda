// Loaded only by the isolated test server, never by production.
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, options) {
  const url = typeof input === "string" ? input : input?.url || String(input);
  if (url === "https://openrouter.ai/api/v1/chat/completions") {
    const body = JSON.parse(options.body);
    if (options.headers.Authorization !== "Bearer test-openrouter-key" || body.max_tokens !== 900 || !body.messages[0].content.includes("VAGA:")) {
      return Response.json({ error: { message: "Invalid test request" } }, { status: 400 });
    }
    return Response.json({ choices: [{ message: { content: "AVALIAÇÃO SIMULADA\n\nRESPOSTA 1\nNOTA: 7\nRetorno exclusivo do teste automatizado." } }] });
  }
  return originalFetch(input, options);
};
