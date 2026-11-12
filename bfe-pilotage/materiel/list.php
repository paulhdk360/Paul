<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $pdo->prepare("INSERT INTO materiel (nom, type, numero_serie, statut, periodicite_revision_mois) VALUES (?,?,?,?,?)");
    $stmt->execute([
        $_POST['nom'], $_POST['type'], $_POST['numero_serie'] ?: null, 'disponible',
        $_POST['periodicite_revision_mois'] !== '' ? (int)$_POST['periodicite_revision_mois'] : null,
    ]);
    redirect('/bfe-pilotage/materiel/list.php');
}

$materiel = $pdo->query("
    SELECT m.*,
    (SELECT MAX(date_maintenance) FROM maintenances WHERE materiel_id = m.id) AS derniere_maintenance
    FROM materiel m ORDER BY m.nom
")->fetchAll();

$pageTitle = 'Matériel';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Matériel</h1>
</div>

<div class="bg-white rounded-lg shadow p-4 mb-6">
  <h2 class="font-semibold mb-3">Ajouter du matériel</h2>
  <form method="post" class="grid sm:grid-cols-4 gap-3">
    <div><label class="block text-sm text-slate-500 mb-1">Nom</label><input name="nom" class="w-full border rounded px-2 py-1" required></div>
    <div>
      <label class="block text-sm text-slate-500 mb-1">Type</label>
      <select name="type" class="w-full border rounded px-2 py-1">
        <?php foreach (TYPES_MATERIEL as $code => $label): ?>
          <option value="<?= $code ?>"><?= h($label) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label class="block text-sm text-slate-500 mb-1">N° de série</label><input name="numero_serie" class="w-full border rounded px-2 py-1"></div>
    <div>
      <label class="block text-sm text-slate-500 mb-1">Révision tous les (mois)</label>
      <input name="periodicite_revision_mois" class="w-full border rounded px-2 py-1" placeholder="Ex : 6">
    </div>
    <div class="sm:col-span-4">
      <button type="submit" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">Ajouter</button>
    </div>
  </form>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
<table class="w-full text-sm">
  <thead class="bg-slate-100 text-left text-slate-500">
    <tr><th class="px-3 py-2">Nom</th><th>Type</th><th>N° série</th><th>Statut</th><th>Dernière maintenance</th><th>Périodicité</th></tr>
  </thead>
  <tbody>
    <?php foreach ($materiel as $m): ?>
    <tr class="border-t">
      <td class="px-3 py-2 font-medium"><?= h($m['nom']) ?></td>
      <td><?= h(TYPES_MATERIEL[$m['type']] ?? $m['type']) ?></td>
      <td><?= h($m['numero_serie']) ?></td>
      <td><span class="px-2 py-0.5 rounded bg-slate-100 text-xs"><?= h(STATUTS_MATERIEL[$m['statut']] ?? $m['statut']) ?></span></td>
      <td><?= h($m['derniere_maintenance']) ?: '—' ?></td>
      <td><?= $m['periodicite_revision_mois'] ? $m['periodicite_revision_mois'] . ' mois' : '—' ?></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$materiel): ?><tr><td colspan="6" class="px-3 py-4 text-slate-400">Aucun matériel pour l'instant.</td></tr><?php endif; ?>
  </tbody>
</table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
