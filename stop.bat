@echo off
echo =========================================
echo Stopping ERP System
echo =========================================
docker-compose -f docker-compose.prod.yml down
echo.
echo Server stopped.
