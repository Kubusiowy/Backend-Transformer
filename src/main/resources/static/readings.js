const transformerSelect = document.getElementById("readingsTransformerSelect");
const meterSelect = document.getElementById("readingsMeterSelect");
const limitInput = document.getElementById("readingsLimit");
const loadBtn = document.getElementById("readingsLoad");
const refreshBtn = document.getElementById("readingsRefresh");
const selectionHint = document.getElementById("readingsSelectionHint");
const statusBox = document.getElementById("readingsStatus");
const statusBody = document.getElementById("readingsStatusBody");
const wsStatus = document.getElementById("readingsWsStatus");

const registerPickerList = document.getElementById("registerPickerList");
const registerPickerEmpty = document.getElementById("registerPickerEmpty");
const registerSelectAll = document.getElementById("registerSelectAll");
const registerClear = document.getElementById("registerClear");

const metricsGrid = document.getElementById("registerMetricsGrid");
const metricsEmpty = document.getElementById("registerMetricsEmpty");

let transformers = [];
let meters = [];
let registers = [];
let metricKeys = [];
let selectedRegisterKeys = new Set();
let metricsByKey = {};
let ws = null;

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

const formatValue = (value, unit) => {
    if (value === null || value === undefined) {
        return "(brak)";
    }
    const formatted = typeof value === "number" ? value.toFixed(2) : String(value);
    return unit ? `${formatted} ${unit}` : formatted;
};

const getSelectedTransformerId = () => selectedTransformerId;

const setSelectedTransformerId = (id) => {
    selectedTransformerId = id || null;
    if (window.BTData) {
        window.BTData.setSelectedId(selectedTransformerId);
    }
};

const getSelectedMeterId = () => {
    if (!selectedMeterInfo || selectedMeterInfo.transformerId !== getSelectedTransformerId()) {
        return null;
    }
    return selectedMeterInfo.meterId || null;
};

const setSelectedMeterId = (meterId) => {
    const transformerId = getSelectedTransformerId();
    if (window.BTData) {
        window.BTData.setSelectedMeterInfo(transformerId, meterId || null);
    }
    selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;
};

const getSelectedTransformer = () => {
    const id = getSelectedTransformerId();
    return transformers.find((t) => t.id === id) || null;
};

const getSelectedMeter = () => {
    const meterId = getSelectedMeterId();
    return meters.find((m) => m.id === meterId) || null;
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
        option.value = transformer.id;
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
        option.value = meter.id;
        option.textContent = `${meter.name} (${meter.deviceCode})`;
        meterSelect.append(option);
    });
    if (getSelectedMeterId()) {
        meterSelect.value = getSelectedMeterId();
    }
};

const renderRegisterPicker = () => {
    if (!registerPickerList || !registerPickerEmpty) {
        return;
    }
    registerPickerList.innerHTML = "";
    if (!registers.length) {
        const meter = getSelectedMeter();
        registerPickerEmpty.textContent = meter
            ? "Brak rejestrow dla wybranego miernika."
            : "Wybierz miernik, aby zobaczyc rejestry.";
        registerPickerEmpty.style.display = "block";
        registerPickerList.style.display = "none";
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
    registerPickerList.style.display = "grid";
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
        const item = document.createElement("label");
        item.className = "register-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = key;
        checkbox.checked = selectedRegisterKeys.has(key);
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

        const meta = document.createElement("div");
        meta.className = "register-item__meta";
        meta.textContent = `${register.registerType} | adres ${register.address} | ${register.dataType}`;

        const name = document.createElement("div");
        name.className = "register-item__name";
        name.textContent = register.name;

        const badge = document.createElement("span");
        badge.className = "register-item__badge";
        badge.textContent = metricKeys.includes(key) ? "dane OK" : "brak danych";
        if (!metricKeys.includes(key)) {
            badge.classList.add("register-item__badge--warn");
        }

        const content = document.createElement("div");
        content.className = "register-item__content";
        content.append(name, meta, badge);

        item.append(checkbox, content);
        registerPickerList.append(item);
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

        card.append(header, stats, tableWrap);
        metricsGrid.append(card);
    });
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
            renderMeterSelect();
            renderRegisterPicker();
            resetMetrics();
            return;
        }
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
        if (getSelectedMeterId() && !meters.find((m) => m.id === getSelectedMeterId())) {
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
    const meter = getSelectedMeter();
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
        clearWs();
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

window.addEventListener("beforeunload", () => {
    if (ws) {
        ws.close();
    }
});

setWsStatus("WebSocket: offline");
setStatus("Wybierz transformator i miernik.", null);
loadTransformers().then(() => connectWs());
