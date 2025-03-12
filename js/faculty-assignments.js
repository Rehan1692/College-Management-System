// API endpoints
const API_BASE_URL = '/api';
const COURSES_ENDPOINT = `${API_BASE_URL}/courses`;
const STUDENTS_ENDPOINT = `${API_BASE_URL}/users`;
const ASSIGNMENTS_ENDPOINT = `${API_BASE_URL}/assignments`;
const SUBMISSIONS_ENDPOINT = `${API_BASE_URL}/submissions`;

// Global variables
let facultyCourses = [];
let allAssignments = [];
let filteredAssignments = [];
let currentAssignment = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Faculty assignments page initializing...');
        // Force authentication check before doing anything else
        if (!checkAuth()) {
            return; // Stop initialization if not authenticated
        }
        initializePage();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing assignments page:', error);
        showAlert('danger', 'Error initializing page: ' + error.message);
    }
});

// Check if user is authenticated
function checkAuth() {
    console.log('Checking authentication...');
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        console.log('No token or user data found, redirecting to login');
        // Clear any existing data to ensure a fresh login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        
        // Use replace instead of href to prevent back button from returning to dashboard
        window.location.replace('../login.html');
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('User data:', user);
        
        // Check if user is faculty
        if (user.type !== 'faculty') {
            console.log('User is not faculty, redirecting to login');
            // Clear any existing data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('userData');
            
            window.location.replace('../login.html');
            return false;
        }
        
        // Update faculty name in the UI
        const facultyNameElement = document.getElementById('facultyName');
        if (facultyNameElement) {
            facultyNameElement.textContent = user.full_name || 'Faculty';
        } else {
            console.warn('Element with ID "facultyName" not found');
        }
        
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear any existing data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        
        window.location.replace('../login.html');
        return false;
    }
}

// Initialize page data
async function initializePage() {
    try {
        console.log('Initializing page data...');
        
        // Load faculty courses
        await loadFacultyCourses();
        
        // Load assignments
        await loadAssignments();
        
        // Update statistics
        updateStatistics();
        
        // Populate course filter
        populateCourseFilter();
        
        // Apply initial filters
        applyFilters();
    } catch (error) {
        console.error('Error initializing page data:', error);
        showAlert('danger', 'Error loading data: ' + error.message);
    }
}

// Load faculty courses
async function loadFacultyCourses() {
    try {
        console.log('Loading faculty courses...');
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        // Try to get mock data from localStorage first
        const mockCoursesStr = localStorage.getItem('mockCourses');
        
        if (mockCoursesStr) {
            try {
                facultyCourses = JSON.parse(mockCoursesStr);
                console.log('Using mock course data from localStorage:', facultyCourses);
            } catch (e) {
                console.error('Error parsing mock courses:', e);
                facultyCourses = [];
            }
        } else {
            // Fetch faculty courses from API
            try {
                const coursesResponse = await fetch(`${COURSES_ENDPOINT}?instructor_id=${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!coursesResponse.ok) {
                    throw new Error('Failed to fetch courses');
                }
                
                facultyCourses = await coursesResponse.json();
            } catch (error) {
                console.error('API error fetching courses:', error);
                showAlert('danger', 'Failed to fetch courses: ' + error.message);
                
                // Use mock data as fallback
                facultyCourses = [
                    { id: 'c1', course_code: 'CS101', course_name: 'Introduction to Computer Science', semester: 'Fall 2023' },
                    { id: 'c2', course_code: 'CS201', course_name: 'Data Structures', semester: 'Fall 2023' },
                    { id: 'c3', course_code: 'CS301', course_name: 'Database Systems', semester: 'Fall 2023' }
                ];
            }
        }
        
        // Populate course dropdown in create assignment modal
        const courseSelect = document.getElementById('assignmentCourse');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">Select Course</option>';
            facultyCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.course_code} - ${course.course_name}`;
                courseSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading faculty courses:', error);
        throw error;
    }
}

// Load assignments
async function loadAssignments() {
    try {
        console.log('Loading assignments...');
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        // Try to get mock data from localStorage first
        const mockAssignmentsStr = localStorage.getItem('mockAssignments');
        
        if (mockAssignmentsStr) {
            try {
                allAssignments = JSON.parse(mockAssignmentsStr);
                console.log('Using mock assignments data from localStorage:', allAssignments);
            } catch (e) {
                console.error('Error parsing mock assignments:', e);
                allAssignments = [];
            }
        } else {
            // Fetch assignments from API
            try {
                const assignmentsResponse = await fetch(`${ASSIGNMENTS_ENDPOINT}?created_by=${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!assignmentsResponse.ok) {
                    throw new Error('Failed to fetch assignments');
                }
                
                allAssignments = await assignmentsResponse.json();
            } catch (error) {
                console.error('API error fetching assignments:', error);
                showAlert('danger', 'Failed to fetch assignments: ' + error.message);
                
                // Use mock data as fallback
                allAssignments = [
                    { 
                        id: 'a1', 
                        title: 'Introduction to Programming', 
                        course_id: 'c1', 
                        description: 'Write a simple program in Python', 
                        due_date: '2023-12-15', 
                        max_score: 100, 
                        created_by: user.id,
                        status: 'active',
                        submissions_count: 15
                    },
                    { 
                        id: 'a2', 
                        title: 'Data Structures Implementation', 
                        course_id: 'c2', 
                        description: 'Implement a linked list and binary tree', 
                        due_date: '2023-12-20', 
                        max_score: 100, 
                        created_by: user.id,
                        status: 'active',
                        submissions_count: 8
                    },
                    { 
                        id: 'a3', 
                        title: 'Database Design', 
                        course_id: 'c3', 
                        description: 'Design a database schema for a library management system', 
                        due_date: '2023-12-25', 
                        max_score: 100, 
                        created_by: user.id,
                        status: 'upcoming',
                        submissions_count: 0
                    }
                ];
            }
        }
        
        // Add course information to assignments
        allAssignments = allAssignments.map(assignment => {
            const course = facultyCourses.find(c => c.id === assignment.course_id);
            return {
                ...assignment,
                course_name: course ? `${course.course_code} - ${course.course_name}` : 'Unknown Course'
            };
        });
    } catch (error) {
        console.error('Error loading assignments:', error);
        throw error;
    }
}

// Update statistics
function updateStatistics() {
    try {
        console.log('Updating statistics...');
        
        // Calculate statistics
        const totalAssignments = allAssignments.length;
        
        let submissionCount = 0;
        let gradedCount = 0;
        let pendingCount = 0;
        
        allAssignments.forEach(assignment => {
            submissionCount += assignment.submissions_count || 0;
            
            // For demo purposes, assume 60% of submissions are graded
            const graded = Math.floor((assignment.submissions_count || 0) * 0.6);
            gradedCount += graded;
            pendingCount += (assignment.submissions_count || 0) - graded;
        });
        
        // Update UI
        document.getElementById('totalAssignments').textContent = totalAssignments;
        document.getElementById('submissionCount').textContent = submissionCount;
        document.getElementById('gradedCount').textContent = gradedCount;
        document.getElementById('pendingCount').textContent = pendingCount;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Populate course filter
function populateCourseFilter() {
    try {
        console.log('Populating course filter...');
        const courseFilter = document.getElementById('courseFilter');
        
        if (!courseFilter) {
            console.warn('Course filter element not found');
            return;
        }
        
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        
        facultyCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.course_code} - ${course.course_name}`;
            courseFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating course filter:', error);
    }
}

// Apply filters
function applyFilters() {
    try {
        console.log('Applying filters...');
        const courseFilter = document.getElementById('courseFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        
        filteredAssignments = allAssignments.filter(assignment => {
            // Course filter
            if (courseFilter && assignment.course_id !== courseFilter) {
                return false;
            }
            
            // Status filter
            if (statusFilter && assignment.status !== statusFilter) {
                return false;
            }
            
            // Search filter
            if (searchInput && !assignment.title.toLowerCase().includes(searchInput)) {
                return false;
            }
            
            return true;
        });
        
        renderAssignmentsList();
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Render assignments list
function renderAssignmentsList() {
    try {
        console.log('Rendering assignments list...');
        const assignmentsList = document.getElementById('assignmentsList');
        
        if (!assignmentsList) {
            console.warn('Assignments list element not found');
            return;
        }
        
        assignmentsList.innerHTML = '';
        
        if (filteredAssignments.length === 0) {
            assignmentsList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">No assignments found matching the filters.</td>
                </tr>
            `;
            return;
        }
        
        filteredAssignments.forEach(assignment => {
            const dueDate = new Date(assignment.due_date);
            const today = new Date();
            
            // Determine status
            let statusBadge = '';
            if (assignment.status === 'active') {
                statusBadge = '<span class="badge bg-success">Active</span>';
            } else if (assignment.status === 'upcoming') {
                statusBadge = '<span class="badge bg-info">Upcoming</span>';
            } else if (assignment.status === 'past' || dueDate < today) {
                statusBadge = '<span class="badge bg-secondary">Past</span>';
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.course_name}</td>
                <td>${assignment.title}</td>
                <td>${formatDate(assignment.due_date)}</td>
                <td>${assignment.max_score}</td>
                <td>${statusBadge}</td>
                <td>${assignment.submissions_count || 0}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="viewSubmissions('${assignment.id}')">
                            <i class="bi bi-eye me-1"></i> View
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment('${assignment.id}')">
                            <i class="bi bi-trash me-1"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            
            assignmentsList.appendChild(row);
        });
    } catch (error) {
        console.error('Error rendering assignments list:', error);
    }
}

// View submissions for an assignment
async function viewSubmissions(assignmentId) {
    try {
        console.log('Viewing submissions for assignment:', assignmentId);
        currentAssignment = allAssignments.find(a => a.id === assignmentId);
        
        if (!currentAssignment) {
            showAlert('danger', 'Assignment not found');
            return;
        }
        
        // Update modal title
        document.getElementById('submissionAssignmentTitle').textContent = currentAssignment.title;
        
        // Get submissions
        const submissionsList = document.getElementById('submissionsList');
        submissionsList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2">Loading submissions...</p>
                </td>
            </tr>
        `;
        
        // Try to get mock data from localStorage
        let submissions = [];
        const mockStudentsStr = localStorage.getItem('mockStudents');
        
        if (mockStudentsStr) {
            try {
                const students = JSON.parse(mockStudentsStr);
                
                // Generate mock submissions for demo purposes
                submissions = students.slice(0, 5).map((student, index) => {
                    const isGraded = index < 3; // First 3 are graded
                    return {
                        id: `s${index + 1}`,
                        assignment_id: assignmentId,
                        student_id: student.id,
                        student_name: student.full_name,
                        submission_date: '2023-12-10',
                        status: isGraded ? 'graded' : 'submitted',
                        score: isGraded ? Math.floor(Math.random() * 40) + 60 : null // Random score between 60-100
                    };
                });
            } catch (e) {
                console.error('Error parsing mock students:', e);
            }
        } else {
            // Mock data as fallback
            submissions = [
                { id: 's1', assignment_id: assignmentId, student_id: 'st1', student_name: 'John Doe', submission_date: '2023-12-10', status: 'graded', score: 85 },
                { id: 's2', assignment_id: assignmentId, student_id: 'st2', student_name: 'Jane Smith', submission_date: '2023-12-09', status: 'graded', score: 92 },
                { id: 's3', assignment_id: assignmentId, student_id: 'st3', student_name: 'Bob Johnson', submission_date: '2023-12-11', status: 'submitted', score: null }
            ];
        }
        
        // Render submissions
        submissionsList.innerHTML = '';
        
        if (submissions.length === 0) {
            submissionsList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">No submissions found for this assignment.</td>
                </tr>
            `;
        } else {
            submissions.forEach(submission => {
                const row = document.createElement('tr');
                
                // Determine status badge
                let statusBadge = '';
                if (submission.status === 'graded') {
                    statusBadge = '<span class="badge bg-success">Graded</span>';
                } else if (submission.status === 'submitted') {
                    statusBadge = '<span class="badge bg-primary">Submitted</span>';
                } else if (submission.status === 'late') {
                    statusBadge = '<span class="badge bg-warning">Late</span>';
                }
                
                row.innerHTML = `
                    <td>${submission.student_name}</td>
                    <td>${formatDate(submission.submission_date)}</td>
                    <td>${statusBadge}</td>
                    <td>${submission.score !== null ? submission.score : '-'}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary" onclick="downloadSubmission('${submission.id}')">
                                <i class="bi bi-download me-1"></i> Download
                            </button>
                            <button class="btn btn-sm ${submission.status === 'graded' ? 'btn-outline-primary' : 'btn-success'}" 
                                    onclick="gradeSubmission('${submission.id}', '${submission.student_name}')">
                                <i class="bi bi-check-circle me-1"></i> ${submission.status === 'graded' ? 'Update Grade' : 'Grade'}
                            </button>
                        </div>
                    </td>
                `;
                
                submissionsList.appendChild(row);
            });
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewSubmissionsModal'));
        modal.show();
    } catch (error) {
        console.error('Error viewing submissions:', error);
        showAlert('danger', 'Error loading submissions: ' + error.message);
    }
}

// Grade submission
function gradeSubmission(submissionId, studentName) {
    try {
        console.log('Grading submission:', submissionId);
        
        // Set values in the grade modal
        document.getElementById('gradeStudentName').value = studentName;
        document.getElementById('gradeAssignmentTitle').value = currentAssignment.title;
        document.getElementById('gradeMaxScore').textContent = `Maximum score: ${currentAssignment.max_score}`;
        
        // Clear previous values
        document.getElementById('gradeScore').value = '';
        document.getElementById('gradeFeedback').value = '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('gradeSubmissionModal'));
        modal.show();
        
        // Store submission ID for submission
        document.getElementById('gradeSubmissionModal').dataset.submissionId = submissionId;
    } catch (error) {
        console.error('Error opening grade modal:', error);
        showAlert('danger', 'Error opening grade form: ' + error.message);
    }
}

// Submit grade
async function submitGrade() {
    try {
        console.log('Submitting grade...');
        const submissionId = document.getElementById('gradeSubmissionModal').dataset.submissionId;
        const score = document.getElementById('gradeScore').value;
        const feedback = document.getElementById('gradeFeedback').value;
        
        if (!score) {
            showAlert('warning', 'Please enter a score');
            return;
        }
        
        if (parseInt(score) > currentAssignment.max_score) {
            showAlert('warning', `Score cannot exceed maximum score of ${currentAssignment.max_score}`);
            return;
        }
        
        // For demo purposes, just show success message
        showAlert('success', 'Grade submitted successfully!');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('gradeSubmissionModal'));
        if (modal) {
            modal.hide();
        }
        
        // Refresh submissions view
        viewSubmissions(currentAssignment.id);
    } catch (error) {
        console.error('Error submitting grade:', error);
        showAlert('danger', 'Error submitting grade: ' + error.message);
    }
}

// Download submission
function downloadSubmission(submissionId) {
    try {
        console.log('Downloading submission:', submissionId);
        
        // For demo purposes, just show message
        showAlert('info', 'Download functionality would be implemented here in a production environment.');
    } catch (error) {
        console.error('Error downloading submission:', error);
        showAlert('danger', 'Error downloading submission: ' + error.message);
    }
}

// Create a new assignment
async function createAssignment() {
    try {
        console.log('Creating new assignment...');
        const title = document.getElementById('assignmentTitle').value;
        const courseId = document.getElementById('assignmentCourse').value;
        const description = document.getElementById('assignmentDescription').value;
        const dueDate = document.getElementById('assignmentDueDate').value;
        const maxScore = document.getElementById('assignmentMaxScore').value;
        
        if (!title || !courseId || !description || !dueDate || !maxScore) {
            showAlert('warning', 'Please fill in all required fields.');
            return;
        }
        
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        const assignmentData = {
            id: 'a' + (allAssignments.length + 1), // For mock data
            title: title,
            course_id: courseId,
            description: description,
            due_date: dueDate,
            max_score: parseInt(maxScore),
            created_by: user.id,
            status: 'active',
            submissions_count: 0
        };
        
        console.log('Assignment data:', assignmentData);
        
        // Add course information
        const course = facultyCourses.find(c => c.id === courseId);
        assignmentData.course_name = course ? `${course.course_code} - ${course.course_name}` : 'Unknown Course';
        
        // Add to assignments list
        allAssignments.push(assignmentData);
        
        // Update mock assignments in localStorage
        localStorage.setItem('mockAssignments', JSON.stringify(allAssignments));
        
        // Update UI
        updateStatistics();
        applyFilters();
        
        // Show success message
        showAlert('success', 'Assignment created successfully!');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createAssignmentModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset form
        document.getElementById('assignmentForm').reset();
    } catch (error) {
        console.error('Error creating assignment:', error);
        showAlert('danger', 'Failed to create assignment: ' + error.message);
    }
}

// Delete assignment
async function deleteAssignment(assignmentId) {
    try {
        console.log('Deleting assignment:', assignmentId);
        
        if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
            return;
        }
        
        // Remove from assignments list
        allAssignments = allAssignments.filter(a => a.id !== assignmentId);
        
        // Update mock assignments in localStorage
        localStorage.setItem('mockAssignments', JSON.stringify(allAssignments));
        
        // Update UI
        updateStatistics();
        applyFilters();
        
        // Show success message
        showAlert('success', 'Assignment deleted successfully!');
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showAlert('danger', 'Failed to delete assignment: ' + error.message);
    }
}

// Set up event listeners
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Filter change events
        const courseFilter = document.getElementById('courseFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (courseFilter) {
            courseFilter.addEventListener('change', applyFilters);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce(applyFilters, 300));
        }
        
        // Set default due date for assignment to 7 days from now
        const assignmentDueDate = document.getElementById('assignmentDueDate');
        if (assignmentDueDate) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            const formattedDueDate = dueDate.toISOString().split('T')[0];
            assignmentDueDate.value = formattedDueDate;
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Debounce function for search input
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Show alert message
function showAlert(type, message) {
    try {
        console.log(`Showing alert: ${type} - ${message}`);
        const alertContainer = document.getElementById('alertContainer');
        
        if (!alertContainer) {
            console.warn('Alert container not found');
            console.error(message);
            return;
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            try {
                const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
                if (alert) {
                    alert.close();
                } else {
                    alertDiv.remove();
                }
            } catch (e) {
                alertDiv.remove();
            }
        }, 5000);
    } catch (error) {
        console.error('Error showing alert:', error);
    }
}

// Logout function
function logout() {
    try {
        console.log('Logging out...');
        
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        
        // Clear any other related data
        localStorage.removeItem('mockCourses');
        localStorage.removeItem('mockStudents');
        localStorage.removeItem('mockAssignments');
        localStorage.removeItem('mockNotices');
        localStorage.removeItem('mockAttendance');
        
        // Redirect to login page - use replace to prevent back button from returning to dashboard
        console.log('Redirecting to login page...');
        try {
            window.location.replace('../login.html');
        } catch (redirectError) {
            console.error('Error using replace for redirect:', redirectError);
            // Fallback to href if replace fails
            window.location.href = '../login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Force redirect to login page
        alert('Error during logout. Redirecting to login page.');
        window.location.href = '../login.html';
    }
} 