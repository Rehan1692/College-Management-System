/**
 * Shared utility functions for the College Management System
 */

// API endpoints
const API_BASE_URL = '/api';
const ENDPOINTS = {
    COURSES: `${API_BASE_URL}/courses`,
    STUDENTS: `${API_BASE_URL}/users`,
    ASSIGNMENTS: `${API_BASE_URL}/assignments`,
    SUBMISSIONS: `${API_BASE_URL}/submissions`,
    ATTENDANCE: `${API_BASE_URL}/attendance`,
    NOTICES: `${API_BASE_URL}/notices`,
    DEPARTMENTS: `${API_BASE_URL}/departments`
};

/**
 * Check if user is authenticated and has the correct role
 * @param {string} requiredRole - The role required for access (e.g., 'faculty', 'student')
 * @returns {boolean} - Whether the user is authenticated with the correct role
 */
function checkAuth(requiredRole) {
    console.log(`Checking authentication for ${requiredRole} role...`);
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        console.log('No token or user data found, redirecting to login');
        // Clear any existing data to ensure a fresh login
        clearAuthData();
        
        // Redirect to login page
        redirectToLogin();
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('User data:', user);
        
        // Check if user has the required role
        if (user.type !== requiredRole) {
            console.log(`User is not ${requiredRole}, redirecting to login`);
            clearAuthData();
            redirectToLogin();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        clearAuthData();
        redirectToLogin();
        return false;
    }
}

/**
 * Clear all authentication data from localStorage
 */
function clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
}

/**
 * Clear all mock data from localStorage
 */
function clearMockData() {
    localStorage.removeItem('mockCourses');
    localStorage.removeItem('mockStudents');
    localStorage.removeItem('mockAssignments');
    localStorage.removeItem('mockNotices');
    localStorage.removeItem('mockAttendance');
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    try {
        document.location.href = '../login.html';
    } catch (error) {
        console.error('Error redirecting to login page:', error);
        try {
            window.location.replace('../login.html');
        } catch (error2) {
            console.error('Error using replace for redirect:', error2);
            window.location.href = '../login.html';
        }
    }
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

/**
 * Format date to a readable format
 * @param {string} dateString - Date string to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Logout function
 */
function logout() {
    try {
        console.log('Logging out...');
        
        // Clear all data from localStorage
        localStorage.clear();
        
        console.log('Redirecting to login page...');
        redirectToLogin();
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Error during logout. Redirecting to login page.');
        window.location.href = '../login.html';
    }
}

// Export functions for use in other files
window.utils = {
    ENDPOINTS,
    checkAuth,
    clearAuthData,
    clearMockData,
    redirectToLogin,
    showAlert,
    formatDate,
    debounce,
    logout
}; 