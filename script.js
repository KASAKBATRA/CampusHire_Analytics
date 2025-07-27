const AppState = {
    currentUser: null,
    students: [],
    companies: [],
    tnpOfficers: [], // This array is not populated by PHP, consider if needed
    jobs: [],
    applications: [],

    async init() {
        // Fetch current user from session
        try {
            const response = await fetch('api/get_current_user.php');
            const result = await response.json();
            if (result.success) {
                this.currentUser = result.user;
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    }
};

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    AppState.currentPage = pageId;

    if (pageId === 'student-dashboard') loadStudentDashboard();
    else if (pageId === 'tnp-dashboard') loadTnpDashboard();
    else if (pageId === 'company-dashboard') loadCompanyDashboard();
    // student-profile-edit-page is handled by editStudentProfile() directly
}

function showModal(modalId) {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'register-modal') {
        document.getElementById('register-form').reset();
        document.querySelectorAll('.role-fields').forEach(field => field.classList.remove('active'));
    }
    if (modalId === 'login-modal') {
        document.getElementById('login-form').reset();
        document.getElementById('login-message').innerHTML = '';
    }
    if (modalId === 'job-form-modal') {
        document.getElementById('job-form').reset();
        jobRequiredSkills = [];
        renderJobSkills();
        resetCollapsibleSections();
        customComponentCount = 0;
        document.querySelectorAll('.custom-salary-component-row').forEach(row => row.remove());
        calculateInHandSalary();
        toggleOpportunityType(); // Reset sections visibility
    }
}

function selectRole(role) {
    document.getElementById('register-role').value = role;
    showRoleFields();
    closeModal('role-modal');
    showModal('register-modal');
}

function selectLoginRole(role) {
    document.getElementById('login-role').value = role;
    const emailGroup = document.getElementById('login-email-group');
    const codeGroup = document.getElementById('login-code-group');

    if (role === 'tnp') {
        emailGroup.style.display = 'block';
        codeGroup.style.display = 'none';
        document.getElementById('login-email').required = true;
        document.getElementById('login-code').required = false;
    } else {
        emailGroup.style.display = 'none';
        codeGroup.style.display = 'block';
        document.getElementById('login-email').required = false;
        document.getElementById('login-code').required = true;
    }

    closeModal('login-role-modal');
    showModal('login-modal');
}


function showRoleFields() {
    const role = document.getElementById('register-role').value;
    document.querySelectorAll('.role-fields').forEach(field => {
        field.classList.remove('active');
        field.querySelectorAll('input, select').forEach(el => el.disabled = true);
    });
    if (role) {
        const activeFields = document.getElementById(`${role}-fields`);
        activeFields.classList.add('active');
        activeFields.querySelectorAll('input, select').forEach(el => el.disabled = false);
    }
}

function showLogin() {
    showModal('login-role-modal');
}

function showRegister() {
    showModal('role-modal');
}

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const role = document.getElementById('login-role').value;
    const identifier = role === 'tnp' ? document.getElementById('login-email').value.trim() : document.getElementById('login-code').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password, role })
        });
        const result = await response.json();

        if (result.success) {
            AppState.currentUser = result.user;
            closeModal('login-modal');
            if (role === 'student') {
                if (!result.user.profile_completed) {
                    showPage('student-profile-edit-page');
                } else {
                    showPage('student-dashboard');
                }
            } else if (role === 'tnp') {
                showPage('tnp-dashboard');
            } else if (role === 'company') {
                showPage('company-dashboard');
            }
        } else {
            showError(result.message, 'login-message');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.', 'login-message');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});


document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const userData = {
        name: document.getElementById('register-name').value.trim(),
        email: document.getElementById('register-email').value.trim(),
        phone: document.getElementById('register-phone').value.trim(),
        password: document.getElementById('register-password').value.trim(),
        role: document.getElementById('register-role').value
    };

    if (userData.role === 'student') {
        userData.course = document.getElementById('register-course').value;
    } else if (userData.role === 'tnp') {
        userData.employeeId = document.getElementById('register-employee-id').value.trim();
        userData.position = document.getElementById('register-position').value;
        userData.department = document.getElementById('register-department-tnp').value;
        userData.phone = document.getElementById('register-phone-tnp').value.trim(); // Use T&P specific phone field
    } else if (userData.role === 'company') {
        userData.hrId = document.getElementById('register-hr-id').value.trim();
        userData.companyName = document.getElementById('register-company-name').value.trim();
        userData.industry = document.getElementById('register-industry').value.trim();
        userData.website = document.getElementById('register-website').value.trim();
    }

    try {
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();

        if (result.success) {
            showSuccess(result.message, 'register-message');
            // closeModal('register-modal'); // Keep modal open to show success message
            // showLogin(); // Don't immediately show login, let user read message
            this.reset();
            document.querySelectorAll('.role-fields').forEach(field => field.classList.remove('active'));
            setTimeout(() => closeModal('register-modal'), 2000); // Close after 2 seconds
        } else {
            showError(result.message, 'register-message');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred. Please try again.', 'register-message');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});



function showSuccess(message, targetId = 'register-message') {
    const msgDiv = document.getElementById(targetId);
    if (msgDiv) {
        msgDiv.innerHTML = `<div class="success-message">${message}</div>`;
        // setTimeout(() => { msgDiv.innerHTML = ''; }, 3000); // Removed to allow message to stay
    } else {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.body.insertBefore(successDiv, document.body.firstChild);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

function showError(message, targetId = 'register-message') {
    const msgDiv = document.getElementById(targetId);
    if (msgDiv) {
        msgDiv.innerHTML = `<div class="error-message">${message}</div>`;
        // setTimeout(() => { msgDiv.innerHTML = ''; }, 3000); // Removed to allow message to stay
    } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

async function logout() {
    try {
        const response = await fetch('api/logout.php');
        const result = await response.json();
        if (result.success) {
            AppState.currentUser = null;
            showPage('landing-page');
            showSuccess('Logged out successfully!');
        } else {
            showError('Logout failed.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showError('An error occurred during logout.');
    }
}

async function loadStudentDashboard() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'student') {
        showPage('landing-page');
        return;
    }

    try {
        const studentsResponse = await fetch('api/students.php');
        const studentsResult = await studentsResponse.json();
        if (studentsResult.success) {
            AppState.students = studentsResult.data;
            // Update current user with full student details from the fetched list
            AppState.currentUser = AppState.students.find(s => s.id === AppState.currentUser.id) || AppState.currentUser;
        }

        const jobsResponse = await fetch('api/jobs.php');
        const jobsResult = await jobsResponse.json();
        if (jobsResult.success) {
            AppState.jobs = jobsResult.data;
        }

        const applicationsResponse = await fetch('api/applications.php');
        const applicationsResult = await applicationsResponse.json();
        if (applicationsResult.success) {
            AppState.applications = applicationsResult.data;
        }
        showStudentSection('profile');
    } catch (error) {
        console.error('Error loading student dashboard:', error);
        showError('An error occurred while loading the dashboard.');
    }
}

async function loadTnpDashboard() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'tnp') {
        showPage('landing-page');
        return;
    }

    try {
        const studentsResponse = await fetch('api/students.php');
        const studentsResult = await studentsResponse.json();
        if (studentsResult.success) {
            AppState.students = studentsResult.data;
        }

        const companiesResponse = await fetch('api/companies.php');
        const companiesResult = await companiesResponse.json();
        if (companiesResult.success) {
            AppState.companies = companiesResult.data;
        }

        const jobsResponse = await fetch('api/jobs.php');
        const jobsResult = await jobsResponse.json();
        if (jobsResult.success) {
            AppState.jobs = jobsResult.data;
        }

        const applicationsResponse = await fetch('api/applications.php');
        const applicationsResult = await applicationsResponse.json();
        if (applicationsResult.success) {
            AppState.applications = applicationsResult.data;
        }

        showTnpSection('profile');
    } catch (error) {
        console.error('Error loading T&P dashboard:', error);
        showError('An error occurred while loading the dashboard.');
    }
}

async function loadCompanyDashboard() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'company') {
        showPage('landing-page');
        return;
    }

    try {
        const jobsResponse = await fetch('api/jobs.php');
        const jobsResult = await jobsResponse.json();
        if (jobsResult.success) {
            AppState.jobs = jobsResult.data;
        }

        const applicationsResponse = await fetch('api/applications.php');
        const applicationsResult = await applicationsResponse.json();
        if (applicationsResult.success) {
            AppState.applications = applicationsResult.data;
        }

        const studentsResponse = await fetch('api/students.php');
        const studentsResult = await studentsResponse.json();
        if (studentsResult.success) {
            AppState.students = studentsResult.data;
        }

        showCompanySection('profile');
    } catch (error) {
        console.error('Error loading company dashboard:', error);
        showError('An error occurred while loading the dashboard.');
    }
}

function showStudentSection(section) {
    document.querySelectorAll('#student-dashboard .dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#student-dashboard .nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`student-${section}`).classList.add('active');
    document.querySelector(`#student-dashboard .nav-btn[onclick*="showStudentSection('${section}')"]`).classList.add('active');

    if (section === 'profile') loadStudentProfile();
    else if (section === 'jobs') loadStudentJobs();
    else if (section === 'applications') loadStudentApplications();
}

function loadStudentProfile() {
    const student = AppState.currentUser;
    document.getElementById('student-name').textContent = student.name;
    document.getElementById('student-email').textContent = student.email;
    document.getElementById('student-course').textContent = `Course: ${student.course || 'N/A'}`;
    document.getElementById('student-department').textContent = `Department: ${student.department || 'N/A'}`;
    document.getElementById('student-year').textContent = `Year: ${student.year || 'N/A'}`;
    document.getElementById('student-cgpa').textContent = `CGPA: ${student.cgpa || 'N/A'}`;
    document.getElementById('student-phone').textContent = `Phone: ${student.phone || '-'}`;

    const skillsDropdown = document.getElementById('student-skills-dropdown');
    if (skillsDropdown && student.skills) {
        Array.from(skillsDropdown.options).forEach(option => {
            option.selected = student.skills.includes(option.value);
        });
    }

    const applications = AppState.applications.filter(a => a.student_id === student.id);
    document.getElementById('applications-count').textContent = applications.length;
    document.getElementById('interviews-count').textContent = applications.filter(a => a.status === 'accepted').length;
    document.getElementById('offers-count').textContent = student.placement ? 1 : 0;
}

function editStudentProfile() {
    const student = AppState.currentUser;
    if (!student || student.role !== 'student') {
        showError('Error: No student logged in.');
        return;
    }

    document.getElementById('edit-student-name').value = student.name || '';
    document.getElementById('edit-student-phone').value = student.phone || '';
    document.getElementById('edit-student-github').value = student.github || '';
    document.getElementById('edit-student-linkedin').value = student.linkedin || ''; // Corrected field name
    document.getElementById('edit-student-overall-cgpa').value = student.cgpa || '';
    document.getElementById('edit-student-10th').value = student.tenth_percentage || ''; // Corrected field name
    document.getElementById('edit-student-12th').value = student.twelfth_percentage || ''; // Corrected field name
    document.getElementById('edit-student-interest').value = student.interest || '';
    document.getElementById('edit-student-grad-year').value = student.grad_year || ''; // Corrected field name

    const skillsSelect = document.getElementById('edit-student-skills');
    const selectedSkillsDisplay = document.getElementById('selected-skills-display');
    selectedSkillsDisplay.innerHTML = '';

    Array.from(skillsSelect.options).forEach(option => {
        option.selected = false;
    });

    if (student.skills && student.skills.length > 0) {
        student.skills.forEach(skill => {
            const option = Array.from(skillsSelect.options).find(opt => opt.value === skill);
            if (option) {
                option.selected = true;
            }
            const skillTag = document.createElement('span');
            skillTag.className = 'skill-tag';
            skillTag.textContent = skill;
            selectedSkillsDisplay.appendChild(skillTag);
        });
    }

    const addCustomSkillBtn = document.getElementById('add-custom-skill-btn');
    const customSkillInput = document.getElementById('edit-student-custom-skill');

    // Remove previous event listener to prevent multiple bindings
    if (addCustomSkillBtn._handler) {
        addCustomSkillBtn.removeEventListener('click', addCustomSkillBtn._handler);
    }

    const newAddCustomSkillBtnHandler = () => {
        const customSkill = customSkillInput.value.trim();
        if (customSkill && !student.skills.includes(customSkill)) {
            student.skills.push(customSkill);
            const skillTag = document.createElement('span');
            skillTag.className = 'skill-tag';
            skillTag.textContent = customSkill;
            selectedSkillsDisplay.appendChild(skillTag);
            customSkillInput.value = '';
        } else if (student.skills.includes(customSkill)) {
            showError('Skill already added.');
        }
    };
    addCustomSkillBtn.addEventListener('click', newAddCustomSkillBtnHandler);
    addCustomSkillBtn._handler = newAddCustomSkillBtnHandler; // Store reference to handler

    const semesterContainer = document.getElementById('semester-cgpa-container');
    semesterContainer.innerHTML = '';
    const semesters = student.cgpaSemesters || {}; // cgpaSemesters is an object from PHP
    const maxSemesters = (student.year || 1) * 2; // Assuming max 2 semesters per year

    for (let i = 1; i <= maxSemesters; i++) {
        const semesterCgpa = semesters[i] || ''; // Get CGPA for current semester
        semesterContainer.innerHTML += `
            <div class="form-group">
                <label for="edit-semester-${i}">Semester ${i}</label>
                <input type="number" step="0.1" min="0" max="10" id="edit-semester-${i}" value="${semesterCgpa}" required>
            </div>
        `;
    }

    const resumeInput = document.getElementById('edit-student-resume');
    const resumePreview = document.getElementById('resume-preview');
    resumePreview.textContent = student.resume_path ? `Current resume: ${student.resume_path.split('/').pop()}` : 'No resume uploaded'; // Corrected field name

    // Remove previous event listener to prevent multiple bindings
    if (resumeInput._handler) {
        resumeInput.removeEventListener('change', resumeInput._handler);
    }

    const newResumeInputHandler = function() {
        resumePreview.textContent = this.files[0] ? `Selected: ${this.files[0].name}` : 'No file selected';
    };
    resumeInput.addEventListener('change', newResumeInputHandler);
    resumeInput._handler = newResumeInputHandler; // Store reference to handler

    showPage('student-profile-edit-page'); // Show the edit page
}

document.getElementById('student-profile-edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    if (!confirm('Are you sure you want to save these changes?')) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    const currentUser = AppState.currentUser;

    // Collect updated data
    const updatedData = {
        id: currentUser.id,
        name: document.getElementById('edit-student-name').value.trim(),
        phone: document.getElementById('edit-student-phone').value.trim(),
        github: document.getElementById('edit-student-github').value.trim(),
        linkedin: document.getElementById('edit-student-linkedin').value.trim(), // Corrected field name
        cgpa: parseFloat(document.getElementById('edit-student-overall-cgpa').value) || 0,
        tenth_percentage: parseFloat(document.getElementById('edit-student-10th').value) || 0, // Corrected field name
        twelfth_percentage: parseFloat(document.getElementById('edit-student-12th').value) || 0, // Corrected field name
        interest: document.getElementById('edit-student-interest').value.trim(),
        grad_year: parseInt(document.getElementById('edit-student-grad-year').value) || 0, // Corrected field name
    };

    const selectedDropdownSkills = Array.from(document.getElementById('edit-student-skills').selectedOptions).map(opt => opt.value);
    const currentCustomSkills = Array.from(document.getElementById('selected-skills-display').children)
                                .map(tag => tag.textContent.replace(' ×', '').trim()); // Assuming '×' is added for removal
    updatedData.skills = [...new Set([...selectedDropdownSkills, ...currentCustomSkills])];

    if (!updatedData.name || !updatedData.phone || !updatedData.github || !updatedData.linkedin || !updatedData.cgpa || !updatedData.tenth_percentage || !updatedData.twelfth_percentage || !updatedData.interest || !updatedData.grad_year || updatedData.skills.length === 0) {
        showError('Please fill in all required fields.');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    if (!/^\+[0-9]{1,3}[0-9]{10}$/.test(updatedData.phone)) {
        showError('Phone number must include country code (e.g., +919876543210).');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    updatedData.cgpaSemesters = {}; // Initialize as an object
    const maxSemesters = (currentUser.year || 1) * 2;
    for (let i = 1; i <= maxSemesters; i++) {
        const inputElement = document.getElementById(`edit-semester-${i}`);
        const value = parseFloat(inputElement.value) || 0;
        if (value <= 0 || value > 10) {
            showError(`Invalid CGPA for Semester ${i}. Must be between 0 and 10.`);
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }
        updatedData.cgpaSemesters[i] = value; // Store as key-value pair
    }

    const resumeInput = document.getElementById('edit-student-resume');
    const file = resumeInput.files[0];
    let resume_path = currentUser.resume_path; // Keep existing path if no new file

    const formData = new FormData();
    for (const key in updatedData) {
        if (key === 'skills') {
            formData.append(key, JSON.stringify(updatedData[key]));
        } else if (key === 'cgpaSemesters') {
            formData.append(key, JSON.stringify(updatedData[key]));
        } else {
            formData.append(key, updatedData[key]);
        }
    }

    if (file) {
        if (file.type !== 'application/pdf') {
            showError('Please upload a valid PDF file for the resume.');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }
        formData.append('resume', file); // Append the file
    }

    try {
        // Assuming you have an API endpoint for updating student profiles
        const response = await fetch('api/update_student_profile.php', { // You need to create this PHP file
            method: 'POST',
            body: formData // FormData handles Content-Type automatically
        });
        const result = await response.json();

        if (result.success) {
            // Update AppState.currentUser with the new data from the server response
            AppState.currentUser = { ...AppState.currentUser, ...updatedData, profile_completed: true, resume_path: result.resume_path || resume_path };
            // Refresh the student list in AppState if needed for other dashboards
            await loadStudentDashboard(); // Reload dashboard data to reflect changes
            showPage('student-dashboard');
            showSuccess('Profile updated successfully!');
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('An error occurred while updating the profile. Please try again.');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});

function toggleSemesterSection() {
    const section = document.getElementById('semester-section');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

function loadStudentJobs() {
    const student = AppState.currentUser;
    const jobType = document.getElementById('job-filter').value;
    const department = document.getElementById('department-filter').value;

    const jobs = AppState.jobs.filter(job => {
        // Check if job.eligibility_courses is an array before using .includes()
        const jobEligibilityCourses = Array.isArray(job.eligibility_courses) ? job.eligibility_courses : [];
        const isEligible = jobEligibilityCourses.includes(student.course) &&
                           (student.cgpa >= (job.eligibility_min_cgpa || 0)); // Use 0 if min_cgpa is not set

        const matchesType = !jobType || job.type === jobType;
        const matchesDept = !department || jobEligibilityCourses.includes(department);
        const isActive = job.deadline ? new Date(job.deadline) >= new Date() : true;

        return isEligible && matchesType && matchesDept && isActive;
    });

    const jobsGrid = document.getElementById('jobs-grid');
    jobsGrid.innerHTML = jobs.length > 0 ? jobs.map(job => {
        const displayTitle = job.type === 'job' ? job.title : job.position;
        const displayPackage = job.type === 'job' ? `${job.salary_ctc || 'N/A'} LPA` : `${job.stipend || 'N/A'} /month`;
        const displayLocation = Array.isArray(job.locations) ? job.locations.join(', ') : 'N/A';
        const displayMinCgpa = job.eligibility_min_cgpa || 'N/A';
        const displaySkills = Array.isArray(job.skills) ? job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : '';
        const displayDeadline = job.deadline || 'N/A';

        return `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <h3 class="job-title">${displayTitle}</h3>
                        <p class="job-company">${job.company_name || 'N/A'}</p>
                    </div>
                    <span class="job-type ${job.type}">${job.type.charAt(0).toUpperCase() + job.type.slice(1)}</span>
                </div>
                <div class="job-details">
                    <div class="job-detail"><strong>${job.type === 'job' ? 'Package' : 'Stipend'}:</strong> <span>${displayPackage}</span></div>
                    <div class="job-detail"><strong>Location:</strong> <span>${displayLocation}</span></div>
                    <div class="job-detail"><strong>Deadline:</strong> <span>${displayDeadline}</span></div>
                    <div class="job-detail"><strong>Min CGPA:</strong> <span>${displayMinCgpa}</span></div>
                </div>
                <div class="job-skills">${displaySkills}</div>
                <div class="job-actions">
                    <button class="btn btn-primary" onclick="applyJob('${job.id}')">Apply Now</button>
                </div>
            </div>
        `;
    }).join('') : '<div class="empty-state"><h4>No Jobs Available</h4><p>Check back later for new opportunities.</p></div>';
}

function filterJobs() {
    loadStudentJobs();
}

async function applyJob(jobId) {
    const coverLetter = prompt('Enter a brief cover letter:');
    if (!coverLetter) return;

    try {
        const response = await fetch('api/apply_job.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, coverLetter })
        });
        const result = await response.json();

        if (result.success) {
            showSuccess(result.message);
            // Reload applications and jobs to reflect the new application status
            const applicationsResponse = await fetch('api/applications.php');
            const applicationsResult = await applicationsResponse.json();
            if (applicationsResult.success) {
                AppState.applications = applicationsResult.data;
            }
            const jobsResponse = await fetch('api/jobs.php');
            const jobsResult = await jobsResponse.json();
            if (jobsResult.success) {
                AppState.jobs = jobsResult.data;
            }
            loadStudentJobs();
            loadStudentApplications();
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error applying for job:', error);
        showError('An error occurred while applying for the job.');
    }
}


function loadStudentApplications() {
    const student = AppState.currentUser;
    const applications = AppState.applications.filter(a => a.student_id === student.id); // Corrected field name

    const applicationsList = document.getElementById('applications-list');
    applicationsList.innerHTML = applications.length > 0 ? applications.map(app => {
        const job = AppState.jobs.find(j => j.id === app.job_id); // Corrected field name
        if (!job) return '';

        const displayTitle = job.type === 'job' ? job.title : job.position;
        const displayCompany = job.company_name || 'N/A'; // Corrected field name

        return `
            <div class="application-card">
                <div class="application-header">
                    <div class="application-info">
                        <h4>${displayTitle}</h4>
                        <p>${displayCompany}</p>
                    </div>
                    <span class="application-status status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                </div>
                <div class="application-details">
                    <div class="application-detail">
                        <strong>Applied On:</strong>
                        <span>${app.applied_date}</span>
                    </div>
                    <div class="application-detail">
                        <strong>Cover Letter:</strong>
                        <span>${app.cover_letter.substring(0, 100)}...</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') : '<div class="empty-state"><h4>No Applications</h4><p>You haven\'t applied to any jobs yet.</p></div>';
}


// Open verification modal for T&P to assign credentials
function openVerificationModal(role, userId) {
    const userList = role === 'student' ? AppState.students : AppState.companies;
    const user = userList.find(u => u.id === userId);
    if (!user) {
        alert('User not found.');
        return;
    }

    document.getElementById('verification-user-info').innerHTML = `
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
    `;
    document.getElementById('validity-months').value = 12;
    document.getElementById('verification-form').onsubmit = function(e) {
        e.preventDefault();
        assignCredentials(role, userId);
    };
    showModal('verification-modal');
}

async function assignCredentials(role, userId) {
    const validityMonths = parseInt(document.getElementById('validity-months').value);

    try {
        const response = await fetch('api/verify_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, userId, validityMonths })
        });
        const result = await response.json();

        if (result.success) {
            closeModal('verification-modal');
            showAssignedCredentials(result.loginCode, result.expiryDate);
            if (role === 'student') {
                await loadTnpDashboard();
                loadTnpStudents();
            } else {
                await loadTnpDashboard();
                loadTnpCompanies();
            }
            showSuccess('User verified successfully!');
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error assigning credentials:', error);
        showError('An error occurred while verifying the user.');
    }
}

// Show assigned credentials with copy and print options
// Modified to only accept loginCode and expiryDate
function showAssignedCredentials(code, expiryDate) {
    const displayDiv = document.getElementById('credentials-display');
    displayDiv.innerHTML = `
        <p><strong>Login Code:</strong> <span id="cred-login-code">${code}</span></p>
        <p><strong>Valid Until:</strong> ${new Date(expiryDate).toDateString()}</p>
        <p class="text-muted">The user's original password remains unchanged.</p>
    `;
    showModal('credentials-modal');
}


// Copy credentials to clipboard
function copyCredentials() {
    const code = document.getElementById('cred-login-code').textContent;
    // Removed password from copy
    const textToCopy = `Login Code: ${code}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showSuccess('Login code copied to clipboard.');
    }).catch(() => {
        showError('Failed to copy login code.');
    });
}

// Print or save credentials
function printCredentials() {
    const code = document.getElementById('cred-login-code').textContent;
    // Removed password from print
    const printWindow = window.open('', '', 'width=400,height=300');
    printWindow.document.write(`<pre>Login Code: ${code}\n(User's original password)</pre>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}


// Toggle block/unblock user status (This functionality is not implemented in PHP, only client-side simulation)
function toggleBlockUser(role, userId) {
    const userList = role === 'student' ? AppState.students : AppState.companies;
    const userIndex = userList.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        alert('User not found.');
        return;
    }
    // This is a client-side only change. To persist, you'd need a backend API.
    userList[userIndex].status = userList[userIndex].status === 'blocked' ? 'verified' : 'blocked';
    // AppState.saveToStorage(); // No longer using local storage for main data
    if (role === 'student') loadTnpStudents();
    else loadTnpCompanies();
    showSuccess(`User status updated to ${userList[userIndex].status}. (Client-side only)`);
}

function showTnpSection(section) {
    document.querySelectorAll('#tnp-dashboard .dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#tnp-dashboard .nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tnp-${section}`).classList.add('active');
    document.querySelector(`#tnp-dashboard .nav-btn[onclick*="showTnpSection('${section}')"]`).classList.add('active');

    if (section === 'profile') loadTnpProfile();
    else if (section === 'overview') loadTnpOverview();
    else if (section === 'students') loadTnpStudents();
    else if (section === 'companies') loadTnpCompanies();
    else if (section === 'jobs') loadTnpJobs();
    else if (section === 'placements') loadTnpPlacements();
}

function loadTnpProfile() {
    const tnp = AppState.currentUser;
    document.getElementById('tnp-name').textContent = tnp.name;
    document.getElementById('tnp-email').textContent = tnp.email;
    document.getElementById('tnp-position').textContent = `Position: ${tnp.position || 'N/A'}`;
    document.getElementById('tnp-department').textContent = `Department: ${tnp.department || 'N/A'}`;
    document.getElementById('tnp-employee-id').textContent = `Employee ID: ${tnp.employee_id || 'N/A'}`; // Corrected field name
    document.getElementById('tnp-phone').textContent = `Phone: ${tnp.phone || '-'}`;

    document.getElementById('managed-students').textContent = AppState.students.length;
    document.getElementById('managed-companies').textContent = AppState.companies.length;
    document.getElementById('managed-placements').textContent = AppState.students.filter(s => s.placement).length;
}

function editTnpProfile() {
    const tnp = AppState.currentUser;
    document.getElementById('edit-tnp-name').value = tnp.name || '';
    document.getElementById('edit-tnp-employee-id').value = tnp.employee_id || ''; // Corrected field name
    document.getElementById('edit-tnp-position').value = tnp.position || '';
    document.getElementById('edit-tnp-department').value = tnp.department || '';
    document.getElementById('edit-tnp-phone').value = tnp.phone || '';
    showModal('tnp-profile-edit-modal');
}

document.getElementById('tnp-profile-edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    if (!confirm('Are you sure you want to save these changes?')) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    const tnp = AppState.currentUser;
    const newEmployeeId = document.getElementById('edit-tnp-employee-id').value.trim();

    // This check is client-side only. For robust validation, it should be on the server.
    // AppState.tnpOfficers is not populated by PHP, so this check won't work as intended.
    // if (newEmployeeId !== tnp.employee_id && AppState.tnpOfficers.some(t => t.employee_id === newEmployeeId)) {
    //     showError('Employee ID already exists.');
    //     submitBtn.classList.remove('loading');
    //     submitBtn.disabled = false;
    //     return;
    // }

    const updatedData = {
        id: tnp.id,
        name: document.getElementById('edit-tnp-name').value.trim(),
        employee_id: newEmployeeId, // Corrected field name
        position: document.getElementById('edit-tnp-position').value,
        department: document.getElementById('edit-tnp-department').value,
        phone: document.getElementById('edit-tnp-phone').value.trim()
    };


    if (!updatedData.name || !updatedData.employee_id || !updatedData.position || !updatedData.department || !updatedData.phone) {
        showError('Please fill in all required fields.');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    if (!/^\+[0-9]{1,3}[0-9]{10}$/.test(updatedData.phone)) {
        showError('Phone number must include country code (e.g., +919876543210).');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    try {
        // Assuming you have an API endpoint for updating T&P profiles
        const response = await fetch('api/update_tnp_profile.php', { // You need to create this PHP file
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json();

        if (result.success) {
            AppState.currentUser = { ...AppState.currentUser, ...updatedData };
            // No need to update AppState.tnpOfficers as it's not populated from PHP
            await loadTnpDashboard(); // Reload dashboard data to reflect changes
            closeModal('tnp-profile-edit-modal');
            showSuccess('Profile updated successfully!');
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error updating T&P profile:', error);
        showError('An error occurred while updating the profile. Please try again.');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});

function loadTnpOverview() {
    document.getElementById('total-students').textContent = AppState.students.length;
    document.getElementById('total-companies').textContent = AppState.companies.length;
    document.getElementById('total-jobs').textContent = AppState.jobs.length;
    document.getElementById('total-placements').textContent = AppState.students.filter(s => s.placement).length;

    const departments = ['CSE', 'ECE', 'ME', 'EE', 'IT'];
    const deptDistribution = document.getElementById('department-distribution');
    deptDistribution.innerHTML = departments.map(dept => {
        const count = AppState.students.filter(s => s.department === dept).length;
        const percentage = AppState.students.length ? (count / AppState.students.length * 100).toFixed(1) : 0;
        return `
            <div class="chart-bar">
                <span class="chart-label">${dept}</span>
                <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                <span class="chart-value">${count}</span>
            </div>
        `;
    }).join('');

    const placementStats = document.getElementById('placement-stats');
    placementStats.innerHTML = departments.map(dept => {
        const placed = AppState.students.filter(s => s.department === dept && s.placement).length;
        const total = AppState.students.filter(s => s.department === dept).length;
        const percentage = total ? (placed / total * 100).toFixed(1) : 0;
        return `
            <div class="chart-bar">
                <span class="chart-label">${dept}</span>
                <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                <span class="chart-value">${placed}/${total}</span>
            </div>
        `;
    }).join('');

    const recentActivities = document.getElementById('recent-activities-list');
    // Sort applications by applied_date in descending order to get most recent
    const sortedApplications = [...AppState.applications].sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date));
    const activities = sortedApplications.slice(0, 5).map(app => { // Get top 5 recent activities
        const student = AppState.students.find(s => s.id === app.student_id); // Corrected field name
        const job = AppState.jobs.find(j => j.id === app.job_id); // Corrected field name
        if (!student || !job) return '';

        const displayJobTitle = job.type === 'job' ? job.title : job.position;

        return `
            <div class="activity-item">
                <div class="activity-icon">📝</div>
                <div class="activity-content">
                    <p>${student.name} applied for ${displayJobTitle} at ${job.company_name || 'N/A'}</p>
                    <span class="activity-time">${app.applied_date}</span>
                </div>
            </div>
        `;
    });
    recentActivities.innerHTML = activities.length > 0 ? activities.join('') : '<div class="empty-state"><h4>No Recent Activities</h4></div>';
}

function loadTnpStudents() {
    const deptFilter = document.getElementById('student-dept-filter').value;
    const statusFilter = document.getElementById('student-status-filter').value;
    const minCgpa = parseFloat(document.getElementById('min-cgpa-filter').value) || 0;

    const students = AppState.students.filter(student => {
        const matchesDept = !deptFilter || student.department === deptFilter;
        const matchesStatus = !statusFilter || (statusFilter === 'placed' && student.placement) || (statusFilter === 'unplaced' && !student.placement);
        const matchesCgpa = (student.cgpa || 0) >= minCgpa; // Handle null/undefined cgpa
        return matchesDept && matchesStatus && matchesCgpa;
    });

    const table = document.getElementById('students-table');
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>CGPA</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(student => `
                    <tr>
                        <td>${student.name || 'N/A'}</td>
                        <td>${student.email || 'N/A'}</td>
                        <td>${student.course || 'N/A'}</td>
                        <td>${student.department || 'N/A'}</td>
                        <td>${student.year || 'N/A'}</td>
                        <td>${student.cgpa || 'N/A'}</td>
                        <td><span class="status-label status-${student.status}">${student.status.charAt(0).toUpperCase() + student.status.slice(1)}</span></td>
                        <td class="table-actions">
                            <button class="btn btn-primary btn-small" onclick="viewStudentDetails('${student.id}')">View</button>
                            ${student.status === 'pending' ? `<button class="btn btn-success btn-small" onclick="openVerificationModal('student', '${student.id}')">Verify</button>` : ''}
                            <button class="btn btn-warning btn-small" onclick="toggleBlockUser('student', '${student.id}')">${student.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function filterStudents() {
    loadTnpStudents();
}

function viewStudentDetails(studentId) {
    const student = AppState.students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found.');
        return;
    }
    alert(`
        Name: ${student.name || 'N/A'}
        Email: ${student.email || 'N/A'}
        Phone: ${student.phone || '-'}
        Course: ${student.course || 'N/A'}
        Department: ${student.department || 'N/A'}
        Year: ${student.year || 'N/A'}
        CGPA: ${student.cgpa || 'N/A'}
        10th %: ${student.tenth_percentage || 'N/A'}
        12th %: ${student.twelfth_percentage || 'N/A'}
        GitHub: ${student.github || 'N/A'}
        LinkedIn: ${student.linkedin || 'N/A'}
        Interest: ${student.interest || 'N/A'}
        Graduation Year: ${student.grad_year || 'N/A'}
        Skills: ${Array.isArray(student.skills) ? student.skills.join(', ') : 'N/A'}
        Placement: ${student.placement ? `${student.placement.position} at ${student.placement.company_name || 'N/A'} (Package: ${student.placement.package || 'N/A'} LPA)` : 'Not placed'}
    `);
}

function loadTnpCompanies() {
    const table = document.getElementById('companies-table');
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Company Name</th>
                    <th>HR Name</th>
                    <th>HR Email</th>
                    <th>Industry</th>
                    <th>Phone</th>
                    <th>Jobs Posted</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${AppState.companies.map(company => `
                    <tr>
                        <td>${company.company_name || 'N/A'}</td>
                        <td>${company.hr_name || 'N/A'}</td>
                        <td>${company.email || 'N/A'}</td>
                        <td>${company.industry || 'N/A'}</td>
                        <td>${company.phone || '-'}</td>
                        <td>${company.jobPostings ? company.jobPostings.length : 0}</td>
                        <td><span class="status-label status-${company.status}">${company.status.charAt(0).toUpperCase() + company.status.slice(1)}</span></td>
                        <td class="table-actions">
                            <button class="btn btn-primary btn-small" onclick="viewCompanyDetails('${company.id}')">View</button>
                            ${company.status === 'pending' ? `<button class="btn btn-success btn-small" onclick="openVerificationModal('company', '${company.id}')">Verify</button>` : ''}
                            <button class="btn btn-warning btn-small" onclick="toggleBlockUser('company', '${company.id}')">${company.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function viewCompanyDetails(companyId) {
    const company = AppState.companies.find(c => c.id === companyId);
    if (!company) {
        alert('Company not found.');
        return;
    }
    alert(`
        Company Name: ${company.company_name || 'N/A'}
        HR Name: ${company.hr_name || 'N/A'}
        HR ID: ${company.hr_id || 'N/A'}
        HR Email: ${company.email || 'N/A'}
        Industry: ${company.industry || 'N/A'}
        Website: ${company.website || '-'}
        Phone: ${company.phone || '-'}
        Jobs Posted: ${company.jobPostings ? company.jobPostings.length : 0}
    `);
}

function loadTnpJobs() {
    const jobType = document.getElementById('job-type-filter').value;
    const statusFilter = document.getElementById('job-status-filter').value;

    const jobs = AppState.jobs.filter(job => {
        const matchesType = !jobType || job.type === jobType;
        const isActive = job.deadline ? new Date(job.deadline) >= new Date() : true;
        const matchesStatus = !statusFilter || (statusFilter === 'active' && isActive) || (statusFilter === 'expired' && !isActive);
        return matchesType && matchesStatus;
    });

    const jobsList = document.getElementById('tnp-jobs-list');
    jobsList.innerHTML = jobs.length > 0 ? jobs.map(job => {
        const displayTitle = job.type === 'job' ? job.title : job.position;
        const displayPackage = job.type === 'job' ? `${job.salary_ctc || 'N/A'} LPA` : `${job.stipend || 'N/A'} /month`;
        const displayLocation = Array.isArray(job.locations) ? job.locations.join(', ') : 'N/A';
        const displayMinCgpa = job.eligibility_min_cgpa || 'N/A';
        const displayDeadline = job.deadline || 'N/A';

        return `
            <div class="company-job-card">
                <div class="company-job-header">
                    <div>
                        <h3 class="job-title">${displayTitle}</h3>
                        <p class="job-company">${job.company_name || 'N/A'}</p>
                    </div>
                    <span class="job-type ${new Date(job.deadline || '9999-12-31') >= new Date() ? 'active' : 'expired'}">${new Date(job.deadline || '9999-12-31') >= new Date() ? 'Active' : 'Expired'}</span>
                </div>
                <div class="job-stats">
                    <div class="job-stat">
                        <span class="job-stat-number">${job.applicants ? job.applicants.length : 0}</span>
                        <span class="job-stat-label">Applicants</span>
                    </div>
                    <div class="job-stat">
                        <span class="job-stat-number">${job.selected ? job.selected.length : 0}</span>
                        <span class="job-stat-label">Selected</span>
                    </div>
                </div>
                <div class="job-details">
                    <div class="job-detail"><strong>${job.type === 'job' ? 'Package' : 'Stipend'}:</strong> <span>${displayPackage}</span></div>
                    <div class="job-detail"><strong>Location:</strong> <span>${displayLocation}</span></div>
                    <div class="job-detail"><strong>Deadline:</strong> <span>${displayDeadline}</span></div>
                    <div class="job-detail"><strong>Min CGPA:</strong> <span>${displayMinCgpa}</span></div>
                </div>
            </div>
        `;
    }).join('') : '<div class="empty-state"><h4>No Jobs</h4><p>No jobs match the selected filters.</p></div>';
}

function filterTnpJobs() {
    loadTnpJobs();
}

function loadTnpPlacements() {
    const placements = AppState.students.filter(s => s.placement);
    const table = document.getElementById('placements-table');
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Department</th>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Package</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${placements.map(student => `
                    <tr>
                        <td>${student.name || 'N/A'}</td>
                        <td>${student.email || 'N/A'}</td>
                        <td>${student.course || 'N/A'}</td>
                        <td>${student.department || 'N/A'}</td>
                        <td>${student.placement.company_name || 'N/A'}</td>
                        <td>${student.placement.position || 'N/A'}</td>
                        <td>${student.placement.package || 'N/A'} LPA</td>
                        <td>${student.placement.placement_date || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadCompanyDashboard() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'company') {
        showPage('landing-page');
        return;
    }

    showCompanySection('profile');
}

function showCompanySection(section) {
    document.querySelectorAll('#company-dashboard .dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#company-dashboard .nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`company-${section}`).classList.add('active');
    document.querySelector(`#company-dashboard .nav-btn[onclick*="showCompanySection('${section}')"]`).classList.add('active');

    if (section === 'profile') loadCompanyProfile();
    else if (section === 'jobs') loadCompanyJobs();
    else if (section === 'students') loadCompanyStudents();
    else if (section === 'applications') loadCompanyApplications();
}

function loadCompanyProfile() {
    const company = AppState.currentUser;
    document.getElementById('company-name').textContent = company.company_name || 'N/A'; // Corrected field name
    document.getElementById('company-hr-name').textContent = `HR Name: ${company.hr_name || 'N/A'}`; // Corrected field name
    document.getElementById('company-hr-id').textContent = `HR ID: ${company.hr_id || 'N/A'}`; // Corrected field name
    document.getElementById('company-hr-email').textContent = `HR Email: ${company.email || 'N/A'}`; // Using email from users table
    document.getElementById('company-industry').textContent = `Industry: ${company.industry || 'N/A'}`;
    document.getElementById('company-website').textContent = `Website: ${company.website || '-'}`;
    document.getElementById('company-phone').textContent = `Phone: ${company.phone || '-'}`;

    const companyJobIds = AppState.jobs.filter(j => j.company_id === company.id).map(j => j.id); // Get job IDs posted by this company
    document.getElementById('company-jobs-count').textContent = companyJobIds.length;
    document.getElementById('company-applications-count').textContent = AppState.applications.filter(a => companyJobIds.includes(a.job_id)).length; // Corrected field name
    document.getElementById('company-hires-count').textContent = AppState.applications.filter(a => companyJobIds.includes(a.job_id) && a.status === 'accepted').length; // Corrected field name
}

function editCompanyProfile() {
    const company = AppState.currentUser;
    document.getElementById('edit-company-hr-name').value = company.hr_name || ''; // Corrected field name
    document.getElementById('edit-company-hr-id').value = company.hr_id || ''; // Corrected field name
    document.getElementById('edit-company-hr-email').value = company.email || ''; // Using email from users table
    document.getElementById('edit-company-phone').value = company.phone || '';
    document.getElementById('edit-company-name').value = company.company_name || ''; // Corrected field name
    document.getElementById('edit-company-industry').value = company.industry || '';
    document.getElementById('edit-company-website').value = company.website || '';
    showModal('company-profile-edit-modal');
}

document.getElementById('company-profile-edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    if (!confirm('Are you sure you want to save these changes?')) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    const company = AppState.currentUser;
    const newHrId = document.getElementById('edit-company-hr-id').value.trim();

    // This check is client-side only. For robust validation, it should be on the server.
    // if (newHrId !== company.hr_id && AppState.companies.some(c => c.hr_id === newHrId)) {
    //     showError('HR ID already exists.');
    //     submitBtn.classList.remove('loading');
    //     submitBtn.disabled = false;
    //     return;
    // }

    const updatedData = {
        id: company.id,
        hr_name: document.getElementById('edit-company-hr-name').value.trim(), // Corrected field name
        hr_id: newHrId, // Corrected field name
        email: document.getElementById('edit-company-hr-email').value.trim(), // Using email from users table
        phone: document.getElementById('edit-company-phone').value.trim(),
        company_name: document.getElementById('edit-company-name').value.trim(), // Corrected field name
        industry: document.getElementById('edit-company-industry').value.trim(),
        website: document.getElementById('edit-company-website').value.trim()
    };

    if (!updatedData.hr_name || !updatedData.hr_id || !updatedData.email || !updatedData.phone || !updatedData.company_name || !updatedData.industry || !updatedData.website) {
        showError('Please fill in all required fields.');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    if (!/^\+[0-9]{1,3}[0-9]{10}$/.test(updatedData.phone)) {
        showError('Phone number must include country code (e.g., +919876543210).');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    try {
        // Assuming you have an API endpoint for updating company profiles
        const response = await fetch('api/update_company_profile.php', { // You need to create this PHP file
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json();

        if (result.success) {
            AppState.currentUser = { ...AppState.currentUser, ...updatedData };
            await loadCompanyDashboard(); // Reload dashboard data to reflect changes
            closeModal('company-profile-edit-modal');
            showSuccess('Profile updated successfully!');
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error updating company profile:', error);
        showError('An error occurred while updating the profile. Please try again.');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});

document.getElementById('job-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const opportunityType = document.getElementById('opportunity-type').value;
    let jobData = {
        company_id: AppState.currentUser.id, // Corrected field name
        type: opportunityType,
        posted_date: new Date().toISOString().split('T')[0], // Corrected field name
        deadline: document.getElementById('job-deadline') ? document.getElementById('job-deadline').value : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Placeholder if no input
    };

    let isValid = true;

    if (opportunityType === 'internship') {
        jobData.position = document.getElementById('internship-position').value.trim();
        jobData.domain = document.getElementById('internship-domain').value.trim();
        jobData.openings = parseInt(document.getElementById('internship-openings').value);
        jobData.duration = document.getElementById('internship-duration').value;
        jobData.start_date = document.getElementById('internship-start-date').value; // Corrected field name
        jobData.stipend = parseFloat(document.getElementById('internship-stipend').value);
        jobData.fulltime_offer = document.getElementById('internship-fulltime-offer').value; // Corrected field name

        // Company Contact Info for Internship
        jobData.companyDetails = { // Grouped under companyDetails for consistency with job
            company_name: document.getElementById('internship-company-name').value.trim(), // Corrected field name
            registeredAddress: document.getElementById('internship-registered-address').value.trim(),
            hr_contact_name: document.getElementById('internship-hr-name').value.trim(), // Corrected field name
            hr_designation: document.getElementById('internship-hr-designation').value.trim(), // Corrected field name
            hr_email: document.getElementById('internship-hr-email').value.trim() // Corrected field name
        };


        if (!jobData.position || !jobData.domain || isNaN(jobData.openings) || jobData.openings <= 0 || !jobData.duration || !jobData.start_date || isNaN(jobData.stipend) || !jobData.fulltime_offer || !jobData.companyDetails.company_name || !jobData.companyDetails.registeredAddress || !jobData.companyDetails.hr_contact_name || !jobData.companyDetails.hr_designation || !jobData.companyDetails.hr_email) {
            isValid = false;
            showError('Please fill in all required Internship fields.');
        }
    } else if (opportunityType === 'job') {
        jobData.title = document.getElementById('job-title-designation').value.trim();
        jobData.work_type = document.getElementById('job-work-type').value; // Corrected field name
        jobData.timings = document.getElementById('job-timings').value.trim();
        jobData.locations = Array.from(document.getElementById('job-locations').selectedOptions).map(option => option.value);
        jobData.openings = parseInt(document.getElementById('job-total-openings').value); // Renamed to 'openings' for consistency
        jobData.skills = jobRequiredSkills;
        jobData.description = document.getElementById('job-description').value.trim();
        jobData.responsibilities = document.getElementById('job-responsibilities').value.trim();

        jobData.eligibility = {
            qualification: document.getElementById('eligibility-qualification').value.trim(),
            eligibility_courses: Array.from(document.getElementById('eligibility-preferred-courses').selectedOptions).map(option => option.value), // Corrected field name
            eligibility_grad_year: parseInt(document.getElementById('eligibility-graduation-year').value), // Corrected field name
            eligibility_min_cgpa: parseFloat(document.getElementById('eligibility-min-cgpa').value) // Corrected field name
        };

        jobData.salary_ctc = parseFloat(document.getElementById('salary-total-ctc').value); // Corrected field name
        jobData.salary_breakdown = {}; // Corrected field name

        document.querySelectorAll('#salary-breakdown-body tr:not(.custom-salary-component-row) .salary-component-amount').forEach(input => {
            const componentName = input.dataset.component;
            jobData.salary_breakdown[componentName] = parseFloat(input.value) || 0;
        });

        document.querySelectorAll('#salary-breakdown-body tr:not(.custom-salary-component-row) .salary-component-note').forEach(input => {
            const componentName = input.dataset.component;
            jobData.salary_breakdown[`${componentName}-note`] = input.value.trim();
        });

        document.querySelectorAll('.custom-salary-component-row').forEach(row => {
            const nameInput = row.querySelector('.salary-component-name').value.trim();
            const amountInput = parseFloat(row.querySelector('.salary-component-amount').value) || 0;
            const noteInput = row.querySelector('.salary-component-note').value.trim();

            if (nameInput) {
                jobData.salary_breakdown[nameInput] = amountInput;
                if (noteInput) {
                    jobData.salary_breakdown[`${nameInput}-note`] = noteInput;
                }
            } else if (amountInput > 0 || noteInput) {
                isValid = false;
                showError('Custom salary components must have a valid name.');
            }
        });

        // Collect Leaves Policy data
        jobData.leaves_total = parseInt(document.getElementById('leaves-total').value) || 0; // Corrected field name
        jobData.leaves_cl = parseInt(document.getElementById('leaves-cl').value) || 0; // Corrected field name
        jobData.leaves_sl = parseInt(document.getElementById('leaves-sl').value) || 0; // Corrected field name
        jobData.leaves_el = parseInt(document.getElementById('leaves-el').value) || 0; // Corrected field name
        jobData.leaves_carry_forward = document.getElementById('leaves-carry-forward').value; // Corrected field name
        jobData.leaves_maternity_paternity = document.getElementById('leaves-maternity-paternity').value; // Corrected field name
        jobData.leaves_maternity_days = parseInt(document.getElementById('leaves-maternity-paternity-days').value) || 0; // Corrected field name
        // holiday_list_path will be handled by FormData for file upload

        // Collect Benefits & Perks data
        jobData.benefits_medical_insurance = document.getElementById('benefits-medical-insurance').value; // Corrected field name
        jobData.benefits_coverage_amount = parseFloat(document.getElementById('benefits-coverage-amount').value) || 0; // Corrected field name
        jobData.benefits_family_included = document.getElementById('benefits-family-included').value; // Corrected field name
        jobData.benefits_wfh = document.getElementById('benefits-wfh').value; // Corrected field name
        jobData.benefits_internet = document.getElementById('benefits-internet-reimbursement').value; // Corrected field name
        jobData.benefits_laptop = document.getElementById('benefits-laptop-provided').value; // Corrected field name
        jobData.benefits_dress_code = document.getElementById('benefits-dress-code').value.trim(); // Corrected field name
        jobData.benefits_health_checkups = document.getElementById('benefits-health-checkups').value; // Corrected field name

        // Collect Bond / Agreement data
        jobData.bond_required = document.getElementById('bond-required').value; // Corrected field name
        jobData.bond_duration_value = parseInt(document.getElementById('bond-duration-value').value) || 0; // Corrected field name
        jobData.bond_duration_unit = document.getElementById('bond-duration-unit').value; // Corrected field name
        jobData.bond_penalty_amount = parseFloat(document.getElementById('bond-penalty-amount').value) || 0; // Corrected field name
        jobData.bond_background_check = document.getElementById('bond-background-check').value; // Corrected field name
        jobData.bond_probation_period = parseInt(document.getElementById('bond-probation-period').value) || 0; // Corrected field name
        jobData.bond_notice_period = parseInt(document.getElementById('bond-notice-period').value) || 0; // Corrected field name
        jobData.bond_non_compete = document.getElementById('bond-non-compete').value; // Corrected field name

        // Collect Company Details data
        jobData.company_address = document.getElementById('company-details-registered-address').value.trim(); // Corrected field name
        jobData.hr_contact_name = document.getElementById('company-details-hr-name').value.trim(); // Corrected field name
        jobData.hr_designation = document.getElementById('company-details-hr-designation').value.trim(); // Corrected field name
        jobData.hr_email = document.getElementById('company-details-hr-email').value.trim(); // Corrected field name
        jobData.branch_locations = Array.from(document.getElementById('company-details-branch-locations').selectedOptions).map(option => option.value); // Corrected field name

        // Collect Bonus (Optional Fields) data
        jobData.growth_opportunities = document.getElementById('bonus-growth-opportunities').value.trim(); // Corrected field name
        jobData.travel_requirements = document.getElementById('bonus-travel-requirements').value.trim(); // Corrected field name
        jobData.id_email_setup_timeline = document.getElementById('bonus-id-email-setup-timeline').value.trim(); // Corrected field name
        jobData.onboarding_process = document.getElementById('bonus-onboarding-process').value.trim(); // Corrected field name

        // Basic validation for job fields
        if (!jobData.title || !jobData.work_type || jobData.locations.length === 0 || isNaN(jobData.openings) || jobData.openings <= 0 || jobData.skills.length === 0 || !jobData.description || !jobData.responsibilities || !jobData.eligibility.qualification || jobData.eligibility.eligibility_courses.length === 0 || isNaN(jobData.eligibility.eligibility_grad_year) || isNaN(jobData.eligibility.eligibility_min_cgpa) || isNaN(jobData.salary_ctc) || !jobData.company_address || !jobData.hr_contact_name || !jobData.hr_designation || !jobData.hr_email) {
            isValid = false;
            showError('Please fill in all required Job fields.');
        }

        if (jobData.salary_ctc < 0) {
            isValid = false;
            showError('Total CTC must be a positive number.');
        }
    } else {
        isValid = false;
        showError('Please select an opportunity type.');
    }

    if (jobData.skills && jobData.skills.length === 0) {
        isValid = false;
        showError('At least one required skill must be specified.');
    }

    if (!jobData.deadline || new Date(jobData.deadline) < new Date()) {
        isValid = false;
        showError('Please provide a valid future deadline.');
    }

    if (!isValid) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
    }

    // Prepare FormData for submission (including files)
    const formData = new FormData();
    for (const key in jobData) {
        if (Array.isArray(jobData[key]) || typeof jobData[key] === 'object' && jobData[key] !== null) {
            formData.append(key, JSON.stringify(jobData[key]));
        } else {
            formData.append(key, jobData[key]);
        }
    }

    // Append file attachments
    const attachmentFields = [
        'leaves-holiday-list', // This is holiday_list_path in PHP
        'attachments-job-description-pdf',
        'attachments-salary-structure-pdf',
        'attachments-leave-policy-pdf',
        'attachments-bond-copy',
        'attachments-medical-insurance-terms'
    ];

    attachmentFields.forEach(fieldId => {
        const inputElement = document.getElementById(fieldId);
        if (inputElement && inputElement.files && inputElement.files[0]) {
            // Map frontend ID to backend field name
            let backendFieldName = fieldId.replace('attachments-', '').replace('leaves-holiday-list', 'holiday_list_path').replace(/-/g, '_');
            formData.append(backendFieldName, inputElement.files[0]);
        }
    });

    try {
        const response = await fetch('api/post_job.php', {
            method: 'POST',
            body: formData // FormData handles Content-Type automatically
        });
        const result = await response.json();

        if (result.success) {
            closeModal('job-form-modal');
            await loadCompanyDashboard(); // Reload company jobs and other data
            await loadCompanyJobs(); // Refresh jobs list explicitly
            showCompanySection('jobs'); // Switch to jobs section to show posted jobs
            showSuccess(result.message);
            this.reset();
            jobRequiredSkills = [];
            renderJobSkills();
            resetCollapsibleSections();
            customComponentCount = 0;
            document.querySelectorAll('.custom-salary-component-row').forEach(row => row.remove());
            calculateInHandSalary();
            toggleOpportunityType(); // Reset sections visibility
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error posting job:', error);
        showError('An error occurred while posting the job. Please try again.');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});



function loadCompanyJobs() {
    const company = AppState.currentUser;
    const jobs = AppState.jobs.filter(j => j.company_id === company.id); // Corrected field name

    const jobsList = document.getElementById('company-jobs-list');
    jobsList.innerHTML = jobs.length > 0 ? jobs.map(job => {
        const displayTitle = job.type === 'job' ? job.title : job.position;
        const displayPackage = job.type === 'job' ? `${job.salary_ctc || 'N/A'} LPA` : `${job.stipend || 'N/A'} /month`; // Corrected field name
        const displayLocation = Array.isArray(job.locations) ? job.locations.join(', ') : 'N/A';
        const displayMinCgpa = job.eligibility_min_cgpa || 'N/A'; // Corrected field name
        const displayDeadline = job.deadline || 'N/A';

        return `
            <div class="company-job-card">
                <div class="company-job-header">
                    <div>
                        <h3 class="job-title">${displayTitle}</h3>
                        <p class="job-company">${job.company_name || 'N/A'}</p>
                    </div>
                    <span class="job-type ${new Date(job.deadline || '9999-12-31') >= new Date() ? 'active' : 'expired'}">${new Date(job.deadline || '9999-12-31') >= new Date() ? 'Active' : 'Expired'}</span>
                </div>
                <div class="job-stats">
                    <div class="job-stat">
                        <span class="job-stat-number">${job.applicants ? job.applicants.length : 0}</span>
                        <span class="job-stat-label">Applicants</span>
                    </div>
                    <div class="job-stat">
                        <span class="job-stat-number">${job.selected ? job.selected.length : 0}</span>
                        <span class="job-stat-label">Selected</span>
                    </div>
                </div>
                <div class="job-details">
                    <div class="job-detail"><strong>${job.type === 'job' ? 'Package' : 'Stipend'}:</strong> <span>${displayPackage}</span></div>
                    <div class="job-detail"><strong>Location:</strong> <span>${displayLocation}</span></div>
                    <div class="job-detail"><strong>Deadline:</strong> <span>${displayDeadline}</span></div>
                    <div class="job-detail"><strong>Min CGPA:</strong> <span>${displayMinCgpa}</span></div>
                </div>
                <div class="company-job-actions">
                    <button class="btn btn-primary btn-small" onclick="viewJobApplications('${job.id}')">View Applications</button>
                </div>
            </div>
        `;
    }).join('') : '<div class="empty-state"><h4>No Jobs Posted</h4><p>Post a new job to start receiving applications.</p></div>';
}

function loadCompanyStudents() {
    const deptFilter = document.getElementById('student-dept-filter-company').value;
    const minCgpa = parseFloat(document.getElementById('min-cgpa-company').value) || 0;
    const yearFilter = document.getElementById('year-filter-company').value;

    const students = AppState.students.filter(student => {
        const matchesDept = !deptFilter || student.department === deptFilter;
        const matchesCgpa = (student.cgpa || 0) >= minCgpa; // Handle null/undefined cgpa
        const matchesYear = !yearFilter || (student.year && student.year.toString() === yearFilter);
        return matchesDept && matchesCgpa && matchesYear;
    });

    const studentsGrid = document.getElementById('students-grid');
    studentsGrid.innerHTML = students.length > 0 ? students.map(student => `
        <div class="student-card">
            <div class="student-header">
                <div class="student-avatar">👤</div>
                <div class="student-info">
                    <h4>${student.name || 'N/A'}</h4>
                    <p>${student.course || 'N/A'} - ${student.department || 'N/A'} - Year ${student.year || 'N/A'}</p>
                </div>
            </div>
            <div class="student-details">
                <div class="student-detail"><strong>CGPA:</strong> <span>${student.cgpa || 'N/A'}</span></div>
                <div class="student-detail"><strong>Skills:</strong> <span>${Array.isArray(student.skills) ? student.skills.join(', ') : 'N/A'}</span></div>
                <div class="student-detail"><strong>Placement:</strong> <span>${student.placement ? 'Placed' : 'Unplaced'}</span></div>
            </div>
            <div class="job-actions">
                <button class="btn btn-primary btn-small" onclick="viewStudentDetails('${student.id}')">View Profile</button>
            </div>
        </div>
    `).join('') : '<div class="empty-state"><h4>No Students Found</h4><p>Adjust filters to find students.</p></div>';
}

function filterCompanyStudents() {
    loadCompanyStudents();
}

function loadCompanyApplications() {
    const company = AppState.currentUser;
    const statusFilter = document.getElementById('application-status-filter').value;

    // Get job IDs posted by the current company
    const companyJobIds = AppState.jobs.filter(j => j.company_id === company.id).map(j => j.id);

    const applications = AppState.applications.filter(a => companyJobIds.includes(a.job_id) && (!statusFilter || a.status === statusFilter)); // Corrected field name

    const applicationsList = document.getElementById('job-applications-list');
    applicationsList.innerHTML = applications.length > 0 ? applications.map(app => {
        const student = AppState.students.find(s => s.id === app.student_id); // Corrected field name
        const job = AppState.jobs.find(j => j.id === app.job_id); // Corrected field name
        if (!student || !job) return '';

        const displayJobTitle = job.type === 'job' ? job.title : job.position;
        const studentSkills = Array.isArray(student.skills) ? student.skills.join(', ') : 'N/A';

        return `
            <div class="application-card">
                <div class="application-header">
                    <div class="application-info">
                        <h4>${student.name || 'N/A'} - ${displayJobTitle}</h4>
                        <p>${student.course || 'N/A'} - ${student.department || 'N/A'} | CGPA: ${student.cgpa || 'N/A'}</p>
                    </div>
                    <span class="application-status status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                </div>
                <div class="application-details">
                    <div class="application-detail">
                        <strong>Applied On:</strong>
                        <span>${app.applied_date}</span>
                    </div>
                    <div class="application-detail">
                        <strong>Cover Letter:</strong>
                        <span>${app.cover_letter ? app.cover_letter.substring(0, 100) + '...' : 'N/A'}</span>
                    </div>
                    <div class="application-detail">
                        <strong>Skills:</strong>
                        <span>${studentSkills}</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button class="btn btn-primary btn-small" onclick="viewStudentDetails('${student.id}')">View Profile</button>
                    ${app.status === 'pending' ? `
                        <button class="btn btn-secondary btn-small" onclick="updateApplicationStatus('${app.id}', 'accepted')">Accept</button>
                        <button class="btn btn-danger btn-small" onclick="updateApplicationStatus('${app.id}', 'rejected')">Reject</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('') : '<div class="empty-state"><h4>No Applications</h4><p>No applications match the selected filters.</p></div>';
}

function filterApplications() {
    loadCompanyApplications();
}

function viewJobApplications(jobId) {
    document.getElementById('application-status-filter').value = ''; // Reset filter
    loadCompanyApplications(); // Load all applications for the company
    showCompanySection('applications'); // Navigate to applications section
}

async function updateApplicationStatus(applicationId, status) {
    try {
        const response = await fetch('api/update_application_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, status })
        });
        const result = await response.json();

        if (result.success) {
            // Reload applications and jobs to reflect the new status and potential placement
            const applicationsResponse = await fetch('api/applications.php');
            const applicationsResult = await applicationsResponse.json();
            if (applicationsResult.success) {
                AppState.applications = applicationsResult.data;
            }
            const jobsResponse = await fetch('api/jobs.php');
            const jobsResult = await jobsResponse.json();
            if (jobsResult.success) {
                AppState.jobs = jobsResult.data;
            }
            const studentsResponse = await fetch('api/students.php'); // To update student placement status
            const studentsResult = await studentsResponse.json();
            if (studentsResult.success) {
                AppState.students = studentsResult.data;
            }

            loadCompanyApplications();
            showSuccess(result.message);
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        showError('An error occurred while updating the application status.');
    }
}

function toggleOpportunityType() {
    const opportunityTypeSelect = document.getElementById('opportunity-type');
    const opportunityType = opportunityTypeSelect.value;
    const internshipSections = document.getElementById('internship-sections');
    const jobSections = document.getElementById('job-sections');

    // Hide both sections and disable/unrequire all their fields first
    internshipSections.style.display = 'none';
    jobSections.style.display = 'none';
    setRequiredFields('internship', false);
    setRequiredFields('job', false);

    if (opportunityType === 'internship') {
        internshipSections.style.display = 'block';
        setRequiredFields('internship', true);
    } else if (opportunityType === 'job') {
        jobSections.style.display = 'block';
        setRequiredFields('job', true);
    }

    resetCollapsibleSections();
}

// New function to set required/disabled status for fields within a section
function setRequiredFields(type, isRequired) {
    const sectionId = type === 'internship' ? 'internship-sections' : 'job-sections';
    const section = document.getElementById(sectionId);
    if (!section) return;

    const inputs = section.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // Only set required/disabled if the field is not the main opportunity-type select itself
        // and if it's not already explicitly disabled by HTML (e.g., register form fields)
        if (input.id !== 'opportunity-type') {
            input.required = isRequired;
            input.disabled = !isRequired; // Disable if not required, enable if required
        }
    });
}


function setupCollapsibleSections() {
    const collapsibles = document.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
        // Remove existing event listener to prevent multiple bindings
        if (header._handler) {
            header.removeEventListener('click', header._handler);
        }
        const newHandler = toggleCollapsible.bind(header);
        header.addEventListener('click', newHandler);
        header._handler = newHandler; // Store reference to handler
    });
}

function toggleCollapsible() {
    this.classList.toggle('active');
    const content = this.nextElementSibling;
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

function resetCollapsibleSections() {
    const collapsibles = document.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
        header.classList.remove('active');
        const content = header.nextElementSibling;
        content.style.maxHeight = null;
    });
}

let jobRequiredSkills = [];
document.getElementById('job-required-skills').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        const skillInput = this.value.trim();
        if (skillInput && !jobRequiredSkills.includes(skillInput)) {
            jobRequiredSkills.push(skillInput);
            renderJobSkills();
            this.value = '';
        }
    }
});

function renderJobSkills() {
    const skillsDisplay = document.getElementById('job-skills-display');
    skillsDisplay.innerHTML = '';
    jobRequiredSkills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `${skill} <button type="button" class="remove-skill" data-skill="${skill}">×</button>`;
        skillsDisplay.appendChild(skillTag);
    });

    skillsDisplay.querySelectorAll('.remove-skill').forEach(button => {
        button.addEventListener('click', function() {
            const skillToRemove = this.dataset.skill;
            jobRequiredSkills = jobRequiredSkills.filter(s => s !== skillToRemove);
            renderJobSkills();
        });
    });
}

document.getElementById('salary-breakdown-body').addEventListener('input', calculateInHandSalary);
document.getElementById('add-custom-salary-component').addEventListener('click', addCustomSalaryComponent);

function calculateInHandSalary() {
    let totalComponents = 0;
    document.querySelectorAll('.salary-component-amount').forEach(input => {
        totalComponents += parseFloat(input.value) || 0;
    });

    const totalCtc = parseFloat(document.getElementById('salary-total-ctc').value) || 0;
    // Convert CTC from LPA to monthly, then subtract monthly components
    const estimatedMonthlyInHand = (totalCtc * 100000 / 12) - totalComponents;

    document.getElementById('in-hand-salary-estimate').textContent = estimatedMonthlyInHand.toFixed(2);
}

let customComponentCount = 0;
function addCustomSalaryComponent() {
    customComponentCount++;
    const tbody = document.getElementById('salary-breakdown-body');
    const newRow = document.createElement('tr');
    newRow.className = 'custom-salary-component-row';
    newRow.innerHTML = `
        <td><input type="text" class="salary-component-name" data-component="custom-name-${customComponentCount}" placeholder="Other (custom field)"></td>
        <td><input type="number" class="salary-component-amount" data-component="custom-amount-${customComponentCount}" min="0"></td>
        <td><input type="text" class="salary-component-note" data-component="custom-note-${customComponentCount}" placeholder="Optional text"></td>
    `;
    tbody.appendChild(newRow);
    newRow.style.display = 'table-row';
    calculateInHandSalary();
}

function toggleMaternityPaternityDays() {
    const select = document.getElementById('leaves-maternity-paternity');
    const daysGroup = document.getElementById('maternity-paternity-days-group');
    if (select.value === 'yes') {
        daysGroup.style.display = 'block';
        daysGroup.querySelector('input').required = true;
    } else {
        daysGroup.style.display = 'none';
        daysGroup.querySelector('input').required = false;
        daysGroup.querySelector('input').value = '';
    }
}

function toggleMedicalInsuranceDetails() {
    const select = document.getElementById('benefits-medical-insurance');
    const detailsDiv = document.getElementById('medical-insurance-details');
    if (select.value === 'yes') {
        detailsDiv.style.display = 'block';
        detailsDiv.querySelectorAll('input, select').forEach(el => el.required = true);
    } else {
        detailsDiv.style.display = 'none';
        detailsDiv.querySelectorAll('input, select').forEach(el => {
            el.required = false;
            el.value = '';
        });
    }
}

function toggleBondDetails() {
    const select = document.getElementById('bond-required');
    const detailsDiv = document.getElementById('bond-details');
    if (select.value === 'yes') {
        detailsDiv.style.display = 'block';
        detailsDiv.querySelectorAll('input, select').forEach(el => el.required = true);
    } else {
        detailsDiv.style.display = 'none';
        detailsDiv.querySelectorAll('input, select').forEach(el => {
            el.required = false;
            el.value = '';
        });
    }
}


// Splash Screen Logic
document.addEventListener('DOMContentLoaded', function() {
    AppState.init();
    setupCollapsibleSections(); // Initialize collapsible sections on DOM load

    // Show splash screen initially
    const splashScreen = document.getElementById('splash-screen');

    // Hide splash screen after 6 seconds and show landing page
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        showPage('landing-page');
    }, 6000);
});

// Add this function to show the check status modal
function showCheckStatus() {
    document.getElementById('check-status-form').reset();
    document.getElementById('check-status-message').innerHTML = '';
    showModal('check-status-modal');
}

// Add this function to generate login codes
function generateLoginCode(role) {
    const prefix = role === 'student' ? 'STU' : 'COM';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return prefix + randomNum;
}

document.getElementById('check-status-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const email = document.getElementById('status-email').value.trim();
    const password = document.getElementById('status-password').value.trim();

    try {
        const response = await fetch('api/check_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();

        if (result.success) {
            showStatusResult(result.status, result.loginCode);
            closeModal('check-status-modal');
        } else {
            showError(result.message, 'check-status-message');
        }
    } catch (error) {
        console.error('Error checking status:', error);
        showError('An error occurred while checking status.', 'check-status-message');
    }

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});


// Add this function to show status results
function showStatusResult(status, loginCode) {
    const resultContent = document.getElementById('status-result-content');
    const copyBtn = document.getElementById('copy-code-btn');
    const downloadBtn = document.getElementById('download-code-btn');

    copyBtn.style.display = 'none';
    downloadBtn.style.display = 'none';

    switch(status) {
        case 'verified':
            resultContent.innerHTML = `
                <div style="font-size: 48px;">✅</div>
                <h3>Your account has been verified!</h3>
                <p>Your login code is:</p>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${loginCode}</p>
                <p>Use this code along with your password to login${AppState.currentUser?.role === 'tnp' ? ', or use your email for T&P login.' : '.'}</p>
            `;
            copyBtn.style.display = 'inline-block';
            downloadBtn.style.display = 'inline-block';

            // Set up copy button
            copyBtn.onclick = function() {
                navigator.clipboard.writeText(loginCode).then(() => {
                    showSuccess('Login code copied to clipboard!');
                }).catch(() => {
                    showError('Failed to copy login code.');
                });
            };

            // Set up download button
            downloadBtn.onclick = function() {
                const blob = new Blob([`CampusHire Login Credentials\n\nLogin Code: ${loginCode}\nPassword: [your registered password]`], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CampusHire_${loginCode}_Credentials.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };
            break;

        case 'pending':
            resultContent.innerHTML = `
                <div style="font-size: 48px;">⏳</div>
                <h3>Your account is pending approval</h3>
                <p>Your registration is still under review by the T&P panel.</p>
                <p>Please check back later.</p>
            `;
            break;

        case 'blocked':
            resultContent.innerHTML = `
                <div style="font-size: 48px;">⛔</div>
                <h3>Your account has been blocked</h3>
                <p>Your account has been blocked by the T&P panel.</p>
                <p>Please contact the placement office for more information.</p>
            `;
            break;

        case 'not-found':
            resultContent.innerHTML = `
                <div style="font-size: 48px;">❌</div>
                <h3>No registration found</h3>
                <p>No registration was found with these details.</p>
                <p>Please check your email and password, or register if you haven't already.</p>
            `;
            break;
    }

    showModal('status-result-modal');
}

