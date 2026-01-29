const profileId = document.getElementById("profileId");
const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");
const profileLogin = document.getElementById("profileLogin");
const profileSession = document.getElementById("profileSession");

const auth = window.BT_AUTH || {};
const storage = window.BT_STORAGE || {};

if (profileId) {
    profileId.textContent = auth.userId || "(brak)";
}
if (profileEmail) {
    profileEmail.textContent = auth.userEmail || "(brak)";
}
if (profileRole) {
    profileRole.textContent = auth.role || "user";
}
if (profileLogin) {
    const lastLogin = localStorage.getItem(storage.lastLogin || "bt_last_login");
    profileLogin.textContent = lastLogin ? new Date(lastLogin).toLocaleString("pl-PL") : "Brak danych";
}
if (profileSession) {
    profileSession.textContent = auth.refreshToken ? "Aktywna" : "Brak";
}
