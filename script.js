/**
 * AlgoViz Pro — Main Application Controller
 * Orchestrates all modules: algorithms, animation, timeline, charts, export.
 */

import { Timeline, ExecutionController } from './utils/timeline.js';
import { renderBars, renderGraph, playBeep } from './utils/animation.js';
import { exportJSON, exportCSV, exportPNG } from './utils/export.js';

import {
  bubbleSort, selectionSort, insertionSort, mergeSort, quickSort,
  heapSort, shellSort, cocktailSort, combSort, gnomeSort,
  timSort, countingSort, radixSort, SORTING_META,
} from './algorithms/sorting.js';
import {
  linearSearch, binarySearch, jumpSearch, exponentialSearch,
  fibonacciSearch, interpolationSearch, ternarySearch, SEARCHING_META,
} from './algorithms/searching.js';
import {
  bfs, dfs, dijkstra, bellmanFord, generateGraph, GRAPH_META,
} from './algorithms/graph.js';

// ════════════════════════════════════════════════════════
// ALGORITHM REGISTRY
// ════════════════════════════════════════════════════════
const REGISTRY = {
  sorting: {
    bubbleSort:   { ...SORTING_META.bubbleSort,   run: bubbleSort },
    selectionSort:{ ...SORTING_META.selectionSort, run: selectionSort },
    insertionSort:{ ...SORTING_META.insertionSort, run: insertionSort },
    mergeSort:    { ...SORTING_META.mergeSort,    run: mergeSort },
    quickSort:    { ...SORTING_META.quickSort,    run: quickSort },
    heapSort:     { ...SORTING_META.heapSort,     run: heapSort },
    shellSort:    { ...SORTING_META.shellSort,    run: shellSort },
    cocktailSort: { ...SORTING_META.cocktailSort, run: cocktailSort },
    combSort:     { ...SORTING_META.combSort,     run: combSort },
    gnomeSort:    { ...SORTING_META.gnomeSort,    run: gnomeSort },
    timSort:      { ...SORTING_META.timSort,      run: timSort },
    countingSort: { ...SORTING_META.countingSort, run: countingSort },
    radixSort:    { ...SORTING_META.radixSort,    run: radixSort },
  },
  searching: {
    linearSearch:        { ...SEARCHING_META.linearSearch,        run: linearSearch },
    binarySearch:        { ...SEARCHING_META.binarySearch,        run: binarySearch },
    jumpSearch:          { ...SEARCHING_META.jumpSearch,          run: jumpSearch },
    exponentialSearch:   { ...SEARCHING_META.exponentialSearch,   run: exponentialSearch },
    fibonacciSearch:     { ...SEARCHING_META.fibonacciSearch,     run: fibonacciSearch },
    interpolationSearch: { ...SEARCHING_META.interpolationSearch, run: interpolationSearch },
    ternarySearch:       { ...SEARCHING_META.ternarySearch,       run: ternarySearch },
  },
  graph: {
    bfs:         { ...GRAPH_META.bfs,         run: bfs },
    dfs:         { ...GRAPH_META.dfs,         run: dfs },
    dijkstra:    { ...GRAPH_META.dijkstra,    run: dijkstra },
    bellmanFord: { ...GRAPH_META.bellmanFord, run: bellmanFord },
  },
};

// ════════════════════════════════════════════════════════
// APPLICATION STATE
// ════════════════════════════════════════════════════════
const app = {
  mode:      'sorting',
  algKey:    'bubbleSort',
  array:     [],
  origArray: [],
  graph:     null,
  metrics:   { comparisons: 0, swaps: 0 },
  metricsHistory: [],
  running:   false,
  controller:null,
  timeline:  new Timeline(),
  soundOn:   false,
  audioCtx:  null,
  startTime: 0,
  totalFrames: 0,
  logItems:  [],
  runData:   null,  // for export

  // Graph drag state
  dragNodeId:  -1,
  dragOffX:    0,
  dragOffY:    0,
};

// ════════════════════════════════════════════════════════
// DOM REFERENCES
// ════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const DOM = {
  // Sidebar
  navBtns:         document.querySelectorAll('.nav-btn'),
  algSelect:       $('algorithmSelect'),
  speedSlider:     $('speedSlider'),
  speedValue:      $('speedValue'),
  arraySizeSlider: $('arraySizeSlider'),
  arraySizeVal:    $('arraySizeVal'),
  showIndices:     $('showIndices'),
  showPointers:    $('showPointers'),
  stepMode:        $('stepMode'),
  soundToggle:     $('soundToggle'),
  themeBtn:        $('themeBtn'),
  openCompare:     $('openCompare'),
  openExport:      $('openExport'),

  // Topbar
  modeLabel:       $('modeLabel'),
  algLabel:        $('algLabel'),
  metricCmp:       $('metricComparisons'),
  metricSwap:      $('metricSwaps'),
  metricTime:      $('metricTime'),
  metricStep:      $('metricStep'),
  customArr:       $('customArrayInput'),
  searchTarget:    $('searchTarget'),
  searchGroup:     $('searchTargetGroup'),

  // Viz panel
  generateBtn:     $('generateBtn'),
  startBtn:        $('startBtn'),
  pauseBtn:        $('pauseBtn'),
  resetBtn:        $('resetBtn'),
  statusMsg:       $('statusMsg'),
  statusDot:       $('statusDot'),
  arrayMetaBadge:  $('arrayMetaBadge'),

  // Timeline
  tlPrev:          $('tlPrev'),
  tlNext:          $('tlNext'),
  tlReplay:        $('tlReplay'),
  tlFill:          $('timelineFill'),
  tlThumb:         $('timelineThumb'),
  tlCurrent:       $('tlCurrent'),
  tlTotal:         $('tlTotal'),
  timelineTrack:   $('timelineTrack'),

  // Viz area
  barsContainer:   $('barsContainer'),
  pointersRow:     $('pointersRow'),
  indicesRow:      $('indicesRow'),
  graphCanvas:     $('graphCanvas'),
  barLegend:       $('barLegend'),
  graphToolbar:    $('graphToolbar'),

  // Graph controls
  nodeCount:       $('nodeCount'),
  startNode:       $('startNode'),
  endNode:         $('endNode'),
  endNodeWrap:     $('endNodeWrap'),
  directedToggle:  $('directedToggle'),

  // Pseudocode
  pseudoEl:        $('pseudocodeEl'),
  pseudoLineBadge: $('pseudoLineBadge'),

  // Explanation
  algorithmDesc:   $('algorithmDesc'),
  stepExplain:     $('stepExplain'),
  stepExplainText: $('stepExplainText'),

  // Charts
  metricsChart:    $('metricsChart'),

  // Log
  logList:         $('logList'),
  logCount:        $('logCount'),
  clearLogBtn:     $('clearLogBtn'),

  // Complexity
  timeComplexity:  $('timeComplexity'),
  spaceComplexity: $('spaceComplexity'),
  stableInfo:      $('stableInfo'),

  // Modals
  exportModal:     $('exportModal'),
  compareModal:    $('compareModal'),
  exportJSON:      $('exportJSON'),
  exportCSV:       $('exportCSV'),
  exportPNG:       $('exportPNG'),
  compareAlgA:     $('compareAlgA'),
  compareAlgB:     $('compareAlgB'),
  runCompareBtn:   $('runCompareBtn'),
  compareResults:  $('compareResults'),
  cmpBarsRow:      $('cmpBarsRow'),
  compareChart:    $('compareChart'),
  cmpTable:        $('cmpTable'),

  // Splash
  splash:          $('splash'),
  tooltip:         $('tooltip'),
};

// ════════════════════════════════════════════════════════
// CHART.JS METRICS CHART
// ════════════════════════════════════════════════════════
let metricsChart = null;
let compareChartInst = null;

function initMetricsChart() {
  if (!window.Chart || !DOM.metricsChart) return;
  const ctx = DOM.metricsChart.getContext('2d');
  metricsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Comparisons',
          data: [],
          borderColor: 'rgb(6,182,212)',
          backgroundColor: 'rgba(6,182,212,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'Swaps',
          data: [],
          borderColor: 'rgb(168,85,247)',
          backgroundColor: 'rgba(168,85,247,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-2').trim(), font: { family: 'Space Grotesk', size: 11 }, boxWidth: 12 } },
      },
      scales: {
        x: { display: false },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 5 },
          grid: { color: 'rgba(148,163,184,0.06)' },
        },
      },
    },
  });
}

function pushMetricsPoint() {
  if (!metricsChart) return;
  const step = app.metricsHistory.length;
  metricsChart.data.labels.push(step);
  metricsChart.data.datasets[0].data.push(app.metrics.comparisons);
  metricsChart.data.datasets[1].data.push(app.metrics.swaps);
  // Trim to last 200 points for performance
  if (metricsChart.data.labels.length > 200) {
    metricsChart.data.labels.shift();
    metricsChart.data.datasets.forEach(d => d.data.shift());
  }
  metricsChart.update('none');
}

function resetMetricsChart() {
  if (!metricsChart) return;
  metricsChart.data.labels = [];
  metricsChart.data.datasets.forEach(d => (d.data = []));
  metricsChart.update('none');
}

// ════════════════════════════════════════════════════════
// PSEUDOCODE RENDERING
// ════════════════════════════════════════════════════════
function renderPseudocode(lines, activeLine = -1) {
  if (!DOM.pseudoEl || !lines?.length) return;
  DOM.pseudoEl.innerHTML = '';
  lines.forEach(({ n, t }) => {
    const row  = document.createElement('div');
    row.className = 'pseudo-line' + (n === activeLine ? ' active' : '');
    row.dataset.line = n;

    const num  = document.createElement('span');
    num.className = 'pseudo-line-num';
    num.textContent = n;

    const txt  = document.createElement('span');
    txt.className = 'pseudo-line-text';
    txt.textContent = t;

    row.appendChild(num);
    row.appendChild(txt);
    DOM.pseudoEl.appendChild(row);
  });

  DOM.pseudoLineBadge.textContent = activeLine >= 0 ? `Line ${activeLine}` : '—';

  // Scroll active line into view
  if (activeLine >= 0) {
    const el = DOM.pseudoEl.querySelector(`[data-line="${activeLine}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function highlightPseudoLine(n) {
  DOM.pseudoEl?.querySelectorAll('.pseudo-line').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.line) === n);
  });
  DOM.pseudoLineBadge.textContent = n >= 0 ? `Line ${n}` : '—';
  if (n >= 0) {
    const el = DOM.pseudoEl?.querySelector(`[data-line="${n}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ════════════════════════════════════════════════════════
// ALGORITHM DETAILS
// ════════════════════════════════════════════════════════
function updateAlgorithmDetails() {
  const alg = REGISTRY[app.mode][app.algKey];
  if (!alg) return;
  DOM.timeComplexity.textContent  = alg.time   || '—';
  DOM.spaceComplexity.textContent = alg.space  || '—';
  DOM.stableInfo.textContent      = alg.stable != null ? (alg.stable ? 'Yes ✓' : 'No ✗') : '—';
  DOM.algorithmDesc.textContent   = alg.description || '';
  DOM.algLabel.textContent        = alg.label;
  renderPseudocode(alg.pseudocode || [], -1);

  // Breadcrumb
  const modeLabels = { sorting: 'Sorting', searching: 'Searching', graph: 'Graph' };
  DOM.modeLabel.textContent = modeLabels[app.mode];
}

// ════════════════════════════════════════════════════════
// POPULATE SELECTS
// ════════════════════════════════════════════════════════
function populateAlgorithmSelect(mode) {
  const fill = sel => {
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '';
    Object.entries(REGISTRY[mode]).forEach(([k, alg]) => {
      const o = document.createElement('option');
      o.value = k; o.textContent = alg.label;
      sel.appendChild(o);
    });
    if (cur && REGISTRY[mode][cur]) sel.value = cur;
    else sel.selectedIndex = 0;
  };
  fill(DOM.algSelect);
  fill(DOM.compareAlgA);
  fill(DOM.compareAlgB);
  if (DOM.compareAlgB && DOM.compareAlgA) {
    const keys = Object.keys(REGISTRY[mode]);
    if (DOM.compareAlgB.value === DOM.compareAlgA.value && keys.length > 1) {
      DOM.compareAlgB.value = keys[1];
    }
  }
}

function populateNodeSelects() {
  if (!app.graph) return;
  const { nodes } = app.graph;
  const needsEnd = ['dijkstra', 'bellmanFord'].includes(app.algKey);
  [DOM.startNode, DOM.endNode].forEach((sel, isEnd) => {
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '';
    if (isEnd) { const o = document.createElement('option'); o.value='-1'; o.textContent='(all)'; sel.appendChild(o); }
    nodes.forEach(n => {
      const o = document.createElement('option');
      o.value = n.id; o.textContent = `Node ${n.label}`;
      sel.appendChild(o);
    });
    if (cur && [...sel.options].some(o => o.value === cur)) sel.value = cur;
    else sel.selectedIndex = isEnd ? 0 : 0;
  });
  if (DOM.endNodeWrap) DOM.endNodeWrap.style.display = needsEnd ? '' : 'none';
}

// ════════════════════════════════════════════════════════
// MODE SWITCHING
// ════════════════════════════════════════════════════════
function switchMode(mode) {
  app.mode = mode;
  DOM.navBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
    b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
  });

  const isGraph = mode === 'graph';
  const isSearch = mode === 'searching';

  // Toggle UI sections
  DOM.barsContainer.classList.toggle('hidden', isGraph);
  DOM.pointersRow.classList.toggle('hidden', isGraph);
  DOM.indicesRow.classList.toggle('hidden', isGraph);
  DOM.graphCanvas.classList.toggle('hidden', !isGraph);
  DOM.graphToolbar.classList.toggle('hidden', !isGraph);
  DOM.barLegend.classList.toggle('hidden', isGraph);
  DOM.searchGroup.classList.toggle('hidden', !isSearch);
  DOM.customArr.closest('.input-group').classList.toggle('hidden', isGraph || isSearch);
  // Show the below-bars search input row in searching mode
  const searchInputRow = $('searchInputRow');
  if (searchInputRow) searchInputRow.classList.toggle('hidden', !isSearch);

  populateAlgorithmSelect(mode);
  app.algKey = DOM.algSelect.value;
  updateAlgorithmDetails();

  if (isGraph) {
    if (!app.graph) doGenerate();
    else { populateNodeSelects(); renderGraphState({}); }
  }
}

// ════════════════════════════════════════════════════════
// ARRAY HELPERS
// ════════════════════════════════════════════════════════
function randomInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function parseArrayInput(raw) {
  const t = raw.trim();
  if (!t) return null;
  const parts = t.split(/[\s,;]+/).filter(Boolean);
  if (!parts.length) return null;
  const vals = parts.map(p => {
    const n = Number(p);
    if (Number.isNaN(n)) throw new Error(`"${p}" is not a valid number.`);
    return Math.round(n);
  });
  return vals;
}

function setArray(vals) {
  app.array     = vals.slice();
  app.origArray = vals.slice();
  app.metrics   = { comparisons: 0, swaps: 0 };
  app.metricsHistory = [];
  updateMetrics();
  updateArrayMeta();
  renderCurrentBars();
}

function updateArrayMeta() {
  if (app.mode === 'graph') {
    const g = app.graph;
    DOM.arrayMetaBadge.textContent = g ? `${g.nodeCount} nodes · ${g.displayEdges.length} edges` : '—';
  } else {
    const v = app.array;
    DOM.arrayMetaBadge.textContent = v.length
      ? `${v.length} elements · min ${Math.min(...v)} · max ${Math.max(...v)}`
      : '—';
  }
}

function validateArray(vals, mode, key) {
  if ((mode === 'sorting') && (key === 'countingSort' || key === 'radixSort')) {
    if (vals.some(v => !Number.isInteger(v) || v < 0))
      throw new Error('Counting / Radix sort requires non-negative integers only.');
  }
}

// ════════════════════════════════════════════════════════
// GENERATE
// ════════════════════════════════════════════════════════
function doGenerate() {
  stopRun();
  try {
    if (app.mode === 'graph') {
      const nc  = Math.min(12, Math.max(4, parseInt(DOM.nodeCount.value) || 8));
      const dir = DOM.directedToggle.checked;
      const cW  = DOM.graphCanvas.clientWidth  || 700;
      const cH  = DOM.graphCanvas.clientHeight || 380;
      app.graph = generateGraph(nc, cW, cH, dir);
      updateArrayMeta();
      populateNodeSelects();
      renderGraphState({});
      log(`Generated ${dir ? 'directed' : 'undirected'} graph: ${nc} nodes.`, 'info');
      setStatus('Graph generated — press Start to run the algorithm.');
    } else {
      const raw  = DOM.customArr.value;
      const size = parseInt(DOM.arraySizeSlider.value) || 24;
      const parsed = raw.trim() ? parseArrayInput(raw) : null;
      const arr = parsed ?? Array.from({ length: size }, () => randomInt(5, 99));
      validateArray(arr, app.mode, app.algKey);
      setArray(arr);
      const msg = parsed ? `Custom array loaded (${arr.length} elements).` : `Random array of ${arr.length} elements.`;
      log(msg, 'info');
      setStatus(msg);
    }
    app.timeline.clear();
    updateTimelineUI();
    resetMetricsChart();
    setProgress(0);
  } catch (e) {
    setStatus(e.message, 'error');
    toast(e.message, 'error');
  }
}

// ════════════════════════════════════════════════════════
// RENDER HELPERS
// ════════════════════════════════════════════════════════
function renderCurrentBars(opts = {}) {
  renderBars(
    DOM.barsContainer,
    DOM.pointersRow,
    DOM.indicesRow,
    app.array,
    {
      showIndices: DOM.showIndices.checked,
      showPointers: DOM.showPointers.checked,
      soundEnabled: app.soundOn,
      tooltipEl: DOM.tooltip,
      ...opts,
    },
  );
}

function renderGraphState(gState) {
  const canvas = DOM.graphCanvas;
  if (!canvas || !app.graph) return;
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  renderGraph(canvas, app.graph, { ...gState, dragNode: app.dragNodeId });
}

// ════════════════════════════════════════════════════════
// METRICS & STATUS
// ════════════════════════════════════════════════════════
function updateMetrics() {
  DOM.metricCmp.textContent  = app.metrics.comparisons;
  DOM.metricSwap.textContent = app.metrics.swaps;
  DOM.metricStep.textContent = app.timeline.cursor >= 0 ? app.timeline.cursor : 0;
  const elapsed = app.startTime ? Date.now() - app.startTime : 0;
  DOM.metricTime.textContent = elapsed < 1000 ? `${elapsed}ms` : `${(elapsed/1000).toFixed(1)}s`;
  app.metricsHistory.push({ comparisons: app.metrics.comparisons, swaps: app.metrics.swaps });
  pushMetricsPoint();
}

function setStatus(msg, type = 'info') {
  DOM.statusMsg.textContent = msg;
  DOM.statusDot.className   = `status-dot ${type === 'error' ? 'error' : ''}`;
}

function setRunning(v) {
  DOM.statusDot.className = v ? 'status-dot running' : 'status-dot done';
}

function setProgress(pct) {
  DOM.tlFill.style.width  = `${pct}%`;
  DOM.tlThumb.style.left  = `${pct}%`;
}

// ════════════════════════════════════════════════════════
// TIMELINE UI
// ════════════════════════════════════════════════════════
function updateTimelineUI() {
  const tl = app.timeline;
  const cur = Math.max(0, tl.cursor);
  const tot = tl.length;
  DOM.tlCurrent.textContent = cur;
  DOM.tlTotal.textContent   = tot;
  DOM.tlPrev.disabled = tl.atStart || tot === 0;
  DOM.tlNext.disabled = tl.atEnd   || tot === 0;
  setProgress(tl.progress * 100);
  // Update step next button counter
  if (window._updateStepNextBtn) window._updateStepNextBtn();
}

// ════════════════════════════════════════════════════════
// RUN CONTEXT FACTORY
// ════════════════════════════════════════════════════════
function createRunContext(controller) {
  return {
    metrics: app.metrics,
    syncMetrics: updateMetrics,

    async frame(values, opts = {}) {
      // Update live array
      app.array = values.slice();

      // Render bars
      renderBars(
        DOM.barsContainer,
        DOM.pointersRow,
        DOM.indicesRow,
        values,
        {
          showIndices: DOM.showIndices.checked,
          showPointers: DOM.showPointers.checked,
          soundEnabled: app.soundOn,
          tooltipEl: DOM.tooltip,
          ...opts,
        },
      );

      // Pseudocode sync
      if (opts.pseudoLine != null) highlightPseudoLine(opts.pseudoLine);

      // Step explanation
      if (opts.explain) {
        DOM.stepExplain.classList.remove('hidden');
        DOM.stepExplainText.textContent = opts.explain;
      }

      // Status
      if (opts.message) setStatus(opts.message);

      // Metrics
      updateMetrics();

      // Record frame for timeline
      app.timeline.record({
        type: 'bar',
        values: values.slice(),
        opts: { ...opts },
        metrics: { ...app.metrics },
      });

      updateTimelineUI();
      await controller.tick();
    },
  };
}

function createGraphRunContext(controller) {
  return {
    metrics: app.metrics,
    syncMetrics: updateMetrics,

    async graphFrame(gState = {}) {
      renderGraphState(gState);
      if (gState.pseudoLine != null) highlightPseudoLine(gState.pseudoLine);
      if (gState.explain) {
        DOM.stepExplain.classList.remove('hidden');
        DOM.stepExplainText.textContent = gState.explain;
      }
      if (gState.message) setStatus(gState.message);
      updateMetrics();

      app.timeline.record({
        type: 'graph',
        gState: { ...gState },
        metrics: { ...app.metrics },
      });

      updateTimelineUI();
      await controller.tick();
    },
  };
}

function createBenchmarkContext() {
  const metrics = { comparisons: 0, swaps: 0 };
  return {
    metrics,
    syncMetrics() {},
    async frame() {},
    async graphFrame() {},
  };
}

// ════════════════════════════════════════════════════════
// RUN / STOP / RESET
// ════════════════════════════════════════════════════════
async function startRun() {
  if (app.running) return;

  const alg = REGISTRY[app.mode][app.algKey];
  if (!alg) return;

  try {
    // Reset state
    app.metrics = { comparisons: 0, swaps: 0 };
    app.metricsHistory = [];
    app.timeline.clear();
    app.startTime = Date.now();
    resetMetricsChart();
    DOM.stepExplain.classList.add('hidden');

    const controller = new ExecutionController(() => Number(DOM.speedSlider.value));
    controller.setStepMode(DOM.stepMode.checked);
    app.controller = controller;

    setRunningState(true);
    setRunning(true);
    setStatus(`Running ${alg.label}…`);
    log(`Started: ${alg.label}`, 'info');

    if (app.mode === 'graph') {
      if (!app.graph) throw new Error('Generate a graph first.');
      const startId = parseInt(DOM.startNode.value);
      const endId   = parseInt(DOM.endNode.value);
      const ctx = createGraphRunContext(controller);
      await alg.run(app.graph, startId, endId, ctx);

    } else if (app.mode === 'searching') {
      const rawTarget = DOM.searchTarget.value.trim();
      if (!rawTarget) throw new Error('Enter a search target value.');
      const target = Number(rawTarget);
      if (Number.isNaN(target)) throw new Error('Search target must be a number.');
      const values = app.origArray.slice();
      const ctx = createRunContext(controller);
      const result = await alg.run(values, target, ctx);
      const finalVals = result?.values || values;
      app.array = finalVals.slice();
      renderCurrentBars({ foundIndex: result?.index ?? -1 });
      const msg = result?.index >= 0
        ? `✓ Found ${target} at index ${result.index}.`
        : `✗ ${target} not found in array.`;
      setStatus(msg);
      log(msg, result?.index >= 0 ? 'success' : 'warn');

    } else {
      const values = app.origArray.slice();
      validateArray(values, app.mode, app.algKey);
      const ctx = createRunContext(controller);
      const result = await alg.run(values, ctx);
      const finalVals = Array.isArray(result) ? result : values;
      app.array = finalVals.slice();
      renderCurrentBars({ sortedIndices: finalVals.map((_, i) => i) });
      const msg = `${alg.label} finished — ${app.metrics.comparisons} comparisons, ${app.metrics.swaps} swaps.`;
      setStatus(msg);
      log(msg, 'success');
    }

    setProgress(100);
    toast(`${alg.label} complete!`, 'success');
    highlightPseudoLine(-1);

    // Store run data for export
    app.runData = {
      mode: app.mode,
      algorithm: alg.label,
      startedAt: new Date(app.startTime).toISOString(),
      duration: Date.now() - app.startTime,
      metrics: { ...app.metrics },
      metricsHistory: [...app.metricsHistory],
      frames: app.timeline.length,
      input: app.origArray.slice(),
      output: app.array.slice(),
      log: [...app.logItems],
    };

  } catch (e) {
    if (e.message !== 'Execution stopped') {
      setStatus(e.message, 'error');
      log(e.message, 'error');
      toast(e.message, 'error');
    }
  } finally {
    app.controller = null;
    setRunningState(false);
    setRunning(false);
    updateMetrics();
    updateTimelineUI();
  }
}

function stopRun() {
  if (app.controller) {
    app.controller.stop();
    app.controller = null;
  }
  app.running = false;
}

function resetRun() {
  stopRun();
  app.array   = app.origArray.slice();
  app.metrics = { comparisons: 0, swaps: 0 };
  app.metricsHistory = [];
  app.timeline.clear();
  resetMetricsChart();
  updateMetrics();
  updateTimelineUI();
  setProgress(0);
  setStatus('Reset — press Start to run again.');
  DOM.stepExplain.classList.add('hidden');
  if (app.mode === 'graph') renderGraphState({});
  else renderCurrentBars();
  highlightPseudoLine(-1);
  log('Reset.', 'info');
}

function setRunningState(running) {
  app.running = running;
  DOM.startBtn.disabled    = running;
  DOM.generateBtn.disabled = running;
  DOM.customArr.disabled   = running;
  DOM.algSelect.disabled   = running;
  DOM.pauseBtn.disabled    = !running;
  DOM.stepMode.disabled    = running;
  DOM.arraySizeSlider.disabled = running;
}

// ════════════════════════════════════════════════════════
// TIMELINE SCRUBBING
// ════════════════════════════════════════════════════════
function restoreFrame(frame) {
  if (!frame) return;
  if (frame.type === 'bar') {
    app.array   = frame.values.slice();
    app.metrics = { ...frame.metrics };
    renderCurrentBars(frame.opts);
    if (frame.opts?.pseudoLine != null) highlightPseudoLine(frame.opts.pseudoLine);
    if (frame.opts?.explain) {
      DOM.stepExplain.classList.remove('hidden');
      DOM.stepExplainText.textContent = frame.opts.explain;
    }
  } else if (frame.type === 'graph') {
    app.metrics = { ...frame.metrics };
    renderGraphState(frame.gState);
    if (frame.gState?.pseudoLine != null) highlightPseudoLine(frame.gState.pseudoLine);
    if (frame.gState?.explain) {
      DOM.stepExplain.classList.remove('hidden');
      DOM.stepExplainText.textContent = frame.gState.explain;
    }
  }
  updateMetrics();
}

function stepBack() {
  if (app.running) return;
  const frame = app.timeline.back();
  if (frame) { restoreFrame(frame); updateTimelineUI(); }
}

function stepForward() {
  if (app.running) return;
  const frame = app.timeline.forward();
  if (frame) { restoreFrame(frame); updateTimelineUI(); }
}

async function replayAnimation() {
  if (app.running || app.timeline.length === 0) return;
  app.timeline.seek(0);
  const frames = app.timeline._frames;
  const delay  = () => Math.max(20, Number(DOM.speedSlider.value));
  for (let i = 0; i < frames.length; i++) {
    app.timeline.seek(i);
    restoreFrame(frames[i]);
    updateTimelineUI();
    await new Promise(r => setTimeout(r, delay()));
  }
}

// Timeline track click to seek
DOM.timelineTrack?.addEventListener('click', e => {
  if (app.running || app.timeline.length === 0) return;
  const rect = DOM.timelineTrack.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  const idx  = Math.floor(pct * (app.timeline.length - 1));
  app.timeline.seek(idx);
  restoreFrame(app.timeline.current());
  updateTimelineUI();
});

// ════════════════════════════════════════════════════════
// COMPARISON BENCHMARK
// ════════════════════════════════════════════════════════
async function runComparison() {
  const keyA = DOM.compareAlgA?.value;
  const keyB = DOM.compareAlgB?.value;
  const algA = REGISTRY[app.mode][keyA];
  const algB = REGISTRY[app.mode][keyB];
  if (!algA || !algB) return;

  DOM.runCompareBtn.disabled = true;
  DOM.runCompareBtn.textContent = 'Running…';
  DOM.compareResults.classList.add('hidden');

  const bench = async (alg, key) => {
    const ctx = createBenchmarkContext();
    const sample = app.mode === 'graph' ? null : app.origArray.slice();
    const target = app.mode === 'searching' ? Number(DOM.searchTarget.value) || 50 : null;
    const t0 = performance.now();
    try {
      if (app.mode === 'graph' && app.graph) {
        await alg.run(app.graph, 0, -1, ctx);
      } else if (app.mode === 'searching') {
        await alg.run(sample, target, ctx);
      } else {
        await alg.run(sample, ctx);
      }
    } catch (_) {}
    return { key, label: alg.label, ms: performance.now() - t0, ...ctx.metrics };
  };

  const [A, B] = await Promise.all([bench(algA, keyA), bench(algB, keyB)]);

  // Render comparison results
  DOM.compareResults.classList.remove('hidden');
  const winner = A.ms < B.ms ? A : B.ms < A.ms ? B : null;
  const maxMs = Math.max(A.ms, B.ms, 0.01);
  const maxCmp = Math.max(A.comparisons, B.comparisons, 1);

  DOM.cmpBarsRow.innerHTML = [A, B].map((r, i) => `
    <div class="cmp-alg-bar">
      <strong>${r.label}</strong>
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
          <span style="font-size:0.75rem;color:var(--text-3);width:70px">Time</span>
          <div class="cmp-viz-bar" style="background:${i===0?'var(--c-cyan)':'var(--c-purple)'};width:${(r.ms/maxMs)*100}%"></div>
          <span style="font-size:0.76rem;font-family:var(--font-mono)">${r.ms.toFixed(2)}ms</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
          <span style="font-size:0.75rem;color:var(--text-3);width:70px">Comparisons</span>
          <div class="cmp-viz-bar" style="background:${i===0?'var(--c-cyan)':'var(--c-purple)'};opacity:0.6;width:${(r.comparisons/maxCmp)*100}%"></div>
          <span style="font-size:0.76rem;font-family:var(--font-mono)">${r.comparisons}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Chart
  if (window.Chart) {
    if (compareChartInst) compareChartInst.destroy();
    const ctx2 = DOM.compareChart.getContext('2d');
    // Normalize data for chart — use log scale if values differ hugely
    const maxVal = Math.max(A.ms, B.ms, A.comparisons, B.comparisons, A.swaps, B.swaps);
    compareChartInst = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Time (ms)', 'Comparisons', 'Swaps'],
        datasets: [
          { 
            label: A.label, 
            data: [parseFloat(A.ms.toFixed(3)), A.comparisons, A.swaps], 
            backgroundColor: 'rgba(6,182,212,0.75)', 
            borderColor: 'rgba(6,182,212,1)',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          },
          { 
            label: B.label, 
            data: [parseFloat(B.ms.toFixed(3)), B.comparisons, B.swaps], 
            backgroundColor: 'rgba(168,85,247,0.75)', 
            borderColor: 'rgba(168,85,247,1)',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: { 
            position: 'top',
            labels: { 
              color: '#cbd5e1', 
              font: { family: 'Space Grotesk', size: 12, weight: '600' },
              padding: 16,
              boxWidth: 14,
              boxHeight: 14,
            } 
          },
          tooltip: {
            backgroundColor: 'rgba(10,15,30,0.95)',
            titleColor: '#e2e8f5',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(148,163,184,0.2)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: ctx => {
                const val = ctx.raw;
                const label = ctx.dataset.label;
                if (ctx.dataIndex === 0) return ` ${label}: ${val.toFixed(3)} ms`;
                return ` ${label}: ${val.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            ticks: { 
              color: '#94a3b8', 
              font: { family: 'JetBrains Mono', size: 11 },
              maxTicksLimit: 6,
              callback: val => val >= 1000 ? (val/1000).toFixed(1)+'k' : val,
            }, 
            grid: { color: 'rgba(148,163,184,0.08)' },
            border: { color: 'rgba(148,163,184,0.15)' },
          },
          x: { 
            ticks: { 
              color: '#cbd5e1', 
              font: { family: 'Space Grotesk', size: 12, weight: '500' } 
            },
            grid: { display: false },
            border: { color: 'rgba(148,163,184,0.15)' },
          },
        },
      },
    });
  }

  DOM.cmpTable.innerHTML = `
    <div class="cmp-row header"><span>Metric</span><span>${A.label}</span><span>${B.label}</span><span>Winner</span></div>
    <div class="cmp-row"><span>Time</span><span>${A.ms.toFixed(2)}ms</span><span>${B.ms.toFixed(2)}ms</span><span class="cmp-winner">${winner ? (winner===A?A.label:B.label) : 'Tie'}</span></div>
    <div class="cmp-row"><span>Comparisons</span><span>${A.comparisons}</span><span>${B.comparisons}</span><span class="cmp-winner">${A.comparisons<B.comparisons?A.label:B.comparisons<A.comparisons?B.label:'Tie'}</span></div>
    <div class="cmp-row"><span>Swaps</span><span>${A.swaps}</span><span>${B.swaps}</span><span class="cmp-winner">${A.swaps<B.swaps?A.label:B.swaps<A.swaps?B.label:'Tie'}</span></div>
    <div class="cmp-row"><span>Time</span><span colspan="2" style="grid-column:2/5">${winner ? `${winner.label} was <b>${Math.abs(A.ms-B.ms).toFixed(2)}ms faster</b>` : 'Algorithms tied.'}</span></div>
  `;

  DOM.runCompareBtn.disabled = false;
  DOM.runCompareBtn.textContent = 'Run Benchmark';
  log(`Comparison: ${A.label} vs ${B.label} — ${winner?.label ?? 'tied'}`, 'info');
}

// ════════════════════════════════════════════════════════
// GRAPH DRAG INTERACTION
// ════════════════════════════════════════════════════════
function initGraphDrag() {
  const canvas = DOM.graphCanvas;

  function getNodeAt(x, y) {
    if (!app.graph) return -1;
    const R = 28;
    for (let i = app.graph.nodes.length - 1; i >= 0; i--) {
      const n = app.graph.nodes[i];
      if (Math.hypot(n.x - x, n.y - y) <= R) return i;
    }
    return -1;
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function onDown(e) {
    if (app.running) return;
    const { x, y } = canvasPos(e);
    const id = getNodeAt(x, y);
    if (id >= 0) {
      app.dragNodeId = id;
      app.dragOffX   = x - app.graph.nodes[id].x;
      app.dragOffY   = y - app.graph.nodes[id].y;
      canvas.classList.add('drag-active');
      e.preventDefault();
    }
  }

  function onMove(e) {
    if (app.dragNodeId < 0 || !app.graph) return;
    const { x, y } = canvasPos(e);
    app.graph.nodes[app.dragNodeId].x = x - app.dragOffX;
    app.graph.nodes[app.dragNodeId].y = y - app.dragOffY;
    renderGraphState({});
    e.preventDefault();
  }

  function onUp() {
    app.dragNodeId = -1;
    canvas.classList.remove('drag-active');
  }

  canvas.addEventListener('mousedown',  onDown);
  canvas.addEventListener('mousemove',  onMove);
  canvas.addEventListener('mouseup',    onUp);
  canvas.addEventListener('mouseleave', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove',  onMove, { passive: false });
  canvas.addEventListener('touchend',   onUp);
}

// ════════════════════════════════════════════════════════
// LOGGING & TOASTS
// ════════════════════════════════════════════════════════
function log(msg, type = 'info') {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  app.logItems.push({ ts, msg, type });

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const tsEl  = document.createElement('span'); tsEl.className  = 'log-ts';  tsEl.textContent  = ts;
  const msgEl = document.createElement('span'); msgEl.className = 'log-msg'; msgEl.textContent = msg;
  entry.appendChild(tsEl);
  entry.appendChild(msgEl);
  DOM.logList.prepend(entry);

  // Trim
  while (DOM.logList.children.length > 60) DOM.logList.lastChild?.remove();
  DOM.logCount.textContent = Math.min(app.logItems.length, 60);
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon"></span><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3500);
}

// ════════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════════
function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}
function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

// ════════════════════════════════════════════════════════
// COLLAPSIBLE PANELS
// ════════════════════════════════════════════════════════
document.querySelectorAll('.collapsible-header').forEach(header => {
  header.addEventListener('click', () => {
    const bodyId = header.dataset.collapse;
    const body   = $(bodyId);
    const btn    = header.querySelector('.collapse-btn');
    if (!body) return;
    body.classList.toggle('collapsed');
    btn?.classList.toggle('rotated', body.classList.contains('collapsed'));
    btn?.setAttribute('aria-expanded', body.classList.contains('collapsed') ? 'false' : 'true');
  });
});

// ════════════════════════════════════════════════════════
// Theme handled by applyTheme() / toggleTheme() below

// ════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// THEME (with icon swap + splash)
// ══════════════════════════════════════════════════════════════════════════════
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const dark = theme === 'dark';
  DOM.themeBtn?.querySelector('.icon-moon')?.classList.toggle('hidden', !dark);
  DOM.themeBtn?.querySelector('.icon-sun')?.classList.toggle('hidden',  dark);
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') !== 'light' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('preferredTheme', next);
}

// ══════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════════════════════
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    switch (e.key) {
      case ' ':          e.preventDefault(); app.running ? DOM.pauseBtn?.click() : startRun(); break;
      case 'r': case 'R': if (!e.ctrlKey && !e.metaKey) resetRun();   break;
      case 'g': case 'G': if (!e.ctrlKey && !e.metaKey) doGenerate(); break;
      case 'ArrowLeft':  e.preventDefault(); stepBack();    break;
      case 'ArrowRight': e.preventDefault(); stepForward(); break;
      case 'Escape':     if (app.running) stopRun();        break;
      case '1': switchMode('sorting');   break;
      case '2': switchMode('searching'); break;
      case '3': switchMode('graph');     break;
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE PANELS
// ══════════════════════════════════════════════════════════════════════════════
function initCollapsibles() {
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('button:not(.collapse-btn)')) return;
      const body = header.dataset.collapse ? $(header.dataset.collapse) : null;
      const btn  = header.querySelector('.collapse-btn');
      if (!body) return;
      const collapsed = body.classList.toggle('collapsed');
      btn?.classList.toggle('rotated', collapsed);
      btn?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN INIT — all event listeners wired here
// ══════════════════════════════════════════════════════════════════════════════
function init() {
  // ── Theme ──
  applyTheme(localStorage.getItem('preferredTheme') ?? 'dark');

  // ── Splash: hide after CSS load animation (1.6s) ──
  setTimeout(() => {
    DOM.splash?.classList.add('hide');
    setTimeout(() => DOM.splash?.remove(), 600);
  }, 1800);

  // ── Sub-systems ──
  initMetricsChart();
  initGraphDrag();
  initCollapsibles();
  initKeyboard();

  // ── SIDEBAR collapse & mobile ──
  $('sidebarToggle')?.addEventListener('click', () => DOM.sidebar?.classList.toggle('collapsed'));
  DOM.mobileSidebarToggle?.addEventListener('click', () => DOM.sidebar?.classList.toggle('mobile-open'));
  document.addEventListener('click', e => {
    if (DOM.sidebar?.classList.contains('mobile-open') &&
        !DOM.sidebar.contains(e.target) &&
        e.target !== DOM.mobileSidebarToggle) {
      DOM.sidebar.classList.remove('mobile-open');
    }
  });

  // ── NAV BUTTONS (mode) ──
  DOM.navBtns.forEach(btn => {
    btn.addEventListener('click', () => { if (!btn.disabled) switchMode(btn.dataset.mode); });
  });

  // ── ALGORITHM SELECT ──
  DOM.algSelect?.addEventListener('change', () => {
    app.algKey = DOM.algSelect.value;
    updateAlgorithmDetails();
    if (app.mode === 'graph') populateNodeSelects();
  });

  // ── SPEED SLIDER (visual gradient + label) ──
  // Slider: 0 = no delay = Max Speed (fastest), 900 = 900ms delay = Slowest
  // The gradient fills left-to-right: left=fast, right=slow
  DOM.speedSlider?.addEventListener('input', updateSpeedLabel);

  function updateSpeedLabel() {
    const v   = Number(DOM.speedSlider.value);
    const max = Number(DOM.speedSlider.max);
    // --pct represents SPEED (not delay), so it is INVERTED:
    // v=0   (no delay = fastest) → pct=100% (full cyan fill = max speed)
    // v=900 (900ms delay = slowest) → pct=0% (empty fill = no speed)
    const speedPct = ((max - v) / max) * 100;
    DOM.speedSlider.style.setProperty('--pct', `${speedPct}%`);
    if (DOM.speedValue) {
      if (v === 0) DOM.speedValue.textContent = 'Max Speed';
      else if (v <= 100) DOM.speedValue.textContent = `${v}ms ⚡`;
      else DOM.speedValue.textContent = `${v}ms`;
    }
  }

  // ── ARRAY SIZE SLIDER ──
  DOM.arraySizeSlider?.addEventListener('input', () => {
    if (DOM.arraySizeVal) DOM.arraySizeVal.textContent = DOM.arraySizeSlider.value;
  });

  // ── TOGGLES ──
  DOM.showIndices?.addEventListener('change',  () => { if (app.mode !== 'graph') renderCurrentBars(); });
  DOM.showPointers?.addEventListener('change', () => { if (app.mode !== 'graph') renderCurrentBars(); });
  DOM.soundToggle?.addEventListener('change',  () => { app.soundOn = DOM.soundToggle.checked; });
  DOM.stepMode?.addEventListener('change', () => {
    app.controller?.setStepMode(DOM.stepMode.checked);
    // Show/hide the Next Step button based on step mode
    const wrap = $('stepNextWrap');
    if (wrap) wrap.classList.toggle('hidden', !DOM.stepMode.checked);
    // Update Next Step button state
    updateStepNextBtn();
  });

  // ── STEP NEXT BUTTON ──
  $('stepNextBtn')?.addEventListener('click', () => {
    if (app.controller && app.running) {
      app.controller.nextStep();
    } else {
      stepForward();
    }
    updateStepNextBtn();
  });

  function updateStepNextBtn() {
    const btn = $('stepNextBtn');
    const cc  = $('stepCounterCurrent');
    const ct  = $('stepCounterTotal');
    if (!btn) return;
    // Enable when: step mode is on AND either running (waiting for step) OR has timeline frames
    const canStep = DOM.stepMode?.checked && 
      (app.running || app.timeline.length > 0);
    btn.disabled = !canStep;
    if (cc) cc.textContent = Math.max(0, app.timeline.cursor);
    if (ct) ct.textContent = app.timeline.length;
  }

  // Expose updateStepNextBtn globally so timeline updates can call it
  window._updateStepNextBtn = updateStepNextBtn;

  // ── THEME ──
  DOM.themeBtn?.addEventListener('click', toggleTheme);

  // ── MODAL OPEN ──
  DOM.openCompare?.addEventListener('click', () => {
    populateAlgorithmSelect(app.mode);
    openModal('compareModal');
  });
  DOM.openExport?.addEventListener('click', () => openModal('exportModal'));

  // ── MODAL CLOSE ──
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // ── VIZ CONTROLS ──
  DOM.generateBtn?.addEventListener('click', doGenerate);
  DOM.startBtn?.addEventListener('click',    () => startRun());
  DOM.pauseBtn?.addEventListener('click', () => {
    if (!app.controller) return;
    app.controller.togglePause();
    const paused = app.controller.paused;
    if (DOM.pauseBtn) {
      DOM.pauseBtn.innerHTML = paused
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }
    setStatus(paused ? 'Paused — press Space or Resume.' : 'Resumed.');
  });
  DOM.resetBtn?.addEventListener('click', resetRun);

  // ── TIMELINE ──
  DOM.tlPrev?.addEventListener('click',   stepBack);
  DOM.tlNext?.addEventListener('click',   stepForward);
  DOM.tlReplay?.addEventListener('click', replayAnimation);

  // ── LOG ──
  DOM.clearLogBtn?.addEventListener('click', () => {
    if (DOM.logList)  DOM.logList.innerHTML = '';
    if (DOM.logCount) DOM.logCount.textContent = '0';
    app.logItems = [];
  });

  // ── EXPORT ──
  DOM.exportJSON?.addEventListener('click', () => {
    app.runData ? exportJSON(app.runData) : toast('Run an algorithm first.', 'info');
    closeModal('exportModal');
  });
  DOM.exportCSV?.addEventListener('click', () => {
    app.runData ? exportCSV(app.runData) : toast('Run an algorithm first.', 'info');
    closeModal('exportModal');
  });
  DOM.exportPNG?.addEventListener('click', () => {
    exportPNG($('vizPanel'));
    closeModal('exportModal');
  });

  // ── COMPARISON ──
  DOM.runCompareBtn?.addEventListener('click', runComparison);
  DOM.compareAlgA?.addEventListener('change', () => {
    if (DOM.compareAlgB?.value === DOM.compareAlgA.value) {
      DOM.compareAlgB.value = Object.keys(REGISTRY[app.mode]).find(k => k !== DOM.compareAlgA.value) ?? DOM.compareAlgA.value;
    }
  });
  DOM.compareAlgB?.addEventListener('change', () => {
    if (DOM.compareAlgA?.value === DOM.compareAlgB.value) {
      DOM.compareAlgA.value = Object.keys(REGISTRY[app.mode]).find(k => k !== DOM.compareAlgB.value) ?? DOM.compareAlgB.value;
    }
  });

  // ── GRAPH CONTROLS ──
  DOM.nodeCount?.addEventListener('change',      () => { if (app.mode === 'graph') doGenerate(); });
  DOM.directedToggle?.addEventListener('change', () => { if (app.mode === 'graph') doGenerate(); });

  // ── CUSTOM ARRAY: Enter key triggers generate ──
  DOM.customArr?.addEventListener('keydown', e => { if (e.key === 'Enter') doGenerate(); });

  // ── SEARCH INPUT BELOW BARS ──
  // Sync searchArrayInputBelow with customArrayInput
  const searchArrBelow    = $('searchArrayInputBelow');
  const searchTargetBelow = $('searchTargetBelow');
  const searchApplyBtn    = $('searchApplyBtn');

  searchArrBelow?.addEventListener('input', () => {
    if (DOM.customArr) DOM.customArr.value = searchArrBelow.value;
  });
  searchTargetBelow?.addEventListener('input', () => {
    if (DOM.searchTarget) DOM.searchTarget.value = searchTargetBelow.value;
  });
  searchApplyBtn?.addEventListener('click', () => {
    if (DOM.customArr && searchArrBelow) DOM.customArr.value = searchArrBelow.value;
    if (DOM.searchTarget && searchTargetBelow) DOM.searchTarget.value = searchTargetBelow.value;
    doGenerate();
  });
  searchArrBelow?.addEventListener('keydown', e => { if (e.key === 'Enter') searchApplyBtn?.click(); });
  searchTargetBelow?.addEventListener('keydown', e => { if (e.key === 'Enter') searchApplyBtn?.click(); });

  // ── RESIZE ──
  window.addEventListener('resize', () => { if (app.mode === 'graph' && app.graph) renderGraphState({}); });

  // ── BOOT ──
  // Set initial slider gradient
  if (DOM.speedSlider) {
    // Initial gradient — inverted: pct represents speed (not delay)
    const v   = Number(DOM.speedSlider.value);
    const max = Number(DOM.speedSlider.max);
    const speedPct = ((max - v) / max) * 100;
    DOM.speedSlider.style.setProperty('--pct', `${speedPct}%`);
    if (DOM.speedValue) DOM.speedValue.textContent = v === 0 ? 'Max Speed' : `${v}ms`;
  }
  if (DOM.arraySizeSlider && DOM.arraySizeVal) {
    DOM.arraySizeVal.textContent = DOM.arraySizeSlider.value;
  }

  switchMode('sorting');

  log('AlgoViz Pro v2 ready. Shortcuts: Space=play/pause · R=reset · G=generate · ←→=step · 1/2/3=mode', 'info');
  setTimeout(() => toast('Welcome to AlgoViz Pro! Press Space to start.', 'info'), 2000);
}

window.addEventListener('DOMContentLoaded', init);
