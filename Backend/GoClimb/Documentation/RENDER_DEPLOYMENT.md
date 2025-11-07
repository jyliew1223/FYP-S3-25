# Render Deployment Setup

This document explains how to set up automatic deployment to Render after successful GitHub Actions tests.

## Step 1: Get Your Render Deploy Hook URL

1. Go to your Render Dashboard: https://dashboard.render.com/
2. Select your Django service
3. Go to **Settings** tab
4. Scroll down to **Deploy Hook** section
5. Click **Create Deploy Hook**
6. Copy the generated URL (it looks like: `https://api.render.com/deploy/srv-xxxxxxxxxxxxxxxxxxxxx?key=xxxxxxxxxxxxxxxx`)

## Step 2: Add Deploy Hook to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `RENDER_DEPLOY_HOOK_URL`
6. Value: Paste your Render Deploy Hook URL
7. Click **Add secret**

## Step 3: How It Works

The GitHub Actions workflow will:

1. ✅ Run all tests
2. ✅ Only deploy if tests pass
3. ✅ Only deploy on pushes to `main` or `master` branch
4. ✅ Skip deployment on pull requests
5. 🚀 Trigger Render deployment via HTTP POST request

## Deployment Conditions

The deployment will **only** trigger when:
- All tests pass successfully
- The push is to `main`, `master`, or `Backend_Sub` branch
- It's a push event (not a pull request)

## Manual Deployment

You can also manually trigger deployment by calling the deploy hook:

```bash
curl -X POST "YOUR_RENDER_DEPLOY_HOOK_URL"
```

## Troubleshooting

### Deployment not triggering?
- Check that the secret `RENDER_DEPLOY_HOOK_URL` is set correctly
- Verify you're pushing to `main`, `master`, or `Backend_Sub` branch
- Ensure all tests are passing
- Check the "Check deployment conditions" step in GitHub Actions for debugging info

### Render deployment failing?
- Check Render deployment logs in your Render dashboard
- Verify your Django app configuration on Render
- Check environment variables are set correctly on Render

## Security Notes

- The Deploy Hook URL is stored as a GitHub secret (encrypted)
- Only repository collaborators can view/edit secrets
- The URL is never exposed in logs or workflow output