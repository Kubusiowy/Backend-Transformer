const page = document.body?.dataset?.page || "";
const isDataPage = page === "readings-data";
const isChartsPage = page === "readings-charts";
const isDiagnosticsPage = page === "readings-diagnostics";

const transformerSelect = document.getElementById("readingsTransformerSelect");
const meterSelect = document.getElementById("readingsMeterSelect");
const limitInput = document.getElementById("readingsLimit");
const loadBtn = document.getElementById("readingsLoad");
const refreshBtn = document.getElementById("readingsRefresh");
const selectionHint = document.getElementById("readingsSelectionHint");
const statusBox = document.getElementById("readingsStatus");
const statusBody = document.getElementById("readingsStatusBody");
const readingsOverview = document.getElementById("readingsOverview");

const wsStatus = document.getElementById("readingsWsStatus");
const wsStatusText = document.getElementById("readingsWsStatusText");
const wsLog = document.getElementById("wsLog");
const wsLogEmpty = document.getElementById("wsLogEmpty");

const errorsList = document.getElementById("transformerErrorsList");
const errorsEmpty = document.getElementById("transformerErrorsEmpty");
const errorsHint = document.getElementById("transformerErrorsHint");
const errorsRefreshBtn = document.getElementById("transformerErrorsRefresh");

const registerPickerEmpty = document.getElementById("registerPickerEmpty");
const registerCardGrid = document.getElementById("registerCardGrid");
const registerSelectAll = document.getElementById("registerSelectAll");
const registerClear = document.getElementById("registerClear");

const metricsGrid = document.getElementById("registerMetricsGrid");
const metricsEmpty = document.getElementById("registerMetricsEmpty");

let transformers = [];
let meters = [];
let registers = [];
let selectedRegisterKeys = new Set();
let metricsByKey = {};
let transformerErrors = [];
let registerKeyAliases = new Map();
let wsLogEntries = [];
let ws = null;
let autoLoadTimer = null;

let selectedTransformerId = window.BTData ? window.BTData.getSelectedId() : null;
let selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;

const colorPalette = [
    "#2563eb",
    "#0ea5e9",
    "#16a34a",
    "#f97316",
    "#db2777",
    "#7c3aed",
    "#14b8a6",
    "#f59e0b"
];

const setStatus = (message, state) => {
    if (!statusBody || !statusBox) {
        return;
    }
    statusBody.textContent = message;
    statusBox.classList.remove("result--success", "result--error");
    if (state) {
        statusBox.classList.add(state);
    }
};

const shouldShowHint = (message) => {
    const text = String(message || "").trim().toLowerCase();
    if (!text) {
        return false;
    }
    return [
        "wczytuje",
        "wybierz",
        "brak",
        "dodaj",
        "blad",
        "offline",
        "online"
    ].some((token) => text.includes(token));
};

const setHint = (message) => {
    if (!selectionHint) {
        return;
    }
    if (shouldShowHint(message)) {
        selectionHint.textContent = message;
        selectionHint.style.display = "block";
        return;
    }
    selectionHint.textContent = "";
    selectionHint.style.display = "none";
};

const setErrorsHint = (message) => {
    if (!errorsHint) {
        return;
    }
    if (shouldShowHint(message)) {
        errorsHint.textContent = message;
        errorsHint.style.display = "block";
        return;
    }
    errorsHint.textContent = "";
    errorsHint.style.display = "none";
};

const setWsStatus = (message, state) => {
    if (wsStatusText) {
        wsStatusText.textContent = message;
    }
    if (wsStatus) {
        wsStatus.classList.remove("ws-status--online", "ws-status--offline", "ws-status--warning");
        if (state) {
            wsStatus.classList.add(`ws-status--${state}`);
        }
    }
};

const formatValue = (value, unit) => {
    if (value === null || value === undefined || value === "") {
        return "(brak)";
    }
    const numberValue = Number(value);
    const formatted = Number.isFinite(numberValue) ? numberValue.toFixed(2) : String(value);
    return unit ? `${formatted} ${unit}` : formatted;
};

const formatRoundedValue = (value, unit) => {
    if (value === null || value === undefined || value === "") {
        return "(brak)";
    }
    const numberValue = Number(value);
    const formatted = Number.isFinite(numberValue) ? String(Math.round(numberValue)) : String(value);
    return unit ? `${formatted} ${unit}` : formatted;
};

const formatExactValue = (value, unit) => {
    if (value === null || value === undefined || value === "") {
        return "(brak)";
    }
    const numberValue = Number(value);
    const formatted = Number.isFinite(numberValue) ? numberValue.toFixed(4) : String(value);
    return unit ? `${formatted} ${unit}` : formatted;
};

const formatTimestamp = (value) => {
    if (!value) {
        return "(brak)";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }
    return parsed.toLocaleString("pl-PL");
};

const formatShortTimestamp = (value) => {
    if (!value) {
        return "(brak)";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }
    return parsed.toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};

const formatChartAxisValue = (value) => {
    if (!Number.isFinite(value)) {
        return "";
    }
    if (Math.abs(value) >= 1000) {
        return value.toFixed(0);
    }
    if (Math.abs(value) >= 100) {
        return value.toFixed(1);
    }
    return value.toFixed(2);
};

const getErrorStatusLabel = (status) => {
    switch (String(status || "").toUpperCase()) {
        case "ERROR":
            return "Blad";
        case "WARNING":
            return "Ostrzezenie";
        case "INFO":
            return "Informacja";
        default:
            return status || "Nieznany";
    }
};

const getErrorStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
        case "ERROR":
            return "tag tag--error";
        case "WARNING":
            return "tag tag--warn";
        case "INFO":
            return "tag tag--info";
        default:
            return "tag";
    }
};

const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();

const getSelectedTransformerId = () => selectedTransformerId;

const setSelectedTransformerId = (id) => {
    selectedTransformerId = id ? String(id) : null;
    if (window.BTData) {
        window.BTData.setSelectedId(selectedTransformerId);
    }
};

const getSelectedMeterId = () => {
    if (!selectedMeterInfo || selectedMeterInfo.transformerId !== getSelectedTransformerId()) {
        return null;
    }
    return selectedMeterInfo.meterId ? String(selectedMeterInfo.meterId) : null;
};

const setSelectedMeterId = (meterId) => {
    const transformerId = getSelectedTransformerId();
    if (window.BTData) {
        window.BTData.setSelectedMeterInfo(
            transformerId ? String(transformerId) : null,
            meterId ? String(meterId) : null
        );
    }
    selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;
};

const getSelectedTransformer = () => {
    const id = getSelectedTransformerId();
    return transformers.find((item) => String(item.id) === String(id)) || null;
};

const getSelectedMeter = () => {
    const meterId = getSelectedMeterId() || meterSelect?.value || null;
    return meters.find((item) => String(item.id) === String(meterId)) || null;
};

const getMetricLimit = () => {
    const value = Number(limitInput?.value || 120);
    if (!value || value < 10) {
        return 120;
    }
    return Math.min(value, 5000);
};

const getRegisterKey = (register) => {
    const name = String(register?.name || "").trim();
    if (name) {
        return name;
    }
    return `reg-${register?.address ?? "unknown"}`;
};

const buildRegisterKeyAliases = () => {
    registerKeyAliases = new Map();
    registers.forEach((register) => {
        const key = getRegisterKey(register);
        const aliases = [
            normalizeKey(key),
            normalizeKey(register?.name),
            normalizeKey(register?.address),
            normalizeKey(`reg-${register?.address}`)
        ];
        aliases.filter(Boolean).forEach((alias) => registerKeyAliases.set(alias, key));
    });
};

const deriveAliasesFromKey = (value) => {
    const normalized = normalizeKey(value);
    if (!normalized) {
        return [];
    }
    const aliases = new Set([normalized]);
    [".", "/", ":"].forEach((separator) => {
        const parts = normalized.split(separator);
        if (parts.length > 1) {
            aliases.add(parts[parts.length - 1]);
        }
    });
    return Array.from(aliases);
};

const resolveMetricKey = (payload) => {
    const candidates = [
        ...deriveAliasesFromKey(payload?.key),
        ...deriveAliasesFromKey(payload?.label)
    ];
    for (const candidate of candidates) {
        if (registerKeyAliases.has(candidate)) {
            return registerKeyAliases.get(candidate);
        }
    }
    return payload?.key || payload?.label || null;
};

const getPointValue = (point) => {
    const exactValue = Number(point?.lastValue);
    if (Number.isFinite(exactValue)) {
        return exactValue;
    }
    const fallbackValue = Number(point?.avgValue ?? point?.maxValue);
    return Number.isFinite(fallbackValue) ? fallbackValue : null;
};

const getMetricSeries = (key) =>
    (metricsByKey[key] || []).filter((point) =>
        Number.isFinite(getPointValue(point))
    );

const getLatestMetric = (key) => getMetricSeries(key)[0] || null;
const getMetricTimestamp = (point) => point?._receivedAt || point?.bucketTs || null;
const parseMetricTimestamp = (point) => {
    const rawValue = getMetricTimestamp(point);
    if (!rawValue) {
        return null;
    }
    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getSelectedRegisters = () =>
    registers.filter((register) => selectedRegisterKeys.has(getRegisterKey(register)));

const autoSelectRegisters = () => {
    if (!registers.length) {
        selectedRegisterKeys = new Set();
        return;
    }
    const source = registers.filter((register) => register.enabled !== false);
    selectedRegisterKeys = new Set((source.length ? source : registers).map((register) => getRegisterKey(register)));
};

const pruneMetricsStore = () => {
    const allowed = new Set(selectedRegisterKeys);
    Object.keys(metricsByKey).forEach((key) => {
        if (!allowed.has(key)) {
            delete metricsByKey[key];
            return;
        }
        metricsByKey[key] = (metricsByKey[key] || []).slice(0, getMetricLimit());
    });
};

const scheduleMetricsReload = (delay = 150) => {
    if (autoLoadTimer) {
        window.clearTimeout(autoLoadTimer);
    }
    autoLoadTimer = window.setTimeout(() => {
        autoLoadTimer = null;
        loadMetricsForSelected();
    }, delay);
};

const getCssColor = (name, fallback) => {
    const value = getComputedStyle(document.body).getPropertyValue(name).trim();
    return value || fallback;
};

const createStatRow = (label, value) => {
    const row = document.createElement("div");
    row.className = "metric-card__stat";

    const labelEl = document.createElement("span");
    labelEl.textContent = label;

    const valueEl = document.createElement("strong");
    valueEl.textContent = value;

    row.append(labelEl, valueEl);
    return row;
};

const renderOverview = () => {
    if (!readingsOverview) {
        return;
    }
    readingsOverview.innerHTML = "";

    const selected = getSelectedRegisters();
    const latestPoints = selected
        .map((register) => getLatestMetric(getRegisterKey(register)))
        .filter(Boolean);

    const cards = [
        {
            label: "Transformator",
            value: getSelectedTransformer()?.name || "Brak",
            meta: getSelectedMeter()?.name || "Brak miernika"
        },
        {
            label: "Aktywne rejestry",
            value: String(selectedRegisterKeys.size),
            meta: selectedRegisterKeys.size ? "Zaznaczone do podgladu" : "Nic nie wybrano"
        },
        {
            label: "Ostatni odczyt",
            value: latestPoints.length ? formatShortTimestamp(latestPoints[0].bucketTs) : "Brak",
            meta: latestPoints.length ? "Ostatnia aktualizacja danych" : "Czekam na probki"
        },
        {
            label: "Limit historii",
            value: String(getMetricLimit()),
            meta: isChartsPage ? "Punktow na wykres" : "Punktow na rejestr"
        }
    ];

    cards.forEach((item) => {
        const card = document.createElement("div");
        card.className = "overview-card";
        card.innerHTML = `
            <div class="overview-card__label">${item.label}</div>
            <div class="overview-card__value">${item.value}</div>
            <div class="overview-card__meta">${item.meta}</div>
        `;
        readingsOverview.append(card);
    });
};

const renderTransformerSelect = () => {
    if (!transformerSelect) {
        return;
    }
    transformerSelect.innerHTML = "";
    if (!transformers.length) {
        transformerSelect.innerHTML = '<option value="">Brak transformatorow</option>';
        transformerSelect.disabled = true;
        return;
    }
    transformerSelect.disabled = false;
    transformers.forEach((transformer) => {
        const option = document.createElement("option");
        option.value = String(transformer.id);
        option.textContent = `${transformer.name} (${transformer.id})`;
        transformerSelect.append(option);
    });
    if (getSelectedTransformerId()) {
        transformerSelect.value = getSelectedTransformerId();
    }
};

const renderMeterSelect = () => {
    if (!meterSelect) {
        return;
    }
    meterSelect.innerHTML = "";
    if (!meters.length) {
        meterSelect.innerHTML = '<option value="">Brak miernikow</option>';
        meterSelect.disabled = true;
        return;
    }
    meterSelect.disabled = false;
    meters.forEach((meter) => {
        const option = document.createElement("option");
        option.value = String(meter.id);
        option.textContent = `${meter.name} (${meter.deviceCode})`;
        meterSelect.append(option);
    });
    const selectedId = getSelectedMeterId();
    if (selectedId && meters.find((meter) => String(meter.id) === String(selectedId))) {
        meterSelect.value = selectedId;
    } else {
        meterSelect.value = String(meters[0].id);
        setSelectedMeterId(meters[0].id);
    }
};

const renderRegisterPicker = () => {
    if (!registerCardGrid || !registerPickerEmpty) {
        return;
    }
    registerCardGrid.innerHTML = "";
    if (!registers.length) {
        registerPickerEmpty.style.display = "block";
        registerPickerEmpty.textContent = getSelectedMeter()
            ? "Brak rejestrow dla wybranego miernika."
            : "Wybierz miernik, aby zobaczyc rejestry.";
        return;
    }
    registerPickerEmpty.style.display = "none";

    registers.forEach((register) => {
        const key = getRegisterKey(register);
        const latest = getLatestMetric(key);
        const card = document.createElement("label");
        card.className = "register-card";
        card.dataset.selected = selectedRegisterKeys.has(key) ? "true" : "false";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.value = key;
        checkbox.tabIndex = -1;
        checkbox.setAttribute("aria-hidden", "true");

        const info = document.createElement("div");
        info.className = "register-card__content";
        info.innerHTML = `
            <div class="register-card__top">
                <div>
                    <div class="register-card__name">${register.name || "Rejestr"}</div>
                    <div class="register-card__meta">${register.registerType || "Typ"} | adres ${register.address ?? "-"}</div>
                </div>
            </div>
        `;

        const summary = document.createElement("div");
        summary.className = "register-card__summary";
        summary.innerHTML = `
            <div class="register-card__summary-label">Aktualnie</div>
            <div class="register-card__value">${formatRoundedValue(getPointValue(latest), register.unit)}</div>
            <div class="register-card__summary-exact">${formatExactValue(getPointValue(latest), register.unit)}</div>
            <div class="register-card__summary-time">${formatShortTimestamp(getMetricTimestamp(latest))}</div>
        `;

        const details = document.createElement("div");
        details.className = "register-card__details";
        const detailItems = [
            ["Jednostka", register.unit || "-"],
            ["Dane", register.dataType || "-"],
            ["Skala", register.scale ?? "-"],
            ["Status", register.enabled === false ? "Wylaczony" : "Aktywny"]
        ];
        detailItems.forEach(([label, value]) => {
            const item = document.createElement("div");
            item.className = "register-card__detail";
            item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
            details.append(item);
        });

        card.append(checkbox, info, summary, details);
        registerCardGrid.append(card);
    });
};

const setupCanvas = (canvas, fallbackHeight) => {
    if (!canvas?.getContext) {
        return null;
    }
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height || fallbackHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
};

const buildChartScale = (values) => {
    if (!values.length) {
        return null;
    }
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
        min -= 1;
        max += 1;
    }
    const range = max - min;
    return {
        min: min - range * 0.08,
        max: max + range * 0.08
    };
};

const getChartPoints = (points) =>
    points
        .map((point) => {
            const value = getPointValue(point);
            return {
                value,
                rawTimestamp: getMetricTimestamp(point)
            };
        })
        .filter((point) => Number.isFinite(point.value))
        .reverse();

const drawMiniChart = (canvas, points, color) => {
    const canvasState = setupCanvas(canvas, 220);
    if (!canvasState) {
        return;
    }
    const { ctx, width, height } = canvasState;
    const chartPoints = getChartPoints(points);

    if (!chartPoints.length) {
        ctx.fillStyle = getCssColor("--muted", "#94a3b8");
        ctx.font = "12px 'Source Sans 3', sans-serif";
        ctx.fillText("Brak danych", 12, 20);
        return;
    }

    const domainValues = chartPoints.map((point) => point.value);
    const scale = buildChartScale(domainValues);
    const padding = { top: 18, right: 18, bottom: 38, left: 52 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const borderColor = getCssColor("--border", "#cbd5e1");
    const textMuted = getCssColor("--muted", "#64748b");
    const textStrong = getCssColor("--text-strong", "#0f172a");
    const surfaceAlt = getCssColor("--surface-alt", "#f8fafc");

    ctx.fillStyle = surfaceAlt;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `${borderColor}aa`;
    ctx.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
        const y = padding.top + (chartHeight * index) / 4;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }

    ctx.font = "11px 'Source Sans 3', sans-serif";
    ctx.fillStyle = textMuted;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let index = 0; index <= 4; index += 1) {
        const value = scale.max - ((scale.max - scale.min) * index) / 4;
        const y = padding.top + (chartHeight * index) / 4;
        ctx.fillText(formatChartAxisValue(value), padding.left - 8, y);
    }

    const tickIndexes = Array.from(new Set([
        0,
        Math.floor((chartPoints.length - 1) / 2),
        chartPoints.length - 1
    ])).filter((index) => index >= 0);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    tickIndexes.forEach((index) => {
        const x = padding.left + (chartWidth * index) / Math.max(chartPoints.length - 1, 1);
        const label = formatShortTimestamp(chartPoints[index]?.rawTimestamp);
        ctx.beginPath();
        ctx.moveTo(x, padding.top + chartHeight);
        ctx.lineTo(x, padding.top + chartHeight + 6);
        ctx.stroke();
        ctx.fillText(label, x, padding.top + chartHeight + 8);
    });

    const toX = (index) => padding.left + (chartWidth * index) / Math.max(chartPoints.length - 1, 1);
    const toY = (value) =>
        padding.top + chartHeight - ((value - scale.min) / Math.max(scale.max - scale.min, 1e-9)) * chartHeight;

    ctx.beginPath();
    chartPoints.forEach((point, index) => {
        const x = toX(index);
        const y = toY(point.value);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    const latest = chartPoints[chartPoints.length - 1];
    const latestX = toX(chartPoints.length - 1);
    const latestY = toY(latest.value);

    ctx.beginPath();
    ctx.arc(latestX, latestY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = surfaceAlt;
    ctx.stroke();

    ctx.fillStyle = textStrong;
    ctx.font = "600 12px 'Source Sans 3', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(formatChartAxisValue(latest.value), padding.left + 4, padding.top + 2);
};

const renderDataCards = () => {
    if (!metricsGrid || !metricsEmpty) {
        return;
    }
    metricsGrid.innerHTML = "";
    if (!selectedRegisterKeys.size) {
        metricsEmpty.style.display = "block";
        metricsGrid.style.display = "none";
        return;
    }

    metricsEmpty.style.display = "none";
    metricsGrid.style.display = "grid";

    getSelectedRegisters().forEach((register) => {
        const key = getRegisterKey(register);
        const latest = getLatestMetric(key);
        const card = document.createElement("article");
        card.className = "metric-card metric-card--data";

        const header = document.createElement("div");
        header.className = "metric-card__header";
        header.innerHTML = `
            <div class="metric-card__title">${register.name || key}</div>
            <div class="metric-card__subtitle">${register.registerType || "Rejestr"} | ${register.unit || "bez jednostki"}</div>
        `;

        const hero = document.createElement("div");
        hero.className = "metric-card__hero";
        hero.innerHTML = `
            <div class="metric-card__hero-label">Aktualna wartosc</div>
            <div class="metric-card__hero-value">${formatRoundedValue(getPointValue(latest), register.unit)}</div>
            <div class="metric-card__hero-exact">Dokladnie: ${formatExactValue(getPointValue(latest), register.unit)}</div>
        `;

        const stats = document.createElement("div");
        stats.className = "metric-card__stats metric-card__stats--single";
        stats.append(createStatRow("Aktualizacja", formatShortTimestamp(getMetricTimestamp(latest))));

        card.append(header, hero, stats);
        metricsGrid.append(card);
    });
};

const renderChartCards = () => {
    if (!metricsGrid || !metricsEmpty) {
        return;
    }
    metricsGrid.innerHTML = "";
    if (!selectedRegisterKeys.size) {
        metricsEmpty.style.display = "block";
        metricsGrid.style.display = "none";
        return;
    }

    metricsEmpty.style.display = "none";
    metricsGrid.style.display = "grid";

    getSelectedRegisters().forEach((register, index) => {
        const key = getRegisterKey(register);
        const points = getMetricSeries(key);
        const latest = points[0] || null;
        const card = document.createElement("article");
        card.className = "metric-card metric-card--chart";

        const header = document.createElement("div");
        header.className = "metric-card__header";
        header.innerHTML = `
            <div class="metric-card__title">${register.name || key}</div>
            <div class="metric-card__subtitle">${register.registerType || "Rejestr"} | adres ${register.address ?? "-"}</div>
        `;

        const stats = document.createElement("div");
        stats.className = "metric-card__stats";
        [
            ["Aktualnie", formatRoundedValue(getPointValue(latest), register.unit)],
            ["Dokladnie", formatExactValue(getPointValue(latest), register.unit)],
            ["Ostatni odczyt", formatShortTimestamp(getMetricTimestamp(latest))],
            [
                "Zakres czasu",
                points.length
                    ? `${formatShortTimestamp(getMetricTimestamp(points[points.length - 1]))} - ${formatShortTimestamp(getMetricTimestamp(points[0]))}`
                    : "(brak)"
            ]
        ].forEach(([label, value]) => stats.append(createStatRow(label, value)));

        const chartWrap = document.createElement("div");
        chartWrap.className = "metric-card__chart";
        const chartMeta = document.createElement("div");
        chartMeta.className = "metric-card__chart-meta";
        chartMeta.innerHTML = `
            <span>Prawidlowa wartosc z pomiaru</span>
            <span>Czas rzeczywistych probek</span>
        `;
        const canvas = document.createElement("canvas");
        const legend = document.createElement("div");
        legend.className = "metric-card__chart-legend";
        legend.innerHTML = `
            <span class="metric-card__legend-item"><i style="--legend-color:${colorPalette[index % colorPalette.length]}"></i>Prawidlowa wartosc</span>
        `;
        chartWrap.append(chartMeta, canvas, legend);
        drawMiniChart(canvas, points, colorPalette[index % colorPalette.length]);

        card.append(header, stats, chartWrap);
        metricsGrid.append(card);
    });
};

const renderTransformerErrors = () => {
    if (!errorsList || !errorsEmpty) {
        return;
    }
    errorsList.innerHTML = "";
    if (!getSelectedTransformer()) {
        errorsEmpty.style.display = "block";
        errorsList.style.display = "none";
        errorsEmpty.textContent = "Wybierz transformator, aby zobaczyc diagnostyke.";
        return;
    }
    if (!transformerErrors.length) {
        errorsEmpty.style.display = "block";
        errorsList.style.display = "none";
        errorsEmpty.textContent = "Brak bledow.";
        return;
    }
    errorsEmpty.style.display = "none";
    errorsList.style.display = "grid";

    transformerErrors.forEach((error) => {
        const item = document.createElement("div");
        item.className = "list__item";
        item.innerHTML = `
            <div class="list__main">
                <div class="list__name">${error.code}: ${error.message}</div>
                <div class="list__meta">Zgloszono: ${formatTimestamp(error.createdAt)}</div>
            </div>
            <div class="list__tags">
                <span class="${getErrorStatusClass(error.status)}">${getErrorStatusLabel(error.status)}</span>
            </div>
        `;
        errorsList.append(item);
    });
};

const updateWsLogEmpty = () => {
    if (!wsLog || !wsLogEmpty) {
        return;
    }
    if (wsLogEntries.length) {
        wsLog.style.display = "grid";
        wsLogEmpty.style.display = "none";
    } else {
        wsLog.style.display = "none";
        wsLogEmpty.style.display = "block";
    }
};

const addWsLogEntry = (payload, raw) => {
    if (!wsLog) {
        return;
    }
    const item = document.createElement("div");
    item.className = "log__item";
    const time = new Date().toLocaleTimeString("pl-PL");
    const text = payload?.key
        ? `${payload.key} | ${formatRoundedValue(getPointValue(payload), payload.unit)}`
        : String(raw || "Nieznane dane WebSocket.");
    item.innerHTML = `<div class="log__time">${time}</div><div>${text}</div>`;
    wsLog.prepend(item);
    wsLogEntries.unshift(item);
    if (wsLogEntries.length > 80) {
        const removed = wsLogEntries.pop();
        removed?.remove();
    }
    updateWsLogEmpty();
};

const clearWsLog = () => {
    wsLogEntries.forEach((item) => item.remove());
    wsLogEntries = [];
    updateWsLogEmpty();
};

const renderPage = () => {
    renderOverview();
    renderRegisterPicker();
    if (isDataPage && metricsGrid && metricsEmpty) {
        metricsGrid.innerHTML = "";
        metricsGrid.style.display = "none";
        metricsEmpty.style.display = "none";
    }
    if (isChartsPage) {
        renderChartCards();
    }
    if (isDiagnosticsPage) {
        renderTransformerErrors();
        updateWsLogEmpty();
    }
};

const loadTransformerErrors = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.request) {
        transformerErrors = [];
        renderTransformerErrors();
        return;
    }
    try {
        const data = await window.BT_API.request("GET", `/transformers/${transformer.id}/errors`);
        transformerErrors = Array.isArray(data) ? data : [];
        setErrorsHint(`Wybrany transformator: ${transformer.name}.`);
        renderTransformerErrors();
    } catch (error) {
        transformerErrors = [];
        setErrorsHint(error?.message || "Blad pobierania bledow transformatora.");
        renderTransformerErrors();
    }
};

const loadTransformers = async () => {
    if (!window.BT_API?.request) {
        setStatus("Brak konfiguracji API.", "result--error");
        return;
    }
    try {
        const data = await window.BT_API.request("GET", "/transformers");
        transformers = Array.isArray(data) ? data : [];
        if (selectedTransformerId && !transformers.find((item) => String(item.id) === String(selectedTransformerId))) {
            setSelectedTransformerId(null);
        }
        if (!getSelectedTransformerId() && transformers.length) {
            setSelectedTransformerId(transformers[0].id);
        }
        renderTransformerSelect();
        if (!transformers.length) {
            meters = [];
            registers = [];
            selectedRegisterKeys = new Set();
            metricsByKey = {};
            setStatus("Brak transformatorow. Dodaj je w konfiguracji.", "result--error");
            setHint("Dodaj transformator, aby uruchomic monitoring.");
            renderMeterSelect();
            renderPage();
            clearWs();
            return;
        }
        await loadTransformerErrors();
        await loadMeters();
    } catch (error) {
        setStatus(error?.message || "Blad pobierania transformatorow.", "result--error");
    }
};

const loadMeters = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.request) {
        meters = [];
        registers = [];
        renderMeterSelect();
        renderPage();
        return;
    }
    try {
        const data = await window.BT_API.request("GET", `/transformers/${transformer.id}/meters`);
        meters = Array.isArray(data) ? data : [];
        if (getSelectedMeterId() && !meters.find((item) => String(item.id) === String(getSelectedMeterId()))) {
            setSelectedMeterId(null);
        }
        if (!getSelectedMeterId() && meters.length) {
            setSelectedMeterId(meters[0].id);
        }
        renderMeterSelect();
        await loadRegisters();
        setHint(
            meters.length
                ? `Wybrany transformator: ${transformer.name}.`
                : `Wybrany transformator: ${transformer.name}. Brak miernikow.`
        );
    } catch (error) {
        setStatus(error?.message || "Blad pobierania miernikow.", "result--error");
    }
};

const loadRegisters = async () => {
    let meter = getSelectedMeter();
    if (!meter && meterSelect?.value) {
        meter = meters.find((item) => String(item.id) === String(meterSelect.value)) || null;
        if (meter) {
            setSelectedMeterId(meter.id);
        }
    }
    if (!meter || !window.BT_API?.request) {
        registers = [];
        selectedRegisterKeys = new Set();
        metricsByKey = {};
        renderPage();
        return;
    }
    try {
        const data = await window.BT_API.request("GET", `/meters/${meter.id}/registers`);
        registers = Array.isArray(data) ? data : [];
        buildRegisterKeyAliases();
        const available = new Set(registers.map((register) => getRegisterKey(register)));
        selectedRegisterKeys = new Set(Array.from(selectedRegisterKeys).filter((key) => available.has(key)));
        autoSelectRegisters();
        metricsByKey = {};
        renderPage();
        if (selectedRegisterKeys.size) {
            await loadMetricsForSelected();
        }
        const transformer = getSelectedTransformer();
        if (transformer) {
            setHint(`Transformator: ${transformer.name}. Miernik: ${meter.name}.`);
        }
    } catch (error) {
        setStatus(error?.message || "Blad pobierania rejestrow.", "result--error");
    }
};

const loadMetricsForSelected = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.request) {
        setStatus("Najpierw wybierz transformator.", "result--error");
        return;
    }
    if (!selectedRegisterKeys.size) {
        setStatus("Zaznacz rejestry do podgladu.", "result--error");
        renderPage();
        return;
    }
    setStatus("Pobieram dane...", null);
    const limit = getMetricLimit();
    const entries = Array.from(selectedRegisterKeys);

    await Promise.all(
        entries.map(async (key) => {
            try {
                const points = await window.BT_API.request(
                    "GET",
                    `/transformers/${transformer.id}/metrics?key=${encodeURIComponent(key)}&limit=${limit}&order=desc`
                );
                metricsByKey[key] = Array.isArray(points)
                    ? points.map((point) => ({
                        ...point,
                        _receivedAt: point?._receivedAt || point?.bucketTs || new Date().toISOString()
                    }))
                    : [];
            } catch (error) {
                metricsByKey[key] = [];
            }
        })
    );

    renderPage();
    setStatus(`Dane zaktualizowane. Widoczne rejestry: ${entries.length}.`, "result--success");
};

const handleWsMessage = (data) => {
    if (!data) {
        return;
    }
    let payload = null;
    try {
        payload = typeof data === "string" ? JSON.parse(data) : data;
    } catch (error) {
        addWsLogEntry(null, data);
        return;
    }
    addWsLogEntry(payload, data);
    const normalizedPayload = {
        ...payload,
        _receivedAt: new Date().toISOString()
    };
    const resolvedKey = resolveMetricKey(payload);
    if (!resolvedKey || !selectedRegisterKeys.has(String(resolvedKey))) {
        return;
    }
    const current = metricsByKey[resolvedKey] || [];
    metricsByKey[resolvedKey] = [normalizedPayload, ...current].slice(0, getMetricLimit());
    renderPage();
};

const connectWs = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.buildWsUrl) {
        return;
    }
    if (ws) {
        ws.close();
    }
    setWsStatus("WebSocket: laczenie...", "warning");
    if (window.BT_API.refreshAccessToken) {
        await window.BT_API.refreshAccessToken();
    }
    const token = window.BT_API.getAccessToken ? window.BT_API.getAccessToken() : null;
    if (!token) {
        setWsStatus("WebSocket: brak tokenu", "warning");
        return;
    }
    const url = window.BT_API.buildWsUrl(
        `/ws/transformers/${transformer.id}/metrics?token=${encodeURIComponent(token)}`
    );
    ws = new WebSocket(url);
    ws.onopen = () => setWsStatus("WebSocket: online", "online");
    ws.onclose = () => setWsStatus("WebSocket: offline", "offline");
    ws.onerror = () => setWsStatus("WebSocket: blad", "warning");
    ws.onmessage = (event) => handleWsMessage(event.data);
};

const clearWs = () => {
    if (ws) {
        ws.close();
        ws = null;
    }
    setWsStatus("WebSocket: offline", "offline");
};

if (transformerSelect) {
    transformerSelect.addEventListener("change", async () => {
        setSelectedTransformerId(transformerSelect.value || null);
        setSelectedMeterId(null);
        registers = [];
        selectedRegisterKeys = new Set();
        metricsByKey = {};
        clearWs();
        clearWsLog();
        await loadTransformerErrors();
        await loadMeters();
        connectWs();
    });
}

if (meterSelect) {
    meterSelect.addEventListener("change", async () => {
        setSelectedMeterId(meterSelect.value || null);
        registers = [];
        selectedRegisterKeys = new Set();
        metricsByKey = {};
        await loadRegisters();
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadTransformers());
}

if (loadBtn) {
    loadBtn.addEventListener("click", () => loadMetricsForSelected());
}

if (errorsRefreshBtn) {
    errorsRefreshBtn.addEventListener("click", () => loadTransformerErrors());
}

if (limitInput) {
    limitInput.addEventListener("change", () => {
        limitInput.value = String(getMetricLimit());
        if (selectedRegisterKeys.size) {
            scheduleMetricsReload();
        }
    });
}

if (registerSelectAll) {
    registerSelectAll.addEventListener("click", () => {
        selectedRegisterKeys = new Set(registers.map((register) => getRegisterKey(register)));
        pruneMetricsStore();
        renderPage();
        loadMetricsForSelected();
    });
}

if (registerClear) {
    registerClear.addEventListener("click", () => {
        autoSelectRegisters();
        pruneMetricsStore();
        renderPage();
    });
}

window.addEventListener("resize", () => {
    if (!isChartsPage) {
        return;
    }
    document.querySelectorAll(".metric-card__chart canvas").forEach((canvas, index) => {
        const key = canvas.closest(".metric-card")?.querySelector(".metric-card__title")?.textContent;
        if (!key) {
            return;
        }
        drawMiniChart(canvas, getMetricSeries(key), colorPalette[index % colorPalette.length]);
    });
});

window.addEventListener("beforeunload", () => {
    if (ws) {
        ws.close();
    }
});

setWsStatus("WebSocket: offline", "offline");
setStatus("Wybierz transformator i miernik.", null);
renderPage();
loadTransformers().then(() => connectWs());
updateWsLogEmpty();

