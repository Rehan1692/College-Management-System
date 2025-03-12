/**
 * Shared Messages JavaScript
 * Handles messaging functionality for both faculty and students
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Messages page initializing...');
        
        // Check authentication
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            console.error('No user data found');
            redirectToLogin();
            return;
        }
        
        // Initialize the page
        initializeMessagesPage(userData);
        
        // Setup event listeners
        setupEventListeners(userData);
        
    } catch (error) {
        console.error('Error initializing messages page:', error);
        utils.showAlert('danger', 'Error initializing messages page: ' + error.message);
    }
});

/**
 * Initialize the messages page
 * @param {Object} userData - User data
 */
function initializeMessagesPage(userData) {
    try {
        console.log('Initializing messages page...');
        
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
        
        // Load inbox messages
        loadInboxMessages(userData);
        
        // Load sent messages
        loadSentMessages(userData);
        
        // Load recipients for compose form
        loadRecipients(userData);
        
    } catch (error) {
        console.error('Error initializing messages page:', error);
        utils.showAlert('danger', 'Error initializing messages page: ' + error.message);
    }
}

/**
 * Load inbox messages
 * @param {Object} userData - User data
 */
function loadInboxMessages(userData) {
    try {
        console.log('Loading inbox messages...');
        
        // Get inbox messages
        const inboxMessages = window.messagingService.getInboxMessages(userData.id, userData.type);
        console.log('Inbox messages:', inboxMessages);
        
        // Get the inbox list element
        const inboxList = document.getElementById('inboxList');
        if (!inboxList) {
            console.warn('Element with ID "inboxList" not found');
            return;
        }
        
        // Clear the list
        inboxList.innerHTML = '';
        
        // Check if there are any messages
        if (inboxMessages.length === 0) {
            inboxList.innerHTML = `
                <div class="p-4 text-center">
                    <p class="text-muted">No messages in your inbox</p>
                </div>
            `;
            return;
        }
        
        // Sort messages by date (newest first)
        inboxMessages.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Create message items
        inboxMessages.forEach(message => {
            const messageItem = document.createElement('div');
            messageItem.className = `message-item p-3 ${message.read ? '' : 'unread'}`;
            messageItem.dataset.messageId = message.id;
            
            // Format date
            const messageDate = new Date(message.timestamp);
            const formattedDate = messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            messageItem.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div class="fw-bold">${message.fromUserName}</div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <div class="mt-1">${message.subject}</div>
                <div class="text-muted text-truncate mt-1">${message.content}</div>
            `;
            
            // Add click event listener
            messageItem.addEventListener('click', () => {
                viewMessage(message, 'inbox');
            });
            
            inboxList.appendChild(messageItem);
        });
        
    } catch (error) {
        console.error('Error loading inbox messages:', error);
        utils.showAlert('danger', 'Error loading inbox messages: ' + error.message);
    }
}

/**
 * Load sent messages
 * @param {Object} userData - User data
 */
function loadSentMessages(userData) {
    try {
        console.log('Loading sent messages...');
        
        // Get sent messages
        const sentMessages = window.messagingService.getSentMessages(userData.id, userData.type);
        console.log('Sent messages:', sentMessages);
        
        // Get the sent list element
        const sentList = document.getElementById('sentList');
        if (!sentList) {
            console.warn('Element with ID "sentList" not found');
            return;
        }
        
        // Clear the list
        sentList.innerHTML = '';
        
        // Check if there are any messages
        if (sentMessages.length === 0) {
            sentList.innerHTML = `
                <div class="p-4 text-center">
                    <p class="text-muted">No sent messages</p>
                </div>
            `;
            return;
        }
        
        // Sort messages by date (newest first)
        sentMessages.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Create message items
        sentMessages.forEach(message => {
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item p-3';
            messageItem.dataset.messageId = message.id;
            
            // Format date
            const messageDate = new Date(message.timestamp);
            const formattedDate = messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            messageItem.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div class="fw-bold">To: ${message.toUserName}</div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <div class="mt-1">${message.subject}</div>
                <div class="text-muted text-truncate mt-1">${message.content}</div>
            `;
            
            // Add click event listener
            messageItem.addEventListener('click', () => {
                viewMessage(message, 'sent');
            });
            
            sentList.appendChild(messageItem);
        });
        
    } catch (error) {
        console.error('Error loading sent messages:', error);
        utils.showAlert('danger', 'Error loading sent messages: ' + error.message);
    }
}

/**
 * View a message
 * @param {Object} message - Message object
 * @param {string} folder - Folder ('inbox' or 'sent')
 */
function viewMessage(message, folder) {
    try {
        console.log(`Viewing message ${message.id} from ${folder}...`);
        
        // Hide initial state and compose view
        document.getElementById('initialState').style.display = 'none';
        document.getElementById('composeView').style.display = 'none';
        
        // Show message detail
        document.getElementById('messageDetail').style.display = 'block';
        
        // Update message detail
        document.getElementById('messageSubject').textContent = message.subject;
        document.getElementById('messageFrom').textContent = message.fromUserName;
        document.getElementById('messageTo').textContent = message.toUserName;
        
        // Format date
        const messageDate = new Date(message.timestamp);
        const formattedDate = messageDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('messageDate').textContent = formattedDate;
        
        // Update message content
        document.getElementById('messageContent').textContent = message.content;
        
        // Show/hide reply button based on folder
        document.getElementById('replyBtn').style.display = folder === 'inbox' ? 'inline-block' : 'none';
        
        // Set current message ID for reply and delete
        document.getElementById('replyBtn').dataset.messageId = message.id;
        document.getElementById('deleteBtn').dataset.messageId = message.id;
        
        // Mark message as read if it's in the inbox
        if (folder === 'inbox' && !message.read) {
            window.messagingService.markAsRead(message.id);
            
            // Update UI to show message as read
            const messageItems = document.querySelectorAll('.message-item');
            messageItems.forEach(item => {
                if (parseInt(item.dataset.messageId) === message.id) {
                    item.classList.remove('unread');
                }
            });
        }
        
        // Highlight the selected message
        const messageItems = document.querySelectorAll('.message-item');
        messageItems.forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.messageId) === message.id) {
                item.classList.add('active');
            }
        });
        
    } catch (error) {
        console.error('Error viewing message:', error);
        utils.showAlert('danger', 'Error viewing message: ' + error.message);
    }
}

/**
 * Load recipients for compose form
 * @param {Object} userData - User data
 */
function loadRecipients(userData) {
    try {
        console.log('Loading recipients...');
        
        // Get the recipient select element
        const recipientSelect = document.getElementById('recipientSelect');
        if (!recipientSelect) {
            console.warn('Element with ID "recipientSelect" not found');
            return;
        }
        
        // Clear the select
        recipientSelect.innerHTML = '<option value="">Select Recipient</option>';
        
        // Add recipients based on user type
        if (userData.type === 'faculty') {
            // Faculty can message students
            const students = window.dataService.getStudents();
            
            // Add student recipients
            const studentsOptgroup = document.createElement('optgroup');
            studentsOptgroup.label = 'Students';
            
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: student.id,
                    name: student.name,
                    type: 'student'
                });
                option.textContent = `${student.name} (${student.email})`;
                studentsOptgroup.appendChild(option);
            });
            
            recipientSelect.appendChild(studentsOptgroup);
            
            // Add faculty recipients (other faculty)
            const faculty = [
                { id: 1, name: 'John Smith', email: 'john.smith@example.com' },
                { id: 2, name: 'Jane Wilson', email: 'jane.wilson@example.com' },
                { id: 3, name: 'Robert Brown', email: 'robert.brown@example.com' }
            ];
            
            const facultyOptgroup = document.createElement('optgroup');
            facultyOptgroup.label = 'Faculty';
            
            faculty.forEach(f => {
                // Skip self
                if (f.id === userData.id) return;
                
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: f.id,
                    name: f.name,
                    type: 'faculty'
                });
                option.textContent = `${f.name} (${f.email})`;
                facultyOptgroup.appendChild(option);
            });
            
            recipientSelect.appendChild(facultyOptgroup);
            
        } else {
            // Students can message faculty
            const faculty = [
                { id: 1, name: 'John Smith', email: 'john.smith@example.com' },
                { id: 2, name: 'Jane Wilson', email: 'jane.wilson@example.com' },
                { id: 3, name: 'Robert Brown', email: 'robert.brown@example.com' }
            ];
            
            faculty.forEach(f => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: f.id,
                    name: f.name,
                    type: 'faculty'
                });
                option.textContent = f.name;
                recipientSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading recipients:', error);
        utils.showAlert('danger', 'Error loading recipients: ' + error.message);
    }
}

/**
 * Show compose view
 * @param {Object} replyToMessage - Message to reply to (optional)
 */
function showComposeView(replyToMessage = null) {
    try {
        console.log('Showing compose view...');
        
        // Hide initial state and message detail
        document.getElementById('initialState').style.display = 'none';
        document.getElementById('messageDetail').style.display = 'none';
        
        // Show compose view
        document.getElementById('composeView').style.display = 'block';
        
        // Reset form
        document.getElementById('composeForm').reset();
        
        // If replying to a message, pre-fill the form
        if (replyToMessage) {
            // Set recipient
            const recipientSelect = document.getElementById('recipientSelect');
            const options = recipientSelect.options;
            
            for (let i = 0; i < options.length; i++) {
                if (options[i].value) {
                    const recipient = JSON.parse(options[i].value);
                    if (recipient.id === replyToMessage.fromUserId && recipient.type === replyToMessage.fromUserType) {
                        recipientSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            
            // Set subject with "Re: " prefix if not already present
            const subject = replyToMessage.subject.startsWith('Re: ') ? 
                replyToMessage.subject : 
                'Re: ' + replyToMessage.subject;
            
            document.getElementById('messageSubjectInput').value = subject;
            
            // Set focus to message content
            setTimeout(() => {
                document.getElementById('messageContentInput').focus();
            }, 100);
        }
        
    } catch (error) {
        console.error('Error showing compose view:', error);
        utils.showAlert('danger', 'Error showing compose view: ' + error.message);
    }
}

/**
 * Send a message
 * @param {Object} userData - User data
 */
function sendMessage(userData) {
    try {
        console.log('Sending message...');
        
        // Get form values
        const recipientJson = document.getElementById('recipientSelect').value;
        const subject = document.getElementById('messageSubjectInput').value.trim();
        const content = document.getElementById('messageContentInput').value.trim();
        
        // Validate form
        if (!recipientJson || !subject || !content) {
            utils.showAlert('warning', 'Please fill in all fields');
            return;
        }
        
        // Parse recipient
        const recipient = JSON.parse(recipientJson);
        
        // Send message
        const message = window.messagingService.sendMessage(
            userData.id,
            userData.name,
            userData.type,
            recipient.id,
            recipient.name,
            recipient.type,
            subject,
            content
        );
        
        // Create notification for recipient
        window.notificationService.notifyNewMessage(
            recipient.id,
            recipient.type,
            userData.name,
            subject,
            message.id
        );
        
        // Show success message
        utils.showAlert('success', 'Message sent successfully');
        
        // Reset form and go back to initial state
        document.getElementById('composeForm').reset();
        document.getElementById('composeView').style.display = 'none';
        document.getElementById('initialState').style.display = 'block';
        
        // Reload sent messages
        loadSentMessages(userData);
        
    } catch (error) {
        console.error('Error sending message:', error);
        utils.showAlert('danger', 'Error sending message: ' + error.message);
    }
}

/**
 * Delete a message
 * @param {number} messageId - Message ID
 * @param {Object} userData - User data
 */
function deleteMessage(messageId, userData) {
    try {
        console.log(`Deleting message ${messageId}...`);
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this message?')) {
            return;
        }
        
        // Delete message
        const success = window.messagingService.deleteMessage(messageId);
        
        if (success) {
            // Show success message
            utils.showAlert('success', 'Message deleted successfully');
            
            // Reset view to initial state
            document.getElementById('messageDetail').style.display = 'none';
            document.getElementById('initialState').style.display = 'block';
            
            // Reload messages
            loadInboxMessages(userData);
            loadSentMessages(userData);
        } else {
            utils.showAlert('danger', 'Error deleting message');
        }
        
    } catch (error) {
        console.error('Error deleting message:', error);
        utils.showAlert('danger', 'Error deleting message: ' + error.message);
    }
}

/**
 * Setup event listeners
 * @param {Object} userData - User data
 */
function setupEventListeners(userData) {
    try {
        console.log('Setting up event listeners...');
        
        // Compose button
        const composeBtn = document.getElementById('composeBtn');
        if (composeBtn) {
            composeBtn.addEventListener('click', () => {
                showComposeView();
            });
        }
        
        // Cancel compose button
        const cancelComposeBtn = document.getElementById('cancelComposeBtn');
        if (cancelComposeBtn) {
            cancelComposeBtn.addEventListener('click', () => {
                document.getElementById('composeView').style.display = 'none';
                document.getElementById('initialState').style.display = 'block';
            });
        }
        
        // Send message button
        const composeForm = document.getElementById('composeForm');
        if (composeForm) {
            composeForm.addEventListener('submit', (event) => {
                event.preventDefault();
                sendMessage(userData);
            });
        }
        
        // Reply button
        const replyBtn = document.getElementById('replyBtn');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => {
                const messageId = parseInt(replyBtn.dataset.messageId);
                const messages = window.messagingService.getAllMessages();
                const message = messages.find(m => m.id === messageId);
                
                if (message) {
                    showComposeView(message);
                }
            });
        }
        
        // Delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const messageId = parseInt(deleteBtn.dataset.messageId);
                deleteMessage(messageId, userData);
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