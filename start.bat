@echo off
echo =========================================
echo Starting ERP System (Production Mode)
echo =========================================
docker-compose -f docker-compose.prod.yml up -d
echo.
echo Server is running in the background.
