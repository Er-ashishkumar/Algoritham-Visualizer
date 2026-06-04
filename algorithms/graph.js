/**
 * algorithms/graph.js
 * Graph generation, BFS, DFS, Dijkstra, Bellman-Ford
 * with pseudocode sync and draggable node support.
 */

// ─── Graph Generation ─────────────────────────────────────────────────────────
export function generateGraph(nodeCount = 8, canvasW = 700, canvasH = 380, directed = false) {
  const margin = 64;
  const cx = canvasW / 2, cy = canvasH / 2;
  const rx = (canvasW - margin * 2) / 2;
  const ry = (canvasH - margin * 2) / 2;

  // Place nodes in a circle with slight jitter
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
    return {
      id: i,
      label: String.fromCharCode(65 + i),
      x: cx + rx * Math.cos(angle) + (Math.random() - 0.5) * 30,
      y: cy + ry * Math.sin(angle) + (Math.random() - 0.5) * 24,
    };
  });

  const edgeSet = new Set();
  const displayEdges = [];
  const adjacency = Array.from({ length: nodeCount }, () => []);

  const addEdge = (from, to, weight) => {
    const key = directed
      ? `${from}-${to}`
      : [Math.min(from, to), Math.max(from, to)].join('-');
    if (edgeSet.has(key) || from === to) return false;
    edgeSet.add(key);
    displayEdges.push({ from, to, weight });
    adjacency[from].push({ to, weight });
    if (!directed) adjacency[to].push({ to: from, weight });
    return true;
  };

  const rw = () => Math.floor(Math.random() * 14) + 1;
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  // Spanning tree for connectivity
  const perm = [...Array(nodeCount).keys()].sort(() => Math.random() - 0.5);
  for (let i = 1; i < perm.length; i++) {
    addEdge(perm[ri(0, i - 1)], perm[i], rw());
  }

  // Extra random edges
  let t = 0;
  while (displayEdges.length < nodeCount + Math.floor(nodeCount * 0.6) && t++ < 200) {
    addEdge(ri(0, nodeCount - 1), ri(0, nodeCount - 1), rw());
  }

  return { nodes, displayEdges, adjacency, directed, nodeCount };
}

// ─── BFS ─────────────────────────────────────────────────────────────────────
export async function bfs(graph, startId, _endId, ctx) {
  const { adjacency, nodes } = graph;
  const visited = new Set([startId]);
  const queue = [startId];
  const order = [];

  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    ctx.metrics.comparisons++;

    await ctx.graphFrame({
      visited: new Set(visited),
      current: u,
      queue: [...queue],
      path: [...order],
      pseudoLine: 4,
      message: `BFS visiting ${nodes[u].label} — queue: [${queue.map(n => nodes[n].label).join(', ') || 'empty'}]`,
      explain: `Dequeued node ${nodes[u].label}. Will explore all its unvisited neighbors.`,
    });

    for (const { to } of adjacency[u]) {
      ctx.metrics.comparisons++;
      if (!visited.has(to)) {
        visited.add(to);
        queue.push(to);
        await ctx.graphFrame({
          visited: new Set(visited),
          current: u,
          queue: [...queue],
          path: [...order],
          pseudoLine: 6,
          message: `Discovered ${nodes[to].label} via ${nodes[u].label}`,
          explain: `Node ${nodes[to].label} added to queue for future exploration.`,
        });
      }
    }
  }

  await ctx.graphFrame({
    visited: new Set(visited),
    path: [...order],
    pseudoLine: 8,
    message: `BFS complete: ${order.map(n => nodes[n].label).join(' → ')}`,
    explain: 'All reachable nodes visited in breadth-first order.',
  });
  return { order };
}

// ─── DFS ─────────────────────────────────────────────────────────────────────
export async function dfs(graph, startId, _endId, ctx) {
  const { adjacency, nodes } = graph;
  const visited = new Set();
  const order = [];

  async function visit(u) {
    visited.add(u);
    order.push(u);
    ctx.metrics.comparisons++;

    await ctx.graphFrame({
      visited: new Set(visited),
      current: u,
      path: [...order],
      pseudoLine: 3,
      message: `DFS visiting ${nodes[u].label} (depth ${order.length})`,
      explain: `Marking ${nodes[u].label} as visited and recursing into its neighbors.`,
    });

    for (const { to } of adjacency[u]) {
      ctx.metrics.comparisons++;
      if (!visited.has(to)) {
        await ctx.graphFrame({
          visited: new Set(visited),
          current: u,
          path: [...order],
          pseudoLine: 5,
          message: `Exploring edge ${nodes[u].label} → ${nodes[to].label}`,
          explain: `${nodes[to].label} is unvisited — recursing deeper.`,
        });
        await visit(to);
      }
    }
  }

  await visit(startId);

  await ctx.graphFrame({
    visited: new Set(visited),
    path: [...order],
    pseudoLine: 7,
    message: `DFS complete: ${order.map(n => nodes[n].label).join(' → ')}`,
    explain: 'All reachable nodes visited in depth-first order.',
  });
  return { order };
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
export async function dijkstra(graph, startId, endId, ctx) {
  const { adjacency, nodes, nodeCount } = graph;
  const dist = Array(nodeCount).fill(Infinity);
  const prev = Array(nodeCount).fill(-1);
  const visited = new Set();
  const unvisited = new Set([...Array(nodeCount).keys()]);
  const relaxed = new Set();
  dist[startId] = 0;

  while (unvisited.size) {
    // Min-distance unvisited node
    let u = -1;
    for (const n of unvisited) if (u < 0 || dist[n] < dist[u]) u = n;
    if (dist[u] === Infinity) break;

    unvisited.delete(u);
    visited.add(u);

    const dists = Object.fromEntries(dist.map((d, i) => [i, d]));
    await ctx.graphFrame({
      visited: new Set(visited),
      current: u,
      distances: dists,
      relaxedEdges: new Set(relaxed),
      pseudoLine: 5,
      message: `Dijkstra: processing ${nodes[u].label} (dist=${dist[u]})`,
      explain: `Selected nearest unvisited node ${nodes[u].label} with distance ${dist[u]}.`,
    });

    for (const { to, weight } of adjacency[u]) {
      ctx.metrics.comparisons++;
      const alt = dist[u] + weight;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
        relaxed.add(`${u}-${to}`);
        ctx.metrics.swaps++;

        const dists2 = Object.fromEntries(dist.map((d, i) => [i, d]));
        await ctx.graphFrame({
          visited: new Set(visited),
          current: u,
          distances: dists2,
          relaxedEdges: new Set(relaxed),
          pseudoLine: 8,
          message: `Relaxed ${nodes[u].label}→${nodes[to].label}: new dist=${alt}`,
          explain: `Found shorter path to ${nodes[to].label}: ${dist[u]} + ${weight} = ${alt}`,
        });
      }
    }
  }

  // Reconstruct path
  const path = [];
  if (endId >= 0 && dist[endId] < Infinity) {
    let at = endId;
    while (at >= 0) { path.unshift(at); at = prev[at]; }
  }

  const finalDists = Object.fromEntries(dist.map((d, i) => [i, d]));
  await ctx.graphFrame({
    visited: new Set(visited), path,
    distances: finalDists, relaxedEdges: new Set(relaxed),
    pseudoLine: 12,
    message: endId >= 0
      ? (dist[endId] < Infinity ? `Shortest path to ${nodes[endId]?.label}: cost ${dist[endId]}` : `No path to ${nodes[endId]?.label}`)
      : 'Dijkstra complete — all shortest paths found.',
    explain: 'Green path shows the shortest route to the selected destination.',
  });
  return { dist, prev, path };
}

// ─── Bellman-Ford ─────────────────────────────────────────────────────────────
export async function bellmanFord(graph, startId, endId, ctx) {
  const { nodeCount, displayEdges, directed, nodes } = graph;
  const dist = Array(nodeCount).fill(Infinity);
  const prev = Array(nodeCount).fill(-1);
  const relaxed = new Set();
  const negCyc = new Set();
  dist[startId] = 0;

  for (let pass = 0; pass < nodeCount - 1; pass++) {
    let updated = false;
    for (const { from, to, weight } of displayEdges) {
      const pairs = directed ? [{ from, to, weight }] : [{ from, to, weight }, { from: to, to: from, weight }];
      for (const edge of pairs) {
        ctx.metrics.comparisons++;
        if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
          dist[edge.to] = dist[edge.from] + edge.weight;
          prev[edge.to] = edge.from;
          relaxed.add(`${edge.from}-${edge.to}`);
          updated = true;
          ctx.metrics.swaps++;

          const dists = Object.fromEntries(dist.map((d, i) => [i, d]));
          await ctx.graphFrame({
            distances: dists, relaxedEdges: new Set(relaxed),
            pseudoLine: 6,
            message: `Pass ${pass + 1}: relaxed ${nodes[edge.from].label}→${nodes[edge.to].label} to ${dist[edge.to]}`,
            explain: `Found cheaper route to ${nodes[edge.to].label} via ${nodes[edge.from].label}.`,
          });
        }
      }
    }
    if (!updated) { await ctx.graphFrame({ distances: Object.fromEntries(dist.map((d, i) => [i, d])), pseudoLine: 9, message: `Early exit after pass ${pass + 1}`, explain: 'No relaxations occurred — algorithm converged early.' }); break; }
  }

  // Negative cycle check
  for (const { from, to, weight } of displayEdges) {
    const pairs = directed ? [{ from, to, weight }] : [{ from, to, weight }, { from: to, to: from, weight }];
    for (const edge of pairs) {
      if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
        negCyc.add(`${edge.from}-${edge.to}`);
      }
    }
  }

  const path = [];
  if (endId >= 0 && dist[endId] < Infinity && !negCyc.size) {
    let at = endId;
    while (at >= 0) { path.unshift(at); at = prev[at]; }
  }

  const finalDists = Object.fromEntries(dist.map((d, i) => [i, d]));
  const hasCycle = negCyc.size > 0;
  await ctx.graphFrame({
    path, distances: finalDists,
    relaxedEdges: new Set(relaxed), negCycleEdges: new Set(negCyc),
    pseudoLine: hasCycle ? 11 : 12,
    message: hasCycle ? '⚠ Negative cycle detected!' : (endId >= 0 ? `Path to ${nodes[endId]?.label}: cost ${dist[endId]}` : 'Bellman-Ford complete.'),
    explain: hasCycle ? 'A negative cycle means shortest paths are not well-defined (can loop infinitely).' : 'Algorithm finished. All shortest paths computed correctly.',
  });
  return { dist, prev, path, hasCycle };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const GRAPH_META = {
  bfs: {
    label: 'BFS (Breadth-First)', stable: true,
    time: 'O(V + E)', space: 'O(V)',
    description: 'Explores all neighbors at the current depth before going deeper. Uses a queue. Discovers shortest paths (by hop count) in unweighted graphs. Essential for level-order traversal.',
    pseudocode: [
      { n: 1, t: 'procedure BFS(G, start)' },
      { n: 2, t: '  visited ← {start};  queue ← [start]' },
      { n: 3, t: '  while queue ≠ ∅ do', kw: 'while' },
      { n: 4, t: '    u ← dequeue(queue);  process(u)' },
      { n: 5, t: '    for each neighbor v of u do' },
      { n: 6, t: '      if v ∉ visited then', kw: 'if' },
      { n: 7, t: '        visited ∪= {v};  enqueue(queue, v)' },
      { n: 8, t: 'end procedure' },
    ],
  },
  dfs: {
    label: 'DFS (Depth-First)', stable: true,
    time: 'O(V + E)', space: 'O(V) stack',
    description: 'Plunges as deep as possible before backtracking. Uses a stack (or recursion). Fundamental for cycle detection, topological sort, strongly connected components, and maze solving.',
    pseudocode: [
      { n: 1, t: 'procedure DFS(G, u, visited)' },
      { n: 2, t: '  visited ∪= {u}' },
      { n: 3, t: '  process(u)' },
      { n: 4, t: '  for each neighbor v of u do' },
      { n: 5, t: '    if v ∉ visited then', kw: 'if' },
      { n: 6, t: '      DFS(G, v, visited)', kw: 'call' },
      { n: 7, t: 'end procedure' },
    ],
  },
  dijkstra: {
    label: "Dijkstra's Shortest Path", stable: true,
    time: 'O(V² naive, O((V+E) log V) heap', space: 'O(V)',
    description: "Greedy algorithm for shortest paths from a source in graphs with non-negative weights. Always expands the closest unvisited vertex. Does not work with negative edge weights.",
    pseudocode: [
      { n: 1, t: 'procedure DIJKSTRA(G, source)' },
      { n: 2, t: '  dist[v] ← ∞ for all v;  dist[source] ← 0' },
      { n: 3, t: '  unvisited ← all vertices' },
      { n: 4, t: '  while unvisited ≠ ∅ do', kw: 'while' },
      { n: 5, t: '    u ← vertex with min dist[u] in unvisited' },
      { n: 6, t: '    remove u from unvisited' },
      { n: 7, t: '    for each neighbor v of u do' },
      { n: 8, t: '      alt ← dist[u] + weight(u,v)' },
      { n: 9, t: '      if alt < dist[v] then', kw: 'if' },
      { n: 10, t: '        dist[v] ← alt;  prev[v] ← u' },
      { n: 11, t: '  return dist, prev' },
    ],
  },
  bellmanFord: {
    label: 'Bellman-Ford', stable: true,
    time: 'O(V × E)', space: 'O(V)',
    description: 'Relaxes every edge V-1 times to find shortest paths. Slower than Dijkstra but handles negative edge weights. Can detect negative cycles — invaluable in financial and network routing applications.',
    pseudocode: [
      { n: 1, t: 'procedure BELLMAN_FORD(G, source)' },
      { n: 2, t: '  dist[v] ← ∞ for all v;  dist[source] ← 0' },
      { n: 3, t: '  for i ← 1 to |V|-1 do  // relax all edges' },
      { n: 4, t: '    for each edge (u,v,w) in E do' },
      { n: 5, t: '      if dist[u] + w < dist[v] then', kw: 'if' },
      { n: 6, t: '        dist[v] ← dist[u] + w;  prev[v] ← u' },
      { n: 7, t: '  // Detect negative cycles' },
      { n: 8, t: '  for each edge (u,v,w) in E do' },
      { n: 9, t: '    if dist[u] + w < dist[v] then', kw: 'if' },
      { n: 10, t: '      report "NEGATIVE CYCLE DETECTED"' },
      { n: 11, t: '  return dist, prev' },
    ],
  },
};