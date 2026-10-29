# Cree un BL supplementaire dans le dossier d'une affaire existante : Ref_BL2.xlsx, Ref_BL3.xlsx... et met a jour le chrono
. (Join-Path $PSScriptRoot 'Chrono.ps1')
$Base = 'Z:\MUSTANG SERVICES\12-Clients\2027'      # dossier des affaires 2027 sur le serveur

$Modeles = $null
foreach ($n in 'Modeles', '_Modeles') { $p = Join-Path $PSScriptRoot $n; if (Test-Path $p) { $Modeles = $p; break } }

Write-Host ''
Write-Host '=== ENEDRIL - Nouveau BL ===' -ForegroundColor Cyan
if (-not (Test-Path $Base)) { Write-Host "Dossier introuvable : $Base (le disque Z: est-il connecte ?)" -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }
if (-not $Modeles) { Write-Host 'Dossier des modeles introuvable a cote du script (Modeles ou _Modeles).' -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }
$modele = Get-ChildItem -Path $Modeles -File | Where-Object { $_.Name -like 'BL*' -and $_.Extension -like '.xls*' } | Select-Object -First 1
if (-not $modele) { Write-Host "Modele BL introuvable dans $Modeles" -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }

$ref = (Read-Host 'Reference de l''affaire (ex. 27-01-FR)').Trim().ToUpper()
if ($ref -notmatch '^\d{2}-\d{2,3}-[A-Z]{2}$') { Write-Host 'Format attendu : AA-NN-XX ou AA-NNN-XX (ex. 27-01-FR, 26-175-DE)' -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }
$dest = Join-Path $Base $ref
if (-not (Test-Path $dest)) { Write-Host "Aucun dossier pour $ref : lancer d'abord Nouvelle_affaire." -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }

$existants = @(Get-ChildItem -Path $dest -File -Filter "${ref}_BL*.xlsx")
$n = $existants.Count + 1
if ($n -eq 1) { $nom = "${ref}_BL.xlsx" } else { $nom = "${ref}_BL$n.xlsx" }
while (Test-Path (Join-Path $dest $nom)) { $n++; $nom = "${ref}_BL$n.xlsx" }
$cible = Join-Path $dest $nom
Copy-Item $modele.FullName $cible
Write-Host "Cree : $nom (BL n°$n de l'affaire $ref)" -ForegroundColor Green

# mise a jour du chrono : nombre de BL de la ligne de l'affaire
$ok = Invoke-Chrono {
    param($ws)
    $r = Trouve-Ligne $ws $ref
    if ($r -eq 0) { throw "la reference $ref n'est pas dans le chrono" }
    $ws.Cells.Item($r, 20).Value2 = $n
}
if (-not $ok) { Write-Host "A saisir a la main dans le chrono : colonne Nb BL = $n pour $ref" -ForegroundColor Yellow }
Start-Process $cible
Write-Host ''
Read-Host 'Entree pour fermer cette fenetre'
