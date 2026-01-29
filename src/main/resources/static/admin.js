const adminNotice = document.getElementById("adminNotice");
const adminTransformers = document.getElementById("adminTransformers");
const adminMeters = document.getElementById("adminMeters");
const adminRegisters = document.getElementById("adminRegisters");
const adminSeedBtn = document.getElementById("adminSeed");
const adminWipeBtn = document.getElementById("adminWipe");

const userList = document.getElementById("userList");
const userEmpty = document.getElementById("userEmpty");
const userSearch = document.getElementById("userSearch");
const detailUserId = document.getElementById("detailUserId");
const detailUserEmail = document.getElementById("detailUserEmail");
const detailUserRole = document.getElementById("detailUserRole");
const adminTransformerList = document.getElementById("adminTransformerList");
const adminTransformerEmpty = document.getElementById("adminTransformerEmpty");
const adminMetricKeySelect = document.getElementById("adminMetricKeySelect");
const adminMetricLimit = document.getElementById("adminMetricLimit");
const adminMetricsStatus = document.getElementById("adminMetricsStatus");
const adminMetricAvg = document.getElementById("adminMetricAvg");
const adminMetricMin = document.getElementById("adminMetricMin");
const adminMetricMax = document.getElementById("adminMetricMax");
const adminMetricTime = document.getElementById("adminMetricTime");
const adminMetricsTableBody = document.getElementById("adminMetricsTableBody");
const adminMetricsTableWrap = document.getElementById("adminMetricsTableWrap");
const adminMetricsEmpty = document.getElementById("adminMetricsEmpty");
const adminPasswordForm = document.getElementById("adminPasswordForm");
const adminPasswordResult = document.getElementById("adminPasswordResult");
const adminPasswordResultBody = document.getElementById("adminPasswordResultBody");

const isAdmin = Boolean(window.BT_AUTH?.isAdmin);

let users = [];
let filteredUsers = [];
let allTransformers = [];
let userTransformers = [];
let allMetersByTransformer = {};
let userMetersByTransformer = {};
let registersByMeter = {};
let selectedUser = null;
let selectedTransformer = null;
let currentMetricPoints = [];

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
    const meterCount = Object.values(allMetersByTransformer).reduce((sum, list) => sum + list.length, 0);
    const registerCount = Object.values(registersByMeter).reduce((sum, list) => sum + list.length, 0);
    if (adminTransformers) {
        adminTransformers.textContent = String(allTransformers.length);
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

    const list = filteredUsers.length ? filteredUsers : users;
    if (!list.length) {
        userEmpty.style.display = "block";
        userList.style.display = "none";
        return;
    }

    userEmpty.style.display = "none";
    userList.style.display = "grid";

    list.forEach((user) => {
        const item = document.createElement("div");
        item.className = "list__item";
        if (selectedUser && selectedUser.id === user.id) {
            item.classList.add("list__item--active");
        }

        const main = document.createElement("div");
        main.className = "list__main";

        const name = document.createElement("div");
        name.className = "list__name";
        name.textContent = user.email || user.id;

        const meta = document.createElement("div");
        meta.className = "list__meta";
        const userTransformers = allTransformers.filter((t) => t.userId === user.id);
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

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "btn btn--ghost btn--small";
        selectBtn.textContent = "Wybierz";
        selectBtn.addEventListener("click", () => selectUser(user));

        const passwordBtn = document.createElement("button");
        passwordBtn.type = "button";
        passwordBtn.className = "btn btn--ghost btn--small";
        passwordBtn.textContent = "Zmien haslo";
        passwordBtn.addEventListener("click", () => {
            if (adminPasswordForm) {
                const input = adminPasswordForm.querySelector("input[name=userId]");
                if (input) {
                    input.value = user.id;
                    input.focus();
                }
            }
        });

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

        actions.append(selectBtn, passwordBtn, removeDataBtn, deleteUserBtn);
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
    filteredUsers = [];
    if (selectedUser && !users.find((user) => user.id === selectedUser.id)) {
        selectedUser = null;
        selectedTransformer = null;
        updateUserDetail(null);
        renderTransformers();
        updateMetricsSummary(null);
        renderMetricsTable([]);
        setMetricsStatus("Brak transformatora");
    }
    renderUsers();
};

const fetchTransformers = async () => {
    if (!window.BT_API?.request) {
        return;
    }
    allTransformers = await window.BT_API.request("GET", "/transformers");
    if (!Array.isArray(allTransformers)) {
        allTransformers = [];
    }
};

const fetchMetersAndRegisters = async () => {
    allMetersByTransformer = {};
    registersByMeter = {};
    await Promise.all(
        allTransformers.map(async (transformer) => {
            try {
                const meters = await window.BT_API.request(
                    "GET",
                    `/transformers/${transformer.id}/meters`
                );
                const list = Array.isArray(meters) ? meters : [];
                allMetersByTransformer[transformer.id] = list;
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
                allMetersByTransformer[transformer.id] = [];
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
        if (selectedUser && selectedUser.id === userId) {
            await selectUser(selectedUser);
        }
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

const updateUserDetail = (user) => {
    if (!detailUserId || !detailUserEmail || !detailUserRole) {
        return;
    }
    if (!user) {
        detailUserId.textContent = "(brak)";
        detailUserEmail.textContent = "(brak)";
        detailUserRole.textContent = "(brak)";
        return;
    }
    detailUserId.textContent = user.id || "(brak)";
    detailUserEmail.textContent = user.email || "(brak)";
    detailUserRole.textContent = user.role || "(brak)";
};

const setMetricsStatus = (message) => {
    if (adminMetricsStatus) {
        adminMetricsStatus.textContent = message;
    }
};

const updateMetricsSummary = (point) => {
    if (!adminMetricAvg || !adminMetricMin || !adminMetricMax || !adminMetricTime) {
        return;
    }
    if (!point) {
        adminMetricAvg.textContent = "(brak)";
        adminMetricMin.textContent = "(brak)";
        adminMetricMax.textContent = "(brak)";
        adminMetricTime.textContent = "(brak)";
        return;
    }
    const format = (value, unit) => {
        if (value === null || value === undefined) {
            return "(brak)";
        }
        const formatted = typeof value === "number" ? value.toFixed(2) : String(value);
        return unit ? `${formatted} ${unit}` : formatted;
    };
    adminMetricAvg.textContent = format(point.avgValue, point.unit);
    adminMetricMin.textContent = format(point.minValue, point.unit);
    adminMetricMax.textContent = format(point.maxValue, point.unit);
    adminMetricTime.textContent = point.bucketTs || "(brak)";
};

const renderMetricsTable = (points) => {
    if (!adminMetricsTableBody || !adminMetricsEmpty || !adminMetricsTableWrap) {
        return;
    }
    adminMetricsTableBody.innerHTML = "";
    if (!points.length) {
        adminMetricsEmpty.style.display = "block";
        adminMetricsTableWrap.style.display = "none";
        return;
    }
    adminMetricsEmpty.style.display = "none";
    adminMetricsTableWrap.style.display = "block";
    points.forEach((point) => {
        const row = document.createElement("tr");
        const cells = [
            point.bucketTs,
            point.avgValue,
            point.minValue,
            point.maxValue,
            point.count ?? "",
            point.unit || "",
            point.label || ""
        ];
        cells.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.append(cell);
        });
        adminMetricsTableBody.append(row);
    });
};

const renderTransformers = () => {
    if (!adminTransformerList || !adminTransformerEmpty) {
        return;
    }
    adminTransformerList.innerHTML = "";
    if (!selectedUser) {
        adminTransformerEmpty.style.display = "block";
        adminTransformerList.style.display = "none";
        return;
    }
    if (!userTransformers.length) {
        adminTransformerEmpty.textContent = "Brak transformatorow dla wybranego uzytkownika.";
        adminTransformerEmpty.style.display = "block";
        adminTransformerList.style.display = "none";
        return;
    }
    adminTransformerEmpty.style.display = "none";
    adminTransformerList.style.display = "grid";

    userTransformers.forEach((transformer) => {
        const item = document.createElement("div");
        item.className = "list__item";
        if (selectedTransformer && selectedTransformer.id === transformer.id) {
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
        const idTag = document.createElement("span");
        idTag.className = "tag";
        idTag.textContent = transformer.id;
        tags.append(idTag);
        const meterCount = userMetersByTransformer[transformer.id]?.length ?? 0;
        const meterTag = document.createElement("span");
        meterTag.className = "tag";
        meterTag.textContent = `Mierniki: ${meterCount}`;
        tags.append(meterTag);

        main.append(name, meta, tags);

        const actions = document.createElement("div");
        actions.className = "list__actions";

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "btn btn--ghost btn--small";
        selectBtn.textContent = "Wybierz";
        selectBtn.addEventListener("click", () => selectTransformer(transformer));

        actions.append(selectBtn);
        item.append(main, actions);
        adminTransformerList.append(item);
    });
};

const fetchTransformersForUser = async (userId) => {
    if (!window.BT_API?.request) {
        return;
    }
    try {
        userTransformers = await window.BT_API.request("GET", `/transformers?userId=${encodeURIComponent(userId)}`);
        if (!Array.isArray(userTransformers)) {
            userTransformers = [];
        }
        userMetersByTransformer = {};
        await Promise.all(
            userTransformers.map(async (transformer) => {
                try {
                    const meters = await window.BT_API.request(
                        "GET",
                        `/transformers/${transformer.id}/meters`
                    );
                    userMetersByTransformer[transformer.id] = Array.isArray(meters) ? meters : [];
                } catch (error) {
                    userMetersByTransformer[transformer.id] = [];
                }
            })
        );
    } catch (error) {
        userTransformers = [];
        userMetersByTransformer = {};
    }
};

const selectUser = async (user) => {
    selectedUser = user;
    selectedTransformer = null;
    if (adminPasswordForm) {
        const input = adminPasswordForm.querySelector("input[name=userId]");
        if (input) {
            input.value = user.id;
        }
    }
    updateUserDetail(user);
    setMetricsStatus("Wybierz transformator");
    updateMetricsSummary(null);
    renderMetricsTable([]);
    await fetchTransformersForUser(user.id);
    renderTransformers();
    renderUsers();
};

const loadMetricKeys = async () => {
    if (!selectedTransformer || !window.BT_API?.request) {
        return;
    }
    try {
        const keys = await window.BT_API.request(
            "GET",
            `/transformers/${selectedTransformer.id}/metrics/keys`
        );
        const list = Array.isArray(keys) ? keys : [];
        if (adminMetricKeySelect) {
            adminMetricKeySelect.innerHTML = "";
            list.forEach((key) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = key;
                adminMetricKeySelect.append(option);
            });
            adminMetricKeySelect.disabled = list.length === 0;
        }
        if (list.length) {
            await loadMetrics();
        } else {
            currentMetricPoints = [];
            updateMetricsSummary(null);
            renderMetricsTable([]);
            setMetricsStatus("Brak kluczy metryk");
        }
    } catch (error) {
        setMetricsStatus("Blad pobierania kluczy");
    }
};

const loadMetrics = async () => {
    if (!selectedTransformer || !window.BT_API?.request) {
        return;
    }
    const key = adminMetricKeySelect ? adminMetricKeySelect.value : null;
    if (!key) {
        setMetricsStatus("Brak klucza metryki");
        return;
    }
    const limitValue = adminMetricLimit ? Number(adminMetricLimit.value || 120) : 120;
    setMetricsStatus("Pobieram dane...");
    try {
        const points = await window.BT_API.request(
            "GET",
            `/transformers/${selectedTransformer.id}/metrics?key=${encodeURIComponent(
                key
            )}&limit=${limitValue}&order=desc`
        );
        currentMetricPoints = Array.isArray(points) ? points : [];
        renderMetricsTable(currentMetricPoints);
        updateMetricsSummary(currentMetricPoints[0] || null);
        setMetricsStatus("Dane zaktualizowane");
    } catch (error) {
        setMetricsStatus("Blad pobierania danych");
    }
};

const selectTransformer = async (transformer) => {
    selectedTransformer = transformer;
    renderTransformers();
    await loadMetricKeys();
};

const applyUserSearch = () => {
    const value = String(userSearch?.value || "").trim().toLowerCase();
    if (!value) {
        filteredUsers = [];
        renderUsers();
        return;
    }
    filteredUsers = users.filter((user) => {
        return (
            String(user.email || "").toLowerCase().includes(value) ||
            String(user.id || "").toLowerCase().includes(value)
        );
    });
    renderUsers();
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

if (userSearch) {
    userSearch.addEventListener("input", () => applyUserSearch());
}

if (adminMetricKeySelect) {
    adminMetricKeySelect.addEventListener("change", () => loadMetrics());
}

if (adminMetricLimit) {
    adminMetricLimit.addEventListener("change", () => loadMetrics());
}

updateUserDetail(null);
updateMetricsSummary(null);
renderMetricsTable([]);
setMetricsStatus("Brak transformatora");
