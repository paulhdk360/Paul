<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

const TYPES_CHARGE = ['fixe' => 'Fixe', 'variable' => 'Variable'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $chantierId = (int)($_POST['chantier_id'] ?? 0) ?: null;
    $stmt = $pdo->prepare("INSERT INTO charges (libelle, type, montant, date_charge, chantier_id) VALUES (?,?,?,?,?)");
    $stmt->execute([$_POST['libelle'], $_POST['type'], (float)str_replace(',', '.', $_POST['montant']), $_POST['date_charge'], $chantierId]);
    redirect('/bfe-pilotage/charges/list.php');
}

$charges = $pdo->query("
    SELECT c.*, cl.nom AS client_nom, ch.ville
    FROM charges c
    LEFT JOIN chantiers ch ON ch.id = c.chantier_id
    LEFT JOIN clients cl ON cl.id = ch.client_id
    ORDER BY c.date_charge DESC
")->fetchAll();

$chantiers = $pdo->query("
    SELECT ch.id, ch.ville, cl.nom AS client_nom FROM chantiers ch JOIN clients cl ON cl.id = ch.client_id ORDER BY ch.id DESC
")->fetchAll();

$totalFixe = array_sum(array_map(fn($c) => $c['type'] === 'fixe' ? (float)$c['montant'] : 0, $charges));
$totalVariable = array_sum(array_map(fn($c) => $c['type'] === 'variable' ? (float)$c['montant'] : 0, $charges));

$pageTitle = 'Charges';
require_once __DIR__ . '/../includes/header.php';
?>

<h1 class="text-2xl font-semibold mb-6">Charges</h1>

<div class="grid sm:grid-cols-2 gap-4 mb-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="text-sm text-slate-500">Charges fixes (total)</div>
    <div class="text-2xl font-bold"><?= money($totalFixe) ?></div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="text-sm text-slate-500">Charges variables (total)</div>
    <div class="text-2xl font-bold"><?= money($totalVariable) ?></div>
  </div>
</div>

<div class="bg-white rounded-lg shadow p-4 mb-6">
  <h2 class="font-semibold mb-3">Ajouter une charge</h2>
  <form method="post" class="grid sm:grid-cols-5 gap-3">
    <div class="sm:col-span-2"><label class="block text-sm text-slate-500 mb-1">Libellé</label><input name="libelle" class="w-full border rounded px-2 py-1" required></div>
    <div>
      <label class="block text-sm text-slate-500 mb-1">Type</label>
      <select name="type" class="w-full border rounded px-2 py-1">
        <?php foreach (TYPES_CHARGE as $code => $label): ?><option value="<?= $code ?>"><?= h($label) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div><label class="block text-sm text-slate-500 mb-1">Montant</label><input name="montant" class="w-full border rounded px-2 py-1" required></div>
    <div><label class="block text-sm text-slate-500 mb-1">Date</label><input type="date" name="date_charge" value="<?= date('Y-m-d') ?>" class="w-full border rounded px-2 py-1" required></div>
    <div class="sm:col-span-4">
      <label class="block text-sm text-slate-500 mb-1">Chantier concerné (optionnel — laisser vide pour une charge générale)</label>
      <select name="chantier_id" class="w-full border rounded px-2 py-1">
        <option value="0">— Charge générale —</option>
        <?php foreach ($chantiers as $c): ?>
          <option value="<?= $c['id'] ?>"><?= h($c['client_nom']) ?> — <?= h($c['ville']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><button type="submit" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">Ajouter</button></div>
  </form>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
<table class="w-full text-sm">
  <thead class="bg-slate-100 text-left text-slate-500">
    <tr><th class="px-3 py-2">Date</th><th>Libellé</th><th>Type</th><th>Chantier</th><th class="text-right px-3">Montant</th></tr>
  </thead>
  <tbody>
    <?php foreach ($charges as $c): ?>
    <tr class="border-t">
      <td class="px-3 py-2"><?= h($c['date_charge']) ?></td>
      <td><?= h($c['libelle']) ?></td>
      <td><span class="px-2 py-0.5 rounded bg-slate-100 text-xs"><?= h(TYPES_CHARGE[$c['type']] ?? $c['type']) ?></span></td>
      <td><?= $c['chantier_id'] ? h($c['client_nom']) . ' — ' . h($c['ville']) : '—' ?></td>
      <td class="text-right px-3"><?= money((float)$c['montant']) ?></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$charges): ?><tr><td colspan="5" class="px-3 py-4 text-slate-400">Aucune charge pour l'instant.</td></tr><?php endif; ?>
  </tbody>
</table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
