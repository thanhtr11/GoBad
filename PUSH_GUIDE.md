# Pushing GoBad to GitHub and DockerHub

## Prerequisites
- GitHub account with a repository created
- DockerHub account
- Docker installed locally

## Step 1: Push to GitHub

Replace `YOUR_GITHUB_USERNAME` and `YOUR_GITHUB_REPO` with your actual values:

```bash
cd "/Users/thanhtruong/Documents/My Work/GoBad"

# Add GitHub remote
git remote add origin https://github.com/thanhtr11/GoBad.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Build and Push to DockerHub

Replace `YOUR_DOCKERHUB_USERNAME` with your actual DockerHub username:

```bash
# Login to DockerHub
docker login

# Build backend image
docker build -t thanhtr/gobad-backend:latest ./backend

# Build frontend image
docker build -t thanhtr/gobad-frontend:latest ./frontend

# Push backend
docker push thanhtr/gobad-backend:latest

# Push frontend
docker push thanhtr/gobad-frontend:latest
```

## Step 3: Update docker-compose.yml for Production

Once images are on DockerHub, update the `docker-compose.yml` to use your images:

```yaml
services:
  backend:
    image: thanhtr/gobad-backend:latest
    
  frontend:
    image: thanhtr/gobad-frontend:latest
```

## Notes
- Make sure your GitHub repository is created before pushing
- Ensure you have proper .gitignore settings (already configured)
- Use environment variables for sensitive data (DATABASE_URL, JWT_SECRET, etc.)
