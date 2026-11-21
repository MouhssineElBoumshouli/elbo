(async () => {
  // Fills the chat area with a long dummy page and scrolls it smoothly for 11 s; reports fps.
  let box = document.getElementById("w9-scroll");
  if (!box) {
    const main = document.querySelector("main[data-slot=sidebar-inset]");
    box = document.createElement("div");
    box.id = "w9-scroll";
    box.style.cssText = "position:absolute;inset:0;overflow:auto;z-index:50;padding:24px 48px;font-size:14px;line-height:1.6;background:var(--background)";
    box.innerHTML = Array.from({ length: 400 }, (_, i) => `<p><b>Message ${i}</b> — Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. <code>const x = ${i};</code></p>`).join("");
    main.appendChild(box);
  }
  let list = document.getElementById("w9-list");
  if (!list) {
    const side = document.querySelector("[data-slot=sidebar-container]");
    list = document.createElement("div");
    list.id = "w9-list";
    list.style.cssText = "position:absolute;left:0;right:0;top:110px;bottom:60px;overflow:auto;z-index:50;padding:0 12px;font-size:13px;background:transparent";
    list.innerHTML = Array.from({ length: 300 }, (_, i) => `<div style="padding:6px 8px;border-radius:8px">Chat title number ${i}</div>`).join("");
    side.appendChild(list);
  }
  let frames = 0, dir = 1;
  const end = performance.now() + 11000;
  await new Promise((done) => {
    const step = () => {
      frames++;
      box.scrollTop += 12 * dir;
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 2 || box.scrollTop <= 0) dir = -dir;
      if (list) list.scrollTop += 4 * dir;
      if (performance.now() < end) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  return `fps ${(frames / 11).toFixed(0)}`;
})()
