# Tennis Rating Estimator

A static React web app for estimating mock TennisRecord-style match ratings and post-match dynamic ratings.

## Features

- Adult doubles
- Mixed doubles
- Adult singles
- Winner-first score parsing, matching TennisRecord display
- Estimated match rating and post-match dynamic rating

## Run Locally

This app is static and can be opened from `index.html`, but the local server avoids browser module restrictions:

```powershell
node dev-server.mjs
```

Then open:

```text
http://localhost:4173
```

## Publish With GitHub Pages

1. Create a new GitHub repository.
2. Push this folder to the repository.
3. In GitHub, open `Settings` -> `Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

GitHub Pages will serve the app from `index.html` in the repo root.

## Files Needed For The Website

```text
index.html
styles.css
src/app.js
.nojekyll
```

`dev-server.mjs` is only for local testing.

## Disclaimer

This is a mock estimator calibrated from sample TennisRecord pages. It is not affiliated with TennisRecord, USTA, or NTRP, and the output should not be treated as an official rating.
