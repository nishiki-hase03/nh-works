@echo off
set DIST_DIR=dist

echo Creating distribution folder: %DIST_DIR%
if not exist %DIST_DIR% mkdir %DIST_DIR%

echo Copying files to %DIST_DIR%...
copy slimEditor.exe %DIST_DIR%\
copy README.md %DIST_DIR%\
copy LICENSE %DIST_DIR%\

echo Done!
echo The files in the "%DIST_DIR%" folder are ready for distribution.
pause
