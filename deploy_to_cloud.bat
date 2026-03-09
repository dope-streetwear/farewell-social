@echo off
setlocal

echo 🚀 Prepping Farewell Social for Cloud...

:: 1. Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed! Please install it from git-scm.com
    pause
    exit /b
)

:: 2. Create the GitHub Repo instructions
echo.
echo --------------------------------------------------
echo STEP 1: CREATE A REPOSITORY
echo 1. Go to github.com/new
echo 2. Name it "farewell-social"
echo 3. Click "Create repository"
echo 4. Copy the URL (it looks like https://github.com/USERNAME/farewell-social.git)
echo --------------------------------------------------
echo.

set /p repo_url="➡️ Paste your GitHub Repository URL here: "

if "%repo_url%"=="" (
    echo ❌ No URL provided. Exiting...
    pause
    exit /b
)

:: 3. Remote and Push
echo 📦 Pushing code to your cloud...
git remote add origin %repo_url%
git branch -M main
git push -u origin main

echo.
echo ✅ Done! Now Render and Vercel will see your code.
echo.
echo --------------------------------------------------
echo STEP 2: FINISH ON RENDER
echo 1. Go to render.com
echo 2. Click "New" -> "Blueprint"
echo 3. Connect your "farewell-social" repo
echo 4. Render will handle the rest!
echo --------------------------------------------------

pause
