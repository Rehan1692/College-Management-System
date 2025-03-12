// API endpoints
const API_BASE_URL = '/api';
const ATTENDANCE_ENDPOINT = `${API_BASE_URL}/attendance`;
const COURSES_ENDPOINT = `${API_BASE_URL}/courses`;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeAttendance();
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

// Initialize attendance data
async function initializeAttendance() {
    try {
        // Show loading state
        document.getElementById('attendanceTable').innerHTML = '<tr><td colspan="6" class="text-center">Loading attendance data...</td></tr>';
        
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
        
        // Fetch attendance data for the student
        const attendanceResponse = await fetch(`${ATTENDANCE_ENDPOINT}/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!attendanceResponse.ok) {
            throw new Error('Failed to fetch attendance data');
        }
        
        const attendanceData = await attendanceResponse.json();
        updateAttendanceDisplay(attendanceData);
        
        // Set up event listeners for filters
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing attendance:', error);
        document.getElementById('attendanceTable').innerHTML = 
            '<tr><td colspan="6" class="text-center text-danger">Error loading attendance data. Please try again later.</td></tr>';
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

// Update attendance display with data
function updateAttendanceDisplay(data) {
    updateAttendanceSummary(data);
    updateAttendanceTable(data);
}

// Update attendance summary statistics
function updateAttendanceSummary(data) {
    // Calculate statistics
    const totalClasses = data.length;
    const present = data.filter(record => record.status === 'present').length;
    const absent = data.filter(record => record.status === 'absent').length;
    const late = data.filter(record => record.status === 'late').length;
    
    // Update the DOM
    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('lateCount').textContent = late;
    
    // Calculate and update attendance percentage
    const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
    document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;
    document.getElementById('attendanceProgress').style.width = `${attendancePercentage}%`;
}

// Update attendance table with data
function updateAttendanceTable(data) {
    const tableBody = document.getElementById('attendanceTable');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No attendance records found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    data.forEach(record => {
        const row = document.createElement('tr');
        
        // Format the date
        const formattedDate = formatDate(record.date);
        
        // Create status badge
        const statusBadge = `<span class="attendance-status status-${record.status}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${record.course}</td>
            <td>${statusBadge}</td>
            <td>${record.timeIn}</td>
            <td>${record.timeOut}</td>
            <td>${record.remarks || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Set up event listeners for filters
function setupEventListeners() {
    const courseFilter = document.getElementById('courseFilter');
    const dateFilter = document.getElementById('dateFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    const filterAttendance = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const user = JSON.parse(localStorage.getItem('userData'));
            
            // Build query parameters
            const params = new URLSearchParams();
            if (courseFilter.value !== 'all') params.append('course_id', courseFilter.value);
            if (dateFilter.value) params.append('date', dateFilter.value);
            if (statusFilter.value !== 'all') params.append('status', statusFilter.value);
            
            // Fetch filtered attendance data
            const url = `${ATTENDANCE_ENDPOINT}/${user.id}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch filtered attendance data');
            }
            
            const data = await response.json();
            updateAttendanceDisplay(data);
        } catch (error) {
            console.error('Error filtering attendance:', error);
        }
    };
    
    courseFilter.addEventListener('change', filterAttendance);
    dateFilter.addEventListener('change', filterAttendance);
    statusFilter.addEventListener('change', filterAttendance);
}

// Format date to a more readable format
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Logout function
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = '../login.html';
} 