const AUTH = window.BT_AUTH || {};
const STORAGE = window.BT_STORAGE || {
    transformers: "bt_transformers",
    selected: "bt_transformer_selected",
    meterSelected: "bt_meter_selected",
    lastRead: "bt_last_read"
};

const currentUserId = AUTH.userId || "(brak)";
const isAdmin = Boolean(AUTH.isAdmin);

const safeId = () => {
    if (crypto && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeMeter = (meter) => ({
    id: meter.id,
    name: meter.name,
    deviceCode: meter.deviceCode,
    enabled: meter.enabled !== false,
    serialPort: meter.serialPort,
    baudRate: meter.baudRate,
    parity: meter.parity || "NONE",
    stopBits: meter.stopBits || 1,
    slaveId: meter.slaveId,
    pollIntervalMs: meter.pollIntervalMs || 1000,
    registers: Array.isArray(meter.registers) ? meter.registers : []
});

const normalizeTransformer = (transformer) => {
    const owner =
        transformer.userId || (!isAdmin && currentUserId !== "(brak)" ? currentUserId : null);
    return {
        ...transformer,
        userId: owner,
        meters: Array.isArray(transformer.meters) ? transformer.meters.map(normalizeMeter) : []
    };
};

const loadTransformers = () => {
    try {
        const raw = localStorage.getItem(STORAGE.transformers);
        const parsed = raw ? JSON.parse(raw) : [];
        const normalized = parsed.map(normalizeTransformer);
        localStorage.setItem(STORAGE.transformers, JSON.stringify(normalized));
        return normalized;
    } catch (error) {
        return [];
    }
};

const saveTransformers = (items) => {
    localStorage.setItem(STORAGE.transformers, JSON.stringify(items));
};

const getScopedTransformers = (items) => {
    if (isAdmin) {
        return items;
    }
    return items.filter((transformer) => transformer.userId === currentUserId);
};

const getSelectedId = () => localStorage.getItem(STORAGE.selected) || null;

const setSelectedId = (id) => {
    if (id) {
        localStorage.setItem(STORAGE.selected, id);
    } else {
        localStorage.removeItem(STORAGE.selected);
    }
};

const getSelectedTransformer = (items) => items.find((t) => t.id === getSelectedId()) || null;

const getSelectedMeters = (items) => {
    const transformer = getSelectedTransformer(items);
    if (!transformer) {
        return [];
    }
    if (!Array.isArray(transformer.meters)) {
        transformer.meters = [];
    }
    return transformer.meters;
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

const getSelectedMeter = (items) => {
    const transformer = getSelectedTransformer(items);
    if (!transformer) {
        return null;
    }
    const info = getSelectedMeterInfo();
    const meters = getSelectedMeters(items);
    if (info && info.transformerId === transformer.id) {
        return meters.find((meter) => meter.id === info.meterId) || null;
    }
    return meters[0] || null;
};

const countMeters = (items) => items.reduce((sum, transformer) => sum + (transformer.meters?.length || 0), 0);

const countRegisters = (items) =>
    items.reduce(
        (sum, transformer) =>
            sum + (transformer.meters || []).reduce((inner, meter) => inner + (meter.registers?.length || 0), 0),
        0
    );

const getLastRead = () => localStorage.getItem(STORAGE.lastRead) || "Brak";

const setLastRead = (value) => {
    if (value) {
        localStorage.setItem(STORAGE.lastRead, value);
    }
};

window.BTData = {
    safeId,
    loadTransformers,
    saveTransformers,
    normalizeTransformer,
    getScopedTransformers,
    getSelectedId,
    setSelectedId,
    getSelectedTransformer,
    getSelectedMeters,
    getSelectedMeterInfo,
    setSelectedMeterInfo,
    getSelectedMeter,
    countMeters,
    countRegisters,
    getLastRead,
    setLastRead
};
