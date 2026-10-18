const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../../main/resources/static/readings-chart.js'), 'utf8');

function chart(width = 600) {
    const calls = [];
    const ctx = new Proxy({}, { get: (_, method) => method === 'measureText'
        ? text => ({ width: text.length * 6 }) : (...args) => calls.push([method, ...args]), set: () => true });
    const readout = {};
    const attributes = {};
    const canvas = { clientWidth: width, clientHeight: 280, getContext: () => ctx,
        parentElement: { querySelector: () => readout },
        getBoundingClientRect: () => ({ left: 0, width }),
        setAttribute: (key, value) => attributes[key] = value };
    const context = vm.createContext({ window: { devicePixelRatio: 2 }, document: { body: {} },
        getComputedStyle: () => ({ getPropertyValue: () => '#777777' }) });
    vm.runInContext(code, context);
    return { api: context.window.BTCharts, canvas, calls, readout, attributes,
        render: points => context.window.BTCharts.render(canvas, points, { color: '#2563eb', unit: 'V', name: 'Napięcie' }) };
}
const point = (minute, value, extra = {}) => ({ bucketTs: `2026-10-16T10:${String(minute).padStart(2, '0')}:00Z`, lastValue: value, ...extra });

test('chart keeps zero and negative readings, sorts times and skips missing or invalid samples', () => {
    const { api } = chart();
    const data = api.prepare([point(10, 2), point(0, 0), point(5, -1), point(2, null),
        { bucketTs: 'invalid', lastValue: 9 }, point(7, null, { avgValue: 1.5 })]);
    assert.deepEqual(Array.from(data, p => p.value), [0, -1, 1.5, 2]);
});

test('irregular time intervals are drawn proportionally, with readable values on pointer and keyboard input', () => {
    const { render, canvas, calls, readout } = chart();
    render([point(10, 240), point(1, 230), point(0, 220)]);
    const dots = calls.filter(call => call[0] === 'arc' && call[3] === 3);
    assert.equal(dots.length, 3);
    assert.ok(Math.abs((dots[1][1] - dots[0][1]) / (dots[2][1] - dots[0][1]) - 0.1) < 0.001);
    assert.match(readout.textContent, /240 V/);
    canvas.onpointermove({ clientX: dots[1][1] });
    assert.match(readout.textContent, /230 V/);
    canvas.onkeydown({ key: 'Home', preventDefault() {} });
    assert.match(readout.textContent, /220 V/);
    canvas.onpointerleave();
    assert.match(readout.textContent, /240 V/);
    assert.equal(canvas.width, 1200);
});

test('a single minute is centered, labelled and includes its aggregated range', () => {
    const { render, canvas, calls, readout } = chart(260);
    render([point(0, 230, { minValue: 225, maxValue: 235, count: 12 })]);
    const dot = calls.find(call => call[0] === 'arc');
    assert.ok(dot[1] > 100 && dot[1] < 220);
    assert.ok(calls.some(call => call[0] === 'fillText' && call[1] === '230 V'));
    canvas.onpointerdown({ clientX: 130 });
    assert.match(readout.textContent, /Min: 225 V · Maks: 235 V · Liczba próbek: 12/);
});

test('empty history clears previous interaction and constant series never draw invalid coordinates', () => {
    const { render, canvas, calls, readout } = chart();
    render([point(0, 0), point(1, 0)]);
    for (const call of calls) for (const value of call.slice(1)) {
        if (typeof value === 'number') assert.ok(Number.isFinite(value));
    }
    render([]);
    assert.equal(canvas.onpointermove, null);
    assert.equal(canvas.tabIndex, -1);
    assert.match(readout.textContent, /po odebraniu pomiarów/);
});

test('individual samples in one minute form a line using measurement timestamps', () => {
    const { render, calls } = chart();
    render([45, 5, 15].map((second, i) => point(0, [240, 220, 230][i], {
        timestamp: `2026-10-16T10:00:${String(second).padStart(2, '0')}Z`, sampleId: `minute#${i}`
    })));
    const dots = calls.filter(call => call[0] === 'arc' && call[3] === 3);
    assert.equal(dots.length, 3);
    assert.ok(dots[0][1] < dots[1][1] && dots[1][1] < dots[2][1]);
    assert.ok(dots[0][2] > dots[1][2] && dots[1][2] > dots[2][2]);
    assert.equal((dots[1][1] - dots[0][1]) / (dots[2][1] - dots[0][1]), 0.25);
    assert.ok(calls.some(call => call[0] === 'lineTo' && call[1] === dots[2][1] && call[2] === dots[2][2]));
    assert.ok(!calls.some(call => call[0] === 'setLineDash'), 'no vertical cursor before interaction');
});
