<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = db();

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT d.*, ch.adresse_chantier, ch.ville, ch.code_postal, ch.type_projet, ch.usage_eau,
           cl.nom AS client_nom, cl.adresse_facturation, cl.telephone, cl.email
    FROM devis d
    JOIN chantiers ch ON ch.id = d.chantier_id
    JOIN clients cl ON cl.id = ch.client_id
    WHERE d.id = ?
");
$stmt->execute([$id]);
$devis = $stmt->fetch();
if (!$devis) { http_response_code(404); echo 'Devis introuvable'; exit; }

$stmt = $pdo->prepare("SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY numero");
$stmt->execute([$id]);
$lignes = $stmt->fetchAll();

$acompte = round($devis['total_ttc'] * $devis['acompte_pct'] / 100, 2);

$pageTitle = $devis['reference'];
require_once __DIR__ . '/../includes/header.php';
?>

<div class="no-print flex items-center justify-between mb-4">
  <a href="/bfe-pilotage/devis/list.php" class="text-sm text-slate-500 hover:underline">&larr; Retour aux devis</a>
  <div class="flex gap-2">
    <button onclick="window.print()" class="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 text-sm">Imprimer / Enregistrer en PDF</button>
    <a href="/bfe-pilotage/factures/new.php?devis_id=<?= $devis['id'] ?>" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 text-sm">Créer la facture</a>
  </div>
</div>

<div class="bg-white shadow rounded-lg p-8 text-sm leading-relaxed">
  <div class="flex justify-between items-start mb-6">
    <div>
      <div><?= h($devis['reference']) ?></div>
      <div><?= h($devis['client_nom']) ?></div>
      <div><?= h($devis['date_devis']) ?></div>
    </div>
  </div>

  <h1 class="text-xl font-bold mb-1"><?= h(type_projet_label($devis['type_projet'])) ?></h1>
  <h2 class="text-lg font-semibold mb-6"><?= h($devis['client_nom']) ?></h2>

  <h3 class="font-semibold border-b pb-1 mb-2">1. Identification de l'entreprise</h3>
  <table class="w-full mb-6"><tbody>
    <tr><td class="font-medium w-1/3 py-0.5">Société</td><td><?= h(ENTREPRISE_NOM) ?></td></tr>
    <tr><td class="font-medium py-0.5">Adresse</td><td><?= h(ENTREPRISE_ADRESSE) ?></td></tr>
    <tr><td class="font-medium py-0.5">SIRET</td><td><?= h(ENTREPRISE_SIRET) ?></td></tr>
    <tr><td class="font-medium py-0.5">Représentant</td><td><?= h(ENTREPRISE_REPRESENTANT) ?></td></tr>
    <tr><td class="font-medium py-0.5">Téléphone / courriel</td><td><?= h(ENTREPRISE_TEL) ?> — <?= h(ENTREPRISE_EMAIL) ?></td></tr>
  </tbody></table>

  <h3 class="font-semibold border-b pb-1 mb-2">2. Identification client et chantier</h3>
  <table class="w-full mb-6"><tbody>
    <tr><td class="font-medium w-1/3 py-0.5">Client</td><td><?= h($devis['client_nom']) ?></td></tr>
    <tr><td class="font-medium py-0.5">Adresse de facturation</td><td><?= h($devis['adresse_facturation']) ?></td></tr>
    <tr><td class="font-medium py-0.5">Adresse du chantier</td><td><?= h($devis['adresse_chantier']) ?>, <?= h($devis['code_postal']) ?> <?= h($devis['ville']) ?></td></tr>
    <tr><td class="font-medium py-0.5">Usage prévu de l'eau</td><td><?= h($devis['usage_eau']) ?></td></tr>
  </tbody></table>

  <h3 class="font-semibold border-b pb-1 mb-2">3. Données d'entrée et hypothèses techniques</h3>
  <table class="w-full mb-6"><tbody>
    <tr><td class="font-medium w-1/3 py-0.5">Profondeur prévisionnelle</td><td><?= h($devis['profondeur_min_m']) ?> m – <?= h($devis['profondeur_max_m']) ?> m</td></tr>
    <tr><td class="font-medium py-0.5">Diamètre de forage</td><td><?= h($devis['diametre_forage']) ?></td></tr>
  </tbody></table>

  <h3 class="font-semibold border-b pb-1 mb-2">4. Détail estimatif des prix</h3>
  <table class="w-full mb-2">
    <thead><tr class="text-left bg-slate-100"><th class="px-2 py-1">N°</th><th class="px-2 py-1">Désignation</th><th class="px-2 py-1">Unité</th><th class="px-2 py-1">Qté</th><th class="px-2 py-1">PU HT</th><th class="px-2 py-1">Total HT</th></tr></thead>
    <tbody>
      <?php foreach ($lignes as $l): ?>
      <tr class="border-b">
        <td class="px-2 py-1"><?= $l['numero'] ?></td>
        <td class="px-2 py-1"><?= h($l['designation']) ?></td>
        <td class="px-2 py-1"><?= h($l['unite']) ?></td>
        <td class="px-2 py-1"><?= $l['quantite'] ?></td>
        <td class="px-2 py-1"><?= money((float)$l['prix_unitaire_ht']) ?></td>
        <td class="px-2 py-1"><?= money((float)$l['quantite'] * (float)$l['prix_unitaire_ht']) ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>

  <table class="w-64 ml-auto mb-6">
    <tbody>
      <tr><td class="font-medium py-0.5">Total HT</td><td class="text-right"><?= money((float)$devis['total_ht']) ?></td></tr>
      <tr><td class="font-medium py-0.5">TVA <?= h($devis['tva_taux']) ?>%</td><td class="text-right"><?= money((float)$devis['total_ht'] * (float)$devis['tva_taux'] / 100) ?></td></tr>
      <tr class="font-bold border-t"><td class="py-0.5">Total TTC</td><td class="text-right"><?= money((float)$devis['total_ttc']) ?></td></tr>
      <tr><td class="font-medium py-0.5">Acompte à la commande (<?= h($devis['acompte_pct']) ?>%)</td><td class="text-right"><?= money($acompte) ?></td></tr>
    </tbody>
  </table>

  <h3 class="font-semibold border-b pb-1 mb-2">5. Conditions commerciales</h3>
  <p>Validité du devis : <?= h($devis['validite_jours']) ?> jours. Les quantités réelles seront ajustées selon profondeur atteinte, équipement posé et options réalisées.</p>

  <p class="text-xs text-slate-400 mt-8"><?= h(ENTREPRISE_FORME) ?></p>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
