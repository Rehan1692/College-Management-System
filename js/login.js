// API endpoints
const API_BASE_URL = '/api';
const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;
const REGISTER_ENDPOINT = `${API_BASE_URL}/auth/register`;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Clear any existing authentication data to ensure a fresh login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    
    console.log('Login page initialized, authentication data cleared');
    
    // Initialize login tabs
    initializeLoginTabs();
    
    // Add password validation listeners
    ['student', 'faculty'].forEach(type => {
        const password = document.getElementById(`${type}RegPassword`);
        const confirmPassword = document.getElementById(`${type}RegConfirmPassword`);
        
        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                if (password.value !== confirmPassword.value) {
                    confirmPassword.setCustomValidity('Passwords do not match');
                } else {
                    confirmPassword.setCustomValidity('');
                }
            });
        }
    });
    
    // Pre-fill test credentials for development
    document.getElementById('facultyEmail').value = 'faculty@test.com';
    document.getElementById('facultyPassword').value = 'password';
    document.getElementById('studentEmail').value = 'student@test.com';
    document.getElementById('studentPassword').value = 'password';
    
    // Display test credentials for development
    console.log('Test credentials:');
    console.log('Faculty: faculty@test.com / password');
    console.log('Student: student@test.com / password');
    
    // Initialize alert container
    if (!document.getElementById('alertContainer')) {
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            const alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            loginContainer.prepend(alertContainer);
        }
    }
    
    // Check if redirected from logout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
        showAlert('info', 'You have been successfully logged out.');
    }
});

// Mock data for testing
const MOCK_COURSES = [
    { id: 'c1', course_code: 'CS101', course_name: 'Introduction to Computer Science', semester: 1 },
    { id: 'c2', course_code: 'CS201', course_name: 'Data Structures', semester: 3 },
    { id: 'c3', course_code: 'CS301', course_name: 'Database Systems', semester: 5 },
    { id: 'c4', course_code: 'CS401', course_name: 'Software Engineering', semester: 7 }
];

const MOCK_STUDENTS = [
    { id: 's1', full_name: 'John Doe', roll_number: 'CS2023001', email: 'john@example.com' },
    { id: 's2', full_name: 'Jane Smith', roll_number: 'CS2023002', email: 'jane@example.com' },
    { id: 's3', full_name: 'Bob Johnson', roll_number: 'CS2023003', email: 'bob@example.com' },
    { id: 's4', full_name: 'Alice Brown', roll_number: 'CS2023004', email: 'alice@example.com' },
    { id: 's5', full_name: 'Charlie Wilson', roll_number: 'CS2023005', email: 'charlie@example.com' }
];

const MOCK_ATTENDANCE = {
    's1': { status: 'present', remarks: 'On time' },
    's2': { status: 'absent', remarks: 'Informed absence' },
    's3': { status: 'late', remarks: 'Arrived 15 minutes late' }
};

const MOCK_ASSIGNMENTS = [
    { 
        id: 'a1', 
        title: 'Introduction to Programming', 
        description: 'Write a simple program to demonstrate variables and control structures',
        course_id: 'c1',
        due_date: '2023-12-15',
        max_score: 100,
        status: 'active'
    },
    { 
        id: 'a2', 
        title: 'Data Structures Implementation', 
        description: 'Implement a linked list and demonstrate its operations',
        course_id: 'c2',
        due_date: '2023-12-20',
        max_score: 100,
        status: 'active'
    },
    { 
        id: 'a3', 
        title: 'Database Design', 
        description: 'Design a database schema for a library management system',
        course_id: 'c3',
        due_date: '2023-12-25',
        max_score: 100,
        status: 'active'
    }
];

const MOCK_NOTICES = [
    {
        id: 'n1',
        title: 'End of Semester Exams',
        content: 'End of semester exams will begin from January 15, 2024. Please check the exam schedule.',
        created_at: '2023-12-01',
        priority: 'high',
        type: 'academic',
        created_by: 'f123'
    },
    {
        id: 'n2',
        title: 'Holiday Notice',
        content: 'The college will remain closed from December 25 to January 1 for winter break.',
        created_at: '2023-12-05',
        priority: 'medium',
        type: 'general',
        created_by: 'f123'
    },
    {
        id: 'n3',
        title: 'Workshop on AI',
        content: 'A workshop on Artificial Intelligence will be conducted on December 20, 2023. Interested students can register.',
        created_at: '2023-12-10',
        priority: 'low',
        type: 'event',
        created_by: 'f123'
    }
];

// Handle login form submission
function handleLogin(userType) {
    try {
        console.log('Starting login process for:', userType);
        
        const email = document.getElementById(`${userType}Email`).value;
        const password = document.getElementById(`${userType}Password`).value;

        // Show loading state
        const submitButton = document.querySelector(`#${userType}LoginForm button[type="submit"]`);
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = 'Logging in...';

        // For development/testing - simulate API response
        let mockResponse = null;
        
        if (email === 'faculty@test.com' && password === 'password') {
            mockResponse = {
                token: 'mock-faculty-token',
                user: {
                    id: 'f123',
                    full_name: 'Test Faculty',
                    email: email,
                    type: 'faculty',
                    department: 'Computer Science'
                }
            };
            
            // Store mock data in localStorage for testing
            localStorage.setItem('mockCourses', JSON.stringify(MOCK_COURSES));
            localStorage.setItem('mockStudents', JSON.stringify(MOCK_STUDENTS));
            localStorage.setItem('mockAttendance', JSON.stringify(MOCK_ATTENDANCE));
            localStorage.setItem('mockAssignments', JSON.stringify(MOCK_ASSIGNMENTS));
            localStorage.setItem('mockNotices', JSON.stringify(MOCK_NOTICES));
            
            // Store authentication data
            localStorage.setItem('accessToken', mockResponse.token);
            localStorage.setItem('userType', mockResponse.user.type);
            localStorage.setItem('userData', JSON.stringify(mockResponse.user));
            
            console.log('Faculty login successful, redirecting to dashboard...');
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            // Redirect to faculty dashboard
            window.location.href = 'faculty/dashboard.html';
            
        } else if (email === 'student@test.com' && password === 'password') {
            mockResponse = {
                token: 'mock-student-token',
                user: {
                    id: 's123',
                    full_name: 'Test Student',
                    email: email,
                    type: 'student',
                    roll_number: 'CS2023001'
                }
            };
            
            // Store mock data in localStorage for testing
            localStorage.setItem('mockCourses', JSON.stringify(MOCK_COURSES));
            localStorage.setItem('mockStudents', JSON.stringify(MOCK_STUDENTS));
            localStorage.setItem('mockAttendance', JSON.stringify(MOCK_ATTENDANCE));
            localStorage.setItem('mockAssignments', JSON.stringify(MOCK_ASSIGNMENTS));
            localStorage.setItem('mockNotices', JSON.stringify(MOCK_NOTICES));
            
            // Store authentication data
            localStorage.setItem('accessToken', mockResponse.token);
            localStorage.setItem('userType', mockResponse.user.type);
            localStorage.setItem('userData', JSON.stringify(mockResponse.user));
            
            console.log('Student login successful, redirecting to dashboard...');
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            // Redirect to student dashboard
            window.location.href = 'student/dashboard.html';
        } else {
            // Invalid credentials
            console.error('Invalid credentials');
            showAlert('Error', 'Invalid email or password. Please try again.');
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Error', error.message || 'Login failed. Please try again.');
        
        // Reset button state
        const submitButton = document.querySelector(`#${userType}LoginForm button[type="submit"]`);
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }

    return false; // Prevent form submission
}

// Handle registration form submission
async function handleRegistration(userType) {
    try {
        console.log('Starting registration process for:', userType);

        // Show loading state
        const submitButton = document.querySelector(`#${userType}RegisterForm button[type="submit"]`);
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = 'Registering...';

        const name = document.getElementById(`${userType}RegName`).value;
        const email = document.getElementById(`${userType}RegEmail`).value;
        const password = document.getElementById(`${userType}RegPassword`).value;
        const confirmPassword = document.getElementById(`${userType}RegConfirmPassword`).value;

        // Validate passwords match
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Build registration data
        const registrationData = {
            full_name: name,
            email: email,
            password: password,
            user_type: userType
        };

        // Add type-specific fields
        if (userType === 'student') {
            registrationData.roll_number = document.getElementById('studentRegRollNo').value;
        } else if (userType === 'faculty') {
            registrationData.department = document.getElementById('facultyRegDepartment').value;
        }

        // Attempt to register with the API
        const response = await fetch(REGISTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        // For development/testing - simulate successful registration
        if (!response.ok) {
            console.log('Registration API failed, using mock success for testing');
        }

        // Store the registered email
        sessionStorage.setItem('lastRegisteredEmail', email);
        sessionStorage.setItem('lastRegisteredType', userType);

        // Show success message
        showAlert('Success', 'Registration successful! Please login with your credentials.');
        
        // Switch to login tab
        setTimeout(() => {
            try {
                // Switch to main login tab
                const loginTab = document.getElementById('login-tab');
                if (loginTab) {
                    loginTab.click();
                }

                // Short delay before switching to specific login tab
                setTimeout(() => {
                    // Switch to specific user type login tab
                    const userLoginTab = document.getElementById(`${userType}-login-tab`);
                    if (userLoginTab) {
                        userLoginTab.click();
                    }

                    // Fill in email
                    const emailField = document.getElementById(`${userType}Email`);
                    if (emailField) {
                        emailField.value = email;
                    }

                    // Clear registration form
                    const form = document.getElementById(`${userType}RegisterForm`);
                    if (form) {
                        form.reset();
                    }
                }, 300);
            } catch (tabError) {
                console.error('Error switching tabs:', tabError);
            }
        }, 1000);

    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Error', error.message || 'Registration failed. Please try again.');
    } finally {
        // Reset button state
        const submitButton = document.querySelector(`#${userType}RegisterForm button[type="submit"]`);
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText || 'Register';
        }
    }

    return false; // Prevent form submission
}

/**
 * Show alert message
 * @param {string} type - Alert type ('success', 'danger', 'warning', 'info')
 * @param {string} message - Alert message
 * @param {number} duration - Auto-dismiss duration in milliseconds (0 for no auto-dismiss)
 */
function showAlert(type, message, duration = 5000) {
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
        
        // Auto-dismiss after specified duration (if not 0)
        if (duration > 0) {
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
            }, duration);
        }
    } catch (error) {
        console.error('Error showing alert:', error);
    }
}

// Show registration info
function showRegistrationInfo() {
    showAlert('Registration', 'Please contact your college administrator to register for an account.');
}

// Handle forgot password
function showForgotPassword() {
    showAlert('Forgot Password', 'Please contact the administrator to reset your password.');
}

// Check if user is already authenticated
function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const userType = localStorage.getItem('userType');
    
    if (token && userType) {
        // Redirect based on user type
        switch (userType) {
            case 'faculty':
                window.location.href = 'faculty/dashboard.html';
                break;
            case 'student':
                window.location.href = 'student/dashboard.html';
                break;
            default:
                // Clear invalid data
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userType');
                localStorage.removeItem('userData');
        }
    }
}

// Call checkAuth when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Check authentication status
    checkAuth();
    
    // Ensure login tabs are properly initialized
    initializeLoginTabs();
    
    // Add password validation listeners
    ['student', 'faculty'].forEach(type => {
        const password = document.getElementById(`${type}RegPassword`);
        const confirmPassword = document.getElementById(`${type}RegConfirmPassword`);
        
        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                if (password.value !== confirmPassword.value) {
                    confirmPassword.setCustomValidity('Passwords do not match');
                } else {
                    confirmPassword.setCustomValidity('');
                }
            });
        }
    });
    
    // Display test credentials for development
    console.log('Test credentials:');
    console.log('Faculty: faculty@test.com / password');
    console.log('Student: student@test.com / password');
});

// Initialize login tabs
function initializeLoginTabs() {
    // Make sure faculty login tab is visible and clickable
    const facultyLoginTab = document.getElementById('faculty-login-tab');
    if (facultyLoginTab) {
        facultyLoginTab.style.display = 'block';
        
        // Add click event to ensure tab switching works
        facultyLoginTab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('#loginTabs .nav-link').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Hide all tab panes
            document.querySelectorAll('#loginTabContent .tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Activate faculty tab and pane
            this.classList.add('active');
            document.getElementById('faculty-login').classList.add('show', 'active');
        });
    }
}

// Logout function
function logout() {
    console.log('Logging out...');
    
    // Clear all authentication data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    
    console.log('Redirecting to login page...');
    
    // Redirect to login page
    try {
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Redirect failed, trying alternate method:', error);
        window.location.replace('login.html');
    }
} 