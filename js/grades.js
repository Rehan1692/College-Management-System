// API endpoints
const API_BASE_URL = 'http://localhost/backend';
const GRADES_ENDPOINT = `${API_BASE_URL}/grades/get_grades.php`;

// Mock data for testing
const MOCK_GRADES = {
    grades: [
        {
            course_code: 'CS301',
            course_name: 'Data Structures',
            credits: 4,
            grade: 'A',
            grade_points: 4.0,
            semester: 3
        },
        {
            course_code: 'CS302',
            course_name: 'Database Systems',
            credits: 4,
            grade: 'A-',
            grade_points: 3.7,
            semester: 3
        },
        {
            course_code: 'CS303',
            course_name: 'Web Development',
            credits: 3,
            grade: 'A+',
            grade_points: 4.0,
            semester: 3
        },
        {
            course_code: 'MTH301',
            course_name: 'Applied Mathematics',
            credits: 3,
            grade: 'B+',
            grade_points: 3.3,
            semester: 3
        }
    ]
};

// Global variables
let grades = [];
let currentSemester = '';

// Initialize grades page
async function initializeGrades() {
    if (!checkAuth()) {
        return;
    }

    try {
        // Load grades data (using mock data for now)
        const gradesData = MOCK_GRADES;
        updateGradesDisplay(gradesData);

        // Add event listener for semester filter
        document.getElementById('semesterSelect').addEventListener('change', function() {
            updateGradesDisplay(gradesData);
        });
    } catch (error) {
        console.error('Error initializing grades:', error);
        showAlert('Error', 'Failed to load grades data');
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

// Update grades display
function updateGradesDisplay(data) {
    const selectedSemester = document.getElementById('semesterSelect').value;
    const filteredGrades = selectedSemester === 'all' 
        ? data.grades 
        : data.grades.filter(grade => grade.semester === parseInt(selectedSemester));

    // Update summary statistics
    updateGradesSummary(filteredGrades);

    // Update grades table
    const tableBody = document.getElementById('gradesTableBody');
    tableBody.innerHTML = '';

    filteredGrades.forEach(grade => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${grade.course_code}</td>
            <td>${grade.course_name}</td>
            <td>${grade.credits}</td>
            <td>${grade.grade}</td>
            <td>${grade.grade_points.toFixed(2)}</td>
            <td>${grade.semester}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Update grades summary
function updateGradesSummary(grades) {
    // Calculate CGPA
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.grade_points * grade.credits), 0);
    const totalCredits = grades.reduce((sum, grade) => sum + grade.credits, 0);
    const cgpa = totalPoints / totalCredits;

    // Update summary cards
    document.getElementById('cgpa').textContent = cgpa.toFixed(2);
    document.getElementById('totalCredits').textContent = totalCredits;
    document.getElementById('completedCourses').textContent = grades.length;
}

// Logout function
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = '../login.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeGrades); 