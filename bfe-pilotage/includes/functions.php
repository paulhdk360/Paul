<?php

function money(float $v): string {
    return number_format($v, 2, ',', ' ') . ' €';
}

function h(?string $v): string {
    return htmlspecialchars($v ?? '', ENT_QUOTES, 'UTF-8');
}

const TYPES_PROJET = [
    'forage_eau' => "Forage d'eau",
    'geothermie_sonde' => 'Géothermie — sonde verticale',
    'geothermie_nappe' => 'Géothermie — nappe / aquathermie',
    'autre' => 'Autre',
];

function type_projet_label(string $code): string {
    return TYPES_PROJET[$code] ?? $code;
}

function lignes_total_ht(array $lignes): float {
    $total = 0.0;
    foreach ($lignes as $l) {
        $total += (float)$l['quantite'] * (float)$l['prix_unitaire_ht'];
    }
    return $total;
}

// Génère la référence suivante au format PREFIX-YYYY-NNN (ex: BFE-DEV-2026-012)
function next_reference(PDO $pdo, string $table, string $prefix): string {
    $year = date('Y');
    $like = $prefix . '-' . $year . '-%';
    $stmt = $pdo->prepare("SELECT reference FROM {$table} WHERE reference LIKE ? ORDER BY reference DESC LIMIT 1");
    $stmt->execute([$like]);
    $last = $stmt->fetchColumn();
    $next = 1;
    if ($last) {
        $parts = explode('-', $last);
        $next = (int)end($parts) + 1;
    }
    return sprintf('%s-%s-%03d', $prefix, $year, $next);
}

function redirect(string $url): void {
    header('Location: ' . $url);
    exit;
}
