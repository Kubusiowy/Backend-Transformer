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

const save = () => {
    if (window.BTData) {
        window.BTData.saveTransformers(allTransformers);
    }
};

const getSelectedTransformer = () => {
    const visible = getVisibleTransformers();
    return window.BTData ? window.BTData.getSelectedTransformer(visible) : null;
};

const getSelectedMeter = () => {
    const visible = getVisibleTransformers();
    if (!window.BTData) {
        return null;
    }
    const meter = window.BTData.getSelectedMeter(visible);
    if (!meter) {
        return null;
    }
    const selected = getSelectedTransformer();
    if (selected && window.BTData.getSelectedMeterInfo()?.transformerId !== selected.id) {
        window.BTData.setSelectedMeterInfo(selected.id, meter.id);
    }
    return meter;
};

const setSelectedMeter = (id) => {
    const selected = getSelectedTransformer();
    if (!selected || !window.BTData) {
        return;
    }
    window.BTData.setSelectedMeterInfo(selected.id, id);
    renderMeters();
    renderRegisters();
};

const updateMeterDetail = () => {
    const meter = getSelectedMeter();
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
    allTransformers = window.BTData ? window.BTData.loadTransformers() : [];
    const selected = getSelectedTransformer();
    const meters = selected ? selected.meters || [] : [];

    meterList.innerHTML = "";

    if (!selected) {
        meterEmpty.textContent = "Najpierw wybierz transformator w sekcji Transformatory.";
        meterEmpty.style.display = "block";
        meterList.style.display = "none";
        if (meterContext) {
            meterContext.textContent = "Wybierz transformator, aby dodac miernik.";
        }
        updateMeterDetail();
        toggleForms(false, false);
        return;
    }

    if (meterContext) {
        meterContext.textContent = `Dodajesz miernik do: ${selected.name}`;
    }

    toggleForms(true, Boolean(getSelectedMeter()));

    if (!meters.length) {
        meterEmpty.textContent = "Brak miernikow. Dodaj pierwszy wpis powyzej.";
        meterEmpty.style.display = "block";
        meterList.style.display = "none";
    } else {
        meterEmpty.style.display = "none";
        meterList.style.display = "grid";
    }

    meters.forEach((meter) => {
        const item = document.createElement("div");
        item.className = "list__item";
        const info = window.BTData.getSelectedMeterInfo();
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
        const regTag = document.createElement("span");
        regTag.className = "tag";
        regTag.textContent = `${meter.registers?.length || 0} rejestrow`;
        tags.append(regTag);

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "btn btn--ghost btn--small";
        selectBtn.textContent = "Wybierz";
        selectBtn.addEventListener("click", () => setSelectedMeter(meter.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn--ghost btn--small";
        deleteBtn.textContent = "Usun";
        deleteBtn.addEventListener("click", () => removeMeter(meter.id));

        actions.append(selectBtn, deleteBtn);
        item.append(main, actions);
        meterList.append(item);
    });

    updateMeterDetail();
};

const renderRegisters = () => {
    if (!registerList || !registerEmpty) {
        return;
    }
    const meter = getSelectedMeter();
    registerList.innerHTML = "";

    if (!meter) {
        registerEmpty.textContent = "Wybierz miernik, aby dodac rejestry.";
        registerEmpty.style.display = "block";
        registerList.style.display = "none";
        if (registerContext) {
            registerContext.textContent = "Wybierz miernik, aby dodac rejestr.";
        }
        updateMeterDetail();
        return;
    }

    if (registerContext) {
        registerContext.textContent = `Dodajesz rejestr do: ${meter.name}`;
    }

    if (!meter.registers?.length) {
        registerEmpty.style.display = "block";
        registerList.style.display = "none";
    } else {
        registerEmpty.style.display = "none";
        registerList.style.display = "grid";
    }

    meter.registers.forEach((register) => {
        const item = document.createElement("div");
        item.className = "list__item";

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = register.name;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        meta.textContent = `${register.registerType} ${register.address} (${register.dataType}) | len ${register.length} | x${register.scale}`;

        const tags = document.createElement("div");
        tags.className = "list__tags";
        const unitTag = document.createElement("span");
        unitTag.className = "tag";
        unitTag.textContent = register.unit ? register.unit : "brak jednostki";
        tags.append(unitTag);
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

    updateMeterDetail();
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

const addMeter = (payload) => {
    const selected = getSelectedTransformer();
    if (!selected) {
        setMeterResult("Najpierw wybierz transformator.", "result--error");
        return;
    }
    if (!isAdmin && selected.userId !== currentUserId) {
        setMeterResult("Brak uprawnien do cudzych transformatorow.", "result--error");
        return;
    }
    const meter = {
        id: window.BTData.safeId(),
        name: payload.name,
        deviceCode: payload.deviceCode,
        enabled: payload.enabled,
        serialPort: payload.serialPort,
        baudRate: payload.baudRate,
        parity: payload.parity,
        stopBits: payload.stopBits,
        slaveId: payload.slaveId,
        pollIntervalMs: payload.pollIntervalMs,
        registers: []
    };
    selected.meters.unshift(meter);
    save();
    window.BTData.setSelectedMeterInfo(selected.id, meter.id);
    renderMeters();
    renderRegisters();
    setMeterResult("Miernik dodany.", "result--success");
};

const removeMeter = (id) => {
    const selected = getSelectedTransformer();
    if (!selected) {
        return;
    }
    if (!isAdmin && selected.userId !== currentUserId) {
        setMeterResult("Brak uprawnien do cudzych transformatorow.", "result--error");
        return;
    }
    selected.meters = (selected.meters || []).filter((meter) => meter.id !== id);
    save();
    window.BTData.setSelectedMeterInfo(selected.id, selected.meters[0]?.id || null);
    renderMeters();
    renderRegisters();
    setMeterResult("Miernik usuniety.", "result--success");
};

const addRegister = (payload) => {
    const meter = getSelectedMeter();
    const selected = getSelectedTransformer();
    if (!meter || !selected) {
        setRegisterResult("Najpierw wybierz miernik.", "result--error");
        return;
    }
    if (!isAdmin && selected.userId !== currentUserId) {
        setRegisterResult("Brak uprawnien do cudzych transformatorow.", "result--error");
        return;
    }
    const register = {
        id: window.BTData.safeId(),
        name: payload.name,
        registerType: payload.registerType,
        address: payload.address,
        length: payload.length,
        dataType: payload.dataType,
        scale: payload.scale,
        unit: payload.unit,
        enabled: payload.enabled,
        orderIndex: payload.orderIndex
    };
    meter.registers.unshift(register);
    save();
    renderRegisters();
    setRegisterResult("Rejestr dodany.", "result--success");
};

const removeRegister = (id) => {
    const meter = getSelectedMeter();
    const selected = getSelectedTransformer();
    if (!meter || !selected) {
        return;
    }
    if (!isAdmin && selected.userId !== currentUserId) {
        setRegisterResult("Brak uprawnien do cudzych transformatorow.", "result--error");
        return;
    }
    meter.registers = (meter.registers || []).filter((reg) => reg.id !== id);
    save();
    renderRegisters();
    setRegisterResult("Rejestr usuniety.", "result--success");
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

renderMeters();
renderRegisters();
ensureSelectedVisible();
if (!getVisibleTransformers().length) {
    setMeterResult("Brak danych. Dodaj transformator w sekcji Transformatory.", null);
}
