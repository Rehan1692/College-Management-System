// API endpoints
const API_BASE_URL = '/api';
const COURSES_ENDPOINT = `${API_BASE_URL}/courses`;
const STUDENTS_ENDPOINT = `${API_BASE_URL}/users`;
const ASSIGNMENTS_ENDPOINT = `${API_BASE_URL}/assignments`;
const SUBMISSIONS_ENDPOINT = `${API_BASE_URL}/assignments`;
const ATTENDANCE_ENDPOINT = `${API_BASE_URL}/attendance`;
const NOTICES_ENDPOINT = `${API_BASE_URL}/notices`;
const DEPARTMENTS_ENDPOINT = `${API_BASE_URL}/departments`;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Faculty dashboard initializing...');
        // Force authentication check before doing anything else
        if (!utils.checkAuth('faculty')) {
            return; // Stop initialization if not authenticated
        }
        initializeDashboard();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        utils.showAlert('danger', 'Error initializing dashboard: ' + error.message);
    }
});

// Initialize the dashboard
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Load user data
    loadUserData();
    
    // Load dashboard data
    loadDashboardData();
    
    // Load recent activities
    loadRecentActivities();
    
    // Load upcoming events
    loadUpcomingEvents();
    
    // Load notices
    loadNotices();
    
    console.log('Dashboard initialization complete');
}

// Load user data from localStorage
function loadUserData() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            
            // Update UI with user data
            document.getElementById('facultyName').textContent = user.name || 'Faculty';
            
            console.log('User data loaded successfully');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load dashboard data
function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            console.error('No user data found');
            return;
        }
        
        // Get faculty courses using data service
        const facultyId = userData.id || 1; // Default to ID 1 if not found
        const courses = window.dataService.getCoursesByFacultyId(facultyId);
        console.log('Faculty courses:', courses);
        
        // Update stats with course data
        updateStats(courses);
        
        // Update courses list
        updateCoursesList(courses);
        
        // Populate course dropdowns
        populateCourseDropdowns(courses);
        
        // Get departments (mock data for now)
        const departments = [
            { id: 1, name: 'Computer Science' },
            { id: 2, name: 'Mathematics' },
            { id: 3, name: 'Physics' },
            { id: 4, name: 'English' }
        ];
        
        // Populate department dropdown
        populateDepartmentDropdown(departments);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        utils.showAlert('danger', 'Error loading dashboard data: ' + error.message);
    }
}

// Load recent activities
function loadRecentActivities() {
    // This will be implemented later
    console.log('Loading recent activities...');
}

// Load upcoming events
function loadUpcomingEvents() {
    // This will be implemented later
    console.log('Loading upcoming events...');
}

// Load notices
function loadNotices() {
    try {
        console.log('Loading notices...');
        
        // Get notices using data service
        const notices = window.dataService.getNotices();
        console.log('Notices:', notices);
        
        // Display recent notices
        loadRecentNotices(notices);
        
    } catch (error) {
        console.error('Error loading notices:', error);
    }
}

// Update statistics
function updateStats(coursesData) {
    try {
        console.log('Updating stats with courses:', coursesData);
        const courseCount = coursesData.length;
        
        // Get mock students data
        let studentsCount = 0;
        const mockStudentsStr = localStorage.getItem('mockStudents');
        if (mockStudentsStr) {
            try {
                const students = JSON.parse(mockStudentsStr);
                studentsCount = students.length;
            } catch (e) {
                console.error('Error parsing mock students:', e);
            }
        }
        
        // Get mock assignments data
        let assignmentsCount = 0;
        const mockAssignmentsStr = localStorage.getItem('mockAssignments');
        if (mockAssignmentsStr) {
            try {
                const assignments = JSON.parse(mockAssignmentsStr);
                assignmentsCount = assignments.length;
            } catch (e) {
                console.error('Error parsing mock assignments:', e);
            }
        }
        
        // Set submission count (mock value)
        const submissionsCount = 12;
        
        // Update UI
        const courseCountElement = document.getElementById('courseCount');
        const studentCountElement = document.getElementById('studentCount');
        const assignmentCountElement = document.getElementById('assignmentCount');
        const submissionCountElement = document.getElementById('submissionCount');
        
        if (courseCountElement) courseCountElement.textContent = courseCount;
        if (studentCountElement) studentCountElement.textContent = studentsCount;
        if (assignmentCountElement) assignmentCountElement.textContent = assignmentsCount;
        if (submissionCountElement) submissionCountElement.textContent = submissionsCount;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update courses list
function updateCoursesList(coursesData) {
    try {
        console.log('Updating courses list:', coursesData);
        const coursesListElement = document.getElementById('coursesList');
        
        if (!coursesListElement) {
            console.warn('Element with ID "coursesList" not found');
            return;
        }
        
        coursesListElement.innerHTML = '';
        
        if (coursesData.length === 0) {
            coursesListElement.innerHTML = '<div class="alert alert-info">No courses assigned yet.</div>';
            return;
        }
        
        coursesData.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'col-md-6 mb-4';
            courseCard.innerHTML = `
                <div class="course-card p-4">
                    <h5 class="card-title">${course.code} - ${course.name}</h5>
                    <p class="card-text text-muted">Department: ${course.department}</p>
                    <p class="card-text text-muted">Credits: ${course.credits}</p>
                    <div class="d-flex justify-content-between mt-3">
                        <a href="courses.html?id=${course.id}" class="btn btn-sm btn-primary">View Details</a>
                        <button class="btn btn-sm btn-outline-secondary" onclick="markAttendance(${course.id})">Mark Attendance</button>
                    </div>
                </div>
            `;
            coursesListElement.appendChild(courseCard);
        });
    } catch (error) {
        console.error('Error updating courses list:', error);
    }
}

// Populate course dropdowns
function populateCourseDropdowns(coursesData) {
    try {
        console.log('Populating course dropdowns:', coursesData);
        const assignmentCourseSelect = document.getElementById('assignmentCourse');
        const attendanceCourseSelect = document.getElementById('attendanceCourse');
        
        if (assignmentCourseSelect) {
            assignmentCourseSelect.innerHTML = '<option value="">Select Course</option>';
            coursesData.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.code} - ${course.name}`;
                assignmentCourseSelect.appendChild(option);
            });
        } else {
            console.warn('Element with ID "assignmentCourse" not found');
        }
        
        if (attendanceCourseSelect) {
            attendanceCourseSelect.innerHTML = '<option value="">Select Course</option>';
            coursesData.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.code} - ${course.name}`;
                attendanceCourseSelect.appendChild(option);
            });
        } else {
            console.warn('Element with ID "attendanceCourse" not found');
        }
    } catch (error) {
        console.error('Error populating course dropdowns:', error);
    }
}

// Populate department dropdown
function populateDepartmentDropdown(departmentsData) {
    try {
        console.log('Populating department dropdown:', departmentsData);
        const departmentSelect = document.getElementById('noticeDepartment');
        
        if (!departmentSelect) {
            console.warn('Element with ID "noticeDepartment" not found');
            return;
        }
        
        departmentSelect.innerHTML = '<option value="">All Departments</option>';
        departmentsData.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            departmentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating department dropdown:', error);
    }
}

// Load recent submissions
function loadRecentSubmissions() {
    try {
        console.log('Loading recent submissions...');
        const submissionsList = document.getElementById('recentSubmissions');
        
        if (!submissionsList) {
            console.warn('Element with ID "recentSubmissions" not found');
            return;
        }
        
        // Mock data for recent submissions
        const recentSubmissions = [
            { student: 'John Doe', assignment: 'Introduction to Programming', date: '2023-12-10', status: 'Submitted' },
            { student: 'Jane Smith', assignment: 'Data Structures Implementation', date: '2023-12-09', status: 'Graded' },
            { student: 'Bob Johnson', assignment: 'Database Design', date: '2023-12-08', status: 'Late' }
        ];
        
        submissionsList.innerHTML = '';
        
        if (recentSubmissions.length === 0) {
            submissionsList.innerHTML = '<div class="text-muted">No recent submissions.</div>';
            return;
        }
        
        recentSubmissions.forEach(submission => {
            const statusClass = submission.status === 'Graded' ? 'text-success' : 
                               (submission.status === 'Late' ? 'text-danger' : 'text-primary');
            
            const item = document.createElement('div');
            item.className = 'activity-item border-bottom';
            item.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${submission.student}</strong> submitted <strong>${submission.assignment}</strong>
                        <div class="text-muted small">${submission.date}</div>
                    </div>
                    <span class="badge ${statusClass}">${submission.status}</span>
                </div>
            `;
            submissionsList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading recent submissions:', error);
    }
}

// Load today's schedule
function loadTodaySchedule() {
    try {
        console.log('Loading today\'s schedule...');
        const scheduleList = document.getElementById('todaySchedule');
        
        if (!scheduleList) {
            console.warn('Element with ID "todaySchedule" not found');
            return;
        }
        
        // Mock data for today's schedule
        const todaySchedule = [
            { course: 'CS101 - Introduction to Computer Science', time: '09:00 AM - 10:30 AM', room: 'Room 101' },
            { course: 'CS201 - Data Structures', time: '11:00 AM - 12:30 PM', room: 'Room 203' },
            { course: 'CS301 - Database Systems', time: '02:00 PM - 03:30 PM', room: 'Lab 3' }
        ];
        
        scheduleList.innerHTML = '';
        
        if (todaySchedule.length === 0) {
            scheduleList.innerHTML = '<div class="text-muted">No classes scheduled for today.</div>';
            return;
        }
        
        todaySchedule.forEach(schedule => {
            const item = document.createElement('div');
            item.className = 'activity-item border-bottom';
            item.innerHTML = `
                <div>
                    <strong>${schedule.course}</strong>
                    <div class="text-muted small">${schedule.time}</div>
                    <div class="text-muted small">${schedule.room}</div>
                </div>
            `;
            scheduleList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading today\'s schedule:', error);
    }
}

// Load recent notices
function loadRecentNotices(notices) {
    try {
        console.log('Loading recent notices...');
        const noticesList = document.getElementById('recentNotices');
        
        if (!noticesList) {
            console.warn('Element with ID "recentNotices" not found');
            return;
        }
        
        noticesList.innerHTML = '';
        
        if (notices.length === 0) {
            noticesList.innerHTML = '<div class="text-muted">No recent notices.</div>';
            return;
        }
        
        // Display only the 3 most recent notices
        notices.slice(0, 3).forEach(notice => {
            const priorityClass = notice.priority === 'high' ? 'text-danger' : 
                                 (notice.priority === 'medium' ? 'text-warning' : 'text-info');
            
            const item = document.createElement('div');
            item.className = 'activity-item border-bottom';
            item.innerHTML = `
                <div>
                    <strong>${notice.title}</strong>
                    <div class="text-muted small">${notice.created_at}</div>
                    <div class="small ${priorityClass}">Priority: ${notice.priority}</div>
                </div>
            `;
            noticesList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading recent notices:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        } else {
            console.warn('Element with ID "logoutBtn" not found');
        }
        
        // Set default date for attendance to today
        const attendanceDate = document.getElementById('attendanceDate');
        if (attendanceDate) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            attendanceDate.value = formattedDate;
        } else {
            console.warn('Element with ID "attendanceDate" not found');
        }
        
        // Set default due date for assignment to 7 days from now
        const assignmentDueDate = document.getElementById('assignmentDueDate');
        if (assignmentDueDate) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            const formattedDueDate = dueDate.toISOString().split('T')[0];
            assignmentDueDate.value = formattedDueDate;
        } else {
            console.warn('Element with ID "assignmentDueDate" not found');
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
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
            utils.showAlert('warning', 'Please fill in all required fields.');
            return;
        }
        
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        const assignmentData = {
            title: title,
            course_id: courseId,
            description: description,
            due_date: dueDate,
            max_score: parseInt(maxScore),
            created_by: user.id,
            status: 'active'
        };
        
        console.log('Assignment data:', assignmentData);
        
        // For testing, just show success message
        utils.showAlert('success', 'Assignment created successfully!');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createAssignmentModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset form
        document.getElementById('assignmentForm').reset();
        
        // Update mock assignments in localStorage
        const mockAssignmentsStr = localStorage.getItem('mockAssignments');
        if (mockAssignmentsStr) {
            try {
                const mockAssignments = JSON.parse(mockAssignmentsStr);
                assignmentData.id = 'a' + (mockAssignments.length + 1);
                mockAssignments.push(assignmentData);
                localStorage.setItem('mockAssignments', JSON.stringify(mockAssignments));
            } catch (e) {
                console.error('Error updating mock assignments:', e);
            }
        }
    } catch (error) {
        console.error('Error creating assignment:', error);
        utils.showAlert('danger', 'Failed to create assignment: ' + error.message);
    }
}

// Mark attendance for a course
function markAttendance(courseId) {
    try {
        console.log('Opening attendance modal for course:', courseId);
        // Set the selected course in the dropdown
        const attendanceCourseSelect = document.getElementById('attendanceCourse');
        if (attendanceCourseSelect) {
            attendanceCourseSelect.value = courseId;
        }
        
        // Show the modal
        const attendanceModal = new bootstrap.Modal(document.getElementById('markAttendanceModal'));
        attendanceModal.show();
    } catch (error) {
        console.error('Error opening attendance modal:', error);
        utils.showAlert('danger', 'Failed to open attendance modal: ' + error.message);
    }
}

// Submit attendance
async function submitAttendance() {
    try {
        console.log('Submitting attendance...');
        const courseId = document.getElementById('attendanceCourse').value;
        const date = document.getElementById('attendanceDate').value;
        
        if (!courseId || !date) {
            utils.showAlert('warning', 'Please select a course and date.');
            return;
        }
        
        // Redirect to the attendance page with course and date parameters
        window.location.href = `attendance.html?course=${courseId}&date=${date}`;
    } catch (error) {
        console.error('Error submitting attendance:', error);
        utils.showAlert('danger', 'Failed to submit attendance: ' + error.message);
    }
}

// Create a new notice
function createNotice() {
    try {
        console.log('Creating new notice...');
        
        // Get form values
        const title = document.getElementById('noticeTitle').value.trim();
        const content = document.getElementById('noticeContent').value.trim();
        const type = document.getElementById('noticeType').value;
        const priority = document.getElementById('noticePriority').value;
        const department = document.getElementById('noticeDepartment').value || 'All';
        const expiryDate = document.getElementById('noticeExpiry').value || null;
        
        // Validate form
        if (!title || !content || !type || !priority) {
            utils.showAlert('warning', 'Please fill in all required fields');
            return;
        }
        
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            utils.showAlert('danger', 'User data not found. Please log in again.');
            return;
        }
        
        // Create notice object with all necessary fields for both faculty and student dashboards
        const noticeData = {
            id: 'notice_' + Date.now(), // Generate a unique ID
            title,
            content,
            type,
            priority,
            department,
            expiry_date: expiryDate,
            created_at: new Date().toISOString(),
            date: new Date().toISOString(), // For student dashboard compatibility
            created_by: userData.id || 1,
            created_by_name: userData.name || 'Faculty',
            posted_by: userData.name || 'Faculty' // For student dashboard compatibility
        };
        
        // Show success message
        utils.showAlert('success', 'Notice posted successfully!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createNoticeModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('noticeForm').reset();
        
        // Update mock notices in localStorage
        const mockNoticesStr = localStorage.getItem('mockNotices');
        if (mockNoticesStr) {
            try {
                const mockNotices = JSON.parse(mockNoticesStr);
                // Use the same ID to avoid duplication
                mockNotices.push({...noticeData});
                localStorage.setItem('mockNotices', JSON.stringify(mockNotices));
                
                // Refresh notices display
                loadRecentNotices();
            } catch (e) {
                console.error('Error updating mock notices:', e);
            }
        } else {
            // Create mock notices array if it doesn't exist
            localStorage.setItem('mockNotices', JSON.stringify([{...noticeData}]));
        }
        
        // Update shared notices in localStorage
        const noticesStr = localStorage.getItem('notices');
        try {
            const notices = noticesStr ? JSON.parse(noticesStr) : [];
            notices.push({...noticeData});
            localStorage.setItem('notices', JSON.stringify(notices));
            console.log('Notice added to shared notices:', noticeData);
        } catch (e) {
            console.error('Error updating shared notices:', e);
        }
        
        // Log success message
        console.log('Notice created successfully with ID:', noticeData.id);
        
    } catch (error) {
        console.error('Error creating notice:', error);
        utils.showAlert('danger', 'Failed to post notice: ' + error.message);
    }
}

// Show alert message
function showAlert(type, message) {
    try {
        console.log(`Showing alert: ${type} - ${message}`);
        const alertContainer = document.getElementById('alertContainer');
        
        if (!alertContainer) {
            console.warn('Element with ID "alertContainer" not found');
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
            // Try the direct approach first
            directLogout();
        } catch (redirectError) {
            console.error('Error using direct logout:', redirectError);
            try {
                window.location.replace('../login.html');
            } catch (replaceError) {
                console.error('Error using replace for redirect:', replaceError);
                // Fallback to href if replace fails
                window.location.href = '../login.html';
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Force redirect to login page
        alert('Error during logout. Redirecting to login page.');
        window.location.href = '../login.html';
    }
}

// Direct logout function - simpler approach for testing
function directLogout() {
    console.log('Using direct logout approach');
    window.location.href = '../login.html';
}

// Make directLogout available globally for testing
window.directLogout = directLogout; 