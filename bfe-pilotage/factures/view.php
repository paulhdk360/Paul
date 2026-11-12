<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT f.*, ch.adresse_chantier, ch.ville, ch.code_postal, ch.type_projet,
           cl.nom AS client_nom, cl.adresse_facturation
    FROM factures f
    JOIN chantiers ch ON ch.id = f.chantier_id
    JOIN clients cl ON cl.id = ch.client_id
    WHERE f.id = ?
");
$stmt->execute([$id]);
$facture = $stmt->fetch();
if (!$facture) { http_response_code(404); echo 'Facture introuvable'; exit; }

$stmt = $pdo->prepare("SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY numero");
$stmt->execute([$id]);
$lignes = $stmt->fetchAll();

$pageTitle = $facture['reference'];
require_once __DIR__ . '/../includes/header.php';
?>

<div class="no-print flex items-center justify-between mb-4">
  <a href="/bfe-pilotage/factures/list.php" class="text-sm text-slate-500 hover:underline">&larr; Retour aux factures</a>
  <button onclick="window.print()" class="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 text-sm">Imprimer / Enregistrer en PDF</button>
</div>

<div class="bg-white shadow rounded-lg p-8 text-sm leading-relaxed">
  <div class="mb-6">
    <div><?= h($facture['reference']) ?></div>
    <div><?= h($facture['client_nom']) ?></div>
    <div><?= h($facture['date_facture']) ?></div>
  </div>

  <h1 class="text-xl font-bold mb-1">Facture — <?= h(type_projet_label($facture['type_projet'])) ?></h1>
  <h2 class="text-lg font-semibold mb-6"><?= h($facture['client_nom']) ?></h2>

  <table class="w-full mb-6"><tbody>
    <tr><td class="font-medium w-1/3 py-0.5">Société</td><td><?= h(ENTREPRISE_NOM) ?></td></tr>
    <tr><td class="font-medium py-0.5">Adresse</td><td><?= h(ENTREPRISE_ADRESSE) ?></td></tr>
    <tr><td class="font-medium py-0.5">SIRET</td><td><?= h(ENTREPRISE_SIRET) ?></td></tr>
    <tr><td class="font-medium py-0.5">Adresse de facturation client</td><td><?= h($facture['adresse_facturation']) ?></td></tr>
    <tr><td class="font-medium py-0.5">Adresse du chantier</td><td><?= h($facture['adresse_chantier']) ?>, <?= h($facture['code_postal']) ?> <?= h($facture['ville']) ?></td></tr>
    <?php if ($facture['profondeur_reelle_m'] !== null): ?>
    <tr><td class="font-medium py-0.5">Profondeur réelle forée</td><td><?= number_format((float)$facture['profondeur_reelle_m'], 1, ',', ' ') ?> m</td></tr>
    <?php endif; ?>
  </tbody></table>

  <h3 class="font-semibold border-b pb-1 mb-2">Détail facturé</h3>
  <table class="w-full mb-2">
    <thead><tr class="text-left bg-slate-100"><th class="px-2 py-1">N°</th><th class="px-2 py-1">Désignation</th><th class="px-2 py-1">Unité</th><th class="px-2 py-1">Qté</th><th class="px-2 py-1">PU HT</th><th class="px-2 py-1">Total HT</th></tr></thead>
    <tbody>
      <?php foreach ($lignes as $l): ?>
      <tr class="border-b">
        <td class="px-2 py-1"><?= $l['numero'] ?></td>
        <td class="px-2 py-1"><?= h($l['designation']) ?></td>
        <td class="px-2 py-1"><?= h($l['unite']) ?></td>
        <td class="px-2 py-1"><?= $l['quantite'] ?></td>
        <td class="px-2 py-1"><?= money((float)$l['prix_unitaire_ht']) ?></td>
        <td class="px-2 py-1"><?= money((float)$l['quantite'] * (float)$l['prix_unitaire_ht']) ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>

  <table class="w-64 ml-auto mb-6">
    <tbody>
      <tr><td class="font-medium py-0.5">Total HT</td><td class="text-right"><?= money((float)$facture['total_ht']) ?></td></tr>
      <tr><td class="font-medium py-0.5">TVA <?= h($facture['tva_taux']) ?>%</td><td class="text-right"><?= money((float)$facture['total_ht'] * (float)$facture['tva_taux'] / 100) ?></td></tr>
      <tr class="font-bold border-t"><td class="py-0.5">Total TTC</td><td class="text-right"><?= money((float)$facture['total_ttc']) ?></td></tr>
    </tbody>
  </table>

  <p class="text-xs text-slate-400 mt-8"><?= h(ENTREPRISE_FORME) ?></p>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
