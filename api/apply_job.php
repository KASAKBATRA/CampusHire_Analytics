<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$studentId = $_SESSION['user']['id'];
$jobId = $data['jobId'];
$coverLetter = $data['coverLetter'];

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE student_id = ? AND job_id = ?");
    $stmt->execute([$studentId, $jobId]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'You have already applied for this job.']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO applications (id, student_id, job_id, status, applied_date, cover_letter) VALUES (?, ?, ?, 'pending', CURDATE(), ?)");
    $stmt->execute([uniqid(), $studentId, $jobId, $coverLetter]);

    $stmt = $pdo->prepare("UPDATE jobs SET applicants = JSON_ARRAY_APPEND(applicants, '$', ?) WHERE id = ?");
    $stmt->execute([$studentId, $jobId]);

    echo json_encode(['success' => true, 'message' => 'Application submitted successfully!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>