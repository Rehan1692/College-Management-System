/**
 * Data Service for the College Management System
 * Centralizes mock data management and provides consistent API for data operations
 */

class DataService {
    constructor() {
        this.initializeMockData();
    }

    /**
     * Initialize mock data if not already present in localStorage
     */
    initializeMockData() {
        console.log('Initializing mock data...');
        
        // Mock Courses
        if (!localStorage.getItem('mockCourses')) {
            const mockCourses = [
                { id: 1, code: 'CS101', name: 'Introduction to Computer Science', department: 'Computer Science', credits: 3, description: 'Fundamental concepts of programming and computer science.', facultyId: 1 },
                { id: 2, code: 'CS201', name: 'Data Structures', department: 'Computer Science', credits: 4, description: 'Study of data structures and algorithms.', facultyId: 1 },
                { id: 3, code: 'MATH101', name: 'Calculus I', department: 'Mathematics', credits: 4, description: 'Introduction to differential and integral calculus.', facultyId: 2 },
                { id: 4, code: 'ENG101', name: 'English Composition', department: 'English', credits: 3, description: 'Fundamentals of college-level writing.', facultyId: 3 },
                { id: 5, code: 'PHYS101', name: 'Physics I', department: 'Physics', credits: 4, description: 'Introduction to mechanics and thermodynamics.', facultyId: 4 }
            ];
            localStorage.setItem('mockCourses', JSON.stringify(mockCourses));
        }
        
        // Mock Students
        if (!localStorage.getItem('mockStudents')) {
            const mockStudents = [
                { id: 1, name: 'John Doe', email: 'john.doe@example.com', department: 'Computer Science', semester: 3, enrolledCourses: [1, 2, 3] },
                { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', department: 'Computer Science', semester: 3, enrolledCourses: [1, 2, 4] },
                { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', department: 'Mathematics', semester: 2, enrolledCourses: [3, 5] },
                { id: 4, name: 'Alice Brown', email: 'alice.brown@example.com', department: 'Physics', semester: 4, enrolledCourses: [3, 5] },
                { id: 5, name: 'Charlie Wilson', email: 'charlie.wilson@example.com', department: 'English', semester: 1, enrolledCourses: [4] }
            ];
            localStorage.setItem('mockStudents', JSON.stringify(mockStudents));
        }
        
        // Mock Assignments
        if (!localStorage.getItem('mockAssignments')) {
            const mockAssignments = [
                { id: 1, title: 'Programming Basics', description: 'Write a program to calculate factorial.', courseId: 1, dueDate: '2023-12-15', maxMarks: 20 },
                { id: 2, title: 'Data Structures Implementation', description: 'Implement a linked list and its operations.', courseId: 2, dueDate: '2023-12-20', maxMarks: 30 },
                { id: 3, title: 'Calculus Problem Set', description: 'Solve the given problems on differentiation.', courseId: 3, dueDate: '2023-12-18', maxMarks: 25 },
                { id: 4, title: 'Essay Writing', description: 'Write an essay on modern literature.', courseId: 4, dueDate: '2023-12-22', maxMarks: 15 },
                { id: 5, title: 'Physics Lab Report', description: 'Submit a report on the pendulum experiment.', courseId: 5, dueDate: '2023-12-25', maxMarks: 20 }
            ];
            localStorage.setItem('mockAssignments', JSON.stringify(mockAssignments));
        }
        
        // Mock Notices
        if (!localStorage.getItem('mockNotices')) {
            const mockNotices = [
                { 
                    id: 1, 
                    title: 'Semester Registration', 
                    content: 'Registration for the next semester starts on January 5, 2024.', 
                    date: '2023-12-10', 
                    created_at: '2023-12-10',
                    department: 'All',
                    type: 'academic',
                    priority: 'high',
                    created_by: 1,
                    created_by_name: 'Admin'
                },
                { 
                    id: 2, 
                    title: 'Holiday Notice', 
                    content: 'The college will be closed from December 25, 2023 to January 2, 2024 for winter break.', 
                    date: '2023-12-12', 
                    created_at: '2023-12-12',
                    department: 'All',
                    type: 'general',
                    priority: 'medium',
                    created_by: 1,
                    created_by_name: 'Admin'
                },
                { 
                    id: 3, 
                    title: 'CS Department Meeting', 
                    content: 'All CS faculty members are requested to attend the department meeting on December 20, 2023.', 
                    date: '2023-12-15', 
                    created_at: '2023-12-15',
                    department: 'Computer Science',
                    type: 'event',
                    priority: 'medium',
                    created_by: 1,
                    created_by_name: 'Admin'
                },
                { 
                    id: 4, 
                    title: 'Exam Schedule', 
                    content: 'The final exam schedule has been published. Check the college website for details.', 
                    date: '2023-12-18', 
                    created_at: '2023-12-18',
                    department: 'All',
                    type: 'exam',
                    priority: 'high',
                    created_by: 1,
                    created_by_name: 'Admin'
                },
                { 
                    id: 5, 
                    title: 'Library Notice', 
                    content: 'All library books must be returned by December 22, 2023.', 
                    date: '2023-12-20', 
                    created_at: '2023-12-20',
                    department: 'All',
                    type: 'general',
                    priority: 'low',
                    created_by: 1,
                    created_by_name: 'Admin'
                }
            ];
            localStorage.setItem('mockNotices', JSON.stringify(mockNotices));
        }
        
        // Mock Attendance
        if (!localStorage.getItem('mockAttendance')) {
            const mockAttendance = [
                { id: 1, courseId: 1, date: '2023-12-01', students: [{ studentId: 1, status: 'present' }, { studentId: 2, status: 'present' }] },
                { id: 2, courseId: 1, date: '2023-12-05', students: [{ studentId: 1, status: 'present' }, { studentId: 2, status: 'absent' }] },
                { id: 3, courseId: 2, date: '2023-12-02', students: [{ studentId: 1, status: 'present' }, { studentId: 2, status: 'present' }] },
                { id: 4, courseId: 3, date: '2023-12-03', students: [{ studentId: 1, status: 'absent' }, { studentId: 3, status: 'present' }] },
                { id: 5, courseId: 4, date: '2023-12-04', students: [{ studentId: 2, status: 'present' }, { studentId: 5, status: 'present' }] }
            ];
            localStorage.setItem('mockAttendance', JSON.stringify(mockAttendance));
        }
        
        // Mock Submissions
        if (!localStorage.getItem('mockSubmissions')) {
            const mockSubmissions = [
                { id: 1, assignmentId: 1, studentId: 1, submissionDate: '2023-12-10', status: 'submitted', marks: 18 },
                { id: 2, assignmentId: 1, studentId: 2, submissionDate: '2023-12-11', status: 'submitted', marks: 16 },
                { id: 3, assignmentId: 2, studentId: 1, submissionDate: '2023-12-15', status: 'submitted', marks: 25 },
                { id: 4, assignmentId: 3, studentId: 3, submissionDate: '2023-12-16', status: 'submitted', marks: 22 },
                { id: 5, assignmentId: 4, studentId: 5, submissionDate: '2023-12-18', status: 'submitted', marks: 14 }
            ];
            localStorage.setItem('mockSubmissions', JSON.stringify(mockSubmissions));
        }
        
        console.log('Mock data initialization complete');
    }
    
    /**
     * Get all courses
     * @returns {Array} - Array of course objects
     */
    getCourses() {
        try {
            const courses = JSON.parse(localStorage.getItem('mockCourses')) || [];
            return courses;
        } catch (error) {
            console.error('Error getting courses:', error);
            return [];
        }
    }
    
    /**
     * Get course by ID
     * @param {number} id - Course ID
     * @returns {Object|null} - Course object or null if not found
     */
    getCourseById(id) {
        try {
            const courses = this.getCourses();
            return courses.find(course => course.id === parseInt(id)) || null;
        } catch (error) {
            console.error(`Error getting course with ID ${id}:`, error);
            return null;
        }
    }
    
    /**
     * Get courses by faculty ID
     * @param {number} facultyId - Faculty ID
     * @returns {Array} - Array of course objects
     */
    getCoursesByFacultyId(facultyId) {
        try {
            const courses = this.getCourses();
            return courses.filter(course => course.facultyId === parseInt(facultyId));
        } catch (error) {
            console.error(`Error getting courses for faculty ID ${facultyId}:`, error);
            return [];
        }
    }
    
    /**
     * Get all students
     * @returns {Array} - Array of student objects
     */
    getStudents() {
        try {
            const students = JSON.parse(localStorage.getItem('mockStudents')) || [];
            return students;
        } catch (error) {
            console.error('Error getting students:', error);
            return [];
        }
    }
    
    /**
     * Get student by ID
     * @param {number} id - Student ID
     * @returns {Object|null} - Student object or null if not found
     */
    getStudentById(id) {
        try {
            const students = this.getStudents();
            return students.find(student => student.id === parseInt(id)) || null;
        } catch (error) {
            console.error(`Error getting student with ID ${id}:`, error);
            return null;
        }
    }
    
    /**
     * Get students by course ID
     * @param {number} courseId - Course ID
     * @returns {Array} - Array of student objects
     */
    getStudentsByCourseId(courseId) {
        try {
            const students = this.getStudents();
            return students.filter(student => student.enrolledCourses.includes(parseInt(courseId)));
        } catch (error) {
            console.error(`Error getting students for course ID ${courseId}:`, error);
            return [];
        }
    }
    
    /**
     * Get all assignments
     * @returns {Array} - Array of assignment objects
     */
    getAssignments() {
        try {
            const assignments = JSON.parse(localStorage.getItem('mockAssignments')) || [];
            return assignments;
        } catch (error) {
            console.error('Error getting assignments:', error);
            return [];
        }
    }
    
    /**
     * Get assignments by course ID
     * @param {number} courseId - Course ID
     * @returns {Array} - Array of assignment objects
     */
    getAssignmentsByCourseId(courseId) {
        try {
            const assignments = this.getAssignments();
            return assignments.filter(assignment => assignment.courseId === parseInt(courseId));
        } catch (error) {
            console.error(`Error getting assignments for course ID ${courseId}:`, error);
            return [];
        }
    }
    
    /**
     * Get all notices
     * @returns {Array} - Array of notice objects
     */
    getNotices() {
        try {
            const notices = JSON.parse(localStorage.getItem('mockNotices')) || [];
            return notices;
        } catch (error) {
            console.error('Error getting notices:', error);
            return [];
        }
    }
    
    /**
     * Get notices by department
     * @param {string} department - Department name
     * @returns {Array} - Array of notice objects
     */
    getNoticesByDepartment(department) {
        try {
            const notices = this.getNotices();
            return notices.filter(notice => notice.department === department || notice.department === 'All');
        } catch (error) {
            console.error(`Error getting notices for department ${department}:`, error);
            return [];
        }
    }
    
    /**
     * Get attendance records by course ID
     * @param {number} courseId - Course ID
     * @returns {Array} - Array of attendance objects
     */
    getAttendanceByCourseId(courseId) {
        try {
            const attendance = JSON.parse(localStorage.getItem('mockAttendance')) || [];
            return attendance.filter(record => record.courseId === parseInt(courseId));
        } catch (error) {
            console.error(`Error getting attendance for course ID ${courseId}:`, error);
            return [];
        }
    }
    
    /**
     * Get submissions by assignment ID
     * @param {number} assignmentId - Assignment ID
     * @returns {Array} - Array of submission objects
     */
    getSubmissionsByAssignmentId(assignmentId) {
        try {
            const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
            return submissions.filter(submission => submission.assignmentId === parseInt(assignmentId));
        } catch (error) {
            console.error(`Error getting submissions for assignment ID ${assignmentId}:`, error);
            return [];
        }
    }
    
    /**
     * Add a new course
     * @param {Object} course - Course object
     * @returns {Object} - Added course with ID
     */
    addCourse(course) {
        try {
            const courses = this.getCourses();
            const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
            const newCourse = { ...course, id: newId };
            courses.push(newCourse);
            localStorage.setItem('mockCourses', JSON.stringify(courses));
            return newCourse;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    }
    
    /**
     * Update a course
     * @param {number} id - Course ID
     * @param {Object} updatedCourse - Updated course object
     * @returns {Object} - Updated course
     */
    updateCourse(id, updatedCourse) {
        try {
            const courses = this.getCourses();
            const index = courses.findIndex(course => course.id === parseInt(id));
            if (index === -1) {
                throw new Error(`Course with ID ${id} not found`);
            }
            courses[index] = { ...courses[index], ...updatedCourse };
            localStorage.setItem('mockCourses', JSON.stringify(courses));
            return courses[index];
        } catch (error) {
            console.error(`Error updating course with ID ${id}:`, error);
            throw error;
        }
    }
    
    /**
     * Delete a course
     * @param {number} id - Course ID
     * @returns {boolean} - Success status
     */
    deleteCourse(id) {
        try {
            const courses = this.getCourses();
            const filteredCourses = courses.filter(course => course.id !== parseInt(id));
            localStorage.setItem('mockCourses', JSON.stringify(filteredCourses));
            return true;
        } catch (error) {
            console.error(`Error deleting course with ID ${id}:`, error);
            return false;
        }
    }
    
    /**
     * Add a new assignment
     * @param {Object} assignment - Assignment object
     * @returns {Object} - Added assignment with ID
     */
    addAssignment(assignment) {
        try {
            const assignments = this.getAssignments();
            const newId = assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1;
            const newAssignment = { ...assignment, id: newId };
            assignments.push(newAssignment);
            localStorage.setItem('mockAssignments', JSON.stringify(assignments));
            return newAssignment;
        } catch (error) {
            console.error('Error adding assignment:', error);
            throw error;
        }
    }
    
    /**
     * Update an assignment
     * @param {number} id - Assignment ID
     * @param {Object} updatedAssignment - Updated assignment object
     * @returns {Object} - Updated assignment
     */
    updateAssignment(id, updatedAssignment) {
        try {
            const assignments = this.getAssignments();
            const index = assignments.findIndex(assignment => assignment.id === parseInt(id));
            if (index === -1) {
                throw new Error(`Assignment with ID ${id} not found`);
            }
            assignments[index] = { ...assignments[index], ...updatedAssignment };
            localStorage.setItem('mockAssignments', JSON.stringify(assignments));
            return assignments[index];
        } catch (error) {
            console.error(`Error updating assignment with ID ${id}:`, error);
            throw error;
        }
    }
    
    /**
     * Delete an assignment
     * @param {number} id - Assignment ID
     * @returns {boolean} - Success status
     */
    deleteAssignment(id) {
        try {
            const assignments = this.getAssignments();
            const filteredAssignments = assignments.filter(assignment => assignment.id !== parseInt(id));
            localStorage.setItem('mockAssignments', JSON.stringify(filteredAssignments));
            return true;
        } catch (error) {
            console.error(`Error deleting assignment with ID ${id}:`, error);
            return false;
        }
    }
    
    /**
     * Add a new attendance record
     * @param {Object} attendanceRecord - Attendance record object
     * @returns {Object} - Added attendance record with ID
     */
    addAttendanceRecord(attendanceRecord) {
        try {
            const attendance = JSON.parse(localStorage.getItem('mockAttendance')) || [];
            const newId = attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1;
            const newRecord = { ...attendanceRecord, id: newId };
            attendance.push(newRecord);
            localStorage.setItem('mockAttendance', JSON.stringify(attendance));
            return newRecord;
        } catch (error) {
            console.error('Error adding attendance record:', error);
            throw error;
        }
    }
    
    /**
     * Add a new notice
     * @param {Object} notice - Notice object
     * @returns {Object} - Added notice with ID
     */
    addNotice(notice) {
        try {
            const notices = this.getNotices();
            const newId = notices.length > 0 ? Math.max(...notices.map(n => n.id)) + 1 : 1;
            const newNotice = { ...notice, id: newId };
            notices.push(newNotice);
            localStorage.setItem('mockNotices', JSON.stringify(notices));
            return newNotice;
        } catch (error) {
            console.error('Error adding notice:', error);
            throw error;
        }
    }
    
    /**
     * Delete a notice
     * @param {number} id - Notice ID
     * @returns {boolean} - Success status
     */
    deleteNotice(id) {
        try {
            const notices = this.getNotices();
            const filteredNotices = notices.filter(notice => notice.id !== parseInt(id));
            localStorage.setItem('mockNotices', JSON.stringify(filteredNotices));
            return true;
        } catch (error) {
            console.error(`Error deleting notice with ID ${id}:`, error);
            return false;
        }
    }
    
    /**
     * Add a submission
     * @param {Object} submission - Submission object
     * @returns {Object} - Added submission with ID
     */
    addSubmission(submission) {
        try {
            const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
            const newId = submissions.length > 0 ? Math.max(...submissions.map(s => s.id)) + 1 : 1;
            const newSubmission = { ...submission, id: newId };
            submissions.push(newSubmission);
            localStorage.setItem('mockSubmissions', JSON.stringify(submissions));
            return newSubmission;
        } catch (error) {
            console.error('Error adding submission:', error);
            throw error;
        }
    }
    
    /**
     * Update a submission
     * @param {number} id - Submission ID
     * @param {Object} updatedSubmission - Updated submission object
     * @returns {Object} - Updated submission
     */
    updateSubmission(id, updatedSubmission) {
        try {
            const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
            const index = submissions.findIndex(submission => submission.id === parseInt(id));
            if (index === -1) {
                throw new Error(`Submission with ID ${id} not found`);
            }
            submissions[index] = { ...submissions[index], ...updatedSubmission };
            localStorage.setItem('mockSubmissions', JSON.stringify(submissions));
            return submissions[index];
        } catch (error) {
            console.error(`Error updating submission with ID ${id}:`, error);
            throw error;
        }
    }
    
    /**
     * Clear all mock data
     */
    clearAllMockData() {
        try {
            localStorage.removeItem('mockCourses');
            localStorage.removeItem('mockStudents');
            localStorage.removeItem('mockAssignments');
            localStorage.removeItem('mockNotices');
            localStorage.removeItem('mockAttendance');
            localStorage.removeItem('mockSubmissions');
            console.log('All mock data cleared');
        } catch (error) {
            console.error('Error clearing mock data:', error);
            throw error;
        }
    }
}

// Create a global instance of the DataService
window.dataService = new DataService();

/**
 * Get all notices
 * @returns {Array} Array of notices
 */
window.dataService.getNotices = function() {
    try {
        // Get notices from localStorage
        const notices = JSON.parse(localStorage.getItem('notices')) || [];
        return notices;
    } catch (error) {
        console.error('Error getting notices:', error);
        return [];
    }
};

/**
 * Get notice by ID
 * @param {string} id - Notice ID
 * @returns {Object|null} Notice object or null if not found
 */
window.dataService.getNoticeById = function(id) {
    try {
        // Get notices from localStorage
        const notices = JSON.parse(localStorage.getItem('notices')) || [];
        
        // Find notice by ID
        return notices.find(notice => notice.id === id) || null;
    } catch (error) {
        console.error('Error getting notice by ID:', error);
        return null;
    }
};

/**
 * Add a new notice
 * @param {Object} notice - Notice object
 * @returns {Object} Added notice
 */
window.dataService.addNotice = function(notice) {
    try {
        // Get notices from localStorage
        const notices = JSON.parse(localStorage.getItem('notices')) || [];
        
        // Generate ID
        notice.id = 'notice_' + Date.now();
        
        // Add notice
        notices.push(notice);
        
        // Save notices to localStorage
        localStorage.setItem('notices', JSON.stringify(notices));
        
        return notice;
    } catch (error) {
        console.error('Error adding notice:', error);
        throw error;
    }
};

/**
 * Update a notice
 * @param {string} id - Notice ID
 * @param {Object} updatedNotice - Updated notice object
 * @returns {Object|null} Updated notice or null if not found
 */
window.dataService.updateNotice = function(id, updatedNotice) {
    try {
        // Get notices from localStorage
        const notices = JSON.parse(localStorage.getItem('notices')) || [];
        
        // Find notice index
        const index = notices.findIndex(notice => notice.id === id);
        
        // If notice not found
        if (index === -1) {
            return null;
        }
        
        // Update notice
        notices[index] = { ...notices[index], ...updatedNotice };
        
        // Save notices to localStorage
        localStorage.setItem('notices', JSON.stringify(notices));
        
        return notices[index];
    } catch (error) {
        console.error('Error updating notice:', error);
        throw error;
    }
};

/**
 * Delete a notice
 * @param {string} id - Notice ID
 * @returns {boolean} True if deleted, false if not found
 */
window.dataService.deleteNotice = function(id) {
    try {
        // Get notices from localStorage
        const notices = JSON.parse(localStorage.getItem('notices')) || [];
        
        // Find notice index
        const index = notices.findIndex(notice => notice.id === id);
        
        // If notice not found
        if (index === -1) {
            return false;
        }
        
        // Remove notice
        notices.splice(index, 1);
        
        // Save notices to localStorage
        localStorage.setItem('notices', JSON.stringify(notices));
        
        return true;
    } catch (error) {
        console.error('Error deleting notice:', error);
        throw error;
    }
}; 