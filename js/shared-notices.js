/**
 * Shared Notices JavaScript
 * Handles notice board functionality for both faculty and students
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Notices page initializing...');
        
        // Check authentication
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            console.error('No user data found');
            redirectToLogin();
            return;
        }
        
        // Check if we need to redirect to the shared notices page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/faculty/notices.html') || currentPath.includes('/student/notices.html')) {
            console.log('Redirecting to shared notices page...');
            window.location.href = '../shared/notices.html';
            return;
        }
        
        // Initialize the page
        initializeNoticesPage(userData);
        
        // Setup event listeners
        setupEventListeners(userData);
        
    } catch (error) {
        console.error('Error initializing notices page:', error);
        utils.showAlert('danger', 'Error initializing notices page: ' + error.message);
    }
});

/**
 * Initialize the notices page
 * @param {Object} userData - User data
 */
function initializeNoticesPage(userData) {
    try {
        console.log('Initializing notices page...');
        
        // Update user name in the navbar
        document.getElementById('userName').textContent = userData.name || 'User';
        
        // Set up dashboard link based on user type
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) {
            dashboardLink.href = userData.type === 'faculty' ? '../faculty/dashboard.html' : '../student/dashboard.html';
        }
        
        // Set up home link based on user type
        const homeLink = document.getElementById('homeLink');
        if (homeLink) {
            homeLink.href = userData.type === 'faculty' ? '../faculty/dashboard.html' : '../student/dashboard.html';
        }
        
        // Set up profile link based on user type
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.href = userData.type === 'faculty' ? '../faculty/profile.html' : '../student/profile.html';
        }
        
        // Set up settings link based on user type
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink) {
            settingsLink.href = userData.type === 'faculty' ? '../faculty/settings.html' : '../student/settings.html';
        }
        
        // Show/hide create notice button based on user type
        const createNoticeBtn = document.getElementById('createNoticeBtn');
        if (createNoticeBtn) {
            createNoticeBtn.style.display = userData.type === 'faculty' ? 'block' : 'none';
        }
        
        // Load notices
        loadNotices(userData);
        
    } catch (error) {
        console.error('Error initializing notices page:', error);
        utils.showAlert('danger', 'Error initializing notices page: ' + error.message);
    }
}

/**
 * Load notices
 * @param {Object} userData - User data
 */
function loadNotices(userData) {
    try {
        console.log('Loading notices...');
        
        // Get notices
        const notices = window.dataService.getNotices();
        console.log('Notices:', notices);
        
        // Get the notices list element
        const noticesList = document.getElementById('noticesList');
        if (!noticesList) {
            console.warn('Element with ID "noticesList" not found');
            return;
        }
        
        // Clear the list
        noticesList.innerHTML = '';
        
        // Check if there are any notices
        if (notices.length === 0) {
            noticesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No notices available</p>
                </div>
            `;
            return;
        }
        
        // Get filter values
        const departmentFilter = document.getElementById('departmentFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        
        // Filter notices
        let filteredNotices = notices;
        
        if (departmentFilter !== 'all') {
            filteredNotices = filteredNotices.filter(notice => 
                notice.department === departmentFilter || notice.department === 'All'
            );
        }
        
        if (typeFilter !== 'all') {
            filteredNotices = filteredNotices.filter(notice => 
                notice.type === typeFilter
            );
        }
        
        if (priorityFilter !== 'all') {
            filteredNotices = filteredNotices.filter(notice => 
                notice.priority === priorityFilter
            );
        }
        
        // Sort notices by date (newest first)
        filteredNotices.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Check if there are any notices after filtering
        if (filteredNotices.length === 0) {
            noticesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No notices match the selected filters</p>
                </div>
            `;
            return;
        }
        
        // Create notice cards
        filteredNotices.forEach(notice => {
            const noticeCard = document.createElement('div');
            noticeCard.className = 'col-md-6 col-lg-4 mb-4';
            noticeCard.dataset.noticeId = notice.id;
            
            // Format date
            const noticeDate = new Date(notice.date);
            const formattedDate = noticeDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            noticeCard.innerHTML = `
                <div class="card h-100 notice-card priority-${notice.priority}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span class="badge bg-${getBadgeColor(notice.type)}">${notice.type}</span>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${notice.title}</h5>
                        <p class="card-text text-truncate">${notice.content}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <small class="text-muted">Department: ${notice.department}</small>
                    </div>
                </div>
            `;
            
            // Add click event listener
            noticeCard.addEventListener('click', () => {
                viewNoticeDetails(notice);
            });
            
            noticesList.appendChild(noticeCard);
        });
        
    } catch (error) {
        console.error('Error loading notices:', error);
        utils.showAlert('danger', 'Error loading notices: ' + error.message);
    }
}

/**
 * Get badge color based on notice type
 * @param {string} type - Notice type
 * @returns {string} Badge color
 */
function getBadgeColor(type) {
    switch (type) {
        case 'academic':
            return 'primary';
        case 'event':
            return 'success';
        case 'exam':
            return 'danger';
        case 'general':
        default:
            return 'secondary';
    }
}

/**
 * View notice details
 * @param {Object} notice - Notice object
 */
function viewNoticeDetails(notice) {
    try {
        console.log(`Viewing notice ${notice.id}...`);
        
        // Update modal content
        document.getElementById('detailNoticeTitle').textContent = notice.title;
        document.getElementById('detailNoticeDepartment').textContent = notice.department;
        document.getElementById('detailNoticeType').textContent = notice.type;
        document.getElementById('detailNoticePriority').textContent = notice.priority;
        
        // Format date
        const noticeDate = new Date(notice.date);
        const formattedDate = noticeDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('detailNoticeDate').textContent = formattedDate;
        
        // Update notice content
        document.getElementById('detailNoticeContent').textContent = notice.content;
        
        // Update author
        document.getElementById('detailNoticeAuthor').textContent = notice.created_by_name || 'Admin';
        
        // Update badge colors
        document.getElementById('detailNoticeType').className = `badge bg-${getBadgeColor(notice.type)} me-2`;
        document.getElementById('detailNoticePriority').className = `badge bg-${getPriorityColor(notice.priority)}`;
        
        // Show modal
        const noticeDetailModal = new bootstrap.Modal(document.getElementById('noticeDetailModal'));
        noticeDetailModal.show();
        
    } catch (error) {
        console.error('Error viewing notice details:', error);
        utils.showAlert('danger', 'Error viewing notice details: ' + error.message);
    }
}

/**
 * Get badge color based on priority
 * @param {string} priority - Notice priority
 * @returns {string} Badge color
 */
function getPriorityColor(priority) {
    switch (priority) {
        case 'high':
            return 'danger';
        case 'medium':
            return 'warning';
        case 'low':
        default:
            return 'info';
    }
}

/**
 * Create a new notice
 * @param {Object} userData - User data
 */
function createNotice(userData) {
    try {
        console.log('Creating notice...');
        
        // Get form values
        const title = document.getElementById('noticeTitle').value.trim();
        const content = document.getElementById('noticeContent').value.trim();
        const type = document.getElementById('noticeType').value;
        const priority = document.getElementById('noticePriority').value;
        const department = document.getElementById('noticeDepartment').value;
        
        // Validate form
        if (!title || !content || !type || !priority || !department) {
            utils.showAlert('warning', 'Please fill in all fields');
            return;
        }
        
        // Create notice object
        const notice = {
            title,
            content,
            type,
            priority,
            department,
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            created_by: userData.id,
            created_by_name: userData.name
        };
        
        // Add notice
        const newNotice = window.dataService.addNotice(notice);
        
        // Show success message
        utils.showAlert('success', 'Notice created successfully');
        
        // Close modal
        const createNoticeModal = bootstrap.Modal.getInstance(document.getElementById('createNoticeModal'));
        createNoticeModal.hide();
        
        // Reset form
        document.getElementById('noticeForm').reset();
        
        // Reload notices
        loadNotices(userData);
        
    } catch (error) {
        console.error('Error creating notice:', error);
        utils.showAlert('danger', 'Error creating notice: ' + error.message);
    }
}

/**
 * Setup event listeners
 * @param {Object} userData - User data
 */
function setupEventListeners(userData) {
    try {
        console.log('Setting up event listeners...');
        
        // Create notice button
        const createNoticeBtn = document.getElementById('createNoticeBtn');
        if (createNoticeBtn) {
            createNoticeBtn.addEventListener('click', () => {
                const createNoticeModal = new bootstrap.Modal(document.getElementById('createNoticeModal'));
                createNoticeModal.show();
            });
        }
        
        // Submit notice button
        const submitNoticeBtn = document.getElementById('submitNoticeBtn');
        if (submitNoticeBtn) {
            submitNoticeBtn.addEventListener('click', () => {
                createNotice(userData);
            });
        }
        
        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                loadNotices(userData);
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', utils.logout);
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    window.location.href = '../login.html';
} 