<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'company') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$application_id = $data['applicationId'] ?? '';
$status = $data['status'] ?? '';

if (!$application_id || !in_array($status, ['accepted', 'rejected'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT job_id FROM applications WHERE id = :id");
    $stmt->execute(['id' => $application_id]);
    $job_id = $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT company_id FROM jobs WHERE id = :job_id");
    $stmt->execute(['job_id' => $job_id]);
    if ($stmt->fetchColumn() !== $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized to update this application']);
        exit;
    }

    $query = "UPDATE applications SET status = :status WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['status' => $status, 'id' => $application_id]);

    if ($status === 'accepted') {
        $stmt = $pdo->prepare("SELECT student_id, job_id FROM applications WHERE id = :id");
        $stmt->execute(['id' => $application_id]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT title, position, company_id FROM jobs WHERE id = :job_id");
        $stmt->execute(['job_id' => $application['job_id']]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("INSERT INTO placements (student_id, company_id, position, package, placement_date) VALUES (:student_id, :company_id, :position, :package, CURDATE())");
        $stmt->execute([
            'student_id' => $application['student_id'],
            'company_id' => $job['company_id'],
            'position' => $job['title'] ?: $job['position'],
            'package' => $data['salary_ctc'] ?? 0 // Adjust based on job data
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Application status updated']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error updating application status: ' . $e->getMessage()]);
}
?>