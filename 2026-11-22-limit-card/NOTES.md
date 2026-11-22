# "Limit reached" card

`main` at `62eaa2ea10`. Headless Chromium against `vp run dev --home-dir ~/.t3-dev`, Elbo theme, light mode. Codex really was at its ChatGPT usage limit (reset 23:45), so the failures are real, not mocked. Account emails are replaced with `you@gmail.com` in the page before each picture.

1. **The card.** A new Codex chat fails on the limit. Instead of the raw error: "ChatGPT usage limit reached / Your ChatGPT account … reached its usage limit. It resets at 11:45 PM." Buttons: "Continue with Claude" (Claude is signed in) and "Wait". There is no "Continue with another account" because there's no second ChatGPT account.
2. **Keyboard.** Ctrl+K, "continue with": the card's buttons are in the command palette. Enter on "Continue with Claude" continued the chat: a context handoff from Astra to Opus 5.5, then Claude answered. The message was not duplicated.
3. **Switch back.** After continuing: "This chat now uses Claude / ChatGPT reached its limit." with "Switch back to ChatGPT". Clicking it put the composer back on "Codex · Astra" (checked by text after the click).
4. **Check my setup.** "Add another account" on the Codex and Claude rows. Clicking it on Codex added "Codex (Codex account 2)" with "Sign in". "Remove" on that row took it away again; that was checked by text, with no picture.

Not tried: signing in a real second ChatGPT account, "Wait" (it uses upstream's resume at reset), and the subscription-ended card (no account in that state).
