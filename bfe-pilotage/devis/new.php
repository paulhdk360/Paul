<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo->beginTransaction();
    try {
        $clientId = (int)($_POST['client_id'] ?? 0);
        if ($clientId <= 0) {
            $stmt = $pdo->prepare("INSERT INTO clients (nom, adresse_facturation, telephone, email) VALUES (?,?,?,?)");
            $stmt->execute([$_POST['client_nom'], $_POST['client_adresse'], $_POST['client_telephone'], $_POST['client_email']]);
            $clientId = (int)$pdo->lastInsertId();
        }

        $stmt = $pdo->prepare("INSERT INTO chantiers (client_id, adresse_chantier, ville, code_postal, type_projet, usage_eau) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$clientId, $_POST['chantier_adresse'], $_POST['chantier_ville'], $_POST['chantier_cp'], $_POST['type_projet'], $_POST['usage_eau']]);
        $chantierId = (int)$pdo->lastInsertId();

        $reference = next_reference($pdo, 'devis', 'BFE-DEV');
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

        $stmt = $pdo->prepare("INSERT INTO devis (reference, chantier_id, date_devis, version, profondeur_min_m, profondeur_max_m, diametre_forage, tva_taux, acompte_pct, validite_jours, statut, total_ht, total_ttc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $reference, $chantierId, $_POST['date_devis'], 'V0',
            $_POST['profondeur_min'] !== '' ? $_POST['profondeur_min'] : null,
            $_POST['profondeur_max'] !== '' ? $_POST['profondeur_max'] : null,
            $_POST['diametre_forage'], $tvaTaux, (float)str_replace(',', '.', $_POST['acompte_pct']),
            (int)$_POST['validite_jours'], 'brouillon', $totalHt, $totalTtc,
        ]);
        $devisId = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare("INSERT INTO devis_lignes (devis_id, numero, designation, unite, quantite, prix_unitaire_ht) VALUES (?,?,?,?,?,?)");
        foreach ($lignes as $l) {
            $stmt->execute([$devisId, $l['numero'], $l['designation'], $l['unite'], $l['quantite'], $l['prix_unitaire_ht']]);
        }

        $pdo->commit();
        redirect('/bfe-pilotage/devis/view.php?id=' . $devisId);
    } catch (Throwable $e) {
        $pdo->rollBack();
        $error = $e->getMessage();
    }
}

$clients = $pdo->query("SELECT id, nom FROM clients ORDER BY nom")->fetchAll();

$pageTitle = 'Nouveau devis';
require_once __DIR__ . '/../includes/header.php';

// Lignes types par défaut, reprises du modèle BFE-DEV-2026-011 (modifiables/supprimables).
$lignesDefaut = [
    ['Visite technique préalable, analyse accès, implantation prévisionnelle', 'forfait', 1, 0],
    ['Amenée et repli foreuse, compresseur, tiges, tubages et équipements — forfait moins de 50km', 'forfait', 1, 290],
    ['Installation de chantier, mise en sécurité, protection zone de travail', 'forfait', 1, 0],
    ['Forage de production d\'eau jusqu\'à profondeur prévisionnelle inférieure ou égale à 10m', 'forfait', 1, 1000],
    ['Fourniture et pose crépines, bouchon de fond et tubage plein', 'forfait', 1, 300],
    ['Fourniture et mise en place massif filtrant / gravier calibré', 'forfait', 1, 90],
    ['Cimentation annulaire', 'forfait', 1, 90],
    ['Réalisation d\'une tête de puits protégée (fourniture et pose regard)', 'forfait', 1, 130],
    ['Développement de l\'ouvrage : soufflage, air-lift, nettoyage', 'h', 1, 90],
    ['Option approfondissement au delà de 10m (forage + tubage)', 'm', 0, 115],
];
?>

<h1 class="text-2xl font-semibold mb-6">Nouveau devis</h1>

<?php if (!empty($error)): ?><div class="bg-red-100 text-red-700 p-3 rounded mb-4"><?= h($error) ?></div><?php endif; ?>

<form method="post" class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Client</h2>
    <div class="grid sm:grid-cols-2 gap-3">
      <div>
        <label class="block text-sm text-slate-500 mb-1">Client existant</label>
        <select name="client_id" class="w-full border rounded px-2 py-1">
          <option value="0">— Nouveau client —</option>
          <?php foreach ($clients as $c): ?>
            <option value="<?= $c['id'] ?>"><?= h($c['nom']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div></div>
      <div><label class="block text-sm text-slate-500 mb-1">Nom (si nouveau client)</label><input name="client_nom" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Téléphone</label><input name="client_telephone" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Adresse de facturation</label><input name="client_adresse" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Email</label><input name="client_email" type="email" class="w-full border rounded px-2 py-1"></div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Chantier</h2>
    <div class="grid sm:grid-cols-2 gap-3">
      <div><label class="block text-sm text-slate-500 mb-1">Adresse du chantier</label><input name="chantier_adresse" class="w-full border rounded px-2 py-1" required></div>
      <div><label class="block text-sm text-slate-500 mb-1">Ville</label><input name="chantier_ville" class="w-full border rounded px-2 py-1" required></div>
      <div><label class="block text-sm text-slate-500 mb-1">Code postal</label><input name="chantier_cp" class="w-full border rounded px-2 py-1"></div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Type de projet</label>
        <select name="type_projet" class="w-full border rounded px-2 py-1">
          <?php foreach (TYPES_PROJET as $code => $label): ?>
            <option value="<?= $code ?>"><?= h($label) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="sm:col-span-2"><label class="block text-sm text-slate-500 mb-1">Usage prévu de l'eau</label><input name="usage_eau" class="w-full border rounded px-2 py-1" placeholder="Ex : production eau, irrigation..."></div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Hypothèses techniques</h2>
    <div class="grid sm:grid-cols-4 gap-3">
      <div><label class="block text-sm text-slate-500 mb-1">Date du devis</label><input type="date" name="date_devis" value="<?= date('Y-m-d') ?>" class="w-full border rounded px-2 py-1" required></div>
      <div><label class="block text-sm text-slate-500 mb-1">Profondeur min (m)</label><input name="profondeur_min" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Profondeur max (m)</label><input name="profondeur_max" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Diamètre de forage</label><input name="diametre_forage" class="w-full border rounded px-2 py-1" placeholder="Ø178 mm (7'')"></div>
      <div><label class="block text-sm text-slate-500 mb-1">TVA (%)</label><input name="tva_taux" value="10" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Acompte (%)</label><input name="acompte_pct" value="30" class="w-full border rounded px-2 py-1"></div>
      <div><label class="block text-sm text-slate-500 mb-1">Validité (jours)</label><input name="validite_jours" value="30" class="w-full border rounded px-2 py-1"></div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-semibold mb-3">Détail estimatif des prix</h2>
    <table class="w-full text-sm" id="lignes-table">
      <thead>
        <tr class="text-left text-slate-500 border-b">
          <th class="py-1 w-1/2">Désignation</th><th>Unité</th><th>Qté</th><th>PU HT</th><th></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($lignesDefaut as $l): ?>
        <tr>
          <td class="py-1 pr-2"><input name="ligne_designation[]" value="<?= h($l[0]) ?>" class="w-full border rounded px-2 py-1"></td>
          <td class="pr-2">
            <select name="ligne_unite[]" class="border rounded px-2 py-1">
              <option value="forfait" <?= $l[1] === 'forfait' ? 'selected' : '' ?>>forfait</option>
              <option value="h" <?= $l[1] === 'h' ? 'selected' : '' ?>>h</option>
              <option value="m" <?= $l[1] === 'm' ? 'selected' : '' ?>>m</option>
            </select>
          </td>
          <td class="pr-2"><input name="ligne_quantite[]" value="<?= $l[2] ?>" class="w-16 border rounded px-2 py-1"></td>
          <td class="pr-2"><input name="ligne_pu[]" value="<?= $l[3] ?>" class="w-20 border rounded px-2 py-1"></td>
          <td><button type="button" onclick="this.closest('tr').remove()" class="text-red-600 text-xs">supprimer</button></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <button type="button" id="add-ligne" class="mt-3 text-emerald-700 text-sm font-medium">+ Ajouter une ligne</button>
  </div>

  <button type="submit" class="bg-emerald-700 text-white px-6 py-2 rounded hover:bg-emerald-800">Créer le devis</button>
</form>

<template id="ligne-template">
  <tr>
    <td class="py-1 pr-2"><input name="ligne_designation[]" class="w-full border rounded px-2 py-1"></td>
    <td class="pr-2">
      <select name="ligne_unite[]" class="border rounded px-2 py-1">
        <option value="forfait">forfait</option>
        <option value="h">h</option>
        <option value="m">m</option>
      </select>
    </td>
    <td class="pr-2"><input name="ligne_quantite[]" value="1" class="w-16 border rounded px-2 py-1"></td>
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
