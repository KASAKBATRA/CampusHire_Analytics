<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $query = $_SESSION['role'] === 'company' ? "SELECT * FROM jobs WHERE company_id = ?" : "SELECT * FROM jobs";
    $stmt = $pdo->prepare($query);
    $params = $_SESSION['role'] === 'company' ? [$_SESSION['user']['id']] : [];
    $stmt->execute($params);
    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($jobs as &$job) {
        $job['locations'] = json_decode($job['locations'] ?? '[]');
        $job['skills'] = json_decode($job['skills'] ?? '[]');
        $job['applicants'] = json_decode($job['applicants'] ?? '[]');
        $job['selected'] = json_decode($job['selected'] ?? '[]');
        $job['eligibility_preferred_courses'] = json_decode($job['eligibility_preferred_courses'] ?? '[]');
        $job['salary_breakdown'] = json_decode($job['salary_breakdown'] ?? '{}');
        $job['company_details_branch_locations'] = json_decode($job['company_details_branch_locations'] ?? '[]');
    }
    echo json_encode(['success' => true, 'data' => $jobs]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>