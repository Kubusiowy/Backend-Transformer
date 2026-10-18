const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../main/resources/static');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const storage = initial => {
    const data = new Map(Object.entries(initial || {}));
    return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, text: async () => data == null ? '' : JSON.stringify(data) });
function api(fetch, timers = {}) {
    const context = vm.createContext({ window: {}, location: { protocol: 'http:', host: 'localhost' },
        sessionStorage: storage({ bt_access_token: 'old-access', bt_refresh_token: 'refresh' }), localStorage: storage(),
        fetch, AbortController, setTimeout, clearTimeout, ...timers });
    vm.runInContext(source('api.js'), context);
    return context;
}

test('every page script combination compiles without duplicate global declarations', () => {
    for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
        const html = source(file);
        const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => source(match[1]));
        assert.doesNotThrow(() => new vm.Script(scripts.join('\n;\n'), { filename: file }));
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(new Set(ids).size, ids.length, `Duplicate IDs in ${file}`);
    }
});

test('simultaneous unauthorized requests share one refresh', async () => {
    let refreshes = 0;
    const context = api(async (url, options) => {
        if (url === '/auth/refresh') {
            refreshes++;
            await new Promise(resolve => setTimeout(resolve, 10));
            return response(200, { accessToken: 'new-access' });
        }
        return options.headers.Authorization === 'Bearer new-access' ? response(200, { ok: true }) : response(401);
    });
    const results = await Promise.all(Array.from({ length: 10 }, () => context.window.BT_API.request('GET', '/transformers')));
    assert.equal(refreshes, 1);
    assert.ok(results.every(value => value.ok));
});

test('a refresh finishing after logout cannot restore the session', async () => {
    let finish;
    const context = api(() => new Promise(resolve => { finish = () => resolve(response(200, {accessToken:'late'})); }));
    const pending = context.window.BT_API.refreshAccessToken();
    context.sessionStorage.removeItem('bt_refresh_token');
    context.sessionStorage.removeItem('bt_access_token');
    finish();
    assert.equal(await pending, null);
    assert.equal(context.sessionStorage.getItem('bt_access_token'), null);
});

test('temporary server errors preserve the session but revoked refresh tokens clear it', async () => {
    let status = 503;
    const context = api(async () => response(status));
    await assert.rejects(context.window.BT_API.refreshAccessToken());
    assert.equal(context.sessionStorage.getItem('bt_refresh_token'), 'refresh');
    status = 401;
    assert.equal(await context.window.BT_API.refreshAccessToken(), null);
    assert.equal(context.sessionStorage.getItem('bt_refresh_token'), null);
});

test('request timeouts report a recoverable error and do not replay writes', async () => {
    let count = 0;
    const context = api((url, options) => new Promise((resolve, reject) => {
        count++;
        options.signal.addEventListener('abort', () => { const error = new Error('timeout'); error.name = 'AbortError'; reject(error); });
    }), {setTimeout: callback => setTimeout(callback, 5)});
    await assert.rejects(context.window.BT_API.request('POST', '/transformers', {name:'X'}), /Serwer nie odpowiada/);
    assert.equal(count, 1);
});

test('device text is escaped before inserting it into HTML', () => {
    const context = vm.createContext({window:{}, document:{body:null}});
    vm.runInContext(source('ui.js'), context);
    const html = context.window.BT_HTML(['<div>', '</div>'], '<img src=x onerror="alert(1)">');
    assert.equal(html, '<div>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</div>');
});
