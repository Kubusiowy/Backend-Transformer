(() => {
    const STORAGE = window.BT_STORAGE || {
        refresh: "bt_refresh_token",
        access: "bt_access_token"
    };

    const getAccessToken = () => sessionStorage.getItem(STORAGE.access);
    const getRefreshToken = () => localStorage.getItem(STORAGE.refresh);

    const refreshAccessToken = async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            return null;
        }
        const response = await fetch("/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });
        if (!response.ok) {
            return null;
        }
        const data = await response.json().catch(() => null);
        const nextAccess = data?.accessToken || null;
        if (nextAccess) {
            sessionStorage.setItem(STORAGE.access, nextAccess);
        }
        return nextAccess;
    };

    const apiRequest = async (method, url, body) => {
        const headers = { "Content-Type": "application/json" };
        const token = getAccessToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                headers.Authorization = `Bearer ${refreshed}`;
                const retry = await fetch(url, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined
                });
                if (!retry.ok) {
                    const errData = await retry.json().catch(() => null);
                    throw new Error(errData?.message || "Request failed");
                }
                if (retry.status === 204) {
                    return null;
                }
                return retry.json().catch(() => null);
            }
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || "Request failed");
        }
        if (response.status === 204) {
            return null;
        }
        return response.json().catch(() => null);
    };

    window.BT_API = {
        request: apiRequest,
        refreshAccessToken
    };
})();
