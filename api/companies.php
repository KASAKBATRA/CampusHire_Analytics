<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'tnp') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$query = "SELECT u.id, u.name, u.email, u.phone, u.status, c.company_name, c.hr_id, c.hr_name, c.industry, c.website
          FROM users u
          JOIN companies c ON u.id = c.user_id
          WHERE u.role = 'company'";
        
$stmt = $pdo->prepare($query);
$stmt->execute();
$companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($companies as &$company) {
    $stmt = $pdo->prepare("SELECT id FROM jobs WHERE company_id = :id");
    $stmt->execute(['id' => $company['id']]);
    $company['jobPostings'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
}

echo json_encode(['success' => true, 'data' => $companies]);
?>