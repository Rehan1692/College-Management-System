/**
 * Notice Debug Utility
 * This script helps diagnose and fix issues with notices not appearing in the student dashboard.
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Notice Debug Utility loaded');
    
    // Add debug button to the page
    addDebugButton();
    
    // Run initial diagnostics
    runDiagnostics();
});

/**
 * Add a debug button to the page
 */
function addDebugButton() {
    // Create button element
    const button = document.createElement('button');
    button.textContent = 'Debug Notices';
    button.className = 'btn btn-warning position-fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    
    // Add click event
    button.addEventListener('click', function() {
        runDiagnostics();
        fixNoticesIssue();
    });
    
    // Add to document
    document.body.appendChild(button);
}

/**
 * Run diagnostics on the notices system
 */
function runDiagnostics() {
    console.log('=== NOTICE SYSTEM DIAGNOSTICS ===');
    
    // Check localStorage for notices
    const noticesStr = localStorage.getItem('notices');
    if (noticesStr) {
        try {
            const notices = JSON.parse(noticesStr);
            console.log(`Found ${notices.length} notices in localStorage:`);
            notices.forEach((notice, index) => {
                console.log(`Notice ${index + 1}:`, notice);
            });
        } catch (e) {
            console.error('Error parsing notices from localStorage:', e);
        }
    } else {
        console.log('No notices found in localStorage');
    }
    
    // Check mockNotices
    const mockNoticesStr = localStorage.getItem('mockNotices');
    if (mockNoticesStr) {
        try {
            const mockNotices = JSON.parse(mockNoticesStr);
            console.log(`Found ${mockNotices.length} mock notices in localStorage`);
        } catch (e) {
            console.error('Error parsing mock notices from localStorage:', e);
        }
    } else {
        console.log('No mock notices found in localStorage');
    }
    
    // Check if we're on the student dashboard
    const isStudentDashboard = window.location.pathname.includes('/student/dashboard.html');
    if (isStudentDashboard) {
        console.log('Current page is student dashboard');
        
        // Check if notices variable is populated
        if (typeof notices !== 'undefined') {
            console.log(`Student dashboard has ${notices.length} notices in memory`);
        } else {
            console.log('Student dashboard notices variable is not accessible');
        }
    }
    
    console.log('=== END OF DIAGNOSTICS ===');
}

/**
 * Fix the notices issue
 */
function fixNoticesIssue() {
    console.log('Attempting to fix notices issue...');
    
    try {
        // Get all notices from localStorage
        const noticesStr = localStorage.getItem('notices');
        const notices = noticesStr ? JSON.parse(noticesStr) : [];
        
        // Get mock notices from localStorage
        const mockNoticesStr = localStorage.getItem('mockNotices');
        const mockNotices = mockNoticesStr ? JSON.parse(mockNoticesStr) : [];
        
        // Merge notices (avoiding duplicates by ID)
        const mergedNotices = [...notices];
        
        // Add mock notices that aren't already in notices
        mockNotices.forEach(mockNotice => {
            const exists = mergedNotices.some(notice => notice.id === mockNotice.id);
            if (!exists) {
                // Add necessary fields for student dashboard compatibility
                mockNotice.date = mockNotice.date || mockNotice.created_at || new Date().toISOString();
                mockNotice.posted_by = mockNotice.posted_by || mockNotice.created_by_name || 'Faculty';
                mergedNotices.push(mockNotice);
            }
        });
        
        // Save merged notices back to localStorage
        localStorage.setItem('notices', JSON.stringify(mergedNotices));
        
        console.log(`Fixed notices: ${mergedNotices.length} notices now available`);
        
        // Force refresh if on student dashboard
        const isStudentDashboard = window.location.pathname.includes('/student/dashboard.html');
        if (isStudentDashboard && typeof checkForNewNotices === 'function') {
            console.log('Refreshing student dashboard notices...');
            checkForNewNotices();
        }
        
        alert(`Notices fixed! ${mergedNotices.length} notices now available. Refresh the page to see them.`);
    } catch (e) {
        console.error('Error fixing notices:', e);
        alert('Error fixing notices. See console for details.');
    }
}

// Export functions for global access
window.noticeDebug = {
    runDiagnostics,
    fixNoticesIssue
}; 