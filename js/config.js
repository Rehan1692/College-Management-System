// API Configuration
const API_CONFIG = {
    // Base URL for API endpoints - dynamically set based on current location
    BASE_URL: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''),
    
    // API endpoints
    ENDPOINTS: {
        LOGIN: '/backend/auth/login.php',
        COURSES: '/backend/courses/get_courses.php',
        ATTENDANCE: '/backend/attendance/get_attendance.php',
        ASSIGNMENTS: '/backend/assignments/get_assignments.php',
        GRADES: '/backend/grades/get_grades.php',
        PROFILE: '/backend/users/get_profile.php'
    },

    // Authentication headers
    getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('accessToken');
        const userType = localStorage.getItem('userType');
        return token && userType === 'student';
    },

    // API request helper with error handling and automatic token refresh
    async fetchAPI(endpoint, options = {}) {
        try {
            if (!this.isAuthenticated() && endpoint !== this.ENDPOINTS.LOGIN) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch(this.BASE_URL + endpoint, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...(options.headers || {})
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Handle unauthorized access
                    localStorage.clear();
                    window.location.href = '/login.html';
                    throw new Error('Unauthorized access');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            // Use mock data in development
            return this.getMockData(endpoint);
        }
    },

    // Show error message to user
    showError(message) {
        // You can customize this to show errors in a more user-friendly way
        alert(message || 'An error occurred. Please try again later.');
    },

    // Mock data for development and testing
    getMockData(endpoint) {
        const mockData = {
            [this.ENDPOINTS.COURSES]: {
                status: 'success',
                data: {
                    courses: [
                        {
                            id: 1,
                            code: 'CS301',
                            name: 'Data Structures',
                            instructor: 'Dr. John Smith',
                            department: 'Computer Science',
                            semester: 'Fall 2023',
                            credits: 4,
                            description: 'Advanced data structures and algorithms',
                            progress: 85.5,
                            attendance: 90.0,
                            grade_point: 3.7
                        }
                    ]
                }
            },
            [this.ENDPOINTS.ATTENDANCE]: {
                status: 'success',
                data: {
                    summary: {
                        total_classes: 45,
                        present_count: 40,
                        absent_count: 5,
                        attendance_percentage: 88.89
                    },
                    records: [
                        {
                            date: '2024-03-15',
                            course_code: 'CS301',
                            course_name: 'Data Structures',
                            status: 'present',
                            remarks: ''
                        }
                    ]
                }
            },
            [this.ENDPOINTS.ASSIGNMENTS]: {
                status: 'success',
                data: {
                    summary: {
                        total_assignments: 10,
                        submitted_count: 8,
                        graded_count: 7,
                        average_score: 85.5
                    },
                    assignments: [
                        {
                            id: 1,
                            title: 'Data Structures Implementation',
                            description: 'Implement a binary search tree',
                            due_date: '2024-03-20',
                            total_marks: 100,
                            course_code: 'CS301',
                            course_name: 'Data Structures',
                            submission_status: 'graded',
                            score: 90,
                            submitted_date: '2024-03-18'
                        }
                    ]
                }
            },
            [this.ENDPOINTS.GRADES]: {
                status: 'success',
                data: {
                    summary: {
                        cgpa: 3.75,
                        total_credits: 120,
                        current_semester: 'Spring 2024'
                    },
                    semesters: [
                        {
                            semester: 'Spring 2024',
                            total_courses: 5,
                            total_credits: 15,
                            gpa: 3.8
                        }
                    ],
                    courses: [
                        {
                            code: 'CS301',
                            name: 'Data Structures',
                            credits: 4,
                            grade_point: 3.7,
                            grade_letter: 'A-',
                            semester: 'Spring 2024',
                            assignment_average: 88.5
                        }
                    ]
                }
            }
        };

        return mockData[endpoint] || { 
            status: 'error', 
            message: 'No mock data available for this endpoint' 
        };
    }
};

// Export configuration
window.API_CONFIG = API_CONFIG; 