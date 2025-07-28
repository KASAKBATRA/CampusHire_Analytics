<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'company') {
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
$hr_name = $_POST['hr_name'] ?? '';
$hr_id = $_POST['hr_id'] ?? '';
$email = $_POST['email'] ?? '';
$phone = $_POST['phone'] ?? '';
$company_name = $_POST['company_name'] ?? '';
$industry = $_POST['industry'] ?? '';
$website = $_POST['website'] ?? '';

// Basic validation
if (!$hr_name || !$hr_id || !$email || !$phone || !$company_name || !$industry || !$website) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

// Validate phone format (basic)
if (!preg_match('/^\+[0-9]{1,3}[0-9]{10}$/', $phone)) {
    echo json_encode(['success' => false, 'message' => 'Phone number must include country code (e.g., +919876543210)']);
    exit;
}

// Update users table (email, phone)
$updateUserStmt = $pdo->prepare("UPDATE users SET email = :email, phone = :phone WHERE id = :id");
$updateUserStmt->execute(['email' => $email, 'phone' => $phone, 'id' => $user_id]);

// Update companies table
$updateCompanyStmt = $pdo->prepare("UPDATE companies SET hr_name = :hr_name, hr_id = :hr_id, company_name = :company_name, industry = :industry, website = :website WHERE user_id = :user_id");
$updateCompanyStmt->execute([
    'hr_name' => $hr_name,
    'hr_id' => $hr_id,
    'company_name' => $company_name,
    'industry' => $industry,
    'website' => $website,
    'user_id' => $user_id
]);

echo json_encode(['success' => true, 'message' => 'Company profile updated successfully']);
?>
