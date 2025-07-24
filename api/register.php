<?php
header('Content-Type: application/json');
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$role = $data['role'];
$userData = $data;

try {
    if ($role === 'student') {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE email = ?");
        $stmt->execute([$userData['email']]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already exists.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO students (id, name, email, phone, password, course, status, login_code, profile_completed) VALUES (?, ?, ?, ?, ?, ?, 'pending', '', 0)");
        $stmt->execute([
            uniqid(),
            $userData['name'],
            $userData['email'],
            $userData['phone'],
            password_hash($userData['password'], PASSWORD_DEFAULT),
            $userData['course']
        ]);
    } elseif ($role === 'tnp') {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM tnp_officers WHERE email = ? OR employee_id = ?");
        $stmt->execute([$userData['email'], $userData['employeeId']]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Email or Employee ID already exists.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO tnp_officers (id, name, email, phone, password, employee_id, position, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            uniqid(),
            $userData['name'],
            $userData['email'],
            $userData['phone'],
            password_hash($userData['password'], PASSWORD_DEFAULT),
            $userData['employeeId'],
            $userData['position'],
            $userData['department']
        ]);
    } elseif ($role === 'company') {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM companies WHERE email = ? OR hr_id = ?");
        $stmt->execute([$userData['email'], $userData['hrId']]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Email or HR ID already exists.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO companies (id, company_name, hr_name, hr_id, hr_email, phone, industry, website, status, login_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', '')");
        $stmt->execute([
            uniqid(),
            $userData['companyName'],
            $userData['name'],
            $userData['hrId'],
            $userData['email'],
            $userData['phone'],
            $userData['industry'],
            $userData['website']
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Registration successful! Please wait for verification.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>