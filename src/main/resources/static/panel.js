const logoutBtn = document.getElementById("logoutBtn");

const addForm = document.getElementById("addTransformerForm");
const transformerResult = document.getElementById("transformerResult");
const transformerResultBody = document.getElementById("transformerResultBody");
const transformerList = document.getElementById("transformerList");
const transformerEmpty = document.getElementById("transformerEmpty");
const seedSamplesBtn = document.getElementById("seedSamples");
const readNowBtn = document.getElementById("readNow");
const deleteSelectedBtn = document.getElementById("deleteSelected");

const detailName = document.getElementById("detailName");
const detailLocation = document.getElementById("detailLocation");
const detailSerial = document.getElementById("detailSerial");
const detailPower = document.getElementById("detailPower");
const detailNote = document.getElementById("detailNote");

const metricVoltage = document.getElementById("metricVoltage");
const metricTemp = document.getElementById("metricTemp");
const metricLoad = document.getElementById("metricLoad");
const metricTime = document.getElementById("metricTime");

const STORAGE = {
    refresh: "bt_refresh_token",
    access: "bt_access_token",
    user: "bt_user_id",
    transformers: "bt_transformers",
    selected: "bt_transformer_selected"
};

const AUTO_REFRESH_SECONDS = 600;

let accessToken = sessionStorage.getItem(STORAGE.access) || null;
let refreshToken = localStorage.getItem(STORAGE.refresh) || null;
let userId = localStorage.getItem(STORAGE.user) || null;

let transformers = [];
let selectedId = localStorage.getItem(STORAGE.selected) || null;
let refreshTimer = null;

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
    sessionStorage.removeItem(STORAGE.access);
    accessToken = null;
    refreshToken = null;
    userId = null;
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    window.location.href = "/static/index.html";
};

const loadTransformers = () => {
    try {
        const raw = localStorage.getItem(STORAGE.transformers);
        transformers = raw ? JSON.parse(raw) : [];
    } catch (error) {
        transformers = [];
    }
};

const saveTransformers = () => {
    localStorage.setItem(STORAGE.transformers, JSON.stringify(transformers));
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
};

const setSelected = (id) => {
    selectedId = id;
    localStorage.setItem(STORAGE.selected, id);
    renderTransformers();
    updateSelectedDetail();
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
        createdAt: new Date().toISOString()
    };
    transformers.unshift(transformer);
    saveTransformers();
    renderTransformers();
    setSelected(transformer.id);
    setTransformerResult("Transformator dodany.", "result--success");
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
            createdAt: new Date().toISOString()
        },
        {
            id: safeId(),
            name: "Magazyn Zachod",
            location: "Lodz, ul. Kolejowa 4",
            serial: "TR-2025-0002",
            power: "1000",
            note: "Nowa instalacja",
            createdAt: new Date().toISOString()
        }
    ];
    transformers = samples;
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

logoutBtn.addEventListener("click", () => handleLogout());

if (!refreshToken) {
    sessionStorage.setItem("bt_login_notice", "Aby wejsc do panelu, zaloguj sie.");
    window.location.href = "/static/index.html";
} else {
    startSilentRefresh();
}

loadTransformers();
renderTransformers();
updateSelectedDetail();
clearMetrics();

if (!transformers.length) {
    setTransformerResult("Czekam na dane.", null);
}
