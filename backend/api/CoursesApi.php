<?php
require_once __DIR__ . '/BaseApi.php';

class CoursesApi extends BaseApi {
    protected function handleGet() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific course ID is requested
        $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if ($courseId) {
            // Check for specific course action
            $action = isset($this->urlParams[1]) ? $this->urlParams[1] : '';
            
            switch ($action) {
                case 'students':
                    return $this->getCourseStudents($courseId, $authUser);
                case 'materials':
                    return $this->getCourseMaterials($courseId, $authUser);
                case 'schedule':
                    return $this->getCourseSchedule($courseId, $authUser);
                default:
                    return $this->getCourseDetails($courseId, $authUser);
            }
        } else {
            // List all courses with optional filters
            return $this->getCoursesList($authUser);
        }
    }
    
    protected function handlePost() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can create courses
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot create courses']
            ];
        }
        
        // Check for specific course action
        $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        $action = isset($this->urlParams[1]) ? $this->urlParams[1] : '';
        
        if ($courseId) {
            switch ($action) {
                case 'enroll':
                    return $this->enrollStudent($courseId, $authUser);
                case 'materials':
                    return $this->addCourseMaterial($courseId, $authUser);
                case 'schedule':
                    return $this->addCourseSchedule($courseId, $authUser);
                default:
                    return [
                        'statusCode' => 400,
                        'data' => ['error' => 'Invalid action']
                    ];
            }
        } else {
            // Create a new course
            return $this->createCourse($authUser);
        }
    }
    
    protected function handlePut() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific course ID is provided
        $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$courseId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Course ID is required']
            ];
        }
        
        // Update course details
        return $this->updateCourse($courseId, $authUser);
    }
    
    protected function handleDelete() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only admin can delete courses
        if ($authUser['type'] !== 'admin') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Only administrators can delete courses']
            ];
        }
        
        // Check if a specific course ID is provided
        $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$courseId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Course ID is required']
            ];
        }
        
        // Delete course
        return $this->deleteCourse($courseId);
    }
    
    private function getCoursesList($authUser) {
        try {
            $params = [];
            $whereConditions = [];
            
            // Apply filters based on query parameters
            if (isset($this->requestData['department'])) {
                $whereConditions[] = "department = ?";
                $params[] = $this->sanitizeInput($this->requestData['department']);
            }
            
            if (isset($this->requestData['semester'])) {
                $whereConditions[] = "semester = ?";
                $params[] = $this->sanitizeInput($this->requestData['semester']);
            }
            
            // For students, only show enrolled courses
            if ($authUser['type'] === 'student') {
                $query = "
                    SELECT c.*, e.grade_point, e.grade_letter, e.enrollment_date
                    FROM courses c
                    JOIN enrollments e ON c.id = e.course_id
                    WHERE e.student_id = ?
                ";
                $params = [$authUser['id']];
                
                if (!empty($whereConditions)) {
                    $query .= " AND " . implode(' AND ', $whereConditions);
                }
                
                $query .= " ORDER BY c.semester, c.name";
            } 
            // For faculty, show courses they teach
            else if ($authUser['type'] === 'faculty') {
                $query = "SELECT * FROM courses WHERE instructor_id = ?";
                $params = [$authUser['id']];
                
                if (!empty($whereConditions)) {
                    $query .= " AND " . implode(' AND ', $whereConditions);
                }
                
                $query .= " ORDER BY semester, name";
            } 
            // For admin, show all courses
            else {
                $query = "SELECT * FROM courses";
                
                if (!empty($whereConditions)) {
                    $query .= " WHERE " . implode(' AND ', $whereConditions);
                }
                
                $query .= " ORDER BY semester, name";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $courses = $stmt->fetchAll();
            
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
    
    private function getCourseDetails($courseId, $authUser) {
        try {
            // Get course details
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
            
            // If student, check if enrolled
            if ($authUser['type'] === 'student') {
                $stmt = $this->conn->prepare("
                    SELECT * FROM enrollments 
                    WHERE student_id = ? AND course_id = ?
                ");
                $stmt->execute([$authUser['id'], $courseId]);
                $enrollment = $stmt->fetch();
                
                $course['enrolled'] = $enrollment ? true : false;
                if ($enrollment) {
                    $course['grade_point'] = $enrollment['grade_point'];
                    $course['grade_letter'] = $enrollment['grade_letter'];
                    $course['enrollment_date'] = $enrollment['enrollment_date'];
                }
            }
            
            // Get course schedule
            $stmt = $this->conn->prepare("
                SELECT * FROM course_schedule 
                WHERE course_id = ?
                ORDER BY day, start_time
            ");
            $stmt->execute([$courseId]);
            $course['schedule'] = $stmt->fetchAll();
            
            // Get enrolled students count
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) as enrolled_count 
                FROM enrollments 
                WHERE course_id = ?
            ");
            $stmt->execute([$courseId]);
            $enrollmentCount = $stmt->fetch();
            $course['enrolled_students'] = (int)$enrollmentCount['enrolled_count'];
            
            return [
                'statusCode' => 200,
                'data' => $course
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getCourseStudents($courseId, $authUser) {
        try {
            // Only faculty teaching the course or admin can view students
            if ($authUser['type'] === 'faculty') {
                $stmt = $this->conn->prepare("
                    SELECT instructor_id FROM courses WHERE id = ?
                ");
                $stmt->execute([$courseId]);
                $course = $stmt->fetch();
                
                if (!$course || $course['instructor_id'] != $authUser['id']) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You can only view students for courses you teach']
                    ];
                }
            } else if ($authUser['type'] === 'student') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'Students cannot view the full student list']
                ];
            }
            
            // Get enrolled students
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, u.email, sp.roll_number, sp.department, 
                       e.grade_point, e.grade_letter, e.enrollment_date
                FROM users u
                JOIN enrollments e ON u.id = e.student_id
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE e.course_id = ?
                ORDER BY u.full_name
            ");
            $stmt->execute([$courseId]);
            $students = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => $students
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getCourseMaterials($courseId, $authUser) {
        try {
            // Get course materials
            $stmt = $this->conn->prepare("
                SELECT cm.*, u.full_name as uploaded_by_name
                FROM course_materials cm
                JOIN users u ON cm.uploaded_by = u.id
                WHERE cm.course_id = ?
                ORDER BY cm.created_at DESC
            ");
            $stmt->execute([$courseId]);
            $materials = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => $materials
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getCourseSchedule($courseId, $authUser) {
        try {
            // Get course schedule
            $stmt = $this->conn->prepare("
                SELECT * FROM course_schedule 
                WHERE course_id = ?
                ORDER BY day, start_time
            ");
            $stmt->execute([$courseId]);
            $schedule = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => $schedule
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function createCourse($authUser) {
        $required = ['code', 'name', 'credits', 'semester', 'department'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if course code already exists
            $stmt = $this->conn->prepare("SELECT id FROM courses WHERE code = ?");
            $stmt->execute([$this->requestData['code']]);
            if ($stmt->fetch()) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Course code already exists']
                ];
            }
            
            // Prepare course data
            $courseData = [
                'code' => $this->sanitizeInput($this->requestData['code']),
                'name' => $this->sanitizeInput($this->requestData['name']),
                'credits' => (int)$this->requestData['credits'],
                'semester' => $this->sanitizeInput($this->requestData['semester']),
                'department' => $this->sanitizeInput($this->requestData['department']),
                'instructor_id' => $authUser['type'] === 'faculty' ? $authUser['id'] : null
            ];
            
            // Add optional fields
            $optionalFields = ['description', 'max_students'];
            foreach ($optionalFields as $field) {
                if (isset($this->requestData[$field])) {
                    $courseData[$field] = $this->sanitizeInput($this->requestData[$field]);
                }
            }
            
            // If admin is creating course and instructor_id is provided
            if ($authUser['type'] === 'admin' && isset($this->requestData['instructor_id'])) {
                $courseData['instructor_id'] = (int)$this->requestData['instructor_id'];
            }
            
            // Create SQL
            $columns = implode(', ', array_keys($courseData));
            $placeholders = implode(', ', array_fill(0, count($courseData), '?'));
            
            $stmt = $this->conn->prepare("
                INSERT INTO courses ({$columns}) 
                VALUES ({$placeholders})
            ");
            $stmt->execute(array_values($courseData));
            
            $courseId = $this->conn->lastInsertId();
            
            // Return created course
            return $this->getCourseDetails($courseId, $authUser);
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function updateCourse($courseId, $authUser) {
        try {
            // Check if course exists and user has permission to update
            $stmt = $this->conn->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$courseId]);
            $course = $stmt->fetch();
            
            if (!$course) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Course not found']
                ];
            }
            
            // Only the instructor or admin can update course
            if ($authUser['type'] === 'faculty' && $course['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only update courses you teach']
                ];
            } else if ($authUser['type'] === 'student') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'Students cannot update courses']
                ];
            }
            
            // Prepare update data
            $updateFields = [];
            $updateValues = [];
            
            // Fields that can be updated
            $allowedFields = [
                'name', 'description', 'credits', 'semester', 
                'department', 'max_students'
            ];
            
            // Admin can also update these fields
            if ($authUser['type'] === 'admin') {
                $allowedFields[] = 'code';
                $allowedFields[] = 'instructor_id';
            }
            
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
            
            // Add course ID to values
            $updateValues[] = $courseId;
            
            // Update course
            $stmt = $this->conn->prepare("
                UPDATE courses 
                SET " . implode(', ', $updateFields) . " 
                WHERE id = ?
            ");
            $stmt->execute($updateValues);
            
            // Return updated course
            return $this->getCourseDetails($courseId, $authUser);
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function deleteCourse($courseId) {
        try {
            // Check if course exists
            $stmt = $this->conn->prepare("SELECT id FROM courses WHERE id = ?");
            $stmt->execute([$courseId]);
            if (!$stmt->fetch()) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Course not found']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Delete related records
            $tables = [
                'enrollments', 'attendance', 'assignments', 
                'course_materials', 'course_schedule'
            ];
            
            foreach ($tables as $table) {
                $stmt = $this->conn->prepare("DELETE FROM {$table} WHERE course_id = ?");
                $stmt->execute([$courseId]);
            }
            
            // Delete course
            $stmt = $this->conn->prepare("DELETE FROM courses WHERE id = ?");
            $stmt->execute([$courseId]);
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'statusCode' => 200,
                'data' => ['message' => 'Course deleted successfully']
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
    
    private function enrollStudent($courseId, $authUser) {
        // Students can enroll themselves, faculty can enroll students
        $studentId = $authUser['type'] === 'student' ? 
            $authUser['id'] : (int)$this->requestData['student_id'];
        
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
            
            // Check if student is already enrolled
            $stmt = $this->conn->prepare("
                SELECT id FROM enrollments 
                WHERE student_id = ? AND course_id = ?
            ");
            $stmt->execute([$studentId, $courseId]);
            if ($stmt->fetch()) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Student is already enrolled in this course']
                ];
            }
            
            // Check if course is full
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) as enrolled_count 
                FROM enrollments 
                WHERE course_id = ?
            ");
            $stmt->execute([$courseId]);
            $enrollmentCount = $stmt->fetch();
            
            if ((int)$enrollmentCount['enrolled_count'] >= $course['max_students']) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Course is full']
                ];
            }
            
            // Enroll student
            $stmt = $this->conn->prepare("
                INSERT INTO enrollments (student_id, course_id) 
                VALUES (?, ?)
            ");
            $stmt->execute([$studentId, $courseId]);
            
            return [
                'statusCode' => 201,
                'data' => [
                    'message' => 'Student enrolled successfully',
                    'enrollment_id' => $this->conn->lastInsertId()
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function addCourseMaterial($courseId, $authUser) {
        $required = ['title', 'type', 'file_path'];
        $this->validateRequiredParams($required, $this->requestData);
        
        // Only faculty teaching the course or admin can add materials
        try {
            if ($authUser['type'] === 'faculty') {
                $stmt = $this->conn->prepare("
                    SELECT instructor_id FROM courses WHERE id = ?
                ");
                $stmt->execute([$courseId]);
                $course = $stmt->fetch();
                
                if (!$course || $course['instructor_id'] != $authUser['id']) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You can only add materials to courses you teach']
                    ];
                }
            } else if ($authUser['type'] === 'student') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'Students cannot add course materials']
                ];
            }
            
            // Prepare material data
            $materialData = [
                'course_id' => $courseId,
                'title' => $this->sanitizeInput($this->requestData['title']),
                'type' => $this->sanitizeInput($this->requestData['type']),
                'file_path' => $this->sanitizeInput($this->requestData['file_path']),
                'uploaded_by' => $authUser['id']
            ];
            
            // Add description if provided
            if (isset($this->requestData['description'])) {
                $materialData['description'] = $this->sanitizeInput($this->requestData['description']);
            }
            
            // Create SQL
            $columns = implode(', ', array_keys($materialData));
            $placeholders = implode(', ', array_fill(0, count($materialData), '?'));
            
            $stmt = $this->conn->prepare("
                INSERT INTO course_materials ({$columns}) 
                VALUES ({$placeholders})
            ");
            $stmt->execute(array_values($materialData));
            
            $materialId = $this->conn->lastInsertId();
            
            // Get the created material
            $stmt = $this->conn->prepare("
                SELECT cm.*, u.full_name as uploaded_by_name
                FROM course_materials cm
                JOIN users u ON cm.uploaded_by = u.id
                WHERE cm.id = ?
            ");
            $stmt->execute([$materialId]);
            $material = $stmt->fetch();
            
            return [
                'statusCode' => 201,
                'data' => $material
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function addCourseSchedule($courseId, $authUser) {
        $required = ['day', 'start_time', 'end_time'];
        $this->validateRequiredParams($required, $this->requestData);
        
        // Only faculty teaching the course or admin can add schedule
        try {
            if ($authUser['type'] === 'faculty') {
                $stmt = $this->conn->prepare("
                    SELECT instructor_id FROM courses WHERE id = ?
                ");
                $stmt->execute([$courseId]);
                $course = $stmt->fetch();
                
                if (!$course || $course['instructor_id'] != $authUser['id']) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You can only add schedule to courses you teach']
                    ];
                }
            } else if ($authUser['type'] === 'student') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'Students cannot add course schedule']
                ];
            }
            
            // Prepare schedule data
            $scheduleData = [
                'course_id' => $courseId,
                'day' => $this->sanitizeInput($this->requestData['day']),
                'start_time' => $this->sanitizeInput($this->requestData['start_time']),
                'end_time' => $this->sanitizeInput($this->requestData['end_time'])
            ];
            
            // Add room if provided
            if (isset($this->requestData['room'])) {
                $scheduleData['room'] = $this->sanitizeInput($this->requestData['room']);
            }
            
            // Create SQL
            $columns = implode(', ', array_keys($scheduleData));
            $placeholders = implode(', ', array_fill(0, count($scheduleData), '?'));
            
            $stmt = $this->conn->prepare("
                INSERT INTO course_schedule ({$columns}) 
                VALUES ({$placeholders})
            ");
            $stmt->execute(array_values($scheduleData));
            
            $scheduleId = $this->conn->lastInsertId();
            
            // Get the created schedule
            $stmt = $this->conn->prepare("
                SELECT * FROM course_schedule WHERE id = ?
            ");
            $stmt->execute([$scheduleId]);
            $schedule = $stmt->fetch();
            
            return [
                'statusCode' => 201,
                'data' => $schedule
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