# Fonctions communes : mise a jour du chrono (onglet « Chrono 2027 ») via Excel. Utilise par les scripts Nouvelle_affaire, Nouveau_BL, Nouveau_ServiceTicket.
$DossierChrono = 'Z:\MUSTANG SERVICES\12-Clients'
$LigneMin = 14; $LigneMax = 513          # lignes de saisie du tableau

function Trouve-Chrono {
    foreach ($n in 'FRANCE CHRONO.xlsx', 'FRANCE CHRONO 2027.xlsx') { $p = Join-Path $DossierChrono $n; if (Test-Path $p) { return $p } }
    $f = Get-ChildItem -Path $DossierChrono -File -Filter 'FRANCE*CHRONO*.xls*' -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '~$*' } | Select-Object -First 1
    if ($f) { return $f.FullName }
    return $null
}

function Trouve-Ligne($ws, $ref) {
    for ($r = $LigneMin; $r -le $LigneMax; $r++) { if ($ws.Cells.Item($r, 1).Value2 -eq $ref) { return $r } }
    return 0
}

# Ouvre le chrono, execute le bloc ($ws en parametre), enregistre. Retourne $true si tout s'est bien passe.
function Invoke-Chrono([scriptblock]$Action) {
    $Chrono = Trouve-Chrono
    $xl = $null; $wb = $null; $creeIci = $false; $ouvertIci = $false
    try {
        if (-not $Chrono) { throw "aucun fichier FRANCE CHRONO*.xlsx trouve dans $DossierChrono" }
        try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application') } catch { }
        if (-not $xl) { $xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false; $creeIci = $true }
        foreach ($w in $xl.Workbooks) { if ($w.FullName -eq $Chrono) { $wb = $w } }
        if (-not $wb) { $wb = $xl.Workbooks.Open($Chrono); $ouvertIci = $true }
        if ($wb.ReadOnly) { throw "le chrono est ouvert par quelqu'un d'autre (lecture seule)" }
        $ws = $wb.Worksheets.Item('Chrono 2027')
        $null = & $Action $ws
        $wb.Save()
        if ($ouvertIci) { $wb.Close($false) }
        if ($creeIci) { $xl.Quit() }
        Write-Host "Chrono mis a jour : $Chrono" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Chrono NON mis a jour : $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Fichier cherche : $Chrono" -ForegroundColor Yellow
        try { if ($ouvertIci -and $wb) { $wb.Close($false) }; if ($creeIci -and $xl) { $xl.Quit() } } catch { }
        return $false
    }
}
