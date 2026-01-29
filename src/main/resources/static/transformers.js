const addForm = document.getElementById("addTransformerForm");
const transformerResult = document.getElementById("transformerResult");
const transformerResultBody = document.getElementById("transformerResultBody");
const transformerList = document.getElementById("transformerList");
const transformerEmpty = document.getElementById("transformerEmpty");
const refreshBtn = document.getElementById("refreshList");

const auth = window.BT_AUTH || {};
const isAdmin = Boolean(auth.isAdmin);

let transformers = [];
let meterCounts = {};

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

const getSelectedId = () => (window.BTData ? window.BTData.getSelectedId() : null);

const setSelectedId = (id) => {
    if (window.BTData) {
        window.BTData.setSelectedId(id);
        window.BTData.setSelectedMeterInfo(null, null);
    }
};

const ensureSelectedVisible = () => {
    const selectedId = getSelectedId();
    if (!selectedId) {
        return;
    }
    const exists = transformers.some((t) => t.id === selectedId);
    if (!exists) {
        setSelectedId(null);
    }
};

const renderTransformers = () => {
    if (!transformerList || !transformerEmpty) {
        return;
    }
    transformerList.innerHTML = "";

    if (!transformers.length) {
        transformerEmpty.style.display = "block";
        transformerList.style.display = "none";
        return;
    }

    transformerEmpty.style.display = "none";
    transformerList.style.display = "grid";

    const selectedId = getSelectedId();

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

        const meterTag = document.createElement("span");
        meterTag.className = "tag";
        const count = meterCounts[transformer.id];
        meterTag.textContent = `Mierniki: ${typeof count === "number" ? count : "..."}`;
        tags.append(meterTag);

        const idTag = document.createElement("span");
        idTag.className = "tag";
        idTag.textContent = transformer.id;
        tags.append(idTag);

        if (isAdmin) {
            const ownerTag = document.createElement("span");
            ownerTag.className = "tag";
            ownerTag.textContent = transformer.userId || "brak ownera";
            tags.append(ownerTag);
        }

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "btn btn--ghost btn--small";
        selectBtn.textContent = "Wybierz";
        selectBtn.addEventListener("click", () => {
            setSelectedId(transformer.id);
            renderTransformers();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn--ghost btn--small";
        deleteBtn.textContent = "Usun";
        deleteBtn.addEventListener("click", () => removeTransformer(transformer.id));

        actions.append(selectBtn, deleteBtn);
        item.append(main, actions);
        transformerList.append(item);
    });
};

const loadMeterCounts = async () => {
    if (!window.BT_API?.request) {
        return;
    }
    const counts = {};
    await Promise.all(
        transformers.map(async (transformer) => {
            try {
                const meters = await window.BT_API.request("GET", `/transformers/${transformer.id}/meters`);
                counts[transformer.id] = Array.isArray(meters) ? meters.length : 0;
            } catch (error) {
                counts[transformer.id] = 0;
            }
        })
    );
    meterCounts = counts;
    renderTransformers();
};

const fetchTransformers = async () => {
    if (!window.BT_API?.request) {
        setResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setResult("Pobieram dane...", null);
    try {
        const data = await window.BT_API.request("GET", "/transformers");
        transformers = Array.isArray(data) ? data : [];
        ensureSelectedVisible();
        renderTransformers();
        loadMeterCounts();
        setResult("Lista transformatorow zaktualizowana.", "result--success");
    } catch (error) {
        setResult(error?.message || "Blad pobierania danych.", "result--error");
    }
};

const addTransformer = async (payload) => {
    if (!window.BT_API?.request) {
        setResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setResult("Dodawanie transformatora...", null);
    try {
        const created = await window.BT_API.request("POST", "/transformers", payload);
        if (created) {
            transformers.unshift(created);
            setSelectedId(created.id);
        }
        renderTransformers();
        loadMeterCounts();
        setResult("Transformator dodany.", "result--success");
    } catch (error) {
        setResult(error?.message || "Blad zapisu.", "result--error");
    }
};

const removeTransformer = async (id) => {
    if (!window.BT_API?.request) {
        setResult("Brak konfiguracji API.", "result--error");
        return;
    }
    setResult("Usuwanie transformatora...", null);
    try {
        await window.BT_API.request("DELETE", `/transformers/${id}`);
        transformers = transformers.filter((t) => t.id !== id);
        if (getSelectedId() === id) {
            setSelectedId(null);
        }
        renderTransformers();
        loadMeterCounts();
        setResult("Transformator usuniety.", "result--success");
    } catch (error) {
        setResult(error?.message || "Blad usuwania.", "result--error");
    }
};

if (addForm) {
    addForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(addForm);
        const name = String(formData.get("name") || "").trim();
        const location = String(formData.get("location") || "").trim();

        if (!name) {
            setResult("Pole 'Nazwa' jest wymagane.", "result--error");
            return;
        }

        addTransformer({ name, location: location || null });
        addForm.reset();
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener("click", () => fetchTransformers());
}

fetchTransformers();
