<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

$query = "SELECT * FROM jobs";
$stmt = $pdo->prepare($query);
$stmt->execute();
$jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($jobs as &$job) {
    $job['skills'] = json_decode($job['skills'], true) ?: [];
    $job['locations'] = json_decode($job['locations'], true) ?: [];
    $job['eligibility_courses'] = json_decode($job['eligibility_courses'], true) ?: [];
    $job['salary_breakdown'] = json_decode($job['salary_breakdown'], true) ?: [];
    $job['branch_locations'] = json_decode($job['branch_locations'], true) ?: [];
    
    $stmt = $pdo->prepare("SELECT student_id FROM applications WHERE job_id = :id");
    $stmt->execute(['id' => $job['id']]);
    $job['applicants'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $stmt = $pdo->prepare("SELECT student_id FROM applications WHERE job_id = :id AND status = 'accepted'");
    $stmt->execute(['id' => $job['id']]);
    $job['selected'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
}

echo json_encode(['success' => true, 'data' => $jobs]);
?>