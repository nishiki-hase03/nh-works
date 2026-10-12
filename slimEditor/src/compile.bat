@echo off
echo Converting PNG to ICO...
python convert_icon.py
if %ERRORLEVEL% NEQ 0 (
    echo Error converting icon.
    exit /b %ERRORLEVEL%
)

echo Compiling resources...
windres resource.rc -o resource.o
if %ERRORLEVEL% NEQ 0 (
    echo Error compiling resources.
    exit /b %ERRORLEVEL%
)

echo Compiling slimEditor...
gcc slimEditor.c resource.o -o slimEditor.exe -mwindows -O2 -s -lshlwapi
if %ERRORLEVEL% NEQ 0 (
    echo Error compiling slimEditor.
    exit /b %ERRORLEVEL%
)

echo Done! Output: slimEditor.exe
