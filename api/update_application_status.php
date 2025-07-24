<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || $_SESSION['role'] !== 'company') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$applicationId = $data['applicationId'];
$status = $data['status'];

try {
    $stmt = $pdo->prepare("UPDATE applications SET status = ? WHERE id = ?");
    $stmt->execute([$status, $applicationId]);

    if ($status === 'accepted') {
        $stmt = $pdo->prepare("SELECT student_id, job_id FROM applications WHERE id = ?");
        $stmt->execute([$applicationId]);
        $app = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT company_name, title, position, salary_total_ctc, stipend FROM jobs WHERE id = ?");
        $stmt->execute([$app['job_id']]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        $package = $job['type'] === 'job' ? $job['salary_total_ctc'] : $job['stipend'];
        $position = $job['type'] === 'job' ? $job['title'] : $job['position'];

        $stmt = $pdo->prepare("UPDATE students SET placement_company = ?, placement_position = ?, placement_package = ?, placement_date = CURDATE() WHERE id = ?");
        $stmt->execute([$job['company_name'], $position, $package, $app['student_id']]);

        $stmt = $pdo->prepare("UPDATE jobs SET selected = JSON_ARRAY_APPEND(selected, '$', ?) WHERE id = ?");
        $stmt->execute([$app['student_id'], $app['job_id']]);
    }

    echo json_encode(['success' => true, 'message' => "Application $status!"]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>