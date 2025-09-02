import { ChartDataset, ChartOptions, RatingHistory, Settings } from '../types';
import { BACKFILL_STATE_KEY, DATASET_STYLES, ICONS } from './constants';
import { formatDate, getStoredData, getUserId, logger } from './utils';
import { applyStyles } from './styles';

// --- Module State ---
let ratingChart: any = null; // The Chart.js instance.
let isGraphExpanded = false;
let refreshIntervalId: number | null = null;
let countdownIntervalId: number | null = null;
let showingCompletionMessage = false;

// --- UI Update Functions ---

/**
 * Sets the sync state and updates the UI to reflect it.
 * Displays a spinner and a message during sync operations.
 * @param syncing Whether the script is currently syncing data.
 * @param text The text to display next to the sync indicator.
 */
export function setSyncState(
    syncing: boolean,
    text: string = '',
    settings?: Settings,
    callback?: () => Promise<void>
): void {
    const statusEl = document.getElementById('guesslyticsStatus');
    const timerEl = document.getElementById('guesslyticsTimer');
    const resyncBtn = document.getElementById('guesslyticsResyncBtn') as HTMLButtonElement;

    if (!statusEl || !timerEl || !resyncBtn) return;

    resyncBtn.disabled = syncing;

    if (syncing) {
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        countdownIntervalId = null;
        timerEl.style.display = '';
        timerEl.classList.add('status-message', 'minimal-display');
        timerEl.innerHTML = `<span class="full-text">${text} <div class="gg-spinner"></div></span><span class="minimal-text"><div class="gg-spinner"></div></span>`;
        statusEl.innerText = '';
    } else {
        showingCompletionMessage = true;
        timerEl.style.display = '';
        timerEl.classList.add('status-message', 'minimal-display');
        const displayText = text || '✓ Up-to-date';
        timerEl.innerHTML = `<span class="full-text">${displayText}</span><span class="minimal-text">✓</span>`;
        statusEl.innerText = '';
        setTimeout(() => {
            if (timerEl && timerEl.classList.contains('status-message')) {
                timerEl.innerHTML = '';
                timerEl.classList.remove('status-message', 'minimal-display');
                showingCompletionMessage = false;
                if (settings && callback) {
                    startRefreshCycle(settings, callback);
                }
            }
        }, 3000);
    }
}

/**
 * Sets up the main UI elements for the script.
 * Injects the graph container and settings panel into the page.
 * @param userId The current user's ID.
 * @param settings The user's current settings.
 * @param resyncCallback A callback function to trigger a manual data resync.
 */
export function setupUI(
    userId: string,
    settings: Settings,
    resyncCallback: () => Promise<void>
): void {
    logger.log('Setting up UI.');
    Chart.defaults.font.family = "'ggFont', sans-serif";

    const targetElement = document.querySelector('[class*="division-header_right"]');
    if (!targetElement || document.getElementById('guesslyticsContainer')) return;

    const container = document.createElement('div');
    container.id = 'guesslyticsContainer';
    container.innerHTML = `
        <div class="guesslytics-header">
            <div class="guesslytics-header-row">
                <div class="guesslytics-title-wrapper">
                    <h3><span class="full-title">RATING HISTORY</span><span class="short-title">HISTORY</span></h3>
                    <span id="guesslyticsStatus"></span>
                </div>
                <div class="guesslytics-buttons-section">
                    <span id="guesslyticsTimer"></span>
                    <div class="chart-buttons">
                        <button id="guesslyticsResyncBtn" title="Manual Sync">${ICONS.RESYNC}</button>
                        <button id="guesslyticsToggleBtn" title="Toggle Graph Size">${ICONS.EXPAND}</button>
                        <button id="guesslyticsSettingsBtn" title="Settings">${ICONS.SETTINGS}</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="graphWrapper"><div id="guesslyticsStats"></div><canvas id="guesslyticsCanvas"></canvas></div>`;

    targetElement.innerHTML = '';
    targetElement.appendChild(container);

    // Create a container for the settings panel if it doesn't exist.
    if (!document.getElementById('guesslyticsSettingsPanel')) {
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'guesslyticsSettingsPanel';
        document.body.appendChild(settingsPanel);
    }

    // --- Attach Event Listeners ---
    document.getElementById('guesslyticsToggleBtn')!.onclick = () => {
        isGraphExpanded = !isGraphExpanded;
        container.classList.toggle('expanded', isGraphExpanded);
        document.getElementById('guesslyticsToggleBtn')!.innerHTML = isGraphExpanded ? ICONS.COLLAPSE : ICONS.EXPAND;
        document.getElementById('guesslyticsStats')!.style.display = isGraphExpanded ? 'flex' : 'none';
        if (isGraphExpanded) calculateAndRenderStats();
    };

    document.getElementById('guesslyticsSettingsBtn')!.onclick = () => {
        document.getElementById('guesslyticsSettingsPanel')!.style.display = 'block';
        renderSettingsPanel(settings);
    };

    document.getElementById('guesslyticsResyncBtn')!.onclick = async () => {
        await resyncCallback();
    };

    // Apply CSS styles from the external file
    applyStyles(settings);
}

/**
 * Calculates and renders statistics based on the visible data in the chart.
 * This is shown when the graph is expanded.
 */
export async function calculateAndRenderStats(): Promise<void> {
    if (!isGraphExpanded || !ratingChart) return;

    const statsEl = document.getElementById('guesslyticsStats');
    if (!statsEl) return;

    const data = await getStoredData();
    const visibleMin = ratingChart.scales.x.min;
    const visibleMax = ratingChart.scales.x.max;

    const visibleData = data.overall.filter((d) => {
        const ts = new Date(d.timestamp).getTime();
        return ts >= visibleMin && ts <= visibleMax;
    });

    if (visibleData.length < 2) {
        statsEl.innerHTML = '<div class="stat-item"><div class="label">Not enough data for stats</div></div>';
        return;
    }

    const lastGame = visibleData[visibleData.length - 1];
    const secondLastGame = visibleData[visibleData.length - 2];
    const lastChange = lastGame.rating - secondLastGame.rating;
    const lastChangeEl = `<div class="value ${lastChange >= 0 ? 'positive' : 'negative'}">${lastChange >= 0 ? '+' : ''}${lastChange}</div>`;

    let wins = 0, losses = 0, gains = 0, lossesTotal = 0, peakRating = visibleData[0].rating;

    for (let i = 1; i < visibleData.length; i++) {
        const change = visibleData[i].rating - visibleData[i - 1].rating;
        if (change > 0) { wins++; gains += change; }
        if (change < 0) { losses++; lossesTotal += change; }
        if (visibleData[i].rating > peakRating) peakRating = visibleData[i].rating;
    }

    const netChange = visibleData[visibleData.length - 1].rating - visibleData[0].rating;
    const totalGames = visibleData.length - 1;
    const avgNet = totalGames > 0 ? (netChange / totalGames).toFixed(2) : '0';
    const avgNetEl = `<div class="value ${Number(avgNet) >= 0 ? 'positive' : 'negative'}">${Number(avgNet) >= 0 ? '+' : ''}${avgNet}</div>`;

    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    let winRateClass = '';
    if (winRate > 50) winRateClass = 'positive';
    if (winRate < 50) winRateClass = 'negative';
    const winRateEl = `<div class="value ${winRateClass}">${winRate}%</div>`;

    const avgGain = wins > 0 ? (gains / wins).toFixed(2) : '0';
    const avgLoss = losses > 0 ? (lossesTotal / losses).toFixed(2) : '0';

    statsEl.innerHTML = `
        <div class="stat-item">${lastChangeEl}<div class="label">Last Change</div></div>
        <div class="stat-item">${avgNetEl}<div class="label">Avg. Net/Game</div></div>
        <div class="stat-item">${winRateEl}<div class="label">Win Rate</div></div>
        <div class="stat-item"><div class="value positive">+${avgGain}</div><div class="label">Avg Gain</div></div>
        <div class="stat-item"><div class="value negative">${avgLoss}</div><div class="label">Avg Loss</div></div>
        <div class="stat-item"><div class="value">${peakRating}</div><div class="label">Peak Rating</div></div>`;
}

/**
 * Renders the settings panel with the current settings and data stats.
 * @param settings The user's current settings.
 */
export async function renderSettingsPanel(settings: Settings): Promise<void> {
    logger.log('Rendering settings panel.');
    const settingsPanel = document.getElementById('guesslyticsSettingsPanel');
    if (!settingsPanel) return;

    const data = await getStoredData();
    const backfillState = await GM_getValue(BACKFILL_STATE_KEY, { lastLimitDays: 0, lastSyncTimestamp: null, ended: false });

    const stats = {
        points: data.overall.length,
        oldest: data.overall.length > 0 ? formatDate(data.overall[0].timestamp) : 'N/A',
        newest: data.overall.length > 0 ? formatDate(data.overall[data.overall.length - 1].timestamp) : 'N/A',
        lastSync: formatDate(backfillState?.lastSyncTimestamp ?? null),
    };

    settingsPanel.innerHTML = `
        <div id="guesslyticsSettingsOverlay"></div>
        <div id="guesslyticsSettingsModal">
            <h2>Guesslytics Settings</h2>
            <div class="settings-section"><h4>Graphs</h4>
                <div class="graph-toggle-row">${Object.entries(DATASET_STYLES).map(([key, val]) =>
                    `<div class="graph-toggle-item"><label for="ds_${key}" style="display:flex;align-items:center;">
                    <span class="color-swatch" style="background:${val.color};"></span>${val.label}</label>
                    <input type="checkbox" id="ds_${key}" data-key="${key}" ${settings.visibleDatasets[key as keyof typeof settings.visibleDatasets] ? 'checked' : ''}>
                    </div>`).join('')}
                </div>
                <div class="settings-row"><label for="showAreaFill">Show Area Fill</label>
                <input type="checkbox" id="showAreaFill" ${settings.showAreaFill ? 'checked' : ''}></div></div>
            <div class="settings-section"><h4>Data Sync</h4>
                <div class="settings-row"><label for="backfillFull">Sync Full History</label>
                <input type="checkbox" id="backfillFull" ${settings.backfillFullHistory ? 'checked' : ''}></div>
                <div class="settings-row" id="backfillDaysRow"><label for="backfillDays">Sync history for (days)</label>
                <input type="number" id="backfillDays" value="${settings.backfillDays}" min="1"></div></div>
            <div class="settings-section"><h4>Advanced</h4>
                <div class="settings-row"><label for="initialZoomDays">Initial Zoom (days)</label>
                <input type="number" id="initialZoomDays" value="${settings.initialZoomDays || 7}" min="1"></div>
                <div class="settings-row"><label for="autoRefreshInterval">Refresh Interval (sec)</label>
                <input type="number" id="autoRefreshInterval" value="${settings.autoRefreshInterval}" min="10"></div>
                <div class="settings-row"><label for="apiRequestDelay">API Request Delay (ms)</label>
                <input type="number" id="apiRequestDelay" value="${settings.apiRequestDelay}" min="50"></div>
                <div class="settings-row"><label for="bgOpacity">Background Opacity (%)</label>
                <input type="range" id="bgOpacity" value="${settings.backgroundOpacity}" min="0" max="100"></div>
                <div class="settings-row"><label for="verboseLogging">Enable Verbose Logging</label>
                <input type="checkbox" id="verboseLogging" ${settings.verboseLogging ? 'checked' : ''}></div></div>
            <div class="settings-stats"><b>Games Tracked:</b> ${stats.points} | <b>Last Sync:</b> ${stats.lastSync}<br>
            <b>Date Range:</b> ${stats.oldest} – ${stats.newest}</div>
            <div class="settings-actions"><button id="resetSettingsBtn">Reset Settings</button>
            <button id="clearDataBtn">Clear All Data</button></div>
            <div class="settings-footer"><a href="https://github.com/Avanatiker/Guesslytics" target="_blank">
            ${ICONS.GITHUB} Guesslytics v${GM_info.script.version} by Constructor</a></div>
        </div>`;

    document.getElementById('guesslyticsSettingsOverlay')!.onclick = () => (settingsPanel.style.display = 'none');
    
    // Add escape key listener to close settings panel
    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && settingsPanel.style.display === 'block') {
            settingsPanel.style.display = 'none';
            document.removeEventListener('keydown', handleKeyPress);
            // Remove focus from settings button
            const settingsBtn = document.getElementById('guesslyticsSettingsBtn') as HTMLButtonElement;
            if (settingsBtn) settingsBtn.blur();
        }
    };
    document.addEventListener('keydown', handleKeyPress);

    // Dispatch a custom event to signal that the settings panel has been rendered.
    // This allows the main script to attach event handlers after the panel is in the DOM.
    document.dispatchEvent(new CustomEvent('guesslyticsSettingsRendered'));

    // Toggle visibility of the backfill days input based on the full history checkbox.
    const backfillDaysRow = document.getElementById('backfillDaysRow');
    const fullHistoryCheck = document.getElementById('backfillFull') as HTMLInputElement;

    if (backfillDaysRow && fullHistoryCheck) {
        // Set initial visibility based on current settings
        backfillDaysRow.classList.toggle('hidden', settings.backfillFullHistory);

        // Add event listener to update visibility when the checkbox changes
        fullHistoryCheck.onchange = () => {
            backfillDaysRow.classList.toggle('hidden', fullHistoryCheck.checked);
        };
    }
}

/**
 * Creates chart datasets from rating history data.
 * @param data The rating history data.
 * @param settings The user's current settings.
 * @param canvas The canvas element for the chart.
 * @returns An array of chart datasets.
 */
function createChartDatasets(data: RatingHistory, settings: Settings, canvas: HTMLCanvasElement): ChartDataset[] {
    return Object.keys(DATASET_STYLES).map((key) => {
        const style = DATASET_STYLES[key as keyof typeof DATASET_STYLES];
        const gradient = canvas.getContext('2d')!.createLinearGradient(0, 0, 0, isGraphExpanded ? 400 : 210);
        gradient.addColorStop(0, `${style.color}55`);
        gradient.addColorStop(1, `${style.color}05`);

        return {
            label: style.label,
            data: data[key as keyof RatingHistory].map((d) => ({
                x: new Date(d.timestamp).getTime(),
                y: d.rating,
                gameId: d.gameId,
            })),
            borderColor: style.color,
            borderWidth: key === 'overall' ? 2.5 : 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderColor: '#fff',
            pointHoverBackgroundColor: style.color,
            fill: settings.showAreaFill,
            backgroundColor: gradient,
            tension: 0,
            stepped: true,
            hidden: !settings.visibleDatasets[key as keyof typeof settings.visibleDatasets],
        };
    });
}

/**
 * Creates a crosshair line plugin for the chart.
 * @returns The crosshair line plugin.
 */
function createCrosshairLinePlugin() {
    return {
        id: 'crosshairLine',
        afterDatasetsDraw: (chart: any) => {
            const { tooltip, ctx, chartArea: { top, bottom } } = chart;
            if (tooltip.getActiveElements()?.length > 0) {
                const x = tooltip.getActiveElements()[0].element.x;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.stroke();
                ctx.restore();
            }
        },
    };
}

/**
 * Creates chart options for the rating history chart.
 * @param data The rating history data.
 * @param settings The user's current settings.
 * @param currentZoom The current zoom level, if any.
 * @param minTimestamp The minimum timestamp in the data.
 * @param maxTimestamp The maximum timestamp in the data.
 * @param wasDragging Reference to the wasDragging flag.
 * @returns The chart options.
 */
function createChartOptions(
    data: RatingHistory, 
    settings: Settings, 
    currentZoom: { min: number; max: number } | null,
    minTimestamp: number | null,
    maxTimestamp: number | null,
    wasDragging: { value: boolean }
): ChartOptions {
    const chartOptions: ChartOptions = {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'x', intersect: false },
        onClick: (e, elements) => {
            if (wasDragging.value || elements.length === 0) return;
            const { datasetIndex, index } = elements[0];
            const gameId = ratingChart.data.datasets[datasetIndex].data[index].gameId;
            if (gameId) window.open(`https://www.geoguessr.com/duels/${gameId}`, '_blank');
        },
        plugins: {
            title: { display: false },
            legend: { display: false },
            tooltip: {
                position: 'nearest',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                    title: (items) => formatDate(items[0].parsed.x),
                    label: (context) => {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    }
                },
            },
        },
        scales: {
            x: {
                type: 'time',
                time: { unit: 'day' },
                ticks: { color: '#aaa' },
                grid: { color: 'rgba(255,255,255,0.1)' },
            },
            y: {
                ticks: { color: '#aaa' },
                grid: { color: 'rgba(255,255,255,0.1)' },
            },
        },
    };

    // Set zoom level
    if (currentZoom?.min && currentZoom?.max) {
        chartOptions.scales.x.min = currentZoom.min;
        chartOptions.scales.x.max = currentZoom.max;
    } else if (data.overall.length > 0) {
        const lastTimestamp = new Date(data.overall[data.overall.length - 1].timestamp).getTime();
        const minZoomDate = new Date(lastTimestamp);
        minZoomDate.setDate(minZoomDate.getDate() - (settings.initialZoomDays || 7));
        chartOptions.scales.x.min = minZoomDate.getTime();
        chartOptions.scales.x.max = lastTimestamp;
    }

    return chartOptions;
}

/**
 * Sets up pan and zoom interactions for the chart.
 * @param canvas The canvas element for the chart.
 * @param data The rating history data.
 * @param minTimestamp The minimum timestamp in the data.
 * @param maxTimestamp The maximum timestamp in the data.
 * @param wasDragging Reference to the wasDragging flag.
 */
function setupChartInteractions(
    canvas: HTMLCanvasElement, 
    data: RatingHistory, 
    minTimestamp: number | null, 
    maxTimestamp: number | null,
    wasDragging: { value: boolean }
): void {
    let isPanning = false, lastX = 0, startX = 0;

    const onPanEnd = () => {
        if (!isPanning) return;
        isPanning = false;
        canvas.style.cursor = 'grab';
        if (isGraphExpanded) calculateAndRenderStats();
        setTimeout(() => (wasDragging.value = false), 50);
    };

    canvas.onmousedown = (e) => {
        isPanning = true;
        lastX = e.clientX;
        startX = e.clientX;
        wasDragging.value = false;
        canvas.style.cursor = 'grabbing';
    };

    canvas.onmouseup = onPanEnd;
    canvas.onmouseleave = onPanEnd;

    canvas.onmousemove = (e) => {
        if (!isPanning) return;
        if (Math.abs(e.clientX - startX) > 5) wasDragging.value = true;
        const deltaX = e.clientX - lastX;
        lastX = e.clientX;
        const { scales } = ratingChart;
        let newMin = scales.x.min - (scales.x.max - scales.x.min) * (deltaX / scales.x.width);
        let newMax = scales.x.max - (scales.x.max - scales.x.min) * (deltaX / scales.x.width);

        if (data.overall.length > 1 && minTimestamp && maxTimestamp) {
            if (newMin < minTimestamp) {
                const diff = minTimestamp - newMin;
                newMin += diff;
                newMax += diff;
            }
            if (newMax > maxTimestamp) {
                const diff = newMax - maxTimestamp;
                newMin -= diff;
                newMax -= diff;
            }
        }

        ratingChart.options.scales.x.min = newMin;
        ratingChart.options.scales.x.max = newMax;
        ratingChart.update('none');
    };

    canvas.onwheel = (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
        const { scales } = ratingChart;
        const mouseTimestamp = scales.x.getValueForPixel(e.offsetX);
        let newMin = mouseTimestamp - (mouseTimestamp - scales.x.min) * zoomFactor;
        let newMax = mouseTimestamp + (scales.x.max - mouseTimestamp) * zoomFactor;

        if (data.overall.length > 1 && minTimestamp && maxTimestamp) {
            if (newMin < minTimestamp) newMin = minTimestamp;
            if (newMax > maxTimestamp) newMax = maxTimestamp;
        }

        if (newMax - newMin < 1000 * 60 * 5) return; // Minimum zoom level of 5 minutes

        ratingChart.options.scales.x.min = newMin;
        ratingChart.options.scales.x.max = newMax;
        ratingChart.update('none');
        if (isGraphExpanded) calculateAndRenderStats();
    };
}

/**
 * Renders the rating history chart.
 * @param data The rating history data.
 * @param settings The user's current settings.
 */
export async function renderGraph(data: RatingHistory, settings: Settings): Promise<void> {
    const wasEmpty = !ratingChart || ratingChart.data.datasets.every((ds: ChartDataset) => ds.data.length === 0);
    const currentZoom = ratingChart && !wasEmpty ? { min: ratingChart.scales.x.min, max: ratingChart.scales.x.max } : null;

    if (ratingChart) ratingChart.destroy();

    const canvas = document.getElementById('guesslyticsCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.style.cursor = 'grab';

    // Calculate timestamp bounds
    const timestamps = data.overall.map((d) => new Date(d.timestamp).getTime());
    const minTimestamp = data.overall.length > 0 ? Math.min(...timestamps) : null;
    const maxTimestamp = data.overall.length > 0 ? Math.max(...timestamps) : null;

    // Create datasets, options, and plugins
    const wasDragging = { value: false }; // Use an object to allow reference passing
    const datasets = createChartDatasets(data, settings, canvas);
    const chartOptions = createChartOptions(data, settings, currentZoom, minTimestamp, maxTimestamp, wasDragging);
    const crosshairLinePlugin = createCrosshairLinePlugin();

    // Create the chart
    ratingChart = new Chart(canvas, {
        type: 'line',
        data: { datasets },
        options: chartOptions,
        plugins: [crosshairLinePlugin],
    });

    // Set up pan and zoom interactions
    setupChartInteractions(canvas, data, minTimestamp, maxTimestamp, wasDragging);

    // Update stats if expanded
    if (isGraphExpanded) calculateAndRenderStats();
}

/**
 * Starts the automatic refresh cycle to check for new games.
 * @param settings The user's current settings.
 * @param checkForUpdatesCallback The function to call to check for updates.
 */
export function startRefreshCycle(
    settings: Settings,
    checkForUpdatesCallback: () => Promise<void>
): void {
    if (showingCompletionMessage) return;
    
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    const userId = getUserId();
    const timerEl = document.getElementById('guesslyticsTimer');
    if (!timerEl) return;

    if (!userId || settings.autoRefreshInterval <= 0) {
        timerEl.style.display = 'none';
        return;
    }

    timerEl.style.display = 'inline';
    let nextSyncTime = Date.now() + settings.autoRefreshInterval * 1000;

    const updateTimer = () => {
        const remaining = Math.round((nextSyncTime - Date.now()) / 1000);
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            const fullText = minutes > 0 && seconds > 0
                ? `(Sync in ${minutes}m ${seconds}s)`
                : `(Sync in ${remaining}s)`;
            const minimalText = `${remaining}s`;
            
            timerEl.classList.add('minimal-display');
            timerEl.innerHTML = `<span class="full-text">${fullText}</span><span class="minimal-text">${minimalText}</span>`;
        }
    };

    updateTimer();

    refreshIntervalId = window.setInterval(() => {
        checkForUpdatesCallback();
        nextSyncTime = Date.now() + settings.autoRefreshInterval * 1000;
    }, settings.autoRefreshInterval * 1000);

    countdownIntervalId = window.setInterval(updateTimer, 1000);
}
