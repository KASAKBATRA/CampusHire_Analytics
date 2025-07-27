<?php
session_start();
header('Content-Type: application/json');
include '../config/db_connect.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'company') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Decode JSON data from frontend
$data = json_decode(file_get_contents('php://input'), true);
$company_id = $_SESSION['user_id'];
$job_type = $data['type'] ?? '';

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
        'medical_insurance_terms'
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

    // Prepare data for database insertion, including uploaded files
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
        'title' => $data['title'] ?? null,
        'position' => $data['position'] ?? null,
        'domain' => $data['domain'] ?? null,
        'openings' => $data['openings'] ?? null,
        'duration' => $data['duration'] ?? null,
        'start_date' => $data['start_date'] ?? null,
        'stipend' => $data['stipend'] ?? null,
        'fulltime_offer' => $data['fulltime_offer'] ?? null,
        'work_type' => $data['work_type'] ?? null,
        'timings' => $data['timings'] ?? null,
        'locations' => json_encode($data['locations'] ?? []),
        'skills' => json_encode($data['skills'] ?? []),
        'description' => $data['description'] ?? null,
        'responsibilities' => $data['responsibilities'] ?? null,
        'eligibility_qualification' => $data['eligibility']['qualification'] ?? null,
        'eligibility_courses' => json_encode($data['eligibility']['preferredCourses'] ?? []),
        'eligibility_grad_year' => $data['eligibility']['graduationYear'] ?? null,
        'eligibility_min_cgpa' => $data['eligibility']['minCgpa'] ?? null,
        'salary_ctc' => $data['salary']['totalCtc'] ?? null,
        'salary_breakdown' => json_encode($data['salary']['breakdown'] ?? []),
        'leaves_total' => $data['leaves']['total'] ?? null,
        'leaves_cl' => $data['leaves']['cl'] ?? null,
        'leaves_sl' => $data['leaves']['sl'] ?? null,
        'leaves_el' => $data['leaves']['el'] ?? null,
        'leaves_carry_forward' => $data['leaves']['carryForward'] ?? null,
        'leaves_maternity_paternity' => $data['leaves']['maternityPaternity'] ?? null,
        'leaves_maternity_days' => $data['leaves']['maternityPaternityDays'] ?? null,
        'holiday_list_path' => $data['leaves']['holidayList'] ?? null,
        'benefits_medical_insurance' => $data['benefits']['medicalInsurance'] ?? null,
        'benefits_coverage_amount' => $data['benefits']['coverageAmount'] ?? null,
        'benefits_family_included' => $data['benefits']['familyIncluded'] ?? null,
        'benefits_wfh' => $data['benefits']['wfh'] ?? null,
        'benefits_internet' => $data['benefits']['internetReimbursement'] ?? null,
        'benefits_laptop' => $data['benefits']['laptopProvided'] ?? null,
        'benefits_dress_code' => $data['benefits']['dressCode'] ?? null,
        'benefits_health_checkups' => $data['benefits']['healthCheckups'] ?? null,
        'bond_required' => $data['bond']['required'] ?? null,
        'bond_duration_value' => $data['bond']['durationValue'] ?? null,
        'bond_duration_unit' => $data['bond']['durationUnit'] ?? null,
        'bond_penalty_amount' => $data['bond']['penaltyAmount'] ?? null,
        'bond_background_check' => $data['bond']['backgroundCheck'] ?? null,
        'bond_probation_period' => $data['bond']['probationPeriod'] ?? null,
        'bond_notice_period' => $data['bond']['noticePeriod'] ?? null,
        'bond_non_compete' => $data['bond']['nonCompete'] ?? null,
        'company_address' => $data['companyDetails']['registeredAddress'] ?? null,
        'hr_contact_name' => $data['companyDetails']['hrContactPersonName'] ?? null,
        'hr_designation' => $data['companyDetails']['hrDesignation'] ?? null,
        'hr_email' => $data['companyDetails']['hrEmail'] ?? null,
        'branch_locations' => json_encode($data['companyDetails']['branchLocations'] ?? []),
        'job_description_pdf' => $uploaded_files['job_description_pdf'] ?? null,
        'salary_structure_pdf' => $uploaded_files['salary_structure_pdf'] ?? null,
        'leave_policy_pdf' => $uploaded_files['leave_policy_pdf'] ?? null,
        'bond_copy' => $uploaded_files['bond_copy'] ?? null,
        'medical_insurance_terms' => $uploaded_files['medical_insurance_terms'] ?? null,
        'growth_opportunities' => $data['bonus']['growthOpportunities'] ?? null,
        'travel_requirements' => $data['bonus']['travelRequirements'] ?? null,
        'id_email_setup_timeline' => $data['bonus']['idEmailSetupTimeline'] ?? null,
        'onboarding_process' => $data['bonus']['onboardingProcess'] ?? null,
        'posted_date' => date('Y-m-d'),
        'deadline' => $data['deadline']
    ]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Job posted successfully']);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error posting job: ' . $e->getMessage()]);
}
?>