<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || $_SESSION['role'] !== 'tnp') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT * FROM companies");
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $companies]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>