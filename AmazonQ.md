# GitHub Authentication Guide

To push code to your GitHub repository, you need to set up proper authentication. Here are the steps:

## Option 1: Using Personal Access Token (Recommended)

1. Generate a Personal Access Token (PAT) on GitHub:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name like "S3 Upload Project"
   - Select scopes: at minimum, check "repo" for full repository access
   - Click "Generate token"
   - **IMPORTANT**: Copy the token immediately as GitHub will only show it once

2. Use the token for authentication:
   ```bash
   git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/vanhoangkha/S3-Upload-Feature-Demo.git
   ```

3. Try pushing again:
   ```bash
   git push origin master
   ```

## Option 2: Using SSH Authentication

1. Generate an SSH key if you don't have one:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add the SSH key to the ssh-agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. Add the SSH key to your GitHub account:
   - Copy the SSH public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste your key and save

4. Change your remote URL to use SSH:
   ```bash
   git remote set-url origin git@github.com:vanhoangkha/S3-Upload-Feature-Demo.git
   ```

5. Try pushing again:
   ```bash
   git push origin master
   ```

## Troubleshooting

If you continue to have issues:

1. Ensure you have the correct permissions to push to the repository
2. Check if the repository exists and is spelled correctly
3. Verify your GitHub account has proper access to the repository
4. Try using the GitHub CLI tool for authentication: `gh auth login`
