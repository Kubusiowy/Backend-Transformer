const statTransformers = document.getElementById("statTransformers");
const statMeters = document.getElementById("statMeters");
const statRegisters = document.getElementById("statRegisters");
const statLastRead = document.getElementById("statLastRead");
const roleNote = document.getElementById("roleNote");
const dashboardStatus = document.getElementById("dashboardStatus");

const updateStats = async () => {
    roleNote.textContent = window.BT_AUTH?.isAdmin
        ? "Widok administratora obejmuje wszystkie instalacje."
        : "Widoczne są instalacje przypisane do Twojego konta.";
    statLastRead.textContent = window.BTData?.getLastRead() || "Brak";
    try {
        const transformers = await window.BT_API.request("GET", "/transformers");
        let metersCount = 0;
        let registersCount = 0;
        let incomplete = false;
        // Bound concurrent requests instead of flooding the connection pool.
        for (const transformer of transformers) {
            try {
                const meters = await window.BT_API.request("GET", `/transformers/${transformer.id}/meters`);
                metersCount += meters.length;
                for (const meter of meters) {
                    const registers = await window.BT_API.request("GET", `/meters/${meter.id}/registers`);
                    registersCount += registers.length;
                }
            } catch { incomplete = true; }
        }
        statTransformers.textContent = String(transformers.length);
        statMeters.textContent = incomplete ? "—" : String(metersCount);
        statRegisters.textContent = incomplete ? "—" : String(registersCount);
        dashboardStatus.textContent = incomplete ? "Część danych jest niedostępna. Odśwież stronę, aby spróbować ponownie." : "";
    } catch {
        for (const element of [statTransformers, statMeters, statRegisters]) element.textContent = "—";
        dashboardStatus.textContent = "Nie udało się pobrać podsumowania. Sprawdź połączenie i odśwież stronę.";
    }
};
updateStats();
