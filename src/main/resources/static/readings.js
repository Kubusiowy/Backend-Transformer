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
let wsGeneration = 0;
let wsRetryTimer = null;
let wsAttempts = 0;
let pageLeaving = false;
let metricLoadGeneration = 0;

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
    const formatted = Number.isFinite(numberValue)
        ? numberValue.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        : String(value);
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
    const exactValue = point?.lastValue == null ? NaN : Number(point.lastValue);
    if (Number.isFinite(exactValue)) {
        return exactValue;
    }
    const fallback = point?.avgValue ?? point?.maxValue;
    const fallbackValue = fallback == null ? NaN : Number(fallback);
    return Number.isFinite(fallbackValue) ? fallbackValue : null;
};

const getMetricSeries = (key) =>
    (metricsByKey[key] || []).filter((point) =>
        Number.isFinite(getPointValue(point))
    );

const getLatestMetric = (key) => getMetricSeries(key)[0] || null;
const getMetricTimestamp = (point) => point?.timestamp || point?.bucketTs || point?._receivedAt || null;

const normalizeMetricPoint = point => isChartsPage && point.sampleId ? {
    ...point, minValue: point.lastValue, maxValue: point.lastValue, avgValue: point.lastValue, count: 1
} : point;

const mergeMetricPoints = (history, incoming) => {
    const points = new Map();
    for (const source of [...history, ...incoming]) {
        const point = normalizeMetricPoint(source);
        const id = isChartsPage && point.sampleId ? point.sampleId : point.bucketTs;
        const previous = points.get(id);
        if (!previous || Number(previous.count) <= Number(point.count)) points.set(id, point);
    }
    const sampledBuckets = new Set(isChartsPage
        ? Array.from(points.values()).filter(point => point.sampleId).map(point => point.bucketTs) : []);
    return Array.from(points.values())
        .filter(point => point.sampleId || !sampledBuckets.has(point.bucketTs))
        .sort((a, b) => Date.parse(getMetricTimestamp(b)) - Date.parse(getMetricTimestamp(a)) ||
            Number(b.sampleId?.split("#").pop() || 0) - Number(a.sampleId?.split("#").pop() || 0))
        .slice(0, isChartsPage ? undefined : getMetricLimit());
};
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
        if (!isChartsPage) metricsByKey[key] = (metricsByKey[key] || []).slice(0, getMetricLimit());
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
            label: "Aktywne pomiary",
            value: String(selectedRegisterKeys.size),
            meta: selectedRegisterKeys.size ? "Zaznaczone do podglądu" : "Nic nie wybrano"
        },
        {
            label: "Ostatni odczyt",
            value: latestPoints.length ? formatShortTimestamp(latestPoints[0].bucketTs) : "Brak",
            meta: latestPoints.length ? "Ostatnia aktualizacja danych" : "Czekam na próbki"
        },
        {
            label: isChartsPage ? "Zakres historii" : "Limit historii",
            value: isChartsPage ? "Od początku" : String(getMetricLimit()),
            meta: isChartsPage ? "Wszystkie zapisane odczyty" : "Punktów na rejestr"
        }
    ];

    cards.forEach((item) => {
        const card = document.createElement("div");
        card.className = "overview-card";
        card.innerHTML = window.BT_HTML`
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
        transformerSelect.innerHTML = '<option value="">Brak transformatorów</option>';
        transformerSelect.disabled = true;
        return;
    }
    transformerSelect.disabled = false;
    transformers.forEach((transformer) => {
        const option = document.createElement("option");
        option.value = String(transformer.id);
        option.textContent = transformer.location ? `${transformer.name} · ${transformer.location}` : transformer.name;
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
        meterSelect.innerHTML = '<option value="">Brak mierników</option>';
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
            ? "Brak pomiarów dla wybranego miernika."
            : "Wybierz miernik, aby zobaczyć pomiary.";
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
        checkbox.checked = selectedRegisterKeys.has(key);
        checkbox.value = key;
        checkbox.setAttribute("aria-label", register.name || key);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) selectedRegisterKeys.add(key);
            else selectedRegisterKeys.delete(key);
            card.dataset.selected = String(checkbox.checked);
            pruneMetricsStore();
            scheduleMetricsReload();
        });

        const info = document.createElement("div");
        info.className = "register-card__content";
        info.innerHTML = window.BT_HTML`
            <div class="register-card__top">
                <div>
                    <div class="register-card__name">${register.name || "Pomiar"}</div>
                    <div class="register-card__meta">${register.enabled === false ? "Wyłączony" : ""}</div>
                </div>
            </div>
        `;

        const summary = document.createElement("div");
        summary.className = "register-card__summary";
        summary.innerHTML = window.BT_HTML`
            <div class="register-card__value">${formatValue(getPointValue(latest), register.unit)}</div>
            <div class="register-card__summary-time">${formatShortTimestamp(getMetricTimestamp(latest))}</div>
        `;

        info.append(summary);
        card.append(checkbox, info);
        registerCardGrid.append(card);
    });
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
        header.innerHTML = window.BT_HTML`
            <div class="metric-card__title">${register.name || key}</div>
            <div class="metric-card__subtitle">${register.registerType || "Pomiar"} | ${register.unit || "bez jednostki"}</div>
        `;

        const hero = document.createElement("div");
        hero.className = "metric-card__hero";
        hero.innerHTML = window.BT_HTML`
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
        header.innerHTML = window.BT_HTML`
            <div class="metric-card__title">${register.name || key}</div>
            <div class="metric-card__subtitle">${register.registerType || "Pomiar"} | adres ${register.address ?? "-"}</div>
        `;

        const chartPoints = window.BTCharts.prepare(points);
        const values = chartPoints.flatMap(point => [point.min, point.max]);
        const hero = document.createElement("div");
        hero.className = "metric-card__hero";
        hero.innerHTML = window.BT_HTML`
            <div class="metric-card__hero-label">Ostatnia wartość</div>
            <div class="metric-card__hero-value">${formatValue(getPointValue(latest), register.unit)}</div>
        `;
        const stats = document.createElement("div");
        stats.className = "metric-card__stats";
        [
            ["Minimum", values.length ? formatValue(values.reduce((min, value) => Math.min(min, value), Infinity), register.unit) : "(brak)"],
            ["Maksimum", values.length ? formatValue(values.reduce((max, value) => Math.max(max, value), -Infinity), register.unit) : "(brak)"],
            ["Ostatni pomiar", formatShortTimestamp(getMetricTimestamp(latest))]
        ].forEach(([label, value]) => stats.append(createStatRow(label, value)));

        const chartWrap = document.createElement("div");
        chartWrap.className = "metric-card__chart";
        const chartMeta = document.createElement("div");
        chartMeta.className = "metric-card__chart-meta";
        const duration = chartPoints.length ? chartPoints[chartPoints.length - 1].time - chartPoints[0].time : 0;
        const seconds = Math.floor(duration / 1000);
        const elapsed = seconds >= 3600 ? `${Math.floor(seconds / 3600)} godz. ${Math.floor(seconds % 3600 / 60)} min`
            : seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : `${seconds} s`;
        chartMeta.textContent = chartPoints.length
            ? `${formatTimestamp(chartPoints[0].time)} – ${formatTimestamp(chartPoints[chartPoints.length - 1].time)} · Czas: ${elapsed} · Pomiary: ${chartPoints.length}`
            : "Brak pomiarów";
        const canvas = document.createElement("canvas");
        canvas.dataset.metricKey = key;
        canvas.dataset.unit = register.unit || "";
        canvas.dataset.name = register.name || key;
        canvas.dataset.color = colorPalette[index % colorPalette.length];
        const readout = document.createElement("div");
        readout.className = "metric-card__chart-readout";
        readout.id = `chart-readout-${index}`;
        readout.setAttribute("aria-live", "polite");
        canvas.setAttribute("aria-describedby", readout.id);
        const legend = document.createElement("div");
        legend.className = "metric-card__chart-legend";
        legend.innerHTML = window.BT_HTML`
            <span class="metric-card__legend-item"><i style="--legend-color:${canvas.dataset.color}"></i>Wartość pomiaru</span>
            <span>Oś pozioma: czas · Oś pionowa: ${register.unit || "wartość"}</span>
        `;
        const hint = document.createElement("p");
        hint.className = "metric-card__chart-hint";
        hint.textContent = !chartPoints.length ? "Brak historii dla tego pomiaru."
            : chartPoints.length === 1
            ? "Dostępny jest jeden punkt. Linia pojawi się po odebraniu kolejnego pomiaru."
            : "Wskaż punkt lub użyj strzałek, aby sprawdzić odczyt.";
        if (points.some(point => !point.sampleId)) hint.textContent += " Starsze dane: ostatnia wartość w minucie, cieniowanie min–maks.";
        chartWrap.append(chartMeta, canvas, readout, legend, hint);
        canvas.setAttribute("role", "img");
        card.append(header, hero, stats, chartWrap);
        metricsGrid.append(card);
        window.BTCharts.render(canvas, points, canvas.dataset);
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
        errorsEmpty.textContent = "Wybierz transformator, aby zobaczyć diagnostykę.";
        return;
    }
    if (!transformerErrors.length) {
        errorsEmpty.style.display = "block";
        errorsList.style.display = "none";
        errorsEmpty.textContent = "Brak błędów.";
        return;
    }
    errorsEmpty.style.display = "none";
    errorsList.style.display = "grid";

    transformerErrors.forEach((error) => {
        const item = document.createElement("div");
        item.className = "list__item";
        item.innerHTML = window.BT_HTML`
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
        : String(raw || "Nieznany komunikat.");
    item.innerHTML = window.BT_HTML`<div class="log__time">${time}</div><div>${text}</div>`;
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
        if (String(getSelectedTransformerId()) !== String(transformer.id)) return;
        transformerErrors = Array.isArray(data) ? data : [];
        setErrorsHint(`Wybrany transformator: ${transformer.name}.`);
        renderTransformerErrors();
    } catch (error) {
        transformerErrors = [];
        setErrorsHint(error?.message || "Błąd pobierania błędów transformatora.");
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
            setStatus("", null);
            setHint("Dodaj transformator, aby uruchomić monitoring.");
            renderMeterSelect();
            renderPage();
            clearWs();
            return;
        }
        await loadTransformerErrors();
        await loadMeters();
    } catch (error) {
        setStatus(error?.message || "Błąd pobierania transformatorów.", "result--error");
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
        if (String(getSelectedTransformerId()) !== String(transformer.id)) return;
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
                ? ""
                : "Dodaj miernik w konfiguracji instalacji."
        );
    } catch (error) {
        setStatus(error?.message || "Błąd pobierania mierników.", "result--error");
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
        if (String(getSelectedMeterId()) !== String(meter.id)) return;
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
            setHint("");
        }
    } catch (error) {
        setStatus(error?.message || "Błąd pobierania pomiarów.", "result--error");
    }
};

const fetchMetricHistory = async (transformerId, key, isCurrent) => {
    const limit = isChartsPage ? 1000 : getMetricLimit();
    const base = `/transformers/${transformerId}/metrics?key=${encodeURIComponent(key)}&limit=${limit}&order=desc${isChartsPage ? "&resolution=samples" : ""}`;
    const history = [];
    let cursor = "";
    while (isCurrent()) {
        const points = await window.BT_API.request("GET", base + cursor);
        if (!isCurrent()) return [];
        if (!Array.isArray(points)) throw new Error("Nieprawidłowa odpowiedź historii pomiarów.");
        for (const point of points) history.push(point);
        if (!isChartsPage || points.length < limit) break;
        const oldest = points[points.length - 1];
        const next = `&before=${encodeURIComponent(getMetricTimestamp(oldest))}&beforeSequence=${Number(oldest.sampleId?.split("#").pop() || 0)}`;
        if (next === cursor) throw new Error("Nie udało się pobrać starszych odczytów.");
        cursor = next;
    }
    return history;
};

const loadMetricsForSelected = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.request) {
        setStatus("Najpierw wybierz transformator.", "result--error");
        return;
    }
    if (!selectedRegisterKeys.size) {
        setStatus("Zaznacz pomiary do podglądu.", "result--error");
        renderPage();
        return;
    }
    setStatus("Pobieram dane...", null);
    const loadGeneration = ++metricLoadGeneration;
    const meterId = getSelectedMeterId();
    let failures = 0;
    const isCurrent = () => loadGeneration === metricLoadGeneration && String(getSelectedTransformerId()) === String(transformer.id) && getSelectedMeterId() === meterId;
    const entries = Array.from(selectedRegisterKeys);

    await Promise.all(
        entries.map(async (key) => {
            try {
                const points = await fetchMetricHistory(transformer.id, key,
                    () => isCurrent() && selectedRegisterKeys.has(key));
                if (!isCurrent() || !selectedRegisterKeys.has(key)) return;
                const livePoints = (metricsByKey[key] || []).filter(point => point._live);
                const history = Array.isArray(points)
                    ? points.map((point) => ({
                        ...point,
                        _receivedAt: point?._receivedAt || point?.bucketTs || new Date().toISOString()
                    }))
                    : [];
                metricsByKey[key] = mergeMetricPoints(history, livePoints);
            } catch (error) {
                failures++;
            }
        })
    );

    if (!isCurrent()) return;
    renderPage();
    setStatus(failures ? `Nie udało się pobrać danych dla ${failures} pomiarów. Spróbuj ponownie.` : "", failures ? "result--error" : "result--success");
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
    if (payload?.type === "ready") {
        wsAttempts = 0;
        setWsStatus("Połączenie aktywne", "online");
        loadMetricsForSelected();
        return;
    }
    if (payload?.type === "error") {
        setStatus(payload.message || "Błąd danych pomiarowych.", "result--error");
        return;
    }
    if (!payload || typeof payload !== "object" || !payload.key || !payload.bucketTs ||
        String(payload.transformerId) !== String(getSelectedTransformerId())) return;
    addWsLogEntry(payload, data);
    window.BTData?.setLastRead(new Date(getMetricTimestamp(payload)).toLocaleString("pl-PL"));
    const normalizedPayload = {
        ...payload,
        _receivedAt: new Date().toISOString(),
        _live: true
    };
    const resolvedKey = resolveMetricKey(payload);
    if (!resolvedKey || !selectedRegisterKeys.has(String(resolvedKey))) {
        return;
    }
    const current = metricsByKey[resolvedKey] || [];
    metricsByKey[resolvedKey] = mergeMetricPoints(current, [normalizedPayload]);
    renderPage();
};

const clearWs = () => {
    wsGeneration++;
    clearTimeout(wsRetryTimer);
    wsRetryTimer = null;
    if (ws) {
        ws.onclose = null;
        ws.onmessage = null;
        ws.close();
        ws = null;
    }
    setWsStatus("Połączenie nieaktywne", "offline");
};

const connectWs = async () => {
    clearWs();
    const generation = wsGeneration;
    const transformer = getSelectedTransformer();
    if (!transformer || pageLeaving || !window.BT_API?.buildWsUrl) return;
    const retry = () => {
        if (generation !== wsGeneration || pageLeaving) return;
        setWsStatus("Brak połączenia · ponawianie", "warning");
        const delay = Math.min(30000, 1000 * 2 ** Math.min(wsAttempts++, 5)) + Math.random() * 500;
        wsRetryTimer = setTimeout(connectWs, delay);
    };
    setWsStatus("Łączenie…", "warning");
    try {
        const token = await window.BT_API.refreshAccessToken();
        if (generation !== wsGeneration || pageLeaving) return;
        if (!token) {
            setWsStatus("Sesja wygasła", "warning");
            return;
        }
        const socket = new WebSocket(window.BT_API.buildWsUrl(`/ws/transformers/${transformer.id}/metrics`));
        ws = socket;
        socket.onopen = () => {
            if (generation !== wsGeneration) { socket.close(); return; }
            socket.send(JSON.stringify({ type: "auth", token }));
        };
        socket.onmessage = event => {
            if (generation === wsGeneration) handleWsMessage(event.data);
        };
        socket.onclose = event => {
            if (generation !== wsGeneration) return;
            ws = null;
            if (event.code === 1003 || (event.code === 1008 && !event.reason.includes("expired"))) {
                setWsStatus("Brak dostępu do transformatora", "warning");
                return;
            }
            retry();
        };
        socket.onerror = () => {
            if (generation === wsGeneration) setWsStatus("Błąd połączenia", "warning");
        };
    } catch { retry(); }
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
    refreshBtn.addEventListener("click", async () => { clearWs(); await loadTransformers(); connectWs(); });
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
        selectedRegisterKeys.clear();
        pruneMetricsStore();
        renderPage();
    });
}

window.addEventListener("resize", () => {
    if (!isChartsPage) {
        return;
    }
    document.querySelectorAll(".metric-card__chart canvas").forEach((canvas) => {
        const key = canvas.dataset.metricKey;
        if (!key) {
            return;
        }
        window.BTCharts.render(canvas, getMetricSeries(key), canvas.dataset);
    });
});

window.addEventListener("pagehide", () => { pageLeaving = true; clearWs(); clearTimeout(autoLoadTimer); });
window.addEventListener("pageshow", event => { if (event.persisted) { pageLeaving = false; connectWs(); } });
window.addEventListener("online", () => { if (!ws) { wsAttempts = 0; connectWs(); } });
window.addEventListener("bt-theme-change", renderPage);

setWsStatus("Połączenie nieaktywne", "offline");
setStatus("Wybierz transformator i miernik.", null);
renderPage();
loadTransformers().then(() => connectWs());
updateWsLogEmpty();

