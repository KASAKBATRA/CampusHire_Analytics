<?php
header('Content-Type: application/json');
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];
$password = $data['password'];

try {
    $user = null;
    $role = null;

    $stmt = $pdo->prepare("SELECT * FROM students WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $role = 'student';

    if (!$user) {
        $stmt = $pdo->prepare("SELECT * FROM companies WHERE hr_email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $role = 'company';
    }

    if (!$user) {
        echo json_encode(['success' => false, 'status' => 'not-found', 'message' => 'No registration found']);
        exit;
    }

    if (!password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'status' => 'not-found', 'message' => 'Invalid password']);
        exit;
    }

    $status = $user['is_blocked'] ? 'blocked' : $user['status'];
    echo json_encode(['success' => true, 'status' => $status, 'loginCode' => $user['login_code']]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>