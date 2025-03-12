// API endpoints
const API_BASE_URL = '/api';
const COURSES_ENDPOINT = `${API_BASE_URL}/courses`;
const STUDENTS_ENDPOINT = `${API_BASE_URL}/users`;
const ASSIGNMENTS_ENDPOINT = `${API_BASE_URL}/assignments`;
const ATTENDANCE_ENDPOINT = `${API_BASE_URL}/attendance`;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeCourses();
    setupEventListeners();
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
    
    // Check if user is faculty
    if (user.type !== 'faculty') {
        window.location.href = '../login.html';
        return;
    }
    
    // Update faculty name in the UI
    document.getElementById('facultyName').textContent = user.full_name || 'Faculty';
}

// Initialize courses data
async function initializeCourses() {
    try {
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        // Show loading state
        document.getElementById('coursesGrid').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Loading courses...</p>
            </div>
        `;
        
        // Fetch faculty courses
        const response = await fetch(`${COURSES_ENDPOINT}?instructor_id=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }
        
        const coursesData = await response.json();
        
        // Update stats
        updateStats(coursesData);
        
        // Update courses grid
        updateCoursesGrid(coursesData);
    } catch (error) {
        console.error('Error initializing courses:', error);
        document.getElementById('coursesGrid').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error loading courses. Please try again later.
                </div>
            </div>
        `;
    }
}

// Update dashboard stats
function updateStats(coursesData) {
    // Calculate total students across all courses
    let totalStudents = 0;
    let totalAssignments = 0;
    let totalAttendance = 0;
    let attendanceCount = 0;
    
    coursesData.forEach(course => {
        totalStudents += course.enrolled_students || 0;
        totalAssignments += course.active_assignments || 0;
        
        if (course.average_attendance !== undefined) {
            totalAttendance += course.average_attendance;
            attendanceCount++;
        }
    });
    
    // Calculate average attendance
    const averageAttendance = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0;
    
    // Update the DOM
    document.getElementById('totalCourses').textContent = coursesData.length;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('activeAssignments').textContent = totalAssignments;
    document.getElementById('averageAttendance').textContent = `${averageAttendance}%`;
}

// Update courses grid
function updateCoursesGrid(coursesData) {
    const coursesGrid = document.getElementById('coursesGrid');
    
    if (!coursesData || coursesData.length === 0) {
        coursesGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    You don't have any courses assigned yet.
                </div>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = '';
    
    coursesData.forEach(course => {
        const courseCol = document.createElement('div');
        courseCol.className = 'col-md-4 mb-4';
        
        // Calculate progress percentage based on course completion or attendance
        const progressPercentage = course.average_attendance || Math.floor(Math.random() * 100);
        const progressClass = progressPercentage < 50 ? 'danger' : progressPercentage < 75 ? 'warning' : 'success';
        
        courseCol.innerHTML = `
            <div class="course-card p-4 h-100">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="mb-0">${course.code}</h4>
                    <span class="badge bg-primary">${course.semester || 'Current'}</span>
                </div>
                <h5>${course.name}</h5>
                <p class="text-muted mb-3">${course.description || 'No description available'}</p>
                
                <div class="progress mb-3" style="height: 10px;">
                    <div class="progress-bar bg-${progressClass}" role="progressbar" style="width: ${progressPercentage}%" 
                        aria-valuenow="${progressPercentage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                
                <div class="d-flex justify-content-between mb-3">
                    <small class="text-muted">Students: ${course.enrolled_students || 0}</small>
                    <small class="text-muted">Assignments: ${course.active_assignments || 0}</small>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <button class="btn btn-sm btn-outline-primary view-details-btn" data-course-id="${course.id}">
                        <i class="bi bi-eye me-1"></i>View Details
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="assignments.html?course=${course.id}"><i class="bi bi-file-earmark-text me-2"></i>Assignments</a></li>
                            <li><a class="dropdown-item" href="attendance.html?course=${course.id}"><i class="bi bi-calendar-check me-2"></i>Attendance</a></li>
                            <li><a class="dropdown-item" href="grades.html?course=${course.id}"><i class="bi bi-bar-chart me-2"></i>Grades</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" data-course-id="${course.id}" data-action="edit"><i class="bi bi-pencil me-2"></i>Edit Course</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        coursesGrid.appendChild(courseCol);
    });
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseId = button.getAttribute('data-course-id');
            openCourseDetails(courseId);
        });
    });
}

// Open course details modal
async function openCourseDetails(courseId) {
    try {
        const token = localStorage.getItem('accessToken');
        
        // Show loading state in modal
        document.getElementById('courseDetailName').textContent = 'Loading...';
        document.getElementById('courseDetailCode').textContent = '';
        document.getElementById('courseDetailDescription').textContent = 'Loading course details...';
        document.getElementById('courseStudentsList').innerHTML = '<p class="text-center py-3">Loading students...</p>';
        
        // Reset all badges
        document.querySelectorAll('.badge.rounded-pill').forEach(badge => {
            badge.textContent = '-';
        });
        
        // Show the modal
        const courseModal = new bootstrap.Modal(document.getElementById('courseDetailsModal'));
        courseModal.show();
        
        // Fetch course details
        const response = await fetch(`${COURSES_ENDPOINT}/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch course details');
        }
        
        const courseData = await response.json();
        
        // Update modal with course details
        document.getElementById('courseDetailName').textContent = courseData.name;
        document.getElementById('courseDetailCode').textContent = courseData.code;
        document.getElementById('courseDetailDescription').textContent = courseData.description || 'No description available';
        
        // Update course information
        document.getElementById('courseDetailDepartment').textContent = courseData.department_name || '-';
        document.getElementById('courseDetailCredits').textContent = courseData.credits || '-';
        document.getElementById('courseDetailSemester').textContent = courseData.semester || '-';
        document.getElementById('courseDetailSchedule').textContent = courseData.schedule || '-';
        
        // Update statistics
        document.getElementById('courseDetailStudents').textContent = courseData.enrolled_students || '0';
        document.getElementById('courseDetailAssignments').textContent = courseData.active_assignments || '0';
        document.getElementById('courseDetailAttendance').textContent = `${courseData.average_attendance || '0'}%`;
        document.getElementById('courseDetailGrade').textContent = courseData.average_grade || '-';
        
        // Update action buttons
        document.getElementById('viewAssignmentsBtn').href = `assignments.html?course=${courseId}`;
        document.getElementById('markAttendanceBtn').href = `attendance.html?course=${courseId}`;
        document.getElementById('viewGradesBtn').href = `grades.html?course=${courseId}`;
        
        // Fetch students enrolled in the course
        const studentsResponse = await fetch(`${COURSES_ENDPOINT}/${courseId}/students`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            updateStudentsList(studentsData);
        } else {
            document.getElementById('courseStudentsList').innerHTML = '<p class="text-center">No students found</p>';
        }
    } catch (error) {
        console.error('Error fetching course details:', error);
        document.getElementById('courseDetailDescription').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error loading course details. Please try again later.
            </div>
        `;
    }
}

// Update students list in course details modal
function updateStudentsList(studentsData) {
    const studentsList = document.getElementById('courseStudentsList');
    
    if (!studentsData || studentsData.length === 0) {
        studentsList.innerHTML = '<p class="text-center">No students enrolled in this course</p>';
        return;
    }
    
    studentsList.innerHTML = '';
    
    // Create a list group for students
    const listGroup = document.createElement('ul');
    listGroup.className = 'list-group';
    
    studentsData.forEach(student => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        listItem.innerHTML = `
            <div>
                <span class="fw-bold">${student.full_name}</span>
                <br>
                <small class="text-muted">${student.roll_number || 'No Roll Number'}</small>
            </div>
            <a href="student-details.html?id=${student.id}" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-info-circle"></i>
            </a>
        `;
        
        listGroup.appendChild(listItem);
    });
    
    studentsList.appendChild(listGroup);
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchCourse');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterCourses(this.value);
        }, 300));
    }
    
    // Filter dropdown
    const filterLinks = document.querySelectorAll('.dropdown-item[data-filter]');
    filterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const filter = this.getAttribute('data-filter');
            applyFilter(filter);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    } else {
        console.warn('Logout button not found');
    }
}

// Filter courses by search term
function filterCourses(searchTerm) {
    const courseCards = document.querySelectorAll('.course-card');
    
    if (!courseCards.length) return;
    
    searchTerm = searchTerm.toLowerCase();
    
    courseCards.forEach(card => {
        const courseTitle = card.querySelector('h5').textContent.toLowerCase();
        const courseCode = card.querySelector('h4').textContent.toLowerCase();
        const courseDescription = card.querySelector('p').textContent.toLowerCase();
        
        const isMatch = courseTitle.includes(searchTerm) || 
                        courseCode.includes(searchTerm) || 
                        courseDescription.includes(searchTerm);
        
        card.closest('.col-md-4').style.display = isMatch ? 'block' : 'none';
    });
}

// Apply filter to courses
function applyFilter(filter) {
    // Fetch courses again with filter
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('userData'));
    
    let url = `${COURSES_ENDPOINT}?instructor_id=${user.id}`;
    
    // Add filter parameters
    switch (filter) {
        case 'active':
            url += '&status=active';
            break;
        case 'archived':
            url += '&status=archived';
            break;
        case 'semester':
            url += '&current_semester=true';
            break;
        // 'all' doesn't need additional parameters
    }
    
    // Show loading state
    document.getElementById('coursesGrid').innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Loading courses...</p>
        </div>
    `;
    
    // Fetch filtered courses
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }
        return response.json();
    })
    .then(coursesData => {
        updateCoursesGrid(coursesData);
    })
    .catch(error => {
        console.error('Error applying filter:', error);
        document.getElementById('coursesGrid').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error loading courses. Please try again later.
                </div>
            </div>
        `;
    });
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