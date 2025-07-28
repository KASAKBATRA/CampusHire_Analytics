<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'company') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Removed JSON decode from php://input
$user_id = $_SESSION['user_id'];
// Fetch company id from companies table using user_id
$stmt = $pdo->prepare("SELECT id FROM companies WHERE user_id = :user_id");
$stmt->execute(['user_id' => $user_id]);
$company = $stmt->fetch(PDO::FETCH_ASSOC);
$company_id = $company ? $company['id'] : null;

if (!$company_id) {
    echo json_encode(['success' => false, 'message' => 'Company not found']);
    exit;
}
$job_type = $_POST['type'] ?? '';

if (!$job_type) {
    echo json_encode(['success' => false, 'message' => 'Opportunity type is required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Set up upload directory
    $upload_dir = '../uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    // Handle file uploads
    $attachment_fields = [
        'job_description_pdf',
        'salary_structure_pdf',
        'leave_policy_pdf',
        'bond_copy',
        'medical_insurance_terms',
        'holiday_list_path'
    ];
    $uploaded_files = [];

    foreach ($attachment_fields as $field) {
        if (isset($_FILES[$field]) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
            $file_ext = strtolower(pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION));
            $allowed_exts = ['pdf'];
            if (!in_array($file_ext, $allowed_exts)) {
                throw new Exception("Only PDF files are allowed for $field");
            }

            $file_name = uniqid() . '_' . basename($_FILES[$field]['name']);
            $file_path = $upload_dir . $file_name;
            if (move_uploaded_file($_FILES[$field]['tmp_name'], $file_path)) {
                $uploaded_files[$field] = $file_path;
            } else {
                throw new Exception("Failed to upload $field");
            }
        }
    }

    // Decode nested JSON fields from $_POST
    $locations = isset($_POST['locations']) ? json_decode($_POST['locations'], true) : [];
    $skills = isset($_POST['skills']) ? json_decode($_POST['skills'], true) : [];
    $eligibility = isset($_POST['eligibility']) ? json_decode($_POST['eligibility'], true) : [];
    $salary_breakdown = isset($_POST['salary_breakdown']) ? json_decode($_POST['salary_breakdown'], true) : [];
    $branch_locations = isset($_POST['branch_locations']) ? json_decode($_POST['branch_locations'], true) : [];
    $bonus = isset($_POST['bonus']) ? json_decode($_POST['bonus'], true) : [];
    $companyDetails = isset($_POST['companyDetails']) ? json_decode($_POST['companyDetails'], true) : [];

    $leaves_carry_forward = $_POST['leaves_carry_forward'] ?? null;
    $benefits_family_included = $_POST['benefits_family_included'] ?? null;

    $query = "INSERT INTO jobs (
        company_id, type, title, position, domain, openings, duration, start_date, stipend, fulltime_offer,
        work_type, timings, locations, skills, description, responsibilities, eligibility_qualification,
        eligibility_courses, eligibility_grad_year, eligibility_min_cgpa, salary_ctc, salary_breakdown,
        leaves_total, leaves_cl, leaves_sl, leaves_el, leaves_carry_forward, leaves_maternity_paternity,
        leaves_maternity_days, holiday_list_path, benefits_medical_insurance, benefits_coverage_amount,
        benefits_family_included, benefits_wfh, benefits_internet, benefits_laptop, benefits_dress_code,
        benefits_health_checkups, bond_required, bond_duration_value, bond_duration_unit, bond_penalty_amount,
        bond_background_check, bond_probation_period, bond_notice_period, bond_non_compete, company_address,
        hr_contact_name, hr_designation, hr_email, branch_locations, job_description_pdf, salary_structure_pdf,
        leave_policy_pdf, bond_copy, medical_insurance_terms, growth_opportunities, travel_requirements,
        id_email_setup_timeline, onboarding_process, posted_date, deadline
    ) VALUES (
        :company_id, :type, :title, :position, :domain, :openings, :duration, :start_date, :stipend, :fulltime_offer,
        :work_type, :timings, :locations, :skills, :description, :responsibilities, :eligibility_qualification,
        :eligibility_courses, :eligibility_grad_year, :eligibility_min_cgpa, :salary_ctc, :salary_breakdown,
        :leaves_total, :leaves_cl, :leaves_sl, :leaves_el, :leaves_carry_forward, :leaves_maternity_paternity,
        :leaves_maternity_days, :holiday_list_path, :benefits_medical_insurance, :benefits_coverage_amount,
        :benefits_family_included, :benefits_wfh, :benefits_internet, :benefits_laptop, :benefits_dress_code,
        :benefits_health_checkups, :bond_required, :bond_duration_value, :bond_duration_unit, :bond_penalty_amount,
        :bond_background_check, :bond_probation_period, :bond_notice_period, :bond_non_compete, :company_address,
        :hr_contact_name, :hr_designation, :hr_email, :branch_locations, :job_description_pdf, :salary_structure_pdf,
        :leave_policy_pdf, :bond_copy, :medical_insurance_terms, :growth_opportunities, :travel_requirements,
        :id_email_setup_timeline, :onboarding_process, :posted_date, :deadline
    )";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'company_id' => $company_id,
        'type' => $job_type,
        'title' => $_POST['title'] ?? null,
        'position' => $_POST['position'] ?? null,
        'domain' => $_POST['domain'] ?? null,
        'openings' => $_POST['openings'] ?? null,
        'duration' => $_POST['duration'] ?? null,
        'start_date' => $_POST['start_date'] ?? null,
        'stipend' => $_POST['stipend'] ?? null,
        'fulltime_offer' => $_POST['fulltime_offer'] ?? null,
        'work_type' => $_POST['work_type'] ?? null,
        'timings' => $_POST['timings'] ?? null,
        'locations' => json_encode($locations),
        'skills' => json_encode($skills),
        'description' => $_POST['description'] ?? null,
        'responsibilities' => $_POST['responsibilities'] ?? null,
        'eligibility_qualification' => $eligibility['qualification'] ?? null,
        'eligibility_courses' => json_encode($eligibility['preferredCourses'] ?? []),
        'eligibility_grad_year' => $eligibility['graduationYear'] ?? null,
        'eligibility_min_cgpa' => $eligibility['minCgpa'] ?? null,
        'salary_ctc' => $_POST['salary_ctc'] ?? null,
        'salary_breakdown' => json_encode($salary_breakdown),
        'leaves_total' => $_POST['leaves_total'] ?? null,
        'leaves_cl' => $_POST['leaves_cl'] ?? null,
        'leaves_sl' => $_POST['leaves_sl'] ?? null,
        'leaves_el' => $_POST['leaves_el'] ?? null,
        'leaves_carry_forward' => $leaves_carry_forward,
        'leaves_maternity_paternity' => $_POST['leaves_maternity_paternity'] ?? null,
        'leaves_maternity_days' => $_POST['leaves_maternity_days'] ?? null,
        'holiday_list_path' => $uploaded_files['holiday_list_path'] ?? null,
        'benefits_medical_insurance' => $_POST['benefits_medical_insurance'] ?? null,
        'benefits_coverage_amount' => $_POST['benefits_coverage_amount'] ?? null,
        'benefits_family_included' => $benefits_family_included,
        'benefits_wfh' => $_POST['benefits_wfh'] ?? null,
        'benefits_internet' => $_POST['benefits_internet'] ?? null,
        'benefits_laptop' => $_POST['benefits_laptop'] ?? null,
        'benefits_dress_code' => $_POST['benefits_dress_code'] ?? null,
        'benefits_health_checkups' => $_POST['benefits_health_checkups'] ?? null,
        'bond_required' => $_POST['bond_required'] ?? null,
        'bond_duration_value' => $_POST['bond_duration_value'] ?? null,
        'bond_duration_unit' => $_POST['bond_duration_unit'] ?? null,
        'bond_penalty_amount' => $_POST['bond_penalty_amount'] ?? null,
        'bond_background_check' => $_POST['bond_background_check'] ?? null,
        'bond_probation_period' => $_POST['bond_probation_period'] ?? null,
        'bond_notice_period' => $_POST['bond_notice_period'] ?? null,
        'bond_non_compete' => $_POST['bond_non_compete'] ?? null,
        'company_address' => $companyDetails['registeredAddress'] ?? null,
        'hr_contact_name' => $companyDetails['hrContactPersonName'] ?? null,
        'hr_designation' => $companyDetails['hrDesignation'] ?? null,
        'hr_email' => $companyDetails['hrEmail'] ?? null,
        'branch_locations' => json_encode($branch_locations),
        'job_description_pdf' => $uploaded_files['job_description_pdf'] ?? null,
        'salary_structure_pdf' => $uploaded_files['salary_structure_pdf'] ?? null,
        'leave_policy_pdf' => $uploaded_files['leave_policy_pdf'] ?? null,
        'bond_copy' => $uploaded_files['bond_copy'] ?? null,
        'medical_insurance_terms' => $uploaded_files['medical_insurance_terms'] ?? null,
        'growth_opportunities' => $bonus['growthOpportunities'] ?? null,
        'travel_requirements' => $bonus['travelRequirements'] ?? null,
        'id_email_setup_timeline' => $bonus['idEmailSetupTimeline'] ?? null,
        'onboarding_process' => $bonus['onboardingProcess'] ?? null,
        'posted_date' => date('Y-m-d'),
        'deadline' => $_POST['deadline'] ?? null
    ]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Job posted successfully']);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error posting job: ' . $e->getMessage()]);
}
?>
