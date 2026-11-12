<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$devis = $pdo->query("
    SELECT d.*, cl.nom AS client_nom, ch.ville AS ville
    FROM devis d
    JOIN chantiers ch ON ch.id = d.chantier_id
    JOIN clients cl ON cl.id = ch.client_id
    ORDER BY d.date_devis DESC, d.id DESC
")->fetchAll();

$pageTitle = 'Devis';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Devis</h1>
  <div class="flex gap-2">
    <a href="/bfe-pilotage/export/devis_csv.php" class="no-print bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 text-sm">Exporter en Excel (CSV)</a>
    <a href="/bfe-pilotage/devis/new.php" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">+ Nouveau devis</a>
  </div>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
<table class="w-full text-sm">
  <thead class="bg-slate-100 text-left text-slate-500">
    <tr><th class="px-3 py-2">Référence</th><th>Date</th><th>Client</th><th>Ville</th><th>Statut</th><th class="text-right px-3">Total TTC</th><th></th></tr>
  </thead>
  <tbody>
    <?php foreach ($devis as $d): ?>
    <tr class="border-t">
      <td class="px-3 py-2 font-medium"><?= h($d['reference']) ?></td>
      <td><?= h($d['date_devis']) ?></td>
      <td><?= h($d['client_nom']) ?></td>
      <td><?= h($d['ville']) ?></td>
      <td><span class="px-2 py-0.5 rounded bg-slate-100 text-xs"><?= h($d['statut']) ?></span></td>
      <td class="text-right px-3"><?= money((float)$d['total_ttc']) ?></td>
      <td class="px-3"><a href="/bfe-pilotage/devis/view.php?id=<?= $d['id'] ?>" class="text-emerald-700 hover:underline">voir</a></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$devis): ?><tr><td colspan="7" class="px-3 py-4 text-slate-400">Aucun devis pour l'instant.</td></tr><?php endif; ?>
  </tbody>
</table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
