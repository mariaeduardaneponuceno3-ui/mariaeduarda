const messages = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  signup_disabled: "A criação de contas está desativada no momento.",
  weak_password: "Escolha uma senha mais forte, com pelo menos 6 caracteres.",
  email_address_invalid: "Informe um e-mail válido.",
  validation_failed: "Verifique o e-mail e a senha informados.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  over_email_send_rate_limit: "Limite de envio de e-mails atingido. Tente novamente mais tarde.",
};

export function authErrorMessage(error) {
  if (messages[error?.code]) return messages[error.code];
  if (error?.status === 429) return messages.over_request_rate_limit;
  return "Não foi possível concluir a operação. Verifique sua conexão e tente novamente.";
}
