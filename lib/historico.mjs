export function montarEntrada(campos, valores) {
  return campos.map(({ id, rotulo }) => `${rotulo}:\n${valores[id] || ""}`).join("\n\n");
}

export function formatarData(data) {
  if (!data || Number.isNaN(new Date(data).getTime())) return "Data não registrada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(data));
}
