const transformerSelect = document.getElementById("readingsTransformerSelect");
const meterSelect = document.getElementById("readingsMeterSelect");
const limitInput = document.getElementById("readingsLimit");
const loadBtn = document.getElementById("readingsLoad");
const refreshBtn = document.getElementById("readingsRefresh");
const selectionHint = document.getElementById("readingsSelectionHint");
const statusBox = document.getElementById("readingsStatus");
const statusBody = document.getElementById("readingsStatusBody");
const wsStatus = document.getElementById("readingsWsStatus");
const errorsList = document.getElementById("transformerErrorsList");
const errorsEmpty = document.getElementById("transformerErrorsEmpty");
const errorsHint = document.getElementById("transformerErrorsHint");
const errorsRefreshBtn = document.getElementById("transformerErrorsRefresh");

const registerTableBody = document.getElementById("registerTableBody");
const registerTableWrap = document.getElementById("registerTableWrap");
const registerPickerEmpty = document.getElementById("registerPickerEmpty");
const registerSelectAll = document.getElementById("registerSelectAll");
const registerClear = document.getElementById("registerClear");

const metricsGrid = document.getElementById("registerMetricsGrid");
const metricsEmpty = document.getElementById("registerMetricsEmpty");
const combinedChart = document.getElementById("combinedChart");
const combinedLegend = document.getElementById("combinedLegend");
const combineChartsToggle = document.getElementById("combineCharts");

let transformers = [];
let meters = [];
let registers = [];
let metricKeys = [];
let selectedRegisterKeys = new Set();
let metricsByKey = {};
let ws = null;
let transformerErrors = [];

let selectedTransformerId = window.BTData ? window.BTData.getSelectedId() : null;
let selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;

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

const setHint = (message) => {
    if (selectionHint) {
        selectionHint.textContent = message;
    }
};

const setWsStatus = (message) => {
    if (wsStatus) {
        wsStatus.textContent = message;
    }
};

const setErrorsHint = (message) => {
    if (errorsHint) {
        errorsHint.textContent = message;
    }
};

const formatValue = (value, unit) => {
    if (value === null || value === undefined) {
        return "(brak)";
    }
    const formatted = typeof value === "number" ? value.toFixed(2) : String(value);
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
        const normalizedTransformer = transformerId ? String(transformerId) : null;
        const normalizedMeter = meterId ? String(meterId) : null;
        window.BTData.setSelectedMeterInfo(normalizedTransformer, normalizedMeter);
    }
    selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;
};

const getSelectedTransformer = () => {
    const id = getSelectedTransformerId();
    return transformers.find((t) => String(t.id) === String(id)) || null;
};

const getSelectedMeter = () => {
    const meterId = getSelectedMeterId() || (meterSelect?.value ? String(meterSelect.value) : null);
    return meters.find((m) => String(m.id) === String(meterId)) || null;
};

const getMetricLimit = () => {
    const value = Number(limitInput?.value || 120);
    if (!value || value < 10) {
        return 120;
    }
    return Math.min(value, 5000);
};

const getRegisterKey = (register) => {
    const name = (register?.name || "").trim();
    if (name) {
        return name;
    }
    const address = register?.address ?? "unknown";
    return `reg-${address}`;
};

const resetMetrics = () => {
    metricsByKey = {};
    selectedRegisterKeys = new Set();
    renderMetricsGrid();
};

const renderTransformerSelect = () => {
    if (!transformerSelect) {
        return;
    }
    transformerSelect.innerHTML = "";
    if (!transformers.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Brak transformatorow";
        transformerSelect.append(option);
        transformerSelect.disabled = true;
        setHint("Nie masz transformatorow. Dodaj je w zakladce Transformatory.");
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
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Brak miernikow";
        meterSelect.append(option);
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
    const selectedId = getSelectedMeterId() || (meterSelect.value ? String(meterSelect.value) : null);
    if (selectedId && meters.find((m) => String(m.id) === String(selectedId))) {
        meterSelect.value = selectedId;
        if (!getSelectedMeterId()) {
            setSelectedMeterId(selectedId);
        }
    } else if (meters.length) {
        meterSelect.value = String(meters[0].id);
        setSelectedMeterId(meters[0].id);
    }
};

const renderRegisterPicker = () => {
    if (!registerTableBody || !registerPickerEmpty || !registerTableWrap) {
        return;
    }
    registerTableBody.innerHTML = "";
    if (!registers.length) {
        const meter = getSelectedMeter();
        registerPickerEmpty.textContent = meter
            ? "Brak rejestrow dla wybranego miernika."
            : "Wybierz miernik, aby zobaczyc rejestry.";
        registerPickerEmpty.style.display = "block";
        registerTableWrap.style.display = "none";
        if (registerSelectAll) {
            registerSelectAll.disabled = true;
            registerSelectAll.classList.add("btn--disabled");
        }
        if (registerClear) {
            registerClear.disabled = true;
            registerClear.classList.add("btn--disabled");
        }
        return;
    }
    registerPickerEmpty.style.display = "none";
    registerTableWrap.style.display = "block";
    if (registerSelectAll) {
        registerSelectAll.disabled = false;
        registerSelectAll.classList.remove("btn--disabled");
    }
    if (registerClear) {
        registerClear.disabled = false;
        registerClear.classList.remove("btn--disabled");
    }

    registers.forEach((register) => {
        const key = getRegisterKey(register);
        const row = document.createElement("tr");

        const selectCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = key;
        checkbox.checked = selectedRegisterKeys.has(key);
        selectCell.append(checkbox);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedRegisterKeys.add(key);
            } else {
                selectedRegisterKeys.delete(key);
            }
            renderMetricsGrid();
            if (selectedRegisterKeys.size) {
                loadMetricsForSelected();
            }
        });

        const cells = [
            register.name,
            register.registerType,
            register.address,
            register.length,
            register.dataType,
            register.scale,
            register.unit || "-",
            register.enabled ? "Aktywny" : "Wylaczony"
        ];
        row.append(selectCell);
        cells.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });

        row.addEventListener("click", (event) => {
            if (event.target === checkbox) {
                return;
            }
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change"));
        });

        registerTableBody.append(row);
    });
};

const renderMetricsGrid = () => {
    if (!metricsGrid || !metricsEmpty) {
        return;
    }
    metricsGrid.innerHTML = "";
    if (!selectedRegisterKeys.size) {
        metricsEmpty.style.display = "block";
        metricsGrid.style.display = "none";
        renderCombinedChart();
        return;
    }
    metricsEmpty.style.display = "none";
    metricsGrid.style.display = "grid";

    selectedRegisterKeys.forEach((key) => {
        const points = metricsByKey[key] || [];
        const latest = points[0] || null;

        const card = document.createElement("div");
        card.className = "metric-card";

        const header = document.createElement("div");
        header.className = "metric-card__header";
        const title = document.createElement("div");
        title.className = "metric-card__title";
        title.textContent = key;
        const subtitle = document.createElement("div");
        subtitle.className = "metric-card__subtitle";
        const register = registers.find((item) => getRegisterKey(item) === key);
        const meta = register
            ? `${register.registerType} | adres ${register.address} | ${register.dataType}`
            : latest?.label || "Brak etykiety";
        subtitle.textContent = meta;
        header.append(title, subtitle);

        const stats = document.createElement("div");
        stats.className = "metric-card__stats";
        const statRows = [
            ["Srednia", formatValue(latest?.avgValue, latest?.unit)],
            ["Min", formatValue(latest?.minValue, latest?.unit)],
            ["Max", formatValue(latest?.maxValue, latest?.unit)],
            ["Bucket", latest?.bucketTs || "(brak)"]
        ];
        statRows.forEach(([label, value]) => {
            const row = document.createElement("div");
            row.className = "metric-card__stat";
            const labelEl = document.createElement("span");
            labelEl.textContent = label;
            const valueEl = document.createElement("strong");
            valueEl.textContent = value;
            row.append(labelEl, valueEl);
            stats.append(row);
        });

        const chartWrap = document.createElement("div");
        chartWrap.className = "metric-card__chart";
        const chartCanvas = document.createElement("canvas");
        chartCanvas.width = 360;
        chartCanvas.height = 140;
        chartWrap.append(chartCanvas);
        drawMiniChart(chartCanvas, points);

        const tableWrap = document.createElement("div");
        tableWrap.className = "metric-card__table";
        if (!points.length) {
            const empty = document.createElement("div");
            empty.className = "empty";
            empty.textContent = "Brak danych dla tego rejestru.";
            tableWrap.append(empty);
        } else {
            const table = document.createElement("table");
            table.className = "table";
            const thead = document.createElement("thead");
            thead.innerHTML = "<tr><th>Bucket</th><th>Srednia</th><th>Min</th><th>Max</th></tr>";
            const tbody = document.createElement("tbody");
            points.slice(0, 10).forEach((point) => {
                const row = document.createElement("tr");
                const cells = [
                    point.bucketTs,
                    formatValue(point.avgValue, point.unit),
                    formatValue(point.minValue, point.unit),
                    formatValue(point.maxValue, point.unit)
                ];
                cells.forEach((value) => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "";
                    row.append(cell);
                });
                tbody.append(row);
            });
            table.append(thead, tbody);
            tableWrap.append(table);
        }

        card.append(header, stats, chartWrap, tableWrap);
        metricsGrid.append(card);
    });

    renderCombinedChart();
};

const renderTransformerErrors = () => {
    if (!errorsList || !errorsEmpty) {
        return;
    }
    errorsList.innerHTML = "";
    const transformer = getSelectedTransformer();
    if (!transformer) {
        errorsEmpty.textContent = "Wybierz transformator, aby zobaczyc bledy.";
        errorsEmpty.style.display = "block";
        errorsList.style.display = "none";
        setErrorsHint("Wybierz transformator, aby zobaczyc bledy.");
        return;
    }
    if (!transformerErrors.length) {
        errorsEmpty.textContent = "Brak bledow.";
        errorsEmpty.style.display = "block";
        errorsList.style.display = "none";
        return;
    }
    errorsEmpty.style.display = "none";
    errorsList.style.display = "grid";

    transformerErrors.forEach((error) => {
        const item = document.createElement("div");
        item.className = "list__item";

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = `${error.code}: ${error.message}`;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        meta.textContent = `Zgloszono: ${formatTimestamp(error.createdAt)}`;

        const tags = document.createElement("div");
        tags.className = "list__tags";

        const statusTag = document.createElement("span");
        statusTag.className = getErrorStatusClass(error.status);
        statusTag.textContent = getErrorStatusLabel(error.status);
        tags.append(statusTag);

        main.append(name, meta, tags);
        item.append(main);
        errorsList.append(item);
    });
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
        renderTransformerErrors();
        setErrorsHint(error?.message || "Blad pobierania bledow transformatora.");
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
        if (selectedTransformerId && !transformers.find((t) => t.id === selectedTransformerId)) {
            setSelectedTransformerId(null);
        }
        if (!getSelectedTransformerId() && transformers.length) {
            setSelectedTransformerId(transformers[0].id);
        }
        renderTransformerSelect();
        if (!transformers.length) {
            setStatus("Brak transformatorow. Dodaj je w zakladce Transformatory.", "result--error");
            setHint("Dodaj transformator, aby wyswietlic odczyty.");
            clearWs();
            meters = [];
            registers = [];
            transformerErrors = [];
            renderMeterSelect();
            renderRegisterPicker();
            resetMetrics();
            renderTransformerErrors();
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
        renderMeterSelect();
        registers = [];
        renderRegisterPicker();
        resetMetrics();
        setHint("Wybierz transformator, aby zobaczyc mierniki.");
        return;
    }
    try {
        const data = await window.BT_API.request("GET", `/transformers/${transformer.id}/meters`);
        meters = Array.isArray(data) ? data : [];
        if (getSelectedMeterId() && !meters.find((m) => String(m.id) === String(getSelectedMeterId()))) {
            setSelectedMeterId(null);
        }
        if (!getSelectedMeterId() && meters.length) {
            setSelectedMeterId(meters[0].id);
        }
        renderMeterSelect();
        await loadRegisters();
        if (!meters.length) {
            setHint(`Wybrany transformator: ${transformer.name}. Brak miernikow.`);
        } else {
            setHint(`Wybrany transformator: ${transformer.name}.`);
        }
    } catch (error) {
        setStatus(error?.message || "Blad pobierania miernikow.", "result--error");
    }
};

const loadRegisters = async () => {
    let meter = getSelectedMeter();
    if (!meter && meterSelect?.value) {
        const fallback = meters.find((m) => String(m.id) === String(meterSelect.value));
        if (fallback) {
            setSelectedMeterId(fallback.id);
            meter = fallback;
        }
    }
    if (!meter || !window.BT_API?.request) {
        registers = [];
        renderRegisterPicker();
        resetMetrics();
        const transformer = getSelectedTransformer();
        if (transformer) {
            setHint(`Wybrany transformator: ${transformer.name}. Wybierz miernik, aby zobaczyc rejestry.`);
        }
        return;
    }
    try {
        const data = await window.BT_API.request("GET", `/meters/${meter.id}/registers`);
        registers = Array.isArray(data) ? data : [];
        await loadMetricKeys();
        const available = new Set(registers.map((register) => getRegisterKey(register)));
        selectedRegisterKeys = new Set(
            Array.from(selectedRegisterKeys).filter((key) => available.has(key))
        );
        metricsByKey = {};
        renderRegisterPicker();
        renderMetricsGrid();
        if (selectedRegisterKeys.size) {
            loadMetricsForSelected();
        }
        const transformer = getSelectedTransformer();
        if (transformer) {
            setHint(`Wybrany transformator: ${transformer.name}. Miernik: ${meter.name}.`);
        }
    } catch (error) {
        setStatus(error?.message || "Blad pobierania rejestrow.", "result--error");
    }
};

const loadMetricKeys = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.request) {
        metricKeys = [];
        return;
    }
    try {
        const keys = await window.BT_API.request("GET", `/transformers/${transformer.id}/metrics/keys`);
        metricKeys = Array.isArray(keys) ? keys : [];
    } catch (error) {
        metricKeys = [];
    }
};

const loadMetricsForSelected = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.request) {
        setStatus("Najpierw wybierz transformator.", "result--error");
        return;
    }
    if (!selectedRegisterKeys.size) {
        setStatus("Zaznacz rejestry do odczytu.", "result--error");
        renderMetricsGrid();
        return;
    }
    const limit = getMetricLimit();
    setStatus("Pobieram dane...", null);
    const entries = Array.from(selectedRegisterKeys.values());
    await Promise.all(
        entries.map(async (key) => {
            try {
                const points = await window.BT_API.request(
                    "GET",
                    `/transformers/${transformer.id}/metrics?key=${encodeURIComponent(key)}&limit=${limit}&order=desc`
                );
                metricsByKey[key] = Array.isArray(points) ? points : [];
            } catch (error) {
                metricsByKey[key] = [];
            }
        })
    );
    renderMetricsGrid();
    setStatus("Dane zaktualizowane.", "result--success");
};

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

const renderCombinedChart = () => {
    if (!combinedChart || !combinedLegend) {
        return;
    }
    if (combineChartsToggle && !combineChartsToggle.checked) {
        combinedChart.style.display = "none";
        combinedLegend.innerHTML = "";
        return;
    }
    combinedChart.style.display = "block";
    const ctx = combinedChart.getContext("2d");
    const width = combinedChart.parentElement ? combinedChart.parentElement.clientWidth : combinedChart.width;
    const height = combinedChart.height || 260;
    const ratio = window.devicePixelRatio || 1;
    combinedChart.width = Math.floor(width * ratio);
    combinedChart.height = Math.floor(height * ratio);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(15, 23, 42, 0.04)";
    ctx.fillRect(0, 0, width, height);

    const keys = Array.from(selectedRegisterKeys.values());
    const series = keys.map((key) => (metricsByKey[key] || []).slice().reverse());
    if (!series.length || series.every((points) => points.length === 0)) {
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.fillText("Brak danych do wykresu", 12, 20);
        combinedLegend.innerHTML = "";
        return;
    }

    const allValues = series.flatMap((points) =>
        points.map((point) => Number(point.avgValue ?? point.maxValue ?? 0))
    );
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);
    if (min === max) {
        min -= 1;
        max += 1;
    }

    const padding = 36;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    combinedLegend.innerHTML = "";

    series.forEach((points, index) => {
        const color = colorPalette[index % colorPalette.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((point, pointIndex) => {
            const value = Number(point.avgValue ?? point.maxValue ?? 0);
            const x = padding + (chartWidth * pointIndex) / Math.max(points.length - 1, 1);
            const y =
                height -
                padding -
                ((value - min) / (max - min)) * chartHeight;
            if (pointIndex === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        const legendItem = document.createElement("div");
        legendItem.className = "chart__legend-item";
        const swatch = document.createElement("span");
        swatch.className = "chart__swatch";
        swatch.style.background = color;
        const label = document.createElement("span");
        label.textContent = keys[index] || "Rejestr";
        legendItem.append(swatch, label);
        combinedLegend.append(legendItem);
    });
};

const drawMiniChart = (canvas, points) => {
    if (!canvas || !canvas.getContext) {
        return;
    }
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(15, 23, 42, 0.04)";
    ctx.fillRect(0, 0, width, height);

    if (!points.length) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        ctx.fillText("Brak danych", 10, 16);
        return;
    }

    const values = points.map((p) => Number(p.avgValue ?? p.maxValue ?? 0)).reverse();
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
        min -= 1;
        max += 1;
    }
    const padding = 18;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = "rgba(14, 165, 233, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((value, index) => {
        const x = padding + (chartWidth * index) / Math.max(values.length - 1, 1);
        const y =
            height -
            padding -
            ((value - min) / (max - min)) * chartHeight;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
};

const handleWsMessage = (data) => {
    if (!data) {
        return;
    }
    let payload = null;
    try {
        payload = typeof data === "string" ? JSON.parse(data) : data;
    } catch (error) {
        return;
    }
    if (!payload?.key || !selectedRegisterKeys.has(payload.key)) {
        return;
    }
    const current = metricsByKey[payload.key] || [];
    metricsByKey[payload.key] = [payload, ...current].slice(0, getMetricLimit());
    renderMetricsGrid();
};

const connectWs = async () => {
    const transformer = getSelectedTransformer();
    if (!transformer || !window.BT_API?.buildWsUrl) {
        return;
    }
    if (ws) {
        ws.close();
    }
    if (window.BT_API.refreshAccessToken) {
        await window.BT_API.refreshAccessToken();
    }
    const token = window.BT_API.getAccessToken ? window.BT_API.getAccessToken() : null;
    if (!token) {
        setWsStatus("WebSocket: brak tokenu");
        return;
    }
    const url = window.BT_API.buildWsUrl(
        `/ws/transformers/${transformer.id}/metrics?token=${encodeURIComponent(token)}`
    );
    ws = new WebSocket(url);
    ws.onopen = () => setWsStatus("WebSocket: online");
    ws.onclose = () => setWsStatus("WebSocket: offline");
    ws.onerror = () => setWsStatus("WebSocket: blad");
    ws.onmessage = (event) => handleWsMessage(event.data);
};

const clearWs = () => {
    if (ws) {
        ws.close();
        ws = null;
    }
    setWsStatus("WebSocket: offline");
};

if (transformerSelect) {
    transformerSelect.addEventListener("change", async () => {
        setSelectedTransformerId(transformerSelect.value || null);
        setSelectedMeterId(null);
        registers = [];
        selectedRegisterKeys = new Set();
        metricsByKey = {};
        renderTransformerSelect();
        renderMeterSelect();
        renderRegisterPicker();
        renderMetricsGrid();
        renderTransformerErrors();
        clearWs();
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
        renderRegisterPicker();
        renderMetricsGrid();
        await loadRegisters();
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadTransformers());
}

if (errorsRefreshBtn) {
    errorsRefreshBtn.addEventListener("click", () => loadTransformerErrors());
}

if (loadBtn) {
    loadBtn.addEventListener("click", () => loadMetricsForSelected());
}

if (registerSelectAll) {
    registerSelectAll.addEventListener("click", () => {
        selectedRegisterKeys = new Set(registers.map((register) => getRegisterKey(register)));
        renderRegisterPicker();
        renderMetricsGrid();
        loadMetricsForSelected();
    });
}

if (registerClear) {
    registerClear.addEventListener("click", () => {
        selectedRegisterKeys = new Set();
        renderRegisterPicker();
        renderMetricsGrid();
    });
}

if (combineChartsToggle) {
    combineChartsToggle.addEventListener("change", () => renderCombinedChart());
}

window.addEventListener("beforeunload", () => {
    if (ws) {
        ws.close();
    }
});

setWsStatus("WebSocket: offline");
setStatus("Wybierz transformator i miernik.", null);
loadTransformers().then(() => connectWs());
