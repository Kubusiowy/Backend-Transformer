const addForm = document.getElementById("addTransformerForm");
const transformerResult = document.getElementById("transformerResult");
const transformerResultBody = document.getElementById("transformerResultBody");
const transformerList = document.getElementById("transformerList");
const transformerEmpty = document.getElementById("transformerEmpty");
const seedSamplesBtn = document.getElementById("seedSamples");

const auth = window.BT_AUTH || {};
const currentUserId = auth.userId || "(brak)";
const isAdmin = Boolean(auth.isAdmin);

let allTransformers = window.BTData ? window.BTData.loadTransformers() : [];
let selectedId = window.BTData ? window.BTData.getSelectedId() : null;

const getVisibleTransformers = () => (window.BTData ? window.BTData.getScopedTransformers(allTransformers) : []);

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

const saveAll = () => {
    if (window.BTData) {
        window.BTData.saveTransformers(allTransformers);
    }
};

const setSelected = (id) => {
    selectedId = id;
    if (window.BTData) {
        window.BTData.setSelectedId(id);
        window.BTData.setSelectedMeterInfo(null, null);
    }
    renderTransformers();
};

const ensureSelectedVisible = () => {
    const visible = getVisibleTransformers();
    if (!visible.find((t) => t.id === selectedId)) {
        setSelected(null);
    }
};

const renderTransformers = () => {
    if (!transformerList || !transformerEmpty) {
        return;
    }
    const visible = getVisibleTransformers();
    transformerList.innerHTML = "";

    if (!visible.length) {
        transformerEmpty.style.display = "block";
        transformerList.style.display = "none";
    } else {
        transformerEmpty.style.display = "none";
        transformerList.style.display = "grid";
    }

    visible.forEach((transformer) => {
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
};

const addTransformer = (payload) => {
    const transformer = {
        id: window.BTData ? window.BTData.safeId() : String(Date.now()),
        userId: currentUserId,
        name: payload.name,
        location: payload.location || "",
        serial: payload.serial || "",
        power: payload.power || "",
        note: payload.note || "",
        createdAt: new Date().toISOString(),
        meters: []
    };
    allTransformers.unshift(transformer);
    saveAll();
    setSelected(transformer.id);
    setResult("Transformator dodany.", "result--success");
};

const removeTransformer = (id) => {
    const transformer = allTransformers.find((t) => t.id === id);
    if (!transformer) {
        return;
    }
    if (!isAdmin && transformer.userId !== currentUserId) {
        setResult("Brak uprawnien do usuwania cudzych transformatorow.", "result--error");
        return;
    }
    allTransformers = allTransformers.filter((t) => t.id !== id);
    if (selectedId === id) {
        setSelected(null);
    }
    saveAll();
    renderTransformers();
    setResult("Transformator usuniety.", "result--success");
};

if (addForm) {
    addForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(addForm);
        const name = String(formData.get("name") || "").trim();
        const location = String(formData.get("location") || "").trim();
        const serial = String(formData.get("serial") || "").trim();
        const power = String(formData.get("power") || "").trim();
        const note = String(formData.get("note") || "").trim();

        if (!name) {
            setResult("Pole 'Nazwa' jest wymagane.", "result--error");
            return;
        }

        addTransformer({ name, location, serial, power, note });
        addForm.reset();
    });
}

if (seedSamplesBtn) {
    seedSamplesBtn.addEventListener("click", () => {
        const visible = getVisibleTransformers();
        if (visible.length) {
            setResult("Lista nie jest pusta. Dodaj recznie lub usun istniejece.", "result--error");
            return;
        }
        const samples = [
            {
                id: window.BTData.safeId(),
                userId: currentUserId,
                name: "Stacja Polnoc 12",
                location: "Warszawa, ul. Przemyslowa 8",
                serial: "TR-2025-0001",
                power: "630",
                note: "Regularna kontrola raz w miesiacu",
                createdAt: new Date().toISOString(),
                meters: []
            },
            {
                id: window.BTData.safeId(),
                userId: currentUserId,
                name: "Magazyn Zachod",
                location: "Lodz, ul. Kolejowa 4",
                serial: "TR-2025-0002",
                power: "1000",
                note: "Nowa instalacja",
                createdAt: new Date().toISOString(),
                meters: []
            }
        ];
        allTransformers = [...samples, ...allTransformers];
        saveAll();
        setSelected(samples[0].id);
        setResult("Wczytano przykladowe dane.", "result--success");
    });
}

ensureSelectedVisible();
renderTransformers();
if (!getVisibleTransformers().length) {
    setResult("Czekam na dane.", null);
}
