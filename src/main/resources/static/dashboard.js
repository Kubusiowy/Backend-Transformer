const statTransformers = document.getElementById("statTransformers");
const statMeters = document.getElementById("statMeters");
const statRegisters = document.getElementById("statRegisters");
const statLastRead = document.getElementById("statLastRead");
const roleNote = document.getElementById("roleNote");

const updateRoleNote = () => {
    const isAdmin = Boolean(window.BT_AUTH?.isAdmin);
    if (roleNote) {
        roleNote.textContent = isAdmin
            ? "Masz role admin - mozesz zarzadzac wszystkimi uzytkownikami i danymi."
            : "Rola user ma dostep do wlasnych danych. Skontaktuj sie z administratorem po role admin.";
    }
};

const updateStats = async () => {
    if (!window.BT_API?.request) {
        return;
    }
    try {
        const transformers = await window.BT_API.request("GET", "/transformers");
        const list = Array.isArray(transformers) ? transformers : [];
        let meterCount = 0;
        let registerCount = 0;

        await Promise.all(
            list.map(async (transformer) => {
                try {
                    const meters = await window.BT_API.request(
                        "GET",
                        `/transformers/${transformer.id}/meters`
                    );
                    const meterList = Array.isArray(meters) ? meters : [];
                    meterCount += meterList.length;
                    await Promise.all(
                        meterList.map(async (meter) => {
                            try {
                                const registers = await window.BT_API.request(
                                    "GET",
                                    `/meters/${meter.id}/registers`
                                );
                                registerCount += Array.isArray(registers) ? registers.length : 0;
                            } catch (error) {
                                // ignore register errors in stats
                            }
                        })
                    );
                } catch (error) {
                    // ignore meter errors in stats
                }
            })
        );

        if (statTransformers) {
            statTransformers.textContent = String(list.length);
        }
        if (statMeters) {
            statMeters.textContent = String(meterCount);
        }
        if (statRegisters) {
            statRegisters.textContent = String(registerCount);
        }
        if (statLastRead) {
            statLastRead.textContent = window.BTData ? window.BTData.getLastRead() : "Brak";
        }
    } catch (error) {
        if (statTransformers) {
            statTransformers.textContent = "0";
        }
        if (statMeters) {
            statMeters.textContent = "0";
        }
        if (statRegisters) {
            statRegisters.textContent = "0";
        }
        if (statLastRead) {
            statLastRead.textContent = window.BTData ? window.BTData.getLastRead() : "Brak";
        }
    }
};

updateRoleNote();
updateStats();
