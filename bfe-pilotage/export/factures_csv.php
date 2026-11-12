<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$rows = $pdo->query("
    SELECT f.reference, f.date_facture, cl.nom AS client, ch.ville, ch.type_projet, f.profondeur_reelle_m, f.statut, f.total_ht, f.total_ttc
    FROM factures f
    JOIN chantiers ch ON ch.id = f.chantier_id
    JOIN clients cl ON cl.id = ch.client_id
    ORDER BY f.date_facture DESC
")->fetchAll();

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="factures_bfe.csv"');

echo "\xEF\xBB\xBF";
$out = fopen('php://output', 'w');
fputcsv($out, ['Référence', 'Date', 'Client', 'Ville', 'Type de projet', 'Profondeur réelle (m)', 'Statut', 'Total HT', 'Total TTC'], ';');
foreach ($rows as $r) {
    fputcsv($out, [
        $r['reference'], $r['date_facture'], $r['client'], $r['ville'],
        type_projet_label($r['type_projet']), $r['profondeur_reelle_m'], $r['statut'], $r['total_ht'], $r['total_ttc'],
    ], ';');
}
fclose($out);
