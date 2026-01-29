const statTransformers = document.getElementById("statTransformers");
const statMeters = document.getElementById("statMeters");
const statRegisters = document.getElementById("statRegisters");
const statLastRead = document.getElementById("statLastRead");
const roleNote = document.getElementById("roleNote");

const allTransformers = window.BTData ? window.BTData.loadTransformers() : [];
const visibleTransformers = window.BTData ? window.BTData.getScopedTransformers(allTransformers) : [];

if (statTransformers) {
    statTransformers.textContent = String(visibleTransformers.length);
}
if (statMeters) {
    statMeters.textContent = String(window.BTData ? window.BTData.countMeters(visibleTransformers) : 0);
}
if (statRegisters) {
    statRegisters.textContent = String(window.BTData ? window.BTData.countRegisters(visibleTransformers) : 0);
}
if (statLastRead) {
    statLastRead.textContent = window.BTData ? window.BTData.getLastRead() : "Brak";
}

if (roleNote && window.BT_AUTH) {
    roleNote.textContent = window.BT_AUTH.isAdmin
        ? "Masz role admin - mozesz zarzadzac wszystkimi uzytkownikami i danymi."
        : "Rola user ma dostep do wlasnych danych. Skontaktuj sie z administratorem po role admin.";
}
