/**
 * Faculty Notices Management
 * Handles notices functionality for faculty
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Faculty notices page initializing...');
        
        // Force authentication check before doing anything else
        if (!utils.checkAuth('faculty')) {
            return; // Stop initialization if not authenticated
        }
        
        // Initialize the page
        initializeNoticesPage();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing notices page:', error);
        utils.showAlert('danger', 'Error initializing notices page: ' + error.message);
    }
});

/**
 * Initialize the notices page
 */
function initializeNoticesPage() {
    try {
        console.log('Initializing notices page...');
        
        // Load user data
        loadUserData();
        
        // Load departments for the dropdown
        loadDepartmentsDropdown();
        
        // Load notices data
        loadNoticesData();
        
    } catch (error) {
        console.error('Error initializing notices page:', error);
        utils.showAlert('danger', 'Error initializing notices page: ' + error.message);
    }
}

/**
 * Load user data from localStorage
 */
function loadUserData() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            
            // Update UI with user data
            const facultyNameElement = document.getElementById('facultyName');
            if (facultyNameElement) {
                facultyNameElement.textContent = user.name || 'Faculty';
            }
            
            console.log('User data loaded successfully');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Load departments for the dropdown
 */
function loadDepartmentsDropdown() {
    try {
        console.log('Loading departments for dropdown...');
        
        // Get departments (mock data for now)
        const departments = [
            { id: 1, name: 'Computer Science' },
            { id: 2, name: 'Mathematics' },
            { id: 3, name: 'Physics' },
            { id: 4, name: 'English' }
        ];
        
        // Populate department dropdown
        const departmentSelect = document.getElementById('noticeDepartment');
        if (!departmentSelect) {
            console.warn('Element with ID "noticeDepartment" not found');
            return;
        }
        
        departmentSelect.innerHTML = '<option value="">All Departments</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            departmentSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading departments dropdown:', error);
    }
}

/**
 * Load notices data
 */
function loadNoticesData() {
    try {
        console.log('Loading notices data...');
        
        // Get the notices list element
        const noticesList = document.getElementById('noticesList');
        if (!noticesList) {
            console.warn('Element with ID "noticesList" not found');
            return;
        }
        
        // Show loading indicator
        noticesList.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Loading notices...</p>
            </div>
        `;
        
        // Get notices using data service
        const notices = window.dataService.getNotices();
        console.log('Notices:', notices);
        
        // Display notices
        displayNotices(notices);
        
    } catch (error) {
        console.error('Error loading notices data:', error);
        utils.showAlert('danger', 'Error loading notices data: ' + error.message);
    }
}

/**
 * Display notices in the UI
 * @param {Array} notices - Array of notice objects
 */
function displayNotices(notices) {
    try {
        console.log('Displaying notices:', notices);
        
        // Get the notices list element
        const noticesList = document.getElementById('noticesList');
        if (!noticesList) {
            console.warn('Element with ID "noticesList" not found');
            return;
        }
        
        // Clear the list
        noticesList.innerHTML = '';
        
        // Check if there are any notices
        if (!notices || notices.length === 0) {
            noticesList.innerHTML = `
                <div class="alert alert-info">
                    No notices found. Create a new notice to get started.
                </div>
            `;
            return;
        }
        
        // Sort notices by date (newest first)
        notices.sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || '');
            const dateB = new Date(b.date || b.created_at || '');
            return dateB - dateA;
        });
        
        // Create notice cards
        notices.forEach(notice => {
            // Determine priority class
            let priorityClass = '';
            if (notice.priority === 'high') {
                priorityClass = 'priority-high';
            } else if (notice.priority === 'medium') {
                priorityClass = 'priority-medium';
            } else if (notice.priority === 'low') {
                priorityClass = 'priority-low';
            }
            
            // Format date
            const noticeDate = new Date(notice.date || notice.created_at || '');
            const formattedDate = noticeDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Create notice card
            const noticeCard = document.createElement('div');
            noticeCard.className = `card notice-card mb-4 ${priorityClass}`;
            noticeCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${notice.title}</h5>
                    <div>
                        ${notice.priority ? `<span class="badge bg-${getPriorityBadgeClass(notice.priority)}">${notice.priority}</span>` : ''}
                        ${notice.type ? `<span class="badge bg-${getTypeBadgeClass(notice.type)} ms-2">${notice.type}</span>` : ''}
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${notice.content}</p>
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                    <small class="text-muted">Posted: ${formattedDate}</small>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editNotice(${notice.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteNotice(${notice.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            
            noticesList.appendChild(noticeCard);
        });
        
    } catch (error) {
        console.error('Error displaying notices:', error);
        utils.showAlert('danger', 'Error displaying notices: ' + error.message);
    }
}

/**
 * Get the appropriate badge class for priority
 * @param {string} priority - Priority level
 * @returns {string} - Bootstrap badge class
 */
function getPriorityBadgeClass(priority) {
    switch (priority.toLowerCase()) {
        case 'high':
            return 'danger';
        case 'medium':
            return 'warning';
        case 'low':
            return 'info';
        default:
            return 'secondary';
    }
}

/**
 * Get the appropriate badge class for notice type
 * @param {string} type - Notice type
 * @returns {string} - Bootstrap badge class
 */
function getTypeBadgeClass(type) {
    switch (type.toLowerCase()) {
        case 'general':
            return 'primary';
        case 'academic':
            return 'success';
        case 'event':
            return 'info';
        case 'exam':
            return 'warning';
        default:
            return 'secondary';
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Type filter change
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', filterNotices);
        }
        
        // Priority filter change
        const priorityFilter = document.getElementById('priorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', filterNotices);
        }
        
        // Search input
        const searchInput = document.getElementById('searchNotices');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterNotices, 300));
        }
        
        // Submit notice button
        const submitNoticeBtn = document.getElementById('submitNoticeBtn');
        if (submitNoticeBtn) {
            submitNoticeBtn.addEventListener('click', createNotice);
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Filter notices based on selected filters
 */
function filterNotices() {
    try {
        console.log('Filtering notices...');
        
        // Get filter values
        const typeFilter = document.getElementById('typeFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const searchText = document.getElementById('searchNotices').value.toLowerCase();
        
        // Get all notices
        const notices = window.dataService.getNotices();
        
        // Apply filters
        const filteredNotices = notices.filter(notice => {
            // Type filter
            if (typeFilter !== 'all' && notice.type !== typeFilter) {
                return false;
            }
            
            // Priority filter
            if (priorityFilter !== 'all' && notice.priority !== priorityFilter) {
                return false;
            }
            
            // Search text
            if (searchText && !(
                notice.title.toLowerCase().includes(searchText) ||
                notice.content.toLowerCase().includes(searchText)
            )) {
                return false;
            }
            
            return true;
        });
        
        // Display filtered notices
        displayNotices(filteredNotices);
        
    } catch (error) {
        console.error('Error filtering notices:', error);
        utils.showAlert('danger', 'Error filtering notices: ' + error.message);
    }
}

/**
 * Create a new notice
 */
function createNotice() {
    try {
        console.log('Creating new notice...');
        
        // Get form values
        const title = document.getElementById('noticeTitle').value.trim();
        const content = document.getElementById('noticeContent').value.trim();
        const type = document.getElementById('noticeType').value;
        const priority = document.getElementById('noticePriority').value;
        const department = document.getElementById('noticeDepartment').value;
        const expiryDate = document.getElementById('noticeExpiry').value;
        
        // Validate required fields
        if (!title || !content || !type || !priority) {
            utils.showAlert('warning', 'Please fill in all required fields.');
            return;
        }
        
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            utils.showAlert('danger', 'User data not found. Please log in again.');
            return;
        }
        
        // Create notice object
        const notice = {
            title,
            content,
            type,
            priority,
            department: department || 'All',
            expiry_date: expiryDate || null,
            created_at: new Date().toISOString().split('T')[0],
            created_by: userData.id || 1,
            created_by_name: userData.name || 'Faculty'
        };
        
        // Add notice using data service
        const newNotice = window.dataService.addNotice(notice);
        console.log('New notice created:', newNotice);
        
        // Show success message
        utils.showAlert('success', 'Notice created successfully!');
        
        // Reset form
        document.getElementById('createNoticeForm').reset();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createNoticeModal'));
        modal.hide();
        
        // Reload notices
        loadNoticesData();
        
    } catch (error) {
        console.error('Error creating notice:', error);
        utils.showAlert('danger', 'Error creating notice: ' + error.message);
    }
}

/**
 * Edit a notice
 * @param {number} noticeId - Notice ID
 */
function editNotice(noticeId) {
    try {
        console.log(`Editing notice with ID: ${noticeId}`);
        
        // Get notices
        const notices = window.dataService.getNotices();
        
        // Find the notice to edit
        const notice = notices.find(n => n.id === noticeId);
        if (!notice) {
            utils.showAlert('danger', `Notice with ID ${noticeId} not found.`);
            return;
        }
        
        // TODO: Implement edit functionality
        // For now, just show an alert
        utils.showAlert('info', 'Edit functionality will be implemented in a future update.');
        
    } catch (error) {
        console.error(`Error editing notice with ID ${noticeId}:`, error);
        utils.showAlert('danger', `Error editing notice: ${error.message}`);
    }
}

/**
 * Delete a notice
 * @param {number} noticeId - Notice ID
 */
function deleteNotice(noticeId) {
    try {
        console.log(`Deleting notice with ID: ${noticeId}`);
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this notice?')) {
            return;
        }
        
        // Delete notice using data service
        const success = window.dataService.deleteNotice(noticeId);
        
        if (success) {
            // Show success message
            utils.showAlert('success', 'Notice deleted successfully!');
            
            // Reload notices
            loadNoticesData();
        } else {
            utils.showAlert('danger', `Failed to delete notice with ID ${noticeId}.`);
        }
        
    } catch (error) {
        console.error(`Error deleting notice with ID ${noticeId}:`, error);
        utils.showAlert('danger', `Error deleting notice: ${error.message}`);
    }
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
} 