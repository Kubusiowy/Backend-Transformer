const detailName = document.getElementById("detailName");
const detailLocation = document.getElementById("detailLocation");
const detailSerial = document.getElementById("detailSerial");
const detailPower = document.getElementById("detailPower");
const detailNote = document.getElementById("detailNote");

const metricVoltage = document.getElementById("metricVoltage");
const metricTemp = document.getElementById("metricTemp");
const metricLoad = document.getElementById("metricLoad");
const metricTime = document.getElementById("metricTime");

const readNowBtn = document.getElementById("readNow");
const deleteSelectedBtn = document.getElementById("deleteSelected");
const transformerResult = document.getElementById("transformerResult");
const transformerResultBody = document.getElementById("transformerResultBody");

const auth = window.BT_AUTH || {};
const currentUserId = auth.userId || "(brak)";
const isAdmin = Boolean(auth.isAdmin);
let allTransformers = window.BTData ? window.BTData.loadTransformers() : [];

const getVisibleTransformers = () => (window.BTData ? window.BTData.getScopedTransformers(allTransformers) : []);

const ensureSelectedVisible = () => {
    if (!window.BTData) {
        return;
    }
    const selectedId = window.BTData.getSelectedId();
    if (!selectedId) {
        return;
    }
    const visible = getVisibleTransformers();
    if (!visible.find((t) => t.id === selectedId)) {
        window.BTData.setSelectedId(null);
    }
};

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

const getSelected = () => {
    const visible = getVisibleTransformers();
    return window.BTData ? window.BTData.getSelectedTransformer(visible) : null;
};

const updateSelectedDetail = () => {
    const selected = getSelected();
    if (!selected) {
        detailName.textContent = "(brak)";
        detailLocation.textContent = "(brak)";
        detailSerial.textContent = "(brak)";
        detailPower.textContent = "(brak)";
        detailNote.textContent = "(brak)";
        return;
    }
    detailName.textContent = selected.name;
    detailLocation.textContent = selected.location || "(brak)";
    detailSerial.textContent = selected.serial || "(brak)";
    detailPower.textContent = selected.power ? `${selected.power} kVA` : "(brak)";
    detailNote.textContent = selected.note || "(brak)";
};

const clearMetrics = () => {
    metricVoltage.textContent = "(brak)";
    metricTemp.textContent = "(brak)";
    metricLoad.textContent = "(brak)";
    metricTime.textContent = "(brak)";
};

const generateMetrics = () => {
    const voltage = (10 + Math.random() * 5).toFixed(2);
    const temp = (35 + Math.random() * 25).toFixed(1);
    const load = (40 + Math.random() * 50).toFixed(0);
    return {
        voltage: `${voltage} kV`,
        temp: `${temp} C`,
        load: `${load} %`,
        time: new Date().toLocaleString("pl-PL")
    };
};

const readMetrics = () => {
    const selected = getSelected();
    if (!selected) {
        setResult("Najpierw wybierz transformator w sekcji Transformatory.", "result--error");
        return;
    }
    const metrics = generateMetrics();
    metricVoltage.textContent = metrics.voltage;
    metricTemp.textContent = metrics.temp;
    metricLoad.textContent = metrics.load;
    metricTime.textContent = metrics.time;
    if (window.BTData) {
        window.BTData.setLastRead(metrics.time);
    }
    setResult("Odczyt wykonany.", "result--success");
};

const removeSelected = () => {
    const selected = getSelected();
    if (!selected) {
        setResult("Brak zaznaczonego transformatora.", "result--error");
        return;
    }
    if (!isAdmin && selected.userId !== currentUserId) {
        setResult("Brak uprawnien do usuwania cudzych transformatorow.", "result--error");
        return;
    }
    allTransformers = allTransformers.filter((t) => t.id !== selected.id);
    if (window.BTData) {
        window.BTData.saveTransformers(allTransformers);
        window.BTData.setSelectedId(null);
    }
    updateSelectedDetail();
    clearMetrics();
    setResult("Transformator usuniety.", "result--success");
};

if (readNowBtn) {
    readNowBtn.addEventListener("click", () => readMetrics());
}

if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", () => removeSelected());
}

updateSelectedDetail();
clearMetrics();
ensureSelectedVisible();
if (!getVisibleTransformers().length) {
    setResult("Brak danych. Dodaj transformator w sekcji Transformatory.", null);
}
