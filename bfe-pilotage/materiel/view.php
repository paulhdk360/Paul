<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

const TYPES_MAINTENANCE = [
    'revision' => 'Révision',
    'reparation' => 'Réparation',
    'controle' => 'Contrôle',
];

$id = (int)($_GET['id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'add_maintenance') {
        $stmt = $pdo->prepare("INSERT INTO maintenances (materiel_id, date_maintenance, type, description, cout) VALUES (?,?,?,?,?)");
        $stmt->execute([$id, $_POST['date_maintenance'], $_POST['type'], $_POST['description'] ?: null, (float)str_replace(',', '.', $_POST['cout'])]);
        if ($_POST['type'] === 'revision') {
            $pdo->prepare("UPDATE materiel SET date_derniere_revision = ? WHERE id = ? AND (date_derniere_revision IS NULL OR date_derniere_revision < ?)")
                ->execute([$_POST['date_maintenance'], $id, $_POST['date_maintenance']]);
        }
    } elseif ($action === 'update_statut') {
        $pdo->prepare("UPDATE materiel SET statut = ? WHERE id = ?")->execute([$_POST['statut'], $id]);
    }
    redirect('/bfe-pilotage/materiel/view.php?id=' . $id);
}

$stmt = $pdo->prepare("SELECT * FROM materiel WHERE id = ?");
$stmt->execute([$id]);
$materiel = $stmt->fetch();
if (!$materiel) { http_response_code(404); echo 'Matériel introuvable'; exit; }

$stmt = $pdo->prepare("SELECT * FROM maintenances WHERE materiel_id = ? ORDER BY date_maintenance DESC");
$stmt->execute([$id]);
$maintenances = $stmt->fetchAll();

$coutTotal = array_sum(array_column($maintenances, 'cout'));

$prochaineRevision = null;
if ($materiel['periodicite_revision_mois'] && $materiel['date_derniere_revision']) {
    $d = new DateTime($materiel['date_derniere_revision']);
    $d->modify('+' . $materiel['periodicite_revision_mois'] . ' months');
    $prochaineRevision = $d->format('Y-m-d');
}
$revisionEnRetard = $prochaineRevision && $prochaineRevision < date('Y-m-d');

$pageTitle = $materiel['nom'];
require_once __DIR__ . '/../includes/header.php';
?>

<a href="/bfe-pilotage/materiel/list.php" class="text-sm text-slate-500 hover:underline">&larr; Retour au matériel</a>
<h1 class="text-2xl font-semibold mt-2 mb-6"><?= h($materiel['nom']) ?></h1>

<div class="grid lg:grid-cols-2 gap-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Statut et révision</h2>
    <table class="w-full text-sm mb-4">
      <tbody>
        <tr><td class="font-medium py-1 w-1/2">Type</td><td><?= h(TYPES_MATERIEL[$materiel['type']] ?? $materiel['type']) ?></td></tr>
        <tr><td class="font-medium py-1">N° de série</td><td><?= h($materiel['numero_serie']) ?: '—' ?></td></tr>
        <tr><td class="font-medium py-1">Dernière révision</td><td><?= h($materiel['date_derniere_revision']) ?: '—' ?></td></tr>
        <tr>
          <td class="font-medium py-1">Prochaine révision</td>
          <td class="<?= $revisionEnRetard ? 'text-red-600 font-semibold' : '' ?>">
            <?= $prochaineRevision ? h($prochaineRevision) . ($revisionEnRetard ? ' — en retard' : '') : '—' ?>
          </td>
        </tr>
        <tr><td class="font-medium py-1">Coût total de maintenance</td><td><?= money($coutTotal) ?></td></tr>
      </tbody>
    </table>
    <form method="post" class="flex gap-2 items-end">
      <input type="hidden" name="action" value="update_statut">
      <div class="flex-1">
        <label class="block text-sm text-slate-500 mb-1">Statut</label>
        <select name="statut" class="w-full border rounded px-2 py-1">
          <?php foreach (STATUTS_MATERIEL as $code => $label): ?>
            <option value="<?= $code ?>" <?= $materiel['statut'] === $code ? 'selected' : '' ?>><?= h($label) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <button type="submit" class="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 text-sm">Mettre à jour</button>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Enregistrer une intervention</h2>
    <form method="post" class="space-y-3">
      <input type="hidden" name="action" value="add_maintenance">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm text-slate-500 mb-1">Date</label><input type="date" name="date_maintenance" value="<?= date('Y-m-d') ?>" class="w-full border rounded px-2 py-1" required></div>
        <div>
          <label class="block text-sm text-slate-500 mb-1">Type</label>
          <select name="type" class="w-full border rounded px-2 py-1">
            <?php foreach (TYPES_MAINTENANCE as $code => $label): ?>
              <option value="<?= $code ?>"><?= h($label) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <div><label class="block text-sm text-slate-500 mb-1">Description</label><input name="description" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Coût</label><input name="cout" value="0" class="w-full border rounded px-2 py-1"></div>
      <button type="submit" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">Enregistrer</button>
    </form>
  </div>
</div>

<div class="bg-white rounded-lg shadow p-4 mt-6">
  <h2 class="font-semibold mb-3">Historique des interventions</h2>
  <table class="w-full text-sm">
    <thead class="text-left text-slate-500 border-b"><tr><th class="py-1">Date</th><th>Type</th><th>Description</th><th class="text-right">Coût</th></tr></thead>
    <tbody>
      <?php foreach ($maintenances as $m): ?>
      <tr class="border-b last:border-0">
        <td class="py-1"><?= h($m['date_maintenance']) ?></td>
        <td><?= h(TYPES_MAINTENANCE[$m['type']] ?? $m['type']) ?></td>
        <td><?= h($m['description']) ?></td>
        <td class="text-right"><?= money((float)$m['cout']) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$maintenances): ?><tr><td colspan="4" class="py-2 text-slate-400">Aucune intervention enregistrée.</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
