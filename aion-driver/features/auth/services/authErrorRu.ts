/** Понятные сообщения вместо сырого текста Supabase Auth. */
export function translateAuthError(message: string | undefined | null): string {
  if (!message?.trim()) return "Не удалось выполнить запрос. Проверьте сеть.";
  const m = message.toLowerCase();

  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "Регистрация на сервере отключена. Напишите в поддержку AION.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Этот email уже зарегистрирован. Переключитесь на «Вход» и введите пароль.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "Неверный email или пароль. Если только что регистрировались — подтвердите письмо на почте.";
  }
  if (m.includes("email not confirmed") || m.includes("email not verified")) {
    return "Подтвердите email по ссылке из письма, затем нажмите «Вход».";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "Пароль слишком простой. Используйте не менее 8 символов, буквы и цифры.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Слишком много попыток. Подождите минуту и попробуйте снова.";
  }
  if (m.includes("invalid email") || m.includes("unable to validate email")) {
    return "Некорректный email. Проверьте написание.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Нет связи с сервером. Проверьте интернет.";
  }
  if (
    m.includes("provider is not enabled") ||
    m.includes("unsupported provider") ||
    m.includes("oauth provider not enabled")
  ) {
    return "Вход через Google ещё не включён на сервере. Нужны Client ID и Secret в Supabase → Auth → Google.";
  }
  if (m.includes("redirect_uri_mismatch") || m.includes("redirect uri")) {
    return "Неверный redirect URI в Google Cloud. Добавьте callback Supabase (см. npm run auth:google-setup).";
  }
  if (m.includes("invalid_client") || m.includes("unauthorized_client")) {
    return "Неверный Google Client ID или Secret в Supabase.";
  }

  return message;
}
