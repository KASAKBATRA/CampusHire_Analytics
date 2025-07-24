<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || $_SESSION['role'] !== 'tnp') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$role = $data['role'];
$userId = $data['userId'];
$loginCode = $data['loginCode'];
$password = $data['password'];
$validityMonths = $data['validityMonths'];

try {
    $table = $role === 'student' ? 'students' : 'companies';
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM $table WHERE login_code = ? AND id != ?");
    $stmt->execute([$loginCode, $userId]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Login code must be unique.']);
        exit;
    }

    $expiryDate = date('Y-m-d', strtotime("+$validityMonths months"));
    $stmt = $pdo->prepare("UPDATE $table SET login_code = ?, password = ?, status = 'verified', is_blocked = 0, validity_expiry = ? WHERE id = ?");
    $stmt->execute([$loginCode, password_hash($password, PASSWORD_DEFAULT), $expiryDate, $userId]);

    echo json_encode(['success' => true, 'message' => 'User verified successfully!', 'loginCode' => $loginCode, 'password' => $password, 'expiryDate' => $expiryDate]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>