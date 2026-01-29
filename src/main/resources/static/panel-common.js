const STORAGE = {
    refresh: "bt_refresh_token",
    access: "bt_access_token",
    user: "bt_user_id",
    role: "bt_role",
    email: "bt_user_email",
    lastLogin: "bt_last_login",
    transformers: "bt_transformers",
    selected: "bt_transformer_selected",
    meterSelected: "bt_meter_selected",
    lastRead: "bt_last_read"
};

window.BT_STORAGE = STORAGE;

const refreshToken = localStorage.getItem(STORAGE.refresh);
const accessToken = sessionStorage.getItem(STORAGE.access);
const userId = localStorage.getItem(STORAGE.user) || "(brak)";
const role = (localStorage.getItem(STORAGE.role) || "user").toLowerCase();
const userEmail = localStorage.getItem(STORAGE.email) || "(brak)";
const isAdmin = role === "admin";

window.BT_AUTH = {
    userId,
    userEmail,
    role,
    isAdmin,
    accessToken,
    refreshToken
};

const requireAuth = () => {
    if (!refreshToken) {
        sessionStorage.setItem("bt_login_notice", "Aby wejsc do panelu, zaloguj sie.");
        window.location.href = "/static/index.html";
        return false;
    }
    return true;
};

const updateRoleLabels = () => {
    document.querySelectorAll("[data-role-label]").forEach((el) => {
        el.textContent = `Rola: ${role}`;
    });
};

const updateNavState = () => {
    const page = document.body?.dataset?.page || "";
    document.querySelectorAll("[data-page-link]").forEach((link) => {
        const isActive = link.dataset.pageLink === page;
        link.classList.toggle("is-active", isActive);
        link.setAttribute("aria-current", isActive ? "page" : "false");
    });

    document.querySelectorAll("[data-admin-link]").forEach((link) => {
        link.style.display = isAdmin ? "inline-flex" : "none";
    });

    document.querySelectorAll("[data-admin-only]").forEach((el) => {
        el.style.display = isAdmin ? "" : "none";
    });
};

const guardAdminPage = () => {
    const page = document.body?.dataset?.page || "";
    if (page === "admin" && !isAdmin) {
        sessionStorage.setItem("bt_login_notice", "Brak uprawnien administratora.");
        window.location.href = "/static/panel.html";
        return false;
    }
    return true;
};

const handleLogout = () => {
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
    localStorage.removeItem(STORAGE.role);
    localStorage.removeItem(STORAGE.email);
    localStorage.removeItem(STORAGE.lastLogin);
    sessionStorage.removeItem(STORAGE.access);
    window.location.href = "/static/index.html";
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
    setInterval(() => {
        refreshAccessToken();
    }, 600 * 1000);
};

const bindLogout = () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }
};

if (requireAuth()) {
    guardAdminPage();
    updateRoleLabels();
    updateNavState();
    bindLogout();
    startSilentRefresh();
}
