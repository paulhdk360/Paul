# Cree le dossier d'une affaire et y copie les 4 modeles Enedril (devis, tool list, BL, service ticket)
$Base = 'Z:\MUSTANG SERVICES\12-Clients\2027'      # dossier des affaires 2027 sur le serveur

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
$lang = (Read-Host 'Langue du devis : F (francais) ou E (anglais) [F]').Trim().ToUpper()
if ($lang -eq 'E') { $motifDevis = 'Devis*EN*' } else { $motifDevis = 'Devis*FR*' }

$liste = @(
    @($motifDevis,        "${ref}_Devis.xlsx"),
    @('Tool*list*',       "${ref}_ToolList.xlsx"),
    @('BL*',              "${ref}_BL.xlsx"),
    @('Service*ticket*',  "${ref}_ServiceTicket.xlsx"))

# verifier que les 4 modeles existent avant de creer quoi que ce soit
foreach ($f in $liste) { if (-not (Trouve-Modele $f[0])) { Write-Host "Modele introuvable dans $Modeles : $($f[0])" -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 } }

$dest = Join-Path $Base $ref
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
foreach ($f in $liste) {
    $cible = Join-Path $dest $f[1]
    if (Test-Path $cible) { Write-Host "Existe deja, non ecrase : $($f[1])" -ForegroundColor Yellow }
    else { Copy-Item (Trouve-Modele $f[0]).FullName $cible; Write-Host "Cree : $($f[1])" -ForegroundColor Green }
}
Write-Host ''
Write-Host "Dossier pret : $dest" -ForegroundColor Cyan
Start-Process explorer.exe $dest
