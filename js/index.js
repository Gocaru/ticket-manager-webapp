/**
 * index.js — Lógica da página principal (index.html)
 * Campos da API: ciName, ciCat, ciSubcat, status, impact, urgency, priority, openTime
 */

import { getTickets, createTicket, updateTicket, deleteTicket, getTicketById } from './api.js';
import { showToast, showLoading, showEmpty, statusBadge, formatDate, openModal, closeModal, setNavActive, initNavbarToggle } from './ui.js';

let currentFilters = {};
let currentOffset = 0;
function calcLimit() {
  const rowHeight = 52;  // altura aproximada de cada linha da tabela
  const usedHeight = 390; // navbar + header + filtros + paginação + footer
  const available = window.innerHeight - usedHeight;
  const rows = Math.floor(available / rowHeight);
  return Math.max(5, Math.min(rows, 20)); // mínimo 5, máximo 20
}

let LIMIT = calcLimit();

function bindEvents() {
  document.getElementById('btn-new-ticket').addEventListener('click', () => openTicketModal(null));
  document.getElementById('btn-filter').addEventListener('click', applyFilters);
  document.getElementById('btn-reset').addEventListener('click', resetFilters);
  document.getElementById('btn-archived').addEventListener('click', () => {
    currentFilters = { archived: '1' };
    document.getElementById('filter-status').value = '';
    loadTickets(currentFilters, 0);
  });

  // Recalcula o limite quando a janela muda de tamanho
  window.addEventListener('resize', () => {
    const newLimit = calcLimit();
    if (newLimit !== LIMIT) {
      LIMIT = newLimit;
      loadTickets(currentFilters, 0);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setNavActive();
  initNavbarToggle();
  loadTickets();
  bindEvents();
});


async function loadTickets(filters = {}, offset = 0) {
  const container = document.getElementById('tickets-container');
  showLoading(container);
  try {
    const params = { limit: LIMIT, offset, ...filters };
    const data = await getTickets(params);
    renderTickets(container, data.tickets || []);
    renderPagination(data.total || 0, offset);
    currentOffset = offset;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>❌ Erro: ${err.message}</p></div>`;
    showToast('Erro ao carregar tickets. Verifique se o servidor está activo.', 'error');
  }
}

function renderTickets(container, tickets) {
  if (!tickets.length) { showEmpty(container, 'Nenhum ticket encontrado.'); return; }

  const wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';
  wrapper.innerHTML = `
    <table class="tickets-table">
      <thead>
        <tr>

          <th>CI Name</th>
          <th>Categoria</th>
          <th>Sub-categoria</th>
          <th>Estado</th>
          <th>Prioridade</th>
          <th>Impacto</th>
          <th>Urgência</th>
          <th>Data Abertura</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody id="tickets-tbody"></tbody>
    </table>
  `;
  container.innerHTML = '';
  container.appendChild(wrapper);
  const tbody = document.getElementById('tickets-tbody');
  const isArchived = !!currentFilters.archived;
  tickets.forEach(t => tbody.appendChild(createRow(t, isArchived)));
}

function createRow(ticket, isArchived = false) {
  // Todos os campos já chegam em camelCase da API
  const status = String(ticket.status || '').toLowerCase();

  const tr = document.createElement('tr');
  tr.innerHTML = `

    <td><strong>${escapeHtml(ticket.ciName || '—')}</strong></td>
    <td style="color:var(--muted);font-size:.85rem">${escapeHtml(ticket.ciCat || '—')}</td>
    <td style="color:var(--muted);font-size:.85rem">${escapeHtml(ticket.ciSubcat || '—')}</td>
    <td>${statusBadge(status)}</td>
    <td style="text-align:center">${ticket.priority || '—'}</td>
    <td style="text-align:center">${ticket.impact || '—'}</td>
    <td style="text-align:center">${ticket.urgency || '—'}</td>
    <td style="font-size:.8rem;color:var(--muted);white-space:nowrap">${formatDate(ticket.openTime)}</td>
    <td>
      ${!isArchived ? `<div style="display:flex;gap:.4rem">
        <button class="btn btn--warning btn--sm btn-edit"   data-id="${ticket.id}" title="Editar">✏</button>
        <button class="btn btn--danger  btn--sm btn-delete" data-id="${ticket.id}" title="Apagar">✕</button>
      </div>` : ''}
    </td>
  `;
  if (!isArchived) {
    tr.querySelector('.btn-edit').addEventListener('click', () => handleEdit(ticket.id));
    tr.querySelector('.btn-delete').addEventListener('click', () => handleDelete(ticket.id, tr));
  }
  return tr;
}

function renderPagination(total, offset) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT);
  if (totalPages <= 1) return;

  const delta = 3;
  const start = Math.max(0, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  // « Primeira
  const btnFirst = document.createElement('button');
  btnFirst.className = 'btn btn--sm btn--ghost';
  btnFirst.textContent = '«';
  btnFirst.title = 'Primeira página';
  btnFirst.disabled = currentPage === 0;
  btnFirst.addEventListener('click', () => loadTickets(currentFilters, 0));
  container.appendChild(btnFirst);

  // ‹ Anterior
  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn btn--sm btn--ghost';
  btnPrev.textContent = '‹';
  btnPrev.title = 'Página anterior';
  btnPrev.disabled = currentPage === 0;
  btnPrev.addEventListener('click', () => loadTickets(currentFilters, (currentPage - 1) * LIMIT));
  container.appendChild(btnPrev);

  // Números
  if (start > 0) addPageBtn(container, 0, currentPage, '1');
  if (start > 1) container.insertAdjacentHTML('beforeend', '<span style="color:var(--muted);padding:0 .3rem">…</span>');
  for (let i = start; i <= end; i++) addPageBtn(container, i, currentPage);
  if (end < totalPages - 2) container.insertAdjacentHTML('beforeend', '<span style="color:var(--muted);padding:0 .3rem">…</span>');
  if (end < totalPages - 1) addPageBtn(container, totalPages - 1, currentPage, String(totalPages));

  // › Próxima
  const btnNext = document.createElement('button');
  btnNext.className = 'btn btn--sm btn--ghost';
  btnNext.textContent = '›';
  btnNext.title = 'Próxima página';
  btnNext.disabled = currentPage === totalPages - 1;
  btnNext.addEventListener('click', () => loadTickets(currentFilters, (currentPage + 1) * LIMIT));
  container.appendChild(btnNext);

  // » Última
  const btnLast = document.createElement('button');
  btnLast.className = 'btn btn--sm btn--ghost';
  btnLast.textContent = '»';
  btnLast.title = 'Última página';
  btnLast.disabled = currentPage === totalPages - 1;
  btnLast.addEventListener('click', () => loadTickets(currentFilters, (totalPages - 1) * LIMIT));
  container.appendChild(btnLast);
}

function addPageBtn(container, page, currentPage, label) {
  const btn = document.createElement('button');
  btn.className = `btn btn--sm ${page === currentPage ? 'btn--primary' : 'btn--ghost'}`;
  btn.textContent = label || String(page + 1);
  btn.addEventListener('click', () => loadTickets(currentFilters, page * LIMIT));
  container.appendChild(btn);
}

function applyFilters() {
  currentFilters = {};
  const status = document.getElementById('filter-status').value;
  const priority = document.getElementById('filter-priority').value;
  if (status) currentFilters.status = status;
  if (priority) currentFilters.priority = priority;
  loadTickets(currentFilters, 0);
}

function resetFilters() {
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-priority').value = '';
  currentFilters = {};
  loadTickets({}, 0);
}

function openTicketModal(existingTicket) {
  const isEdit = !!existingTicket;
  const t = existingTicket || {};

  const curStatus = String(t.status || 'open').toLowerCase();
  const curPriority = String(t.priority || '3');
  const curImpact = String(t.impact || '3');
  const curUrgency = String(t.urgency || '3');

  const sel = (val, opt) => val === String(opt) ? 'selected' : '';

  const formHtml = `
    <form id="ticket-form" novalidate>
      <div class="form-group">
        <label for="f-ciname">CI Name *</label>
        <input type="text" id="f-ciname" placeholder="Ex: WBA000133"
               value="${escapeHtml(t.ciName || '')}" required minlength="3" />
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="f-cicat">Categoria</label>
          <input type="text" id="f-cicat" placeholder="Ex: application" value="${escapeHtml(t.ciCat || '')}" />
        </div>
        <div class="form-group">
          <label for="f-cisubcat">Sub-categoria</label>
          <input type="text" id="f-cisubcat" placeholder="Ex: Web Based Application" value="${escapeHtml(t.ciSubcat || '')}" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="f-status">Estado *</label>
          <select id="f-status">
            <option value="open"        ${sel(curStatus, 'open')}>Aberto</option>
            <option value="in_progress" ${sel(curStatus, 'in_progress')}>Em Progresso</option>
            <option value="closed"      ${sel(curStatus, 'closed')}>Fechado</option>
          </select>
        </div>
        <div class="form-group">
          <label for="f-impact">Impacto</label>
          <select id="f-impact">
            <option value="1" ${sel(curImpact, '1')}>1 — Alto</option>
            <option value="2" ${sel(curImpact, '2')}>2 — Médio</option>
            <option value="3" ${sel(curImpact, '3')}>3 — Baixo</option>
            <option value="4" ${sel(curImpact, '4')}>4 — Muito Baixo</option>
            <option value="5" ${sel(curImpact, '5')}>5 — Mínimo</option>
          </select>
        </div>
        <div class="form-group">
          <label for="f-urgency">Urgência</label>
          <select id="f-urgency">
            <option value="1" ${sel(curUrgency, '1')}>1 — Alta</option>
            <option value="2" ${sel(curUrgency, '2')}>2 — Média</option>
            <option value="3" ${sel(curUrgency, '3')}>3 — Baixa</option>
            <option value="4" ${sel(curUrgency, '4')}>4 — Muito Baixa</option>
            <option value="5" ${sel(curUrgency, '5')}>5 — Mínima</option>
          </select>
        </div>
      </div>
      <div id="form-error" style="color:var(--danger);font-size:.85rem;margin-top:.5rem;display:none;"></div>
    </form>
  `;

  openModal({
    title: isEdit ? `Editar Ticket #${t.id}` : 'Novo Ticket',
    body: formHtml,
    actions: [
      { label: 'Cancelar', className: 'btn--ghost', onClick: closeModal },
      { label: isEdit ? 'Guardar' : 'Criar', className: 'btn--primary', onClick: () => handleSubmit(isEdit, t.id) },
    ],
  });
}

async function handleSubmit(isEdit, ticketId) {
  const ciName = document.getElementById('f-ciname').value.trim();
  const ciCat = document.getElementById('f-cicat').value.trim();
  const ciSubcat = document.getElementById('f-cisubcat').value.trim();
  const status = document.getElementById('f-status').value;
  const impact = document.getElementById('f-impact').value;
  const urgency = document.getElementById('f-urgency').value;
  const priority = String(Math.ceil((parseInt(impact) + parseInt(urgency)) / 2));
  const errorEl = document.getElementById('form-error');

  if (!ciName || ciName.length < 3) {
    errorEl.textContent = 'O CI Name deve ter pelo menos 3 caracteres.';
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';

  const payload = { ciName, ciCat, ciSubcat, status, priority, impact, urgency };
  const actionLabel = isEdit ? 'Guardar' : 'Criar';
  const submitBtn = document.querySelector(`[data-action="${actionLabel}"]`);
  submitBtn.disabled = true;
  submitBtn.textContent = 'A guardar...';

  try {
    if (isEdit) {
      await updateTicket(ticketId, payload);
      showToast(`Ticket #${ticketId} atualizado.`, 'success');
    } else {
      const created = await createTicket(payload);
      showToast(`Ticket #${created.id} criado.`, 'success');
    }
    closeModal();
    loadTickets(currentFilters, currentOffset);
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = actionLabel;
    errorEl.textContent = `Erro: ${err.message}`;
    errorEl.style.display = 'block';
    showToast(err.message, 'error');
  }
}

async function handleEdit(id) {
  try {
    const ticket = await getTicketById(id);
    openTicketModal(ticket);
  } catch (err) {
    showToast(`Erro ao obter ticket: ${err.message}`, 'error');
  }
}

function handleDelete(id, rowEl) {
  openModal({
    title: 'Confirmar eliminação',
    body: `<p>Tens a certeza que queres arquivar o ticket <strong>#${id}</strong>?</p>
           <p style="color:var(--muted);font-size:.85rem;margin-top:.4rem">O registo não será apagado permanentemente.</p>`,
    actions: [
      { label: 'Cancelar', className: 'btn--ghost', onClick: closeModal },
      {
        label: 'Apagar',
        className: 'btn--danger',
        onClick: async () => {
          const btn = document.querySelector('[data-action="Apagar"]');
          btn.disabled = true; btn.textContent = 'A apagar...';
          try {
            await deleteTicket(id);
            closeModal();
            showToast(`Ticket #${id} arquivado.`, 'success');
            rowEl.style.transition = 'opacity .3s';
            rowEl.style.opacity = '0';
            setTimeout(() => {
              rowEl.remove();
              const tbody = document.getElementById('tickets-tbody');
              if (tbody && !tbody.children.length) loadTickets(currentFilters, currentOffset);
            }, 300);
          } catch (err) {
            btn.disabled = false; btn.textContent = 'Apagar';
            showToast(`Erro: ${err.message}`, 'error');
          }
        },
      },
    ],
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}