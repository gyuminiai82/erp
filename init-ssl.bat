@echo off
setlocal enabledelayedexpansion

echo ### Checking for docker-compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: docker-compose is not installed.
    exit /b 1
)

set DOMAIN=home.minstudio.app
set RSA_KEY_SIZE=4096
set DATA_PATH=.\certbot
set EMAIL=
set STAGING=0

if exist "%DATA_PATH%\conf\live\%DOMAIN%" (
    set /p decision="Existing data found for %DOMAIN%. Continue and replace existing certificate? (y/N) "
    if /i "!decision!" neq "y" exit /b 0
)

echo ### Downloading recommended TLS parameters...
if not exist "%DATA_PATH%\conf" mkdir "%DATA_PATH%\conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "%DATA_PATH%\conf\options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "%DATA_PATH%\conf\ssl-dhparams.pem"
echo.

echo ### Creating dummy certificate for %DOMAIN%...
if not exist "%DATA_PATH%\conf\live\%DOMAIN%" mkdir "%DATA_PATH%\conf\live\%DOMAIN%"
set "PATH_IN_CONTAINER=/etc/letsencrypt/live/%DOMAIN%"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "openssl req -x509 -nodes -newkey rsa:%RSA_KEY_SIZE% -days 1 -keyout '!PATH_IN_CONTAINER!/privkey.pem' -out '!PATH_IN_CONTAINER!/fullchain.pem' -subj '/CN=localhost'" certbot
echo.

echo ### Starting nginx...
docker-compose -f docker-compose.prod.yml up --force-recreate -d nginx
echo.

echo ### Deleting dummy certificate for %DOMAIN%...
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "rm -Rf /etc/letsencrypt/live/%DOMAIN% && rm -Rf /etc/letsencrypt/archive/%DOMAIN% && rm -Rf /etc/letsencrypt/renewal/%DOMAIN%.conf" certbot
echo.

echo ### Requesting Let's Encrypt certificate for %DOMAIN%...
set EMAIL_ARG=--register-unsafely-without-email
if not "%EMAIL%"=="" set EMAIL_ARG=--email %EMAIL%

set STAGING_ARG=
if "%STAGING%" neq "0" set STAGING_ARG=--staging

docker-compose -f docker-compose.prod.yml run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot %STAGING_ARG% %EMAIL_ARG% -d %DOMAIN% --rsa-key-size %RSA_KEY_SIZE% --agree-tos --force-renewal" certbot
echo.

echo ### Reloading nginx...
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo.
echo ### Done! SSL initialization complete.
