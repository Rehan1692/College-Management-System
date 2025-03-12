/**
 * Faculty Student Credentials Management
 * Handles the management of student test credentials
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Student credentials page initializing...');
        
        // Check authentication
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || userData.type !== 'faculty') {
            console.error('No faculty user data found');
            window.location.href = '../login.html';
            return;
        }
        
        // Update faculty name in the navbar
        document.getElementById('facultyName').textContent = userData.full_name || 'Faculty';
        
        // Initialize the page
        initializeCredentialsPage();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing student credentials page:', error);
        utils.showAlert('danger', 'Error initializing page: ' + error.message);
    }
});

/**
 * Initialize the credentials page
 */
function initializeCredentialsPage() {
    try {
        console.log('Initializing student credentials page...');
        
        // Load student credentials
        loadStudentCredentials();
        
    } catch (error) {
        console.error('Error initializing credentials page:', error);
        utils.showAlert('danger', 'Error initializing page: ' + error.message);
    }
}

/**
 * Load student credentials
 */
function loadStudentCredentials() {
    try {
        console.log('Loading student credentials...');
        
        // Get student credentials from localStorage
        const studentCredentials = getStudentCredentials();
        
        // Get the table body element
        const tableBody = document.getElementById('credentialsTableBody');
        
        // Clear the table body
        tableBody.innerHTML = '';
        
        // Check if there are any credentials
        if (studentCredentials.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No student credentials found</td>
                </tr>
            `;
            return;
        }
        
        // Add each credential to the table
        studentCredentials.forEach(credential => {
            const row = document.createElement('tr');
            
            // Format last login date
            let lastLoginText = 'Never';
            if (credential.lastLogin) {
                const lastLogin = new Date(credential.lastLogin);
                lastLoginText = lastLogin.toLocaleString();
            }
            
            // Create status badge
            let statusBadge = '';
            switch (credential.status) {
                case 'active':
                    statusBadge = '<span class="badge bg-success">Active</span>';
                    break;
                case 'inactive':
                    statusBadge = '<span class="badge bg-danger">Inactive</span>';
                    break;
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">Pending</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">Unknown</span>';
            }
            
            // Create password display with masking
            const maskedPassword = credential.password.replace(/./g, '•');
            
            row.innerHTML = `
                <td>${credential.id}</td>
                <td>${credential.name}</td>
                <td>${credential.email}</td>
                <td>
                    <span class="password-mask">${maskedPassword}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2 show-password-btn" data-password="${credential.password}">
                        <i class="bi bi-eye-slash"></i>
                    </button>
                </td>
                <td>${statusBadge}</td>
                <td>${lastLoginText}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${credential.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${credential.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to show password buttons
        document.querySelectorAll('.show-password-btn').forEach(button => {
            button.addEventListener('click', function() {
                const passwordSpan = this.previousElementSibling;
                const password = this.getAttribute('data-password');
                const icon = this.querySelector('i');
                
                if (passwordSpan.textContent === password) {
                    passwordSpan.textContent = password.replace(/./g, '•');
                    icon.className = 'bi bi-eye-slash';
                } else {
                    passwordSpan.textContent = password;
                    icon.className = 'bi bi-eye';
                }
            });
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openEditModal(id);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openDeleteModal(id);
            });
        });
        
    } catch (error) {
        console.error('Error loading student credentials:', error);
        utils.showAlert('danger', 'Error loading credentials: ' + error.message);
    }
}

/**
 * Get student credentials from localStorage
 * @returns {Array} Array of student credentials
 */
function getStudentCredentials() {
    try {
        // Get credentials from localStorage
        const credentials = JSON.parse(localStorage.getItem('studentCredentials')) || [];
        return credentials;
    } catch (error) {
        console.error('Error getting student credentials:', error);
        return [];
    }
}

/**
 * Save student credentials to localStorage
 * @param {Array} credentials - Array of student credentials
 */
function saveStudentCredentials(credentials) {
    try {
        // Save credentials to localStorage
        localStorage.setItem('studentCredentials', JSON.stringify(credentials));
    } catch (error) {
        console.error('Error saving student credentials:', error);
        throw error;
    }
}

/**
 * Add a new student credential
 */
function addStudentCredential() {
    try {
        console.log('Adding new student credential...');
        
        // Get form values
        const id = document.getElementById('studentId').value.trim();
        const name = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();
        const password = document.getElementById('studentPassword').value.trim();
        const status = document.getElementById('studentStatus').value;
        
        // Validate form
        if (!id || !name || !email || !password || !status) {
            utils.showAlert('warning', 'Please fill in all fields');
            return;
        }
        
        // Get existing credentials
        const credentials = getStudentCredentials();
        
        // Check if ID or email already exists
        if (credentials.some(cred => cred.id === id)) {
            utils.showAlert('warning', 'Student ID already exists');
            return;
        }
        
        if (credentials.some(cred => cred.email === email)) {
            utils.showAlert('warning', 'Email already exists');
            return;
        }
        
        // Create new credential object
        const newCredential = {
            id,
            name,
            email,
            password,
            status,
            created: new Date().toISOString(),
            lastLogin: null
        };
        
        // Add to credentials array
        credentials.push(newCredential);
        
        // Save to localStorage
        saveStudentCredentials(credentials);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCredentialModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addCredentialForm').reset();
        
        // Show success message
        utils.showAlert('success', 'Student credential added successfully');
        
        // Reload credentials
        loadStudentCredentials();
        
    } catch (error) {
        console.error('Error adding student credential:', error);
        utils.showAlert('danger', 'Error adding credential: ' + error.message);
    }
}

/**
 * Open edit modal for a student credential
 * @param {string} id - Student ID
 */
function openEditModal(id) {
    try {
        console.log('Opening edit modal for student ID:', id);
        
        // Get credentials
        const credentials = getStudentCredentials();
        
        // Find credential by ID
        const credential = credentials.find(cred => cred.id === id);
        
        if (!credential) {
            utils.showAlert('warning', 'Student credential not found');
            return;
        }
        
        // Populate form fields
        document.getElementById('editStudentId').value = credential.id;
        document.getElementById('editStudentName').value = credential.name;
        document.getElementById('editStudentEmail').value = credential.email;
        document.getElementById('editStudentPassword').value = credential.password;
        document.getElementById('editStudentStatus').value = credential.status;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editCredentialModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error opening edit modal:', error);
        utils.showAlert('danger', 'Error opening edit modal: ' + error.message);
    }
}

/**
 * Update a student credential
 */
function updateStudentCredential() {
    try {
        console.log('Updating student credential...');
        
        // Get form values
        const id = document.getElementById('editStudentId').value;
        const name = document.getElementById('editStudentName').value.trim();
        const email = document.getElementById('editStudentEmail').value.trim();
        const password = document.getElementById('editStudentPassword').value.trim();
        const status = document.getElementById('editStudentStatus').value;
        
        // Validate form
        if (!id || !name || !email || !password || !status) {
            utils.showAlert('warning', 'Please fill in all fields');
            return;
        }
        
        // Get credentials
        const credentials = getStudentCredentials();
        
        // Find credential index
        const index = credentials.findIndex(cred => cred.id === id);
        
        if (index === -1) {
            utils.showAlert('warning', 'Student credential not found');
            return;
        }
        
        // Check if email already exists (excluding current credential)
        if (credentials.some(cred => cred.email === email && cred.id !== id)) {
            utils.showAlert('warning', 'Email already exists');
            return;
        }
        
        // Update credential
        credentials[index] = {
            ...credentials[index],
            name,
            email,
            password,
            status,
            updated: new Date().toISOString()
        };
        
        // Save to localStorage
        saveStudentCredentials(credentials);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editCredentialModal'));
        modal.hide();
        
        // Show success message
        utils.showAlert('success', 'Student credential updated successfully');
        
        // Reload credentials
        loadStudentCredentials();
        
    } catch (error) {
        console.error('Error updating student credential:', error);
        utils.showAlert('danger', 'Error updating credential: ' + error.message);
    }
}

/**
 * Open delete confirmation modal
 * @param {string} id - Student ID
 */
function openDeleteModal(id) {
    try {
        console.log('Opening delete modal for student ID:', id);
        
        // Set student ID in hidden field
        document.getElementById('deleteStudentId').value = id;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error opening delete modal:', error);
        utils.showAlert('danger', 'Error opening delete modal: ' + error.message);
    }
}

/**
 * Delete a student credential
 */
function deleteStudentCredential() {
    try {
        console.log('Deleting student credential...');
        
        // Get student ID
        const id = document.getElementById('deleteStudentId').value;
        
        if (!id) {
            utils.showAlert('warning', 'Student ID not found');
            return;
        }
        
        // Get credentials
        const credentials = getStudentCredentials();
        
        // Filter out the credential to delete
        const updatedCredentials = credentials.filter(cred => cred.id !== id);
        
        // Save to localStorage
        saveStudentCredentials(updatedCredentials);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        // Show success message
        utils.showAlert('success', 'Student credential deleted successfully');
        
        // Reload credentials
        loadStudentCredentials();
        
    } catch (error) {
        console.error('Error deleting student credential:', error);
        utils.showAlert('danger', 'Error deleting credential: ' + error.message);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Save credential button
        const saveCredentialBtn = document.getElementById('saveCredentialBtn');
        if (saveCredentialBtn) {
            saveCredentialBtn.addEventListener('click', addStudentCredential);
        }
        
        // Update credential button
        const updateCredentialBtn = document.getElementById('updateCredentialBtn');
        if (updateCredentialBtn) {
            updateCredentialBtn.addEventListener('click', updateStudentCredential);
        }
        
        // Confirm delete button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', deleteStudentCredential);
        }
        
        // Toggle password visibility in add modal
        const togglePasswordBtn = document.getElementById('togglePassword');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const passwordInput = document.getElementById('studentPassword');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'bi bi-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'bi bi-eye';
                }
            });
        }
        
        // Toggle password visibility in edit modal
        const editTogglePasswordBtn = document.getElementById('editTogglePassword');
        if (editTogglePasswordBtn) {
            editTogglePasswordBtn.addEventListener('click', function() {
                const passwordInput = document.getElementById('editStudentPassword');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'bi bi-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'bi bi-eye';
                }
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userType');
                localStorage.removeItem('userData');
                window.location.href = '../login.html?logout=true';
            });
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Initialize with sample data if none exists
function initializeSampleData() {
    try {
        // Check if student credentials already exist
        const credentials = getStudentCredentials();
        
        if (credentials.length === 0) {
            console.log('Initializing sample student credentials...');
            
            // Sample student credentials
            const sampleCredentials = [
                {
                    id: 'STU2024001',
                    name: 'John Smith',
                    email: 'john.smith@example.com',
                    password: 'password123',
                    status: 'active',
                    created: new Date().toISOString(),
                    lastLogin: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                },
                {
                    id: 'STU2024002',
                    name: 'Jane Doe',
                    email: 'jane.doe@example.com',
                    password: 'password456',
                    status: 'active',
                    created: new Date().toISOString(),
                    lastLogin: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                },
                {
                    id: 'STU2024003',
                    name: 'Bob Johnson',
                    email: 'bob.johnson@example.com',
                    password: 'password789',
                    status: 'inactive',
                    created: new Date().toISOString(),
                    lastLogin: null
                },
                {
                    id: 'STU2024004',
                    name: 'Test Student',
                    email: 'student@test.com',
                    password: 'password',
                    status: 'active',
                    created: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }
            ];
            
            // Save sample credentials
            saveStudentCredentials(sampleCredentials);
            
            console.log('Sample student credentials initialized');
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Initialize sample data
initializeSampleData(); 