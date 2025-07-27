<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$job_id = $data['jobId'] ?? '';
$cover_letter = $data['coverLetter'] ?? '';

if (!$job_id || !$cover_letter) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM jobs WHERE id = :job_id AND deadline >= CURDATE()");
    $stmt->execute(['job_id' => $job_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Job not found or expired']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM applications WHERE student_id = :student_id AND job_id = :job_id");
    $stmt->execute(['student_id' => $_SESSION['user_id'], 'job_id' => $job_id]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already applied for this job']);
        exit;
    }

    $query = "INSERT INTO applications (student_id, job_id, cover_letter, applied_date, status) VALUES (:student_id, :job_id, :cover_letter, CURDATE(), 'pending')";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'student_id' => $_SESSION['user_id'],
        'job_id' => $job_id,
        'cover_letter' => $cover_letter
    ]);

    echo json_encode(['success' => true, 'message' => 'Application submitted successfully']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error applying for job: ' . $e->getMessage()]);
}
?>