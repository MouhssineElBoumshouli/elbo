const { app, BrowserWindow, nativeTheme, desktopCapturer, screen } = require("electron");
const fs = require("fs"); const path = require("path");
const out = path.join(__dirname, "..", "shots"); fs.mkdirSync(out, { recursive: true });
const log = []; const note = (s) => { log.push(s); fs.writeFileSync(path.join(out, "log.txt"), log.join("\n")); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const base = (dark) => ({
  x: 120, y: 120, width: 900, height: 560, show: false, autoHideMenuBar: true, alwaysOnTop: true,
  backgroundColor: dark ? "#000000" : "#ffffff",
  titleBarStyle: "hidden",
  titleBarOverlay: { color: "#01000000", height: 40, symbolColor: dark ? "#f8fafc" : "#1f2937" },
});
async function shot(win, name) {
  await wait(1500);
  const d = screen.getDisplayMatching(win.getBounds()); const sf = d.scaleFactor;
  const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: d.size.width * sf, height: d.size.height * sf } });
  const src = sources.find((s) => String(s.display_id) === String(d.id)) || sources[0];
  const b = win.getBounds();
  const img = src.thumbnail.crop({ x: Math.round((b.x - d.bounds.x) * sf), y: Math.round((b.y - d.bounds.y) * sf), width: Math.round(b.width * sf), height: Math.round(b.height * sf) });
  fs.writeFileSync(path.join(out, name + ".png"), img.toPNG()); note("shot " + name + " bounds " + JSON.stringify(b) + " focused=" + win.isFocused());
}
async function open(opts, query) {
  const win = new BrowserWindow(opts);
  await win.loadFile(path.join(__dirname, "page.html"), { query });
  win.show(); win.focus(); return win;
}
const glassOn = (w) => { w.setBackgroundMaterial("mica"); w.setBackgroundColor("#00000000"); };
app.whenReady().then(async () => {
  try {
    note("os " + process.getSystemVersion() + " reducedTransparency(nativeTheme)=" + nativeTheme.prefersReducedTransparency);
    nativeTheme.themeSource = "light";
    let w = await open(base(false), {});
    note("renderer " + JSON.stringify(await w.webContents.executeJavaScript("window.__info")));
    glassOn(w); await shot(w, "1-runtime-light");
    nativeTheme.themeSource = "dark"; await w.loadFile(path.join(__dirname, "page.html"), { query: { dark: "1" } });
    w.setTitleBarOverlay({ color: "#01000000", height: 40, symbolColor: "#f8fafc" });
    await shot(w, "2-runtime-dark");
    const other = new BrowserWindow({ x: 1100, y: 140, width: 200, height: 120, alwaysOnTop: true }); other.focus();
    await shot(w, "3-inactive-dark"); other.destroy(); w.focus();
    w.setBackgroundMaterial("none"); w.setBackgroundColor("#000000");
    await w.loadFile(path.join(__dirname, "page.html"), { query: { dark: "1", solid: "1" } });
    await shot(w, "4-runtime-off-dark");
    glassOn(w); await w.loadFile(path.join(__dirname, "page.html"), { query: { dark: "1" } });
    await shot(w, "5-back-on-dark");
    w.maximize(); await wait(500); await shot(w, "6-maximized-dark"); w.unmaximize(); await wait(500); await shot(w, "7-unmaximized-dark");
    w.destroy();
    nativeTheme.themeSource = "light";
    w = await open({ ...base(false), backgroundMaterial: "mica", backgroundColor: "#00000000" }, {});
    await shot(w, "8-created-with-mica-light"); w.destroy();
  } catch (e) { note("error " + (e && e.stack)); }
  app.quit();
});
