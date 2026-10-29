const messages = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  signup_disabled: "A criação de contas está desativada no momento.",
  weak_password: "Escolha uma senha mais forte, com pelo menos 6 caracteres.",
  email_address_invalid: "Informe um e-mail válido.",
  validation_failed: "Verifique o e-mail e a senha informados.",
  email_provider_disabled: "O login por e-mail está desativado neste projeto. A responsável pelo site precisa ativá-lo no Supabase.",
  email_address_not_authorized: "O Supabase não está autorizado a enviar e-mails para esse endereço. A responsável pelo site precisa configurar o envio de e-mails.",
  captcha_failed: "Não foi possível validar a verificação de segurança. Tente novamente ou avise a responsável pelo site.",
  user_banned: "Esta conta está temporariamente bloqueada. Entre em contato com a responsável pelo site.",
  session_expired: "Sua sessão expirou. Entre na conta novamente.",
  session_not_found: "Sua sessão expirou. Entre na conta novamente.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  over_email_send_rate_limit: "Limite de envio de e-mails atingido. Tente novamente mais tarde.",
};

export function authErrorMessage(error) {
  if (messages[error?.code]) return messages[error.code];
  // The API gateway can reject a publishable key before GoTrue adds an error code.
  // Translate only recognized messages; never expose raw provider responses.
  const message = typeof error?.message === "string" ? error.message.trim().toLowerCase() : "";
  if (error?.code === "invalid_api_key" || message === "invalid api key" || message === "no api key found in request") {
    return "O Supabase recusou a configuração do site. Confira se a URL e a chave publicável pertencem ao mesmo projeto e publique um novo deploy.";
  }
  if (message === "invalid login credentials") return messages.invalid_credentials;
  if (error?.status === 429) return messages.over_request_rate_limit;
  if (error?.status >= 500) {
    return "O serviço de login está indisponível. Confira no Supabase se o projeto está ativo e tente novamente em alguns instantes.";
  }
  if (error?.name === "AuthRetryableFetchError" || (error instanceof TypeError && /fetch|network/i.test(message))) {
    return "Não foi possível conectar ao Supabase. Confira se o projeto está ativo e se a URL configurada está correta; depois tente novamente.";
  }
  return "Não foi possível concluir a operação de acesso. Verifique os detalhes da requisição no navegador para identificar o motivo.";
}
