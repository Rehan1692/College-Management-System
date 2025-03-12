// Simple logout function
console.log('Simple logout script loaded');

// Function to perform a simple logout
function simpleLogout() {
    console.log('Simple logout function called');
    
    try {
        // Clear all localStorage items
        console.log('Clearing localStorage...');
        localStorage.clear();
        
        console.log('localStorage cleared successfully');
        
        // Redirect to login page with logout parameter
        console.log('Redirecting to login page...');
        document.location.href = '../login.html?logout=true';
        
        return true;
    } catch (error) {
        console.error('Error during simple logout:', error);
        alert('Error during simple logout: ' + error.message);
        
        // Try an alternative approach
        try {
            window.location.replace('../login.html?logout=true');
        } catch (error2) {
            console.error('Alternative redirect failed:', error2);
            try {
                window.location.href = '../login.html?logout=true';
            } catch (error3) {
                console.error('All standard redirects failed:', error3);
                alert('All logout methods failed. Please close the browser and try again.');
            }
        }
        
        return false;
    }
}

// Add a global function to use from HTML
window.simpleLogout = simpleLogout;

// Override the existing logout function if it exists
if (typeof logout === 'function') {
    console.log('Overriding existing logout function');
    window.originalLogout = logout;
    window.logout = simpleLogout;
} else if (window.utils && typeof window.utils.logout === 'function') {
    console.log('Using utils.logout as fallback');
    window.logout = window.utils.logout;
} 