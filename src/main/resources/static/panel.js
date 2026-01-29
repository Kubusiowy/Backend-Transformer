const logoutBtn = document.getElementById("logoutBtn");
const navButtons = document.querySelectorAll("[data-nav]");
const pageSections = document.querySelectorAll(".page-section");
const roleLabel = document.getElementById("userRoleLabel");

const addForm = document.getElementById("addTransformerForm");
const transformerResult = document.getElementById("transformerResult");
const transformerResultBody = document.getElementById("transformerResultBody");
const transformerList = document.getElementById("transformerList");
const transformerEmpty = document.getElementById("transformerEmpty");
const seedSamplesBtn = document.getElementById("seedSamples");
const readNowBtn = document.getElementById("readNow");
const deleteSelectedBtn = document.getElementById("deleteSelected");

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

const detailName = document.getElementById("detailName");
const detailLocation = document.getElementById("detailLocation");
const detailSerial = document.getElementById("detailSerial");
const detailPower = document.getElementById("detailPower");
const detailNote = document.getElementById("detailNote");

const detailMeterName = document.getElementById("detailMeterName");
const detailMeterDevice = document.getElementById("detailMeterDevice");
const detailMeterPort = document.getElementById("detailMeterPort");
const detailMeterSlave = document.getElementById("detailMeterSlave");

const metricVoltage = document.getElementById("metricVoltage");
const metricTemp = document.getElementById("metricTemp");
const metricLoad = document.getElementById("metricLoad");
const metricTime = document.getElementById("metricTime");

const statTransformers = document.getElementById("statTransformers");
const statMeters = document.getElementById("statMeters");
const statRegisters = document.getElementById("statRegisters");
const statLastRead = document.getElementById("statLastRead");

const adminNotice = document.getElementById("adminNotice");
const adminActions = document.getElementById("adminActions");
const adminTransformers = document.getElementById("adminTransformers");
const adminMeters = document.getElementById("adminMeters");
const adminRegisters = document.getElementById("adminRegisters");
const adminSeedBtn = document.getElementById("adminSeed");
const adminWipeBtn = document.getElementById("adminWipe");

const STORAGE = {
    refresh: "bt_refresh_token",
    access: "bt_access_token",
    user: "bt_user_id",
    role: "bt_role",
    transformers: "bt_transformers",
    selected: "bt_transformer_selected",
    meterSelected: "bt_meter_selected"
};

const AUTO_REFRESH_SECONDS = 600;

let accessToken = sessionStorage.getItem(STORAGE.access) || null;
let refreshToken = localStorage.getItem(STORAGE.refresh) || null;
let userId = localStorage.getItem(STORAGE.user) || null;
let role = localStorage.getItem(STORAGE.role) || "user";
let isAdmin = role === "admin";

let transformers = [];
let selectedId = localStorage.getItem(STORAGE.selected) || null;
let selectedMeterId = null;
let refreshTimer = null;

const setRoleLabel = () => {
    if (roleLabel) {
        roleLabel.textContent = `Rola: ${role}`;
    }
};

const setPage = (page) => {
    pageSections.forEach((section) => {
        section.classList.toggle("is-active", section.dataset.page === page);
    });
    navButtons.forEach((btn) => {
        const isActive = btn.dataset.nav === page;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
    sessionStorage.setItem("bt_panel_page", page);
};

navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        if (target === "admin" && !isAdmin) {
            setPage("dashboard");
            return;
        }
        setPage(target);
    });
});

const safeId = () => {
    if (crypto && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const setTransformerResult = (message, state) => {
    transformerResultBody.textContent = message;
    transformerResult.classList.remove("result--success", "result--error");
    if (state) {
        transformerResult.classList.add(state);
    }
};

const setMeterResult = (message, state) => {
    meterResultBody.textContent = message;
    meterResult.classList.remove("result--success", "result--error");
    if (state) {
        meterResult.classList.add(state);
    }
};

const setRegisterResult = (message, state) => {
    registerResultBody.textContent = message;
    registerResult.classList.remove("result--success", "result--error");
    if (state) {
        registerResult.classList.add(state);
    }
};

const request = async (url, payload) => {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = data?.message || "Blad serwera.";
        throw new Error(message);
    }
    return data;
};

const refreshAccessToken = async () => {
    if (!refreshToken) {
        return false;
    }
    try {
        const response = await request("/auth/refresh", { refreshToken });
        const nextAccess = response?.accessToken || null;
        if (!nextAccess) {
            throw new Error("Brak access tokenu w odpowiedzi.");
        }
        accessToken = nextAccess;
        sessionStorage.setItem(STORAGE.access, nextAccess);
        return true;
    } catch (error) {
        sessionStorage.setItem("bt_login_notice", "Sesja wygasla. Zaloguj sie ponownie.");
        window.location.href = "/static/index.html";
        return false;
    }
};

const startSilentRefresh = async () => {
    if (!refreshToken) {
        return;
    }
    await refreshAccessToken();
    refreshTimer = setInterval(() => {
        refreshAccessToken();
    }, AUTO_REFRESH_SECONDS * 1000);
};

const handleLogout = () => {
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
    localStorage.removeItem(STORAGE.role);
    sessionStorage.removeItem(STORAGE.access);
    accessToken = null;
    refreshToken = null;
    userId = null;
    role = "user";
    isAdmin = false;
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    window.location.href = "/static/index.html";
};

const normalizeMeter = (meter) => ({
    id: meter.id,
    name: meter.name,
    deviceCode: meter.deviceCode,
    enabled: meter.enabled !== false,
    serialPort: meter.serialPort,
    baudRate: meter.baudRate,
    parity: meter.parity || "NONE",
    stopBits: meter.stopBits || 1,
    slaveId: meter.slaveId,
    pollIntervalMs: meter.pollIntervalMs || 1000,
    registers: Array.isArray(meter.registers) ? meter.registers : []
});

const normalizeTransformer = (transformer) => ({
    ...transformer,
    meters: Array.isArray(transformer.meters) ? transformer.meters.map(normalizeMeter) : []
});

const loadTransformers = () => {
    try {
        const raw = localStorage.getItem(STORAGE.transformers);
        const parsed = raw ? JSON.parse(raw) : [];
        transformers = parsed.map(normalizeTransformer);
    } catch (error) {
        transformers = [];
    }
};

const saveTransformers = () => {
    localStorage.setItem(STORAGE.transformers, JSON.stringify(transformers));
};

const countMeters = () => transformers.reduce((sum, transformer) => sum + (transformer.meters?.length || 0), 0);

const countRegisters = () =>
    transformers.reduce(
        (sum, transformer) =>
            sum + (transformer.meters || []).reduce((inner, meter) => inner + (meter.registers?.length || 0), 0),
        0
    );

const updateStats = () => {
    if (statTransformers) {
        statTransformers.textContent = String(transformers.length);
    }
    if (statMeters) {
        statMeters.textContent = String(countMeters());
    }
    if (statRegisters) {
        statRegisters.textContent = String(countRegisters());
    }
    if (adminTransformers) {
        adminTransformers.textContent = String(transformers.length);
    }
    if (adminMeters) {
        adminMeters.textContent = String(countMeters());
    }
    if (adminRegisters) {
        adminRegisters.textContent = String(countRegisters());
    }
};

const updateEmptyState = () => {
    if (!transformers.length) {
        transformerEmpty.style.display = "block";
        transformerList.style.display = "none";
    } else {
        transformerEmpty.style.display = "none";
        transformerList.style.display = "grid";
    }
};

const renderTransformers = () => {
    transformerList.innerHTML = "";
    transformers.forEach((transformer) => {
        const item = document.createElement("div");
        item.className = "list__item";
        if (transformer.id === selectedId) {
            item.classList.add("list__item--active");
        }

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = transformer.name;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        meta.textContent = transformer.location || "Brak lokalizacji";

        const tags = document.createElement("div");
        tags.className = "list__tags";
        if (transformer.power) {
            const tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = `${transformer.power} kVA`;
            tags.append(tag);
        }
        if (transformer.serial) {
            const tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = transformer.serial;
            tags.append(tag);
        }
        const meterTag = document.createElement("span");
        meterTag.className = "tag";
        meterTag.textContent = `${transformer.meters?.length || 0} miernikow`;
        tags.append(meterTag);

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "btn btn--ghost btn--small";
        selectBtn.textContent = "Wybierz";
        selectBtn.addEventListener("click", () => setSelected(transformer.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn--ghost btn--small";
        deleteBtn.textContent = "Usun";
        deleteBtn.addEventListener("click", () => removeTransformer(transformer.id));

        actions.append(selectBtn, deleteBtn);
        item.append(main, actions);
        transformerList.append(item);
    });

    updateEmptyState();
    updateStats();
};

const setSelected = (id) => {
    selectedId = id;
    localStorage.setItem(STORAGE.selected, id);
    renderTransformers();
    updateSelectedDetail();
    syncSelectedMeter();
    renderMeters();
    renderRegisters();
};

const getSelected = () => transformers.find((t) => t.id === selectedId) || null;

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
        setTransformerResult("Najpierw wybierz transformator z listy.", "result--error");
        return;
    }
    const metrics = generateMetrics();
    metricVoltage.textContent = metrics.voltage;
    metricTemp.textContent = metrics.temp;
    metricLoad.textContent = metrics.load;
    metricTime.textContent = metrics.time;
    if (statLastRead) {
        statLastRead.textContent = metrics.time;
    }
    setTransformerResult("Odczyt wykonany.", "result--success");
};

const removeTransformer = (id) => {
    const selected = transformers.find((t) => t.id === id);
    transformers = transformers.filter((t) => t.id !== id);
    if (selectedId === id) {
        selectedId = null;
        localStorage.removeItem(STORAGE.selected);
        updateSelectedDetail();
        clearMetrics();
    }
    saveTransformers();
    renderTransformers();
    renderMeters();
    renderRegisters();
    if (selected) {
        setTransformerResult("Transformator usuniety.", "result--success");
    }
};

const addTransformer = (payload) => {
    const transformer = {
        id: safeId(),
        name: payload.name,
        location: payload.location || "",
        serial: payload.serial || "",
        power: payload.power || "",
        note: payload.note || "",
        createdAt: new Date().toISOString(),
        meters: []
    };
    transformers.unshift(transformer);
    saveTransformers();
    renderTransformers();
    setSelected(transformer.id);
    setTransformerResult("Transformator dodany.", "result--success");
};

const getSelectedMeters = () => {
    const selected = getSelected();
    if (!selected) {
        return [];
    }
    if (!Array.isArray(selected.meters)) {
        selected.meters = [];
    }
    return selected.meters;
};

const setFormEnabled = (form, enabled) => {
    if (!form) {
        return;
    }
    form.querySelectorAll("input, select, button").forEach((field) => {
        field.disabled = !enabled;
    });
};

const syncSelectedMeter = () => {
    const selected = getSelected();
    if (!selected) {
        selectedMeterId = null;
        localStorage.removeItem(STORAGE.meterSelected);
        return;
    }
    const raw = localStorage.getItem(STORAGE.meterSelected);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.transformerId === selected.id) {
                selectedMeterId = parsed.meterId;
            }
        } catch (error) {
            selectedMeterId = null;
        }
    }
    const meters = getSelectedMeters();
    if (!meters.find((meter) => meter.id === selectedMeterId)) {
        selectedMeterId = meters.length ? meters[0].id : null;
    }
    if (selectedMeterId) {
        localStorage.setItem(
            STORAGE.meterSelected,
            JSON.stringify({ transformerId: selected.id, meterId: selectedMeterId })
        );
    } else {
        localStorage.removeItem(STORAGE.meterSelected);
    }
    updateSelectedMeterDetail();
};

const setSelectedMeter = (id) => {
    const selected = getSelected();
    if (!selected) {
        return;
    }
    selectedMeterId = id;
    localStorage.setItem(STORAGE.meterSelected, JSON.stringify({ transformerId: selected.id, meterId: id }));
    renderMeters();
    renderRegisters();
};

const getSelectedMeter = () => {
    const meters = getSelectedMeters();
    return meters.find((meter) => meter.id === selectedMeterId) || null;
};

const updateSelectedMeterDetail = () => {
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
    const selected = getSelected();
    const meters = getSelectedMeters();
    meterList.innerHTML = "";

    if (!selected) {
        meterEmpty.textContent = "Najpierw wybierz transformator w sekcji Transformatory.";
        meterEmpty.style.display = "block";
        meterList.style.display = "none";
        setFormEnabled(meterForm, false);
        setFormEnabled(registerForm, false);
        if (meterContext) {
            meterContext.textContent = "Wybierz transformator, aby dodac miernik.";
        }
        updateSelectedMeterDetail();
        return;
    }

    if (meterContext) {
        meterContext.textContent = `Dodajesz miernik do: ${selected.name}`;
    }
    setFormEnabled(meterForm, true);

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
        if (meter.id === selectedMeterId) {
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

    updateSelectedMeterDetail();
    updateStats();
};

const removeMeter = (id) => {
    const selected = getSelected();
    if (!selected) {
        return;
    }
    selected.meters = (selected.meters || []).filter((meter) => meter.id !== id);
    if (selectedMeterId === id) {
        selectedMeterId = null;
        localStorage.removeItem(STORAGE.meterSelected);
    }
    saveTransformers();
    renderMeters();
    renderRegisters();
    setMeterResult("Miernik usuniety.", "result--success");
};

const renderRegisters = () => {
    const meter = getSelectedMeter();
    registerList.innerHTML = "";

    if (!meter) {
        registerEmpty.textContent = "Wybierz miernik, aby dodac rejestry.";
        registerEmpty.style.display = "block";
        registerList.style.display = "none";
        setFormEnabled(registerForm, false);
        if (registerContext) {
            registerContext.textContent = "Wybierz miernik, aby dodac rejestr.";
        }
        updateSelectedMeterDetail();
        return;
    }

    if (registerContext) {
        registerContext.textContent = `Dodajesz rejestr do: ${meter.name}`;
    }
    setFormEnabled(registerForm, true);

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

    updateStats();
};

const removeRegister = (id) => {
    const meter = getSelectedMeter();
    if (!meter) {
        return;
    }
    meter.registers = (meter.registers || []).filter((register) => register.id !== id);
    saveTransformers();
    renderRegisters();
    setRegisterResult("Rejestr usuniety.", "result--success");
};

addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(addForm);
    const name = String(formData.get("name") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const serial = String(formData.get("serial") || "").trim();
    const power = String(formData.get("power") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!name) {
        setTransformerResult("Pole 'Nazwa' jest wymagane.", "result--error");
        return;
    }

    addTransformer({ name, location, serial, power, note });
    addForm.reset();
});

meterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = getSelected();
    if (!selected) {
        setMeterResult("Najpierw wybierz transformator.", "result--error");
        return;
    }

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

    const meter = {
        id: safeId(),
        name,
        deviceCode,
        enabled,
        serialPort,
        baudRate,
        parity,
        stopBits,
        slaveId,
        pollIntervalMs,
        registers: []
    };

    selected.meters.unshift(meter);
    saveTransformers();
    setSelectedMeter(meter.id);
    renderMeters();
    renderRegisters();
    setMeterResult("Miernik dodany.", "result--success");
    meterForm.reset();
    meterForm.querySelector("[name=baudRate]").value = "9600";
    meterForm.querySelector("[name=pollIntervalMs]").value = "1000";
    meterForm.querySelector("[name=slaveId]").value = "1";
    meterForm.querySelector("[name=parity]").value = "NONE";
    meterForm.querySelector("[name=stopBits]").value = "1";
    meterForm.querySelector("[name=enabled]").value = "1";
});

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const meter = getSelectedMeter();
    if (!meter) {
        setRegisterResult("Najpierw wybierz miernik.", "result--error");
        return;
    }

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

    const register = {
        id: safeId(),
        name,
        registerType,
        address,
        length,
        dataType,
        scale,
        unit,
        enabled,
        orderIndex
    };

    meter.registers.unshift(register);
    saveTransformers();
    renderRegisters();
    setRegisterResult("Rejestr dodany.", "result--success");
    registerForm.reset();
    registerForm.querySelector("[name=address]").value = "0";
    registerForm.querySelector("[name=length]").value = "2";
    registerForm.querySelector("[name=scale]").value = "1";
    registerForm.querySelector("[name=orderIndex]").value = "0";
    registerForm.querySelector("[name=registerType]").value = "INPUT";
    registerForm.querySelector("[name=dataType]").value = "FLOAT32";
    registerForm.querySelector("[name=enabled]").value = "1";
});

seedSamplesBtn.addEventListener("click", () => {
    if (transformers.length) {
        setTransformerResult("Lista nie jest pusta. Dodaj recznie lub usun istniejece.", "result--error");
        return;
    }
    const samples = [
        {
            id: safeId(),
            name: "Stacja Polnoc 12",
            location: "Warszawa, ul. Przemyslowa 8",
            serial: "TR-2025-0001",
            power: "630",
            note: "Regularna kontrola raz w miesiacu",
            createdAt: new Date().toISOString(),
            meters: [
                {
                    id: safeId(),
                    name: "Miernik glowny",
                    deviceCode: "MTR-001",
                    enabled: true,
                    serialPort: "/dev/ttyUSB0",
                    baudRate: 9600,
                    parity: "NONE",
                    stopBits: 1,
                    slaveId: 1,
                    pollIntervalMs: 1000,
                    registers: [
                        {
                            id: safeId(),
                            name: "Napiecie L1",
                            registerType: "INPUT",
                            address: 0,
                            length: 2,
                            dataType: "FLOAT32",
                            scale: 1,
                            unit: "kV",
                            enabled: true,
                            orderIndex: 0
                        }
                    ]
                }
            ]
        },
        {
            id: safeId(),
            name: "Magazyn Zachod",
            location: "Lodz, ul. Kolejowa 4",
            serial: "TR-2025-0002",
            power: "1000",
            note: "Nowa instalacja",
            createdAt: new Date().toISOString(),
            meters: [
                {
                    id: safeId(),
                    name: "Miernik pomocniczy",
                    deviceCode: "MTR-002",
                    enabled: true,
                    serialPort: "/dev/ttyUSB1",
                    baudRate: 19200,
                    parity: "EVEN",
                    stopBits: 1,
                    slaveId: 2,
                    pollIntervalMs: 1500,
                    registers: []
                }
            ]
        }
    ];
    transformers = samples.map(normalizeTransformer);
    saveTransformers();
    renderTransformers();
    setSelected(samples[0].id);
    setTransformerResult("Wczytano przykladowe dane.", "result--success");
});

readNowBtn.addEventListener("click", () => readMetrics());

deleteSelectedBtn.addEventListener("click", () => {
    const selected = getSelected();
    if (!selected) {
        setTransformerResult("Brak zaznaczonego transformatora.", "result--error");
        return;
    }
    removeTransformer(selected.id);
});

if (adminSeedBtn) {
    adminSeedBtn.addEventListener("click", () => {
        if (!isAdmin) {
            return;
        }
        seedSamplesBtn.click();
    });
}

if (adminWipeBtn) {
    adminWipeBtn.addEventListener("click", () => {
        if (!isAdmin) {
            return;
        }
        transformers = [];
        selectedId = null;
        selectedMeterId = null;
        localStorage.removeItem(STORAGE.transformers);
        localStorage.removeItem(STORAGE.selected);
        localStorage.removeItem(STORAGE.meterSelected);
        renderTransformers();
        renderMeters();
        renderRegisters();
        updateSelectedDetail();
        clearMetrics();
        setTransformerResult("Wyczyszczono dane.", "result--success");
    });
}

logoutBtn.addEventListener("click", () => handleLogout());

if (!refreshToken) {
    sessionStorage.setItem("bt_login_notice", "Aby wejsc do panelu, zaloguj sie.");
    window.location.href = "/static/index.html";
} else {
    startSilentRefresh();
}

const initRole = () => {
    role = localStorage.getItem(STORAGE.role) || "user";
    isAdmin = role === "admin";
    setRoleLabel();

    const adminTab = document.querySelector('[data-nav="admin"]');
    if (!isAdmin && adminTab) {
        adminTab.style.display = "none";
    }

    if (adminNotice) {
        adminNotice.textContent = isAdmin
            ? "Masz dostep administracyjny. Mozesz zarzadzac wszystkimi danymi."
            : "Brak uprawnien administracyjnych. Popros o role admin.";
    }

    if (adminActions) {
        adminActions.style.display = isAdmin ? "grid" : "none";
    }
};

const initialPage = sessionStorage.getItem("bt_panel_page") || "dashboard";
setPage(initialPage);

initRole();
loadTransformers();
renderTransformers();
updateSelectedDetail();
clearMetrics();
renderMeters();
renderRegisters();
updateStats();

if (!transformers.length) {
    setTransformerResult("Czekam na dane.", null);
}
