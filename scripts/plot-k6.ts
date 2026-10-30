import fs from "node:fs";
import readline from "node:readline";

type Bucket = { durations: number[]; reqs: number; failed: number };

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("usage: tsx scripts/plot-k6.ts reports/run.csv");
    process.exit(1);
  }
  const output = input.replace(/\.csv$/, ".html");

  const buckets = new Map<number, Bucket>();
  const bucket = (sec: number): Bucket => {
    let b = buckets.get(sec);
    if (!b) buckets.set(sec, (b = { durations: [], reqs: 0, failed: 0 }));
    return b;
  };

  const rl = readline.createInterface({
    input: fs.createReadStream(input),
    crlfDelay: Infinity,
  });

  let header = true;
  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    // only the first 3 columns matter: metric_name,timestamp,metric_value
    const i1 = line.indexOf(",");
    const i2 = line.indexOf(",", i1 + 1);
    const i3 = line.indexOf(",", i2 + 1);
    const metric = line.slice(0, i1);
    const sec = Math.floor(Number(line.slice(i1 + 1, i2)));
    const value = Number(line.slice(i2 + 1, i3 === -1 ? undefined : i3));

    if (metric === "http_req_duration") bucket(sec).durations.push(value);
    else if (metric === "http_reqs") bucket(sec).reqs += value;
    else if (metric === "http_req_failed") bucket(sec).failed += value;
  }

  const secs = [...buckets.keys()].sort((a, b) => a - b);
  const start = secs[0];
  const labels = secs.map((s) => s - start);

  const avg: number[] = [];
  const p95: number[] = [];
  const rps: number[] = [];
  const errPct: number[] = [];

  for (const s of secs) {
    const b = buckets.get(s)!;
    const sorted = b.durations.sort((x, y) => x - y);
    avg.push(
      sorted.length ? sorted.reduce((a, c) => a + c, 0) / sorted.length : 0,
    );
    p95.push(percentile(sorted, 0.95));
    rps.push(b.reqs);
    errPct.push(b.reqs ? (b.failed / b.reqs) * 100 : 0);
  }

  const data = JSON.stringify({ labels, avg, p95, rps, errPct });

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${input}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>body{font-family:sans-serif;max-width:1100px;margin:2rem auto}canvas{margin-bottom:2rem}</style>
</head><body>
<h2>${input}</h2>
<canvas id="lat" height="90"></canvas>
<canvas id="rps" height="90"></canvas>
<canvas id="err" height="90"></canvas>
<script>
const d = ${data};
const make = (id, title, datasets, yTitle) => new Chart(document.getElementById(id), {
  type: "line",
  data: { labels: d.labels, datasets },
  options: {
    animation: false,
    plugins: { title: { display: true, text: title } },
    scales: {
      x: { title: { display: true, text: "seconds since start" } },
      y: { title: { display: true, text: yTitle }, beginAtZero: true }
    },
    elements: { point: { radius: 0 } }
  }
});
make("lat", "Latency", [
  { label: "avg", data: d.avg, borderColor: "#378ADD" },
  { label: "p95", data: d.p95, borderColor: "#D85A30" }
], "ms");
make("rps", "Requests per second", [{ label: "req/s", data: d.rps, borderColor: "#1D9E75" }], "req/s");
make("err", "Error rate", [{ label: "errors", data: d.errPct, borderColor: "#E24B4A" }], "%");
</script></body></html>`;

  fs.writeFileSync(output, html);
  console.log("wrote", output);
}

main();
