// js/auth.js
//
// Responsável por:
// - guardar o access token em sessionStorage (dura até fechar o tab)
// - login e logout
// - refresh automático do token quando expira
// - redirecionar para login.html se não autenticado
//

const API_BASE = 'http://localhost:3000';

/**
 * Faz login e guarda o token em sessionStorage.
 */
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

  sessionStorage.setItem('accessToken', data.accessToken);
  sessionStorage.setItem('user', JSON.stringify({ role: data.role, username: data.username }));

  return { role: data.role, username: data.username };
}

/**
 * Faz logout — limpa sessionStorage e remove o cookie no servidor.
 */
export async function logout() {
  sessionStorage.clear();

  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});

  window.location.href = 'login.html';
}

/**
 * Tenta renovar o access token usando o refresh token (cookie HttpOnly).
 */
export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    sessionStorage.clear();
    return false;
  }

  const data = await res.json();
  sessionStorage.setItem('accessToken', data.accessToken);
  return true;
}

/**
 * Devolve o access token atual.
 * Se não houver token, tenta fazer refresh automaticamente.
 * Se o refresh falhar, redireciona para login.
 */
export async function getAccessToken() {
  const token = sessionStorage.getItem('accessToken');
  if (token) return token;

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    window.location.href = 'login.html';
    return null;
  }

  return sessionStorage.getItem('accessToken');
}

/**
 * Devolve o utilizador atual (role e username).
 */
export function getCurrentUser() {
  const raw = sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Verifica se o utilizador tem um dos roles indicados.
 */
export function hasRole(...roles) {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
}

/**
 * Garante que o utilizador está autenticado.
 * Redireciona para login.html se não conseguir obter token.
 */
export async function requireAuth() {
  const token = await getAccessToken();
  if (!token) return false;
  return true;
}