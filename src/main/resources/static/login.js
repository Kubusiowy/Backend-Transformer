const form = document.getElementById("authForm");
const result = document.getElementById("result");
const resultBody = document.getElementById("resultBody");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const submitBtn = document.getElementById("submitBtn");
const repeatField = document.getElementById("repeatField");
const rememberRow = document.getElementById("rememberRow");
const rememberBox = document.getElementById("rememberMe");
const switcher = document.getElementById("modeSwitch");
const switchButtons = document.querySelectorAll(".switch__btn");

const STORAGE = {
    refresh: "bt_refresh_token",
    access: "bt_access_token",
    user: "bt_user_id",
    role: "bt_role",
    email: "bt_user_email",
    lastLogin: "bt_last_login",
    remember: "bt_remember_me"
};

let mode = "login";

const setResult = (message, state) => {
    resultBody.textContent = message;
    result.hidden = !message;
    result.classList.remove("result--success", "result--error");
    if (state) {
        result.classList.add(state);
    }
};

const setMode = (nextMode) => {
    mode = nextMode;
    switcher.dataset.mode = mode;
    switchButtons.forEach((btn) => {
        const isActive = btn.dataset.mode === mode;
        btn.setAttribute("aria-pressed", String(isActive));
    });

    if (mode === "register") {
        formTitle.textContent = "Załóż konto";
        formSubtitle.textContent = "Hasło musi mieć co najmniej 8 znaków.";
        submitBtn.textContent = "Załóż konto";
        repeatField.style.display = "grid";
        if (rememberRow) {
            rememberRow.style.display = "flex";
        }
        setResult("", null);
    } else {
        formTitle.textContent = "Zaloguj się";
        formSubtitle.textContent = "";
        submitBtn.textContent = "Zaloguj się";
        repeatField.style.display = "none";
        if (rememberRow) {
            rememberRow.style.display = "flex";
        }
        setResult("", null);
    }
};

const request = async (url, payload) => {
    if (window.BT_API?.request) {
        return window.BT_API.request("POST", url, payload);
    }
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = data?.message || "Niepoprawne dane.";
        throw new Error(message);
    }
    return data;
};

const saveTokens = (loginResult, email, remember) => {
    const access = loginResult?.accessToken || null;
    const refresh = loginResult?.refreshToken || null;
    const userId = loginResult?.id || null;
    const role =
        loginResult?.role ||
        loginResult?.userRole ||
        loginResult?.accountRole ||
        loginResult?.permissions?.role ||
        "user";
    const resolvedEmail =
        loginResult?.email ||
        loginResult?.user?.email ||
        loginResult?.account?.email ||
        email ||
        "";

    if (refresh) {
        if (remember) {
            localStorage.setItem(STORAGE.refresh, refresh);
            sessionStorage.removeItem(STORAGE.refresh);
        } else {
            sessionStorage.setItem(STORAGE.refresh, refresh);
            localStorage.removeItem(STORAGE.refresh);
        }
    } else {
        localStorage.removeItem(STORAGE.refresh);
        sessionStorage.removeItem(STORAGE.refresh);
    }
    if (access) {
        sessionStorage.setItem(STORAGE.access, access);
    }
    if (userId) {
        localStorage.setItem(STORAGE.user, userId);
    }
    const roleValue = String(role || "user").toLowerCase();
    localStorage.setItem(STORAGE.role, roleValue);
    if (resolvedEmail) {
        localStorage.setItem(STORAGE.email, resolvedEmail);
    }
    localStorage.setItem(STORAGE.lastLogin, new Date().toISOString());
    localStorage.setItem(STORAGE.remember, remember ? "1" : "0");

    if (userId) {
        const usersKey = "bt_users";
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem(usersKey) || "[]");
        } catch (error) {
            users = [];
        }
        const existing = users.find((user) => user.id === String(userId));
        const entry = {
            id: String(userId),
            email: resolvedEmail || "(brak)",
            role: roleValue,
            lastLogin: new Date().toISOString()
        };
        if (existing) {
            Object.assign(existing, entry);
        } else {
            users.push(entry);
        }
        localStorage.setItem(usersKey, JSON.stringify(users));
    }
};

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitBtn.disabled) return;

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const passwordRepeat = String(formData.get("passwordRepeat") || "");

    if (!email || !password) {
        setResult("Wypełnij wszystkie pola.", "result--error");
        return;
    }

    if (mode === "register") {
        if (!passwordRepeat) {
            setResult("Powtórz hasło.", "result--error");
            return;
        }
        if (password !== passwordRepeat) {
            setResult("Hasła nie są takie same.", "result--error");
            return;
        }
    }

    setResult(mode === "register" ? "Rejestracja..." : "Logowanie...", null);
    submitBtn.disabled = true;

    try {
        if (mode === "register") {
            const registerPayload = { email, rawPassword: password };
            await request("/auth/register", registerPayload);
        }

        const loginPayload = { email, rawPassword: password };
        const loginResult = await request("/auth/login", loginPayload);
        const remember = Boolean(rememberBox?.checked);
        saveTokens(loginResult, email, remember);

        setResult("Zalogowano. Przekierowuję do panelu...", "result--success");
        window.location.href = "/static/panel.html";
    } catch (error) {
        setResult(error?.message || "Błąd połączenia z serwerem.", "result--error");
    } finally {
        submitBtn.disabled = false;
    }
});

switchButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

setMode("login");

if (rememberBox) {
    const stored = localStorage.getItem(STORAGE.remember);
    rememberBox.checked = stored === "1";
    rememberBox.addEventListener("change", () => {
        localStorage.setItem(STORAGE.remember, rememberBox.checked ? "1" : "0");
    });
}

const notice = sessionStorage.getItem("bt_login_notice");
if (notice) {
    sessionStorage.removeItem("bt_login_notice");
    setResult(notice, "result--error");
}

const autoLogin = async () => {
    const refreshToken =
        sessionStorage.getItem(STORAGE.refresh) || localStorage.getItem(STORAGE.refresh);
    if (!refreshToken || !window.BT_API?.refreshAccessToken) {
        return;
    }
    setResult("Odnawiam sesje...", null);
    const refreshed = await window.BT_API.refreshAccessToken();
    if (refreshed) {
        setResult("Sesja aktywna. Przekierowuję do panelu...", "result--success");
        window.location.href = "/static/panel.html";
    } else {
        setResult("Zaloguj się, aby kontynuowac.", null);
    }
};

autoLogin().catch(() => setResult("Brak połączenia z serwerem. Spróbuj ponownie.", "result--error"));
