// Mock Database
const mockDatabase = {
    students: [
        {
            id: "STU2024001",
            name: "John Smith",
            email: "john.smith@college.edu",
            department: "Computer Science",
            semester: 6,
            enrollmentYear: 2021,
            cgpa: 3.75,
            attendance: 85,
            courses: ["CS301", "CS302", "CS303", "MTH301"],
            contact: "+1 234-567-8901",
            address: "123 College Ave, Boston, MA 02115",
            guardianName: "Mary Smith",
            guardianContact: "+1 234-567-8902"
        },
        // More realistic student entries...
    ],

    faculty: [
        {
            id: "FAC2024001",
            name: "Dr. Sarah Johnson",
            email: "sarah.johnson@college.edu",
            department: "Computer Science",
            designation: "Associate Professor",
            specialization: "Machine Learning",
            joinDate: "2020-01-15",
            courses: ["CS301", "CS405"],
            education: {
                phd: "MIT - Artificial Intelligence (2018)",
                masters: "Stanford - Computer Science (2014)"
            },
            contact: "+1 234-567-8900",
            office: "Room 405, CS Building"
        },
        // More faculty entries...
    ],

    courses: [
        {
            id: "CS301",
            name: "Advanced Database Systems",
            credits: 4,
            department: "Computer Science",
            semester: 6,
            faculty: "FAC2024001",
            schedule: {
                days: ["Monday", "Wednesday"],
                time: "10:00 AM - 11:30 AM",
                room: "CS Lab 2"
            },
            prerequisites: ["CS201", "CS202"],
            maxStudents: 40,
            enrolledStudents: 38
        },
        // More course entries...
    ],

    attendance: {
        "CS301": {
            date: "2024-03-15",
            present: ["STU2024001", "STU2024003"],
            absent: ["STU2024002"],
            total: 38
        },
        // More attendance records...
    },

    assignments: [
        {
            id: "ASG2024001",
            courseId: "CS301",
            title: "Database Normalization Project",
            description: "Implement a database system following 3NF normalization...",
            dueDate: "2024-03-25T23:59:59",
            totalMarks: 100,
            weightage: 20,
            submissions: {
                "STU2024001": {
                    submissionDate: "2024-03-20T14:30:00",
                    status: "submitted",
                    marks: 85
                }
            }
        },
        // More assignments...
    ],

    examSchedule: [
        {
            id: "EXAM2024001",
            courseId: "CS301",
            type: "Mid-term",
            date: "2024-03-30",
            time: "09:00 AM - 11:00 AM",
            venue: "Examination Hall A",
            totalMarks: 50
        },
        // More exam schedules...
    ],

    notices: [
        {
            id: "NOT2024001",
            title: "Mid-term Examination Schedule",
            content: "The mid-term examinations for Spring 2024 will commence from March 30th...",
            department: "Computer Science",
            postedBy: "FAC2024001",
            postedDate: "2024-03-15T10:00:00",
            priority: "high",
            attachments: ["schedule.pdf"]
        },
        // More notices...
    ],

    departments: [
        {
            id: "DEP001",
            name: "Computer Science",
            head: "FAC2024005",
            totalStudents: 245,
            totalFaculty: 12,
            courses: ["CS301", "CS302", "CS303"],
            location: "Building A, Floor 4"
        },
        // More departments...
    ],

    timetable: {
        "CS-6": {  // 6th semester CS
            Monday: [
                {
                    courseId: "CS301",
                    time: "10:00 AM - 11:30 AM",
                    room: "CS Lab 2"
                },
                // More Monday classes...
            ],
            // More days...
        },
        // More semester timetables...
    },

    grades: {
        "STU2024001": {
            "CS301": {
                assignments: 85,
                midterm: 78,
                final: 88,
                total: 84,
                grade: "A"
            },
            // More course grades...
        },
        // More student grades...
    },

    events: [
        {
            id: "EVT2024001",
            title: "Technical Symposium 2024",
            description: "Annual technical fest featuring workshops, competitions...",
            startDate: "2024-04-15",
            endDate: "2024-04-17",
            venue: "College Auditorium",
            organizer: "Computer Science Department",
            registrationDeadline: "2024-04-10"
        },
        // More events...
    ],

    library: {
        books: [
            {
                id: "BK001",
                title: "Database Management Systems",
                author: "Ramakrishnan",
                isbn: "978-0123456789",
                copies: 5,
                available: 3
            },
            // More books...
        ],
        transactions: [
            {
                id: "TR001",
                bookId: "BK001",
                studentId: "STU2024001",
                issueDate: "2024-03-01",
                dueDate: "2024-03-15",
                returnDate: null,
                status: "issued"
            },
            // More transactions...
        ]
    }
};

// Helper functions for data access
const getStudentById = (id) => mockDatabase.students.find(s => s.id === id);
const getFacultyById = (id) => mockDatabase.faculty.find(f => f.id === id);
const getCourseById = (id) => mockDatabase.courses.find(c => c.id === id);

// Sample notices data
const sampleNotices = [
    {
        id: 'notice_1',
        title: 'End of Semester Examination Schedule',
        content: 'The end of semester examinations will commence on June 15, 2023. All students are required to clear their dues before the examinations. The detailed schedule is available on the college website.',
        type: 'exam',
        priority: 'high',
        department: 'All',
        date: '2023-05-25',
        created_at: '2023-05-25T10:30:00',
        created_by: 'faculty_1',
        created_by_name: 'Dr. John Smith'
    },
    {
        id: 'notice_2',
        title: 'Annual Sports Day',
        content: 'The annual sports day will be held on July 5, 2023. All students are encouraged to participate. Registration for various events will start from June 10, 2023.',
        type: 'event',
        priority: 'medium',
        department: 'All',
        date: '2023-05-28',
        created_at: '2023-05-28T14:15:00',
        created_by: 'faculty_2',
        created_by_name: 'Prof. Emily Johnson'
    },
    {
        id: 'notice_3',
        title: 'Library Book Return',
        content: 'All students are requested to return the library books before June 10, 2023. Failure to do so will result in a fine as per the library rules.',
        type: 'general',
        priority: 'medium',
        department: 'All',
        date: '2023-06-01',
        created_at: '2023-06-01T09:45:00',
        created_by: 'faculty_3',
        created_by_name: 'Dr. Robert Wilson'
    },
    {
        id: 'notice_4',
        title: 'Computer Science Department Meeting',
        content: 'A department meeting will be held on June 8, 2023, at 2:00 PM in Room 301. All faculty members are required to attend.',
        type: 'academic',
        priority: 'high',
        department: 'Computer Science',
        date: '2023-06-02',
        created_at: '2023-06-02T11:20:00',
        created_by: 'faculty_1',
        created_by_name: 'Dr. John Smith'
    },
    {
        id: 'notice_5',
        title: 'Scholarship Applications',
        content: 'Applications for the merit scholarship for the academic year 2023-24 are now open. Eligible students can apply online through the college portal before July 15, 2023.',
        type: 'academic',
        priority: 'medium',
        department: 'All',
        date: '2023-06-05',
        created_at: '2023-06-05T13:10:00',
        created_by: 'faculty_2',
        created_by_name: 'Prof. Emily Johnson'
    },
    {
        id: 'notice_6',
        title: 'Workshop on Artificial Intelligence',
        content: 'A two-day workshop on Artificial Intelligence will be conducted on June 20-21, 2023. Interested students can register at the Computer Science department office.',
        type: 'event',
        priority: 'low',
        department: 'Computer Science',
        date: '2023-06-08',
        created_at: '2023-06-08T15:30:00',
        created_by: 'faculty_3',
        created_by_name: 'Dr. Robert Wilson'
    }
];

// Initialize notices data in localStorage if not already present
if (!localStorage.getItem('notices')) {
    localStorage.setItem('notices', JSON.stringify(sampleNotices));
}

// Export the mock database
export default mockDatabase; 