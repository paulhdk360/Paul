<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$factures = $pdo->query("
    SELECT f.*, cl.nom AS client_nom, ch.ville AS ville
    FROM factures f
    JOIN chantiers ch ON ch.id = f.chantier_id
    JOIN clients cl ON cl.id = ch.client_id
    ORDER BY f.date_facture DESC, f.id DESC
")->fetchAll();

$pageTitle = 'Factures';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Factures</h1>
  <div class="flex gap-2">
    <a href="/bfe-pilotage/export/factures_csv.php" class="no-print bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 text-sm">Exporter en Excel (CSV)</a>
    <a href="/bfe-pilotage/factures/new.php" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">+ Nouvelle facture</a>
  </div>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
<table class="w-full text-sm">
  <thead class="bg-slate-100 text-left text-slate-500">
    <tr><th class="px-3 py-2">Référence</th><th>Date</th><th>Client</th><th>Ville</th><th>Profondeur réelle</th><th class="text-right px-3">Total TTC</th><th></th></tr>
  </thead>
  <tbody>
    <?php foreach ($factures as $f): ?>
    <tr class="border-t">
      <td class="px-3 py-2 font-medium"><?= h($f['reference']) ?></td>
      <td><?= h($f['date_facture']) ?></td>
      <td><?= h($f['client_nom']) ?></td>
      <td><?= h($f['ville']) ?></td>
      <td><?= $f['profondeur_reelle_m'] !== null ? number_format((float)$f['profondeur_reelle_m'], 1, ',', ' ') . ' m' : '—' ?></td>
      <td class="text-right px-3"><?= money((float)$f['total_ttc']) ?></td>
      <td class="px-3"><a href="/bfe-pilotage/factures/view.php?id=<?= $f['id'] ?>" class="text-emerald-700 hover:underline">voir</a></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$factures): ?><tr><td colspan="7" class="px-3 py-4 text-slate-400">Aucune facture pour l'instant.</td></tr><?php endif; ?>
  </tbody>
</table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
