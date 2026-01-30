const meterForm = document.getElementById("addMeterForm");
const meterResult = document.getElementById("meterResult");
const meterResultBody = document.getElementById("meterResultBody");
const meterList = document.getElementById("meterList");
const meterEmpty = document.getElementById("meterEmpty");
const meterContext = document.getElementById("meterContext");
const transformerSelect = document.getElementById("meterTransformerSelect");
const transformerRefresh = document.getElementById("meterTransformerRefresh");
const transformerHint = document.getElementById("meterTransformerHint");
const meterSelectionAlert = document.getElementById("meterSelectionAlert");
const meterSelect = document.getElementById("meterSelect");
const meterRefresh = document.getElementById("meterRefresh");
const meterSelectHint = document.getElementById("meterSelectHint");
const serialPortOptions = document.getElementById("serialPortOptions");

let transformers = [];
let meters = [];
let selectedTransformerId = window.BTData ? window.BTData.getSelectedId() : null;

const buildDeviceCode = (name) => {
    const base = String(name || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const fallback = `MTR-${new Date().getFullYear()}`;
    const code = base ? `MTR-${base}` : fallback;
    return code.slice(0, 64);
};

const buildSerialPortOptions = () => {
    const options = [];
    for (let i = 1; i <= 20; i += 1) {
        options.push(`COM${i}`);
    }
    for (let i = 0; i <= 9; i += 1) {
        options.push(`/dev/ttyUSB${i}`);
    }
    for (let i = 1; i <= 4; i += 1) {
        const suffix = String(i).padStart(4, "0");
        options.push(`/dev/tty.usbserial-${suffix}`);
        options.push(`/dev/tty.usbmodem-${suffix}`);
        options.push(`/dev/cu.usbserial-${suffix}`);
        options.push(`/dev/cu.usbmodem-${suffix}`);
    }
    return options;
};

const renderSerialPortOptions = () => {
    if (!serialPortOptions) {
        return;
    }
    serialPortOptions.innerHTML = "";
    const ports = buildSerialPortOptions();
    ports.forEach((port) => {
        const option = document.createElement("option");
        option.value = port;
        serialPortOptions.append(option);
    });
};

const setMeterResult = (message, state) => {
    if (!meterResultBody || !meterResult) {
        return;
    }
    meterResultBody.textContent = message;
    meterResult.classList.remove("result--success", "result--error");
    if (state) {
        meterResult.classList.add(state);
    }
};

const getSelectedTransformerId = () => selectedTransformerId;

const setSelectedTransformerId = (id) => {
    selectedTransformerId = id ? String(id) : null;
    if (window.BTData) {
        window.BTData.setSelectedId(selectedTransformerId);
    }
};

const getSelectedMeterInfo = () => (window.BTData ? window.BTData.getSelectedMeterInfo() : null);

const setSelectedMeterInfo = (transformerId, meterId) => {
    if (window.BTData) {
        const normalizedTransformer = transformerId ? String(transformerId) : null;
        const normalizedMeter = meterId ? String(meterId) : null;
        window.BTData.setSelectedMeterInfo(normalizedTransformer, normalizedMeter);
    }
};

const getSelectedTransformer = () => {
    const id = getSelectedTransformerId();
    return transformers.find((t) => String(t.id) === String(id)) || null;
};

const getSelectedMeter = () => {
    const selectedId = getSelectedTransformerId();
    if (!selectedId) {
        return null;
    }
    const info = getSelectedMeterInfo();
    if (!info || info.transformerId !== selectedId) {
        return meters[0] || null;
    }
    return meters.find((m) => String(m.id) === String(info.meterId)) || meters[0] || null;
};

const renderMeterSelect = () => {
    if (!meterSelect || !meterSelectHint) {
        return;
    }
    meterSelect.innerHTML = "";

    if (!meters.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Brak miernikow";
        meterSelect.append(option);
        meterSelect.disabled = true;
        meterSelectHint.textContent = "Brak miernikow. Dodaj miernik powyzej.";
        return;
    }

    meterSelect.disabled = false;
    meters.forEach((meter) => {
        const option = document.createElement("option");
        option.value = String(meter.id);
        option.textContent = `${meter.name} (${meter.deviceCode})`;
        meterSelect.append(option);
    });

    const selected = getSelectedMeter();
    if (selected) {
        meterSelect.value = String(selected.id);
        meterSelectHint.textContent = `Wybrany miernik: ${selected.name}.`;
    } else {
        meterSelect.value = String(meters[0].id);
        setSelectedMeterInfo(getSelectedTransformerId(), meters[0].id);
        meterSelectHint.textContent = `Wybrano pierwszy miernik: ${meters[0].name}.`;
    }
};

const toggleForms = (meterEnabled) => {
    if (meterForm) {
        meterForm.querySelectorAll("input, select, button").forEach((field) => {
            field.disabled = !meterEnabled;
        });
    }
};

const updateMeterDetail = () => {};

const renderMeters = () => {
    if (!meterList || !meterEmpty) {
        return;
    }

    meterList.innerHTML = "";

    const selectedTransformer = getSelectedTransformer();
    if (!selectedTransformer) {
        meterEmpty.textContent = "Najpierw wybierz transformator w sekcji Transformatory.";
        meterEmpty.style.display = "block";
        meterList.style.display = "none";
        if (meterContext) {
            meterContext.textContent = "Wybierz transformator powyzej, aby dodac miernik.";
        }
        if (meterSelectionAlert) {
            meterSelectionAlert.textContent = "Najpierw wybierz transformator z listy powyzej.";
            meterSelectionAlert.classList.add("result--error");
        }
        toggleForms(false);
        return;
    }

    if (meterContext) {
        meterContext.textContent = `Dodajesz miernik do: ${selectedTransformer.name}`;
    }
    if (meterSelectionAlert) {
        meterSelectionAlert.textContent = `Wybrany transformator: ${selectedTransformer.name}.`;
        meterSelectionAlert.classList.remove("result--error");
    }

    if (!meters.length) {
        meterEmpty.textContent = "Brak miernikow. Dodaj pierwszy wpis powyzej.";
        meterEmpty.style.display = "block";
        meterList.style.display = "none";
    } else {
        meterEmpty.style.display = "none";
        meterList.style.display = "grid";
    }

    const info = getSelectedMeterInfo();

    meters.forEach((meter) => {
        const item = document.createElement("div");
        item.className = "list__item";
        if (info && info.transformerId === selectedTransformer.id && String(info.meterId) === String(meter.id)) {
            item.classList.add("list__item--active");
        }

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = meter.name;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        meta.textContent = `${meter.deviceCode} | ${meter.serialPort} | slave ${meter.slaveId}`;

        const tags = document.createElement("div");
        tags.className = "list__tags";

        const statusTag = document.createElement("span");
        statusTag.className = "tag";
        statusTag.textContent = meter.enabled ? "Aktywny" : "Wylaczony";
        tags.append(statusTag);

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "btn btn--ghost btn--small";
        selectBtn.textContent = "Wybierz";
        selectBtn.addEventListener("click", () => {
            setSelectedMeterInfo(selectedTransformer.id, meter.id);
            renderMeters();
            renderMeterSelect();
            fetchRegisters();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn--ghost btn--small";
        deleteBtn.textContent = "Usun";
        deleteBtn.addEventListener("click", () => removeMeter(meter.id));

        actions.append(selectBtn, deleteBtn);
        item.append(main, actions);
        meterList.append(item);
    });

    toggleForms(true);
};

const fetchTransformers = async () => {
    if (!window.BT_API?.request) {
        setMeterResult("Brak konfiguracji API.", "result--error");
        return;
    }
    try {
        const data = await window.BT_API.request("GET", "/transformers");
        transformers = Array.isArray(data) ? data : [];
        const selectedId = getSelectedTransformerId();
        if (selectedId && !transformers.find((t) => t.id === selectedId)) {
            setSelectedTransformerId(null);
        }
        if (!getSelectedTransformerId() && transformers.length) {
            setSelectedTransformerId(transformers[0].id);
        }
        meters = [];
        
        renderTransformerSelect();
        renderMeterSelect();
        renderMeters();
        fetchMeters();
    } catch (error) {
        setMeterResult(error?.message || "Blad pobierania transformatorow.", "result--error");
    }
};

const renderTransformerSelect = () => {
    if (!transformerSelect || !transformerHint) {
        return;
    }
    transformerSelect.innerHTML = "";

    if (!transformers.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Brak transformatorow - dodaj najpierw";
        transformerSelect.append(option);
        transformerSelect.disabled = true;
        transformerHint.textContent = "Nie masz jeszcze transformatorow. Dodaj je w zakladce Transformatory.";
        if (meterSelectionAlert) {
            meterSelectionAlert.textContent = "Brak transformatorow. Dodaj pierwszy w zakladce Transformatory.";
            meterSelectionAlert.classList.add("result--error");
        }
        return;
    }

    transformerSelect.disabled = false;
    const selectedId = getSelectedTransformerId();
    transformers.forEach((transformer) => {
        const option = document.createElement("option");
        option.value = String(transformer.id);
        option.textContent = `${transformer.name} (${transformer.id})`;
        transformerSelect.append(option);
    });

    if (selectedId) {
        transformerSelect.value = selectedId;
        const selected = getSelectedTransformer();
        transformerHint.textContent = selected
            ? `Wybrany transformator: ${selected.name}.`
            : "Wybierz transformator z listy.";
    } else {
        transformerSelect.value = transformers[0].id;
        setSelectedTransformerId(transformers[0].id);
        transformerHint.textContent = "Wybrano pierwszy transformator. Mozesz zmienic wybor.";
    }
};

const handleTransformerChange = () => {
    if (!transformerSelect) {
        return;
    }
    const selectedId = transformerSelect.value || null;
    setSelectedTransformerId(selectedId);
    setSelectedMeterInfo(selectedId, null);
    renderTransformerSelect();
    meters = [];
    renderMeters();
    fetchMeters();
};

const fetchMeters = async () => {
    const selected = getSelectedTransformer();
    if (!selected || !window.BT_API?.request) {
        meters = [];
        if (meterSelectionAlert) {
            meterSelectionAlert.textContent = "Nie mozna wczytac transformatorow. Sprawdz polaczenie.";
            meterSelectionAlert.classList.add("result--error");
        }
        renderMeters();
        return;
    }
    try {
        meters = await window.BT_API.request("GET", `/transformers/${selected.id}/meters`);
        if (!Array.isArray(meters)) {
            meters = [];
        }
        const info = getSelectedMeterInfo();
        const matchesTransformer = info && info.transformerId === selected.id;
        const exists = matchesTransformer && meters.find((m) => String(m.id) === String(info.meterId));
        if (!exists) {
            const next = meters[0]?.id || null;
            setSelectedMeterInfo(selected.id, next);
        }
        renderMeterSelect();
        renderMeters();
    } catch (error) {
        setMeterResult(error?.message || "Blad pobierania miernikow.", "result--error");
    }
};

const addMeter = async (payload) => {
    const selected = getSelectedTransformer();
    if (!selected) {
        setMeterResult("Najpierw wybierz transformator.", "result--error");
        return;
    }
    if (!window.BT_API?.request) {
        setMeterResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setMeterResult("Dodawanie miernika...", null);
    try {
        await window.BT_API.request("POST", `/transformers/${selected.id}/meters`, payload);
        await fetchMeters();
        setMeterResult("Miernik dodany.", "result--success");
    } catch (error) {
        setMeterResult(error?.message || "Blad zapisu miernika.", "result--error");
    }
};

const removeMeter = async (id) => {
    const selected = getSelectedTransformer();
    if (!selected) {
        return;
    }
    if (!window.BT_API?.request) {
        setMeterResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setMeterResult("Usuwanie miernika...", null);
    try {
        await window.BT_API.request("DELETE", `/transformers/${selected.id}/meters/${id}`);
        await fetchMeters();
        setMeterResult("Miernik usuniety.", "result--success");
    } catch (error) {
        setMeterResult(error?.message || "Blad usuwania miernika.", "result--error");
    }
};


if (meterForm) {
    meterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(meterForm);
        const name = String(formData.get("name") || "").trim();
        const serialPort = String(formData.get("serialPort") || "").trim();
        const baudRate = Number(formData.get("baudRate") || 0);
        const dataBits = Number(formData.get("dataBits") || 0);
        const parity = String(formData.get("parity") || "NONE");
        const stopBits = Number(formData.get("stopBits") || 1);
        const slaveId = Number(formData.get("slaveId") || 0);
        const byteOrder = String(formData.get("byteOrder") || "BIG_ENDIAN");
        const pollIntervalMs = Number(formData.get("pollIntervalMs") || 1000);
        const enabled = String(formData.get("enabled") || "1") === "1";

        if (!name || !serialPort || !baudRate || !dataBits || !slaveId) {
            setMeterResult("Uzupelnij wymagane pola miernika.", "result--error");
            return;
        }

        const deviceCode = buildDeviceCode(name);

        addMeter({
            name,
            deviceCode,
            serialPort,
            baudRate,
            dataBits,
            parity,
            stopBits,
            slaveId,
            byteOrder,
            pollIntervalMs,
            enabled
        });

        meterForm.reset();
        meterForm.querySelector("[name=baudRate]").value = "9600";
        meterForm.querySelector("[name=dataBits]").value = "8";
        meterForm.querySelector("[name=pollIntervalMs]").value = "1000";
        meterForm.querySelector("[name=slaveId]").value = "1";
        meterForm.querySelector("[name=parity]").value = "NONE";
        meterForm.querySelector("[name=stopBits]").value = "1";
        meterForm.querySelector("[name=byteOrder]").value = "BIG_ENDIAN";
        meterForm.querySelector("[name=enabled]").value = "1";
    });
}

if (transformerSelect) {
    transformerSelect.addEventListener("change", () => handleTransformerChange());
}

if (transformerRefresh) {
    transformerRefresh.addEventListener("click", () => fetchTransformers());
}

if (meterSelect) {
    meterSelect.addEventListener("change", () => {
        const selectedId = meterSelect.value || null;
        setSelectedMeterInfo(getSelectedTransformerId(), selectedId);
        renderMeters();
        renderMeterSelect();
        fetchRegisters();
    });
}

if (meterRefresh) {
    meterRefresh.addEventListener("click", () => fetchMeters());
}

renderSerialPortOptions();
fetchTransformers();
