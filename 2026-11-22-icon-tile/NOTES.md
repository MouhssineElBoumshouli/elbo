# Icon tile, navy text, small icon (2026-11-22)

Main commits: 52b2f01a01 (icon tile, navy text), 24df48537e (phone app hidden). Dev server, ~/.t3-dev, headless Chromium.

1. before-dark: rail icon's navy almost invisible; old one-color "e" next to "Chose: find another way".
2. before-light: rail "Chats" and accent text in cyan.
3. after-dark: rail icon on a white tile; the chat event shows the icon (a muted tile, the row is dimmed).
4. after-light: no tile; rail "Chats" text is navy #15355B (measured). File chips keep upstream's own per-kind colors.
5. small-icon-closeup (3x pixels): the 16 px icon in an event row, light and dark, and the rail icon. For the owner's call: the drawing is a blur at 16 px.
6. after-startup-dark: startup screen in dark mode, Elbo's icon served as the release build does (dev builds show upstream's placeholder).

Pictures 3-6 were taken with the tile done in Tailwind classes; the committed version does the same thing in elbo.css (`[data-elbo-icon]`), not re-photographed.
