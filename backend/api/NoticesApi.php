<?php
require_once __DIR__ . '/BaseApi.php';

class NoticesApi extends BaseApi {
    protected function handleGet() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific notice ID is requested
        $noticeId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if ($noticeId) {
            return $this->getNoticeDetails($noticeId, $authUser);
        } else {
            // Check for specific filters
            $type = isset($this->requestData['type']) ? $this->sanitizeInput($this->requestData['type']) : null;
            $courseId = isset($this->requestData['course_id']) ? (int)$this->requestData['course_id'] : null;
            $departmentId = isset($this->requestData['department_id']) ? (int)$this->requestData['department_id'] : null;
            
            return $this->getNoticesList($authUser, $type, $courseId, $departmentId);
        }
    }
    
    protected function handlePost() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can create notices
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot create notices']
            ];
        }
        
        // Create a new notice
        return $this->createNotice($authUser);
    }
    
    protected function handlePut() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can update notices
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot update notices']
            ];
        }
        
        // Check if a specific notice ID is provided
        $noticeId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$noticeId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Notice ID is required']
            ];
        }
        
        // Update notice
        return $this->updateNotice($noticeId, $authUser);
    }
    
    protected function handleDelete() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can delete notices
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot delete notices']
            ];
        }
        
        // Check if a specific notice ID is provided
        $noticeId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$noticeId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Notice ID is required']
            ];
        }
        
        // Delete notice
        return $this->deleteNotice($noticeId, $authUser);
    }
    
    private function getNoticesList($authUser, $type = null, $courseId = null, $departmentId = null) {
        try {
            $params = [];
            $whereConditions = [];
            
            // Base query
            $query = "
                SELECT n.*, u.full_name as created_by_name, 
                       c.name as course_name, c.code as course_code,
                       d.name as department_name
                FROM notices n
                LEFT JOIN users u ON n.created_by = u.id
                LEFT JOIN courses c ON n.course_id = c.id
                LEFT JOIN departments d ON n.department_id = d.id
                WHERE 1=1
            ";
            
            // Apply filters
            if ($type) {
                $whereConditions[] = "n.type = ?";
                $params[] = $type;
            }
            
            if ($courseId) {
                $whereConditions[] = "n.course_id = ?";
                $params[] = $courseId;
                
                // For course-specific notices, check if user has access
                if ($authUser['type'] === 'student') {
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
                } else if ($authUser['type'] === 'faculty') {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM courses 
                        WHERE id = ? AND instructor_id = ?
                    ");
                    $stmt->execute([$courseId, $authUser['id']]);
                    if (!$stmt->fetch() && !$this->isAdmin($authUser)) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not teach this course']
                        ];
                    }
                }
            }
            
            if ($departmentId) {
                $whereConditions[] = "n.department_id = ?";
                $params[] = $departmentId;
                
                // For department-specific notices, check if user belongs to department
                if ($authUser['type'] === 'student') {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM student_profiles 
                        WHERE user_id = ? AND department_id = ?
                    ");
                    $stmt->execute([$authUser['id'], $departmentId]);
                    if (!$stmt->fetch()) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not belong to this department']
                        ];
                    }
                } else if ($authUser['type'] === 'faculty') {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM faculty_profiles 
                        WHERE user_id = ? AND department_id = ?
                    ");
                    $stmt->execute([$authUser['id'], $departmentId]);
                    if (!$stmt->fetch() && !$this->isAdmin($authUser)) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not belong to this department']
                        ];
                    }
                }
            }
            
            // For students, only show notices relevant to them
            if ($authUser['type'] === 'student') {
                // Get student's department and courses
                $stmt = $this->conn->prepare("
                    SELECT department_id FROM student_profiles WHERE user_id = ?
                ");
                $stmt->execute([$authUser['id']]);
                $studentDept = $stmt->fetch();
                
                $stmt = $this->conn->prepare("
                    SELECT course_id FROM enrollments WHERE student_id = ?
                ");
                $stmt->execute([$authUser['id']]);
                $enrolledCourses = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Build condition for student's notices
                $studentConditions = ["n.type = 'general'"];
                
                if ($studentDept && $studentDept['department_id']) {
                    $studentConditions[] = "(n.type = 'department' AND n.department_id = ?)";
                    $params[] = $studentDept['department_id'];
                }
                
                if (!empty($enrolledCourses)) {
                    $placeholders = implode(',', array_fill(0, count($enrolledCourses), '?'));
                    $studentConditions[] = "(n.type = 'course' AND n.course_id IN ({$placeholders}))";
                    $params = array_merge($params, $enrolledCourses);
                }
                
                $whereConditions[] = "(" . implode(' OR ', $studentConditions) . ")";
            }
            
            // Add where conditions to query
            if (!empty($whereConditions)) {
                $query .= " AND " . implode(' AND ', $whereConditions);
            }
            
            // Order by date, most recent first
            $query .= " ORDER BY n.created_at DESC";
            
            // Execute query
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $notices = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => $notices
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getNoticeDetails($noticeId, $authUser) {
        try {
            // Get notice details
            $stmt = $this->conn->prepare("
                SELECT n.*, u.full_name as created_by_name, 
                       c.name as course_name, c.code as course_code,
                       d.name as department_name
                FROM notices n
                LEFT JOIN users u ON n.created_by = u.id
                LEFT JOIN courses c ON n.course_id = c.id
                LEFT JOIN departments d ON n.department_id = d.id
                WHERE n.id = ?
            ");
            $stmt->execute([$noticeId]);
            $notice = $stmt->fetch();
            
            if (!$notice) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Notice not found']
                ];
            }
            
            // Check if user has access to this notice
            if ($authUser['type'] === 'student') {
                // For course-specific notices
                if ($notice['type'] === 'course' && $notice['course_id']) {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM enrollments 
                        WHERE student_id = ? AND course_id = ?
                    ");
                    $stmt->execute([$authUser['id'], $notice['course_id']]);
                    if (!$stmt->fetch()) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not have access to this notice']
                        ];
                    }
                }
                
                // For department-specific notices
                if ($notice['type'] === 'department' && $notice['department_id']) {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM student_profiles 
                        WHERE user_id = ? AND department_id = ?
                    ");
                    $stmt->execute([$authUser['id'], $notice['department_id']]);
                    if (!$stmt->fetch()) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not have access to this notice']
                        ];
                    }
                }
            } else if ($authUser['type'] === 'faculty') {
                // For course-specific notices
                if ($notice['type'] === 'course' && $notice['course_id']) {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM courses 
                        WHERE id = ? AND instructor_id = ?
                    ");
                    $stmt->execute([$notice['course_id'], $authUser['id']]);
                    if (!$stmt->fetch() && !$this->isAdmin($authUser) && $notice['created_by'] != $authUser['id']) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not have access to this notice']
                        ];
                    }
                }
                
                // For department-specific notices
                if ($notice['type'] === 'department' && $notice['department_id']) {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM faculty_profiles 
                        WHERE user_id = ? AND department_id = ?
                    ");
                    $stmt->execute([$authUser['id'], $notice['department_id']]);
                    if (!$stmt->fetch() && !$this->isAdmin($authUser) && $notice['created_by'] != $authUser['id']) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You do not have access to this notice']
                        ];
                    }
                }
            }
            
            // Mark notice as read for this user if not already read
            $stmt = $this->conn->prepare("
                SELECT id FROM notice_reads 
                WHERE notice_id = ? AND user_id = ?
            ");
            $stmt->execute([$noticeId, $authUser['id']]);
            if (!$stmt->fetch()) {
                $stmt = $this->conn->prepare("
                    INSERT INTO notice_reads (notice_id, user_id, read_at) 
                    VALUES (?, ?, NOW())
                ");
                $stmt->execute([$noticeId, $authUser['id']]);
            }
            
            // Get read count
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) as read_count FROM notice_reads 
                WHERE notice_id = ?
            ");
            $stmt->execute([$noticeId]);
            $readCount = $stmt->fetch();
            $notice['read_count'] = (int)$readCount['read_count'];
            
            // Get attachments if any
            $stmt = $this->conn->prepare("
                SELECT * FROM notice_attachments 
                WHERE notice_id = ?
                ORDER BY id
            ");
            $stmt->execute([$noticeId]);
            $attachments = $stmt->fetchAll();
            $notice['attachments'] = $attachments;
            
            return [
                'statusCode' => 200,
                'data' => $notice
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function createNotice($authUser) {
        $required = ['title', 'content', 'type'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Prepare notice data
            $noticeData = [
                'title' => $this->sanitizeInput($this->requestData['title']),
                'content' => $this->sanitizeInput($this->requestData['content']),
                'type' => $this->sanitizeInput($this->requestData['type']),
                'created_by' => $authUser['id']
            ];
            
            // Add optional fields based on notice type
            if ($noticeData['type'] === 'course') {
                if (!isset($this->requestData['course_id'])) {
                    return [
                        'statusCode' => 400,
                        'data' => ['error' => 'Course ID is required for course notices']
                    ];
                }
                
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
                if ($authUser['type'] === 'faculty' && $course['instructor_id'] != $authUser['id'] && !$this->isAdmin($authUser)) {
                    return [
                        'statusCode' => 403,
                        'data' => ['error' => 'You can only create notices for courses you teach']
                    ];
                }
                
                $noticeData['course_id'] = $courseId;
            } else if ($noticeData['type'] === 'department') {
                if (!isset($this->requestData['department_id'])) {
                    return [
                        'statusCode' => 400,
                        'data' => ['error' => 'Department ID is required for department notices']
                    ];
                }
                
                $departmentId = (int)$this->requestData['department_id'];
                
                // Check if department exists
                $stmt = $this->conn->prepare("SELECT * FROM departments WHERE id = ?");
                $stmt->execute([$departmentId]);
                $department = $stmt->fetch();
                
                if (!$department) {
                    return [
                        'statusCode' => 404,
                        'data' => ['error' => 'Department not found']
                    ];
                }
                
                // Check if faculty belongs to the department
                if ($authUser['type'] === 'faculty' && !$this->isAdmin($authUser)) {
                    $stmt = $this->conn->prepare("
                        SELECT id FROM faculty_profiles 
                        WHERE user_id = ? AND department_id = ?
                    ");
                    $stmt->execute([$authUser['id'], $departmentId]);
                    if (!$stmt->fetch()) {
                        return [
                            'statusCode' => 403,
                            'data' => ['error' => 'You can only create notices for your department']
                        ];
                    }
                }
                
                $noticeData['department_id'] = $departmentId;
            }
            
            // Add priority if provided
            if (isset($this->requestData['priority'])) {
                $noticeData['priority'] = $this->sanitizeInput($this->requestData['priority']);
            }
            
            // Add expiry date if provided
            if (isset($this->requestData['expiry_date'])) {
                $noticeData['expiry_date'] = $this->sanitizeInput($this->requestData['expiry_date']);
            }
            
            // Create SQL
            $columns = implode(', ', array_keys($noticeData));
            $placeholders = implode(', ', array_fill(0, count($noticeData), '?'));
            
            $stmt = $this->conn->prepare("
                INSERT INTO notices ({$columns}) 
                VALUES ({$placeholders})
            ");
            $stmt->execute(array_values($noticeData));
            
            $noticeId = $this->conn->lastInsertId();
            
            // Add attachments if provided
            if (isset($this->requestData['attachments']) && is_array($this->requestData['attachments'])) {
                foreach ($this->requestData['attachments'] as $attachment) {
                    if (!isset($attachment['file_path']) || !isset($attachment['file_name'])) {
                        continue;
                    }
                    
                    $stmt = $this->conn->prepare("
                        INSERT INTO notice_attachments (notice_id, file_path, file_name, file_type) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $noticeId,
                        $this->sanitizeInput($attachment['file_path']),
                        $this->sanitizeInput($attachment['file_name']),
                        isset($attachment['file_type']) ? $this->sanitizeInput($attachment['file_type']) : null
                    ]);
                }
            }
            
            // Commit transaction
            $this->conn->commit();
            
            // Return created notice
            return $this->getNoticeDetails($noticeId, $authUser);
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->conn->rollBack();
            
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function updateNotice($noticeId, $authUser) {
        try {
            // Check if notice exists
            $stmt = $this->conn->prepare("SELECT * FROM notices WHERE id = ?");
            $stmt->execute([$noticeId]);
            $notice = $stmt->fetch();
            
            if (!$notice) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Notice not found']
                ];
            }
            
            // Check if user has permission to update
            if ($notice['created_by'] != $authUser['id'] && !$this->isAdmin($authUser)) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only update notices you created']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Prepare update data
            $updateFields = [];
            $updateValues = [];
            
            // Fields that can be updated
            $allowedFields = ['title', 'content', 'priority', 'expiry_date'];
            
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
            
            // Add notice ID to values
            $updateValues[] = $noticeId;
            
            // Update notice
            $stmt = $this->conn->prepare("
                UPDATE notices 
                SET " . implode(', ', $updateFields) . " 
                WHERE id = ?
            ");
            $stmt->execute($updateValues);
            
            // Update attachments if provided
            if (isset($this->requestData['attachments']) && is_array($this->requestData['attachments'])) {
                // Delete existing attachments if requested
                if (isset($this->requestData['replace_attachments']) && $this->requestData['replace_attachments']) {
                    $stmt = $this->conn->prepare("DELETE FROM notice_attachments WHERE notice_id = ?");
                    $stmt->execute([$noticeId]);
                }
                
                // Add new attachments
                foreach ($this->requestData['attachments'] as $attachment) {
                    if (!isset($attachment['file_path']) || !isset($attachment['file_name'])) {
                        continue;
                    }
                    
                    $stmt = $this->conn->prepare("
                        INSERT INTO notice_attachments (notice_id, file_path, file_name, file_type) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $noticeId,
                        $this->sanitizeInput($attachment['file_path']),
                        $this->sanitizeInput($attachment['file_name']),
                        isset($attachment['file_type']) ? $this->sanitizeInput($attachment['file_type']) : null
                    ]);
                }
            }
            
            // Commit transaction
            $this->conn->commit();
            
            // Return updated notice
            return $this->getNoticeDetails($noticeId, $authUser);
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->conn->rollBack();
            
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function deleteNotice($noticeId, $authUser) {
        try {
            // Check if notice exists
            $stmt = $this->conn->prepare("SELECT * FROM notices WHERE id = ?");
            $stmt->execute([$noticeId]);
            $notice = $stmt->fetch();
            
            if (!$notice) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Notice not found']
                ];
            }
            
            // Check if user has permission to delete
            if ($notice['created_by'] != $authUser['id'] && !$this->isAdmin($authUser)) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only delete notices you created']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Delete attachments
            $stmt = $this->conn->prepare("DELETE FROM notice_attachments WHERE notice_id = ?");
            $stmt->execute([$noticeId]);
            
            // Delete read records
            $stmt = $this->conn->prepare("DELETE FROM notice_reads WHERE notice_id = ?");
            $stmt->execute([$noticeId]);
            
            // Delete notice
            $stmt = $this->conn->prepare("DELETE FROM notices WHERE id = ?");
            $stmt->execute([$noticeId]);
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'statusCode' => 200,
                'data' => ['message' => 'Notice deleted successfully']
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
    
    private function isAdmin($user) {
        return $user['type'] === 'admin';
    }
}
?> 