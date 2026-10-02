# NB Photobooth

Pick 4 photos from your phone and get a print-ready **4×6 in** JPG (1200×1800 px @ 300 DPI).

- **Layouts:** double strip (cut into 2 photo-booth strips), 2×2 grid, or strip + title card
- **Edit:** drag / pinch to frame each photo, reorder, replace
- **Style:** filters (B&W, sepia, warm, cool, fade), frame color + pattern (dots, stripes,
  gingham, hearts, film), caption, date
- **Stickers:** emoji stickers — drag, pinch to resize/rotate; copied onto both strips
- **Export:** Save / Share to Photos on phones, download JPG, or print at 4×6

Everything runs in the browser — photos are never uploaded. It installs to the home screen
and works offline (service worker generated at build time — see `pwa/sw.js` and `vite.config.ts`).

## Develop

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

1. Push this repo to GitHub on the `main` branch.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push.

## Print tips

- Print at **4×6 / 10×15 cm**, borderless if your printer supports it, with "fit"/"fill" scaling off where possible.
- The layout keeps ≥40 px (~3.4 mm) of white around every photo so a little printer cropping is safe.
