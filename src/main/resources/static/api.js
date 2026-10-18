(() => {
    const config = window.BT_CONFIG || {};
    const base = (config.apiBase || "").replace(/\/$/, "");
    const wsBase = (config.wsBase || "").replace(/\/$/, "") || `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`;
    const buildUrl = path => `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const buildWsUrl = path => `${wsBase}${path.startsWith("/") ? path : `/${path}`}`;
    const getAccessToken = () => sessionStorage.getItem("bt_access_token");
    const getRefreshToken = () => sessionStorage.getItem("bt_refresh_token") || localStorage.getItem("bt_refresh_token");
    let refreshPromise = null;

    const fetchWithTimeout = async (url, options) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            // Read the body before clearing the timeout, too.
            const text = await response.text();
            let data = null;
            if (text) {
                try { data = JSON.parse(text); }
                catch { if (response.ok) throw new Error("Serwer zwrócił niepoprawną odpowiedź."); }
            }
            return { response, data };
        } catch (error) {
            if (error.name === "AbortError") throw new Error("Serwer nie odpowiada. Spróbuj ponownie.");
            throw error;
        } finally { clearTimeout(timer); }
    };

    const refreshAccessToken = () => {
        if (refreshPromise) return refreshPromise;
        const refreshToken = getRefreshToken();
        if (!refreshToken) return Promise.resolve(null);
        refreshPromise = (async () => {
            const { response, data } = await fetchWithTimeout(buildUrl("/auth/refresh"), {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken })
            });
            if (getRefreshToken() !== refreshToken) return null;
            if (response.status === 401 || response.status === 400) {
                sessionStorage.removeItem("bt_access_token");
                sessionStorage.removeItem("bt_refresh_token");
                localStorage.removeItem("bt_refresh_token");
                return null;
            }
            if (!response.ok) throw new Error(data?.message || "Nie udało się odnowić sesji.");
            if (!data?.accessToken) throw new Error("Brak tokenu w odpowiedzi serwera.");
            sessionStorage.setItem("bt_access_token", data.accessToken);
            return data.accessToken;
        })().finally(() => { refreshPromise = null; });
        return refreshPromise;
    };

    const request = async (method, path, body) => {
        const headers = { "Content-Type": "application/json" };
        const token = getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const options = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) };
        let result = await fetchWithTimeout(buildUrl(path), options);
        if (result.response.status === 401 && !path.startsWith("/auth/")) {
            const refreshed = getAccessToken() !== token ? getAccessToken() : await refreshAccessToken();
            if (refreshed) {
                headers.Authorization = `Bearer ${refreshed}`;
                result = await fetchWithTimeout(buildUrl(path), options);
            }
        }
        if (!result.response.ok) {
            const error = new Error(result.response.status === 401 ? "Unauthorized" : result.data?.message || `Błąd serwera (${result.response.status}).`);
            error.status = result.response.status;
            throw error;
        }
        return result.data;
    };
    window.BT_API = { request, refreshAccessToken, buildUrl, buildWsUrl, getAccessToken };
})();
