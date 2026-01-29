const adminNotice = document.getElementById("adminNotice");
const adminTransformers = document.getElementById("adminTransformers");
const adminMeters = document.getElementById("adminMeters");
const adminRegisters = document.getElementById("adminRegisters");
const adminSeedBtn = document.getElementById("adminSeed");
const adminWipeBtn = document.getElementById("adminWipe");

const userList = document.getElementById("userList");
const userEmpty = document.getElementById("userEmpty");
const adminPasswordForm = document.getElementById("adminPasswordForm");
const adminPasswordResult = document.getElementById("adminPasswordResult");
const adminPasswordResultBody = document.getElementById("adminPasswordResultBody");

const auth = window.BT_AUTH || {};
const currentUserId = auth.userId || "(brak)";
const isAdmin = Boolean(auth.isAdmin);

const USERS_KEY = "bt_users";
let transformers = window.BTData ? window.BTData.loadTransformers() : [];

const loadUsers = () => {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch (error) {
        return [];
    }
};

let users = loadUsers();

const saveUsers = () => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const updateStats = () => {
    if (adminTransformers) {
        adminTransformers.textContent = String(transformers.length);
    }
    if (adminMeters) {
        adminMeters.textContent = String(window.BTData ? window.BTData.countMeters(transformers) : 0);
    }
    if (adminRegisters) {
        adminRegisters.textContent = String(window.BTData ? window.BTData.countRegisters(transformers) : 0);
    }
};

const setNotice = (message) => {
    if (adminNotice) {
        adminNotice.textContent = message;
    }
};

const setPasswordResult = (message, state) => {
    if (!adminPasswordResult || !adminPasswordResultBody) {
        return;
    }
    adminPasswordResultBody.textContent = message;
    adminPasswordResult.classList.remove("result--success", "result--error");
    if (state) {
        adminPasswordResult.classList.add(state);
    }
};

const renderUsers = () => {
    if (!userList || !userEmpty) {
        return;
    }
    userList.innerHTML = "";

    if (!users.length) {
        userEmpty.style.display = "block";
        userList.style.display = "none";
        return;
    }

    userEmpty.style.display = "none";
    userList.style.display = "grid";

    users.forEach((user) => {
        const item = document.createElement("div");
        item.className = "list__item";

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = user.email || user.id;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        const userTransformers = transformers.filter((t) => t.userId === user.id);
        const names = userTransformers.map((t) => t.name).slice(0, 3).join(", ");
        const tail = userTransformers.length > 3 ? ` +${userTransformers.length - 3}` : "";
        meta.textContent = `ID: ${user.id} | Transformatory: ${names || "brak"}${tail}`;

        const tags = document.createElement("div");
        tags.className = "list__tags";
        const roleTag = document.createElement("span");
        roleTag.className = "tag";
        roleTag.textContent = user.role || "user";
        tags.append(roleTag);

        const countTag = document.createElement("span");
        countTag.className = "tag";
        countTag.textContent = `${userTransformers.length} transformatorow`;
        tags.append(countTag);

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const removeDataBtn = document.createElement("button");
        removeDataBtn.type = "button";
        removeDataBtn.className = "btn btn--ghost btn--small";
        removeDataBtn.textContent = "Usun transformatory";
        removeDataBtn.addEventListener("click", () => {
            transformers = transformers.filter((t) => t.userId !== user.id);
            window.BTData.saveTransformers(transformers);
            updateStats();
            renderUsers();
        });

        const deleteUserBtn = document.createElement("button");
        deleteUserBtn.type = "button";
        deleteUserBtn.className = "btn btn--ghost btn--small";
        deleteUserBtn.textContent = "Usun uzytkownika";
        deleteUserBtn.addEventListener("click", () => {
            users = users.filter((u) => u.id !== user.id);
            saveUsers();
            transformers = transformers.filter((t) => t.userId !== user.id);
            window.BTData.saveTransformers(transformers);
            updateStats();
            renderUsers();
            if (user.id === currentUserId) {
                sessionStorage.setItem("bt_login_notice", "Twoje konto zostalo usuniete.");
                window.location.href = "/static/index.html";
            }
        });

        actions.append(removeDataBtn, deleteUserBtn);
        item.append(main, actions);
        userList.append(item);
    });
};

if (!isAdmin) {
    setNotice("Brak uprawnien administracyjnych.");
} else {
    setNotice("Masz dostep administracyjny. Mozesz zarzadzac wszystkimi danymi.");
}

if (adminSeedBtn) {
    if (!isAdmin) {
        adminSeedBtn.disabled = true;
        adminSeedBtn.classList.add("btn--disabled");
    }
    adminSeedBtn.addEventListener("click", () => {
        if (!isAdmin) {
            return;
        }
        if (transformers.length) {
            setNotice("Lista nie jest pusta. Usun dane lub dodaj recznie.");
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
        transformers = samples.map(window.BTData.normalizeTransformer);
        window.BTData.saveTransformers(transformers);
        setNotice("Wczytano dane demo.");
        updateStats();
        renderUsers();
    });
}

if (adminWipeBtn) {
    if (!isAdmin) {
        adminWipeBtn.disabled = true;
        adminWipeBtn.classList.add("btn--disabled");
    }
    adminWipeBtn.addEventListener("click", () => {
        if (!isAdmin) {
            return;
        }
        transformers = [];
        window.BTData.saveTransformers(transformers);
        window.BTData.setSelectedId(null);
        window.BTData.setSelectedMeterInfo(null, null);
        setNotice("Wyczyszczono dane.");
        updateStats();
        renderUsers();
    });
}

if (adminPasswordForm) {
    adminPasswordForm.addEventListener("submit", (event) => {
        event.preventDefault();
        setPasswordResult("Ta akcja wymaga endpointu backendu (np. /admin/users/{id}/password).", "result--error");
    });
}

updateStats();
renderUsers();
