# Cree le dossier d'une affaire et y copie les 4 modeles Enedril (devis, tool list, BL, service ticket)
$Base    = 'Z:\MUSTANG SERVICES\12-Clients\2027'      # dossier des affaires 2027 sur le serveur
$Modeles = Join-Path $PSScriptRoot 'Modeles'

Write-Host ''
Write-Host '=== ENEDRIL - Nouvelle affaire ===' -ForegroundColor Cyan
if (-not (Test-Path $Base)) { Write-Host "Dossier introuvable : $Base (le disque Z: est-il connecte ?)" -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }

$ref = (Read-Host 'Reference de l''affaire (ex. 27-01-FR, 27-26-IT, 26-175-DE)').Trim()
if ($ref -notmatch '^\d{2}-\d{2,3}-[A-Za-z]{2}$') { Write-Host 'Format attendu : AA-NN-XX ou AA-NNN-XX (ex. 27-01-FR, 26-175-DE)' -ForegroundColor Red; Read-Host 'Entree pour fermer'; exit 1 }
$ref = $ref.ToUpper()
$lang = (Read-Host 'Langue du devis : F (francais) ou E (anglais) [F]').Trim().ToUpper()
if ($lang -eq 'E') { $devis = 'Devis_Enedril_2027_EN.xlsx' } else { $devis = 'Devis_Enedril_2027_FR.xlsx' }

$dest = Join-Path $Base $ref
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
$fichiers = @(
    @($devis,                          "${ref}_Devis.xlsx"),
    @('Tool_List_Enedril_2027.xlsx',   "${ref}_ToolList.xlsx"),
    @('BL_Enedril_2027.xlsx',          "${ref}_BL.xlsx"),
    @('Service_Ticket_Enedril_2027.xlsx', "${ref}_ServiceTicket.xlsx"))
foreach ($f in $fichiers) {
    $cible = Join-Path $dest $f[1]
    if (Test-Path $cible) { Write-Host "Existe deja, non ecrase : $($f[1])" -ForegroundColor Yellow }
    else { Copy-Item (Join-Path $Modeles $f[0]) $cible; Write-Host "Cree : $($f[1])" -ForegroundColor Green }
}
Write-Host ''
Write-Host "Dossier pret : $dest" -ForegroundColor Cyan
Start-Process explorer.exe $dest
