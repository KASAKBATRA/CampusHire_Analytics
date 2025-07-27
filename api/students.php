<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'tnp') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$query = "SELECT u.id, u.name, u.email, u.phone, u.status, s.course, s.department, s.year, s.cgpa, s.github, s.linkedin, s.tenth_percentage, s.twelfth_percentage, s.interest, s.grad_year, p.position, p.package, p.placement_date
          FROM users u
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN placements p ON u.id = p.student_id
          WHERE u.role = 'student'";
$stmt = $pdo->prepare($query);
$stmt->execute();
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($students as &$student) {
    $stmt = $pdo->prepare("SELECT skill FROM student_skills WHERE student_id = :id");
    $stmt->execute(['id' => $student['id']]);
    $student['skills'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $stmt = $pdo->prepare("SELECT semester, cgpa FROM semester_cgpa WHERE student_id = :id ORDER BY semester");
    $stmt->execute(['id' => $student['id']]);
    $student['cgpaSemesters'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $student['placement'] = $student['position'] ? [
        'position' => $student['position'],
        'package' => $student['package'],
        'date' => $student['placement_date']
    ] : null;
    unset($student['position']);
    unset($student['package']);
    unset($student['placement_date']);
}

echo json_encode(['success' => true, 'data' => $students]);
?>