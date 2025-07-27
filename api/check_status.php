<?php
header('Content-Type: application/json');
include '../config/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

$query = "SELECT status, login_code, password, role FROM users WHERE email = :email";
$stmt = $pdo->prepare($query);
$stmt->execute(['email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    $response = [
        'success' => true,
        'status' => $user['status'],
        'loginCode' => $user['login_code']
    ];
    if ($user['role'] === 'tnp') {
        $response['message'] = "Your account is verified. Use login code: {$user['login_code']} to log in.";
    }
    echo json_encode($response);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials', 'status' => 'not-found']);
}
?>