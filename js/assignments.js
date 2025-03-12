// API endpoints
const API_BASE_URL = '/api';
const ASSIGNMENTS_ENDPOINT = `${API_BASE_URL}/assignments`;
const SUBMISSIONS_ENDPOINT = `${API_BASE_URL}/assignments`;
const COURSES_ENDPOINT = `${API_BASE_URL}/courses`;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeAssignments();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        window.location.href = '../login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    document.getElementById('studentName').textContent = user.full_name || 'Student';
}

// Initialize assignments data
async function initializeAssignments() {
    try {
        // Show loading state
        document.getElementById('assignmentsTableBody').innerHTML = '<tr><td colspan="7" class="text-center">Loading assignments...</td></tr>';
        
        // Get the token from localStorage
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        // Fetch courses for the student
        const coursesResponse = await fetch(`${COURSES_ENDPOINT}/${user.id}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch courses');
        }
        
        const coursesData = await coursesResponse.json();
        updateCourseFilter(coursesData);
        
        // Fetch assignments data for the student
        const assignmentsResponse = await fetch(`${ASSIGNMENTS_ENDPOINT}?student_id=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!assignmentsResponse.ok) {
            throw new Error('Failed to fetch assignments data');
        }
        
        const assignmentsData = await assignmentsResponse.json();
        updateAssignmentsDisplay(assignmentsData);
        
        // Set up event listeners for filters
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing assignments:', error);
        document.getElementById('assignmentsTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading assignments. Please try again later.</td></tr>';
    }
}

// Update course filter dropdown
function updateCourseFilter(data) {
    const courseFilter = document.getElementById('courseFilter');
    courseFilter.innerHTML = '<option value="all">All Courses</option>';
    
    data.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.code} - ${course.name}`;
        courseFilter.appendChild(option);
    });
}

// Set up event listeners for filters
function setupEventListeners() {
    const courseFilter = document.getElementById('courseFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    const filterAssignments = async () => {
        try {
            // Show loading state
            document.getElementById('assignmentsTableBody').innerHTML = '<tr><td colspan="7" class="text-center">Loading assignments...</td></tr>';
            
            const token = localStorage.getItem('accessToken');
            const user = JSON.parse(localStorage.getItem('userData'));
            
            // Build query parameters
            const params = new URLSearchParams();
            params.append('student_id', user.id);
            if (courseFilter.value !== 'all') params.append('course_id', courseFilter.value);
            if (statusFilter.value !== 'all') params.append('status', statusFilter.value);
            
            // Fetch filtered assignments data
            const url = `${ASSIGNMENTS_ENDPOINT}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch filtered assignments data');
            }
            
            const data = await response.json();
            updateAssignmentsDisplay(data);
        } catch (error) {
            console.error('Error filtering assignments:', error);
            document.getElementById('assignmentsTableBody').innerHTML = 
                '<tr><td colspan="7" class="text-center text-danger">Error loading assignments. Please try again later.</td></tr>';
        }
    };
    
    courseFilter.addEventListener('change', filterAssignments);
    statusFilter.addEventListener('change', filterAssignments);
}

// Calculate average score from assignments
function calculateAverageScore(assignments) {
    const gradedAssignments = assignments.filter(a => a.submission_status === 'graded' && a.score !== null);
    
    if (gradedAssignments.length === 0) {
        return 0;
    }
    
    const totalScore = gradedAssignments.reduce((sum, assignment) => sum + assignment.score, 0);
    return Math.round(totalScore / gradedAssignments.length);
}

// Update assignments display with data
function updateAssignmentsDisplay(data) {
    // Update summary statistics
    const totalAssignments = data.assignments.length;
    const submittedCount = data.assignments.filter(a => a.submission_status === 'submitted' || a.submission_status === 'graded' || a.submission_status === 'late').length;
    const gradedCount = data.assignments.filter(a => a.submission_status === 'graded').length;
    const averageScore = calculateAverageScore(data.assignments);
    
    document.getElementById('totalAssignments').textContent = totalAssignments;
    document.getElementById('submittedCount').textContent = submittedCount;
    document.getElementById('gradedCount').textContent = gradedCount;
    document.getElementById('averageScore').textContent = `${averageScore}%`;
    
    // Update assignments table
    const tableBody = document.getElementById('assignmentsTableBody');
    
    if (data.assignments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No assignments found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    data.assignments.forEach(assignment => {
        const row = document.createElement('tr');
        
        // Format the due date
        const formattedDueDate = formatDate(assignment.due_date);
        
        // Create status badge
        const statusBadge = `<span class="badge ${getStatusBadgeClass(assignment.submission_status)}">${capitalizeFirstLetter(assignment.submission_status)}</span>`;
        
        // Create action button
        const actionButton = `<button class="btn ${getActionButtonClass(assignment.submission_status)} btn-action" onclick="handleAssignmentAction(${assignment.id}, '${assignment.submission_status}')">${getActionButtonText(assignment.submission_status)}</button>`;
        
        row.innerHTML = `
            <td>${assignment.title}</td>
            <td>${assignment.course_code} - ${assignment.course_name}</td>
            <td>${formattedDueDate}</td>
            <td>${assignment.total_marks}</td>
            <td>${statusBadge}</td>
            <td>${assignment.score !== null ? assignment.score : '-'}</td>
            <td>${actionButton}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Format date to a more readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get appropriate badge class based on submission status
function getStatusBadgeClass(status) {
    switch (status) {
        case 'submitted': return 'bg-success';
        case 'graded': return 'bg-info';
        case 'pending': return 'bg-warning';
        case 'late': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Get appropriate button class based on submission status
function getActionButtonClass(status) {
    switch (status) {
        case 'pending': return 'btn-primary';
        case 'submitted': return 'btn-secondary';
        case 'graded': return 'btn-info';
        case 'late': return 'btn-warning';
        default: return 'btn-secondary';
    }
}

// Get appropriate button text based on submission status
function getActionButtonText(status) {
    switch (status) {
        case 'pending': return 'Submit';
        case 'submitted': return 'View';
        case 'graded': return 'View Grade';
        case 'late': return 'Submit Late';
        default: return 'View';
    }
}

// Handle assignment action based on status
async function handleAssignmentAction(assignmentId, status) {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (status === 'pending' || status === 'late') {
            // Show submission modal
            const modal = new bootstrap.Modal(document.getElementById('submitAssignmentModal'));
            document.getElementById('assignmentId').value = assignmentId;
            modal.show();
        } else {
            // View assignment or grade
            const response = await fetch(`${ASSIGNMENTS_ENDPOINT}/${assignmentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch assignment details');
            }
            
            const assignment = await response.json();
            
            // Show assignment details in a modal
            const detailsModal = new bootstrap.Modal(document.getElementById('assignmentDetailsModal'));
            document.getElementById('assignmentTitle').textContent = assignment.title;
            document.getElementById('assignmentDescription').textContent = assignment.description;
            document.getElementById('assignmentDueDate').textContent = formatDate(assignment.due_date);
            document.getElementById('assignmentTotalMarks').textContent = assignment.total_marks;
            
            if (status === 'graded') {
                document.getElementById('assignmentScore').textContent = assignment.score;
                document.getElementById('assignmentFeedback').textContent = assignment.feedback || 'No feedback provided';
                document.getElementById('gradeDetails').classList.remove('d-none');
            } else {
                document.getElementById('gradeDetails').classList.add('d-none');
            }
            
            detailsModal.show();
        }
    } catch (error) {
        console.error('Error handling assignment action:', error);
        alert('Failed to process your request. Please try again later.');
    }
}

// Submit assignment
async function submitAssignment() {
    try {
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        const assignmentId = document.getElementById('assignmentId').value;
        const fileInput = document.getElementById('assignmentFile');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to upload');
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('assignment_id', assignmentId);
        formData.append('student_id', user.id);
        formData.append('file', fileInput.files[0]);
        
        // Submit the assignment
        const response = await fetch(`${SUBMISSIONS_ENDPOINT}/${assignmentId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit assignment');
        }
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('submitAssignmentModal'));
        modal.hide();
        
        // Refresh assignments
        initializeAssignments();
        
        // Show success message
        alert('Assignment submitted successfully!');
    } catch (error) {
        console.error('Error submitting assignment:', error);
        alert('Failed to submit assignment. Please try again later.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = '../login.html';
} 