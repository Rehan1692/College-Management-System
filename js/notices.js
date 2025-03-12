// API endpoints
const API_BASE_URL = '/api';
const NOTICES_ENDPOINT = `${API_BASE_URL}/notices`;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeNotices();
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
    document.getElementById('userName').textContent = user.full_name || 'User';
    
    // Show/hide create notice button based on user type
    const createNoticeBtn = document.getElementById('createNoticeBtn');
    if (createNoticeBtn) {
        if (user.type === 'student') {
            createNoticeBtn.classList.add('d-none');
        } else {
            createNoticeBtn.classList.remove('d-none');
        }
    }
}

// Initialize notices data
async function initializeNotices() {
    try {
        // Show loading state
        document.getElementById('noticesList').innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading notices...</p></div>';
        
        // Get the token from localStorage
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('userData'));
        
        // Fetch notices
        const response = await fetch(NOTICES_ENDPOINT, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch notices');
        }
        
        const notices = await response.json();
        updateNoticesDisplay(notices);
        
        // Set up event listeners for filters
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing notices:', error);
        document.getElementById('noticesList').innerHTML = '<div class="alert alert-danger">Error loading notices. Please try again later.</div>';
    }
}

// Update notices display with data
function updateNoticesDisplay(notices) {
    const noticesList = document.getElementById('noticesList');
    
    if (!notices || notices.length === 0) {
        noticesList.innerHTML = '<div class="alert alert-info">No notices found</div>';
        return;
    }
    
    noticesList.innerHTML = '';
    
    notices.forEach(notice => {
        const noticeCard = document.createElement('div');
        noticeCard.className = 'card notice-card mb-3';
        
        // Format the date
        const createdDate = new Date(notice.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create priority badge
        const priorityClass = getPriorityClass(notice.priority);
        const priorityBadge = `<span class="badge ${priorityClass}">${notice.priority}</span>`;
        
        // Create notice type badge
        const typeClass = getTypeClass(notice.type);
        const typeBadge = `<span class="badge ${typeClass}">${notice.type}</span>`;
        
        noticeCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">${notice.title}</h5>
                <div>
                    ${priorityBadge}
                    ${typeBadge}
                </div>
            </div>
            <div class="card-body">
                <p class="card-text">${notice.content}</p>
                ${notice.attachments && notice.attachments.length > 0 ? 
                    `<div class="attachments mt-3">
                        <h6>Attachments:</h6>
                        <ul class="list-group">
                            ${notice.attachments.map(attachment => 
                                `<li class="list-group-item">
                                    <a href="${attachment.file_path}" target="_blank">${attachment.file_name}</a>
                                </li>`
                            ).join('')}
                        </ul>
                    </div>` : ''
                }
            </div>
            <div class="card-footer text-muted d-flex justify-content-between">
                <small>Posted by: ${notice.created_by_name}</small>
                <small>Posted on: ${formattedDate}</small>
            </div>
        `;
        
        noticesList.appendChild(noticeCard);
    });
}

// Set up event listeners for filters
function setupEventListeners() {
    const typeFilter = document.getElementById('typeFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const searchInput = document.getElementById('searchNotices');
    
    const filterNotices = async () => {
        try {
            // Show loading state
            document.getElementById('noticesList').innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading notices...</p></div>';
            
            const token = localStorage.getItem('accessToken');
            
            // Build query parameters
            const params = new URLSearchParams();
            if (typeFilter && typeFilter.value !== 'all') params.append('type', typeFilter.value);
            if (priorityFilter && priorityFilter.value !== 'all') params.append('priority', priorityFilter.value);
            if (searchInput && searchInput.value.trim()) params.append('search', searchInput.value.trim());
            
            // Fetch filtered notices
            const url = `${NOTICES_ENDPOINT}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch filtered notices');
            }
            
            const notices = await response.json();
            updateNoticesDisplay(notices);
        } catch (error) {
            console.error('Error filtering notices:', error);
            document.getElementById('noticesList').innerHTML = '<div class="alert alert-danger">Error loading notices. Please try again later.</div>';
        }
    };
    
    if (typeFilter) typeFilter.addEventListener('change', filterNotices);
    if (priorityFilter) priorityFilter.addEventListener('change', filterNotices);
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(filterNotices, 500));
    }
    
    // Set up create notice form submission
    const createNoticeForm = document.getElementById('createNoticeForm');
    if (createNoticeForm) {
        createNoticeForm.addEventListener('submit', createNotice);
    }
}

// Create a new notice
async function createNotice(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('accessToken');
        const form = event.target;
        
        // Get form data
        const title = form.querySelector('#noticeTitle').value;
        const content = form.querySelector('#noticeContent').value;
        const type = form.querySelector('#noticeType').value;
        const priority = form.querySelector('#noticePriority').value;
        const courseId = form.querySelector('#noticeCourse')?.value;
        const departmentId = form.querySelector('#noticeDepartment')?.value;
        const expiryDate = form.querySelector('#noticeExpiry')?.value;
        
        // Create request body
        const requestBody = {
            title,
            content,
            type,
            priority
        };
        
        // Add optional fields if they exist and have values
        if (courseId && courseId !== 'none') requestBody.course_id = courseId;
        if (departmentId && departmentId !== 'none') requestBody.department_id = departmentId;
        if (expiryDate) requestBody.expiry_date = expiryDate;
        
        // Submit the notice
        const response = await fetch(NOTICES_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create notice');
        }
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createNoticeModal'));
        modal.hide();
        
        // Reset the form
        form.reset();
        
        // Refresh notices
        initializeNotices();
        
        // Show success message
        showAlert('Notice created successfully!', 'success');
    } catch (error) {
        console.error('Error creating notice:', error);
        showAlert(error.message || 'Failed to create notice. Please try again later.', 'danger');
    }
}

// Get appropriate class for priority badge
function getPriorityClass(priority) {
    switch (priority.toLowerCase()) {
        case 'high': return 'bg-danger';
        case 'medium': return 'bg-warning';
        case 'low': return 'bg-info';
        default: return 'bg-secondary';
    }
}

// Get appropriate class for type badge
function getTypeClass(type) {
    switch (type.toLowerCase()) {
        case 'general': return 'bg-primary';
        case 'course': return 'bg-success';
        case 'department': return 'bg-info';
        default: return 'bg-secondary';
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Logout function
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = '../login.html';
} 