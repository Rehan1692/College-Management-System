/**
 * Notification Service for the College Management System
 * Manages notifications for users about new events, messages, and updates
 */

// Create a global notification service
window.notificationService = (function() {
    // Private variables
    const STORAGE_KEY = 'cms_notifications';
    let notifications = [];
    let nextId = 1;
    
    // Initialize the service
    function init() {
        try {
            console.log('Initializing notification service...');
            
            // Load notifications from localStorage
            const storedNotifications = localStorage.getItem(STORAGE_KEY);
            if (storedNotifications) {
                notifications = JSON.parse(storedNotifications);
                
                // Find the highest ID to set nextId
                if (notifications.length > 0) {
                    const maxId = Math.max(...notifications.map(n => n.id));
                    nextId = maxId + 1;
                }
            } else {
                // Create sample notifications if none exist
                createSampleNotifications();
            }
            
            console.log(`Loaded ${notifications.length} notifications`);
            
        } catch (error) {
            console.error('Error initializing notification service:', error);
            notifications = [];
        }
    }
    
    /**
     * Create sample notifications for testing
     */
    function createSampleNotifications() {
        console.log('Creating sample notifications...');
        
        // Sample notifications
        const sampleNotifications = [
            {
                id: nextId++,
                userId: 1,
                userType: 'faculty',
                type: 'assignment',
                title: 'New Assignment Submission',
                message: 'Alice Johnson has submitted Assignment #3',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                read: true,
                actionUrl: '../faculty/assignments.html'
            },
            {
                id: nextId++,
                userId: 1,
                userType: 'faculty',
                type: 'message',
                title: 'New Message',
                message: 'You have a new message from Charlie Davis',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                read: false,
                actionUrl: '../shared/messages.html',
                relatedId: 4 // Message ID
            },
            {
                id: nextId++,
                userId: 101,
                userType: 'student',
                type: 'grade',
                title: 'New Grade Posted',
                message: 'Your grade for Assignment #2 has been posted',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                read: false,
                actionUrl: '../student/grades.html'
            },
            {
                id: nextId++,
                userId: 101,
                userType: 'student',
                type: 'message',
                title: 'New Message',
                message: 'You have a new message from Professor Smith',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                read: true,
                actionUrl: '../shared/messages.html',
                relatedId: 1 // Message ID
            }
        ];
        
        // Add sample notifications to the notifications array
        notifications = sampleNotifications;
        
        // Save to localStorage
        saveNotifications();
    }
    
    /**
     * Save notifications to localStorage
     */
    function saveNotifications() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }
    
    /**
     * Get all notifications
     * @returns {Array} All notifications
     */
    function getAllNotifications() {
        return [...notifications];
    }
    
    /**
     * Get notifications for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {Array} User notifications
     */
    function getUserNotifications(userId, userType) {
        return notifications.filter(notification => 
            notification.userId === userId && notification.userType === userType
        );
    }
    
    /**
     * Get unread notifications for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {Array} Unread notifications
     */
    function getUnreadNotifications(userId, userType) {
        return notifications.filter(notification => 
            notification.userId === userId && 
            notification.userType === userType && 
            !notification.read
        );
    }
    
    /**
     * Get unread notification count for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {number} Unread notification count
     */
    function getUnreadCount(userId, userType) {
        return getUnreadNotifications(userId, userType).length;
    }
    
    /**
     * Create a notification
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @param {string} type - Notification type
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} actionUrl - URL to navigate to when notification is clicked
     * @param {number} relatedId - Related entity ID (optional)
     * @returns {Object} The created notification
     */
    function createNotification(userId, userType, type, title, message, actionUrl, relatedId = null) {
        try {
            console.log('Creating notification...');
            
            // Create new notification
            const notification = {
                id: nextId++,
                userId,
                userType,
                type,
                title,
                message,
                timestamp: new Date().toISOString(),
                read: false,
                actionUrl,
                relatedId
            };
            
            // Add to notifications array
            notifications.push(notification);
            
            // Save to localStorage
            saveNotifications();
            
            console.log('Notification created:', notification);
            
            return notification;
            
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
    
    /**
     * Mark a notification as read
     * @param {number} notificationId - Notification ID
     * @returns {boolean} Success status
     */
    function markAsRead(notificationId) {
        try {
            console.log(`Marking notification ${notificationId} as read...`);
            
            // Find the notification
            const notification = notifications.find(n => n.id === notificationId);
            if (!notification) {
                console.warn(`Notification ${notificationId} not found`);
                return false;
            }
            
            // Mark as read
            notification.read = true;
            
            // Save to localStorage
            saveNotifications();
            
            console.log(`Notification ${notificationId} marked as read`);
            
            return true;
            
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }
    
    /**
     * Mark all notifications as read for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {boolean} Success status
     */
    function markAllAsRead(userId, userType) {
        try {
            console.log(`Marking all notifications as read for user ${userId}...`);
            
            // Find all unread notifications for the user
            const userNotifications = notifications.filter(notification => 
                notification.userId === userId && 
                notification.userType === userType && 
                !notification.read
            );
            
            // Mark all as read
            userNotifications.forEach(notification => {
                notification.read = true;
            });
            
            // Save to localStorage
            saveNotifications();
            
            console.log(`Marked ${userNotifications.length} notifications as read`);
            
            return true;
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    }
    
    /**
     * Delete a notification
     * @param {number} notificationId - Notification ID
     * @returns {boolean} Success status
     */
    function deleteNotification(notificationId) {
        try {
            console.log(`Deleting notification ${notificationId}...`);
            
            // Find the notification index
            const index = notifications.findIndex(n => n.id === notificationId);
            if (index === -1) {
                console.warn(`Notification ${notificationId} not found`);
                return false;
            }
            
            // Remove the notification
            notifications.splice(index, 1);
            
            // Save to localStorage
            saveNotifications();
            
            console.log(`Notification ${notificationId} deleted`);
            
            return true;
            
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }
    
    /**
     * Notify about a new message
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @param {string} fromName - Sender name
     * @param {string} subject - Message subject
     * @param {number} messageId - Message ID
     * @returns {Object} The created notification
     */
    function notifyNewMessage(userId, userType, fromName, subject, messageId) {
        return createNotification(
            userId,
            userType,
            'message',
            'New Message',
            `You have a new message from ${fromName}: ${subject}`,
            '../shared/messages.html',
            messageId
        );
    }
    
    /**
     * Notify about a new assignment
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @param {string} assignmentTitle - Assignment title
     * @param {number} assignmentId - Assignment ID
     * @returns {Object} The created notification
     */
    function notifyNewAssignment(userId, userType, assignmentTitle, assignmentId) {
        return createNotification(
            userId,
            userType,
            'assignment',
            'New Assignment',
            `A new assignment has been posted: ${assignmentTitle}`,
            '../student/assignments.html',
            assignmentId
        );
    }
    
    /**
     * Notify about a new grade
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @param {string} assignmentTitle - Assignment title
     * @param {number} gradeId - Grade ID
     * @returns {Object} The created notification
     */
    function notifyNewGrade(userId, userType, assignmentTitle, gradeId) {
        return createNotification(
            userId,
            userType,
            'grade',
            'New Grade Posted',
            `Your grade for ${assignmentTitle} has been posted`,
            '../student/grades.html',
            gradeId
        );
    }
    
    /**
     * Notify about a new assignment submission
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @param {string} studentName - Student name
     * @param {string} assignmentTitle - Assignment title
     * @param {number} submissionId - Submission ID
     * @returns {Object} The created notification
     */
    function notifyNewSubmission(userId, userType, studentName, assignmentTitle, submissionId) {
        return createNotification(
            userId,
            userType,
            'submission',
            'New Assignment Submission',
            `${studentName} has submitted ${assignmentTitle}`,
            '../faculty/assignments.html',
            submissionId
        );
    }
    
    // Initialize the service
    init();
    
    // Public API
    return {
        getAllNotifications,
        getUserNotifications,
        getUnreadNotifications,
        getUnreadCount,
        createNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        notifyNewMessage,
        notifyNewAssignment,
        notifyNewGrade,
        notifyNewSubmission
    };
})(); 