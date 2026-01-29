const form = document.getElementById("authForm");
const result = document.getElementById("result");
const resultBody = document.getElementById("resultBody");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const submitBtn = document.getElementById("submitBtn");
const repeatField = document.getElementById("repeatField");
const switcher = document.getElementById("modeSwitch");
const switchButtons = document.querySelectorAll(".switch__btn");

const STORAGE = {
    refresh: "bt_refresh_token",
    access: "bt_access_token",
    user: "bt_user_id",
    role: "bt_role",
    email: "bt_user_email",
    lastLogin: "bt_last_login"
};

let mode = "login";

const setResult = (message, state) => {
    resultBody.textContent = message;
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
        formTitle.textContent = "Zarejestruj konto";
        formSubtitle.textContent = "Utworz konto i od razu wejdziesz do panelu.";
        submitBtn.textContent = "Zarejestruj i wejdz";
        repeatField.style.display = "grid";
        setResult("Wypelnij dane rejestracji.", null);
    } else {
        formTitle.textContent = "Zaloguj sie";
        formSubtitle.textContent = "Podaj email i haslo, aby wejsc do panelu.";
        submitBtn.textContent = "Zaloguj sie";
        repeatField.style.display = "none";
        setResult("Wprowadz dane logowania.", null);
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
        const message = data?.message || "Niepoprawne dane.";
        throw new Error(message);
    }
    return data;
};

const saveTokens = (loginResult, email) => {
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
        localStorage.setItem(STORAGE.refresh, refresh);
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

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const passwordRepeat = String(formData.get("passwordRepeat") || "");

    if (!email || !password) {
        setResult("Wypelnij wszystkie pola.", "result--error");
        return;
    }

    if (mode === "register") {
        if (!passwordRepeat) {
            setResult("Powtorz haslo.", "result--error");
            return;
        }
        if (password !== passwordRepeat) {
            setResult("Hasla nie sa takie same.", "result--error");
            return;
        }
    }

    setResult(mode === "register" ? "Rejestracja..." : "Logowanie...", null);

    try {
        if (mode === "register") {
            const registerPayload = { email, rawPassword: password };
            await request("/auth/register", registerPayload);
        }

        const loginPayload = { email, rawPassword: password };
        const loginResult = await request("/auth/login", loginPayload);
        saveTokens(loginResult, email);

        setResult("Zalogowano. Przekierowuje do panelu...", "result--success");
        window.location.href = "/static/panel.html";
    } catch (error) {
        setResult(error?.message || "Blad polaczenia z serwerem.", "result--error");
    }
});

switchButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

setMode("login");

const notice = sessionStorage.getItem("bt_login_notice");
if (notice) {
    sessionStorage.removeItem("bt_login_notice");
    setResult(notice, "result--error");
}
