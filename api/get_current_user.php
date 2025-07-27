<?php
session_start();
header('Content-Type: application/json');

include '../config/db_connect.php';

if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    $query = "SELECT id, role, name, email, phone, status, profile_completed FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Fetch additional details based on role
        if ($user['role'] === 'student') {
            $stmt = $pdo->prepare("SELECT course, department, year, cgpa, github, linkedin, tenth_percentage, twelfth_percentage, interest, grad_year, resume_path FROM students WHERE user_id = :id");
            $stmt->execute(['id' => $user_id]);
            $user = array_merge($user, $stmt->fetch(PDO::FETCH_ASSOC) ?: []);
            
            // Fetch skills
            $stmt = $pdo->prepare("SELECT skill FROM student_skills WHERE student_id = :id");
            $stmt->execute(['id' => $user_id]);
            $user['skills'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Fetch semester CGPA
            $stmt = $pdo->prepare("SELECT semester, cgpa FROM semester_cgpa WHERE student_id = :id ORDER BY semester");
            $stmt->execute(['id' => $user_id]);
            $user['cgpaSemesters'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        } elseif ($user['role'] === 'tnp') {
            $stmt = $pdo->prepare("SELECT employee_id, position, department FROM tnp_officers WHERE user_id = :id");
            $stmt->execute(['id' => $user_id]);
            $user = array_merge($user, $stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } elseif ($user['role'] === 'company') {
            $stmt = $pdo->prepare("SELECT company_name, hr_id, hr_name, industry, website FROM companies WHERE user_id = :id");
            $stmt->execute(['id' => $user_id]);
            $user = array_merge($user, $stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        }
        
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
}
?>