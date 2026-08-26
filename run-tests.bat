@echo off
setlocal enabledelayedexpansion

set "WORK_DIR=%~dp0"
cd /d "%WORK_DIR%"

:: Relative paths - cucumber's "type:path" format arg breaks on the colon in an absolute path.
set "JSON_REL=test-results\json"
set "REPORT_REL=Reports"
set "REPORT_FILE=%REPORT_REL%\dashboard-report.html"

set START_TIME=%TIME%
set START_DATE=%DATE%

echo =====================================================================
echo AUTOMATION DEMO SUMMIT - SEQUENTIAL REGRESSION RUN
echo =====================================================================
echo.

echo [STEP] Checking Node.js...
node --version >NUL 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install it from https://nodejs.org/
    exit /b 1
)
for /f "delims=" %%V in ('node -v') do set NODE_VER=%%V
echo [INFO] Node: !NODE_VER!

if not exist node_modules (
    if exist package-lock.json (
        echo [BOOTSTRAP] Running npm ci...
        call npm ci || (echo [ERROR] npm ci failed & exit /b 1)
    ) else (
        echo [BOOTSTRAP] Running npm install...
        call npm install || (echo [ERROR] npm install failed & exit /b 1)
    )
) else (
    echo [INFO] node_modules already present.
)

:: SECURITY_NOTE: TLS verification stays enabled - never set NODE_TLS_REJECT_UNAUTHORIZED=0 here.
echo [STEP] Ensuring Playwright chromium runtime...
call npx playwright install chromium
if errorlevel 1 echo [WARN] Browser install returned non-zero (may already exist)

if exist "%JSON_REL%" rmdir /s /q "%JSON_REL%"
mkdir "%JSON_REL%"
if not exist "%REPORT_REL%" mkdir "%REPORT_REL%"

set TOTAL=0
set PASSED=0
set FAILED=0

echo.
echo =====================================================================
echo EXECUTION ORDER: TC_001 - TC_005
echo =====================================================================

call :RunTag TC_001 HomePageLoad
call :RunTag TC_002 RegisterNewAccount
call :RunTag TC_003 LoggedInDeleteAccountVisible
call :RunTag TC_004 LogoutAndLoginAgain
call :RunTag TC_005 InvalidLoginError

set END_TIME=%TIME%
set END_DATE=%DATE%
call :TimeToSeconds "%START_TIME%" START_SECONDS
call :TimeToSeconds "%END_TIME%" END_SECONDS
set /a TOTAL_SECONDS=END_SECONDS-START_SECONDS
if !TOTAL_SECONDS! LSS 0 set /a TOTAL_SECONDS+=86400
set /a HOURS=TOTAL_SECONDS/3600
set /a MINUTES=(TOTAL_SECONDS%%3600)/60
set /a SECONDS=TOTAL_SECONDS%%60

echo.
echo =====================================================================
echo [STEP] Building combined dashboard report...
echo =====================================================================
set "REPORT_EMAIL_DISABLED=1"
set "REPORT_RUN_START=%START_DATE% %START_TIME%"
set "REPORT_RUN_END=%END_DATE% %END_TIME%"
set "REPORT_RUN_DURATION=!HOURS!h !MINUTES!m !SECONDS!s"
call node scripts/merge-cucumber-reports.cjs "%JSON_REL%" "%REPORT_FILE%"
if errorlevel 1 echo [WARN] Report generation returned non-zero - verify scripts/merge-cucumber-reports.cjs
set "REPORT_RUN_START="
set "REPORT_RUN_END="
set "REPORT_RUN_DURATION="

echo.
echo =====================================================================
echo EXECUTION COMPLETE
echo =====================================================================
echo Total Tests : !TOTAL!
echo Passed      : !PASSED!
echo Failed      : !FAILED!
echo Report      : %WORK_DIR%%REPORT_FILE%
echo Screenshots : %WORK_DIR%test-results\screenshots
echo.
echo TOTAL EXECUTION TIME: !HOURS!h !MINUTES!m !SECONDS!s
echo Started at : %START_DATE% %START_TIME%
echo Finished at: %END_DATE% %END_TIME%
echo =====================================================================

if !FAILED! GTR 0 exit /b 1
exit /b 0

:: =====================================================================
:: FUNCTION: RunTag - runs one cucumber tag, captures JSON + HTML per run
:: =====================================================================
:RunTag
set TAG=%~1
set OUTFILE=%~2
set /a TOTAL+=1
echo.
echo [!TOTAL!] Running: @%TAG%
echo ---------------------------------------------------------------------
call npx cucumber-js --config cucumber.js --tags "@%TAG%" --format json:%JSON_REL%\%OUTFILE%.json
if errorlevel 1 (
    echo [FAIL] @%TAG%
    set /a FAILED+=1
) else (
    echo [PASS] @%TAG%
    set /a PASSED+=1
)
exit /b 0

:: =====================================================================
:: FUNCTION: TimeToSeconds - converts HH:MM:SS.ss to total seconds
:: =====================================================================
:TimeToSeconds
setlocal
set "TIME_STR=%~1"
set "TIME_STR=%TIME_STR: =0%"
for /f "tokens=1-3 delims=:.," %%a in ("%TIME_STR%") do (
  set /a HOURS=1%%a-100
  set /a MINUTES=1%%b-100
  set /a SECONDS=1%%c-100
)
set /a TOTAL_SEC=HOURS*3600+MINUTES*60+SECONDS
endlocal & set %2=%TOTAL_SEC%
exit /b 0
