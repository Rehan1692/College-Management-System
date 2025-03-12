/**
 * Messaging Service
 * Handles all messaging operations for the College Management System
 */

// Create a global messaging service
window.messagingService = (function() {
    // Private variables
    const STORAGE_KEY = 'cms_messages';
    let messages = [];
    let nextId = 1;
    
    // Initialize the service
    function init() {
        try {
            console.log('Initializing messaging service...');
            
            // Load messages from localStorage
            const storedMessages = localStorage.getItem(STORAGE_KEY);
            if (storedMessages) {
                messages = JSON.parse(storedMessages);
                
                // Find the highest ID to set nextId
                if (messages.length > 0) {
                    const maxId = Math.max(...messages.map(m => m.id));
                    nextId = maxId + 1;
                }
            } else {
                // Create sample messages if none exist
                createSampleMessages();
            }
            
            console.log(`Loaded ${messages.length} messages`);
            
        } catch (error) {
            console.error('Error initializing messaging service:', error);
            messages = [];
        }
    }
    
    /**
     * Create sample messages for testing
     */
    function createSampleMessages() {
        console.log('Creating sample messages...');
        
        // Sample faculty
        const faculty = [
            { id: 1, name: 'John Smith', type: 'faculty' },
            { id: 2, name: 'Jane Wilson', type: 'faculty' },
            { id: 3, name: 'Robert Brown', type: 'faculty' }
        ];
        
        // Sample students
        const students = [
            { id: 101, name: 'Alice Johnson', type: 'student' },
            { id: 102, name: 'Bob Williams', type: 'student' },
            { id: 103, name: 'Charlie Davis', type: 'student' }
        ];
        
        // Create sample messages
        const sampleMessages = [
            // Faculty to student messages
            {
                id: nextId++,
                fromUserId: 1,
                fromUserName: 'John Smith',
                fromUserType: 'faculty',
                toUserId: 101,
                toUserName: 'Alice Johnson',
                toUserType: 'student',
                subject: 'Assignment Feedback',
                content: 'Hello Alice, I've reviewed your recent assignment and wanted to provide some feedback. Overall, your work was excellent, but there are a few areas where you could improve. Let's discuss this during our next class.',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                read: true
            },
            {
                id: nextId++,
                fromUserId: 2,
                fromUserName: 'Jane Wilson',
                fromUserType: 'faculty',
                toUserId: 102,
                toUserName: 'Bob Williams',
                toUserType: 'student',
                subject: 'Course Project Update',
                content: 'Hi Bob, I noticed you haven't submitted your project update that was due yesterday. Please let me know if you're facing any challenges with the assignment.',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                read: false
            },
            
            // Student to faculty messages
            {
                id: nextId++,
                fromUserId: 101,
                fromUserName: 'Alice Johnson',
                fromUserType: 'student',
                toUserId: 1,
                toUserName: 'John Smith',
                toUserType: 'faculty',
                subject: 'Question about the lecture',
                content: 'Hello Professor Smith, I had a question about today's lecture on data structures. Could you please clarify the difference between stacks and queues? I'm having trouble understanding the practical applications.',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                read: true
            },
            {
                id: nextId++,
                fromUserId: 103,
                fromUserName: 'Charlie Davis',
                fromUserType: 'student',
                toUserId: 3,
                toUserName: 'Robert Brown',
                toUserType: 'faculty',
                subject: 'Request for extension',
                content: 'Dear Professor Brown, I'm writing to request an extension for the upcoming assignment. I've been dealing with some health issues that have affected my ability to complete the work on time. I can provide a doctor's note if needed.',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                read: false
            },
            
            // Faculty to faculty messages
            {
                id: nextId++,
                fromUserId: 1,
                fromUserName: 'John Smith',
                fromUserType: 'faculty',
                toUserId: 2,
                toUserName: 'Jane Wilson',
                toUserType: 'faculty',
                subject: 'Department Meeting',
                content: 'Hi Jane, just a reminder about the department meeting tomorrow at 2 PM. We'll be discussing the curriculum changes for next semester.',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                read: true
            }
        ];
        
        // Add sample messages to the messages array
        messages = sampleMessages;
        
        // Save to localStorage
        saveMessages();
    }
    
    /**
     * Save messages to localStorage
     */
    function saveMessages() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error('Error saving messages:', error);
        }
    }
    
    /**
     * Get all messages
     * @returns {Array} All messages
     */
    function getAllMessages() {
        return [...messages];
    }
    
    /**
     * Get inbox messages for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {Array} Inbox messages
     */
    function getInboxMessages(userId, userType) {
        return messages.filter(message => 
            message.toUserId === userId && message.toUserType === userType
        );
    }
    
    /**
     * Get sent messages for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {Array} Sent messages
     */
    function getSentMessages(userId, userType) {
        return messages.filter(message => 
            message.fromUserId === userId && message.fromUserType === userType
        );
    }
    
    /**
     * Get a message by ID
     * @param {number} messageId - Message ID
     * @returns {Object|null} Message object or null if not found
     */
    function getMessageById(messageId) {
        return messages.find(message => message.id === messageId) || null;
    }
    
    /**
     * Send a message
     * @param {number} fromUserId - Sender user ID
     * @param {string} fromUserName - Sender user name
     * @param {string} fromUserType - Sender user type ('faculty' or 'student')
     * @param {number} toUserId - Recipient user ID
     * @param {string} toUserName - Recipient user name
     * @param {string} toUserType - Recipient user type ('faculty' or 'student')
     * @param {string} subject - Message subject
     * @param {string} content - Message content
     * @returns {Object} The created message
     */
    function sendMessage(fromUserId, fromUserName, fromUserType, toUserId, toUserName, toUserType, subject, content) {
        try {
            console.log('Sending message...');
            
            // Create new message
            const message = {
                id: nextId++,
                fromUserId,
                fromUserName,
                fromUserType,
                toUserId,
                toUserName,
                toUserType,
                subject,
                content,
                timestamp: new Date().toISOString(),
                read: false
            };
            
            // Add to messages array
            messages.push(message);
            
            // Save to localStorage
            saveMessages();
            
            console.log('Message sent:', message);
            
            return message;
            
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
    
    /**
     * Mark a message as read
     * @param {number} messageId - Message ID
     * @returns {boolean} Success status
     */
    function markAsRead(messageId) {
        try {
            console.log(`Marking message ${messageId} as read...`);
            
            // Find the message
            const message = messages.find(m => m.id === messageId);
            if (!message) {
                console.warn(`Message ${messageId} not found`);
                return false;
            }
            
            // Mark as read
            message.read = true;
            
            // Save to localStorage
            saveMessages();
            
            console.log(`Message ${messageId} marked as read`);
            
            return true;
            
        } catch (error) {
            console.error('Error marking message as read:', error);
            return false;
        }
    }
    
    /**
     * Delete a message
     * @param {number} messageId - Message ID
     * @returns {boolean} Success status
     */
    function deleteMessage(messageId) {
        try {
            console.log(`Deleting message ${messageId}...`);
            
            // Find the message index
            const index = messages.findIndex(m => m.id === messageId);
            if (index === -1) {
                console.warn(`Message ${messageId} not found`);
                return false;
            }
            
            // Remove the message
            messages.splice(index, 1);
            
            // Save to localStorage
            saveMessages();
            
            console.log(`Message ${messageId} deleted`);
            
            return true;
            
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }
    
    /**
     * Get unread message count for a user
     * @param {number} userId - User ID
     * @param {string} userType - User type ('faculty' or 'student')
     * @returns {number} Unread message count
     */
    function getUnreadCount(userId, userType) {
        return messages.filter(message => 
            message.toUserId === userId && 
            message.toUserType === userType && 
            !message.read
        ).length;
    }
    
    // Initialize the service
    init();
    
    // Public API
    return {
        getAllMessages,
        getInboxMessages,
        getSentMessages,
        getMessageById,
        sendMessage,
        markAsRead,
        deleteMessage,
        getUnreadCount
    };
})(); 