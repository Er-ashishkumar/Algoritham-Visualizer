/**
 * algorithms/searching.js
 * Seven searching algorithms with pseudocode sync and step explanations.
 */

function sorted(arr) { return [...arr].sort((a, b) => a - b); }

// ─── Linear Search ────────────────────────────────────────────────────────────
export async function linearSearch(arr, target, ctx) {
  for (let i = 0; i < arr.length; i++) {
    ctx.metrics.comparisons++;
    await ctx.frame(arr, {
      comparingIndices: [i],
      pointers: { i },
      pseudoLine: 2,
      explain: `Checking A[${i}]=${arr[i]} against target ${target}`,
    });
    if (arr[i] === target) {
      await ctx.frame(arr, { foundIndex: i, pseudoLine: 3, explain: `Found ${target} at index ${i}!` });
      return { index: i, values: arr };
    }
  }
  return { index: -1, values: arr };
}

// ─── Binary Search ────────────────────────────────────────────────────────────
export async function binarySearch(arr, target, ctx) {
  const s = sorted(arr);
  for (let k = 0; k < s.length; k++) arr[k] = s[k];
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 1, explain: 'Pre-sorted array for binary search.' });

  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.metrics.comparisons++;
    const dimmed = [...Array(lo).keys(), ...Array.from({ length: arr.length - hi - 1 }, (_, k) => hi + 1 + k)];
    await ctx.frame(arr, {
      activeIndex: mid,
      comparingIndices: [lo, hi],
      dimmedIndices: dimmed,
      rangeIndices: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k),
      pointers: { lo, mid, hi },
      pseudoLine: 4,
      explain: `Binary: range [${lo},${hi}] — checking mid=${mid}, value=${arr[mid]}`,
    });
    if (arr[mid] === target) {
      await ctx.frame(arr, { foundIndex: mid, pseudoLine: 5, explain: `Found ${target} at index ${mid}!` });
      return { index: mid, values: arr };
    } else if (arr[mid] < target) {
      lo = mid + 1;
      await ctx.frame(arr, { activeIndex: mid, pseudoLine: 7, explain: `A[${mid}]=${arr[mid]} < ${target} — search right half` });
    } else {
      hi = mid - 1;
      await ctx.frame(arr, { activeIndex: mid, pseudoLine: 8, explain: `A[${mid}]=${arr[mid]} > ${target} — search left half` });
    }
  }
  return { index: -1, values: arr };
}

// ─── Jump Search ──────────────────────────────────────────────────────────────
export async function jumpSearch(arr, target, ctx) {
  const s = sorted(arr);
  for (let k = 0; k < s.length; k++) arr[k] = s[k];
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 1, explain: 'Pre-sorted for jump search.' });

  const n = arr.length;
  let step = Math.floor(Math.sqrt(n)), prev = 0;
  while (arr[Math.min(step, n) - 1] < target) {
    ctx.metrics.comparisons++;
    await ctx.frame(arr, {
      activeIndex: Math.min(step, n) - 1,
      pointers: { lo: prev, hi: Math.min(step, n) - 1 },
      pseudoLine: 3,
      explain: `Jumping to index ${Math.min(step, n) - 1}: value=${arr[Math.min(step, n) - 1]} < ${target}`,
    });
    prev = step; step += Math.floor(Math.sqrt(n));
    if (prev >= n) return { index: -1, values: arr };
  }
  while (arr[prev] < target) {
    ctx.metrics.comparisons++;
    await ctx.frame(arr, { comparingIndices: [prev], pointers: { i: prev }, pseudoLine: 6, explain: `Linear scan at ${prev}: A[${prev}]=${arr[prev]}` });
    prev++;
    if (prev === Math.min(step, n)) return { index: -1, values: arr };
  }
  if (arr[prev] === target) {
    await ctx.frame(arr, { foundIndex: prev, pseudoLine: 8, explain: `Found ${target} at index ${prev}!` });
    return { index: prev, values: arr };
  }
  return { index: -1, values: arr };
}

// ─── Exponential Search ───────────────────────────────────────────────────────
export async function exponentialSearch(arr, target, ctx) {
  const s = sorted(arr);
  for (let k = 0; k < s.length; k++) arr[k] = s[k];
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 1, explain: 'Pre-sorted for exponential search.' });

  const n = arr.length;
  if (arr[0] === target) { await ctx.frame(arr, { foundIndex: 0, pseudoLine: 2, explain: `Found ${target} at index 0!` }); return { index: 0, values: arr }; }
  let bound = 1;
  while (bound < n && arr[bound] <= target) {
    ctx.metrics.comparisons++;
    await ctx.frame(arr, { activeIndex: bound, pointers: { lo: 0, hi: bound }, pseudoLine: 4, explain: `Expanding bound to ${bound}: A[${bound}]=${arr[bound]}` });
    bound *= 2;
  }
  // Binary search in [bound/2, min(bound, n-1)]
  let lo = Math.floor(bound / 2), hi = Math.min(bound, n - 1);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.metrics.comparisons++;
    await ctx.frame(arr, {
      activeIndex: mid,
      rangeIndices: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k),
      pointers: { lo, mid, hi },
      pseudoLine: 7,
      explain: `Exp→Binary [${lo},${hi}] mid=${mid} val=${arr[mid]}`,
    });
    if (arr[mid] === target) { await ctx.frame(arr, { foundIndex: mid, pseudoLine: 8, explain: `Found ${target}!` }); return { index: mid, values: arr }; }
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { index: -1, values: arr };
}

// ─── Fibonacci Search ─────────────────────────────────────────────────────────
export async function fibonacciSearch(arr, target, ctx) {
  const s = sorted(arr);
  for (let k = 0; k < s.length; k++) arr[k] = s[k];
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 1, explain: 'Pre-sorted for Fibonacci search.' });

  const n = arr.length;
  let fM2 = 0, fM1 = 1, fM = 1;
  while (fM < n) { fM2 = fM1; fM1 = fM; fM = fM1 + fM2; }
  let offset = -1;
  while (fM > 1) {
    const i = Math.min(offset + fM2, n - 1);
    ctx.metrics.comparisons++;
    await ctx.frame(arr, { activeIndex: i, pointers: { i }, pseudoLine: 5, explain: `Fibonacci check at index ${i}: A[${i}]=${arr[i]}` });
    if (arr[i] < target) { fM = fM1; fM1 = fM2; fM2 = fM - fM1; offset = i; }
    else if (arr[i] > target) { fM = fM2; fM1 = fM1 - fM2; fM2 = fM - fM1; }
    else { await ctx.frame(arr, { foundIndex: i, pseudoLine: 7, explain: `Found ${target} at index ${i}!` }); return { index: i, values: arr }; }
  }
  if (fM1 && arr[offset + 1] === target) {
    await ctx.frame(arr, { foundIndex: offset + 1, pseudoLine: 8, explain: `Found ${target}!` });
    return { index: offset + 1, values: arr };
  }
  return { index: -1, values: arr };
}

// ─── Interpolation Search ─────────────────────────────────────────────────────
export async function interpolationSearch(arr, target, ctx) {
  const s = sorted(arr);
  for (let k = 0; k < s.length; k++) arr[k] = s[k];
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 1, explain: 'Pre-sorted for interpolation search.' });

  let lo = 0, hi = arr.length - 1;
  while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
    if (arr[hi] === arr[lo]) break;
    const pos = lo + Math.floor(((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]));
    ctx.metrics.comparisons++;
    await ctx.frame(arr, {
      activeIndex: pos,
      rangeIndices: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k),
      pointers: { lo, hi },
      pseudoLine: 4,
      explain: `Interpolated pos=${pos}: A[${pos}]=${arr[pos]} (formula: lo + (target-A[lo])*(hi-lo)/(A[hi]-A[lo]))`,
    });
    if (arr[pos] === target) { await ctx.frame(arr, { foundIndex: pos, pseudoLine: 5, explain: `Found ${target}!` }); return { index: pos, values: arr }; }
    else if (arr[pos] < target) lo = pos + 1;
    else hi = pos - 1;
  }
  return { index: -1, values: arr };
}

// ─── Ternary Search ───────────────────────────────────────────────────────────
export async function ternarySearch(arr, target, ctx) {
  const s = sorted(arr);
  for (let k = 0; k < s.length; k++) arr[k] = s[k];
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 1, explain: 'Pre-sorted for ternary search.' });

  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const m1 = lo + Math.floor((hi - lo) / 3);
    const m2 = hi - Math.floor((hi - lo) / 3);
    ctx.metrics.comparisons += 2;
    await ctx.frame(arr, {
      comparingIndices: [m1, m2],
      rangeIndices: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k),
      pointers: { lo, hi },
      pseudoLine: 4,
      explain: `Ternary [${lo},${hi}]: m1=${m1} (${arr[m1]}), m2=${m2} (${arr[m2]})`,
    });
    if (arr[m1] === target) { await ctx.frame(arr, { foundIndex: m1, pseudoLine: 5, explain: `Found ${target} at m1=${m1}!` }); return { index: m1, values: arr }; }
    if (arr[m2] === target) { await ctx.frame(arr, { foundIndex: m2, pseudoLine: 6, explain: `Found ${target} at m2=${m2}!` }); return { index: m2, values: arr }; }
    if (target < arr[m1]) hi = m1 - 1;
    else if (target > arr[m2]) lo = m2 + 1;
    else { lo = m1 + 1; hi = m2 - 1; }
  }
  return { index: -1, values: arr };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const SEARCHING_META = {
  linearSearch: {
    label: 'Linear Search', stable: true,
    time: 'O(n)', space: 'O(1)',
    description: 'Checks every element one by one. No preconditions — works on any array. Simplest possible search; O(n) comparisons in the worst case.',
    pseudocode: [
      { n: 1, t: 'procedure LINEAR_SEARCH(A, target)' },
      { n: 2, t: '  for i ← 0 to n-1 do' },
      { n: 3, t: '    if A[i] = target then return i', kw: 'if' },
      { n: 4, t: '  return -1   // not found' },
    ],
  },
  binarySearch: {
    label: 'Binary Search', stable: true,
    time: 'O(log n)', space: 'O(1)',
    description: 'Requires sorted input. Each comparison eliminates half the remaining range. O(log n) — finds in 16-17 steps what linear search might take 100,000 steps.',
    pseudocode: [
      { n: 1, t: 'procedure BINARY_SEARCH(A, target)' },
      { n: 2, t: '  // Precondition: A is sorted' },
      { n: 3, t: '  lo ← 0;  hi ← n-1' },
      { n: 4, t: '  while lo ≤ hi do', kw: 'while' },
      { n: 5, t: '    mid ← ⌊(lo+hi)/2⌋' },
      { n: 6, t: '    if A[mid] = target then return mid', kw: 'if' },
      { n: 7, t: '    if A[mid] < target then lo ← mid+1', kw: 'if' },
      { n: 8, t: '    else hi ← mid-1' },
      { n: 9, t: '  return -1' },
    ],
  },
  jumpSearch: {
    label: 'Jump Search', stable: true,
    time: 'O(√n)', space: 'O(1)',
    description: 'Jumps √n steps at a time looking for a block containing the target, then does a linear backward scan within that block. Balances between linear and binary.',
    pseudocode: [
      { n: 1, t: 'procedure JUMP_SEARCH(A, target)' },
      { n: 2, t: '  step ← ⌊√n⌋;  prev ← 0' },
      { n: 3, t: '  while A[min(step,n)-1] < target do', kw: 'while' },
      { n: 4, t: '    prev ← step;  step ← step + ⌊√n⌋' },
      { n: 5, t: '    if prev ≥ n then return -1', kw: 'if' },
      { n: 6, t: '  while A[prev] < target do', kw: 'while' },
      { n: 7, t: '    prev++;  if prev = min(step,n) return -1', kw: 'if' },
      { n: 8, t: '  if A[prev] = target then return prev', kw: 'if' },
    ],
  },
  exponentialSearch: {
    label: 'Exponential Search', stable: true,
    time: 'O(log n)', space: 'O(1)',
    description: 'Expands the search range exponentially (1,2,4,8,…) until exceeding the target, then applies binary search in the found range. Ideal when target is near the front.',
    pseudocode: [
      { n: 1, t: 'procedure EXPONENTIAL_SEARCH(A, target)' },
      { n: 2, t: '  if A[0] = target then return 0', kw: 'if' },
      { n: 3, t: '  bound ← 1' },
      { n: 4, t: '  while bound < n and A[bound] ≤ target do', kw: 'while' },
      { n: 5, t: '    bound ← bound × 2' },
      { n: 6, t: '  // Binary search in [bound/2, min(bound,n-1)]' },
      { n: 7, t: '  lo ← bound/2;  hi ← min(bound, n-1)' },
      { n: 8, t: '  return BINARY_SEARCH(A, lo, hi, target)', kw: 'call' },
    ],
  },
  fibonacciSearch: {
    label: 'Fibonacci Search', stable: true,
    time: 'O(log n)', space: 'O(1)',
    description: 'Uses Fibonacci numbers to divide the array instead of halving. Avoids division — historically useful on systems where division is expensive.',
    pseudocode: [
      { n: 1, t: 'procedure FIBONACCI_SEARCH(A, target)' },
      { n: 2, t: '  find smallest Fibonacci ≥ n' },
      { n: 3, t: '  fM2←0; fM1←1; fM←1;  offset←-1' },
      { n: 4, t: '  while fM > 1 do', kw: 'while' },
      { n: 5, t: '    i ← min(offset + fM2, n-1)' },
      { n: 6, t: '    if A[i] < target  → shift right', kw: 'if' },
      { n: 7, t: '    elif A[i] > target → shift left' },
      { n: 8, t: '    else return i' },
    ],
  },
  interpolationSearch: {
    label: 'Interpolation Search', stable: true,
    time: 'O(log log n) avg, O(n) worst', space: 'O(1)',
    description: 'Estimates the target\'s position by interpolation — like searching a phone book. Near O(log log n) for uniformly distributed data. Degrades to O(n) for skewed distributions.',
    pseudocode: [
      { n: 1, t: 'procedure INTERPOLATION_SEARCH(A, target)' },
      { n: 2, t: '  lo←0;  hi←n-1' },
      { n: 3, t: '  while lo≤hi and target∈[A[lo],A[hi]] do', kw: 'while' },
      { n: 4, t: '    pos ← lo + ⌊(target-A[lo])×(hi-lo)/(A[hi]-A[lo])⌋' },
      { n: 5, t: '    if A[pos]=target then return pos', kw: 'if' },
      { n: 6, t: '    if A[pos]<target then lo←pos+1', kw: 'if' },
      { n: 7, t: '    else hi←pos-1' },
    ],
  },
  ternarySearch: {
    label: 'Ternary Search', stable: true,
    time: 'O(log₃ n)', space: 'O(1)',
    description: 'Divides the sorted array into three parts each iteration using two midpoints. More comparisons per step than binary search but useful in mathematical optimization for unimodal functions.',
    pseudocode: [
      { n: 1, t: 'procedure TERNARY_SEARCH(A, target)' },
      { n: 2, t: '  lo←0;  hi←n-1' },
      { n: 3, t: '  while lo ≤ hi do', kw: 'while' },
      { n: 4, t: '    m1←lo+⌊(hi-lo)/3⌋;  m2←hi-⌊(hi-lo)/3⌋' },
      { n: 5, t: '    if A[m1]=target then return m1', kw: 'if' },
      { n: 6, t: '    if A[m2]=target then return m2', kw: 'if' },
      { n: 7, t: '    if target<A[m1] then hi←m1-1', kw: 'if' },
      { n: 8, t: '    elif target>A[m2] then lo←m2+1' },
      { n: 9, t: '    else lo←m1+1; hi←m2-1' },
    ],
  },
};