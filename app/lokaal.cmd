@echo off
rem De quiz op deze pc, bereikbaar voor de televisie en de telefoons op de wifi.
rem Dubbelklik dit bestand, of draai het vanuit een opdrachtvenster. Zie README.md
rem onder "Op je eigen pc". Extra opties gaan door naar het script, bijvoorbeeld:
rem   lokaal.cmd --poort 8080 --pin 4711
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is niet gevonden. Installeer versie 22 of nieuwer van https://nodejs.org en probeer opnieuw.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Eerste keer: afhankelijkheden installeren...
  call npm install --legacy-peer-deps --no-audit --no-fund
  if errorlevel 1 (
    echo Installeren mislukte.
    pause
    exit /b 1
  )
)
call npm run lokaal -- %*
pause
