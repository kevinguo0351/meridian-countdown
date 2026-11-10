# Meridian — A Living Countdown Lock Screen

A standby lock screen for one deadline. The light cools while there is still runway and warms as the hour approaches. Each milestone you keep aligns a glass ring and lifts the crystal.

No account, no server. State lives in the URL and in `localStorage`.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://127.0.0.1:4731/](http://127.0.0.1:4731/). The first screen is **Dream Offer Sprint**, targeted fourteen days from the moment you open it.

```bash
npm run build          # GitHub Pages bundle in dist/
npm run build:single   # one HTML file in dist-single/countdown-lockscreen.html
```

## Ready to paste

**Project title**

Meridian — A Living Countdown Lock Screen

**Project description**

The short answer for the form (444 characters) is in [SUBMISSION.md](SUBMISSION.md). This is the same work, mapped to the four rubrics:

- **Execution.** Vite, TypeScript, and Three.js. The scene is custom GLSL — atmosphere, glass rings, a faceted crystal, and a small field of motes — driven by `uProgress`, `uMilestoneRatio`, and `uThemeColor`. Pixel ratio is clamped to 2, the context is disposed on unmount, and resize, hidden tabs, and reduced motion are handled. Title, target, milestones, and theme stay in sync with `localStorage` and `?title=&target=&m=&theme=`, with the URL winning. The wallpaper exporter reads the preserved WebGL frame into an offscreen canvas and composites a 1170×2532 PNG.
- **Creativity.** The deadline is a meridian, not a progress bar. Time remaining shifts the color temperature from moonlight to amber. Checking the current step eases that ring into alignment and raises the crystal through the stack. Three presets — Career / Interview Sprint, Thesis / Exam Crunch, and Product Ship / Hackathon — arrive with real steps, not blank fields.
- **Usefulness.** It is meant to sit on a nightstand or a locked phone: a PWA manifest, standalone display, and `apple-mobile-web-app-capable`. Phone (9:19.5, with a bezel you can hide) and desk (16:9) frames. A shareable link, and a wallpaper with the countdown and the ordered steps only — no chrome, and the top clock zone left clean for the real OS.
- **Polish.** Fraunces and DM Mono, an iOS-style clock that stays in the top 28%, and the countdown plus milestones in the middle band over a blurred scrim. Completed steps are quiet, the current one wears a NEXT UP badge, and the rest wait in line. You cannot skip ahead. Empty, arrived, and fully-kept states are written, not blank.

## Cover image

The cover is a 1800×1200 shot of the desktop phone frame with the OS overlay on. Chromium needs a software GL backend in this environment:

```bash
npx playwright install chromium
npm run dev
node scripts/verify.mjs
```

`scripts/verify.mjs` launches Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`, waits for fonts and the first frames, and writes:

- `cover.png` — 1800×1200, phone frame, overlay on, Dream Offer Sprint
- `wallpaper.png` — the in-app 1170×2532 export after the first milestone is checked

It also clicks through a milestone, a preset, a theme, the 32-character limit, the share link, URL-over-storage, the phone frame, and the 16:9 desk frame.

## Deploy to GitHub Pages

Live URL shape:

`https://<username>.github.io/<repo>/`

1. Create a public GitHub repository and push this project to `main`.
2. In the repo, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The workflow `.github/workflows/deploy.yml` runs on every push to `main`: checkout, Node 22, `npm ci`, `npm run build`, upload `dist/`, deploy.
4. When the action finishes, the Pages URL is the project link.

`vite.config.ts` sets `base: './'`, so the build works as a project site and as a file you open directly. If you cannot deploy, upload `dist-single/countdown-lockscreen.html` (from `npm run build:single`) as the project file. Fonts and scripts are inlined. The manifest and icons ship beside it when you deploy the `dist/` folder.
