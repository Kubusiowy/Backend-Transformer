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

const isAdmin = Boolean(window.BT_AUTH?.isAdmin);

let users = [];
let transformers = [];
let metersByTransformer = {};
let registersByMeter = {};

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

const updateStats = () => {
    const meterCount = Object.values(metersByTransformer).reduce((sum, list) => sum + list.length, 0);
    const registerCount = Object.values(registersByMeter).reduce((sum, list) => sum + list.length, 0);
    if (adminTransformers) {
        adminTransformers.textContent = String(transformers.length);
    }
    if (adminMeters) {
        adminMeters.textContent = String(meterCount);
    }
    if (adminRegisters) {
        adminRegisters.textContent = String(registerCount);
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
        removeDataBtn.addEventListener("click", () => deleteUserTransformers(user.id));

        const deleteUserBtn = document.createElement("button");
        deleteUserBtn.type = "button";
        deleteUserBtn.className = "btn btn--ghost btn--small";
        deleteUserBtn.textContent = "Usun uzytkownika";
        deleteUserBtn.addEventListener("click", () => deleteUser(user.id));

        actions.append(removeDataBtn, deleteUserBtn);
        item.append(main, actions);
        userList.append(item);
    });
};

const fetchUsers = async () => {
    if (!window.BT_API?.request) {
        setNotice("Brak konfiguracji API.");
        return;
    }
    users = await window.BT_API.request("GET", "/admin/users");
    if (!Array.isArray(users)) {
        users = [];
    }
    renderUsers();
};

const fetchTransformers = async () => {
    if (!window.BT_API?.request) {
        return;
    }
    transformers = await window.BT_API.request("GET", "/transformers");
    if (!Array.isArray(transformers)) {
        transformers = [];
    }
};

const fetchMetersAndRegisters = async () => {
    metersByTransformer = {};
    registersByMeter = {};
    await Promise.all(
        transformers.map(async (transformer) => {
            try {
                const meters = await window.BT_API.request(
                    "GET",
                    `/transformers/${transformer.id}/meters`
                );
                const list = Array.isArray(meters) ? meters : [];
                metersByTransformer[transformer.id] = list;
                await Promise.all(
                    list.map(async (meter) => {
                        try {
                            const registers = await window.BT_API.request(
                                "GET",
                                `/meters/${meter.id}/registers`
                            );
                            registersByMeter[meter.id] = Array.isArray(registers) ? registers : [];
                        } catch (error) {
                            registersByMeter[meter.id] = [];
                        }
                    })
                );
            } catch (error) {
                metersByTransformer[transformer.id] = [];
            }
        })
    );
};

const deleteUserTransformers = async (userId) => {
    if (!window.BT_API?.request) {
        return;
    }
    setNotice("Usuwanie danych uzytkownika...");
    try {
        await window.BT_API.request("DELETE", `/admin/users/${userId}/transformers`);
        await refreshAll();
        setNotice("Transformatory uzytkownika usuniete.");
    } catch (error) {
        setNotice(error?.message || "Blad usuwania danych.");
    }
};

const deleteUser = async (userId) => {
    if (!window.BT_API?.request) {
        return;
    }
    setNotice("Usuwanie uzytkownika...");
    try {
        await window.BT_API.request("DELETE", `/admin/users/${userId}`);
        await refreshAll();
        setNotice("Uzytkownik usuniety.");
    } catch (error) {
        setNotice(error?.message || "Blad usuwania uzytkownika.");
    }
};

const refreshAll = async () => {
    await fetchTransformers();
    await fetchMetersAndRegisters();
    updateStats();
    await fetchUsers();
};

if (!isAdmin) {
    setNotice("Brak uprawnien administracyjnych.");
} else {
    setNotice("Masz dostep administracyjny. Mozesz zarzadzac wszystkimi danymi.");
    refreshAll().catch(() => setNotice("Blad pobierania danych."));
}

if (adminSeedBtn) {
    adminSeedBtn.disabled = true;
    adminSeedBtn.classList.add("btn--disabled");
    adminSeedBtn.title = "Funkcja wylaczona w trybie produkcyjnym.";
}

if (adminWipeBtn) {
    adminWipeBtn.disabled = true;
    adminWipeBtn.classList.add("btn--disabled");
    adminWipeBtn.title = "Funkcja wylaczona w trybie produkcyjnym.";
}

if (adminPasswordForm) {
    adminPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!window.BT_API?.request) {
            setPasswordResult("Brak konfiguracji API.", "result--error");
            return;
        }
        const formData = new FormData(adminPasswordForm);
        const userId = String(formData.get("userId") || "").trim();
        const password = String(formData.get("password") || "").trim();
        if (!userId || !password) {
            setPasswordResult("Uzupelnij pola ID i haslo.", "result--error");
            return;
        }
        setPasswordResult("Zmieniam haslo...", null);
        try {
            await window.BT_API.request("PUT", `/admin/users/${userId}/password`, {
                newPassword: password
            });
            setPasswordResult("Haslo zmienione.", "result--success");
            adminPasswordForm.reset();
        } catch (error) {
            setPasswordResult(error?.message || "Blad zmiany hasla.", "result--error");
        }
    });
}
