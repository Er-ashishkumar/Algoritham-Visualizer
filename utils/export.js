/**
 * utils/export.js
 * Export run data as JSON, CSV, or PNG screenshot.
 */

/**
 * Export the current run as JSON.
 * @param {object} runData
 */
export function exportJSON(runData) {
    const payload = {
        meta: {
            exportedAt: new Date().toISOString(),
            tool: 'AlgoViz Pro',
            version: '2.0',
        },
        run: {
            mode: runData.mode,
            algorithm: runData.algorithm,
            startedAt: runData.startedAt,
            duration: runData.duration,
        },
        metrics: {
            comparisons: runData.metrics.comparisons,
            swaps: runData.metrics.swaps,
            frames: runData.frames,
        },
        input: runData.input,
        output: runData.output,
        log: runData.log,
    };

    _download(
        JSON.stringify(payload, null, 2),
        `algoviz-${runData.algorithm}-${Date.now()}.json`,
        'application/json',
    );
}

/**
 * Export the metrics history as CSV.
 * @param {object} runData
 */
export function exportCSV(runData) {
    const rows = [
        ['Step', 'Comparisons', 'Swaps'],
        ...(runData.metricsHistory || []).map((m, i) => [i, m.comparisons, m.swaps]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    _download(
        csv,
        `algoviz-metrics-${runData.algorithm}-${Date.now()}.csv`,
        'text/csv',
    );
}

/**
 * Take a PNG screenshot of the visualization area.
 * @param {HTMLElement} element
 */
export async function exportPNG(element) {
    try {
        // Use html2canvas if available, otherwise fall back to canvas
        const canvas = element.querySelector('canvas');
        if (canvas) {
            canvas.toBlob(blob => {
                _downloadBlob(blob, `algoviz-graph-${Date.now()}.png`);
            }, 'image/png');
            return;
        }

        // For bar visualization use a constructed canvas
        const bars = [...element.querySelectorAll('.bar')];
        if (!bars.length) {
            console.warn('[Export] No visual element to capture.');
            return;
        }
        const offscreen = document.createElement('canvas');
        const W = element.clientWidth || 800;
        const H = element.clientHeight || 400;
        offscreen.width = W;
        offscreen.height = H;
        const ctx = offscreen.getContext('2d');
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, W, H);
        // Simple bar recreation
        const bw = Math.max(8, (W - bars.length * 5) / bars.length);
        bars.forEach((bar, i) => {
            const pct = parseFloat(bar.style.getPropertyValue('--h')) / 100;
            const barH = pct * (H - 40);
            const x = i * (bw + 5) + 10;
            const y = H - 30 - barH;
            ctx.fillStyle = bar.classList.contains('sorted') ? '#10b981'
                : bar.classList.contains('comparing') ? '#ef4444'
                    : bar.classList.contains('active') ? '#f59e0b'
                        : '#3b82f6';
            ctx.beginPath();
            ctx.roundRect?.(x, y, bw, barH, 4) ?? ctx.rect(x, y, bw, barH);
            ctx.fill();
        });
        offscreen.toBlob(blob => {
            _downloadBlob(blob, `algoviz-bars-${Date.now()}.png`);
        }, 'image/png');
    } catch (e) {
        console.error('[Export] PNG export failed:', e);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    _downloadBlob(blob, filename);
}

function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}