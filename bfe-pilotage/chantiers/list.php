<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$chantiers = $pdo->query("
    SELECT ch.*, cl.nom AS client_nom
    FROM chantiers ch JOIN clients cl ON cl.id = ch.client_id
    ORDER BY COALESCE(ch.date_debut_prevue, ch.created_at) DESC
")->fetchAll();

$pageTitle = 'Chantiers';
require_once __DIR__ . '/../includes/header.php';
?>

<h1 class="text-2xl font-semibold mb-6">Chantiers</h1>

<div class="bg-white rounded-lg shadow overflow-hidden">
<table class="w-full text-sm">
  <thead class="bg-slate-100 text-left text-slate-500">
    <tr><th class="px-3 py-2">Client</th><th>Ville</th><th>Type</th><th>Statut</th><th>Début prévu</th><th>Fin prévue</th><th></th></tr>
  </thead>
  <tbody>
    <?php foreach ($chantiers as $c): ?>
    <tr class="border-t">
      <td class="px-3 py-2 font-medium"><?= h($c['client_nom']) ?></td>
      <td><?= h($c['ville']) ?></td>
      <td><?= h(type_projet_label($c['type_projet'])) ?></td>
      <td><span class="px-2 py-0.5 rounded bg-slate-100 text-xs"><?= h(STATUTS_CHANTIER[$c['statut']] ?? $c['statut']) ?></span></td>
      <td><?= h($c['date_debut_prevue']) ?: '—' ?></td>
      <td><?= h($c['date_fin_prevue']) ?: '—' ?></td>
      <td class="px-3"><a href="/bfe-pilotage/chantiers/view.php?id=<?= $c['id'] ?>" class="text-emerald-700 hover:underline">gérer</a></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$chantiers): ?><tr><td colspan="7" class="px-3 py-4 text-slate-400">Aucun chantier pour l'instant (créé automatiquement à la création d'un devis).</td></tr><?php endif; ?>
  </tbody>
</table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
