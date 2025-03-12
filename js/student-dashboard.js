// API endpoints
const API_BASE_URL = 'http://localhost/backend';
const PROFILE_ENDPOINT = `${API_BASE_URL}/users/student-data.php`;
const COURSES_ENDPOINT = `${API_BASE_URL}/courses/student-courses.php`;
const ACTIVITIES_ENDPOINT = `${API_BASE_URL}/users/student-activities.php`;
const NOTICES_ENDPOINT = `${API_BASE_URL}/notices/student-notices.php`;
const DEADLINES_ENDPOINT = `${API_BASE_URL}/courses/deadlines.php`;

// Mock data for testing
const MOCK_DATA = {
    profile: {
        id: 1,
        full_name: 'Alice Cooper',
        email: 'alice@college.edu',
        roll_number: 'CS2023001',
        semester: 3,
        department: 'Computer Science',
        admission_year: 2023
    },
    courses: [
        {
            id: 1,
            code: 'CS301',
            name: 'Data Structures',
            instructor: 'Dr. John Smith',
            progress: 75.50,
            attendance: 85.00,
            grade_point: 3.70
        },
        {
            id: 2,
            code: 'CS302',
            name: 'Database Systems',
            instructor: 'Dr. Sarah Johnson',
            progress: 68.25,
            attendance: 90.00,
            grade_point: 3.50
        },
        {
            id: 3,
            code: 'CS303',
            name: 'Web Development',
            instructor: 'Dr. Michael Brown',
            progress: 82.00,
            attendance: 88.00,
            grade_point: 4.00
        },
        {
            id: 4,
            code: 'MTH301',
            name: 'Applied Mathematics',
            instructor: 'Dr. Emily Davis',
            progress: 70.75,
            attendance: 92.00,
            grade_point: 3.30
        }
    ],
    activities: [
        {
            id: 1,
            title: 'Math Practice',
            description: 'Completed practice problems for calculus',
            activity_type: 'practice',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            course_code: 'MTH301',
            course_name: 'Applied Mathematics'
        },
        {
            id: 2,
            title: 'Code Review',
            description: 'Participated in peer code review session',
            activity_type: 'collaboration',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            course_code: 'CS303',
            course_name: 'Web Development'
        },
        {
            id: 3,
            title: 'Database Design',
            description: 'Created ERD for semester project',
            activity_type: 'project',
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
            course_code: 'CS302',
            course_name: 'Database Systems'
        },
        {
            id: 4,
            title: 'Algorithm Analysis',
            description: 'Completed complexity analysis assignment',
            activity_type: 'assignment',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            course_code: 'CS301',
            course_name: 'Data Structures'
        },
        {
            id: 5,
            title: 'Study Group',
            description: 'Attended database study group session',
            activity_type: 'study',
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
            course_code: 'CS302',
            course_name: 'Database Systems'
        }
    ],
    notices: [
        {
            id: 1,
            title: 'Mid-Term Exam Schedule',
            content: 'Mid-term examinations will begin from next week. Check detailed schedule on notice board.',
            posted_by: 'Prof. John Smith',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
            id: 2,
            title: 'CS Department Meeting',
            content: 'All CS students are required to attend department meeting on Friday.',
            posted_by: 'Dr. Sarah Johnson',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
            id: 3,
            title: 'Web Development Workshop',
            content: 'Special workshop on React.js this weekend.',
            posted_by: 'Dr. Michael Brown',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
            id: 4,
            title: 'Semester Registration',
            content: 'Complete your semester registration by next week.',
            posted_by: 'Prof. John Smith',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        },
        {
            id: 5,
            title: 'Holiday Notice',
            content: 'College will remain closed for annual function next Monday.',
            posted_by: 'Prof. John Smith',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
    ],
    deadlines: [
        {
            id: 1,
            title: 'DS Assignment 3',
            description: 'Implementation of Graph Algorithms',
            course_code: 'CS301',
            course_name: 'Data Structures',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            type: 'assignment'
        },
        {
            id: 2,
            title: 'Database Project',
            description: 'Final Project Submission',
            course_code: 'CS302',
            course_name: 'Database Systems',
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            type: 'project'
        },
        {
            id: 3,
            title: 'Web App Demo',
            description: 'Live demonstration of web application',
            course_code: 'CS303',
            course_name: 'Web Development',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            type: 'presentation'
        },
        {
            id: 4,
            title: 'Math Quiz',
            description: 'Quiz on Linear Algebra',
            course_code: 'MTH301',
            course_name: 'Applied Mathematics',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            type: 'quiz'
        }
    ]
};

// Global variables
let profile = {};
let courses = [];
let activities = [];
let notices = [];
let deadlines = [];
let lastNoticeCheck = 0; // Track when we last checked for notices

// Initialize dashboard
async function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    if (!checkAuth()) {
        return;
    }

    try {
        // Try to load data from API first
        const apiData = await loadDataFromAPI();
        if (apiData) {
            updateDashboardWithData(apiData);
        } else {
            // Fallback to mock data if API fails
            console.log('Using mock data...');
            updateDashboardWithData(MOCK_DATA);
        }
        
        // Set the last notice check time
        lastNoticeCheck = Date.now();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Fallback to mock data on error
        console.log('Using mock data due to error...');
        updateDashboardWithData(MOCK_DATA);
        
        // Set the last notice check time
        lastNoticeCheck = Date.now();
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

// Load data from API
async function loadDataFromAPI() {
    try {
        const [profile, coursesData, activitiesData, noticesData, deadlinesData] = await Promise.all([
            fetchData(PROFILE_ENDPOINT),
            fetchData(COURSES_ENDPOINT),
            fetchData(ACTIVITIES_ENDPOINT),
            fetchData(NOTICES_ENDPOINT),
            fetchData(DEADLINES_ENDPOINT)
        ]);

        if (profile && coursesData && activitiesData && noticesData && deadlinesData) {
            return {
                profile,
                courses: coursesData,
                activities: activitiesData,
                notices: noticesData,
                deadlines: deadlinesData
            };
        }
        return null;
    } catch (error) {
        console.error('Error loading API data:', error);
        return null;
    }
}

// Fetch data from endpoint
async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        return null;
    }
}

// Update dashboard with data
function updateDashboardWithData(data) {
    profile = data.profile;
    courses = data.courses;
    activities = data.activities;
    
    // Use shared notices from localStorage if available
    const sharedNotices = localStorage.getItem('notices');
    if (sharedNotices) {
        try {
            notices = JSON.parse(sharedNotices);
            console.log('Loaded notices from shared localStorage:', notices);
            
            // If no notices found, try to load from mockNotices as a fallback
            if (!notices || notices.length === 0) {
                const mockNoticesStr = localStorage.getItem('mockNotices');
                if (mockNoticesStr) {
                    const mockNotices = JSON.parse(mockNoticesStr);
                    if (mockNotices && mockNotices.length > 0) {
                        notices = mockNotices;
                        console.log('Loaded notices from mockNotices as fallback:', notices);
                        
                        // Save these to the shared notices for future use
                        localStorage.setItem('notices', JSON.stringify(mockNotices));
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing shared notices:', e);
            notices = data.notices; // Fallback to mock notices
        }
    } else {
        // No shared notices found, try mockNotices
        const mockNoticesStr = localStorage.getItem('mockNotices');
        if (mockNoticesStr) {
            try {
                const mockNotices = JSON.parse(mockNoticesStr);
                notices = mockNotices;
                console.log('Loaded notices from mockNotices:', notices);
                
                // Save these to the shared notices for future use
                localStorage.setItem('notices', JSON.stringify(mockNotices));
            } catch (e) {
                console.error('Error parsing mock notices:', e);
                notices = data.notices; // Fallback to mock notices from data
            }
        } else {
            notices = data.notices; // Fallback to mock notices from data
        }
    }
    
    deadlines = data.deadlines;

    updateStats();
    updateCoursesTable();
    updateActivitiesList();
    updateDeadlinesList();
    updateNoticesList();
}

// Update statistics
function updateStats() {
    // Update attendance percentage
    const attendancePercentage = calculateAttendancePercentage();
    document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;

    // Update CGPA
    const cgpa = calculateCGPA();
    document.getElementById('cgpaValue').textContent = cgpa.toFixed(2);

    // Update courses count
    document.getElementById('coursesCount').textContent = courses.length;

    // Update pending tasks
    const pendingTasks = deadlines.filter(deadline => 
        new Date(deadline.due_date) > new Date()
    ).length;
    document.getElementById('pendingTasks').textContent = pendingTasks;
}

// Update courses table
function updateCoursesTable() {
    const tableBody = document.querySelector('#coursesTable tbody');
    tableBody.innerHTML = '';

    courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${course.instructor}</td>
            <td>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${course.progress}%" 
                         aria-valuenow="${course.progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${course.progress}%
                    </div>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update activities list
function updateActivitiesList() {
    const activitiesList = document.getElementById('activitiesList');
    activitiesList.innerHTML = '';

    activities.slice(0, 5).forEach(activity => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${activity.title}</h6>
                <small>${formatDate(activity.timestamp)}</small>
            </div>
            <p class="mb-1">${activity.description}</p>
            <small>${activity.course_code} - ${activity.course_name}</small>
        `;
        activitiesList.appendChild(item);
    });
}

// Update deadlines list
function updateDeadlinesList() {
    const deadlinesList = document.getElementById('deadlinesList');
    deadlinesList.innerHTML = '';

    deadlines.slice(0, 5).forEach(deadline => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        const dueDate = new Date(deadline.due_date);
        const isOverdue = dueDate < new Date();

        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${deadline.title}</h6>
                <small class="${isOverdue ? 'text-danger' : 'text-muted'}">
                    Due: ${formatDate(deadline.due_date)}
                </small>
            </div>
            <p class="mb-1">${deadline.description}</p>
            <small>${deadline.course_code} - ${deadline.course_name}</small>
        `;
        deadlinesList.appendChild(item);
    });
}

// Update notices list
function updateNoticesList() {
    const noticesList = document.getElementById('noticesList');
    noticesList.innerHTML = '';

    if (!notices || notices.length === 0) {
        noticesList.innerHTML = '<div class="text-center p-3">No notices available</div>';
        return;
    }

    notices.slice(0, 5).forEach(notice => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        
        // Handle different notice formats (from shared notices vs mock notices)
        const noticeDate = notice.date || notice.created_at || new Date().toISOString();
        const noticePostedBy = notice.posted_by || notice.created_by_name || 'Faculty';
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${notice.title}</h6>
                <small>${formatDate(noticeDate)}</small>
            </div>
            <p class="mb-1">${notice.content}</p>
            <small>Posted by: ${noticePostedBy}</small>
        `;
        noticesList.appendChild(item);
    });
}

// Utility functions
function calculateAttendancePercentage() {
    if (!courses.length) return 0;
    const totalAttendance = courses.reduce((sum, course) => sum + (course.attendance || 0), 0);
    return Math.round(totalAttendance / courses.length);
}

function calculateCGPA() {
    if (!courses.length) return 0;
    const totalGradePoints = courses.reduce((sum, course) => sum + (course.grade_point || 0), 0);
    return totalGradePoints / courses.length;
}

function formatDate(dateString) {
    try {
        // Handle different date formats
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date format:', dateString);
            return 'Unknown date';
        }
        
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString; // Return original string if formatting fails
    }
}

// Handle logout
function logout() {
    localStorage.clear();
    window.location.href = '../login.html';
}

// Function to check for new notices
function checkForNewNotices() {
    try {
        let hasNewNotices = false;
        let newNoticesCount = 0;
        let updatedNotices = [];
        
        // Check shared notices first
        const sharedNoticesStr = localStorage.getItem('notices');
        if (sharedNoticesStr) {
            const parsedNotices = JSON.parse(sharedNoticesStr);
            
            // Check if there are new notices by comparing with our current notices
            if (parsedNotices.length !== notices.length) {
                newNoticesCount = parsedNotices.length - notices.length;
                hasNewNotices = true;
                updatedNotices = parsedNotices;
            } else {
                // Check if any notice has a newer timestamp than our last check
                for (const notice of parsedNotices) {
                    const noticeDate = new Date(notice.created_at || notice.date).getTime();
                    if (noticeDate > lastNoticeCheck) {
                        newNoticesCount++;
                        hasNewNotices = true;
                    }
                }
                
                if (hasNewNotices) {
                    updatedNotices = parsedNotices;
                }
            }
        }
        
        // If no new notices found in shared notices, check mockNotices
        if (!hasNewNotices) {
            const mockNoticesStr = localStorage.getItem('mockNotices');
            if (mockNoticesStr) {
                const parsedMockNotices = JSON.parse(mockNoticesStr);
                
                // Check if there are new notices in mockNotices
                if (parsedMockNotices.length > notices.length) {
                    newNoticesCount = parsedMockNotices.length - notices.length;
                    hasNewNotices = true;
                    updatedNotices = parsedMockNotices;
                    
                    // Sync with shared notices
                    localStorage.setItem('notices', JSON.stringify(parsedMockNotices));
                    console.log('Synced mockNotices to shared notices');
                }
            }
        }
        
        // If we have new notices, update the display
        if (hasNewNotices && updatedNotices.length > 0) {
            console.log('New notices detected, updating display...');
            notices = updatedNotices;
            updateNoticesList();
            lastNoticeCheck = Date.now();
            
            // Show notification to the user
            showNotification(`${newNoticesCount} new notice${newNoticesCount > 1 ? 's' : ''} available!`);
            return true;
        }
        
        return false;
    } catch (e) {
        console.error('Error checking for new notices:', e);
        return false;
    }
}

// Function to show a notification to the user
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
    notification.style.top = '70px';
    notification.style.right = '20px';
    notification.style.zIndex = '1050';
    notification.style.maxWidth = '300px';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 150);
    }, 5000);
}

// Debug function to check notices in localStorage
function debugNotices() {
    try {
        console.log('===== NOTICES DEBUG =====');
        
        // Check notices in localStorage
        const noticesStr = localStorage.getItem('notices');
        if (noticesStr) {
            const parsedNotices = JSON.parse(noticesStr);
            console.log(`Found ${parsedNotices.length} notices in localStorage:`);
            parsedNotices.forEach((notice, index) => {
                console.log(`Notice ${index + 1}:`, notice);
            });
        } else {
            console.log('No notices found in localStorage');
        }
        
        // Check mock notices
        const mockNoticesStr = localStorage.getItem('mockNotices');
        if (mockNoticesStr) {
            const parsedMockNotices = JSON.parse(mockNoticesStr);
            console.log(`Found ${parsedMockNotices.length} mock notices in localStorage`);
        } else {
            console.log('No mock notices found in localStorage');
        }
        
        // Check current notices in memory
        console.log(`Current notices in memory: ${notices.length}`);
        
        console.log('========================');
    } catch (e) {
        console.error('Error in debugNotices:', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Student dashboard initializing...');
    
    // Initialize dashboard
    initializeDashboard();
    
    // Force sync notices from mockNotices to ensure we have the latest data
    setTimeout(forceSyncNotices, 1000);
    
    // Check for new notices every 30 seconds
    setInterval(checkForNewNotices, 30000);
    
    // Run debug function after initialization
    setTimeout(debugNotices, 2000);
    
    // Add event listener for refresh notices button
    const refreshNoticesBtn = document.getElementById('refreshNoticesBtn');
    if (refreshNoticesBtn) {
        refreshNoticesBtn.addEventListener('click', () => {
            // Show loading indicator on the button
            refreshNoticesBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Refreshing...';
            refreshNoticesBtn.disabled = true;
            
            // Force sync notices from mockNotices
            forceSyncNotices();
            
            // Force check for new notices
            const noticesUpdated = checkForNewNotices();
            
            // Reset button after a short delay
            setTimeout(() => {
                refreshNoticesBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
                refreshNoticesBtn.disabled = false;
                
                // Show a confirmation message
                showNotification('Notices refreshed!');
            }, 1000);
        });
    }
});

// Force sync notices from mockNotices
function forceSyncNotices() {
    try {
        console.log('Forcing sync of notices from mockNotices...');
        
        // Get mockNotices
        const mockNoticesStr = localStorage.getItem('mockNotices');
        if (mockNoticesStr) {
            const mockNotices = JSON.parse(mockNoticesStr);
            
            // Get shared notices
            const noticesStr = localStorage.getItem('notices');
            const existingNotices = noticesStr ? JSON.parse(noticesStr) : [];
            
            // Create a map of existing notice IDs for quick lookup
            const existingNoticeIds = new Set(existingNotices.map(notice => notice.id));
            
            // Add any mockNotices that aren't in shared notices
            let newNoticesAdded = false;
            for (const mockNotice of mockNotices) {
                if (!existingNoticeIds.has(mockNotice.id)) {
                    existingNotices.push(mockNotice);
                    newNoticesAdded = true;
                }
            }
            
            // If we added new notices, update shared notices
            if (newNoticesAdded) {
                localStorage.setItem('notices', JSON.stringify(existingNotices));
                console.log('Added new notices from mockNotices to shared notices');
                
                // Update our notices and refresh the display
                notices = existingNotices;
                updateNoticesList();
            }
        }
    } catch (e) {
        console.error('Error forcing sync of notices:', e);
    }
}

// Refresh all data periodically (every 5 minutes)
setInterval(initializeDashboard, 300000); 