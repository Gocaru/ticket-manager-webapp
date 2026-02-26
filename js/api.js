/**
 * api.js — Camada de comunicação com a API REST
 * Base URL configurável via constante.
 */

const API_BASE = 'http://localhost:3000/api';

/**
 * Wrapper genérico de fetch com tratamento de erros.
 * @param {string} endpoint  - Caminho relativo (ex: '/tickets')
 * @param {object} options   - Opções do fetch (method, body, etc.)
 * @returns {Promise<any>}   - JSON parsed da resposta
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  // 204 No Content não tem body
  if (response.status === 204) return null;

  return response.json();
}

/* ── Tickets ─────────────────────────────────────────── */

/**
 * Listar tickets com filtros e paginação.
 * @param {object} params - Ex: { status, priority, limit, offset }
 */
export async function getTickets(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/tickets${qs ? '?' + qs : ''}`);
}

/**
 * Obter ticket por ID.
 * @param {number} id
 */
export async function getTicketById(id) {
  return request(`/tickets/${id}`);
}

/**
 * Criar um novo ticket.
 * @param {object} data - Campos do ticket
 */
export async function createTicket(data) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualizar um ticket existente.
 * @param {number} id
 * @param {object} data - Campos a atualizar
 */
export async function updateTicket(id, data) {
  return request(`/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Arquivar (soft delete) um ticket.
 * @param {number} id
 */
export async function deleteTicket(id) {
  return request(`/tickets/${id}`, { method: 'DELETE' });
}

/* ── Estatísticas ────────────────────────────────────── */

/** Estatísticas por status. */
export async function getStatsByStatus() {
  return request('/tickets/stats/by-status');
}

/** Estatísticas por prioridade. */
export async function getStatsByPriority() {
  return request('/tickets/stats/by-priority');
}

/** Estatísticas por categoria CI. */
export async function getStatsByCiCat() {
  return request('/tickets/stats/by-ciCat');
}

/**
 * Obter tickets criados nos últimos N dias.
 * @param {number} days - Número de dias (default: 7)
 */
export async function getRecentTickets(days = 7) {
  // Reutiliza o endpoint existente com limite alto e filtra por data no cliente
  const data = await getTickets({ limit: 200, offset: 0 });
  const tickets = data.tickets || [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  return tickets.filter(t => t.openTime && new Date(t.openTime) >= since);
}
