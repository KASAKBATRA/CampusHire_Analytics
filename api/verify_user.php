<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'tnp') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$role = $data['role'] ?? '';
$user_id = $data['userId'] ?? '';
// Remove login_code from input, it will be generated
$validity_months = $data['validityMonths'] ?? 12;

if ($role === 'tnp') {
    echo json_encode(['success' => false, 'message' => 'T&P officers are automatically verified upon registration']);
    exit;
}

if (!$role || !$user_id) { // Removed login_code and password from required fields
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    // Fetch the existing password from the database
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = :id AND role = :role");
    $stmt->execute(['id' => $user_id, 'role' => $role]);
    $user_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user_data) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Generate a new login code
    $login_code = generateLoginCode($role);
    $expiry_date = date('Y-m-d', strtotime("+$validity_months months"));

    // Update query: only update login_code, status, and profile_completed
    $query = "UPDATE users SET login_code = :login_code, status = 'verified', profile_completed = TRUE WHERE id = :id AND role = :role";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'login_code' => $login_code,
        'id' => $user_id,
        'role' => $role
    ]);

    echo json_encode([
        'success' => true,
        'loginCode' => $login_code,
        'expiryDate' => $expiry_date
    ]);
}catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error verifying user: ' . $e->getMessage()]);
}

// Function to generate login code (can be moved to a shared utility file)
function generateLoginCode($role) {
    $prefix = ($role === 'student') ? 'STU' : 'COM';
    // T&P role is handled by automatic verification, but keeping the prefix logic for completeness
    if ($role === 'tnp') {
        $prefix = 'TNP';
    }
    $randomNum = mt_rand(1000, 9999);
    return $prefix . $randomNum;
}
?>
