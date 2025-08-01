<?php
session_start();
header('Content-Type: application/json');

include '../config/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$identifier = $data['identifier'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? '';

if (!$identifier || !$password || !$role) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$query = $role === 'tnp' ?
    "SELECT id, role, name, email, password, status, profile_completed FROM users WHERE email = :identifier AND role = :role" :
    "SELECT id, role, name, email, password, status, profile_completed FROM users WHERE login_code = :identifier AND role = :role";
$stmt = $pdo->prepare($query);
$stmt->execute(['identifier' => $identifier, 'role' => $role]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);





if ($user && password_verify($password, $user['password'])) {
    if ($user['status'] === 'verified') {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        
        // Fetch additional details based on role
        if ($user['role'] === 'student') {
            $stmt = $pdo->prepare("SELECT course, department, year, cgpa, github, linkedin, tenth_percentage, twelfth_percentage, interest, grad_year, resume_path FROM students WHERE user_id = :id");
            $stmt->execute(['id' => $user['id']]);
            $user = array_merge($user, $stmt->fetch(PDO::FETCH_ASSOC) ?: []);
            
            $stmt = $pdo->prepare("SELECT skill FROM student_skills WHERE student_id = :id");
            $stmt->execute(['id' => $user['id']]);
            $user['skills'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $stmt = $pdo->prepare("SELECT semester, cgpa FROM semester_cgpa WHERE student_id = :id ORDER BY semester");
            $stmt->execute(['id' => $user['id']]);
            $user['cgpaSemesters'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        } elseif ($user['role'] === 'tnp') {
            $stmt = $pdo->prepare("SELECT employee_id, position, department FROM tnp_officers WHERE user_id = :id");
            $stmt->execute(['id' => $user['id']]);
            $user = array_merge($user, $stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } elseif ($user['role'] === 'company') {
            $stmt = $pdo->prepare("SELECT company_name, hr_id, hr_name, industry, website FROM companies WHERE user_id = :id");
            $stmt->execute(['id' => $user['id']]);
            $user = array_merge($user, $stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        }
        
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Account is ' . $user['status']]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
}
?>