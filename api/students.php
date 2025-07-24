<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || !in_array($_SESSION['role'], ['tnp', 'company'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT * FROM students");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($students as &$student) {
        $student['skills'] = json_decode($student['skills'] ?? '[]');
        $student['cgpa_semesters'] = json_decode($student['cgpa_semesters'] ?? '[]');
    }
    echo json_encode(['success' => true, 'data' => $students]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>