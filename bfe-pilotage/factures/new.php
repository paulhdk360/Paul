<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo->beginTransaction();
    try {
        $devisId = (int)($_POST['devis_id'] ?? 0) ?: null;
        $chantierId = (int)$_POST['chantier_id'];

        $lignes = [];
        foreach ($_POST['ligne_designation'] as $i => $designation) {
            $designation = trim($designation);
            if ($designation === '') continue;
            $lignes[] = [
                'numero' => $i + 1,
                'designation' => $designation,
                'unite' => $_POST['ligne_unite'][$i],
                'quantite' => (float)str_replace(',', '.', $_POST['ligne_quantite'][$i]),
                'prix_unitaire_ht' => (float)str_replace(',', '.', $_POST['ligne_pu'][$i]),
            ];
        }
        $totalHt = lignes_total_ht($lignes);
        $tvaTaux = (float)str_replace(',', '.', $_POST['tva_taux']);
        $totalTtc = round($totalHt * (1 + $tvaTaux / 100), 2);
        $reference = next_reference($pdo, 'factures', 'BFE-FAC');
        $profondeurReelle = $_POST['profondeur_reelle_m'] !== '' ? (float)str_replace(',', '.', $_POST['profondeur_reelle_m']) : null;

        $stmt = $pdo->prepare("INSERT INTO factures (reference, devis_id, chantier_id, date_facture, profondeur_reelle_m, tva_taux, statut, total_ht, total_ttc) VALUES (?,?,?,?,?,?,?,?,?)");
        $stmt->execute([$reference, $devisId, $chantierId, $_POST['date_facture'], $profondeurReelle, $tvaTaux, 'emise', $totalHt, $totalTtc]);
        $factureId = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare("INSERT INTO facture_lignes (facture_id, numero, designation, unite, quantite, prix_unitaire_ht) VALUES (?,?,?,?,?,?)");
        foreach ($lignes as $l) {
            $stmt->execute([$factureId, $l['numero'], $l['designation'], $l['unite'], $l['quantite'], $l['prix_unitaire_ht']]);
        }

        if ($devisId) {
            $pdo->prepare("UPDATE devis SET statut = 'accepte' WHERE id = ?")->execute([$devisId]);
        }

        $pdo->commit();
        redirect('/bfe-pilotage/factures/view.php?id=' . $factureId);
    } catch (Throwable $e) {
        $pdo->rollBack();
        $error = $e->getMessage();
    }
}

$devisId = (int)($_GET['devis_id'] ?? 0);
$devis = null;
$lignesInitiales = [];
if ($devisId) {
    $stmt = $pdo->prepare("
        SELECT d.*, ch.id AS chantier_id, ch.ville, cl.nom AS client_nom
        FROM devis d JOIN chantiers ch ON ch.id = d.chantier_id JOIN clients cl ON cl.id = ch.client_id
        WHERE d.id = ?
    ");
    $stmt->execute([$devisId]);
    $devis = $stmt->fetch();
    $stmt = $pdo->prepare("SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY numero");
    $stmt->execute([$devisId]);
    $lignesInitiales = $stmt->fetchAll();
}

$chantiers = $pdo->query("
    SELECT ch.id, ch.adresse_chantier, ch.ville, cl.nom AS client_nom
    FROM chantiers ch JOIN clients cl ON cl.id = ch.client_id ORDER BY ch.id DESC
")->fetchAll();

$pageTitle = 'Nouvelle facture';
require_once __DIR__ . '/../includes/header.php';
?>

<h1 class="text-2xl font-semibold mb-2">Nouvelle facture</h1>
<?php if ($devis): ?>
  <p class="text-slate-500 mb-6">À partir du devis <strong><?= h($devis['reference']) ?></strong> — <?= h($devis['client_nom']) ?>, <?= h($devis['ville']) ?></p>
<?php endif; ?>

<?php if (!empty($error)): ?><div class="bg-red-100 text-red-700 p-3 rounded mb-4"><?= h($error) ?></div><?php endif; ?>

<form method="post" class="space-y-6">
  <input type="hidden" name="devis_id" value="<?= $devisId ?>">

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Chantier facturé</h2>
    <?php if ($devis): ?>
      <input type="hidden" name="chantier_id" value="<?= $devis['chantier_id'] ?>">
      <p class="text-sm"><?= h($devis['client_nom']) ?> — <?= h($devis['ville']) ?></p>
    <?php else: ?>
      <select name="chantier_id" class="w-full border rounded px-2 py-1" required>
        <?php foreach ($chantiers as $c): ?>
          <option value="<?= $c['id'] ?>"><?= h($c['client_nom']) ?> — <?= h($c['ville']) ?> (<?= h($c['adresse_chantier']) ?>)</option>
        <?php endforeach; ?>
      </select>
    <?php endif; ?>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Informations facture</h2>
    <div class="grid sm:grid-cols-3 gap-3">
      <div><label class="block text-sm text-slate-500 mb-1">Date de facture</label><input type="date" name="date_facture" value="<?= date('Y-m-d') ?>" class="w-full border rounded px-2 py-1" required></div>
      <div><label class="block text-sm text-slate-500 mb-1">TVA (%)</label><input name="tva_taux" value="<?= $devis ? h($devis['tva_taux']) : '10' ?>" class="w-full border rounded px-2 py-1"></div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Profondeur réelle forée (m)</label>
        <input name="profondeur_reelle_m" class="w-full border rounded px-2 py-1" placeholder="Ex : 12.5">
        <p class="text-xs text-slate-400 mt-1">Alimente directement le KPI « mètres forés » du tableau de bord.</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Détail facturé (quantités réelles)</h2>
    <table class="w-full text-sm" id="lignes-table">
      <thead>
        <tr class="text-left text-slate-500 border-b"><th class="py-1 w-1/2">Désignation</th><th>Unité</th><th>Qté réelle</th><th>PU HT</th><th></th></tr>
      </thead>
      <tbody>
        <?php
        $source = $lignesInitiales ?: [['designation' => '', 'unite' => 'forfait', 'quantite' => 1, 'prix_unitaire_ht' => 0]];
        foreach ($source as $l): ?>
        <tr>
          <td class="py-1 pr-2"><input name="ligne_designation[]" value="<?= h($l['designation']) ?>" class="w-full border rounded px-2 py-1"></td>
          <td class="pr-2">
            <select name="ligne_unite[]" class="border rounded px-2 py-1">
              <?php foreach (['forfait','h','m'] as $u): ?>
                <option value="<?= $u ?>" <?= $l['unite'] === $u ? 'selected' : '' ?>><?= $u ?></option>
              <?php endforeach; ?>
            </select>
          </td>
          <td class="pr-2"><input name="ligne_quantite[]" value="<?= $l['quantite'] ?>" class="w-20 border rounded px-2 py-1"></td>
          <td class="pr-2"><input name="ligne_pu[]" value="<?= $l['prix_unitaire_ht'] ?>" class="w-20 border rounded px-2 py-1"></td>
          <td><button type="button" onclick="this.closest('tr').remove()" class="text-red-600 text-xs">supprimer</button></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <button type="button" id="add-ligne" class="mt-3 text-emerald-700 text-sm font-medium">+ Ajouter une ligne</button>
    <p class="text-xs text-slate-400 mt-2">Ajuste ici les quantités réelles (ex : mètres forés en plus de l'option « approfondissement ») avant de valider la facture.</p>
  </div>

  <button type="submit" class="bg-emerald-700 text-white px-6 py-2 rounded hover:bg-emerald-800">Créer la facture</button>
</form>

<template id="ligne-template">
  <tr>
    <td class="py-1 pr-2"><input name="ligne_designation[]" class="w-full border rounded px-2 py-1"></td>
    <td class="pr-2">
      <select name="ligne_unite[]" class="border rounded px-2 py-1">
        <option value="forfait">forfait</option><option value="h">h</option><option value="m">m</option>
      </select>
    </td>
    <td class="pr-2"><input name="ligne_quantite[]" value="1" class="w-20 border rounded px-2 py-1"></td>
    <td class="pr-2"><input name="ligne_pu[]" value="0" class="w-20 border rounded px-2 py-1"></td>
    <td><button type="button" onclick="this.closest('tr').remove()" class="text-red-600 text-xs">supprimer</button></td>
  </tr>
</template>
<script>
document.getElementById('add-ligne').addEventListener('click', () => {
  const tpl = document.getElementById('ligne-template').content.cloneNode(true);
  document.querySelector('#lignes-table tbody').appendChild(tpl);
});
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
