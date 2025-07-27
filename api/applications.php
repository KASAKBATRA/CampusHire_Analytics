<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

$query = "SELECT id, student_id, job_id, cover_letter, applied_date, status FROM applications";
$stmt = $pdo->prepare($query);
$stmt->execute();
$applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $applications]);
?>