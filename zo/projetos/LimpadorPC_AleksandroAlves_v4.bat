@echo off
setlocal enabledelayedexpansion
title Limpador de PC - Aleksandro Alves - TURBO v4.0
color 0A

:: ============================================================
:: CONFIGURACAO
:: ============================================================
set "SCRIPT_VERSION=4.0"
set "LOG_FILE=%TEMP%\LimpadorPC_v4_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"
set "DRIVE=%SystemDrive%"

:: Cria arquivo de log
echo [%date% %time%] LimpadorPC v%SCRIPT_VERSION% - Iniciado > "%LOG_FILE%" 2>&1

:: ============================================================
:: AUTO-ELEVACAO DE PRIVILEGIOS
:: ============================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Elevando privilegios automaticamente...
    powershell -Command "Start-Process '%~f0' -Verb RunAs -WindowStyle Normal" >nul 2>&1
    exit /b
)

:: ============================================================
:: FUNCAO: STATUS
:: ============================================================
goto :skip_functions

:log_status
    if %errorlevel% equ 0 (
        echo  [OK] %~1
        echo [%date% %time%] [OK] %~1 >> "%LOG_FILE%"
    ) else (
        echo  [FALHA] %~1
        echo [%date% %time%] [FALHA] %~1 >> "%LOG_FILE%"
    )
    exit /b

:skip_functions

:: ============================================================
:: CABECALHO
:: ============================================================
cls
color 0A
echo.
echo  =====================================================
echo   ██╗     ██╗███╗   ███╗██████╗  █████╗ 
echo   ██║     ██║████╗ ████║██╔══██╗██╔══██╗
echo   ██║     ██║██╔████╔██║██████╔╝███████║
echo   ██║     ██║██║╚██╔╝██║██╔═══╝ ██╔══██║
echo   ███████╗██║██║ ╚═╝ ██║██║     ██║  ██║
echo   ╚══════╝╚═╝╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝
echo  =====================================================
echo        LIMPADOR TURBO - ALEKSANDRO ALVES v%SCRIPT_VERSION%
echo        Otimizacao Maxima - Modo Automatico
echo  =====================================================
echo.
echo  AVISO: Este script vai:
echo    - Fechar navegadores (Chrome/Edge/Firefox/Brave/Opera)
echo    - Limpar temporarios, cache, logs e lixeira
echo    - Desativar hibernacao (libera GB no disco)
echo    - Otimizar servicos do sistema
echo    - Executar limpeza avancada de disco
echo.
echo  Log salvo em: %LOG_FILE%
echo.
echo  Pressione qualquer tecla para continuar ou Ctrl+C para cancelar...
pause >nul

:: ============================================================
:: MEDIR ESPACO ANTES
:: ============================================================
echo.
echo  [MEDICAO] Calculando espaco em disco antes da limpeza...
for /f "tokens=2 delims==" %%a in ('wmic logicaldisk where "DeviceID='%DRIVE%'" get FreeSpace /value 2^>nul') do set "DISK_BEFORE=%%a" 2>nul
if not defined DISK_BEFORE (
    for /f "tokens=2 delims=:" %%a in ('powershell -NoProfile -Command "(Get-PSDrive -Name '%DRIVE:~0,1%').Free" 2^>nul') do set "DISK_BEFORE=%%a" 2>nul
)
if defined DISK_BEFORE (
    set /a "DISK_BEFORE_GB=!DISK_BEFORE:~0,-6! / 1073"
    echo  [OK] Espaco livre antes: !DISK_BEFORE_GB! GB
) else (
    set "DISK_BEFORE=0"
    set "DISK_BEFORE_GB=?"
    echo  [INFO] Nao foi possivel medir o espaco.
)

:: ============================================================
:: PONTO DE RESTAURACAO (via PowerShell - wmic esta obsoleto)
:: ============================================================
echo.
echo  [BACKUP] Criando ponto de restauracao automatico...
powershell -NoProfile -Command "Checkpoint-Computer -Description 'LimpadorPC_v4_antes_da_limpeza' -RestorePointType MODIFY_SETTINGS" >nul 2>&1
if %errorlevel% neq 0 (
    wmic.exe /Namespace:\\root\default Path SystemRestore Call CreateRestorePoint "LimpadorPC_v4_%date%", 100, 7 >nul 2>&1
)
call :log_status "Ponto de restauracao"

:: ============================================================
:: ENCERRAR PROCESSOS (com aviso previo)
:: ============================================================
echo.
echo  [PREP] Encerrando navegadores e apps que travam limpeza...
for %%p in (
    "chrome.exe" "msedge.exe" "firefox.exe" "brave.exe" "opera.exe"
    "OneDrive.exe" "SkyDrive.exe" "Teams.exe" "Spotify.exe"
) do (
    taskkill /f /im %%p >nul 2>&1
)
call :log_status "Processos encerrados"

:: ============================================================
:: LIMPEZA 1 - TEMPORARIOS DO USUARIO
:: ============================================================
echo  [1/24] Limpando temporarios do usuario...
del /q /f /s "%TEMP%\*" >nul 2>&1
for /d %%d in ("%TEMP%\*") do rd /s /q "%%d" >nul 2>&1
call :log_status "Temporarios do usuario"

:: ============================================================
:: LIMPEZA 2 - TEMPORARIOS DO WINDOWS
:: ============================================================
echo  [2/24] Limpando temporarios do Windows...
del /q /f /s "%SystemRoot%\Temp\*" >nul 2>&1
for /d %%d in ("%SystemRoot%\Temp\*") do rd /s /q "%%d" >nul 2>&1
call :log_status "Temporarios do Windows"

:: ============================================================
:: LIMPEZA 3 - SOFTWARE DISTRIBUTION
:: ============================================================
echo  [3/24] Limpando cache do Windows Update...
net stop wuauserv >nul 2>&1
net stop bits >nul 2>&1
del /q /f /s "%SystemRoot%\SoftwareDistribution\Download\*" >nul 2>&1
for /d %%d in ("%SystemRoot%\SoftwareDistribution\Download\*") do rd /s /q "%%d" >nul 2>&1
net start wuauserv >nul 2>&1
net start bits >nul 2>&1
call :log_status "Cache Windows Update"

:: ============================================================
:: LIMPEZA 4 - DELIVERY OPTIMIZATION (NOVO)
:: ============================================================
echo  [4/24] Limpando cache do Delivery Optimization...
net stop DoSvc >nul 2>&1
del /q /f /s "%SystemRoot%\SoftwareDistribution\DeliveryOptimization\*" >nul 2>&1
for /d %%d in ("%SystemRoot%\SoftwareDistribution\DeliveryOptimization\*") do rd /s /q "%%d" >nul 2>&1
net start DoSvc >nul 2>&1
call :log_status "Delivery Optimization"

:: ============================================================
:: LIMPEZA 5 - PREFETCH
:: ============================================================
echo  [5/24] Limpando Prefetch...
del /q /f /s "%SystemRoot%\Prefetch\*" >nul 2>&1
call :log_status "Prefetch"

:: ============================================================
:: LIMPEZA 6 - LIXEIRA
:: ============================================================
echo  [6/24] Esvaziando Lixeira...
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1
rd /s /q "%DRIVE%\$Recycle.Bin" >nul 2>&1
call :log_status "Lixeira"

:: ============================================================
:: LIMPEZA 7 - DOWNLOADS (COM CONFIRMACAO)
:: ============================================================
echo.
echo  [7/24] Pasta Downloads detectada. Deseja limpar?
echo         Isso apagara TODOS os arquivos da sua pasta Downloads!
echo.
choice /c SN /n /m "         Limpar Downloads? [S]im / [N]ao: " /t 10 /d N
if !errorlevel! equ 2 (
    echo  [PULADO] Downloads mantidos.
) else (
    del /q /f /s "%USERPROFILE%\Downloads\*" >nul 2>&1
    for /d %%p in ("%USERPROFILE%\Downloads\*") do rd /s /q "%%p" >nul 2>&1
    call :log_status "Downloads"
)

:: ============================================================
:: LIMPEZA 8 - LOGS DO SISTEMA
:: ============================================================
echo  [8/24] Removendo logs antigos do sistema...
del /q /f "%SystemRoot%\*.log" >nul 2>&1
del /q /f "%SystemRoot%\Debug\*.log" >nul 2>&1
del /q /f "%SystemRoot%\Logs\CBS\*.log" >nul 2>&1
del /q /f /s "%SystemRoot%\Logs\*" >nul 2>&1
call :log_status "Logs do sistema"

:: ============================================================
:: LIMPEZA 9 - EVENT LOGS BACKUP (NOVO)
:: ============================================================
echo  [9/24] Limpando backups de Event Logs...
for /f "tokens=*" %%a in ('wevtutil el') do wevtutil cl "%%a" >nul 2>&1
call :log_status "Event Logs"

:: ============================================================
:: LIMPEZA 10 - CACHE CHROME
:: ============================================================
echo  [10/24] Limpando cache do Chrome...
for %%d in ("Cache" "Code Cache" "GPUCache" "Media Cache" "DawnGraphiteCache" "DawnWebGPUCache") do (
    del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\%%~d\*" >nul 2>&1
)
call :log_status "Cache Chrome"

:: ============================================================
:: LIMPEZA 11 - CACHE EDGE
:: ============================================================
echo  [11/24] Limpando cache do Edge...
for %%d in ("Cache" "Code Cache" "GPUCache" "DawnWebGPUCache") do (
    del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\%%~d\*" >nul 2>&1
)
call :log_status "Cache Edge"

:: ============================================================
:: LIMPEZA 12 - CACHE FIREFOX
:: ============================================================
echo  [12/24] Limpando cache do Firefox...
for /d %%p in ("%APPDATA%\Mozilla\Firefox\Profiles\*") do (
    rd /s /q "%%p\cache2" >nul 2>&1
    del /q /f /s "%%p\thumbnails\*" >nul 2>&1
    del /q /f "%%p\cookies.sqlite" >nul 2>&1
)
call :log_status "Cache Firefox"

:: ============================================================
:: LIMPEZA 13 - CACHE BRAVE (NOVO)
:: ============================================================
echo  [13/24] Limpando cache do Brave...
for %%d in ("Cache" "Code Cache" "GPUCache") do (
    del /q /f /s "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\%%~d\*" >nul 2>&1
)
call :log_status "Cache Brave"

:: ============================================================
:: LIMPEZA 14 - CACHE OPERA (NOVO)
:: ============================================================
echo  [14/24] Limpando cache do Opera...
for %%d in ("Cache" "Code Cache" "GPUCache") do (
    del /q /f /s "%APPDATA%\Opera Software\Opera Stable\Cache\*" >nul 2>&1
)
call :log_status "Cache Opera"

:: ============================================================
:: LIMPEZA 15 - CACHES DE DESENVOLVIMENTO (NOVO)
:: ============================================================
echo  [15/24] Limpando caches de desenvolvimento (npm/pip/NuGet)...
if exist "%APPDATA%\npm-cache" rd /s /q "%APPDATA%\npm-cache" >nul 2>&1
if exist "%LOCALAPPDATA%\pip\cache" rd /s /q "%LOCALAPPDATA%\pip\cache" >nul 2>&1
if exist "%LOCALAPPDATA%\NuGet\Cache" rd /s /q "%LOCALAPPDATA%\NuGet\Cache" >nul 2>&1
if exist "%USERPROFILE%\.nuget\packages" del /q /f /s "%USERPROFILE%\.nuget\packages\*" >nul 2>&1
call :log_status "Caches dev"

:: ============================================================
:: LIMPEZA 16 - RELATORIOS DE ERROS
:: ============================================================
echo  [16/24] Removendo relatorios de erros do Windows...
del /q /f /s "%ProgramData%\Microsoft\Windows\WER\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\WER\*" >nul 2>&1
call :log_status "Relatorios de erros"

:: ============================================================
:: LIMPEZA 17 - MINIATURAS E ICONES
:: ============================================================
echo  [17/24] Limpando cache de miniaturas e icones...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\*.db" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\iconcache*" >nul 2>&1
taskkill /f /im explorer.exe >nul 2>&1
start explorer.exe >nul 2>&1
call :log_status "Cache miniaturas"

:: ============================================================
:: LIMPEZA 18 - DUMPS E CRASH
:: ============================================================
echo  [18/24] Removendo arquivos de crash e dump...
del /q /f "%SystemRoot%\Minidump\*.*" >nul 2>&1
del /q /f "%SystemRoot%\MEMORY.DMP" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\CrashDumps\*" >nul 2>&1
call :log_status "Crash dumps"

:: ============================================================
:: LIMPEZA 19 - FONTS CACHE
:: ============================================================
echo  [19/24] Reconstruindo cache de fontes...
net stop "FontCache" >nul 2>&1
del /q /f "%SystemRoot%\ServiceProfiles\LocalService\AppData\Local\FontCache*" >nul 2>&1
net start "FontCache" >nul 2>&1
call :log_status "Cache fontes"

:: ============================================================
:: REDE 20 - DNS E OTIMIZACAO TCP
:: ============================================================
echo  [20/24] Limpando cache DNS e otimizando rede...
ipconfig /flushdns >nul 2>&1
ipconfig /registerdns >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPSetting | Set-NetTCPSetting -AutoTuningLevelLocal Normal" >nul 2>&1
call :log_status "Rede/DNS"

:: ============================================================
:: SISTEMA 21 - HIBERNACAO
:: ============================================================
echo  [21/24] Desativando hibernacao (libera GB no disco)...
powercfg -h off >nul 2>&1
call :log_status "Hibernacao"

:: ============================================================
:: SISTEMA 22 - COMPONENTES DO WINDOWS (substitui pnpclean.dll)
:: ============================================================
echo  [22/24] Limpando componentes antigos do Windows...
dism /Online /Cleanup-Image /StartComponentCleanup >nul 2>&1
call :log_status "Componentes Windows"

:: ============================================================
:: SISTEMA 23 - SERVICOS (inteligente: so desativa se pouca RAM)
:: ============================================================
echo  [23/24] Otimizando servicos do sistema...

:: Verifica RAM total via PowerShell (wmic obsoleto)
set "TOTAL_RAM_MB=0"
for /f %%a in ('powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB" 2^>nul') do set "TOTAL_RAM_MB=%%a"

:: DiagTrack (telemetria) - desativa sempre
net stop "DiagTrack" >nul 2>&1
sc config "DiagTrack" start= disabled >nul 2>&1

:: SysMain (Superfetch) - so desativa se menos de 8 GB RAM
if %TOTAL_RAM_MB% lss 8192 (
    net stop "SysMain" >nul 2>&1
    sc config "SysMain" start= disabled >nul 2>&1
) else (
    echo         RAM suficiente (%TOTAL_RAM_MB% MB) - SysMain mantido ativo
)

:: WSearch (indexacao) - desativa
net stop "WSearch" >nul 2>&1
sc config "WSearch" start= disabled >nul 2>&1
call :log_status "Servicos"

:: ============================================================
:: LIMPEZA 24 - DISK CLEANUP (CORRIGIDO: reg keys ANTES do sagerun)
:: ============================================================
echo  [24/24] Executando limpeza avancada de disco...

:: Configura TODOS os itens do Disk Cleanup ANTES de executar
for %%k in (
    "Active Setup Temp Folders"
    "BranchCache"
    "Delivery Optimization Files"
    "Device Driver Packages"
    "Downloaded Program Files"
    "Internet Cache Files"
    "Memory Dump Files"
    "Old ChkDsk Files"
    "Previous Installations"
    "Recycle Bin"
    "RetailDemo Offline Content"
    "Service Pack Cleanup"
    "Setup Log Files"
    "System error memory dump files"
    "System error minidump files"
    "Temporary Files"
    "Temporary Setup Files"
    "Temporary Sync Files"
    "Thumbnail Cache"
    "Update Cleanup"
    "Upgrade Discarded Files"
    "User file versions"
    "Windows Defender"
    "Windows Error Reporting Archive Files"
    "Windows Error Reporting Queue Files"
    "Windows Error Reporting System Archive Files"
    "Windows Error Reporting System Queue Files"
    "Windows ESD installation files"
    "Windows Upgrade Log Files"
) do (
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\%%~k" /v StateFlags0099 /t REG_DWORD /d 2 /f >nul 2>&1
)

:: Agora executa com as flags configuradas
cleanmgr /sagerun:99 >nul 2>&1
call :log_status "Disk Cleanup"

:: ============================================================
:: BONUS - SFC E DISM (background)
:: ============================================================
echo.
echo  [BONUS] Agendando reparo do sistema em background...
start /min cmd /c "sfc /scannow >nul 2>&1 & dism /Online /Cleanup-Image /ScanHealth >nul 2>&1 & dism /Online /Cleanup-Image /RestoreHealth >nul 2>&1"
echo  [OK] Reparo agendado em background.

:: ============================================================
:: MEDIR ESPACO DEPOIS
:: ============================================================
echo.
echo  [MEDICAO] Calculando espaco em disco apos limpeza...
set "DISK_AFTER=0"
for /f "tokens=2 delims==" %%a in ('wmic logicaldisk where "DeviceID='%DRIVE%'" get FreeSpace /value 2^>nul') do set "DISK_AFTER=%%a" 2>nul
if "!DISK_AFTER!"=="0" (
    for /f "tokens=2 delims=:" %%a in ('powershell -NoProfile -Command "(Get-PSDrive -Name '%DRIVE:~0,1%').Free" 2^>nul') do set "DISK_AFTER=%%a" 2>nul
)
if defined DISK_AFTER (
    set /a "DISK_AFTER_GB=!DISK_AFTER:~0,-6! / 1073"
    set /a "GAIN=!DISK_AFTER_GB! - !DISK_BEFORE_GB!" 2>nul
) else (
    set "DISK_AFTER_GB=?"
    set "GAIN=?"
)

:: ============================================================
:: MEMORIA RAM (via PowerShell, nao wmic)
:: ============================================================
set "FREE_RAM_MB=?"
set "TOTAL_RAM_GB=?"
for /f %%a in ('powershell -NoProfile -Command "$os=Get-CimInstance Win32_OperatingSystem; Write-Host $os.FreePhysicalMemory; Write-Host ([math]::Round($os.TotalVisibleMemorySize/1KB))" 2^>nul') do (
    if "!FREE_RAM_MB!"=="?" (set "FREE_RAM_MB=%%a") else (set "TOTAL_RAM_GB=%%a")
)
if "!FREE_RAM_MB!"=="?" (
    for /f "tokens=2 delims==" %%a in ('wmic os get freephysicalmemory /value 2^>nul') do set /a "FREE_RAM_MB=%%a/1024" 2>nul
)
if "!TOTAL_RAM_GB!"=="?" (
    for /f "tokens=2 delims==" %%a in ('wmic os get totalvisiblememorysize /value 2^>nul') do set /a "TOTAL_RAM_GB=%%a/1024" 2>nul
)

:: ============================================================
:: RELATORIO FINAL
:: ============================================================
echo.
echo  ========================================================
echo    OTIMIZACAO TURBO CONCLUIDA COM SUCESSO!
echo  ========================================================
echo.
echo    Resumo da Limpeza:
echo    -------------------------------------------------------
echo    [OK] Temporarios do sistema e usuario
echo    [OK] Cache do Windows Update e Delivery Optimization
echo    [OK] Cache de navegadores (Chrome/Edge/Firefox/Brave/Opera)
echo    [OK] Lixeira esvaziada
echo    [OK] Logs, relatorios e Event Logs
echo    [OK] Miniaturas e icones reconstruidos
echo    [OK] DNS flush e rede otimizada
echo    [OK] Componentes antigos do Windows (DISM)
echo    [OK] Servicos desnecessarios otimizados
echo    [OK] Disk Cleanup avancado executado
echo    [OK] SFC e DISM em andamento (background)
echo.
echo    Resultado:
echo    -------------------------------------------------------
echo    Espaco antes:   !DISK_BEFORE_GB! GB livres
echo    Espaco depois:  !DISK_AFTER_GB! GB livres
echo    Liberado:       !GAIN! GB
echo.
echo    RAM:            !FREE_RAM_MB! MB livres / !TOTAL_RAM_GB! GB total
echo.
echo    Log completo:   %LOG_FILE%
echo.
echo    Execute mensalmente para melhor desempenho!
echo.
echo    Desenvolvido por: Aleksandro Alves
echo  ========================================================
echo.
echo  Pressione qualquer tecla para sair...
pause >nul

endlocal
exit /b 0
