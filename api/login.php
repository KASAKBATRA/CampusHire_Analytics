<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);
$identifier = $data['identifier'];
$password = $data['password'];
$role = $data['role'];

try {
    if ($role === 'tnp') {
        $stmt = $pdo->prepare("SELECT * FROM tnp_officers WHERE email = ?");
        $stmt->execute([$identifier]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user'] = $user;
            $_SESSION['role'] = 'tnp';
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        }
    } else {
        $table = $role === 'student' ? 'students' : 'companies';
        $stmt = $pdo->prepare("SELECT * FROM $table WHERE login_code = ?");
        $stmt->execute([$identifier]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Invalid login code.']);
        } elseif ($user['status'] !== 'verified') {
            echo json_encode(['success' => false, 'message' => 'User not verified yet.']);
        } elseif ($user['is_blocked']) {
            echo json_encode(['success' => false, 'message' => 'User is blocked. Contact T&P admin.']);
        } elseif (password_verify($password, $user['password'])) {
            $_SESSION['user'] = $user;
            $_SESSION['role'] = $role;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password.']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>