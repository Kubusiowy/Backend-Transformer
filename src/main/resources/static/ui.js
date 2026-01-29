(() => {
    const body = document.body;
    if (!body) {
        return;
    }

    const STORAGE = {
        theme: "bt_theme",
        a11y: "bt_a11y",
        cookie: "bt_cookie_consent"
    };

    const setCookie = (name, value, days) => {
        const maxAge = days * 24 * 60 * 60;
        document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
    };

    const themeToggle = document.getElementById("themeToggle");

    const applyTheme = (theme) => {
        body.classList.toggle("theme-dark", theme === "dark");
        body.classList.toggle("theme-light", theme === "light");
        body.dataset.theme = theme;
        if (themeToggle) {
            const isDark = theme === "dark";
            themeToggle.setAttribute("aria-pressed", String(isDark));
            themeToggle.textContent = isDark ? "Tryb: Ciemny" : "Tryb: Jasny";
        }
    };

    const initTheme = () => {
        const saved = localStorage.getItem(STORAGE.theme);
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = saved || (prefersDark ? "dark" : "light");
        applyTheme(theme);
    };

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const nextTheme = body.classList.contains("theme-dark") ? "light" : "dark";
            localStorage.setItem(STORAGE.theme, nextTheme);
            applyTheme(nextTheme);
        });
    }

    initTheme();

    const defaultA11y = {
        textSize: 0,
        contrast: false,
        reduceMotion: false,
        underline: false
    };

    const loadA11y = () => {
        try {
            const raw = localStorage.getItem(STORAGE.a11y);
            if (!raw) {
                return { ...defaultA11y };
            }
            const data = JSON.parse(raw);
            return { ...defaultA11y, ...data };
        } catch (error) {
            return { ...defaultA11y };
        }
    };

    let a11yState = loadA11y();

    const saveA11y = () => {
        localStorage.setItem(STORAGE.a11y, JSON.stringify(a11yState));
    };

    const applyA11y = () => {
        body.classList.toggle("a11y-text-lg", a11yState.textSize === 1);
        body.classList.toggle("a11y-text-xl", a11yState.textSize === 2);
        body.classList.toggle("a11y-contrast", Boolean(a11yState.contrast));
        body.classList.toggle("a11y-reduce-motion", Boolean(a11yState.reduceMotion));
        body.classList.toggle("a11y-underline", Boolean(a11yState.underline));

        document.querySelectorAll("[data-a11y-text]").forEach((btn) => {
            const value = Number(btn.dataset.a11yText);
            const active = value === a11yState.textSize;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });

        document.querySelectorAll("[data-a11y-toggle]").forEach((btn) => {
            const key = btn.dataset.a11yToggle;
            const active = Boolean(a11yState[key]);
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
    };

    document.querySelectorAll("[data-a11y-text]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const value = Number(btn.dataset.a11yText);
            a11yState.textSize = value;
            saveA11y();
            applyA11y();
        });
    });

    document.querySelectorAll("[data-a11y-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.a11yToggle;
            a11yState[key] = !a11yState[key];
            saveA11y();
            applyA11y();
        });
    });

    const a11yToggle = document.getElementById("a11yToggle");
    const a11yPanel = document.getElementById("a11yPanel");
    const a11yClose = document.getElementById("a11yClose");

    const setPanelOpen = (open) => {
        if (!a11yPanel || !a11yToggle) {
            return;
        }
        a11yPanel.classList.toggle("is-open", open);
        a11yToggle.setAttribute("aria-expanded", String(open));
    };

    const isPanelOpen = () => Boolean(a11yPanel && a11yPanel.classList.contains("is-open"));

    if (a11yToggle) {
        a11yToggle.addEventListener("click", () => setPanelOpen(!isPanelOpen()));
    }

    if (a11yClose) {
        a11yClose.addEventListener("click", () => setPanelOpen(false));
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setPanelOpen(false);
        }
    });

    document.addEventListener("click", (event) => {
        if (!a11yPanel || !a11yToggle) {
            return;
        }
        if (!isPanelOpen()) {
            return;
        }
        const target = event.target;
        if (a11yPanel.contains(target) || a11yToggle.contains(target)) {
            return;
        }
        setPanelOpen(false);
    });

    applyA11y();

    const cookieBanner = document.getElementById("cookieBanner");
    const cookieAccept = document.getElementById("cookieAccept");
    const cookieReject = document.getElementById("cookieReject");
    const cookieManage = document.getElementById("cookieManage");

    const setConsent = (value) => {
        localStorage.setItem(STORAGE.cookie, value);
        setCookie("bt_cookie_consent", value, 180);
        body.dataset.cookieConsent = value;
        if (cookieBanner) {
            cookieBanner.classList.remove("is-visible");
            cookieBanner.setAttribute("aria-hidden", "true");
        }
    };

    const showBannerIfNeeded = () => {
        if (!cookieBanner) {
            return;
        }
        const consent = localStorage.getItem(STORAGE.cookie);
        if (!consent) {
            cookieBanner.classList.add("is-visible");
            cookieBanner.setAttribute("aria-hidden", "false");
        } else {
            cookieBanner.classList.remove("is-visible");
            cookieBanner.setAttribute("aria-hidden", "true");
            body.dataset.cookieConsent = consent;
        }
    };

    if (cookieAccept) {
        cookieAccept.addEventListener("click", () => setConsent("accepted"));
    }

    if (cookieReject) {
        cookieReject.addEventListener("click", () => setConsent("declined"));
    }

    if (cookieManage) {
        cookieManage.addEventListener("click", () => {
            localStorage.removeItem(STORAGE.cookie);
            body.dataset.cookieConsent = "";
            showBannerIfNeeded();
        });
    }

    showBannerIfNeeded();
})();
