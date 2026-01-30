const transformerSelect = document.getElementById("registerTransformerSelect");
const meterSelect = document.getElementById("registerMeterSelect");
const refreshBtn = document.getElementById("registerRefresh");
const selectionHint = document.getElementById("registerSelectionHint");
const statusBox = document.getElementById("registerStatus");
const statusBody = document.getElementById("registerStatusBody");
const selectedTransformerName = document.getElementById("selectedTransformerName");
const selectedMeterName = document.getElementById("selectedMeterName");

const registerForm = document.getElementById("addRegisterForm");
const registerList = document.getElementById("registerList");
const registerEmpty = document.getElementById("registerEmpty");

let transformers = [];
let meters = [];
let registers = [];

let selectedTransformerId = window.BTData ? window.BTData.getSelectedId() : null;
let selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;

const setStatus = (message, state) => {
    if (!statusBox || !statusBody) {
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

const updateSelectionDetail = () => {
    if (!selectedTransformerName || !selectedMeterName) {
        return;
    }
    const transformer = getSelectedTransformer();
    const meter = getSelectedMeter();
    selectedTransformerName.textContent = transformer ? transformer.name : "(brak)";
    selectedMeterName.textContent = meter ? meter.name : "(brak)";
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
        const normalized = meterId ? String(meterId) : null;
        window.BTData.setSelectedMeterInfo(transformerId, normalized);
    }
    selectedMeterInfo = window.BTData ? window.BTData.getSelectedMeterInfo() : null;
};

const getSelectedTransformer = () => {
    const id = getSelectedTransformerId();
    return transformers.find((t) => String(t.id) === String(id)) || null;
};

const getSelectedMeter = () => {
    const meterId = getSelectedMeterId();
    const fromState = meters.find((m) => String(m.id) === String(meterId)) || null;
    if (fromState) {
        return fromState;
    }
    if (meterSelect && meterSelect.value) {
        return meters.find((m) => String(m.id) === String(meterSelect.value)) || null;
    }
    return null;
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
    updateSelectionDetail();
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
    if (getSelectedMeterId()) {
        meterSelect.value = getSelectedMeterId();
    } else if (meters.length) {
        meterSelect.value = String(meters[0].id);
        setSelectedMeterId(meters[0].id);
    }
    updateSelectionDetail();
};

const renderRegisters = () => {
    if (!registerList || !registerEmpty) {
        return;
    }
    registerList.innerHTML = "";
    if (!registers.length) {
        registerEmpty.style.display = "block";
        registerList.style.display = "none";
        return;
    }
    registerEmpty.style.display = "none";
    registerList.style.display = "grid";

    registers.forEach((register) => {
        const item = document.createElement("div");
        item.className = "list__item";

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = register.name;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        meta.textContent = `${register.registerType} | ${register.address} | ${register.dataType}`;

        const tags = document.createElement("div");
        tags.className = "list__tags";
        const scaleTag = document.createElement("span");
        scaleTag.className = "tag";
        scaleTag.textContent = `Skala: ${register.scale}`;
        tags.append(scaleTag);
        if (register.unit) {
            const unitTag = document.createElement("span");
            unitTag.className = "tag";
            unitTag.textContent = register.unit;
            tags.append(unitTag);
        }
        const statusTag = document.createElement("span");
        statusTag.className = "tag";
        statusTag.textContent = register.enabled ? "Aktywny" : "Wylaczony";
        tags.append(statusTag);

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn--ghost btn--small";
        deleteBtn.textContent = "Usun";
        deleteBtn.addEventListener("click", () => removeRegister(register.id));

        actions.append(deleteBtn);
        item.append(main, actions);
        registerList.append(item);
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
        renderRegisters();
        setHint("Wybierz transformator, aby zobaczyc mierniki.");
        updateSelectionDetail();
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
        updateSelectionDetail();
    } catch (error) {
        setStatus(error?.message || "Blad pobierania miernikow.", "result--error");
    }
};

const loadRegisters = async () => {
    let meter = getSelectedMeter();
    if (!meter && meterSelect && meterSelect.value) {
        setSelectedMeterId(meterSelect.value);
        meter = getSelectedMeter();
    }
    if (!meter || !window.BT_API?.request) {
        registers = [];
        renderRegisters();
        const transformer = getSelectedTransformer();
        if (transformer) {
            setHint(`Wybrany transformator: ${transformer.name}. Wybierz miernik, aby zobaczyc rejestry.`);
        }
        updateSelectionDetail();
        return;
    }
    try {
        const data = await window.BT_API.request("GET", `/meters/${meter.id}/registers`);
        registers = Array.isArray(data) ? data : [];
        renderRegisters();
        const transformer = getSelectedTransformer();
        if (transformer) {
            setHint(`Wybrany transformator: ${transformer.name}. Miernik: ${meter.name}.`);
        }
        updateSelectionDetail();
    } catch (error) {
        setStatus(error?.message || "Blad pobierania rejestrow.", "result--error");
    }
};

const addRegister = async (payload) => {
    let meter = getSelectedMeter();
    if (!meter && meterSelect && meterSelect.value) {
        setSelectedMeterId(meterSelect.value);
        meter = getSelectedMeter();
    }
    if (!meter) {
        if (meters.length) {
            setSelectedMeterId(meters[0].id);
            meter = getSelectedMeter();
        }
    }
    if (!meter) {
        setStatus("Najpierw wybierz miernik.", "result--error");
        return;
    }
    if (!window.BT_API?.request) {
        setStatus("Brak konfiguracji API.", "result--error");
        return;
    }
    setStatus("Dodawanie rejestru...", null);
    try {
        await window.BT_API.request("POST", `/meters/${meter.id}/registers`, payload);
        await loadRegisters();
        setStatus("Rejestr dodany.", "result--success");
        if (registerForm) {
            registerForm.reset();
        }
    } catch (error) {
        setStatus(error?.message || "Blad zapisu rejestru.", "result--error");
    }
};

const removeRegister = async (id) => {
    const meter = getSelectedMeter();
    if (!meter) {
        return;
    }
    if (!window.BT_API?.request) {
        setStatus("Brak konfiguracji API.", "result--error");
        return;
    }
    setStatus("Usuwanie rejestru...", null);
    try {
        await window.BT_API.request("DELETE", `/meters/${meter.id}/registers/${id}`);
        await loadRegisters();
        setStatus("Rejestr usuniety.", "result--success");
    } catch (error) {
        setStatus(error?.message || "Blad usuwania rejestru.", "result--error");
    }
};

if (transformerSelect) {
    transformerSelect.addEventListener("change", async () => {
        setSelectedTransformerId(transformerSelect.value || null);
        setSelectedMeterId(null);
        meters = [];
        registers = [];
        renderMeterSelect();
        renderRegisters();
        await loadMeters();
        updateSelectionDetail();
    });
}

if (meterSelect) {
    meterSelect.addEventListener("change", async () => {
        setSelectedMeterId(meterSelect.value || null);
        registers = [];
        renderRegisters();
        await loadRegisters();
        updateSelectionDetail();
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadTransformers());
}

if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const name = String(formData.get("name") || "").trim();
        const address = Number(formData.get("address") || 0);
        const dataType = String(formData.get("dataType") || "INT16");
        const unit = String(formData.get("unit") || "").trim();

        if (!name) {
            setStatus("Pole 'Nazwa' jest wymagane.", "result--error");
            return;
        }
        if (!Number.isFinite(address)) {
            setStatus("Pole 'Adres' jest wymagane.", "result--error");
            return;
        }

        addRegister({
            name,
            address,
            dataType,
            unit
        });
    });
}

setStatus("Wybierz transformator i miernik.", null);
loadTransformers();
updateSelectionDetail();
