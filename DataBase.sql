CREATE DATABASE campushire;
USE campushire;

-- Users Table (common for students, T&P, and companies)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('student', 'tnp', 'company') NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    login_code VARCHAR(10),
    status ENUM('pending', 'verified', 'blocked') DEFAULT 'pending',
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    course VARCHAR(50),
    department VARCHAR(100),
    year INT,
    cgpa FLOAT,
    github VARCHAR(255),
    linkedin VARCHAR(255),
    tenth_percentage FLOAT,
    twelfth_percentage FLOAT,
    interest VARCHAR(255),
    grad_year INT,
    resume_path VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- T&P Officers Table
CREATE TABLE tnp_officers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    employee_id VARCHAR(50) UNIQUE,
    position VARCHAR(100),
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Companies Table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    company_name VARCHAR(255),
    hr_id VARCHAR(50) UNIQUE,
    hr_name VARCHAR(255),
    industry VARCHAR(100),
    website VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Jobs Table
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    type ENUM('job', 'internship') NOT NULL,
    title VARCHAR(255),
    position VARCHAR(255),
    domain VARCHAR(255),
    openings INT,
    duration VARCHAR(50),
    start_date DATE,
    stipend FLOAT,
    fulltime_offer ENUM('yes', 'no'),
    work_type VARCHAR(50),
    timings VARCHAR(100),
    locations TEXT,
    skills TEXT,
    description TEXT,
    responsibilities TEXT,
    eligibility_qualification VARCHAR(255),
    eligibility_courses TEXT,
    eligibility_grad_year INT,
    eligibility_min_cgpa FLOAT,
    salary_ctc FLOAT,
    salary_breakdown TEXT,
    leaves_total INT,
    leaves_cl INT,
    leaves_sl INT,
    leaves_el INT,
    leaves_carry_forward ENUM('yes', 'no'),
    leaves_maternity_paternity ENUM('yes', 'no'),
    leaves_maternity_days INT,
    holiday_list_path VARCHAR(255),
    benefits_medical_insurance ENUM('yes', 'no'),
    benefits_coverage_amount FLOAT,
    benefits_family_included ENUM('yes', 'no'),
    benefits_wfh ENUM('yes', 'no'),
    benefits_internet ENUM('yes', 'no'),
    benefits_laptop ENUM('yes', 'no'),
    benefits_dress_code VARCHAR(255),
    benefits_health_checkups ENUM('yes', 'no'),
    bond_required ENUM('yes', 'no'),
    bond_duration_value INT,
    bond_duration_unit VARCHAR(50),
    bond_penalty_amount FLOAT,
    bond_background_check ENUM('yes', 'no'),
    bond_probation_period INT,
    bond_notice_period INT,
    bond_non_compete ENUM('yes', 'no'),
    company_address VARCHAR(255),
    hr_contact_name VARCHAR(255),
    hr_designation VARCHAR(255),
    hr_email VARCHAR(255),
    branch_locations TEXT,
    job_description_pdf VARCHAR(255),
    salary_structure_pdf VARCHAR(255),
    leave_policy_pdf VARCHAR(255),
    bond_copy VARCHAR(255),
    medical_insurance_terms VARCHAR(255),
    growth_opportunities TEXT,
    travel_requirements TEXT,
    id_email_setup_timeline VARCHAR(255),
    onboarding_process TEXT,
    posted_date DATE,
    deadline DATE,
    FOREIGN KEY (company_id) REFERENCES users(id)
);

-- Applications Table
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    job_id INT,
    cover_letter TEXT,
    applied_date DATE,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Student Skills Table (for many-to-many relationship)
CREATE TABLE student_skills (
    student_id INT,
    skill VARCHAR(100),
    PRIMARY KEY (student_id, skill),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Semester CGPA Table
CREATE TABLE semester_cgpa (
    student_id INT,
    semester INT,
    cgpa FLOAT,
    PRIMARY KEY (student_id, semester),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Placements Table
CREATE TABLE placements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    company_id INT,
    position VARCHAR(255),
    package FLOAT,
    placement_date DATE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES users(id)
);

DROP TABLE IF EXISTS semester_cgpa;

ALTER TABLE students ADD COLUMN photo_path VARCHAR(255);