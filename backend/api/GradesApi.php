<?php
require_once __DIR__ . '/BaseApi.php';

class GradesApi extends BaseApi {
    protected function handleGet() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific student ID is requested
        $studentId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if ($studentId) {
            // Check if the authenticated user is requesting their own grades or has admin/faculty privileges
            if ($studentId !== $authUser['id'] && $authUser['type'] === 'student') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only view your own grades']
                ];
            }
            
            // Check for specific course
            $courseId = isset($this->urlParams[1]) && is_numeric($this->urlParams[1]) ? 
                (int)$this->urlParams[1] : null;
            
            if ($courseId) {
                return $this->getStudentCourseGrades($studentId, $courseId, $authUser);
            } else {
                return $this->getStudentAllGrades($studentId, $authUser);
            }
        } else {
            // Check if a specific course ID is requested
            $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
                (int)$this->urlParams[0] : null;
            
            if ($courseId) {
                return $this->getCourseGrades($courseId, $authUser);
            } else {
                // If student, return their grades for all courses
                if ($authUser['type'] === 'student') {
                    return $this->getStudentAllGrades($authUser['id'], $authUser);
                } else {
                    // For faculty, return grades for courses they teach
                    return $this->getFacultyCoursesGrades($authUser);
                }
            }
        }
    }
    
    protected function handlePost() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can add grades
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot add grades']
            ];
        }
        
        // Check if a specific course ID is requested
        $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$courseId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Course ID is required']
            ];
        }
        
        // Add grades
        return $this->addGrades($courseId, $authUser);
    }
    
    protected function handlePut() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can update grades
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot update grades']
            ];
        }
        
        // Check if a specific enrollment ID is provided
        $enrollmentId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$enrollmentId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Enrollment ID is required']
            ];
        }
        
        // Update grade
        return $this->updateGrade($enrollmentId, $authUser);
    }
    
    private function getStudentAllGrades($studentId, $authUser) {
        try {
            // Get student details
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, u.email, u.type, sp.roll_number, sp.department, sp.semester
                FROM users u
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.id = ? AND u.type = 'student'
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch();
            
            if (!$student) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Student not found']
                ];
            }
            
            // Get all courses and grades for the student
            $stmt = $this->conn->prepare("
                SELECT c.id, c.code, c.name, c.credits, c.semester, c.department,
                       e.grade_point, e.grade_letter, e.remarks, e.updated_at,
                       u.full_name as instructor_name
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                LEFT JOIN users u ON c.instructor_id = u.id
                WHERE e.student_id = ?
                ORDER BY c.semester, c.name
            ");
            $stmt->execute([$studentId]);
            $courses = $stmt->fetchAll();
            
            // Calculate GPA
            $totalCredits = 0;
            $totalGradePoints = 0;
            
            foreach ($courses as $course) {
                if ($course['grade_point'] !== null) {
                    $totalCredits += $course['credits'];
                    $totalGradePoints += ($course['grade_point'] * $course['credits']);
                }
            }
            
            $gpa = $totalCredits > 0 ? round($totalGradePoints / $totalCredits, 2) : 0;
            
            return [
                'statusCode' => 200,
                'data' => [
                    'student' => $student,
                    'gpa' => $gpa,
                    'total_credits' => $totalCredits,
                    'courses' => $courses
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getStudentCourseGrades($studentId, $courseId, $authUser) {
        try {
            // Check if course exists
            $stmt = $this->conn->prepare("
                SELECT c.*, u.full_name as instructor_name
                FROM courses c
                LEFT JOIN users u ON c.instructor_id = u.id
                WHERE c.id = ?
            ");
            $stmt->execute([$courseId]);
            $course = $stmt->fetch();
            
            if (!$course) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Course not found']
                ];
            }
            
            // Check if student is enrolled in the course
            $stmt = $this->conn->prepare("
                SELECT e.*, u.full_name as updated_by_name
                FROM enrollments e
                LEFT JOIN users u ON e.updated_by = u.id
                WHERE e.student_id = ? AND e.course_id = ?
            ");
            $stmt->execute([$studentId, $courseId]);
            $enrollment = $stmt->fetch();
            
            if (!$enrollment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Student is not enrolled in this course']
                ];
            }
            
            // Get student details
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, u.email, sp.roll_number, sp.department, sp.semester
                FROM users u
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch();
            
            // Get assignment grades
            $stmt = $this->conn->prepare("
                SELECT a.id, a.title, a.total_marks, a.weightage, 
                       s.score, s.status, s.submitted_date, s.graded_at
                FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
                WHERE a.course_id = ?
                ORDER BY a.due_date
            ");
            $stmt->execute([$studentId, $courseId]);
            $assignments = $stmt->fetchAll();
            
            // Calculate assignment contribution to final grade
            $totalWeightage = 0;
            $weightedScore = 0;
            
            foreach ($assignments as &$assignment) {
                if ($assignment['score'] !== null && $assignment['weightage'] > 0) {
                    $percentage = ($assignment['score'] / $assignment['total_marks']) * 100;
                    $assignment['percentage'] = round($percentage, 2);
                    
                    $totalWeightage += $assignment['weightage'];
                    $weightedScore += ($percentage * $assignment['weightage'] / 100);
                } else {
                    $assignment['percentage'] = null;
                }
            }
            
            // Get attendance summary
            $stmt = $this->conn->prepare("
                SELECT 
                    COUNT(DISTINCT date) as total_classes,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
                FROM attendance
                WHERE course_id = ? AND student_id = ?
            ");
            $stmt->execute([$courseId, $studentId]);
            $attendance = $stmt->fetch();
            
            $attendancePercentage = $attendance['total_classes'] > 0 ? 
                round(($attendance['present_count'] / $attendance['total_classes']) * 100, 2) : 0;
            
            return [
                'statusCode' => 200,
                'data' => [
                    'student' => $student,
                    'course' => $course,
                    'enrollment' => $enrollment,
                    'assignments' => $assignments,
                    'attendance' => [
                        'total_classes' => (int)$attendance['total_classes'],
                        'present_count' => (int)$attendance['present_count'],
                        'attendance_percentage' => $attendancePercentage
                    ],
                    'grade_calculation' => [
                        'total_weightage' => $totalWeightage,
                        'weighted_score' => round($weightedScore, 2)
                    ]
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getCourseGrades($courseId, $authUser) {
        try {
            // Check if course exists
            $stmt = $this->conn->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$courseId]);
            $course = $stmt->fetch();
            
            if (!$course) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Course not found']
                ];
            }
            
            // Check if user has access to this course
            if ($authUser['type'] === 'faculty' && $course['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only view grades for courses you teach']
                ];
            } else if ($authUser['type'] === 'student') {
                // Check if student is enrolled in the course
                $stmt = $this->conn->prepare("
                    SELECT id FROM enrollments 
                    WHERE student_id = ? AND course_id = ?
                ");
                $stmt->execute([$authUser['id'], $courseId]);
                if (!$stmt->fetch()) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You are not enrolled in this course']
                    ];
                }
                
                // Students can only see their own grades
                return $this->getStudentCourseGrades($authUser['id'], $courseId, $authUser);
            }
            
            // Get all enrolled students and their grades
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, sp.roll_number, sp.department, sp.semester,
                       e.grade_point, e.grade_letter, e.remarks, e.updated_at,
                       (SELECT COUNT(*) FROM submissions s 
                        JOIN assignments a ON s.assignment_id = a.id 
                        WHERE s.student_id = u.id AND a.course_id = ?) as assignments_submitted,
                       (SELECT COUNT(*) FROM attendance 
                        WHERE student_id = u.id AND course_id = ? AND status = 'present') as classes_attended,
                       (SELECT COUNT(DISTINCT date) FROM attendance 
                        WHERE course_id = ?) as total_classes
                FROM enrollments e
                JOIN users u ON e.student_id = u.id
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE e.course_id = ?
                ORDER BY u.full_name
            ");
            $stmt->execute([$courseId, $courseId, $courseId, $courseId]);
            $students = $stmt->fetchAll();
            
            // Get assignment statistics
            $stmt = $this->conn->prepare("
                SELECT a.id, a.title, a.total_marks, a.weightage,
                       COUNT(s.id) as submission_count,
                       AVG(s.score) as average_score,
                       MAX(s.score) as highest_score,
                       MIN(s.score) as lowest_score
                FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignment_id
                WHERE a.course_id = ?
                GROUP BY a.id
                ORDER BY a.due_date
            ");
            $stmt->execute([$courseId]);
            $assignments = $stmt->fetchAll();
            
            // Calculate grade distribution
            $gradeDistribution = [
                'A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0, 'Not Graded' => 0
            ];
            
            foreach ($students as $student) {
                if ($student['grade_letter']) {
                    $firstChar = substr($student['grade_letter'], 0, 1);
                    if (isset($gradeDistribution[$firstChar])) {
                        $gradeDistribution[$firstChar]++;
                    }
                } else {
                    $gradeDistribution['Not Graded']++;
                }
            }
            
            return [
                'statusCode' => 200,
                'data' => [
                    'course' => $course,
                    'students' => $students,
                    'assignments' => $assignments,
                    'grade_distribution' => $gradeDistribution,
                    'total_students' => count($students)
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getFacultyCoursesGrades($authUser) {
        try {
            // Get courses taught by faculty
            if ($authUser['type'] === 'faculty') {
                $stmt = $this->conn->prepare("
                    SELECT id, code, name, semester, department, credits
                    FROM courses 
                    WHERE instructor_id = ?
                    ORDER BY semester, name
                ");
                $stmt->execute([$authUser['id']]);
            } else {
                // Admin can see all courses
                $stmt = $this->conn->prepare("
                    SELECT c.id, c.code, c.name, c.semester, c.department, c.credits,
                           u.full_name as instructor_name
                    FROM courses c
                    LEFT JOIN users u ON c.instructor_id = u.id
                    ORDER BY c.semester, c.name
                ");
                $stmt->execute();
            }
            
            $courses = $stmt->fetchAll();
            
            // Get grade statistics for each course
            foreach ($courses as &$course) {
                $stmt = $this->conn->prepare("
                    SELECT 
                        COUNT(*) as total_students,
                        COUNT(CASE WHEN grade_letter IS NOT NULL THEN 1 END) as graded_students,
                        AVG(grade_point) as average_gpa
                    FROM enrollments
                    WHERE course_id = ?
                ");
                $stmt->execute([$course['id']]);
                $stats = $stmt->fetch();
                
                $course['total_students'] = (int)$stats['total_students'];
                $course['graded_students'] = (int)$stats['graded_students'];
                $course['average_gpa'] = $stats['average_gpa'] ? round($stats['average_gpa'], 2) : null;
                
                // Get grade distribution
                $stmt = $this->conn->prepare("
                    SELECT grade_letter, COUNT(*) as count
                    FROM enrollments
                    WHERE course_id = ? AND grade_letter IS NOT NULL
                    GROUP BY grade_letter
                    ORDER BY grade_letter
                ");
                $stmt->execute([$course['id']]);
                $distribution = $stmt->fetchAll();
                
                $course['grade_distribution'] = $distribution;
            }
            
            return [
                'statusCode' => 200,
                'data' => $courses
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function addGrades($courseId, $authUser) {
        $required = ['grades_data'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if course exists
            $stmt = $this->conn->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$courseId]);
            $course = $stmt->fetch();
            
            if (!$course) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Course not found']
                ];
            }
            
            // Check if faculty is the instructor of the course
            if ($authUser['type'] === 'faculty' && $course['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only add grades for courses you teach']
                ];
            }
            
            $gradesData = $this->requestData['grades_data'];
            
            if (!is_array($gradesData)) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Grades data must be an array']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            $updated = 0;
            $errors = [];
            
            foreach ($gradesData as $grade) {
                if (!isset($grade['student_id']) || 
                    !isset($grade['grade_point']) || 
                    !isset($grade['grade_letter'])) {
                    $errors[] = 'Missing required fields for one or more students';
                    continue;
                }
                
                $studentId = (int)$grade['student_id'];
                $gradePoint = (float)$grade['grade_point'];
                $gradeLetter = $this->sanitizeInput($grade['grade_letter']);
                $remarks = isset($grade['remarks']) ? $this->sanitizeInput($grade['remarks']) : null;
                
                // Validate grade point
                if ($gradePoint < 0 || $gradePoint > 4.0) {
                    $errors[] = "Invalid grade point for student ID {$studentId}. Must be between 0 and 4.0";
                    continue;
                }
                
                // Check if student is enrolled in the course
                $stmt = $this->conn->prepare("
                    SELECT id FROM enrollments 
                    WHERE student_id = ? AND course_id = ?
                ");
                $stmt->execute([$studentId, $courseId]);
                $enrollment = $stmt->fetch();
                
                if (!$enrollment) {
                    $errors[] = "Student ID {$studentId} is not enrolled in this course";
                    continue;
                }
                
                // Update enrollment with grade
                $stmt = $this->conn->prepare("
                    UPDATE enrollments 
                    SET grade_point = ?, grade_letter = ?, remarks = ?, updated_by = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->execute([$gradePoint, $gradeLetter, $remarks, $authUser['id'], $enrollment['id']]);
                $updated++;
            }
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => 'Grades added successfully',
                    'updated' => $updated,
                    'errors' => $errors
                ]
            ];
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->conn->rollBack();
            
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function updateGrade($enrollmentId, $authUser) {
        $required = ['grade_point', 'grade_letter'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if enrollment exists
            $stmt = $this->conn->prepare("
                SELECT e.*, c.instructor_id, c.id as course_id
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.id = ?
            ");
            $stmt->execute([$enrollmentId]);
            $enrollment = $stmt->fetch();
            
            if (!$enrollment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Enrollment record not found']
                ];
            }
            
            // Check if faculty is the instructor of the course
            if ($authUser['type'] === 'faculty' && $enrollment['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only update grades for courses you teach']
                ];
            }
            
            $gradePoint = (float)$this->requestData['grade_point'];
            $gradeLetter = $this->sanitizeInput($this->requestData['grade_letter']);
            $remarks = isset($this->requestData['remarks']) ? 
                $this->sanitizeInput($this->requestData['remarks']) : $enrollment['remarks'];
            
            // Validate grade point
            if ($gradePoint < 0 || $gradePoint > 4.0) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Grade point must be between 0 and 4.0']
                ];
            }
            
            // Update enrollment with grade
            $stmt = $this->conn->prepare("
                UPDATE enrollments 
                SET grade_point = ?, grade_letter = ?, remarks = ?, updated_by = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$gradePoint, $gradeLetter, $remarks, $authUser['id'], $enrollmentId]);
            
            // Get updated enrollment
            $stmt = $this->conn->prepare("
                SELECT e.*, u.full_name as student_name, ub.full_name as updated_by_name
                FROM enrollments e
                JOIN users u ON e.student_id = u.id
                LEFT JOIN users ub ON e.updated_by = ub.id
                WHERE e.id = ?
            ");
            $stmt->execute([$enrollmentId]);
            $updatedEnrollment = $stmt->fetch();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => 'Grade updated successfully',
                    'enrollment' => $updatedEnrollment
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
}
?> 