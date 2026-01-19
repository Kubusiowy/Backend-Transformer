const form = document.getElementById("authForm");
const result = document.getElementById("result");
const resultBody = document.getElementById("resultBody");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const submitBtn = document.getElementById("submitBtn");
const repeatField = document.getElementById("repeatField");
const switcher = document.querySelector(".switch");
const switchButtons = document.querySelectorAll(".switch__btn");

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
        formTitle.textContent = "Zaloz konto";
        formSubtitle.textContent = "Utworz konto i od razu zaloguj sie do panelu.";
        submitBtn.textContent = "Zarejestruj";
        repeatField.style.display = "grid";
        setResult("Wypelnij dane rejestracji.", null);
    } else {
        formTitle.textContent = "Zaloguj sie";
        formSubtitle.textContent = "Wprowadz dane, aby otrzymac token dostepu.";
        submitBtn.textContent = "Zaloguj sie";
        repeatField.style.display = "none";
        setResult("Brak prob logowania.", null);
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

    setResult("Wysylam...", null);

    try {
        if (mode === "register") {
            const registerPayload = { email, rawPassword: password };
            const registerResult = await request("/auth/register", registerPayload);
            setResult(`Konto utworzone. ID: ${registerResult?.id || "(brak)"}.`, "result--success");
            setMode("login");
            return;
        }

        const loginPayload = { email, rawPassword: password };
        const loginResult = await request("/auth/login", loginPayload);
        const token = loginResult?.token || "(brak)";
        const userId = loginResult?.id || "(brak)";
        setResult(`Zalogowano. ID: ${userId}. Token: ${token}`, "result--success");
    } catch (error) {
        setResult(error?.message || "Blad polaczenia z serwerem.", "result--error");
    }
});

switchButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

setMode("login");
