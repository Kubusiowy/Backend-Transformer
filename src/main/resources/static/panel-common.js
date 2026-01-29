const STORAGE = {
    refresh: "bt_refresh_token",
    access: "bt_access_token",
    user: "bt_user_id",
    role: "bt_role",
    email: "bt_user_email",
    lastLogin: "bt_last_login",
    selected: "bt_transformer_selected",
    meterSelected: "bt_meter_selected",
    lastRead: "bt_last_read"
};

window.BT_STORAGE = STORAGE;

const updateAuthFromStorage = () => {
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
};

updateAuthFromStorage();

const requireAuth = () => {
    if (!window.BT_AUTH?.refreshToken) {
        sessionStorage.setItem("bt_login_notice", "Aby wejsc do panelu, zaloguj sie.");
        window.location.href = "/static/index.html";
        return false;
    }
    return true;
};

const updateRoleLabels = () => {
    const role = window.BT_AUTH?.role || "user";
    document.querySelectorAll("[data-role-label]").forEach((el) => {
        el.textContent = `Rola: ${role}`;
    });
};

const updateNavState = () => {
    const page = document.body?.dataset?.page || "";
    const isAdmin = Boolean(window.BT_AUTH?.isAdmin);
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
    if (page === "admin" && !window.BT_AUTH?.isAdmin) {
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
    updateAuthFromStorage();
    window.location.href = "/static/index.html";
};

const startSilentRefresh = async () => {
    if (!window.BT_AUTH?.refreshToken || !window.BT_API?.refreshAccessToken) {
        return;
    }
    await window.BT_API.refreshAccessToken();
    updateAuthFromStorage();
    setInterval(() => {
        window.BT_API.refreshAccessToken().then(() => updateAuthFromStorage());
    }, 600 * 1000);
};

const syncProfile = async () => {
    if (!window.BT_API?.request) {
        return;
    }
    try {
        const me = await window.BT_API.request("GET", "/me");
        if (me?.id) {
            localStorage.setItem(STORAGE.user, String(me.id));
        }
        if (me?.email) {
            localStorage.setItem(STORAGE.email, String(me.email));
        }
        if (me?.role) {
            localStorage.setItem(STORAGE.role, String(me.role).toLowerCase());
        }
        updateAuthFromStorage();
        updateRoleLabels();
        updateNavState();
    } catch (error) {
        if (error?.message === "Unauthorized") {
            sessionStorage.setItem("bt_login_notice", "Sesja wygasla. Zaloguj sie ponownie.");
            handleLogout();
        }
    }
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
    syncProfile();
}
