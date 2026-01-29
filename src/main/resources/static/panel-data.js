const STORAGE = window.BT_STORAGE || {
    selected: "bt_transformer_selected",
    meterSelected: "bt_meter_selected",
    lastRead: "bt_last_read"
};

const getSelectedId = () => localStorage.getItem(STORAGE.selected) || null;

const setSelectedId = (id) => {
    if (id) {
        localStorage.setItem(STORAGE.selected, id);
    } else {
        localStorage.removeItem(STORAGE.selected);
    }
};

const getSelectedMeterInfo = () => {
    const raw = localStorage.getItem(STORAGE.meterSelected);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
};

const setSelectedMeterInfo = (transformerId, meterId) => {
    if (transformerId && meterId) {
        localStorage.setItem(STORAGE.meterSelected, JSON.stringify({ transformerId, meterId }));
    } else {
        localStorage.removeItem(STORAGE.meterSelected);
    }
};

const getLastRead = () => localStorage.getItem(STORAGE.lastRead) || "Brak";

const setLastRead = (value) => {
    if (value) {
        localStorage.setItem(STORAGE.lastRead, value);
    }
};

window.BTData = {
    getSelectedId,
    setSelectedId,
    getSelectedMeterInfo,
    setSelectedMeterInfo,
    getLastRead,
    setLastRead
};
