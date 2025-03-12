// Logout test script
console.log('Logout test script loaded');

// Function to test logout
function testLogout() {
    console.log('Testing logout function...');
    
    try {
        // Clear localStorage
        console.log('Clearing localStorage...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        localStorage.removeItem('mockCourses');
        localStorage.removeItem('mockStudents');
        localStorage.removeItem('mockAssignments');
        localStorage.removeItem('mockNotices');
        localStorage.removeItem('mockAttendance');
        
        console.log('localStorage cleared successfully');
        
        // Redirect to login page
        console.log('Redirecting to login page...');
        window.location.href = '../login.html';
        
        return true;
    } catch (error) {
        console.error('Error during logout test:', error);
        alert('Error during logout test: ' + error.message);
        return false;
    }
}

// Add a global function to test logout from console
window.testLogout = testLogout; 