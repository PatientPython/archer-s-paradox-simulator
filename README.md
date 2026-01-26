<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cB9besTO3AhSoNCEe-gJM6FheyXoe8lR

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages (recommended)

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

1. Push this project to a GitHub repository.
2. In your GitHub repo: **Settings** → **Pages** → **Build and deployment** → select **GitHub Actions**.
3. Push to `main` (or `master`) and wait for the workflow **Deploy to GitHub Pages** to finish.
4. Open the URL shown in the workflow output (or in Settings → Pages).
