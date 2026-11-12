<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$id = (int)($_GET['id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'update_planning') {
        $stmt = $pdo->prepare("UPDATE chantiers SET date_debut_prevue=?, date_fin_prevue=?, date_debut_reelle=?, date_fin_reelle=?, statut=? WHERE id=?");
        $stmt->execute([
            $_POST['date_debut_prevue'] ?: null, $_POST['date_fin_prevue'] ?: null,
            $_POST['date_debut_reelle'] ?: null, $_POST['date_fin_reelle'] ?: null,
            $_POST['statut'], $id,
        ]);
    } elseif ($action === 'affecter_materiel') {
        $materielId = (int)$_POST['materiel_id'];
        $stmt = $pdo->prepare("INSERT INTO chantier_materiel (chantier_id, materiel_id, date_affectation) VALUES (?,?,?)");
        $stmt->execute([$id, $materielId, $_POST['date_affectation'] ?: date('Y-m-d')]);
        $pdo->prepare("UPDATE materiel SET statut = 'affecte' WHERE id = ?")->execute([$materielId]);
    } elseif ($action === 'retirer_materiel') {
        $affectationId = (int)$_POST['affectation_id'];
        $stmt = $pdo->prepare("SELECT materiel_id FROM chantier_materiel WHERE id = ?");
        $stmt->execute([$affectationId]);
        $materielId = $stmt->fetchColumn();
        $pdo->prepare("DELETE FROM chantier_materiel WHERE id = ?")->execute([$affectationId]);
        if ($materielId) {
            $pdo->prepare("UPDATE materiel SET statut = 'disponible' WHERE id = ?")->execute([$materielId]);
        }
    }
    redirect('/bfe-pilotage/chantiers/view.php?id=' . $id);
}

$stmt = $pdo->prepare("SELECT ch.*, cl.nom AS client_nom FROM chantiers ch JOIN clients cl ON cl.id = ch.client_id WHERE ch.id = ?");
$stmt->execute([$id]);
$chantier = $stmt->fetch();
if (!$chantier) { http_response_code(404); echo 'Chantier introuvable'; exit; }

$stmt = $pdo->prepare("
    SELECT cm.id AS affectation_id, cm.date_affectation, m.*
    FROM chantier_materiel cm JOIN materiel m ON m.id = cm.materiel_id
    WHERE cm.chantier_id = ? ORDER BY cm.date_affectation DESC
");
$stmt->execute([$id]);
$materielAffecte = $stmt->fetchAll();

$materielDisponible = $pdo->query("SELECT * FROM materiel WHERE statut = 'disponible' ORDER BY nom")->fetchAll();

$stmt = $pdo->prepare("SELECT COALESCE(SUM(total_ht),0) FROM factures WHERE chantier_id = ?");
$stmt->execute([$id]);
$caFacture = (float)$stmt->fetchColumn();

$stmt = $pdo->prepare("SELECT COALESCE(SUM(montant),0) FROM charges WHERE chantier_id = ?");
$stmt->execute([$id]);
$chargesAffectees = (float)$stmt->fetchColumn();

$marge = $caFacture - $chargesAffectees;
$margePct = $caFacture > 0 ? round($marge / $caFacture * 100, 1) : null;

$pageTitle = $chantier['client_nom'];
require_once __DIR__ . '/../includes/header.php';
?>

<a href="/bfe-pilotage/chantiers/list.php" class="text-sm text-slate-500 hover:underline">&larr; Retour aux chantiers</a>

<h1 class="text-2xl font-semibold mt-2 mb-1"><?= h($chantier['client_nom']) ?> — <?= h($chantier['ville']) ?></h1>
<p class="text-slate-500 mb-6"><?= h(type_projet_label($chantier['type_projet'])) ?> · <?= h($chantier['adresse_chantier']) ?></p>

<div class="grid lg:grid-cols-2 gap-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Planning</h2>
    <form method="post" class="space-y-3">
      <input type="hidden" name="action" value="update_planning">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm text-slate-500 mb-1">Début prévu</label><input type="date" name="date_debut_prevue" value="<?= h($chantier['date_debut_prevue']) ?>" class="w-full border rounded px-2 py-1"></div>
        <div><label class="block text-sm text-slate-500 mb-1">Fin prévue</label><input type="date" name="date_fin_prevue" value="<?= h($chantier['date_fin_prevue']) ?>" class="w-full border rounded px-2 py-1"></div>
        <div><label class="block text-sm text-slate-500 mb-1">Début réel</label><input type="date" name="date_debut_reelle" value="<?= h($chantier['date_debut_reelle']) ?>" class="w-full border rounded px-2 py-1"></div>
        <div><label class="block text-sm text-slate-500 mb-1">Fin réelle</label><input type="date" name="date_fin_reelle" value="<?= h($chantier['date_fin_reelle']) ?>" class="w-full border rounded px-2 py-1"></div>
      </div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Statut</label>
        <select name="statut" class="w-full border rounded px-2 py-1">
          <?php foreach (STATUTS_CHANTIER as $code => $label): ?>
            <option value="<?= $code ?>" <?= $chantier['statut'] === $code ? 'selected' : '' ?>><?= h($label) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <button type="submit" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">Enregistrer</button>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Matériel affecté</h2>
    <table class="w-full text-sm mb-3">
      <tbody>
        <?php foreach ($materielAffecte as $m): ?>
        <tr class="border-b last:border-0">
          <td class="py-1"><?= h($m['nom']) ?></td>
          <td class="text-slate-500"><?= h(TYPES_MATERIEL[$m['type']] ?? $m['type']) ?></td>
          <td class="text-slate-500"><?= h($m['date_affectation']) ?></td>
          <td>
            <form method="post">
              <input type="hidden" name="action" value="retirer_materiel">
              <input type="hidden" name="affectation_id" value="<?= $m['affectation_id'] ?>">
              <button type="submit" class="text-red-600 text-xs">retirer</button>
            </form>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (!$materielAffecte): ?><tr><td class="py-2 text-slate-400">Aucun matériel affecté.</td></tr><?php endif; ?>
      </tbody>
    </table>
    <form method="post" class="flex gap-2 items-end">
      <input type="hidden" name="action" value="affecter_materiel">
      <div class="flex-1">
        <label class="block text-sm text-slate-500 mb-1">Affecter du matériel</label>
        <select name="materiel_id" class="w-full border rounded px-2 py-1" required>
          <?php foreach ($materielDisponible as $m): ?>
            <option value="<?= $m['id'] ?>"><?= h($m['nom']) ?> (<?= h(TYPES_MATERIEL[$m['type']] ?? $m['type']) ?>)</option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Date</label>
        <input type="date" name="date_affectation" value="<?= date('Y-m-d') ?>" class="border rounded px-2 py-1">
      </div>
      <button type="submit" class="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 text-sm">Affecter</button>
    </form>
    <?php if (!$materielDisponible): ?><p class="text-xs text-slate-400 mt-2">Aucun matériel disponible — tout est affecté ou en maintenance. <a href="/bfe-pilotage/materiel/list.php" class="text-emerald-700 hover:underline">Gérer le parc matériel</a>.</p><?php endif; ?>
  </div>
</div>

<div class="bg-white rounded-lg shadow p-4 mt-6">
  <h2 class="font-semibold mb-3">Rentabilité du chantier</h2>
  <div class="grid sm:grid-cols-3 gap-4">
    <div>
      <div class="text-sm text-slate-500">CA facturé (HT)</div>
      <div class="text-xl font-bold text-emerald-700"><?= money($caFacture) ?></div>
    </div>
    <div>
      <div class="text-sm text-slate-500">Charges affectées</div>
      <div class="text-xl font-bold"><?= money($chargesAffectees) ?></div>
    </div>
    <div>
      <div class="text-sm text-slate-500">Marge</div>
      <div class="text-xl font-bold <?= $marge < 0 ? 'text-red-600' : 'text-emerald-700' ?>">
        <?= money($marge) ?><?= $margePct !== null ? ' (' . $margePct . '%)' : '' ?>
      </div>
    </div>
  </div>
  <p class="text-xs text-slate-400 mt-3">
    <a href="/bfe-pilotage/charges/list.php" class="text-emerald-700 hover:underline">Ajouter une charge pour ce chantier</a> (transport, consommables, sous-traitance...).
  </p>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
