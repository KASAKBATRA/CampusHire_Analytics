<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || !in_array($_SESSION['role'], ['student', 'company'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $query = $_SESSION['role'] === 'student' ? "SELECT * FROM applications WHERE student_id = ?" : "SELECT a.* FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$_SESSION['user']['id']]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $applications]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>