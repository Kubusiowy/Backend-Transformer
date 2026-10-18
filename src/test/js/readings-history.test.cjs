const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function readings(page = 'readings-charts') {
    const context = vm.createContext({
        window: { addEventListener() {} },
        document: { body: { dataset: { page } }, getElementById: () => null },
        setTimeout, clearTimeout
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../main/resources/static/readings.js'), 'utf8'), context);
    vm.runInContext(`selectedTransformerId = 't1'; selectedRegisterKeys = new Set(['x']);`, context);
    return {
        send: point => { context.message = point; vm.runInContext('handleWsMessage(message)', context); },
        points: () => JSON.parse(vm.runInContext('JSON.stringify(metricsByKey.x)', context)),
        merge: points => { context.history = points; vm.runInContext('metricsByKey.x = mergeMetricPoints(history, metricsByKey.x || [])', context); },
        prune: () => vm.runInContext('pruneMetricsStore()', context),
        fetch: (request, isCurrent = () => true) => {
            context.window.BT_API = { request };
            context.isCurrent = isCurrent;
            return vm.runInContext("fetchMetricHistory('t1', 'x', isCurrent)", context);
        }
    };
}
const sample = (sequence, second, value) => ({ transformerId: 't1', key: 'x',
    bucketTs: '2026-10-16T10:00:00Z', timestamp: `2026-10-16T10:00:${second}Z`,
    sampleId: `2026-10-16T10:00#${sequence}`, count: sequence, lastValue: value, minValue: 0, maxValue: 999 });

test('live chart retains every sample in a minute, sorts late samples and deduplicates after reload', () => {
    const app = readings();
    const first = sample(1, '05', 220), second = sample(2, '15', 230), third = sample(3, '45', 240);
    app.send(first); app.send(third); app.send(second); app.send(second);
    assert.deepEqual(app.points().map(p => p.lastValue), [240, 230, 220]);
    assert.ok(app.points().every(p => p.minValue === p.lastValue && p.maxValue === p.lastValue && p.count === 1));
    app.merge([first, second, third]);
    assert.equal(app.points().length, 3);
    app.send({ ...sample(4, '55', 999), transformerId: 'another' });
    assert.equal(app.points().length, 3);
});

const longHistory = length => Array.from({ length }, (_, index) => {
    const timestamp = new Date(Date.UTC(2026, 9, 16, 10, 0, index)).toISOString();
    return { transformerId: 't1', key: 'x', timestamp,
        bucketTs: timestamp.slice(0, 16) + ':00.000Z', sampleId: `${timestamp}#1`, count: 1, lastValue: index };
});

test('chart keeps the start of history beyond 5000 points, including live updates and selection changes', () => {
    const app = readings();
    const history = longHistory(5101);
    app.merge(history.slice(0, -1));
    app.send(history.at(-1));
    app.prune();
    app.merge(history);
    assert.equal(app.points().length, 5101);
    assert.equal(app.points().at(-1).timestamp, history[0].timestamp);
    assert.equal(app.points()[0].timestamp, history.at(-1).timestamp);
});

test('chart fetches every page back to the first measurement using the oldest sample cursor', async () => {
    const app = readings();
    const history = longHistory(5101).reverse();
    const requests = [];
    const points = await app.fetch(async (method, url) => {
        const query = new URL(url, 'http://localhost').searchParams;
        assert.equal(query.get('resolution'), 'samples');
        assert.equal(query.get('order'), 'desc');
        const offset = requests.length * 1000;
        if (offset) {
            assert.equal(query.get('before'), history[offset - 1].timestamp);
            assert.equal(query.get('beforeSequence'), '1');
        }
        requests.push(url);
        return history.slice(offset, offset + Number(query.get('limit')));
    });
    assert.equal(requests.length, 6);
    assert.equal(points.length, history.length);
    assert.equal(points.at(-1).timestamp, history.at(-1).timestamp);
});

test('changing the selected device cancels remaining history requests', async () => {
    const app = readings();
    let current = true, requests = 0;
    const points = await app.fetch(async () => {
        requests++;
        current = false;
        return longHistory(1000).reverse();
    }, () => current);
    assert.equal(requests, 1);
    assert.equal(points.length, 0);
});

test('data page still fetches and retains only its configured recent history', async () => {
    const app = readings('readings-data');
    let requests = 0;
    await app.fetch(async (method, url) => {
        requests++;
        assert.equal(new URL(url, 'http://localhost').searchParams.get('limit'), '120');
        return longHistory(120);
    });
    app.merge(longHistory(8000));
    app.prune();
    assert.equal(requests, 1);
    assert.equal(app.points().length, 120);
});

test('chart replaces a minute aggregate with individual readings while data page retains aggregates', () => {
    const app = readings();
    app.send({ transformerId: 't1', key: 'x', bucketTs: '2026-10-16T10:00:00Z', lastValue: 210, count: 1 });
    app.send(sample(2, '15', 230));
    assert.equal(app.points().length, 1);
    assert.equal(app.points()[0].lastValue, 230);
    const data = readings('readings-data');
    data.send(sample(2, '15', 230)); data.send(sample(1, '05', 220));
    assert.equal(data.points().length, 1);
    assert.equal(data.points()[0].lastValue, 230);
    assert.equal(data.points()[0].count, 2);
});
