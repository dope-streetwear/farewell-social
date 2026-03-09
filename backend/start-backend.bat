@echo off
echo Starting Backend and Localtunnel Bridge...
start cmd /k "npm run dev"
echo Waiting for backend to start...
timeout /t 5
start cmd /k "npx --yes localtunnel --port 5000 --subdomain farewell-social-backend"
echo Done! Your backend is now live for the Vercel frontend.
