/**
 * Faculty Grades Management
 * Handles grade management functionality for faculty
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Faculty grades page initializing...');
        
        // Force authentication check before doing anything else
        if (!utils.checkAuth('faculty')) {
            return; // Stop initialization if not authenticated
        }
        
        // Initialize the page
        initializeGradesPage();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing grades page:', error);
        utils.showAlert('danger', 'Error initializing grades page: ' + error.message);
    }
});

/**
 * Initialize the grades page
 */
function initializeGradesPage() {
    try {
        console.log('Initializing grades page...');
        
        // Load user data
        loadUserData();
        
        // Load courses for the dropdown
        loadCoursesDropdown();
        
        // Load initial grades data
        loadGradesData();
        
    } catch (error) {
        console.error('Error initializing grades page:', error);
        utils.showAlert('danger', 'Error initializing grades page: ' + error.message);
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
 * Load courses for the dropdown
 */
function loadCoursesDropdown() {
    try {
        console.log('Loading courses for dropdown...');
        
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            console.error('No user data found');
            return;
        }
        
        // Get faculty courses using data service
        const facultyId = userData.id || 1; // Default to ID 1 if not found
        const courses = window.dataService.getCoursesByFacultyId(facultyId);
        console.log('Faculty courses:', courses);
        
        // Populate course dropdown
        const courseSelect = document.getElementById('courseFilter');
        if (!courseSelect) {
            console.warn('Element with ID "courseFilter" not found');
            return;
        }
        
        courseSelect.innerHTML = '<option value="">All Courses</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.code} - ${course.name}`;
            courseSelect.appendChild(option);
        });
        
        // Add event listener to course dropdown
        courseSelect.addEventListener('change', () => {
            loadGradesData(courseSelect.value);
        });
        
    } catch (error) {
        console.error('Error loading courses dropdown:', error);
    }
}

/**
 * Load grades data
 * @param {number} courseId - Optional course ID to filter by
 */
function loadGradesData(courseId = null) {
    try {
        console.log(`Loading grades data for course ID: ${courseId || 'All'}`);
        
        // Get the grades table body
        const gradesTableBody = document.getElementById('gradesTableBody');
        if (!gradesTableBody) {
            console.warn('Element with ID "gradesTableBody" not found');
            return;
        }
        
        // Show loading indicator
        gradesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2">Loading grades data...</p>
                </td>
            </tr>
        `;
        
        // Get courses
        let courses = [];
        if (courseId) {
            const course = window.dataService.getCourseById(parseInt(courseId));
            if (course) {
                courses = [course];
            }
        } else {
            // Get user data
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData) {
                console.error('No user data found');
                return;
            }
            
            // Get faculty courses
            const facultyId = userData.id || 1; // Default to ID 1 if not found
            courses = window.dataService.getCoursesByFacultyId(facultyId);
        }
        
        // Get students
        const students = window.dataService.getStudents();
        
        // Get assignments
        const assignments = window.dataService.getAssignments();
        
        // Get submissions
        const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
        
        // Create grades data
        const gradesData = [];
        
        // For each course
        courses.forEach(course => {
            // Get students enrolled in this course
            const enrolledStudents = students.filter(student => 
                student.enrolledCourses.includes(course.id)
            );
            
            // Get assignments for this course
            const courseAssignments = assignments.filter(assignment => 
                assignment.courseId === course.id
            );
            
            // For each student
            enrolledStudents.forEach(student => {
                // Calculate total marks and max marks
                let totalMarks = 0;
                let maxMarks = 0;
                
                // For each assignment
                courseAssignments.forEach(assignment => {
                    // Find submission for this student and assignment
                    const submission = submissions.find(sub => 
                        sub.assignmentId === assignment.id && sub.studentId === student.id
                    );
                    
                    if (submission) {
                        totalMarks += submission.marks || 0;
                    }
                    
                    maxMarks += assignment.maxMarks || 0;
                });
                
                // Calculate grade
                let grade = 'N/A';
                let percentage = 0;
                
                if (maxMarks > 0) {
                    percentage = (totalMarks / maxMarks) * 100;
                    
                    if (percentage >= 90) {
                        grade = 'A+';
                    } else if (percentage >= 80) {
                        grade = 'A';
                    } else if (percentage >= 70) {
                        grade = 'B+';
                    } else if (percentage >= 60) {
                        grade = 'B';
                    } else if (percentage >= 50) {
                        grade = 'C';
                    } else if (percentage >= 40) {
                        grade = 'D';
                    } else {
                        grade = 'F';
                    }
                }
                
                // Add to grades data
                gradesData.push({
                    studentId: student.id,
                    studentName: student.name,
                    courseId: course.id,
                    courseName: course.name,
                    courseCode: course.code,
                    totalMarks,
                    maxMarks,
                    percentage: percentage.toFixed(2),
                    grade
                });
            });
        });
        
        // Display grades data
        displayGradesData(gradesData);
        
    } catch (error) {
        console.error('Error loading grades data:', error);
        utils.showAlert('danger', 'Error loading grades data: ' + error.message);
    }
}

/**
 * Display grades data in the table
 * @param {Array} gradesData - Array of grades data objects
 */
function displayGradesData(gradesData) {
    try {
        console.log('Displaying grades data:', gradesData);
        
        // Get the grades table body
        const gradesTableBody = document.getElementById('gradesTableBody');
        if (!gradesTableBody) {
            console.warn('Element with ID "gradesTableBody" not found');
            return;
        }
        
        // Clear the table
        gradesTableBody.innerHTML = '';
        
        // Check if there's any data
        if (gradesData.length === 0) {
            gradesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="alert alert-info">No grades data available.</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Add rows to the table
        gradesData.forEach(data => {
            const row = document.createElement('tr');
            
            // Determine grade color
            let gradeClass = '';
            if (data.grade === 'A+' || data.grade === 'A') {
                gradeClass = 'bg-success text-white';
            } else if (data.grade === 'B+' || data.grade === 'B') {
                gradeClass = 'bg-primary text-white';
            } else if (data.grade === 'C') {
                gradeClass = 'bg-warning';
            } else if (data.grade === 'D') {
                gradeClass = 'bg-warning';
            } else if (data.grade === 'F') {
                gradeClass = 'bg-danger text-white';
            }
            
            row.innerHTML = `
                <td>${data.studentName}</td>
                <td>${data.courseCode} - ${data.courseName}</td>
                <td>${data.totalMarks}</td>
                <td>${data.maxMarks}</td>
                <td>${data.percentage}%</td>
                <td><span class="badge ${gradeClass}">${data.grade}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewStudentGrades(${data.studentId}, ${data.courseId})">
                        <i class="bi bi-eye"></i> Details
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editGrade(${data.studentId}, ${data.courseId})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                </td>
            `;
            
            gradesTableBody.appendChild(row);
        });
        
        // Update stats
        updateGradeStats(gradesData);
        
    } catch (error) {
        console.error('Error displaying grades data:', error);
    }
}

/**
 * Update grade statistics
 * @param {Array} gradesData - Array of grades data objects
 */
function updateGradeStats(gradesData) {
    try {
        console.log('Updating grade statistics...');
        
        // Calculate statistics
        const totalStudents = gradesData.length;
        let passCount = 0;
        let failCount = 0;
        let aCount = 0;
        let bCount = 0;
        let cCount = 0;
        let dCount = 0;
        let fCount = 0;
        
        gradesData.forEach(data => {
            if (data.grade === 'A+' || data.grade === 'A') {
                aCount++;
                passCount++;
            } else if (data.grade === 'B+' || data.grade === 'B') {
                bCount++;
                passCount++;
            } else if (data.grade === 'C') {
                cCount++;
                passCount++;
            } else if (data.grade === 'D') {
                dCount++;
                passCount++;
            } else if (data.grade === 'F') {
                fCount++;
                failCount++;
            }
        });
        
        // Calculate percentages
        const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(2) : 0;
        const failPercentage = totalStudents > 0 ? ((failCount / totalStudents) * 100).toFixed(2) : 0;
        
        // Update UI
        document.getElementById('totalStudentsCount').textContent = totalStudents;
        document.getElementById('passCount').textContent = passCount;
        document.getElementById('failCount').textContent = failCount;
        document.getElementById('passPercentage').textContent = `${passPercentage}%`;
        document.getElementById('aCount').textContent = aCount;
        document.getElementById('bCount').textContent = bCount;
        document.getElementById('cCount').textContent = cCount;
        document.getElementById('dCount').textContent = dCount;
        document.getElementById('fCount').textContent = fCount;
        
        // Update grade distribution bars
        updateGradeDistributionBars(aCount, bCount, cCount, dCount, fCount, totalStudents);
        
    } catch (error) {
        console.error('Error updating grade statistics:', error);
    }
}

/**
 * Update grade distribution bars
 * @param {number} aCount - Number of A/A+ grades
 * @param {number} bCount - Number of B/B+ grades
 * @param {number} cCount - Number of C grades
 * @param {number} dCount - Number of D grades
 * @param {number} fCount - Number of F grades
 * @param {number} totalStudents - Total number of students
 */
function updateGradeDistributionBars(aCount, bCount, cCount, dCount, fCount, totalStudents) {
    try {
        console.log('Updating grade distribution bars...');
        
        if (totalStudents === 0) {
            return;
        }
        
        const maxHeight = 120; // Maximum height of bars in pixels
        
        // Calculate heights based on percentages
        const aHeight = Math.round((aCount / totalStudents) * maxHeight);
        const bHeight = Math.round((bCount / totalStudents) * maxHeight);
        const cHeight = Math.round((cCount / totalStudents) * maxHeight);
        const dHeight = Math.round((dCount / totalStudents) * maxHeight);
        const fHeight = Math.round((fCount / totalStudents) * maxHeight);
        
        // Update bar heights
        document.getElementById('aGradeBar').style.height = `${aHeight}px`;
        document.getElementById('bGradeBar').style.height = `${bHeight}px`;
        document.getElementById('cGradeBar').style.height = `${cHeight}px`;
        document.getElementById('dGradeBar').style.height = `${dHeight}px`;
        document.getElementById('fGradeBar').style.height = `${fHeight}px`;
        
    } catch (error) {
        console.error('Error updating grade distribution bars:', error);
    }
}

/**
 * View student grades details
 * @param {number} studentId - Student ID
 * @param {number} courseId - Course ID
 */
function viewStudentGrades(studentId, courseId) {
    try {
        console.log(`Viewing grades for student ID: ${studentId}, course ID: ${courseId}`);
        
        // Get student
        const student = window.dataService.getStudentById(studentId);
        if (!student) {
            utils.showAlert('danger', 'Student not found');
            return;
        }
        
        // Get course
        const course = window.dataService.getCourseById(courseId);
        if (!course) {
            utils.showAlert('danger', 'Course not found');
            return;
        }
        
        // Get assignments for this course
        const assignments = window.dataService.getAssignments().filter(
            assignment => assignment.courseId === courseId
        );
        
        // Get submissions for this student and course
        const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
        const studentSubmissions = submissions.filter(
            submission => submission.studentId === studentId && 
            assignments.some(assignment => assignment.id === submission.assignmentId)
        );
        
        // Set modal title
        document.getElementById('studentGradesModalTitle').textContent = 
            `Grades for ${student.name} - ${course.code}`;
        
        // Set student and course info
        document.getElementById('studentGradesName').textContent = student.name;
        document.getElementById('studentGradesEmail').textContent = student.email;
        document.getElementById('studentGradesCourse').textContent = `${course.code} - ${course.name}`;
        
        // Get the assignments table body
        const assignmentsTableBody = document.getElementById('studentAssignmentsTableBody');
        if (!assignmentsTableBody) {
            console.warn('Element with ID "studentAssignmentsTableBody" not found');
            return;
        }
        
        // Clear the table
        assignmentsTableBody.innerHTML = '';
        
        // Check if there are any assignments
        if (assignments.length === 0) {
            assignmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="alert alert-info">No assignments for this course.</div>
                    </td>
                </tr>
            `;
        } else {
            // Add rows to the table
            let totalMarks = 0;
            let maxMarks = 0;
            
            assignments.forEach(assignment => {
                const submission = studentSubmissions.find(
                    sub => sub.assignmentId === assignment.id
                );
                
                const row = document.createElement('tr');
                
                const marks = submission ? submission.marks : 'Not submitted';
                const status = submission ? submission.status : 'Not submitted';
                const statusClass = submission ? 
                    (status === 'submitted' ? 'bg-success' : 'bg-warning') : 
                    'bg-danger';
                
                row.innerHTML = `
                    <td>${assignment.title}</td>
                    <td>${assignment.dueDate}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>${marks}</td>
                    <td>${assignment.maxMarks}</td>
                `;
                
                assignmentsTableBody.appendChild(row);
                
                // Update totals
                if (submission && submission.marks) {
                    totalMarks += submission.marks;
                }
                maxMarks += assignment.maxMarks;
            });
            
            // Calculate grade
            let grade = 'N/A';
            let percentage = 0;
            
            if (maxMarks > 0) {
                percentage = (totalMarks / maxMarks) * 100;
                
                if (percentage >= 90) {
                    grade = 'A+';
                } else if (percentage >= 80) {
                    grade = 'A';
                } else if (percentage >= 70) {
                    grade = 'B+';
                } else if (percentage >= 60) {
                    grade = 'B';
                } else if (percentage >= 50) {
                    grade = 'C';
                } else if (percentage >= 40) {
                    grade = 'D';
                } else {
                    grade = 'F';
                }
            }
            
            // Update summary
            document.getElementById('studentGradesTotalMarks').textContent = totalMarks;
            document.getElementById('studentGradesMaxMarks').textContent = maxMarks;
            document.getElementById('studentGradesPercentage').textContent = `${percentage.toFixed(2)}%`;
            document.getElementById('studentGradesFinalGrade').textContent = grade;
            
            // Determine grade color
            let gradeClass = '';
            if (grade === 'A+' || grade === 'A') {
                gradeClass = 'bg-success text-white';
            } else if (grade === 'B+' || grade === 'B') {
                gradeClass = 'bg-primary text-white';
            } else if (grade === 'C') {
                gradeClass = 'bg-warning';
            } else if (grade === 'D') {
                gradeClass = 'bg-warning';
            } else if (grade === 'F') {
                gradeClass = 'bg-danger text-white';
            }
            
            document.getElementById('studentGradesFinalGrade').className = `badge ${gradeClass}`;
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('studentGradesModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error viewing student grades:', error);
        utils.showAlert('danger', 'Error viewing student grades: ' + error.message);
    }
}

/**
 * Edit student grade
 * @param {number} studentId - Student ID
 * @param {number} courseId - Course ID
 */
function editGrade(studentId, courseId) {
    try {
        console.log(`Editing grade for student ID: ${studentId}, course ID: ${courseId}`);
        
        // Get student
        const student = window.dataService.getStudentById(studentId);
        if (!student) {
            utils.showAlert('danger', 'Student not found');
            return;
        }
        
        // Get course
        const course = window.dataService.getCourseById(courseId);
        if (!course) {
            utils.showAlert('danger', 'Course not found');
            return;
        }
        
        // Set modal title
        document.getElementById('editGradeModalTitle').textContent = 
            `Edit Grade for ${student.name} - ${course.code}`;
        
        // Set student and course info
        document.getElementById('editGradeStudentName').value = student.name;
        document.getElementById('editGradeCourse').value = `${course.code} - ${course.name}`;
        
        // Store student and course IDs for submission
        document.getElementById('editGradeStudentId').value = studentId;
        document.getElementById('editGradeCourseId').value = courseId;
        
        // Get assignments for this course
        const assignments = window.dataService.getAssignments().filter(
            assignment => assignment.courseId === courseId
        );
        
        // Get submissions for this student and course
        const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
        const studentSubmissions = submissions.filter(
            submission => submission.studentId === studentId && 
            assignments.some(assignment => assignment.id === submission.assignmentId)
        );
        
        // Get the assignments table body
        const assignmentsTableBody = document.getElementById('editGradeAssignmentsTableBody');
        if (!assignmentsTableBody) {
            console.warn('Element with ID "editGradeAssignmentsTableBody" not found');
            return;
        }
        
        // Clear the table
        assignmentsTableBody.innerHTML = '';
        
        // Check if there are any assignments
        if (assignments.length === 0) {
            assignmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <div class="alert alert-info">No assignments for this course.</div>
                    </td>
                </tr>
            `;
        } else {
            // Add rows to the table
            assignments.forEach(assignment => {
                const submission = studentSubmissions.find(
                    sub => sub.assignmentId === assignment.id
                );
                
                const row = document.createElement('tr');
                
                const marks = submission ? submission.marks : '';
                const submissionId = submission ? submission.id : '';
                
                row.innerHTML = `
                    <td>${assignment.title}</td>
                    <td>${assignment.maxMarks}</td>
                    <td>
                        <input type="number" class="form-control form-control-sm" 
                            name="marks_${assignment.id}" 
                            value="${marks}" 
                            min="0" 
                            max="${assignment.maxMarks}"
                            data-submission-id="${submissionId}"
                            data-assignment-id="${assignment.id}">
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm" 
                            name="feedback_${assignment.id}" 
                            placeholder="Feedback">
                    </td>
                `;
                
                assignmentsTableBody.appendChild(row);
            });
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editGradeModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editing grade:', error);
        utils.showAlert('danger', 'Error editing grade: ' + error.message);
    }
}

/**
 * Save edited grades
 */
function saveEditedGrades() {
    try {
        console.log('Saving edited grades...');
        
        // Get student and course IDs
        const studentId = parseInt(document.getElementById('editGradeStudentId').value);
        const courseId = parseInt(document.getElementById('editGradeCourseId').value);
        
        // Get all mark inputs
        const markInputs = document.querySelectorAll('#editGradeAssignmentsTableBody input[type="number"]');
        
        // Get submissions from localStorage
        const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
        
        // Update submissions
        markInputs.forEach(input => {
            const assignmentId = parseInt(input.dataset.assignmentId);
            const submissionId = parseInt(input.dataset.submissionId) || null;
            const marks = parseInt(input.value) || 0;
            
            if (submissionId) {
                // Update existing submission
                const submissionIndex = submissions.findIndex(sub => sub.id === submissionId);
                if (submissionIndex !== -1) {
                    submissions[submissionIndex].marks = marks;
                }
            } else if (marks > 0) {
                // Create new submission
                const newSubmission = {
                    id: submissions.length > 0 ? Math.max(...submissions.map(s => s.id)) + 1 : 1,
                    assignmentId,
                    studentId,
                    submissionDate: new Date().toISOString().split('T')[0],
                    status: 'submitted',
                    marks
                };
                
                submissions.push(newSubmission);
            }
        });
        
        // Save submissions to localStorage
        localStorage.setItem('mockSubmissions', JSON.stringify(submissions));
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editGradeModal'));
        modal.hide();
        
        // Show success message
        utils.showAlert('success', 'Grades updated successfully');
        
        // Reload grades data
        loadGradesData(courseId);
        
    } catch (error) {
        console.error('Error saving edited grades:', error);
        utils.showAlert('danger', 'Error saving edited grades: ' + error.message);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Save edited grades button
        const saveGradesBtn = document.getElementById('saveGradesBtn');
        if (saveGradesBtn) {
            saveGradesBtn.addEventListener('click', saveEditedGrades);
        }
        
        // Export grades button
        const exportGradesBtn = document.getElementById('exportGradesBtn');
        if (exportGradesBtn) {
            exportGradesBtn.addEventListener('click', exportGrades);
        }
        
        // Print grades button
        const printGradesBtn = document.getElementById('printGradesBtn');
        if (printGradesBtn) {
            printGradesBtn.addEventListener('click', printGrades);
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Export grades to CSV
 */
function exportGrades() {
    try {
        console.log('Exporting grades to CSV...');
        
        // Get the selected course ID
        const courseId = document.getElementById('courseFilter').value;
        
        // Get courses
        let courses = [];
        if (courseId) {
            const course = window.dataService.getCourseById(parseInt(courseId));
            if (course) {
                courses = [course];
            }
        } else {
            // Get user data
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData) {
                console.error('No user data found');
                return;
            }
            
            // Get faculty courses
            const facultyId = userData.id || 1; // Default to ID 1 if not found
            courses = window.dataService.getCoursesByFacultyId(facultyId);
        }
        
        // Get students
        const students = window.dataService.getStudents();
        
        // Get assignments
        const assignments = window.dataService.getAssignments();
        
        // Get submissions
        const submissions = JSON.parse(localStorage.getItem('mockSubmissions')) || [];
        
        // Create CSV data
        let csvData = 'Student Name,Course,Total Marks,Max Marks,Percentage,Grade\n';
        
        // For each course
        courses.forEach(course => {
            // Get students enrolled in this course
            const enrolledStudents = students.filter(student => 
                student.enrolledCourses.includes(course.id)
            );
            
            // Get assignments for this course
            const courseAssignments = assignments.filter(assignment => 
                assignment.courseId === course.id
            );
            
            // For each student
            enrolledStudents.forEach(student => {
                // Calculate total marks and max marks
                let totalMarks = 0;
                let maxMarks = 0;
                
                // For each assignment
                courseAssignments.forEach(assignment => {
                    // Find submission for this student and assignment
                    const submission = submissions.find(sub => 
                        sub.assignmentId === assignment.id && sub.studentId === student.id
                    );
                    
                    if (submission) {
                        totalMarks += submission.marks || 0;
                    }
                    
                    maxMarks += assignment.maxMarks || 0;
                });
                
                // Calculate grade
                let grade = 'N/A';
                let percentage = 0;
                
                if (maxMarks > 0) {
                    percentage = (totalMarks / maxMarks) * 100;
                    
                    if (percentage >= 90) {
                        grade = 'A+';
                    } else if (percentage >= 80) {
                        grade = 'A';
                    } else if (percentage >= 70) {
                        grade = 'B+';
                    } else if (percentage >= 60) {
                        grade = 'B';
                    } else if (percentage >= 50) {
                        grade = 'C';
                    } else if (percentage >= 40) {
                        grade = 'D';
                    } else {
                        grade = 'F';
                    }
                }
                
                // Add to CSV data
                csvData += `${student.name},${course.code} - ${course.name},${totalMarks},${maxMarks},${percentage.toFixed(2)}%,${grade}\n`;
            });
        });
        
        // Create download link
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'grades.csv';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success message
        utils.showAlert('success', 'Grades exported successfully');
        
    } catch (error) {
        console.error('Error exporting grades:', error);
        utils.showAlert('danger', 'Error exporting grades: ' + error.message);
    }
}

/**
 * Print grades
 */
function printGrades() {
    try {
        console.log('Printing grades...');
        
        // Open print dialog
        window.print();
        
    } catch (error) {
        console.error('Error printing grades:', error);
        utils.showAlert('danger', 'Error printing grades: ' + error.message);
    }
} 