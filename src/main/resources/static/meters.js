const meterForm = document.getElementById("addMeterForm");
const meterResult = document.getElementById("meterResult");
const meterResultBody = document.getElementById("meterResultBody");
const meterList = document.getElementById("meterList");
const meterEmpty = document.getElementById("meterEmpty");
const meterContext = document.getElementById("meterContext");

const registerForm = document.getElementById("addRegisterForm");
const registerResult = document.getElementById("registerResult");
const registerResultBody = document.getElementById("registerResultBody");
const registerList = document.getElementById("registerList");
const registerEmpty = document.getElementById("registerEmpty");
const registerContext = document.getElementById("registerContext");

const detailMeterName = document.getElementById("detailMeterName");
const detailMeterDevice = document.getElementById("detailMeterDevice");
const detailMeterPort = document.getElementById("detailMeterPort");
const detailMeterSlave = document.getElementById("detailMeterSlave");

let transformers = [];
let meters = [];
let registers = [];

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

const setRegisterResult = (message, state) => {
    if (!registerResultBody || !registerResult) {
        return;
    }
    registerResultBody.textContent = message;
    registerResult.classList.remove("result--success", "result--error");
    if (state) {
        registerResult.classList.add(state);
    }
};

const getSelectedTransformerId = () => (window.BTData ? window.BTData.getSelectedId() : null);

const setSelectedTransformerId = (id) => {
    if (window.BTData) {
        window.BTData.setSelectedId(id);
    }
};

const getSelectedMeterInfo = () => (window.BTData ? window.BTData.getSelectedMeterInfo() : null);

const setSelectedMeterInfo = (transformerId, meterId) => {
    if (window.BTData) {
        window.BTData.setSelectedMeterInfo(transformerId, meterId);
    }
};

const getSelectedTransformer = () => {
    const id = getSelectedTransformerId();
    return transformers.find((t) => t.id === id) || null;
};

const getSelectedMeter = () => {
    const info = getSelectedMeterInfo();
    if (!info) {
        return meters[0] || null;
    }
    return meters.find((m) => m.id === info.meterId) || meters[0] || null;
};

const toggleForms = (meterEnabled, registerEnabled) => {
    if (meterForm) {
        meterForm.querySelectorAll("input, select, button").forEach((field) => {
            field.disabled = !meterEnabled;
        });
    }
    if (registerForm) {
        registerForm.querySelectorAll("input, select, button").forEach((field) => {
            field.disabled = !registerEnabled;
        });
    }
};

const updateMeterDetail = () => {
    const meter = getSelectedMeter();
    if (!detailMeterName || !detailMeterDevice || !detailMeterPort || !detailMeterSlave) {
        return;
    }
    if (!meter) {
        detailMeterName.textContent = "(brak)";
        detailMeterDevice.textContent = "(brak)";
        detailMeterPort.textContent = "(brak)";
        detailMeterSlave.textContent = "(brak)";
        return;
    }
    detailMeterName.textContent = meter.name;
    detailMeterDevice.textContent = meter.deviceCode;
    detailMeterPort.textContent = meter.serialPort;
    detailMeterSlave.textContent = String(meter.slaveId);
};

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
            meterContext.textContent = "Wybierz transformator, aby dodac miernik.";
        }
        toggleForms(false, false);
        updateMeterDetail();
        return;
    }

    if (meterContext) {
        meterContext.textContent = `Dodajesz miernik do: ${selectedTransformer.name}`;
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
        if (info && info.meterId === meter.id) {
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

    toggleForms(true, Boolean(getSelectedMeter()));
    updateMeterDetail();
};

const renderRegisters = () => {
    if (!registerList || !registerEmpty) {
        return;
    }
    registerList.innerHTML = "";

    const meter = getSelectedMeter();
    if (!meter) {
        registerEmpty.textContent = "Wybierz miernik, aby dodac rejestry.";
        registerEmpty.style.display = "block";
        registerList.style.display = "none";
        if (registerContext) {
            registerContext.textContent = "Wybierz miernik, aby dodac rejestr.";
        }
        toggleForms(true, false);
        return;
    }

    if (registerContext) {
        registerContext.textContent = `Dodajesz rejestr do: ${meter.name}`;
    }

    if (!registers.length) {
        registerEmpty.style.display = "block";
        registerList.style.display = "none";
    } else {
        registerEmpty.style.display = "none";
        registerList.style.display = "grid";
    }

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
        meters = [];
        registers = [];
        renderMeters();
        fetchMeters();
    } catch (error) {
        setMeterResult(error?.message || "Blad pobierania transformatorow.", "result--error");
    }
};

const fetchMeters = async () => {
    const selected = getSelectedTransformer();
    if (!selected || !window.BT_API?.request) {
        meters = [];
        registers = [];
        renderMeters();
        renderRegisters();
        return;
    }
    try {
        meters = await window.BT_API.request("GET", `/transformers/${selected.id}/meters`);
        if (!Array.isArray(meters)) {
            meters = [];
        }
        const info = getSelectedMeterInfo();
        const exists = info && meters.find((m) => m.id === info.meterId);
        if (!exists) {
            const next = meters[0]?.id || null;
            setSelectedMeterInfo(selected.id, next);
        }
        renderMeters();
        fetchRegisters();
    } catch (error) {
        setMeterResult(error?.message || "Blad pobierania miernikow.", "result--error");
    }
};

const fetchRegisters = async () => {
    const meter = getSelectedMeter();
    if (!meter || !window.BT_API?.request) {
        registers = [];
        renderRegisters();
        return;
    }
    try {
        registers = await window.BT_API.request("GET", `/meters/${meter.id}/registers`);
        if (!Array.isArray(registers)) {
            registers = [];
        }
        renderRegisters();
    } catch (error) {
        setRegisterResult(error?.message || "Blad pobierania rejestrow.", "result--error");
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

const addRegister = async (payload) => {
    const meter = getSelectedMeter();
    if (!meter) {
        setRegisterResult("Najpierw wybierz miernik.", "result--error");
        return;
    }
    if (!window.BT_API?.request) {
        setRegisterResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setRegisterResult("Dodawanie rejestru...", null);
    try {
        await window.BT_API.request("POST", `/meters/${meter.id}/registers`, payload);
        await fetchRegisters();
        setRegisterResult("Rejestr dodany.", "result--success");
    } catch (error) {
        setRegisterResult(error?.message || "Blad zapisu rejestru.", "result--error");
    }
};

const removeRegister = async (id) => {
    const meter = getSelectedMeter();
    if (!meter) {
        return;
    }
    if (!window.BT_API?.request) {
        setRegisterResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setRegisterResult("Usuwanie rejestru...", null);
    try {
        await window.BT_API.request("DELETE", `/meters/${meter.id}/registers/${id}`);
        await fetchRegisters();
        setRegisterResult("Rejestr usuniety.", "result--success");
    } catch (error) {
        setRegisterResult(error?.message || "Blad usuwania rejestru.", "result--error");
    }
};

if (meterForm) {
    meterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(meterForm);
        const name = String(formData.get("name") || "").trim();
        const deviceCode = String(formData.get("deviceCode") || "").trim();
        const serialPort = String(formData.get("serialPort") || "").trim();
        const baudRate = Number(formData.get("baudRate") || 0);
        const parity = String(formData.get("parity") || "NONE");
        const stopBits = Number(formData.get("stopBits") || 1);
        const slaveId = Number(formData.get("slaveId") || 0);
        const pollIntervalMs = Number(formData.get("pollIntervalMs") || 1000);
        const enabled = String(formData.get("enabled") || "1") === "1";

        if (!name || !deviceCode || !serialPort || !baudRate || !slaveId) {
            setMeterResult("Uzupelnij wymagane pola miernika.", "result--error");
            return;
        }

        addMeter({
            name,
            deviceCode,
            serialPort,
            baudRate,
            parity,
            stopBits,
            slaveId,
            pollIntervalMs,
            enabled
        });

        meterForm.reset();
        meterForm.querySelector("[name=baudRate]").value = "9600";
        meterForm.querySelector("[name=pollIntervalMs]").value = "1000";
        meterForm.querySelector("[name=slaveId]").value = "1";
        meterForm.querySelector("[name=parity]").value = "NONE";
        meterForm.querySelector("[name=stopBits]").value = "1";
        meterForm.querySelector("[name=enabled]").value = "1";
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const name = String(formData.get("name") || "").trim();
        const registerType = String(formData.get("registerType") || "INPUT");
        const address = Number(formData.get("address") || 0);
        const length = Number(formData.get("length") || 1);
        const dataType = String(formData.get("dataType") || "INT16");
        const scale = Number(formData.get("scale") || 1);
        const unit = String(formData.get("unit") || "").trim();
        const orderIndex = Number(formData.get("orderIndex") || 0);
        const enabled = String(formData.get("enabled") || "1") === "1";

        if (!name) {
            setRegisterResult("Pole 'Nazwa' jest wymagane.", "result--error");
            return;
        }

        addRegister({
            name,
            registerType,
            address,
            length,
            dataType,
            scale,
            unit,
            orderIndex,
            enabled
        });

        registerForm.reset();
        registerForm.querySelector("[name=address]").value = "0";
        registerForm.querySelector("[name=length]").value = "2";
        registerForm.querySelector("[name=scale]").value = "1";
        registerForm.querySelector("[name=orderIndex]").value = "0";
        registerForm.querySelector("[name=registerType]").value = "INPUT";
        registerForm.querySelector("[name=dataType]").value = "FLOAT32";
        registerForm.querySelector("[name=enabled]").value = "1";
    });
}

fetchTransformers();
