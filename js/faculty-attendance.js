// API endpoints
const API_BASE_URL = '/api';
const COURSES_ENDPOINT = `${API_BASE_URL}/courses`;
const ATTENDANCE_ENDPOINT = `${API_BASE_URL}/attendance`;
const STUDENTS_ENDPOINT = `${API_BASE_URL}/students`;

// DOM Elements
let courseSelect;
let dateInput;
let studentsList;
let attendanceForm;
let loadingIndicator;
let alertContainer;
let statusFilter;
let searchInput;

// Global variables
let currentCourses = [];
let currentStudents = [];
let userData = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize DOM elements
    initializeElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load faculty courses
    loadFacultyCourses();
});

// Check if user is authenticated and is faculty
function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const userType = localStorage.getItem('userType');
    const userDataStr = localStorage.getItem('userData');
    
    if (!token || userType !== 'faculty' || !userDataStr) {
        // Redirect to login page if not authenticated as faculty
        window.location.href = '../login.html';
        return;
    }
    
    try {
        userData = JSON.parse(userDataStr);
        // Update UI with faculty name
        const facultyNameElement = document.getElementById('facultyName');
        if (facultyNameElement && userData.full_name) {
            facultyNameElement.textContent = userData.full_name;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        // Redirect to login page if user data is invalid
        window.location.href = '../login.html';
    }
}

// Initialize DOM elements
function initializeElements() {
    courseSelect = document.getElementById('courseSelect');
    dateInput = document.getElementById('attendanceDate');
    studentsList = document.getElementById('studentsList');
    attendanceForm = document.getElementById('attendanceForm');
    loadingIndicator = document.getElementById('loadingIndicator');
    alertContainer = document.getElementById('alertContainer');
    statusFilter = document.getElementById('statusFilter');
    searchInput = document.getElementById('searchStudent');
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;
}

// Set up event listeners
function setupEventListeners() {
    // Course selection change
    courseSelect.addEventListener('change', function() {
        loadStudentsForCourse(this.value);
    });
    
    // Date selection change
    dateInput.addEventListener('change', function() {
        const selectedCourseId = courseSelect.value;
        if (selectedCourseId) {
            loadStudentsForCourse(selectedCourseId);
        }
    });
    
    // Attendance form submission
    attendanceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveAttendance();
    });
    
    // Status filter change
    statusFilter.addEventListener('change', function() {
        filterStudentsList();
    });
    
    // Search input
    searchInput.addEventListener('input', debounce(function() {
        filterStudentsList();
    }, 300));
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Load faculty courses
async function loadFacultyCourses() {
    showLoading(true);
    
    try {
        // For development/testing - get mock data from localStorage
        let mockResponse = null;
        const mockCoursesStr = localStorage.getItem('mockCourses');
        
        if (mockCoursesStr) {
            try {
                mockResponse = JSON.parse(mockCoursesStr);
                console.log('Using mock course data from localStorage');
            } catch (e) {
                console.error('Error parsing mock courses:', e);
            }
        }
        
        let courses;
        
        // Use mock data if available (for testing), otherwise call the API
        if (mockResponse) {
            courses = mockResponse;
        } else {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${COURSES_ENDPOINT}/faculty/${userData.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            
            courses = await response.json();
        }
        
        // Store courses globally
        currentCourses = courses;
        
        // Update course select dropdown
        updateCourseSelect(courses);
        
        // Load students for the first course if available
        if (courses.length > 0) {
            loadStudentsForCourse(courses[0].id);
        } else {
            showAlert('info', 'No courses assigned to you yet.');
            showLoading(false);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showAlert('danger', 'Failed to load courses. Please try again later.');
        showLoading(false);
    }
}

// Update course select dropdown
function updateCourseSelect(courses) {
    // Clear existing options
    courseSelect.innerHTML = '';
    
    // Add courses to dropdown
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.course_code} - ${course.course_name}`;
        courseSelect.appendChild(option);
    });
}

// Load students for a specific course
async function loadStudentsForCourse(courseId) {
    if (!courseId) return;
    
    showLoading(true);
    studentsList.innerHTML = '';
    
    try {
        const selectedDate = dateInput.value;
        
        // For development/testing - get mock data from localStorage
        let mockStudentsResponse = null;
        let mockAttendanceResponse = null;
        
        const mockStudentsStr = localStorage.getItem('mockStudents');
        const mockAttendanceStr = localStorage.getItem('mockAttendance');
        
        if (mockStudentsStr) {
            try {
                mockStudentsResponse = JSON.parse(mockStudentsStr);
                console.log('Using mock student data from localStorage');
            } catch (e) {
                console.error('Error parsing mock students:', e);
            }
        }
        
        if (mockAttendanceStr) {
            try {
                mockAttendanceResponse = JSON.parse(mockAttendanceStr);
                console.log('Using mock attendance data from localStorage');
            } catch (e) {
                console.error('Error parsing mock attendance:', e);
            }
        }
        
        let students;
        let attendanceData = {};
        
        // Use mock data if available (for testing), otherwise call the API
        if (mockStudentsResponse) {
            students = mockStudentsResponse;
            attendanceData = mockAttendanceResponse || {};
        } else {
            const token = localStorage.getItem('accessToken');
            
            // Fetch students enrolled in the course
            const studentsResponse = await fetch(`${STUDENTS_ENDPOINT}/course/${courseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!studentsResponse.ok) {
                throw new Error('Failed to fetch students');
            }
            
            students = await studentsResponse.json();
            
            // Fetch attendance data for the selected date and course
            const attendanceResponse = await fetch(`${ATTENDANCE_ENDPOINT}/course/${courseId}/date/${selectedDate}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (attendanceResponse.ok) {
                const attendanceRecords = await attendanceResponse.json();
                
                // Convert array to object with student_id as key
                attendanceData = attendanceRecords.reduce((acc, record) => {
                    acc[record.student_id] = {
                        status: record.status,
                        remarks: record.remarks
                    };
                    return acc;
                }, {});
            }
        }
        
        // Store students globally
        currentStudents = students;
        
        // Render students list with attendance data
        renderStudentsList(students, attendanceData);
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('danger', 'Failed to load students. Please try again later.');
        showLoading(false);
    }
}

// Render students list with attendance data
function renderStudentsList(students, attendanceData) {
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
        studentsList.innerHTML = '<div class="alert alert-info">No students enrolled in this course.</div>';
        return;
    }
    
    students.forEach(student => {
        const attendanceRecord = attendanceData[student.id] || { status: 'unmarked', remarks: '' };
        
        const studentItem = document.createElement('div');
        studentItem.className = 'card mb-3 student-item';
        studentItem.dataset.studentId = student.id;
        studentItem.dataset.status = attendanceRecord.status;
        studentItem.dataset.name = student.full_name.toLowerCase();
        studentItem.dataset.rollNumber = student.roll_number.toLowerCase();
        
        studentItem.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h5 class="card-title mb-1">${student.full_name}</h5>
                        <p class="card-text text-muted mb-0">Roll No: ${student.roll_number}</p>
                    </div>
                    <div class="col-md-5">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attendance_${student.id}" id="present_${student.id}" value="present" ${attendanceRecord.status === 'present' ? 'checked' : ''}>
                            <label class="form-check-label" for="present_${student.id}">Present</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attendance_${student.id}" id="late_${student.id}" value="late" ${attendanceRecord.status === 'late' ? 'checked' : ''}>
                            <label class="form-check-label" for="late_${student.id}">Late</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attendance_${student.id}" id="absent_${student.id}" value="absent" ${attendanceRecord.status === 'absent' ? 'checked' : ''}>
                            <label class="form-check-label" for="absent_${student.id}">Absent</label>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <input type="text" class="form-control form-control-sm" placeholder="Remarks" name="remarks_${student.id}" value="${attendanceRecord.remarks || ''}">
                    </div>
                </div>
            </div>
        `;
        
        studentsList.appendChild(studentItem);
    });
    
    // Apply initial filters
    filterStudentsList();
}

// Save attendance data
async function saveAttendance() {
    showLoading(true);
    
    try {
        const courseId = courseSelect.value;
        const attendanceDate = dateInput.value;
        const attendanceRecords = [];
        
        // Collect attendance data from the form
        currentStudents.forEach(student => {
            const statusRadios = document.getElementsByName(`attendance_${student.id}`);
            let status = 'unmarked';
            
            for (const radio of statusRadios) {
                if (radio.checked) {
                    status = radio.value;
                    break;
                }
            }
            
            const remarks = document.getElementsByName(`remarks_${student.id}`)[0].value;
            
            if (status !== 'unmarked') {
                attendanceRecords.push({
                    student_id: student.id,
                    course_id: courseId,
                    date: attendanceDate,
                    status: status,
                    remarks: remarks,
                    marked_by: userData.id
                });
            }
        });
        
        if (attendanceRecords.length === 0) {
            showAlert('warning', 'No attendance records to save.');
            showLoading(false);
            return;
        }
        
        // For development/testing - simulate API response
        let mockResponse = { success: true, message: 'Attendance saved successfully' };
        
        // Use mock data if available (for testing), otherwise call the API
        if (localStorage.getItem('mockStudents')) {
            console.log('Using mock response for testing');
            console.log('Attendance records to save:', attendanceRecords);
            
            // Update mock attendance data in localStorage
            const updatedAttendance = {};
            attendanceRecords.forEach(record => {
                updatedAttendance[record.student_id] = {
                    status: record.status,
                    remarks: record.remarks
                };
            });
            
            localStorage.setItem('mockAttendance', JSON.stringify(updatedAttendance));
            
            // Reload students to reflect changes
            setTimeout(() => {
                showAlert('success', 'Attendance saved successfully.');
                loadStudentsForCourse(courseId);
            }, 1000);
        } else {
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch(ATTENDANCE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records: attendanceRecords })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save attendance');
            }
            
            const data = await response.json();
            
            showAlert('success', data.message || 'Attendance saved successfully.');
            
            // Reload students to reflect changes
            loadStudentsForCourse(courseId);
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        showAlert('danger', 'Failed to save attendance. Please try again later.');
        showLoading(false);
    }
}

// Filter students list based on status and search
function filterStudentsList() {
    const statusValue = statusFilter.value;
    const searchValue = searchInput.value.toLowerCase().trim();
    
    const studentItems = document.querySelectorAll('.student-item');
    
    studentItems.forEach(item => {
        const status = item.dataset.status;
        const name = item.dataset.name;
        const rollNumber = item.dataset.rollNumber;
        
        const statusMatch = statusValue === 'all' || status === statusValue;
        const searchMatch = searchValue === '' || 
                           name.includes(searchValue) || 
                           rollNumber.includes(searchValue);
        
        if (statusMatch && searchMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show message if no results
    const visibleItems = document.querySelectorAll('.student-item[style="display: block"]');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (visibleItems.length === 0 && studentItems.length > 0) {
        if (!noResultsMessage) {
            const message = document.createElement('div');
            message.id = 'noResultsMessage';
            message.className = 'alert alert-info';
            message.textContent = 'No students match the current filters.';
            studentsList.appendChild(message);
        }
    } else if (noResultsMessage) {
        noResultsMessage.remove();
    }
}

// Show loading indicator
function showLoading(isLoading) {
    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
}

// Show alert message
function showAlert(type, message) {
    if (!alertContainer) return;
    
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
        const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        if (alert) {
            alert.close();
        } else {
            alertDiv.remove();
        }
    }, 5000);
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