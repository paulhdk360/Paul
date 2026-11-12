<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';
$current = basename($_SERVER['SCRIPT_NAME']);
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= isset($pageTitle) ? h($pageTitle) . ' — ' : '' ?>BFE Pilotage</title>
<link rel="stylesheet" href="/bfe-pilotage/assets/app.css">
</head>
<body class="bg-slate-50 text-slate-800">
<header class="no-print bg-emerald-800 text-white">
  <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/bfe-pilotage/index.php" class="font-semibold tracking-wide">Béarn Forage Énergie — Pilotage</a>
    <nav class="flex gap-4 text-sm">
      <a class="hover:underline" href="/bfe-pilotage/index.php">Tableau de bord</a>
      <a class="hover:underline" href="/bfe-pilotage/devis/list.php">Devis</a>
      <a class="hover:underline" href="/bfe-pilotage/factures/list.php">Factures</a>
      <a class="hover:underline" href="/bfe-pilotage/chantiers/list.php">Chantiers</a>
      <a class="hover:underline" href="/bfe-pilotage/materiel/list.php">Matériel</a>
    </nav>
  </div>
</header>
<main class="max-w-6xl mx-auto px-4 py-6">
