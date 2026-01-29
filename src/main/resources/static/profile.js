const profileId = document.getElementById("profileId");
const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");
const profileLogin = document.getElementById("profileLogin");
const profileSession = document.getElementById("profileSession");

const storage = window.BT_STORAGE || {};

const setProfile = (me) => {
    if (profileId) {
        profileId.textContent = me?.id || window.BT_AUTH?.userId || "(brak)";
    }
    if (profileEmail) {
        profileEmail.textContent = me?.email || window.BT_AUTH?.userEmail || "(brak)";
    }
    if (profileRole) {
        profileRole.textContent = (me?.role || window.BT_AUTH?.role || "user").toString().toLowerCase();
    }
};

const loadProfile = async () => {
    if (window.BT_API?.request) {
        try {
            const me = await window.BT_API.request("GET", "/me");
            setProfile(me);
            return;
        } catch (error) {
            setProfile(null);
        }
    } else {
        setProfile(null);
    }
};

if (profileLogin) {
    const lastLogin = localStorage.getItem(storage.lastLogin || "bt_last_login");
    profileLogin.textContent = lastLogin ? new Date(lastLogin).toLocaleString("pl-PL") : "Brak danych";
}

if (profileSession) {
    profileSession.textContent = window.BT_AUTH?.refreshToken ? "Aktywna" : "Brak";
}

loadProfile();
