# Deploy Instructions for GitHub Pages

## Setup Required

1. **Go to Repository Settings**
   - Navigate to `Settings` > `Pages`
   - Set **Source** to "GitHub Actions"
   - Save the configuration

2. **Environment Setup** 
   - Go to `Settings` > `Environments`
   - Create environment named: `github-pages`
   - No additional protection rules needed

3. **Permissions Check**
   - Go to `Settings` > `Actions` > `General`
   - Under "Workflow permissions" select:
     - ✅ "Read and write permissions"
     - ✅ "Allow GitHub Actions to create and approve pull requests"

## Troubleshooting

If the workflow fails:

1. Check that GitHub Pages is set to "GitHub Actions" source
2. Verify the `github-pages` environment exists
3. Ensure workflow permissions are set to "Read and write"
4. Make sure the repository is public or has GitHub Pages enabled for private repos

## Build Process

The workflow will:
1. Install Node.js 18
2. Install dependencies with `npm ci`
3. Build the project with `npm run build`
4. Upload the `dist` folder as artifacts
5. Deploy to GitHub Pages

Expected URL: `https://allanmths.github.io/Controle1/`
