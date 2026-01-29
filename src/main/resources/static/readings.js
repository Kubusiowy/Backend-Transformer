const detailName = document.getElementById("detailName");
const detailLocation = document.getElementById("detailLocation");
const detailId = document.getElementById("detailId");
const detailOwner = document.getElementById("detailOwner");

const metricAvg = document.getElementById("metricAvg");
const metricMin = document.getElementById("metricMin");
const metricMax = document.getElementById("metricMax");
const metricTime = document.getElementById("metricTime");

const metricKeySelect = document.getElementById("metricKeySelect");
const metricLimit = document.getElementById("metricLimit");
const metricsStatus = document.getElementById("metricsStatus");
const metricsTableBody = document.getElementById("metricsTableBody");
const metricsEmpty = document.getElementById("metricsEmpty");
const metricsTableWrap = document.getElementById("metricsTableWrap");
const chartCanvas = document.getElementById("metricsChart");

const readNowBtn = document.getElementById("readNow");
const deleteSelectedBtn = document.getElementById("deleteSelected");
const transformerResult = document.getElementById("transformerResult");
const transformerResultBody = document.getElementById("transformerResultBody");

let currentTransformer = null;
let currentPoints = [];
let ws = null;

const setResult = (message, state) => {
    if (!transformerResultBody || !transformerResult) {
        return;
    }
    transformerResultBody.textContent = message;
    transformerResult.classList.remove("result--success", "result--error");
    if (state) {
        transformerResult.classList.add(state);
    }
};

const setWsStatus = (message) => {
    if (metricsStatus) {
        metricsStatus.textContent = message;
    }
};

const formatValue = (value, unit) => {
    if (value === null || value === undefined) {
        return "(brak)";
    }
    const formatted = typeof value === "number" ? value.toFixed(2) : String(value);
    return unit ? `${formatted} ${unit}` : formatted;
};

const updateSummary = (point) => {
    if (!metricAvg || !metricMin || !metricMax || !metricTime) {
        return;
    }
    if (!point) {
        metricAvg.textContent = "(brak)";
        metricMin.textContent = "(brak)";
        metricMax.textContent = "(brak)";
        metricTime.textContent = "(brak)";
        return;
    }
    metricAvg.textContent = formatValue(point.avgValue, point.unit);
    metricMin.textContent = formatValue(point.minValue, point.unit);
    metricMax.textContent = formatValue(point.maxValue, point.unit);
    metricTime.textContent = point.bucketTs || "(brak)";
    if (window.BTData) {
        window.BTData.setLastRead(point.bucketTs || new Date().toISOString());
    }
};

const updateTransformerDetail = (transformer) => {
    if (!detailName || !detailLocation || !detailId) {
        return;
    }
    if (!transformer) {
        detailName.textContent = "(brak)";
        detailLocation.textContent = "(brak)";
        detailId.textContent = "(brak)";
        if (detailOwner) {
            detailOwner.textContent = "(brak)";
        }
        return;
    }
    detailName.textContent = transformer.name || "(brak)";
    detailLocation.textContent = transformer.location || "(brak)";
    detailId.textContent = transformer.id || "(brak)";
    if (detailOwner) {
        detailOwner.textContent = transformer.userId || "(brak)";
    }
};

const renderTable = (points) => {
    if (!metricsTableBody || !metricsEmpty || !metricsTableWrap) {
        return;
    }
    metricsTableBody.innerHTML = "";
    if (!points.length) {
        metricsEmpty.style.display = "block";
        metricsTableWrap.style.display = "none";
        return;
    }
    metricsEmpty.style.display = "none";
    metricsTableWrap.style.display = "block";

    points.forEach((point) => {
        const row = document.createElement("tr");
        const cells = [
            point.bucketTs,
            formatValue(point.avgValue, point.unit),
            formatValue(point.minValue, point.unit),
            formatValue(point.maxValue, point.unit),
            point.count ?? "",
            point.unit || "",
            point.label || ""
        ];
        cells.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.append(cell);
        });
        metricsTableBody.append(row);
    });
};

const parseBucket = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
};

const drawChart = (points) => {
    if (!chartCanvas || !chartCanvas.getContext) {
        return;
    }
    const ctx = chartCanvas.getContext("2d");
    const container = chartCanvas.parentElement;
    const width = container ? container.clientWidth : chartCanvas.width;
    const height = chartCanvas.height || 240;
    const ratio = window.devicePixelRatio || 1;
    chartCanvas.width = Math.floor(width * ratio);
    chartCanvas.height = Math.floor(height * ratio);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(15, 23, 42, 0.04)";
    ctx.fillRect(0, 0, width, height);

    if (!points.length) {
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.fillText("Brak danych", 12, 20);
        return;
    }

    const values = points.map((p) => Number(p.avgValue ?? p.maxValue ?? 0));
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
        min -= 1;
        max += 1;
    }

    const padding = 32;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.strokeStyle = "rgba(14, 165, 233, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
        const value = Number(point.avgValue ?? point.maxValue ?? 0);
        const x = padding + (chartWidth * index) / Math.max(points.length - 1, 1);
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

    ctx.fillStyle = "#0ea5e9";
    points.forEach((point, index) => {
        const value = Number(point.avgValue ?? point.maxValue ?? 0);
        const x = padding + (chartWidth * index) / Math.max(points.length - 1, 1);
        const y =
            height -
            padding -
            ((value - min) / (max - min)) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
};

const refreshChart = () => drawChart(currentPoints.slice().reverse());

const loadTransformer = async () => {
    const selectedId = window.BTData ? window.BTData.getSelectedId() : null;
    if (!selectedId) {
        updateTransformerDetail(null);
        setResult("Najpierw wybierz transformator w sekcji Transformatory.", "result--error");
        return;
    }
    if (!window.BT_API?.request) {
        setResult("Brak konfiguracji API.", "result--error");
        return;
    }
    try {
        const transformer = await window.BT_API.request("GET", `/transformers/${selectedId}`);
        currentTransformer = transformer || null;
        updateTransformerDetail(currentTransformer);
        setResult("Transformator gotowy do odczytow.", "result--success");
        await loadMetricKeys();
        connectWs();
    } catch (error) {
        setResult(error?.message || "Blad pobierania transformatora.", "result--error");
    }
};

const loadMetricKeys = async () => {
    if (!currentTransformer || !window.BT_API?.request) {
        return;
    }
    try {
        const keys = await window.BT_API.request(
            "GET",
            `/transformers/${currentTransformer.id}/metrics/keys`
        );
        const list = Array.isArray(keys) ? keys : [];
        if (metricKeySelect) {
            metricKeySelect.innerHTML = "";
            list.forEach((key) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = key;
                metricKeySelect.append(option);
            });
            metricKeySelect.disabled = list.length === 0;
        }
        if (list.length) {
            await loadMetrics();
        } else {
            updateSummary(null);
            renderTable([]);
            drawChart([]);
        }
    } catch (error) {
        setResult(error?.message || "Blad pobierania kluczy.", "result--error");
    }
};

const loadMetrics = async () => {
    if (!currentTransformer || !window.BT_API?.request) {
        return;
    }
    const key = metricKeySelect ? metricKeySelect.value : null;
    if (!key) {
        setResult("Brak klucza pomiaru.", "result--error");
        return;
    }
    const limitValue = metricLimit ? Number(metricLimit.value || 120) : 120;
    try {
        const points = await window.BT_API.request(
            "GET",
            `/transformers/${currentTransformer.id}/metrics?key=${encodeURIComponent(
                key
            )}&limit=${limitValue}&order=desc`
        );
        currentPoints = Array.isArray(points) ? points : [];
        renderTable(currentPoints);
        updateSummary(currentPoints[0] || null);
        refreshChart();
        setResult("Odczyty zaktualizowane.", "result--success");
    } catch (error) {
        setResult(error?.message || "Blad pobierania odczytow.", "result--error");
    }
};

const handleWsMessage = (data) => {
    if (!data) {
        return;
    }
    const payload = typeof data === "string" ? JSON.parse(data) : data;
    const key = metricKeySelect ? metricKeySelect.value : null;
    if (!payload || !key || payload.key !== key) {
        return;
    }
    currentPoints.unshift(payload);
    const limitValue = metricLimit ? Number(metricLimit.value || 120) : 120;
    currentPoints = currentPoints.slice(0, limitValue);
    renderTable(currentPoints);
    updateSummary(currentPoints[0] || null);
    refreshChart();
};

const connectWs = async () => {
    if (!currentTransformer || !window.BT_API?.buildWsUrl) {
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
        `/ws/transformers/${currentTransformer.id}/metrics?token=${encodeURIComponent(token)}`
    );
    ws = new WebSocket(url);
    ws.onopen = () => setWsStatus("WebSocket: online");
    ws.onclose = () => setWsStatus("WebSocket: offline");
    ws.onerror = () => setWsStatus("WebSocket: blad");
    ws.onmessage = (event) => {
        try {
            handleWsMessage(event.data);
        } catch (error) {
            setWsStatus("WebSocket: blad danych");
        }
    };
};

const removeSelected = async () => {
    if (!currentTransformer || !window.BT_API?.request) {
        return;
    }
    try {
        await window.BT_API.request("DELETE", `/transformers/${currentTransformer.id}`);
        if (window.BTData) {
            window.BTData.setSelectedId(null);
        }
        currentTransformer = null;
        updateTransformerDetail(null);
        updateSummary(null);
        renderTable([]);
        drawChart([]);
        setResult("Transformator usuniety.", "result--success");
    } catch (error) {
        setResult(error?.message || "Blad usuwania.", "result--error");
    }
};

if (readNowBtn) {
    readNowBtn.addEventListener("click", () => loadMetrics());
}

if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", () => removeSelected());
}

if (metricKeySelect) {
    metricKeySelect.addEventListener("change", () => loadMetrics());
}

if (metricLimit) {
    metricLimit.addEventListener("change", () => loadMetrics());
}

window.addEventListener("resize", () => refreshChart());
window.addEventListener("beforeunload", () => {
    if (ws) {
        ws.close();
    }
});

setWsStatus("WebSocket: offline");
updateSummary(null);
renderTable([]);
drawChart([]);
loadTransformer();
