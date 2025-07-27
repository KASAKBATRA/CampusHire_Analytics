<?php
header('Content-Type: application/json');
include '../config/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$role = $data['role'] ?? '';
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';
$password = $data['password'] ?? '';

if (!$role || !$name || !$email || !$phone || !$password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

if (!preg_match('/^\+[0-9]{1,3}[0-9]{10}$/', $phone)) {
    echo json_encode(['success' => false, 'message' => 'Invalid phone number format']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

if (strlen($password) < 8 || !preg_match('/[0-9]/', $password) || !preg_match('/[!@#$%^&*]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters, including a number and a special character']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    // Determine status and login code based on role
    $status = ($role === 'tnp') ? 'verified' : 'pending';
    $login_code = ($role === 'tnp') ? generateLoginCode('tnp') : null; // Generate login code for T&P
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // Insert into users table
    $query = "INSERT INTO users (role, name, email, phone, password, status, login_code) VALUES (:role, :name, :email, :phone, :password, :status, :login_code)";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'role' => $role,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'password' => $hashed_password,
        'status' => $status,
        'login_code' => $login_code
    ]);
    $user_id = $pdo->lastInsertId();
    
    // Insert role-specific data
    if ($role === 'student') {
        $course = $data['course'] ?? '';
        if (!$course) {
            throw new Exception('Course is required for students');
        }
        $query = "INSERT INTO students (user_id, course) VALUES (:user_id, :course)";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['user_id' => $user_id, 'course' => $course]);
    } elseif ($role === 'tnp') {
        $employee_id = $data['employeeId'] ?? '';
        $position = $data['position'] ?? '';
        $department = $data['department'] ?? '';
        if (!$employee_id || !$position || !$department) {
            throw new Exception('All T&P fields are required');
        }
        $query = "INSERT INTO tnp_officers (user_id, employee_id, position, department) VALUES (:user_id, :employee_id, :position, :department)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            'user_id' => $user_id,
            'employee_id' => $employee_id,
            'position' => $position,
            'department' => $department
        ]);
    } elseif ($role === 'company') {
        $company_name = $data['companyName'] ?? '';
        $hr_id = $data['hrId'] ?? '';
        $hr_name = $data['name'] ?? '';
        $industry = $data['industry'] ?? '';
        $website = $data['website'] ?? '';
        if (!$company_name || !$hr_id || !$hr_name || !$industry || !$website) {
            throw new Exception('All company fields are required');
        }
        $query = "INSERT INTO companies (user_id, company_name, hr_id, hr_name, industry, website) VALUES (:user_id, :company_name, :hr_id, :hr_name, :industry, :website)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            'user_id' => $user_id,
            'company_name' => $company_name,
            'hr_id' => $hr_id,
            'hr_name' => $hr_name,
            'industry' => $industry,
            'website' => $website
        ]);
    }
    
    $pdo->commit();
    $message = ($role === 'tnp') ? 
        "Registration successful! Your login code is: $login_code. Use this to log in with your password." :
        'Registration successful! Please wait for verification.';
    echo json_encode(['success' => true, 'message' => $message, 'loginCode' => $login_code]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// Function to generate login code
function generateLoginCode($role) {
    $prefix = ($role === 'student') ? 'STU' : 'COM';
    if ($role === 'tnp') {
        $prefix = 'TNP';
    }
    $randomNum = mt_rand(1000, 9999);
    return $prefix . $randomNum;
}
?>