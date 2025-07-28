<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Handle form data and file upload
$name = $_POST['name'] ?? '';
$phone = $_POST['phone'] ?? '';
$github = $_POST['github'] ?? '';
$linkedin = $_POST['linkedin'] ?? '';
$cgpa = floatval($_POST['cgpa'] ?? 0);
$tenth_percentage = floatval($_POST['tenth_percentage'] ?? 0);
$twelfth_percentage = floatval($_POST['twelfth_percentage'] ?? 0);
$interest = $_POST['interest'] ?? '';
$grad_year = intval($_POST['grad_year'] ?? 0);
$skills_json = $_POST['skills'] ?? '[]';
$cgpaSemesters_json = $_POST['cgpaSemesters'] ?? '{}';

$skills = json_decode($skills_json, true);
$cgpaSemesters = json_decode($cgpaSemesters_json, true);
$department = $_POST['department'] ?? '';

// Basic validation
if (!$name || !$phone || !$github || !$linkedin || !$cgpa || !$tenth_percentage || !$twelfth_percentage || !$interest || !$grad_year || empty($skills) || !$department) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

// Validate phone format (basic)
if (!preg_match('/^\+[0-9]{1,3}[0-9]{10}$/', $phone)) {
    echo json_encode(['success' => false, 'message' => 'Phone number must include country code (e.g., +919876543210)']);
    exit;
}

// Handle resume upload if exists
$resume_path = null;
if (isset($_FILES['resume']) && $_FILES['resume']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['resume']['tmp_name'];
    $fileName = $_FILES['resume']['name'];
    $fileSize = $_FILES['resume']['size'];
    $fileType = $_FILES['resume']['type'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    $allowedfileExtensions = ['pdf'];
    if (!in_array($fileExtension, $allowedfileExtensions)) {
        echo json_encode(['success' => false, 'message' => 'Only PDF files are allowed for resume']);
        exit;
    }

    $newFileName = $user_id . '_resume_' . time() . '.' . $fileExtension;
    $uploadFileDir = '../Uploads/';
    $dest_path = $uploadFileDir . $newFileName;

    if (!move_uploaded_file($fileTmpPath, $dest_path)) {
        echo json_encode(['success' => false, 'message' => 'Error uploading resume file']);
        exit;
    }
    $resume_path = 'Uploads/' . $newFileName;
}

// Handle profile picture upload if exists
$profile_picture_path = null;
if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['profile_picture']['tmp_name'];
    $fileName = $_FILES['profile_picture']['name'];
    $fileSize = $_FILES['profile_picture']['size'];
    $fileType = $_FILES['profile_picture']['type'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    $allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array($fileExtension, $allowedImageExtensions)) {
        echo json_encode(['success' => false, 'message' => 'Only image files (jpg, jpeg, png, gif) are allowed for profile picture']);
        exit;
    }

    $newFileName = $user_id . '_profile_picture_' . time() . '.' . $fileExtension;
    $uploadFileDir = '../Uploads/';
    $dest_path = $uploadFileDir . $newFileName;

    if (!move_uploaded_file($fileTmpPath, $dest_path)) {
        echo json_encode(['success' => false, 'message' => 'Error uploading profile picture file']);
        exit;
    }
    $profile_picture_path = 'Uploads/' . $newFileName;
}

// Update users table (name, phone)
$updateUserStmt = $pdo->prepare("UPDATE users SET name = :name, phone = :phone WHERE id = :id");
$updateUserStmt->execute(['name' => $name, 'phone' => $phone, 'id' => $user_id]);

// Update students table
$updateStudentStmt = $pdo->prepare("UPDATE students SET github = :github, linkedin = :linkedin, cgpa = :cgpa, tenth_percentage = :tenth_percentage, twelfth_percentage = :twelfth_percentage, interest = :interest, grad_year = :grad_year, department = :department WHERE user_id = :user_id");
$updateStudentStmt->execute([
    'github' => $github,
    'linkedin' => $linkedin,
    'cgpa' => $cgpa,
    'tenth_percentage' => $tenth_percentage,
    'twelfth_percentage' => $twelfth_percentage,
    'interest' => $interest,
    'grad_year' => $grad_year,
    'department' => $department,
    'user_id' => $user_id
]);

// Update skills: delete old and insert new
$deleteSkillsStmt = $pdo->prepare("DELETE FROM student_skills WHERE student_id = :student_id");
$deleteSkillsStmt->execute(['student_id' => $user_id]);

$insertSkillStmt = $pdo->prepare("INSERT INTO student_skills (student_id, skill) VALUES (:student_id, :skill)");
foreach ($skills as $skill) {
    $insertSkillStmt->execute(['student_id' => $user_id, 'skill' => $skill]);
}

// Update semester CGPA: delete old and insert new
$deleteCgpaStmt = $pdo->prepare("DELETE FROM semester_cgpa WHERE student_id = :student_id");
$deleteCgpaStmt->execute(['student_id' => $user_id]);

$insertCgpaStmt = $pdo->prepare("INSERT INTO semester_cgpa (student_id, semester, cgpa) VALUES (:student_id, :semester, :cgpa)");
foreach ($cgpaSemesters as $semester => $cgpaValue) {
    $insertCgpaStmt->execute(['student_id' => $user_id, 'semester' => $semester, 'cgpa' => $cgpaValue]);
}

// Update resume path if uploaded
if ($resume_path) {
    $updateResumeStmt = $pdo->prepare("UPDATE students SET resume_path = :resume_path WHERE user_id = :user_id");
    $updateResumeStmt->execute(['resume_path' => $resume_path, 'user_id' => $user_id]);
}

// Update profile picture path if uploaded
if ($profile_picture_path) {
    $updateProfilePictureStmt = $pdo->prepare("UPDATE students SET profile_picture_path = :profile_picture_path WHERE user_id = :user_id");
    $updateProfilePictureStmt->execute(['profile_picture_path' => $profile_picture_path, 'user_id' => $user_id]);
}

echo json_encode(['success' => true, 'message' => 'Student profile updated successfully', 'resume_path' => $resume_path ?? null, 'profile_picture_path' => $profile_picture_path ?? null]);
?>
