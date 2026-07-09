@echo off
rem Launches the PMIDE desktop app.
rem Prefers the installed copy; falls back to the build output.
set "INSTALLED=%LOCALAPPDATA%\Programs\PMIDE\PMIDE.exe"
set "UNPACKED=S:\pmide-theia\applications\electron\dist\win-unpacked\PMIDE.exe"
set "ELECTRON_RUN_AS_NODE="
if exist "%INSTALLED%" (
  start "" "%INSTALLED%"
) else if exist "%UNPACKED%" (
  start "" "%UNPACKED%"
) else (
  echo PMIDE is not installed and no build output was found.
  echo Run PMIDESetup.exe from S:\pmide-theia\applications\electron\dist
  pause
)
