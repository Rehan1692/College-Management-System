<?php
require_once __DIR__ . '/BaseApi.php';

class AssignmentsApi extends BaseApi {
    protected function handleGet() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific assignment ID is requested
        $assignmentId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if ($assignmentId) {
            // Check for specific assignment action
            $action = isset($this->urlParams[1]) ? $this->urlParams[1] : '';
            
            switch ($action) {
                case 'submissions':
                    return $this->getAssignmentSubmissions($assignmentId, $authUser);
                default:
                    return $this->getAssignmentDetails($assignmentId, $authUser);
            }
        } else {
            // Check if course ID is provided
            $courseId = isset($this->requestData['course_id']) ? 
                (int)$this->requestData['course_id'] : null;
            
            if ($courseId) {
                return $this->getCourseAssignments($courseId, $authUser);
            } else {
                // Get all assignments for the user
                return $this->getUserAssignments($authUser);
            }
        }
    }
    
    protected function handlePost() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific assignment ID is requested
        $assignmentId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if ($assignmentId) {
            // Check for specific assignment action
            $action = isset($this->urlParams[1]) ? $this->urlParams[1] : '';
            
            switch ($action) {
                case 'submit':
                    return $this->submitAssignment($assignmentId, $authUser);
                case 'grade':
                    return $this->gradeSubmission($assignmentId, $authUser);
                default:
                    return [
                        'statusCode' => 400,
                        'data' => ['error' => 'Invalid action']
                    ];
            }
        } else {
            // Create a new assignment
            return $this->createAssignment($authUser);
        }
    }
    
    protected function handlePut() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific assignment ID is provided
        $assignmentId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$assignmentId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Assignment ID is required']
            ];
        }
        
        // Update assignment details
        return $this->updateAssignment($assignmentId, $authUser);
    }
    
    protected function handleDelete() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific assignment ID is provided
        $assignmentId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$assignmentId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Assignment ID is required']
            ];
        }
        
        // Delete assignment
        return $this->deleteAssignment($assignmentId, $authUser);
    }
    
    private function getUserAssignments($authUser) {
        try {
            if ($authUser['type'] === 'student') {
                // Get assignments for courses the student is enrolled in
                $stmt = $this->conn->prepare("
                    SELECT a.*, c.name as course_name, c.code as course_code,
                           s.id as submission_id, s.submitted_date, s.status as submission_status, s.score
                    FROM assignments a
                    JOIN courses c ON a.course_id = c.id
                    JOIN enrollments e ON c.id = e.course_id
                    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
                    WHERE e.student_id = ?
                    ORDER BY a.due_date DESC
                ");
                $stmt->execute([$authUser['id'], $authUser['id']]);
            } else {
                // Get assignments created by the faculty
                $stmt = $this->conn->prepare("
                    SELECT a.*, c.name as course_name, c.code as course_code,
                           (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
                    FROM assignments a
                    JOIN courses c ON a.course_id = c.id
                    WHERE a.created_by = ? OR c.instructor_id = ?
                    ORDER BY a.due_date DESC
                ");
                $stmt->execute([$authUser['id'], $authUser['id']]);
            }
            
            $assignments = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => $assignments
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getCourseAssignments($courseId, $authUser) {
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
            if ($authUser['type'] === 'student') {
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
                
                // Get assignments with submission status
                $stmt = $this->conn->prepare("
                    SELECT a.*, 
                           s.id as submission_id, s.submitted_date, s.status as submission_status, s.score
                    FROM assignments a
                    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
                    WHERE a.course_id = ?
                    ORDER BY a.due_date DESC
                ");
                $stmt->execute([$authUser['id'], $courseId]);
            } else {
                // For faculty, check if they teach the course
                if ($authUser['type'] === 'faculty' && $course['instructor_id'] != $authUser['id']) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You can only view assignments for courses you teach']
                    ];
                }
                
                // Get all assignments for the course
                $stmt = $this->conn->prepare("
                    SELECT a.*, 
                           (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
                    FROM assignments a
                    WHERE a.course_id = ?
                    ORDER BY a.due_date DESC
                ");
                $stmt->execute([$courseId]);
            }
            
            $assignments = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'course' => $course,
                    'assignments' => $assignments
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getAssignmentDetails($assignmentId, $authUser) {
        try {
            // Get assignment details
            $stmt = $this->conn->prepare("
                SELECT a.*, c.name as course_name, c.code as course_code, c.instructor_id,
                       u.full_name as created_by_name
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                JOIN users u ON a.created_by = u.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assignmentId]);
            $assignment = $stmt->fetch();
            
            if (!$assignment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Assignment not found']
                ];
            }
            
            // Check if user has access to this assignment
            if ($authUser['type'] === 'student') {
                // Check if student is enrolled in the course
                $stmt = $this->conn->prepare("
                    SELECT id FROM enrollments 
                    WHERE student_id = ? AND course_id = ?
                ");
                $stmt->execute([$authUser['id'], $assignment['course_id']]);
                if (!$stmt->fetch()) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You are not enrolled in this course']
                    ];
                }
                
                // Get student's submission
                $stmt = $this->conn->prepare("
                    SELECT * FROM submissions 
                    WHERE assignment_id = ? AND student_id = ?
                ");
                $stmt->execute([$assignmentId, $authUser['id']]);
                $submission = $stmt->fetch();
                
                $assignment['submission'] = $submission ? $submission : null;
            } else {
                // For faculty, check if they teach the course
                if ($authUser['type'] === 'faculty' && $assignment['instructor_id'] != $authUser['id']) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You can only view assignments for courses you teach']
                    ];
                }
                
                // Get submission statistics
                $stmt = $this->conn->prepare("
                    SELECT 
                        COUNT(*) as total_submissions,
                        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
                        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded_count,
                        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                        AVG(score) as average_score
                    FROM submissions 
                    WHERE assignment_id = ?
                ");
                $stmt->execute([$assignmentId]);
                $stats = $stmt->fetch();
                
                $assignment['submission_stats'] = $stats;
            }
            
            return [
                'statusCode' => 200,
                'data' => $assignment
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getAssignmentSubmissions($assignmentId, $authUser) {
        try {
            // Get assignment details
            $stmt = $this->conn->prepare("
                SELECT a.*, c.name as course_name, c.instructor_id
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assignmentId]);
            $assignment = $stmt->fetch();
            
            if (!$assignment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Assignment not found']
                ];
            }
            
            // Only faculty teaching the course or admin can view all submissions
            if ($authUser['type'] === 'faculty' && $assignment['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only view submissions for courses you teach']
                ];
            } else if ($authUser['type'] === 'student') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'Students cannot view all submissions']
                ];
            }
            
            // Get all submissions
            $stmt = $this->conn->prepare("
                SELECT s.*, u.full_name as student_name, sp.roll_number,
                       g.full_name as graded_by_name
                FROM submissions s
                JOIN users u ON s.student_id = u.id
                JOIN student_profiles sp ON u.id = sp.user_id
                LEFT JOIN users g ON s.graded_by = g.id
                WHERE s.assignment_id = ?
                ORDER BY s.submitted_date
            ");
            $stmt->execute([$assignmentId]);
            $submissions = $stmt->fetchAll();
            
            // Get students who haven't submitted
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, sp.roll_number
                FROM users u
                JOIN enrollments e ON u.id = e.student_id
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE e.course_id = ?
                AND u.id NOT IN (
                    SELECT student_id FROM submissions 
                    WHERE assignment_id = ?
                )
                ORDER BY u.full_name
            ");
            $stmt->execute([$assignment['course_id'], $assignmentId]);
            $missingSubmissions = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'assignment' => $assignment,
                    'submissions' => $submissions,
                    'missing_submissions' => $missingSubmissions
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function createAssignment($authUser) {
        // Only faculty and admin can create assignments
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot create assignments']
            ];
        }
        
        $required = ['course_id', 'title', 'due_date', 'total_marks'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            $courseId = (int)$this->requestData['course_id'];
            
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
                    'data' => ['error' => 'You can only create assignments for courses you teach']
                ];
            }
            
            // Prepare assignment data
            $assignmentData = [
                'course_id' => $courseId,
                'title' => $this->sanitizeInput($this->requestData['title']),
                'due_date' => $this->sanitizeInput($this->requestData['due_date']),
                'total_marks' => (int)$this->requestData['total_marks'],
                'created_by' => $authUser['id']
            ];
            
            // Add optional fields
            $optionalFields = ['description', 'weightage'];
            foreach ($optionalFields as $field) {
                if (isset($this->requestData[$field])) {
                    $assignmentData[$field] = $this->sanitizeInput($this->requestData[$field]);
                }
            }
            
            // Create SQL
            $columns = implode(', ', array_keys($assignmentData));
            $placeholders = implode(', ', array_fill(0, count($assignmentData), '?'));
            
            $stmt = $this->conn->prepare("
                INSERT INTO assignments ({$columns}) 
                VALUES ({$placeholders})
            ");
            $stmt->execute(array_values($assignmentData));
            
            $assignmentId = $this->conn->lastInsertId();
            
            // Return created assignment
            return $this->getAssignmentDetails($assignmentId, $authUser);
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function updateAssignment($assignmentId, $authUser) {
        // Only faculty and admin can update assignments
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot update assignments']
            ];
        }
        
        try {
            // Check if assignment exists
            $stmt = $this->conn->prepare("
                SELECT a.*, c.instructor_id 
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assignmentId]);
            $assignment = $stmt->fetch();
            
            if (!$assignment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Assignment not found']
                ];
            }
            
            // Check if faculty is the instructor of the course
            if ($authUser['type'] === 'faculty' && $assignment['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only update assignments for courses you teach']
                ];
            }
            
            // Prepare update data
            $updateFields = [];
            $updateValues = [];
            
            // Fields that can be updated
            $allowedFields = [
                'title', 'description', 'due_date', 'total_marks', 'weightage'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($this->requestData[$field])) {
                    $updateFields[] = "{$field} = ?";
                    $updateValues[] = $this->sanitizeInput($this->requestData[$field]);
                }
            }
            
            if (empty($updateFields)) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'No fields to update']
                ];
            }
            
            // Add assignment ID to values
            $updateValues[] = $assignmentId;
            
            // Update assignment
            $stmt = $this->conn->prepare("
                UPDATE assignments 
                SET " . implode(', ', $updateFields) . " 
                WHERE id = ?
            ");
            $stmt->execute($updateValues);
            
            // Return updated assignment
            return $this->getAssignmentDetails($assignmentId, $authUser);
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function deleteAssignment($assignmentId, $authUser) {
        // Only faculty and admin can delete assignments
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot delete assignments']
            ];
        }
        
        try {
            // Check if assignment exists
            $stmt = $this->conn->prepare("
                SELECT a.*, c.instructor_id 
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assignmentId]);
            $assignment = $stmt->fetch();
            
            if (!$assignment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Assignment not found']
                ];
            }
            
            // Check if faculty is the instructor of the course
            if ($authUser['type'] === 'faculty' && $assignment['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only delete assignments for courses you teach']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Delete submissions first
            $stmt = $this->conn->prepare("DELETE FROM submissions WHERE assignment_id = ?");
            $stmt->execute([$assignmentId]);
            
            // Delete assignment
            $stmt = $this->conn->prepare("DELETE FROM assignments WHERE id = ?");
            $stmt->execute([$assignmentId]);
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'statusCode' => 200,
                'data' => ['message' => 'Assignment deleted successfully']
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
    
    private function submitAssignment($assignmentId, $authUser) {
        // Only students can submit assignments
        if ($authUser['type'] !== 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Only students can submit assignments']
            ];
        }
        
        $required = ['file_path'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if assignment exists
            $stmt = $this->conn->prepare("
                SELECT a.*, c.id as course_id 
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assignmentId]);
            $assignment = $stmt->fetch();
            
            if (!$assignment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Assignment not found']
                ];
            }
            
            // Check if student is enrolled in the course
            $stmt = $this->conn->prepare("
                SELECT id FROM enrollments 
                WHERE student_id = ? AND course_id = ?
            ");
            $stmt->execute([$authUser['id'], $assignment['course_id']]);
            if (!$stmt->fetch()) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You are not enrolled in this course']
                ];
            }
            
            // Check if student has already submitted
            $stmt = $this->conn->prepare("
                SELECT id FROM submissions 
                WHERE assignment_id = ? AND student_id = ?
            ");
            $stmt->execute([$assignmentId, $authUser['id']]);
            $existingSubmission = $stmt->fetch();
            
            $submittedDate = date('Y-m-d H:i:s');
            $dueDate = new DateTime($assignment['due_date']);
            $now = new DateTime();
            
            // Determine submission status
            $status = $now > $dueDate ? 'late' : 'submitted';
            
            if ($existingSubmission) {
                // Update existing submission
                $stmt = $this->conn->prepare("
                    UPDATE submissions 
                    SET file_path = ?, submitted_date = ?, status = ? 
                    WHERE id = ?
                ");
                $stmt->execute([
                    $this->sanitizeInput($this->requestData['file_path']),
                    $submittedDate,
                    $status,
                    $existingSubmission['id']
                ]);
                
                $submissionId = $existingSubmission['id'];
                $message = 'Assignment resubmitted successfully';
            } else {
                // Create new submission
                $stmt = $this->conn->prepare("
                    INSERT INTO submissions 
                    (assignment_id, student_id, submitted_date, file_path, status) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $assignmentId,
                    $authUser['id'],
                    $submittedDate,
                    $this->sanitizeInput($this->requestData['file_path']),
                    $status
                ]);
                
                $submissionId = $this->conn->lastInsertId();
                $message = 'Assignment submitted successfully';
            }
            
            // Get the submission
            $stmt = $this->conn->prepare("
                SELECT * FROM submissions WHERE id = ?
            ");
            $stmt->execute([$submissionId]);
            $submission = $stmt->fetch();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => $message,
                    'submission' => $submission
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function gradeSubmission($assignmentId, $authUser) {
        // Only faculty and admin can grade submissions
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot grade submissions']
            ];
        }
        
        $required = ['student_id', 'score'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if assignment exists
            $stmt = $this->conn->prepare("
                SELECT a.*, c.instructor_id 
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assignmentId]);
            $assignment = $stmt->fetch();
            
            if (!$assignment) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Assignment not found']
                ];
            }
            
            // Check if faculty is the instructor of the course
            if ($authUser['type'] === 'faculty' && $assignment['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only grade assignments for courses you teach']
                ];
            }
            
            $studentId = (int)$this->requestData['student_id'];
            $score = (float)$this->requestData['score'];
            $feedback = isset($this->requestData['feedback']) ? 
                $this->sanitizeInput($this->requestData['feedback']) : null;
            
            // Check if submission exists
            $stmt = $this->conn->prepare("
                SELECT * FROM submissions 
                WHERE assignment_id = ? AND student_id = ?
            ");
            $stmt->execute([$assignmentId, $studentId]);
            $submission = $stmt->fetch();
            
            if (!$submission) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Submission not found']
                ];
            }
            
            // Validate score
            if ($score < 0 || $score > $assignment['total_marks']) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => "Score must be between 0 and {$assignment['total_marks']}"]
                ];
            }
            
            // Update submission with grade
            $stmt = $this->conn->prepare("
                UPDATE submissions 
                SET score = ?, feedback = ?, status = 'graded', graded_by = ?, graded_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$score, $feedback, $authUser['id'], $submission['id']]);
            
            // Get updated submission
            $stmt = $this->conn->prepare("
                SELECT s.*, u.full_name as student_name
                FROM submissions s
                JOIN users u ON s.student_id = u.id
                WHERE s.id = ?
            ");
            $stmt->execute([$submission['id']]);
            $updatedSubmission = $stmt->fetch();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => 'Submission graded successfully',
                    'submission' => $updatedSubmission
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