<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'tnp') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$name = $_POST['name'] ?? '';
$employee_id = $_POST['employee_id'] ?? '';
$position = $_POST['position'] ?? '';
$department = $_POST['department'] ?? '';
$phone = $_POST['phone'] ?? '';

// Basic validation
if (!$name || !$employee_id || !$position || !$department || !$phone) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

// Validate phone format (basic)
if (!preg_match('/^\+[0-9]{1,3}[0-9]{10}$/', $phone)) {
    echo json_encode(['success' => false, 'message' => 'Phone number must include country code (e.g., +919876543210)']);
    exit;
}

// Update users table (name, phone)
$updateUserStmt = $pdo->prepare("UPDATE users SET name = :name, phone = :phone WHERE id = :id");
$updateUserStmt->execute(['name' => $name, 'phone' => $phone, 'id' => $user_id]);

// Update tnp_officers table
$updateTnpStmt = $pdo->prepare("UPDATE tnp_officers SET employee_id = :employee_id, position = :position, department = :department WHERE user_id = :user_id");
$updateTnpStmt->execute([
    'employee_id' => $employee_id,
    'position' => $position,
    'department' => $department,
    'user_id' => $user_id
]);

echo json_encode(['success' => true, 'message' => 'T&P profile updated successfully']);
?>
