<?php
header('Content-Type: application/json');
require 'config.php';
session_start();

// Check if user is authorized
if (!isset($_SESSION['user']) || $_SESSION['role'] !== 'company') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = 'uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Get form data (jobData is sent as JSON in the form)
$jobData = json_decode($_POST['jobData'], true);

// Handle file uploads
$files = [
    'job_description_pdf',
    'salary_structure_pdf',
    'leave_policy_pdf',
    'bond_copy',
    'medical_insurance_terms'
];
$jobData['attachments'] = [];

foreach ($files as $fileField) {
    if (isset($_FILES[$fileField]) && $_FILES[$fileField]['error'] === UPLOAD_ERR_OK) {
        // Generate a unique file name to avoid conflicts
        $fileName = uniqid() . '_' . basename($_FILES[$fileField]['name']);
        $filePath = $uploadDir . $fileName;
        
        // Validate file type (only allow PDFs)
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);
        if (strtolower($fileType) !== 'pdf') {
            echo json_encode(['success' => false, 'message' => "Only PDF files are allowed for $fileField."]);
            exit;
        }
        
        // Validate file size (e.g., max 5MB)
        if ($_FILES[$fileField]['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => "File $fileField is too large. Max size is 5MB."]);
            exit;
        }

        // Move the uploaded file to the uploads folder
        if (move_uploaded_file($_FILES[$fileField]['tmp_name'], $filePath)) {
            $jobData['attachments'][$fileField] = $filePath;
        } else {
            echo json_encode(['success' => false, 'message' => "Failed to upload $fileField."]);
            exit;
        }
    }
}

try {
    // Insert job data into the database
    $stmt = $pdo->prepare("
        INSERT INTO jobs (
            id, company_id, company_name, type, posted_date, deadline, title, position, work_type, timings,
            locations, total_openings, skills, description, responsibilities, stipend, duration, start_date,
            fulltime_offer, eligibility_qualification, eligibility_preferred_courses, eligibility_graduation_year,
            eligibility_min_cgpa, salary_total_ctc, salary_breakdown, salary_in_hand_estimate, leaves_total,
            leaves_cl, leaves_sl, leaves_el, leaves_carry_forward, leaves_maternity_paternity,
            leaves_maternity_paternity_days, leaves_holiday_list, benefits_medical_insurance, benefits_coverage_amount,
            benefits_family_included, benefits_wfh, benefits_internet_reimbursement, benefits_laptop_provided,
            benefits_dress_code, benefits_health_checkups, bond_required, bond_duration_value, bond_duration_unit,
            bond_penalty_amount, bond_background_check, bond_probation_period, bond_notice_period, bond_non_compete,
            company_details_registered_address, company_details_hr_name, company_details_hr_designation,
            company_details_hr_email, company_details_branch_locations, attachments_job_description_pdf,
            attachments_salary_structure_pdf, attachments_leave_policy_pdf, attachments_bond_copy,
            attachments_medical_insurance_terms, applicants, selected
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        uniqid(),
        $_SESSION['user']['id'],
        $jobData['companyName'],
        $jobData['type'],
        $jobData['postedDate'],
        $jobData['deadline'],
        $jobData['title'] ?? null,
        $jobData['position'] ?? null,
        $jobData['workType'] ?? null,
        $jobData['timings'] ?? null,
        json_encode($jobData['locations'] ?? []),
        $jobData['totalOpenings'] ?? null,
        json_encode($jobData['skills'] ?? []),
        $jobData['description'] ?? null,
        $jobData['responsibilities'] ?? null,
        $jobData['stipend'] ?? null,
        $jobData['duration'] ?? null,
        $jobData['startDate'] ?? null,
        $jobData['fulltimeOffer'] ?? null,
        $jobData['eligibility']['qualification'] ?? null,
        json_encode($jobData['eligibility']['preferredCourses'] ?? []),
        $jobData['eligibility']['graduationYear'] ?? null,
        $jobData['eligibility']['minCgpa'] ?? null,
        $jobData['salary']['totalCtc'] ?? null,
        json_encode($jobData['salary']['breakdown'] ?? []),
        $jobData['salary']['inHandEstimate'] ?? null,
        $jobData['leaves']['total'] ?? null,
        $jobData['leaves']['cl'] ?? null,
        $jobData['leaves']['sl'] ?? null,
        $jobData['leaves']['el'] ?? null,
        $jobData['leaves']['carryForward'] ?? null,
        $jobData['leaves']['maternityPaternity'] ?? null,
        $jobData['leaves']['maternityPaternityDays'] ?? null,
        $jobData['leaves']['holidayList'] ?? null,
        $jobData['benefits']['medicalInsurance'] ?? null,
        $jobData['benefits']['coverageAmount'] ?? null,
        $jobData['benefits']['familyIncluded'] ?? null,
        $jobData['benefits']['wfh'] ?? null,
        $jobData['benefits']['internetReimbursement'] ?? null,
        $jobData['benefits']['laptopProvided'] ?? null,
        $jobData['benefits']['dressCode'] ?? null,
        $jobData['benefits']['healthCheckups'] ?? null,
        $jobData['bond']['required'] ?? null,
        $jobData['bond']['durationValue'] ?? null,
        $jobData['bond']['durationUnit'] ?? null,
        $jobData['bond']['penaltyAmount'] ?? null,
        $jobData['bond']['backgroundCheck'] ?? null,
        $jobData['bond']['probationPeriod'] ?? null,
        $jobData['bond']['noticePeriod'] ?? null,
        $jobData['bond']['nonCompete'] ?? null,
        $jobData['companyDetails']['registeredAddress'] ?? null,
        $jobData['companyDetails']['hrContactPersonName'] ?? null,
        $jobData['companyDetails']['hrDesignation'] ?? null,
        $jobData['companyDetails']['hrEmail'] ?? null,
        json_encode($jobData['companyDetails']['branchLocations'] ?? []),
        $jobData['attachments']['job_description_pdf'] ?? null,
        $jobData['attachments']['salary_structure_pdf'] ?? null,
        $jobData['attachments']['leave_policy_pdf'] ?? null,
        $jobData['attachments']['bond_copy'] ?? null,
        $jobData['attachments']['medical_insurance_terms'] ?? null,
        json_encode([]),
        json_encode([])
    ]);

    echo json_encode(['success' => true, 'message' => 'Job posted successfully!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>