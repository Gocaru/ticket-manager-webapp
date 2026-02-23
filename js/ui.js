/**
 * ui.js — Utilitários de interface (toast, loading, modal, DOM helpers)
 */

/* ── Toast Notifications ─────────────────────────────── */

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Mostrar uma notificação toast.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - ms
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span style="margin-right:.5rem;font-weight:800">${icons[type] || ''}</span>${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity .25s, transform .25s';
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

/* ── Loading State ───────────────────────────────────── */

/**
 * Mostrar indicador de loading dentro de um elemento.
 * @param {HTMLElement} el - Elemento onde inserir o loading
 * @param {string} message
 */
export function showLoading(el, message = 'A carregar...') {
  el.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span>${message}</span>
    </div>
  `;
}

/**
 * Mostrar estado vazio.
 * @param {HTMLElement} el
 * @param {string} message
 */
export function showEmpty(el, message = 'Nenhum resultado encontrado.') {
  el.innerHTML = `
    <div class="empty-state">
      <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
      <p>${message}</p>
    </div>
  `;
}

/* ── Badge helpers ───────────────────────────────────── */

/**
 * Gerar HTML de badge de status.
 * @param {string} status
 */
export function statusBadge(status) {
  const label = { open: 'Aberto', in_progress: 'Em progresso', closed: 'Fechado' };
  const cls   = status === 'in_progress' ? 'inprogress' : status;
  return `<span class="badge badge--${cls}">${label[status] || status}</span>`;
}

/**
 * Gerar HTML de badge de prioridade.
 * @param {string} priority
 */
export function priorityBadge(priority) {
  const label = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
  return `<span class="badge badge--${priority}">${label[priority] || priority}</span>`;
}

/* ── Formatar data ───────────────────────────────────── */

/**
 * Formatar uma data ISO para pt-PT.
 * @param {string} dateStr
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ── Modal ───────────────────────────────────────────── */

let currentOverlay = null;

/**
 * Criar e mostrar um modal.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.body - HTML interno
 * @param {Array<{label, className, onClick}>} opts.actions
 * @returns {HTMLElement} - O elemento overlay
 */
export function openModal({ title, body, actions = [] }) {
  // Fechar modal anterior se existir
  if (currentOverlay) currentOverlay.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const actionsHtml = actions
    .map(a => `<button class="btn ${a.className || 'btn--ghost'}" data-action="${a.label}">${a.label}</button>`)
    .join('');

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal__header">
        <span class="modal__title">${title}</span>
        <button class="modal__close" aria-label="Fechar">✕</button>
      </div>
      <div class="modal__body">${body}</div>
      ${actionsHtml ? `<div class="modal__footer">${actionsHtml}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // Fechar ao clicar no overlay ou no X
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector('.modal__close').addEventListener('click', closeModal);

  // Ligar event listeners às acções
  actions.forEach(a => {
    const btn = overlay.querySelector(`[data-action="${a.label}"]`);
    if (btn) btn.addEventListener('click', a.onClick);
  });

  return overlay;
}

/** Fechar modal atual. */
export function closeModal() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
  }
}

/* ── Navbar active link ──────────────────────────────── */

/**
 * Marcar o link ativo na navbar com base na página atual.
 */
export function setNavActive() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ── Navbar toggle (mobile) ─────────────────────────── */
export function initNavbarToggle() {
  const toggle = document.querySelector('.navbar__toggle');
  const links  = document.querySelector('.navbar__links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });
}
