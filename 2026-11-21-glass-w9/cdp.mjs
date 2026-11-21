// node cdp.mjs <port> <js expression>  -> evaluates in the elbo://app page, prints the result
const [port, expr] = process.argv.slice(2);
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page" && /^elbo/.test(t.url));
if (!page) { console.log("no page", JSON.stringify(list.map((t) => t.url))); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, awaitPromise: true, returnByValue: true } }));
const msg = await new Promise((r) => ws.addEventListener("message", (e) => r(JSON.parse(e.data)), { once: true }));
console.log(JSON.stringify(msg.result?.result?.value ?? msg.result ?? msg.error));
ws.close();
