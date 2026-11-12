<?php
$pageTitle = 'Tableau de bord';
require_once __DIR__ . '/includes/header.php';

$pdo = db();

$caTotal = (float)$pdo->query("SELECT COALESCE(SUM(total_ttc),0) FROM factures")->fetchColumn();
$metresForesTotal = (float)$pdo->query("SELECT COALESCE(SUM(profondeur_reelle_m),0) FROM factures")->fetchColumn();
$nbDevisEnCours = (int)$pdo->query("SELECT COUNT(*) FROM devis WHERE statut IN ('brouillon','envoye')")->fetchColumn();
$nbFactures = (int)$pdo->query("SELECT COUNT(*) FROM factures")->fetchColumn();

$parVille = $pdo->query("
    SELECT c.ville, COUNT(DISTINCT f.id) AS nb_chantiers, COALESCE(SUM(f.total_ttc),0) AS ca
    FROM chantiers c
    LEFT JOIN factures f ON f.chantier_id = c.id
    GROUP BY c.ville
    ORDER BY ca DESC
")->fetchAll();

$parType = $pdo->query("
    SELECT c.type_projet, COUNT(DISTINCT f.id) AS nb, COALESCE(SUM(f.total_ttc),0) AS ca
    FROM chantiers c
    LEFT JOIN factures f ON f.chantier_id = c.id
    GROUP BY c.type_projet
    ORDER BY ca DESC
")->fetchAll();
?>

<h1 class="text-2xl font-semibold mb-6">Tableau de bord</h1>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="text-sm text-slate-500">Chiffre d'affaires facturé</div>
    <div class="text-2xl font-bold text-emerald-700"><?= money($caTotal) ?></div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="text-sm text-slate-500">Mètres forés (total facturé)</div>
    <div class="text-2xl font-bold text-emerald-700"><?= number_format($metresForesTotal, 1, ',', ' ') ?> m</div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="text-sm text-slate-500">Devis en cours</div>
    <div class="text-2xl font-bold"><?= $nbDevisEnCours ?></div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="text-sm text-slate-500">Factures émises</div>
    <div class="text-2xl font-bold"><?= $nbFactures ?></div>
  </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Par ville</h2>
    <table class="w-full text-sm">
      <thead><tr class="text-left text-slate-500 border-b"><th class="py-1">Ville</th><th>Chantiers facturés</th><th>CA</th></tr></thead>
      <tbody>
        <?php foreach ($parVille as $row): ?>
        <tr class="border-b last:border-0">
          <td class="py-1"><?= h($row['ville'] ?: '—') ?></td>
          <td><?= $row['nb_chantiers'] ?></td>
          <td><?= money((float)$row['ca']) ?></td>
        </tr>
        <?php endforeach; ?>
        <?php if (!$parVille): ?><tr><td colspan="3" class="py-2 text-slate-400">Aucune donnée pour l'instant.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Par type de projet</h2>
    <table class="w-full text-sm">
      <thead><tr class="text-left text-slate-500 border-b"><th class="py-1">Type</th><th>Chantiers facturés</th><th>CA</th></tr></thead>
      <tbody>
        <?php foreach ($parType as $row): ?>
        <tr class="border-b last:border-0">
          <td class="py-1"><?= h(type_projet_label($row['type_projet'])) ?></td>
          <td><?= $row['nb'] ?></td>
          <td><?= money((float)$row['ca']) ?></td>
        </tr>
        <?php endforeach; ?>
        <?php if (!$parType): ?><tr><td colspan="3" class="py-2 text-slate-400">Aucune donnée pour l'instant.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="mt-8 flex gap-3">
  <a href="/bfe-pilotage/devis/new.php" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800">+ Nouveau devis</a>
  <a href="/bfe-pilotage/factures/new.php" class="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800">+ Nouvelle facture</a>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
