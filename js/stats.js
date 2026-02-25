/**
 * stats.js — Dashboard de estatísticas com pie charts via Canvas API
 */

import { getStatsByStatus, getStatsByPriority, getStatsByCiCat } from './api.js';
import { showToast, setNavActive, initNavbarToggle } from './ui.js';

const PALETTE = [
  '#E69F00', '#56B4E9', '#009E73', '#F0E442',
  '#0072B2', '#D55E00', '#CC79A7', '#000000',
];

document.addEventListener('DOMContentLoaded', () => {
  setNavActive();
  initNavbarToggle();
  loadAll();
  document.getElementById('btn-refresh').addEventListener('click', loadAll);
});

async function loadAll() {
  try {
    const [statusData, priorityData, cicatData] = await Promise.all([
      getStatsByStatus(),
      getStatsByPriority(),
      getStatsByCiCat(),
    ]);

    renderSummary(statusData);
    drawPie('chart-status',   'legend-status',   statusData,          'status',   statusLabel,   statusColor);
    drawPie('chart-priority', 'legend-priority', priorityData,        'priority', priorityLabel, null);
    drawPie('chart-cicat',    'legend-cicat',    cicatData.slice(0,6),'ciCat',    v => v,        null);

  } catch (err) {
    showToast('Erro ao carregar estatísticas: ' + err.message, 'error');
  }
}

// ── Resumo ────────────────────────────────────────────────
function renderSummary(statusData) {
  const total      = statusData.reduce((a, r) => a + (r.total || 0), 0);
  const openCount  = (statusData.find(r => r.status?.toLowerCase() === 'open')        || {}).total || 0;
  const inProgCount= (statusData.find(r => r.status?.toLowerCase() === 'in_progress') || {}).total || 0;
  const closedCount= (statusData.find(r => r.status?.toLowerCase() === 'closed')      || {}).total || 0;

  document.getElementById('summary-cards').innerHTML = `
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--total)">${total}</div>
      <div class="stat-card__label">Total Tickets</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--open)">${openCount}</div>
      <div class="stat-card__label">Abertos</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--inprogress)">${inProgCount}</div>
      <div class="stat-card__label">Em Progresso</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value" style="color:var(--closed)">${closedCount}</div>
      <div class="stat-card__label">Fechados</div>
    </div>
  `;
}

// ── Pie Chart (Canvas API puro) ───────────────────────────
function drawPie(canvasId, legendId, data, key, labelFn, colorFn) {
  const canvas = document.getElementById(canvasId);
  const legend = document.getElementById(legendId);

  if (!data || !data.length) {
    canvas.style.display = 'none';
    legend.innerHTML = '<li style="color:var(--muted)">Sem dados</li>';
    return;
  }

  const total  = data.reduce((a, r) => a + (r.total || 0), 0);
  if (total === 0) {
    canvas.style.display = 'none';
    legend.innerHTML = '<li style="color:var(--muted)">Sem dados</li>';
    return;
  }

  const ctx = canvas.getContext('2d');
  const cx  = canvas.width  / 2;
  const cy  = canvas.height / 2;
  const r   = Math.min(cx, cy) - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let startAngle = -Math.PI / 2;
  legend.innerHTML = '';

  data.forEach((row, i) => {
    const value   = row.total || 0;
    const slice   = (value / total) * 2 * Math.PI;
    const color   = colorFn ? colorFn(String(row[key] || '').toLowerCase()) : PALETTE[i % PALETTE.length];
    const rawKey  = String(row[key] || '');
    const label   = labelFn(rawKey.toLowerCase()) || rawKey || '(outro)';
    const pct     = Math.round((value / total) * 100);

    // Fatia
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Separador
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += slice;

    // Legenda
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="chart-legend__dot" style="background:${color}"></span>
      <span class="chart-legend__label">${label}</span>
      <span class="chart-legend__value">${value} (${pct}%)</span>
    `;
    legend.appendChild(li);
  });

  // Círculo central (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, 2 * Math.PI);
  ctx.fillStyle = '#151821';
  ctx.fill();

  // Número total no centro
  ctx.fillStyle = '#e8eaf0';
  ctx.font = `bold ${r * 0.28}px Syne, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy);
}

// ── Labels e cores ────────────────────────────────────────
function statusLabel(v) {
  return { open: 'Aberto', in_progress: 'Em Progresso', closed: 'Fechado' }[v] || v;
}

function statusColor(v) {
  return {
    open:        '#009E73', // verde esmeralda
    in_progress: '#0072B2', // azul escuro
    closed:      '#D55E00', // laranja avermelhado
  }[v] || '#56B4E9';
}

function priorityLabel(v) {
  return { '1': '1 — Crítica', '2': '2 — Alta', '3': '3 — Média', '4': '4 — Baixa', '5': '5 — Muito Baixa', 'na': 'N/A' }[v] || v;
}
