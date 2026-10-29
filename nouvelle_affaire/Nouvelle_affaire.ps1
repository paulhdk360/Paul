# Cree le dossier d'une affaire et y copie les 4 modeles Enedril (devis, tool list, BL, service ticket)
$Base   = 'Z:\MUSTANG SERVICES\12-Clients\2027'                       # dossier des affaires 2027 sur le serveur
$DossierChrono = 'Z:\MUSTANG SERVICES\12-Clients'                       # dossier du chrono (onglet « Chrono 2027 »)
# le chrono est cherche par nom : FRANCE CHRONO.xlsx de preference, sinon FRANCE CHRONO 2027.xlsx, sinon tout FRANCE*CHRONO*.xls*
$Chrono = $null
foreach ($n in 'FRANCE CHRONO.xlsx', 'FRANCE CHRONO 2027.xlsx') { $p = Join-Path $DossierChrono $n; if (Test-Path $p) { $Chrono = $p; break } }
if (-not $Chrono) { $f = Get-ChildItem -Path $DossierChrono -File -Filter 'FRANCE*CHRONO*.xls*' -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '~$*' } | Select-Object -First 1; if ($f) { $Chrono = $f.FullName } }

# dossier des modeles : sous-dossier "Modeles" ou "_Modeles" a cote de ce script
$Modeles = $null
foreach ($n in 'Modeles', '_Modeles') { $p = Join-Path $PSScriptRoot $n; if (Test-Path $p) { $Modeles = $p; break } }

function Trouve-Modele($motif) {
    $f = Get-ChildItem -Path $Modeles -File | Where-Object { $_.Name -like $motif -and $_.Extension -like '.xls*' } | Select-Object -First 1
    return $f
}

Write-Host ''
Write-Host '=== ENEDRIL - Nouvelle affaire ===' -ForegroundColor Cyan
if (-not (Test-Path $Base)) { Write-Host "Dossier introuvable : $Base (le disque Z: est-il connecte ?)" -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }
if (-not $Modeles) { Write-Host "Dossier des modeles introuvable a cote du script (Modeles ou _Modeles)." -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }

$ref = (Read-Host 'Reference de l''affaire (ex. 27-01-FR, 27-26-IT, 26-175-DE)').Trim()
if ($ref -notmatch '^\d{2}-\d{2,3}-[A-Za-z]{2}$') { Write-Host 'Format attendu : AA-NN-XX ou AA-NNN-XX (ex. 27-01-FR, 26-175-DE)' -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }
$ref = $ref.ToUpper()
$dest = Join-Path $Base $ref
if (Test-Path $dest) {
    Write-Host ''
    Write-Host "ATTENTION : la reference $ref est DEJA PRISE (le dossier existe) : $dest" -ForegroundColor Red
    Write-Host 'Rien n''a ete cree ni modifie.' -ForegroundColor Red
    $o = (Read-Host 'Ouvrir le dossier existant ? (O/N) [N]').Trim().ToUpper()
    if ($o -eq 'O') { Start-Process explorer.exe $dest }
    exit 1
}
$client = (Read-Host 'Client').Trim()
$rig = (Read-Host 'Rig / puits (ex. CLU108)').Trim()
$pc = (Read-Host 'Prospect (P) ou Client (C) [C]').Trim().ToUpper(); if ($pc -eq 'P') { $statutClient = 'Prospect' } else { $statutClient = 'Client' }
$jobs = @('Fishing', 'Directional Drilling', 'Operateurs', 'Serrage / desserrage', 'Fishing + DD', 'Machines', 'Autres')
$jobs[2] = 'Opérateurs'
for ($i = 0; $i -lt $jobs.Count; $i++) { Write-Host ("  {0} = {1}" -f ($i + 1), $jobs[$i]) }
$jn = (Read-Host 'Job (numero) [1]').Trim(); if ($jn -notmatch '^[1-7]$') { $jn = '1' }; $job = $jobs[[int]$jn - 1]
$rs = (Read-Host 'Rental (R) ou Sales (S) [R]').Trim().ToUpper(); if ($rs -eq 'S') { $prest = 'Sales' } else { $prest = 'Rental' }
$descr = (Read-Host 'Description (ex. Stab 5-7/8 + XO)').Trim()
$par = (Read-Host 'Offre par (initiales, ex. PH)').Trim()
$lang = (Read-Host 'Langue du devis : F (francais) ou E (anglais) [F]').Trim().ToUpper()
if ($lang -eq 'E') { $motifDevis = 'Devis*EN*' } else { $motifDevis = 'Devis*FR*' }

$liste = @(
    @($motifDevis,        "${ref}_Devis.xlsx"),
    @('Tool*list*',       "${ref}_ToolList.xlsx"),
    @('BL*',              "${ref}_BL.xlsx"),
    @('Service*ticket*',  "${ref}_ServiceTicket.xlsx"))

# verifier que les 4 modeles existent avant de creer quoi que ce soit
foreach ($f in $liste) { if (-not (Trouve-Modele $f[0])) { Write-Host "Modele introuvable dans $Modeles : $($f[0])" -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 } }

if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
foreach ($f in $liste) {
    $cible = Join-Path $dest $f[1]
    if (Test-Path $cible) { Write-Host "Existe deja, non ecrase : $($f[1])" -ForegroundColor Yellow }
    else { Copy-Item (Trouve-Modele $f[0]).FullName $cible; Write-Host "Cree : $($f[1])" -ForegroundColor Green }
}
Write-Host ''
Write-Host "Dossier pret : $dest" -ForegroundColor Cyan

# --- inscription dans le chrono (premiere ligne vide de l'onglet « Chrono 2027 ») ---
try {
    $xl = $null; $creeIci = $false; $ouvertIci = $false
    try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application') } catch { }
    if (-not $xl) { $xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false; $creeIci = $true }
    $wb = $null
    foreach ($w in $xl.Workbooks) { if ($w.FullName -eq $Chrono) { $wb = $w } }
    if (-not $Chrono) { throw "aucun fichier FRANCE CHRONO*.xlsx trouve dans $DossierChrono" }
    foreach ($w in $xl.Workbooks) { if ($w.FullName -eq $Chrono) { $wb = $w } }
    if (-not $wb) { $wb = $xl.Workbooks.Open($Chrono); $ouvertIci = $true }
    if ($wb.ReadOnly) { throw "le chrono est ouvert par quelqu'un d'autre (lecture seule)" }
    $ws = $wb.Worksheets.Item('Chrono 2027')
    $r = 14
    while ($r -le 513 -and $ws.Cells.Item($r, 1).Value2 -ne $null) {
        if ($ws.Cells.Item($r, 1).Value2 -eq $ref) { throw "la reference $ref existe deja dans le chrono (ligne $r)" }
        $r++
    }
    if ($r -gt 513) { throw 'tableau plein' }
    $ws.Cells.Item($r, 1).Value2 = $ref
    $ws.Cells.Item($r, 2).Value2 = [double](Get-Date).Date.ToOADate()
    $ws.Cells.Item($r, 5).Value2 = $client
    $ws.Cells.Item($r, 6).Value2 = $statutClient
    $ws.Cells.Item($r, 8).Value2 = $rig
    $ws.Cells.Item($r, 9).Value2 = $job
    $ws.Cells.Item($r, 10).Value2 = $prest
    $ws.Cells.Item($r, 11).Value2 = $descr
    $ws.Cells.Item($r, 12).Value2 = $par
    $ws.Cells.Item($r, 14).Value2 = 'A faire'
    $wb.Save()
    if ($ouvertIci) { $wb.Close($false) }
    if ($creeIci) { $xl.Quit() }
    Write-Host "Ligne $r ajoutee dans le chrono : $Chrono" -ForegroundColor Green
}
catch {
    Write-Host "Chrono NON mis a jour : $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "La reference $ref est copiee dans le presse-papiers : a coller dans la colonne Ref du chrono." -ForegroundColor Yellow
    try { Set-Clipboard -Value $ref } catch { }
    try { if ($ouvertIci -and $wb) { $wb.Close($false) }; if ($creeIci -and $xl) { $xl.Quit() } } catch { }
}
Start-Process explorer.exe $dest
