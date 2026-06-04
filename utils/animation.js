/**
 * utils/animation.js
 * Professional bar and graph renderers.
 * - Bar renderer: pointers, gradients, trails, tooltips
 * - Graph renderer: draggable nodes, edge weights, path highlighting
 */

// ─── Audio ────────────────────────────────────────────────────────────────────
let _audioCtx = null;
function _getAudio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

/**
 * Play a short beep pitched to a value.
 * @param {number} value - Array value (0-100 typically)
 * @param {'sine'|'triangle'|'square'} type
 */
export function playBeep(value, type = 'sine', enabled = false) {
  if (!enabled) return;
  try {
    const ctx = _getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    const freq = 180 + value * 7;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (_) { /* silent fail */ }
}

// ─── Bar Renderer ─────────────────────────────────────────────────────────────
/**
 * Render sorted/searching bars into three containers:
 *   - barsEl     : the bar divs
 *   - pointersEl : pointer labels (i, j, pivot, etc.)
 *   - indicesEl  : index numbers below bars
 *
 * @param {HTMLElement} barsEl
 * @param {HTMLElement} pointersEl
 * @param {HTMLElement} indicesEl
 * @param {number[]} values
 * @param {object} opts
 */
export function renderBars(barsEl, pointersEl, indicesEl, values, opts = {}) {
  const {
    activeIndex = -1,
    comparingIndices = [],
    sortedIndices = [],
    foundIndex = -1,
    pivotIndex = -1,
    loIndex = -1,
    hiIndex = -1,
    rangeIndices = [],
    dimmedIndices = [],
    pointers = {},       // { i: 3, j: 5, mid: 7, lo: 0, hi: 11, pivot: 4 }
    showIndices = true,
    showPointers = true,
    soundEnabled = false,
    tooltipEl = null,
    trailing = [],       // previous active indices for trail effect
  } = opts;

  const max = Math.max(...values, 1);
  const count = values.length;

  // Reuse existing bars or create from scratch (perf: minimal DOM thrash)
  // We always recreate cleanly for correctness; at 80 bars this is ~3ms
  barsEl.innerHTML = '';
  pointersEl.innerHTML = '';
  indicesEl.innerHTML = '';

  values.forEach((v, i) => {
    const pct = Math.max((v / max) * 100, 2);
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.setProperty('--h', `${pct}%`);

    // ── State classes ──
    if (foundIndex === i) bar.classList.add('found');
    else if (sortedIndices.includes(i)) bar.classList.add('sorted');
    else if (i === pivotIndex) bar.classList.add('pivot');
    else if (comparingIndices.includes(i)) bar.classList.add('comparing');
    else if (i === activeIndex) bar.classList.add('active');
    else if (rangeIndices.includes(i)) bar.classList.add('range');
    if (dimmedIndices.includes(i)) bar.classList.add('dimmed');
    if (trailing.includes(i)) bar.classList.add('trail');

    // Value label
    const valEl = document.createElement('span');
    valEl.className = 'bar-val';
    valEl.textContent = v;
    bar.appendChild(valEl);

    // Tooltip
    if (tooltipEl) {
      bar.addEventListener('mouseenter', e => {
        tooltipEl.textContent = `Value: ${v}\nIndex: ${i}`;
        tooltipEl.classList.add('visible');
        _positionTooltip(tooltipEl, e);
      });
      bar.addEventListener('mousemove', e => _positionTooltip(tooltipEl, e));
      bar.addEventListener('mouseleave', () => tooltipEl.classList.remove('visible'));
    }

    // Sound on active comparison
    if (soundEnabled && comparingIndices.includes(i)) playBeep(v, 'sine', true);

    barsEl.appendChild(bar);

    // ── Pointer cells ──
    const ptrCell = document.createElement('div');
    ptrCell.className = 'ptr-cell';

    const pointerNames = Object.entries(pointers)
      .filter(([, idx]) => idx === i)
      .map(([name]) => name);

    if (showPointers && pointerNames.length) {
      pointerNames.forEach(name => {
        const lbl = document.createElement('span');
        lbl.className = `ptr-label ptr-${name}`;
        lbl.textContent = name;
        ptrCell.appendChild(lbl);
      });
    }
    pointersEl.appendChild(ptrCell);

    // ── Index cells ──
    const idxCell = document.createElement('div');
    idxCell.className = 'idx-cell';
    if (showIndices) idxCell.textContent = i;
    indicesEl.appendChild(idxCell);
  });
}

function _positionTooltip(el, e) {
  const margin = 12;
  let x = e.clientX + margin;
  let y = e.clientY - 40;
  const rect = el.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - margin;
  if (y < 0) y = e.clientY + margin;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

// ─── Graph Renderer ───────────────────────────────────────────────────────────
/**
 * Render the graph onto a canvas element.
 * Supports: node drag state, path highlighting, negative cycle highlighting.
 */
export function renderGraph(canvas, graph, state = {}) {
  if (!canvas || !graph) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (!graph.nodes?.length) return;

  const {
    visited = new Set(),
    current = null,
    path = [],
    distances = {},
    queue = [],
    relaxedEdges = new Set(),
    negCycleEdges = new Set(),
    dragNode = -1,
  } = state;

  const R = _nodeRadius(graph.nodes.length, W);

  // ── Draw Edges ──
  const drawn = new Set();
  graph.displayEdges.forEach(edge => {
    const key = `${edge.from}-${edge.to}`;
    const rkey = `${edge.to}-${edge.from}`;
    if (!graph.directed && drawn.has(rkey)) return;
    drawn.add(key);

    const fn = graph.nodes[edge.from];
    const tn = graph.nodes[edge.to];
    if (!fn || !tn) return;

    const onPath = _edgeOnPath(path, edge.from, edge.to, graph.directed);
    const isRelaxed = relaxedEdges.has(key) || relaxedEdges.has(rkey);
    const isNegCyc = negCycleEdges.has(key) || negCycleEdges.has(rkey);

    // Compute draw endpoints (offset from node center by radius)
    const { sx, sy, ex, ey } = _edgeEndpoints(fn, tn, R, graph.directed);

    // Glow for path/negative cycle
    ctx.save();
    if (onPath) {
      ctx.shadowColor = 'rgba(16,185,129,0.7)';
      ctx.shadowBlur = 16;
    } else if (isNegCyc) {
      ctx.shadowColor = 'rgba(239,68,68,0.8)';
      ctx.shadowBlur = 18;
    }

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineWidth = onPath ? 3.5 : isNegCyc ? 2.5 : isRelaxed ? 2 : 1.6;
    ctx.strokeStyle = isNegCyc ? '#ef4444'
      : onPath ? '#10b981'
        : isRelaxed ? '#f59e0b'
          : 'rgba(148,163,184,0.25)';
    ctx.stroke();
    ctx.restore();

    if (graph.directed) _arrow(ctx, sx, sy, ex, ey, ctx.strokeStyle || 'rgba(148,163,184,0.4)');

    // Weight label
    const mx = (fn.x + tn.x) / 2;
    const my = (fn.y + tn.y) / 2;
    const dx = tn.x - fn.x, dy = tn.y - fn.y;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = (-dy / len) * 13;
    const perpY = (dx / len) * 13;
    ctx.fillStyle = onPath ? '#6ee7b7' : isRelaxed ? '#fcd34d' : 'rgba(203,213,225,0.65)';
    ctx.font = `bold ${Math.max(10, R * 0.44)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(edge.weight, mx + perpX, my + perpY);
  });

  // ── Draw Nodes ──
  graph.nodes.forEach((node, id) => {
    const isVisited = visited.has(id);
    const isCurrent = id === current;
    const isOnPath = path.includes(id);
    const isQueued = queue.includes(id);
    const isDragging = id === dragNode;

    // Glow aura
    if (isCurrent || isOnPath || isDragging) {
      ctx.save();
      ctx.shadowColor = isCurrent ? 'rgba(251,191,36,0.9)'
        : isDragging ? 'rgba(6,182,212,0.9)'
          : 'rgba(16,185,129,0.7)';
      ctx.shadowBlur = isDragging ? 30 : 22;
      ctx.beginPath();
      ctx.arc(node.x, node.y, R + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'transparent';
      ctx.fill();
      ctx.restore();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, R, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(node.x - R * 0.3, node.y - R * 0.35, R * 0.05, node.x, node.y, R);
    if (isDragging) { grad.addColorStop(0, '#67e8f9'); grad.addColorStop(1, '#0e7490'); }
    else if (isCurrent) { grad.addColorStop(0, '#fde68a'); grad.addColorStop(1, '#b45309'); }
    else if (isOnPath) { grad.addColorStop(0, '#6ee7b7'); grad.addColorStop(1, '#065f46'); }
    else if (isQueued) { grad.addColorStop(0, '#c4b5fd'); grad.addColorStop(1, '#5b21b6'); }
    else if (isVisited) { grad.addColorStop(0, '#93c5fd'); grad.addColorStop(1, '#1e40af'); }
    else { grad.addColorStop(0, '#334155'); grad.addColorStop(1, '#0f172a'); }

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = isCurrent ? '#fbbf24'
      : isDragging ? '#06b6d4'
        : isOnPath ? '#10b981'
          : isVisited || isQueued ? 'rgba(148,163,184,0.4)'
            : 'rgba(100,116,139,0.35)';
    ctx.lineWidth = (isCurrent || isOnPath || isDragging) ? 2.5 : 1.5;
    ctx.stroke();

    // Node label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(11, R * 0.52)}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y);

    // Distance badge (Dijkstra / Bellman-Ford)
    if (distances[id] !== undefined) {
      const d = distances[id];
      const lbl = d === Infinity ? '∞' : d;
      const by = node.y + R + 14;
      ctx.font = `600 ${Math.max(9, R * 0.38)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isCurrent ? '#fde68a' : isOnPath ? '#a7f3d0' : '#64748b';
      ctx.fillText(lbl, node.x, by);
    }
  });

  // ── Graph Legend ──
  const legItems = [
    { c: '#fbbf24', l: 'Current' },
    { c: '#10b981', l: 'Path/Done' },
    { c: '#3b82f6', l: 'Visited' },
    { c: '#8b5cf6', l: 'Queued' },
    { c: '#ef4444', l: 'Neg. Cycle' },
  ];
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '11px "Space Grotesk", sans-serif';
  legItems.forEach(({ c, l }, i) => {
    const lx = 14, ly = 14 + i * 20;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect?.(lx, ly - 5, 12, 10, 2) ?? ctx.rect(lx, ly - 5, 12, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.fillText(l, lx + 17, ly);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _nodeRadius(count, canvasW) {
  return Math.max(16, Math.min(28, canvasW / (count * 3.2)));
}

function _edgeEndpoints(fn, tn, R, directed) {
  const dx = tn.x - fn.x, dy = tn.y - fn.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    sx: fn.x + (dx / len) * R,
    sy: fn.y + (dy / len) * R,
    ex: tn.x - (dx / len) * (R + (directed ? 10 : 0)),
    ey: tn.y - (dy / len) * (R + (directed ? 10 : 0)),
  };
}

function _edgeOnPath(path, from, to, directed) {
  for (let i = 0; i < path.length - 1; i++) {
    if (path[i] === from && path[i + 1] === to) return true;
    if (!directed && path[i] === to && path[i + 1] === from) return true;
  }
  return false;
}

function _arrow(ctx, x1, y1, x2, y2, color) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 11;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(angle - 0.4), y2 - len * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - len * Math.cos(angle + 0.4), y2 - len * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}