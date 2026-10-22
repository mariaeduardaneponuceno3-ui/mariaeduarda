// Only these application-owned messages may be displayed to the user.
export const mensagensIA = {
  400: "Verifique os campos e tente enviar suas respostas novamente.",
  401: "Chave da IA inválida.",
  402: "O serviço de IA está sem créditos ou atingiu o limite financeiro da chave. Avise a responsável pelo site.",
  403: "Sua sessão expirou. Entre na sua conta novamente para continuar.",
  429: "Você atingiu o limite de uso de hoje.",
  502: "Não foi possível obter uma resposta do serviço de IA. Tente novamente em alguns instantes.",
  503: "O serviço de IA não está configurado corretamente. Avise a responsável pelo site.",
  504: "A IA demorou demais para responder. Tente novamente em alguns instantes.",
};

export function mensagemErroIA(status) {
  return mensagensIA[status] || "Não foi possível avaliar suas respostas. Tente novamente em alguns instantes.";
}
