(() => {
    const number = value => value == null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
    const format = value => Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 4 });
    const prepare = points => points.map(point => {
        const value = number(point.lastValue) ?? number(point.avgValue) ?? number(point.maxValue);
        const time = Date.parse(point.timestamp || point.bucketTs || point._receivedAt);
        return { value, time, min: number(point.minValue) ?? value, max: number(point.maxValue) ?? value, count: point.count || 1 };
    }).filter(point => point.value !== null && Number.isFinite(point.time)).sort((a, b) => a.time - b.time);

    const render = (canvas, points, { color, unit = "", name = "Pomiar" }) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const series = prepare(points);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) return;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const styles = getComputedStyle(document.body);
        const css = name => styles.getPropertyValue(name).trim();
        const label = value => `${format(value)}${unit ? ` ${unit}` : ""}`;
        const date = time => new Date(time).toLocaleString("pl-PL");
        const readout = canvas.parentElement.querySelector(".metric-card__chart-readout");
        const describe = point => `${date(point.time)} · ${label(point.value)}` + (point.count > 1
            ? ` · Min: ${label(point.min)} · Maks: ${label(point.max)} · Liczba próbek: ${point.count}` : "");
        canvas.onpointermove = canvas.onpointerdown = canvas.onpointerleave = canvas.onkeydown = canvas.onfocus = canvas.onblur = null;
        canvas.tabIndex = series.length ? 0 : -1;
        if (!series.length) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = css("--muted");
            ctx.font = "14px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Brak danych do wyświetlenia", width / 2, height / 2);
            canvas.setAttribute("aria-label", `${name}: brak danych`);
            if (readout) readout.textContent = "Dane pojawią się po odebraniu pomiarów.";
            return;
        }

        let min = series.reduce((value, point) => Math.min(value, point.min, point.value), Infinity);
        let max = series.reduce((value, point) => Math.max(value, point.max, point.value), -Infinity);
        const margin = (max - min) * 0.12 || Math.max(Math.abs(min) * 0.02, 0.01);
        min -= margin;
        max += margin;
        const axisFormat = value => {
            const magnitude = Math.abs(value);
            return magnitude >= 1e6 || (magnitude > 0 && magnitude < 0.001)
                ? value.toExponential(1) : value.toLocaleString("pl-PL", { maximumFractionDigits: 3 });
        };
        ctx.font = "12px system-ui, sans-serif";
        const ticks = Array.from({ length: 5 }, (_, i) => max - (max - min) * i / 4);
        const left = Math.min(width * 0.36, Math.max(48, ...ticks.map(value => ctx.measureText(axisFormat(value)).width + 12)));
        const plot = { left, right: width - 16, top: 28, bottom: height - 52 };
        const firstTime = series[0].time;
        const lastTime = series[series.length - 1].time;
        const x = point => lastTime === firstTime ? (plot.left + plot.right) / 2
            : plot.left + (point.time - firstTime) / (lastTime - firstTime) * (plot.right - plot.left);
        const y = value => plot.bottom - (value - min) / (max - min) * (plot.bottom - plot.top);
        let active = series.length - 1;
        let showCursor = false;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = css("--surface-alt");
            ctx.fillRect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top);
            ctx.font = "12px system-ui, sans-serif";
            ctx.fillStyle = css("--muted");
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 1;
            ctx.strokeStyle = css("--border");
            ticks.forEach(value => {
                ctx.beginPath(); ctx.moveTo(plot.left, y(value)); ctx.lineTo(plot.right, y(value)); ctx.stroke();
                ctx.fillText(axisFormat(value), plot.left - 8, y(value), plot.left - 12);
            });
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(unit || "Wartość", plot.left, 5);
            const tickCount = lastTime === firstTime ? 1 : width < 480 ? 2 : 3;
            for (let i = 0; i < tickCount; i++) {
                const fraction = tickCount === 1 ? 0.5 : i / (tickCount - 1);
                const time = firstTime + (lastTime - firstTime) * fraction;
                const tickX = plot.left + (plot.right - plot.left) * fraction;
                ctx.textAlign = tickCount === 1 ? "center" : i === 0 ? "left" : i === tickCount - 1 ? "right" : "center";
                const stamp = new Date(time);
                ctx.fillText(stamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), tickX, plot.bottom + 10);
                ctx.fillText(stamp.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }), tickX, plot.bottom + 28);
            }

            // The shaded band shows the actual range of samples in each minute.
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            series.forEach((point, i) => i ? ctx.lineTo(x(point), y(point.max)) : ctx.moveTo(x(point), y(point.max)));
            [...series].reverse().forEach(point => ctx.lineTo(x(point), y(point.min)));
            ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = "round";
            ctx.beginPath();
            series.forEach((point, i) => i ? ctx.lineTo(x(point), y(point.value)) : ctx.moveTo(x(point), y(point.value)));
            ctx.stroke();
            if (series.length === 1) {
                const point = series[0];
                ctx.beginPath(); ctx.moveTo(x(point), y(point.min)); ctx.lineTo(x(point), y(point.max)); ctx.stroke();
            }
            if (series.length <= 40) series.forEach(point => {
                ctx.beginPath(); ctx.arc(x(point), y(point.value), 3, 0, Math.PI * 2); ctx.fill();
            });
            const point = series[active];
            if (showCursor) {
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(x(point), plot.top); ctx.lineTo(x(point), plot.bottom); ctx.stroke();
                ctx.restore();
            }
            ctx.beginPath(); ctx.arc(x(point), y(point.value), 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = css("--surface"); ctx.lineWidth = 2; ctx.stroke();
            if (series.length === 1) {
                ctx.fillStyle = css("--text-strong");
                ctx.font = "600 14px system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillText(label(point.value), x(point), Math.max(plot.top + 18, y(point.value) - 12), plot.right - plot.left);
            }
            if (readout) readout.textContent = describe(point);
        };
        canvas.setAttribute("aria-label", `${name}. ${series.length} punktów. Ostatni: ${describe(series[active])}. Użyj strzałek w lewo i w prawo, aby przeglądać odczyty.`);
        canvas.onpointermove = canvas.onpointerdown = event => {
            const rect = canvas.getBoundingClientRect();
            const pointerX = (event.clientX - rect.left) * width / rect.width;
            active = series.reduce((best, point, i) => Math.abs(x(point) - pointerX) < Math.abs(x(series[best]) - pointerX) ? i : best, 0);
            showCursor = true;
            draw();
        };
        canvas.onpointerleave = canvas.onblur = () => { active = series.length - 1; showCursor = false; draw(); };
        canvas.onfocus = () => { showCursor = true; draw(); };
        canvas.onkeydown = event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            showCursor = true;
            active = event.key === "Home" ? 0 : event.key === "End" ? series.length - 1
                : Math.max(0, Math.min(series.length - 1, active + (event.key === "ArrowLeft" ? -1 : 1)));
            draw();
        };
        draw();
    };
    window.BTCharts = { render, prepare };
})();
