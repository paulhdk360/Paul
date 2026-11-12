<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$rows = $pdo->query("
    SELECT d.reference, d.date_devis, cl.nom AS client, ch.ville, ch.type_projet, d.statut, d.total_ht, d.total_ttc
    FROM devis d
    JOIN chantiers ch ON ch.id = d.chantier_id
    JOIN clients cl ON cl.id = ch.client_id
    ORDER BY d.date_devis DESC
")->fetchAll();

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="devis_bfe.csv"');

echo "\xEF\xBB\xBF"; // BOM UTF-8 pour un affichage correct dans Excel
$out = fopen('php://output', 'w');
fputcsv($out, ['Référence', 'Date', 'Client', 'Ville', 'Type de projet', 'Statut', 'Total HT', 'Total TTC'], ';');
foreach ($rows as $r) {
    fputcsv($out, [
        $r['reference'], $r['date_devis'], $r['client'], $r['ville'],
        type_projet_label($r['type_projet']), $r['statut'], $r['total_ht'], $r['total_ttc'],
    ], ';');
}
fclose($out);
