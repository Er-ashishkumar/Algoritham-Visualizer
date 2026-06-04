/**
 * algorithms/sorting.js
 * All sorting algorithms with:
 *  - ctx.frame() for visual updates
 *  - Pseudocode line numbers synced to ctx.frame({ pseudoLine: N })
 *  - Step explanations passed as { explain: '...' }
 */

// ─── Bubble Sort ──────────────────────────────────────────────────────────────
export async function bubbleSort(arr, ctx) {
  const n = arr.length;
  const sorted = [];
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      ctx.metrics.comparisons++;
      await ctx.frame(arr, {
        comparingIndices: [j, j + 1],
        sortedIndices: [...sorted],
        pointers: { i, j },
        pseudoLine: 3,
        explain: `Comparing A[${j}]=${arr[j]} with A[${j + 1}]=${arr[j + 1]}`,
      });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        ctx.metrics.swaps++;
        await ctx.frame(arr, {
          activeIndex: j + 1,
          sortedIndices: [...sorted],
          pointers: { i, j },
          pseudoLine: 5,
          explain: `A[${j}] > A[${j + 1}] — swapping to fix order`,
        });
        swapped = true;
      }
    }
    sorted.unshift(n - i - 1);
    if (!swapped) break;
  }
  sorted.push(0);
  return arr;
}

// ─── Selection Sort ───────────────────────────────────────────────────────────
export async function selectionSort(arr, ctx) {
  const n = arr.length;
  const sorted = [];
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    await ctx.frame(arr, {
      activeIndex: i,
      sortedIndices: [...sorted],
      pointers: { i, min: minIdx },
      pseudoLine: 2,
      explain: `Pass ${i + 1}: searching for minimum in A[${i}..${n - 1}]`,
    });
    for (let j = i + 1; j < n; j++) {
      ctx.metrics.comparisons++;
      await ctx.frame(arr, {
        activeIndex: minIdx,
        comparingIndices: [j],
        sortedIndices: [...sorted],
        pointers: { i, j, min: minIdx },
        pseudoLine: 4,
        explain: `Is A[${j}]=${arr[j]} < current min A[${minIdx}]=${arr[minIdx]}?`,
      });
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      ctx.metrics.swaps++;
    }
    sorted.push(i);
    await ctx.frame(arr, { sortedIndices: [...sorted], pseudoLine: 7, explain: `Placed minimum ${arr[i]} at position ${i}` });
  }
  sorted.push(n - 1);
  return arr;
}

// ─── Insertion Sort ───────────────────────────────────────────────────────────
export async function insertionSort(arr, ctx) {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    await ctx.frame(arr, {
      activeIndex: i,
      pointers: { i },
      pseudoLine: 2,
      explain: `Inserting key = A[${i}] = ${key} into sorted prefix A[0..${i - 1}]`,
    });
    while (j >= 0 && arr[j] > key) {
      ctx.metrics.comparisons++;
      ctx.metrics.swaps++;
      arr[j + 1] = arr[j];
      await ctx.frame(arr, {
        comparingIndices: [j, j + 1],
        pointers: { i, j },
        pseudoLine: 4,
        explain: `Shifting A[${j}]=${arr[j + 1]} right to make room`,
      });
      j--;
    }
    ctx.metrics.comparisons++;
    arr[j + 1] = key;
    await ctx.frame(arr, {
      activeIndex: j + 1,
      pointers: { j: j + 1 },
      pseudoLine: 6,
      explain: `Inserted ${key} at position ${j + 1}`,
    });
  }
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 7, explain: 'Array fully sorted!' });
  return arr;
}

// ─── Merge Sort ───────────────────────────────────────────────────────────────
export async function mergeSort(arr, ctx) {
  await _mergeHelper(arr, 0, arr.length - 1, ctx);
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 12, explain: 'Merge sort complete!' });
  return arr;
}
async function _mergeHelper(arr, l, r, ctx) {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  await ctx.frame(arr, {
    rangeIndices: _range(l, r),
    pointers: { lo: l, mid: m, hi: r },
    pseudoLine: 2,
    explain: `Splitting A[${l}..${r}] at mid=${m}`,
  });
  await _mergeHelper(arr, l, m, ctx);
  await _mergeHelper(arr, m + 1, r, ctx);
  await _doMerge(arr, l, m, r, ctx);
}
async function _doMerge(arr, l, m, r, ctx) {
  const L = arr.slice(l, m + 1);
  const R = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < L.length && j < R.length) {
    ctx.metrics.comparisons++;
    await ctx.frame(arr, {
      comparingIndices: [l + i, m + 1 + j],
      rangeIndices: _range(l, r),
      pointers: { lo: l + i, hi: m + 1 + j, mid: m },
      pseudoLine: 8,
      explain: `Merging: comparing L[${i}]=${L[i]} with R[${j}]=${R[j]}`,
    });
    if (L[i] <= R[j]) arr[k++] = L[i++];
    else arr[k++] = R[j++];
    ctx.metrics.swaps++;
  }
  while (i < L.length) { arr[k++] = L[i++]; ctx.metrics.swaps++; }
  while (j < R.length) { arr[k++] = R[j++]; ctx.metrics.swaps++; }
  await ctx.frame(arr, { rangeIndices: _range(l, r), pseudoLine: 11, explain: `Merged A[${l}..${r}]` });
}

// ─── Quick Sort ───────────────────────────────────────────────────────────────
export async function quickSort(arr, ctx) {
  await _quickHelper(arr, 0, arr.length - 1, ctx, []);
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 10, explain: 'Quick sort complete!' });
  return arr;
}
async function _quickHelper(arr, lo, hi, ctx, sorted) {
  if (lo < hi) {
    const pi = await _partition(arr, lo, hi, ctx, sorted);
    sorted.push(pi);
    await _quickHelper(arr, lo, pi - 1, ctx, sorted);
    await _quickHelper(arr, pi + 1, hi, ctx, sorted);
  }
}
async function _partition(arr, lo, hi, ctx, sorted) {
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    ctx.metrics.comparisons++;
    await ctx.frame(arr, {
      pivotIndex: hi,
      comparingIndices: [j],
      sortedIndices: [...sorted],
      pointers: { i, j, pivot: hi },
      pseudoLine: 6,
      explain: `Pivot=${pivot}: is A[${j}]=${arr[j]} ≤ pivot?`,
    });
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      ctx.metrics.swaps++;
      await ctx.frame(arr, {
        pivotIndex: hi,
        activeIndex: i,
        sortedIndices: [...sorted],
        pseudoLine: 8,
        explain: `Swapped A[${i}]=${arr[i]} with A[${j}]=${arr[j]}`,
      });
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  ctx.metrics.swaps++;
  return i + 1;
}

// ─── Heap Sort ────────────────────────────────────────────────────────────────
export async function heapSort(arr, ctx) {
  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await _heapify(arr, n, i, ctx, []);
  const sorted = [];
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    ctx.metrics.swaps++;
    sorted.push(i);
    await ctx.frame(arr, {
      sortedIndices: [...sorted],
      activeIndex: 0,
      pseudoLine: 5,
      explain: `Extracted max=${arr[i]}, placed at index ${i}`,
    });
    await _heapify(arr, i, 0, ctx, sorted);
  }
  sorted.push(0);
  return arr;
}
async function _heapify(arr, n, i, ctx, sorted) {
  let largest = i, l = 2 * i + 1, r = 2 * i + 2;
  ctx.metrics.comparisons++;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    ctx.metrics.swaps++;
    await ctx.frame(arr, {
      comparingIndices: [i, largest],
      sortedIndices: [...sorted],
      pseudoLine: 3,
      explain: `Heapify: swapping A[${i}]=${arr[i]} ↔ A[${largest}]=${arr[largest]}`,
    });
    await _heapify(arr, n, largest, ctx, sorted);
  }
}

// ─── Shell Sort ───────────────────────────────────────────────────────────────
export async function shellSort(arr, ctx) {
  let gap = Math.floor(arr.length / 2);
  while (gap > 0) {
    for (let i = gap; i < arr.length; i++) {
      const temp = arr[i];
      let j = i;
      await ctx.frame(arr, { activeIndex: i, pointers: { i }, pseudoLine: 3, explain: `Shell: gap=${gap}, inserting arr[${i}]=${temp}` });
      while (j >= gap && arr[j - gap] > temp) {
        ctx.metrics.comparisons++;
        ctx.metrics.swaps++;
        arr[j] = arr[j - gap];
        j -= gap;
        await ctx.frame(arr, { comparingIndices: [j, j + gap], pointers: { j }, pseudoLine: 5, explain: `Shifting arr[${j + gap}] backward by gap=${gap}` });
      }
      arr[j] = temp;
    }
    gap = Math.floor(gap / 2);
  }
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 8, explain: 'Shell sort complete!' });
  return arr;
}

// ─── Cocktail Sort ────────────────────────────────────────────────────────────
export async function cocktailSort(arr, ctx) {
  let start = 0, end = arr.length - 1;
  const sorted = [];
  while (start < end) {
    let swapped = false;
    for (let i = start; i < end; i++) {
      ctx.metrics.comparisons++;
      await ctx.frame(arr, { comparingIndices: [i, i + 1], sortedIndices: [...sorted], pointers: { i }, pseudoLine: 3, explain: `Forward pass: comparing A[${i}] and A[${i + 1}]` });
      if (arr[i] > arr[i + 1]) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; ctx.metrics.swaps++; swapped = true; }
    }
    sorted.push(end--);
    if (!swapped) break;
    for (let i = end; i > start; i--) {
      ctx.metrics.comparisons++;
      await ctx.frame(arr, { comparingIndices: [i, i - 1], sortedIndices: [...sorted], pointers: { i }, pseudoLine: 7, explain: `Backward pass: comparing A[${i}] and A[${i - 1}]` });
      if (arr[i] < arr[i - 1]) { [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; ctx.metrics.swaps++; swapped = true; }
    }
    sorted.push(start++);
    if (!swapped) break;
  }
  return arr;
}

// ─── Comb Sort ────────────────────────────────────────────────────────────────
export async function combSort(arr, ctx) {
  let gap = arr.length;
  const SHRINK = 1.3;
  let sorted = false;
  while (!sorted) {
    gap = Math.floor(gap / SHRINK);
    if (gap <= 1) { gap = 1; sorted = true; }
    for (let i = 0; i + gap < arr.length; i++) {
      ctx.metrics.comparisons++;
      await ctx.frame(arr, { comparingIndices: [i, i + gap], pointers: { i }, pseudoLine: 4, explain: `Comb: gap=${gap}, comparing A[${i}] and A[${i + gap}]` });
      if (arr[i] > arr[i + gap]) { [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]]; ctx.metrics.swaps++; sorted = false; }
    }
  }
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 7, explain: 'Comb sort complete!' });
  return arr;
}

// ─── Gnome Sort ───────────────────────────────────────────────────────────────
export async function gnomeSort(arr, ctx) {
  let i = 0;
  while (i < arr.length) {
    if (i === 0 || arr[i] >= arr[i - 1]) {
      ctx.metrics.comparisons++;
      await ctx.frame(arr, { activeIndex: i, pointers: { i }, pseudoLine: 2, explain: `Gnome at ${i}: A[${i}]=${arr[i]} is in order, moving forward` });
      i++;
    } else {
      ctx.metrics.comparisons++; ctx.metrics.swaps++;
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      await ctx.frame(arr, { comparingIndices: [i, i - 1], pointers: { i }, pseudoLine: 4, explain: `A[${i}]=${arr[i + 1] ?? '?'} < A[${i - 1}]=${arr[i]}: swapping and stepping back` });
      i--;
    }
  }
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 5, explain: 'Gnome sort complete!' });
  return arr;
}

// ─── Tim Sort (simplified) ────────────────────────────────────────────────────
export async function timSort(arr, ctx) {
  const RUN = 16;
  const n = arr.length;
  // Sort individual runs with insertion sort
  for (let i = 0; i < n; i += RUN) {
    const end = Math.min(i + RUN - 1, n - 1);
    await _timInsert(arr, i, end, ctx);
  }
  // Merge runs
  for (let size = RUN; size < n; size *= 2) {
    for (let l = 0; l < n; l += 2 * size) {
      const m = Math.min(l + size - 1, n - 1);
      const r = Math.min(l + 2 * size - 1, n - 1);
      if (m < r) await _doMerge(arr, l, m, r, ctx);
    }
  }
  await ctx.frame(arr, { sortedIndices: arr.map((_, i) => i), pseudoLine: 10, explain: 'Tim sort complete!' });
  return arr;
}
async function _timInsert(arr, l, r, ctx) {
  for (let i = l + 1; i <= r; i++) {
    const key = arr[i]; let j = i - 1;
    while (j >= l && arr[j] > key) {
      ctx.metrics.comparisons++; ctx.metrics.swaps++;
      arr[j + 1] = arr[j]; j--;
      await ctx.frame(arr, { comparingIndices: [j + 1, j + 2], pseudoLine: 3, explain: `TimSort run insertion at ${j + 1}` });
    }
    arr[j + 1] = key;
  }
}

// ─── Counting Sort ────────────────────────────────────────────────────────────
export async function countingSort(arr, ctx) {
  const max = Math.max(...arr);
  const count = new Array(max + 1).fill(0);
  for (const v of arr) count[v]++;
  let k = 0;
  for (let i = 0; i <= max; i++) {
    while (count[i]-- > 0) {
      ctx.metrics.swaps++;
      arr[k] = i;
      await ctx.frame(arr, { activeIndex: k, sortedIndices: [...Array(k).keys()], pseudoLine: 5, explain: `Placing value ${i} at position ${k}` });
      k++;
    }
  }
  return arr;
}

// ─── Radix Sort ───────────────────────────────────────────────────────────────
export async function radixSort(arr, ctx) {
  const max = Math.max(...arr);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    await _radixPass(arr, exp, ctx);
  }
  return arr;
}
async function _radixPass(arr, exp, ctx) {
  const n = arr.length, output = new Array(n), count = new Array(10).fill(0);
  for (let i = 0; i < n; i++) count[Math.floor(arr[i] / exp) % 10]++;
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];
  for (let i = n - 1; i >= 0; i--) output[--count[Math.floor(arr[i] / exp) % 10]] = arr[i];
  for (let i = 0; i < n; i++) {
    arr[i] = output[i]; ctx.metrics.swaps++;
    await ctx.frame(arr, { activeIndex: i, pseudoLine: 6, explain: `Radix pass (exp=${exp}): placing ${arr[i]}` });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _range(l, r) {
  const a = [];
  for (let i = l; i <= r; i++) a.push(i);
  return a;
}

// ─── Pseudocode Definitions ───────────────────────────────────────────────────
export const SORTING_META = {
  bubbleSort: {
    label: 'Bubble Sort', stable: true,
    time: 'O(n²) worst, O(n) best', space: 'O(1)',
    description: 'Repeatedly walks through the array comparing adjacent elements and swapping them if they are in the wrong order. The largest unsorted element "bubbles up" to its correct position each pass. Simple but O(n²) — best for teaching.',
    pseudocode: [
      { n: 1, t: 'procedure BUBBLE_SORT(A[0..n-1])' },
      { n: 2, t: '  for i ← 0 to n-2 do' },
      { n: 3, t: '    for j ← 0 to n-i-2 do' },
      { n: 4, t: '      if A[j] > A[j+1] then', kw: 'if' },
      { n: 5, t: '        swap(A[j], A[j+1])' },
      { n: 6, t: '      end if' },
      { n: 7, t: '    end for' },
      { n: 8, t: '  end for' },
      { n: 9, t: 'end procedure' },
    ],
  },
  selectionSort: {
    label: 'Selection Sort', stable: false,
    time: 'O(n²)', space: 'O(1)',
    description: 'Divides the array into sorted and unsorted regions. Each pass finds the minimum element from the unsorted region and places it at the end of the sorted region. Makes at most n-1 swaps — good when swaps are expensive.',
    pseudocode: [
      { n: 1, t: 'procedure SELECTION_SORT(A[0..n-1])' },
      { n: 2, t: '  for i ← 0 to n-2 do' },
      { n: 3, t: '    minIdx ← i' },
      { n: 4, t: '    for j ← i+1 to n-1 do' },
      { n: 5, t: '      if A[j] < A[minIdx] then', kw: 'if' },
      { n: 6, t: '        minIdx ← j' },
      { n: 7, t: '    swap(A[i], A[minIdx])' },
      { n: 8, t: 'end procedure' },
    ],
  },
  insertionSort: {
    label: 'Insertion Sort', stable: true,
    time: 'O(n²) worst, O(n) best', space: 'O(1)',
    description: 'Builds the sorted array one element at a time by inserting each new element into its correct position in the already-sorted prefix. Efficient for small or nearly-sorted arrays. O(n) best case.',
    pseudocode: [
      { n: 1, t: 'procedure INSERTION_SORT(A[0..n-1])' },
      { n: 2, t: '  for i ← 1 to n-1 do' },
      { n: 3, t: '    key ← A[i];  j ← i - 1' },
      { n: 4, t: '    while j ≥ 0 and A[j] > key do', kw: 'while' },
      { n: 5, t: '      A[j+1] ← A[j];  j ← j - 1' },
      { n: 6, t: '    A[j+1] ← key' },
      { n: 7, t: '  end for' },
      { n: 8, t: 'end procedure' },
    ],
  },
  mergeSort: {
    label: 'Merge Sort', stable: true,
    time: 'O(n log n)', space: 'O(n)',
    description: 'Classic divide-and-conquer: recursively halves the array, sorts each half, then merges them. Guarantees O(n log n) for all cases and is stable. The O(n) extra space is its main drawback.',
    pseudocode: [
      { n: 1, t: 'procedure MERGE_SORT(A, l, r)' },
      { n: 2, t: '  if l < r then', kw: 'if' },
      { n: 3, t: '    m ← ⌊(l + r) / 2⌋' },
      { n: 4, t: '    MERGE_SORT(A, l, m)', kw: 'call' },
      { n: 5, t: '    MERGE_SORT(A, m+1, r)', kw: 'call' },
      { n: 6, t: '    MERGE(A, l, m, r)', kw: 'call' },
      { n: 7, t: '' },
      { n: 8, t: 'procedure MERGE(A, l, m, r)' },
      { n: 9, t: '  copy A[l..m] → L;  A[m+1..r] → R' },
      { n: 10, t: '  while i < |L| and j < |R| do', kw: 'while' },
      { n: 11, t: '    take smaller of L[i], R[j] → A[k++]' },
      { n: 12, t: '  copy remaining elements' },
    ],
  },
  quickSort: {
    label: 'Quick Sort', stable: false,
    time: 'O(n log n) avg, O(n²) worst', space: 'O(log n) stack',
    description: 'Picks a pivot, partitions around it (elements ≤ pivot left, larger right), then recurses on each side. Excellent cache performance makes it fastest in practice. Worst case is O(n²) with bad pivot choices.',
    pseudocode: [
      { n: 1, t: 'procedure QUICK_SORT(A, lo, hi)' },
      { n: 2, t: '  if lo < hi then', kw: 'if' },
      { n: 3, t: '    p ← PARTITION(A, lo, hi)', kw: 'call' },
      { n: 4, t: '    QUICK_SORT(A, lo, p-1)', kw: 'call' },
      { n: 5, t: '    QUICK_SORT(A, p+1, hi)', kw: 'call' },
      { n: 6, t: 'procedure PARTITION(A, lo, hi)' },
      { n: 7, t: '  pivot ← A[hi];  i ← lo - 1' },
      { n: 8, t: '  for j ← lo to hi-1 do' },
      { n: 9, t: '    if A[j] ≤ pivot then', kw: 'if' },
      { n: 10, t: '      swap(A[++i], A[j])' },
      { n: 11, t: '  swap(A[i+1], A[hi]);  return i+1' },
    ],
  },
  heapSort: {
    label: 'Heap Sort', stable: false,
    time: 'O(n log n)', space: 'O(1)',
    description: 'First builds a max-heap from the input, then repeatedly extracts the maximum element and places it at the end. Guaranteed O(n log n) in all cases with O(1) extra space.',
    pseudocode: [
      { n: 1, t: 'procedure HEAP_SORT(A[0..n-1])' },
      { n: 2, t: '  for i ← ⌊n/2⌋-1 downto 0 do' },
      { n: 3, t: '    HEAPIFY(A, n, i)', kw: 'call' },
      { n: 4, t: '  for i ← n-1 downto 1 do' },
      { n: 5, t: '    swap(A[0], A[i])' },
      { n: 6, t: '    HEAPIFY(A, i, 0)', kw: 'call' },
      { n: 7, t: 'procedure HEAPIFY(A, n, i)' },
      { n: 8, t: '  largest ← max(i, left, right)' },
      { n: 9, t: '  if largest ≠ i then', kw: 'if' },
      { n: 10, t: '    swap(A[i], A[largest]);  recurse', kw: 'call' },
    ],
  },
  shellSort: {
    label: 'Shell Sort', stable: false,
    time: 'O(n log²n) avg', space: 'O(1)',
    description: 'A generalization of insertion sort that allows comparisons and swaps across a gap > 1. Dramatically reduces the number of shifts needed by first sorting widely spaced elements.',
    pseudocode: [
      { n: 1, t: 'procedure SHELL_SORT(A[0..n-1])' },
      { n: 2, t: '  gap ← ⌊n/2⌋' },
      { n: 3, t: '  while gap > 0 do', kw: 'while' },
      { n: 4, t: '    for i ← gap to n-1 do' },
      { n: 5, t: '      temp ← A[i];  j ← i' },
      { n: 6, t: '      while j ≥ gap and A[j-gap] > temp do', kw: 'while' },
      { n: 7, t: '        A[j] ← A[j-gap];  j ← j - gap' },
      { n: 8, t: '      A[j] ← temp' },
      { n: 9, t: '    gap ← ⌊gap / 2⌋' },
    ],
  },
  cocktailSort: {
    label: 'Cocktail Sort', stable: true,
    time: 'O(n²) worst, O(n) best', space: 'O(1)',
    description: 'Bidirectional bubble sort: one forward pass bubbles the maximum to the right, one backward pass pushes the minimum to the left. Handles "turtles" (small elements near the end) better than bubble sort.',
    pseudocode: [
      { n: 1, t: 'procedure COCKTAIL_SORT(A)' },
      { n: 2, t: '  start ← 0;  end ← n-1' },
      { n: 3, t: '  loop: forward pass over [start..end]' },
      { n: 4, t: '    swap adjacent if out of order' },
      { n: 5, t: '    end ← end - 1' },
      { n: 6, t: '  loop: backward pass over [end..start]' },
      { n: 7, t: '    swap adjacent if out of order' },
      { n: 8, t: '    start ← start + 1' },
      { n: 9, t: '  until no swaps in either pass' },
    ],
  },
  combSort: {
    label: 'Comb Sort', stable: false,
    time: 'O(n²/2ᵖ) avg', space: 'O(1)',
    description: 'Improves bubble sort by comparing elements separated by a shrinking gap (factor 1.3). Eliminates "turtles" early. Converges to a final bubble-sort pass when gap reaches 1.',
    pseudocode: [
      { n: 1, t: 'procedure COMB_SORT(A[0..n-1])' },
      { n: 2, t: '  gap ← n;  shrink ← 1.3;  sorted ← false' },
      { n: 3, t: '  while not sorted do', kw: 'while' },
      { n: 4, t: '    gap ← ⌊gap / shrink⌋' },
      { n: 5, t: '    if gap ≤ 1 then gap←1; sorted←true', kw: 'if' },
      { n: 6, t: '    for i ← 0 to n-gap-1 do' },
      { n: 7, t: '      if A[i] > A[i+gap] then', kw: 'if' },
      { n: 8, t: '        swap(A[i], A[i+gap]);  sorted←false' },
    ],
  },
  gnomeSort: {
    label: 'Gnome Sort', stable: true,
    time: 'O(n²) worst, O(n) best', space: 'O(1)',
    description: 'Works like a garden gnome sorting flower pots: move forward if in order, swap and step back if not. Equivalent to insertion sort but uses a single loop instead of nested loops.',
    pseudocode: [
      { n: 1, t: 'procedure GNOME_SORT(A[0..n-1])' },
      { n: 2, t: '  i ← 0' },
      { n: 3, t: '  while i < n do', kw: 'while' },
      { n: 4, t: '    if i=0 or A[i] ≥ A[i-1] then', kw: 'if' },
      { n: 5, t: '      i ← i + 1' },
      { n: 6, t: '    else' },
      { n: 7, t: '      swap(A[i], A[i-1]);  i ← i - 1' },
    ],
  },
  timSort: {
    label: 'Tim Sort', stable: true,
    time: 'O(n log n)', space: 'O(n)',
    description: 'Python and Java\'s default sort. Hybrid of merge sort and insertion sort: sorts small "runs" with insertion sort, then merges them. Adapts to real-world patterns, achieving O(n) on already-sorted data.',
    pseudocode: [
      { n: 1, t: 'procedure TIM_SORT(A[0..n-1])' },
      { n: 2, t: '  RUN ← 32 (or 16)' },
      { n: 3, t: '  // Sort small runs with insertion sort' },
      { n: 4, t: '  for i ← 0 to n-1 step RUN do' },
      { n: 5, t: '    INSERTION_SORT(A, i, min(i+RUN-1, n-1))', kw: 'call' },
      { n: 6, t: '  // Merge sorted runs' },
      { n: 7, t: '  for size ← RUN to n step 2×size do' },
      { n: 8, t: '    for l ← 0 to n step 2×size do' },
      { n: 9, t: '      MERGE(A, l, l+size-1, min(l+2*size-1, n-1))', kw: 'call' },
      { n: 10, t: 'end procedure' },
    ],
  },
  countingSort: {
    label: 'Counting Sort', stable: true,
    time: 'O(n + k)', space: 'O(n + k)',
    description: 'Non-comparison sort for non-negative integers. Counts occurrences of each value, then reconstructs the sorted array. O(n+k) time — effectively linear for bounded integers.',
    pseudocode: [
      { n: 1, t: 'procedure COUNTING_SORT(A[0..n-1])' },
      { n: 2, t: '  max ← max value in A;  count[0..max] ← 0' },
      { n: 3, t: '  for each v in A do' },
      { n: 4, t: '    count[v] ← count[v] + 1' },
      { n: 5, t: '  k ← 0' },
      { n: 6, t: '  for i ← 0 to max do' },
      { n: 7, t: '    while count[i] > 0 do', kw: 'while' },
      { n: 8, t: '      A[k++] ← i;  count[i]--' },
    ],
  },
  radixSort: {
    label: 'Radix Sort', stable: true,
    time: 'O(d(n + k))', space: 'O(n + k)',
    description: 'Sorts integers digit-by-digit from least significant to most significant using a stable counting sort at each pass. Linear time when d (digit count) and k (base) are constants.',
    pseudocode: [
      { n: 1, t: 'procedure RADIX_SORT(A[0..n-1])' },
      { n: 2, t: '  max ← max value in A' },
      { n: 3, t: '  exp ← 1' },
      { n: 4, t: '  while ⌊max/exp⌋ > 0 do', kw: 'while' },
      { n: 5, t: '    COUNTING_PASS(A, exp)', kw: 'call' },
      { n: 6, t: '    exp ← exp × 10' },
    ],
  },
};