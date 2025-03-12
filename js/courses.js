// API endpoints
const API_BASE_URL = 'http://localhost/backend';
const COURSES_ENDPOINT = `${API_BASE_URL}/courses/student-courses.php`;
const COURSE_DETAILS_ENDPOINT = `${API_BASE_URL}/courses/course-details.php`;

// Mock data for testing
const MOCK_COURSES = {
    courses: [
        {
            id: 1,
            code: 'CS301',
            name: 'Data Structures',
            instructor: 'Dr. John Smith',
            department: 'CS',
            semester: 3,
            credits: 4,
            description: 'Advanced data structures and algorithms, including trees, graphs, and hash tables.',
            progress: 75,
            status: 'active',
            materials: [
                { name: 'Lecture Notes Week 1', url: '#' },
                { name: 'Assignment 1', url: '#' },
                { name: 'Practice Problems', url: '#' }
            ]
        },
        {
            id: 2,
            code: 'CS302',
            name: 'Database Systems',
            instructor: 'Dr. Sarah Johnson',
            department: 'CS',
            semester: 3,
            credits: 4,
            description: 'Introduction to database design, SQL, and database management systems.',
            progress: 68,
            status: 'active',
            materials: [
                { name: 'SQL Basics', url: '#' },
                { name: 'ERD Examples', url: '#' }
            ]
        },
        {
            id: 3,
            code: 'MTH301',
            name: 'Applied Mathematics',
            instructor: 'Dr. Emily Davis',
            department: 'MTH',
            semester: 3,
            credits: 3,
            description: 'Applications of calculus and linear algebra in real-world problems.',
            progress: 82,
            status: 'active',
            materials: [
                { name: 'Practice Problems Set 1', url: '#' },
                { name: 'Midterm Review', url: '#' }
            ]
        },
        {
            id: 4,
            code: 'PHY201',
            name: 'Classical Mechanics',
            instructor: 'Dr. Robert Wilson',
            department: 'PHY',
            semester: 2,
            credits: 4,
            description: 'Fundamentals of classical mechanics and Newton\'s laws of motion.',
            progress: 100,
            status: 'completed',
            materials: [
                { name: 'Chapter 1 Notes', url: '#' },
                { name: 'Lab Manual', url: '#' }
            ]
        }
    ]
};

// Global variables
let courses = [];
let currentFilters = {
    semester: '',
    department: '',
    status: ''
};

// Initialize courses page
async function initializeCourses() {
    if (!checkAuth()) {
        return;
    }

    try {
        // Load courses data (using mock data for now)
        const coursesData = MOCK_COURSES;
        updateCoursesDisplay(coursesData);

        // Add event listeners for filters
        document.getElementById('semesterFilter').addEventListener('change', () => filterCourses());
        document.getElementById('departmentFilter').addEventListener('change', () => filterCourses());
        document.getElementById('statusFilter').addEventListener('change', () => filterCourses());
    } catch (error) {
        console.error('Error initializing courses:', error);
        showAlert('Error', 'Failed to load courses data');
    }
}

// Check authentication
function checkAuth() {
    const accessToken = localStorage.getItem('accessToken');
    const userType = localStorage.getItem('userType');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (!accessToken || userType !== 'student') {
        window.location.href = '../login.html';
        return false;
    }

    // Update student name in navbar
    const studentName = document.getElementById('studentName');
    if (studentName && userData.full_name) {
        studentName.textContent = `Welcome, ${userData.full_name}`;
    }

    return true;
}

// Update courses display
function updateCoursesDisplay(data) {
    const courseGrid = document.getElementById('courseGrid');
    courseGrid.innerHTML = '';

    data.courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="course-card">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${course.code}</h6>
                    <p class="card-text">${course.description.substring(0, 100)}...</p>
                    <div class="mb-3">
                        <small class="text-muted">Instructor: ${course.instructor}</small>
                    </div>
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" style="width: ${course.progress}%"
                             aria-valuenow="${course.progress}" aria-valuemin="0" aria-valuemax="100">
                            ${course.progress}%
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="viewCourseDetails(${course.id})">
                        View Details
                    </button>
                </div>
            </div>
        `;
        courseGrid.appendChild(card);
    });
}

// Filter courses
function filterCourses() {
    const semester = document.getElementById('semesterFilter').value;
    const department = document.getElementById('departmentFilter').value;
    const status = document.getElementById('statusFilter').value;

    let filteredCourses = MOCK_COURSES.courses.filter(course => {
        return (semester === 'all' || course.semester === parseInt(semester)) &&
               (department === 'all' || course.department === department) &&
               (status === 'all' || course.status === status);
    });

    updateCoursesDisplay({ courses: filteredCourses });
}

// View course details
function viewCourseDetails(courseId) {
    const course = MOCK_COURSES.courses.find(c => c.id === courseId);
    if (!course) return;

    // Update modal content
    document.getElementById('modalCourseCode').textContent = course.code;
    document.getElementById('modalInstructor').textContent = course.instructor;
    document.getElementById('modalCredits').textContent = course.credits;
    document.getElementById('modalDepartment').textContent = course.department;
    document.getElementById('modalSemester').textContent = `Semester ${course.semester}`;
    document.getElementById('modalStatus').textContent = course.status.charAt(0).toUpperCase() + course.status.slice(1);
    document.getElementById('modalDescription').textContent = course.description;
    
    // Update progress bar
    const progressBar = document.getElementById('modalProgress');
    progressBar.style.width = `${course.progress}%`;
    progressBar.setAttribute('aria-valuenow', course.progress);
    progressBar.textContent = `${course.progress}%`;

    // Update materials list
    const materialsList = document.getElementById('modalMaterials');
    materialsList.innerHTML = course.materials.map(material => `
        <li class="list-group-item">
            <a href="${material.url}" target="_blank">${material.name}</a>
        </li>
    `).join('');

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('courseModal'));
    modal.show();
}

// Logout function
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = '../login.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeCourses); 