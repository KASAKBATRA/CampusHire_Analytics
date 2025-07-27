<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php'; // Adjust the path as necessary

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$updatedData = [
    'id' => $data['id'],
    'name' => $data['name'],
    'phone' => $data['phone'],
    'github' => $data['github'],
    'linkedin' => $data['linkedin'],
    'cgpa' => $data['cgpa'],
    'tenth_percentage' => $data['tenth_percentage'],
    'twelfth_percentage' => $data['twelfth_percentage'],
    'interest' => $data['interest'],
    'grad_year' => $data['grad_year'],
    'skills' => json_decode($data['skills'], true),
];

// Handle resume upload
if (isset($_FILES['resume']) && $_FILES['resume']['error'] === UPLOAD_ERR_OK) {
    $resumeFile = $_FILES['resume'];
    $resumePath = '../uploads/resumes/' . uniqid() . '_' . basename($resumeFile['name']);
    move_uploaded_file($resumeFile['tmp_name'], $resumePath);
    $updatedData['resume_path'] = $resumePath;
}

// Handle photo upload
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $photoFile = $_FILES['photo'];
    $photoPath = '../uploads/photos/' . uniqid() . '_' . basename($photoFile['name']);
    move_uploaded_file($photoFile['tmp_name'], $photoPath);
    $updatedData['photo_path'] = $photoPath;
}

// Update student details in the database
try {
    $query = "UPDATE students SET name = :name, phone = :phone, github = :github, linkedin = :linkedin, cgpa = :cgpa, tenth_percentage = :tenth_percentage, twelfth_percentage = :twelfth_percentage, interest = :interest, grad_year = :grad_year WHERE user_id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'name' => $updatedData['name'],
        'phone' => $updatedData['phone'],
        'github' => $updatedData['github'],
        'linkedin' => $updatedData['linkedin'],
        'cgpa' => $updatedData['cgpa'],
        'tenth_percentage' => $updatedData['tenth_percentage'],
        'twelfth_percentage' => $updatedData['twelfth_percentage'],
        'interest' => $updatedData['interest'],
        'grad_year' => $updatedData['grad_year'],
        'id' => $updatedData['id'],
    ]);

    // Update skills if provided
    if (!empty($updatedData['skills'])) {
        $stmt = $pdo->prepare("DELETE FROM student_skills WHERE student_id = :id");
        $stmt->execute(['id' => $updatedData['id']]);
        foreach ($updatedData['skills'] as $skill) {
            $stmt = $pdo->prepare("INSERT INTO student_skills (student_id, skill) VALUES (:student_id, :skill)");
            $stmt->execute(['student_id' => $updatedData['id'], 'skill' => $skill]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully', 'resume_path' => $updatedData['resume_path'] ?? null, 'photo_path' => $updatedData['photo_path'] ?? null]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error updating profile: ' . $e->getMessage()]);
}
?>
