<?php
require_once __DIR__ . '/BaseApi.php';

class AttendanceApi extends BaseApi {
    protected function handleGet() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Check if a specific course ID is requested
        $courseId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$courseId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Course ID is required']
            ];
        }
        
        // Check for specific date or student
        $action = isset($this->urlParams[1]) ? $this->urlParams[1] : '';
        
        switch ($action) {
            case 'student':
                $studentId = isset($this->urlParams[2]) && is_numeric($this->urlParams[2]) ? 
                    (int)$this->urlParams[2] : $authUser['id'];
                return $this->getStudentAttendance($courseId, $studentId, $authUser);
            case 'date':
                $date = isset($this->urlParams[2]) ? $this->urlParams[2] : date('Y-m-d');
                return $this->getAttendanceByDate($courseId, $date, $authUser);
            default:
                // Get attendance summary for the course
                return $this->getAttendanceSummary($courseId, $authUser);
        }
    }
    
    protected function handlePost() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can mark attendance
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot mark attendance']
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
        
        // Mark attendance
        return $this->markAttendance($courseId, $authUser);
    }
    
    protected function handlePut() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Only faculty and admin can update attendance
        if ($authUser['type'] === 'student') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Students cannot update attendance']
            ];
        }
        
        // Check if a specific attendance ID is provided
        $attendanceId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : null;
        
        if (!$attendanceId) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Attendance ID is required']
            ];
        }
        
        // Update attendance
        return $this->updateAttendance($attendanceId, $authUser);
    }
    
    private function getAttendanceSummary($courseId, $authUser) {
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
                    'data' => ['error' => 'You can only view attendance for courses you teach']
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
            }
            
            // Get attendance dates for the course
            $stmt = $this->conn->prepare("
                SELECT DISTINCT date 
                FROM attendance 
                WHERE course_id = ?
                ORDER BY date DESC
            ");
            $stmt->execute([$courseId]);
            $dates = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Get attendance summary for each date
            $summary = [];
            foreach ($dates as $date) {
                $stmt = $this->conn->prepare("
                    SELECT status, COUNT(*) as count 
                    FROM attendance 
                    WHERE course_id = ? AND date = ?
                    GROUP BY status
                ");
                $stmt->execute([$courseId, $date]);
                $statusCounts = $stmt->fetchAll();
                
                $dateData = [
                    'date' => $date,
                    'present' => 0,
                    'absent' => 0,
                    'late' => 0
                ];
                
                foreach ($statusCounts as $statusCount) {
                    $dateData[$statusCount['status']] = (int)$statusCount['count'];
                }
                
                $summary[] = $dateData;
            }
            
            // If student, get their own attendance
            if ($authUser['type'] === 'student') {
                $stmt = $this->conn->prepare("
                    SELECT date, status, remarks 
                    FROM attendance 
                    WHERE course_id = ? AND student_id = ?
                    ORDER BY date DESC
                ");
                $stmt->execute([$courseId, $authUser['id']]);
                $studentAttendance = $stmt->fetchAll();
                
                // Calculate attendance percentage
                $totalClasses = count($dates);
                $presentCount = 0;
                
                foreach ($studentAttendance as $record) {
                    if ($record['status'] === 'present') {
                        $presentCount++;
                    }
                }
                
                $attendancePercentage = $totalClasses > 0 ? 
                    round(($presentCount / $totalClasses) * 100, 2) : 0;
                
                return [
                    'statusCode' => 200,
                    'data' => [
                        'course' => $course,
                        'total_classes' => $totalClasses,
                        'attendance_percentage' => $attendancePercentage,
                        'attendance_records' => $studentAttendance
                    ]
                ];
            }
            
            // For faculty/admin, return full summary
            return [
                'statusCode' => 200,
                'data' => [
                    'course' => $course,
                    'total_classes' => count($dates),
                    'attendance_summary' => $summary
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getStudentAttendance($courseId, $studentId, $authUser) {
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
            
            // Check if user has access to this data
            if ($authUser['type'] === 'faculty' && $course['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only view attendance for courses you teach']
                ];
            } else if ($authUser['type'] === 'student' && $authUser['id'] != $studentId) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only view your own attendance']
                ];
            }
            
            // Check if student is enrolled in the course
            $stmt = $this->conn->prepare("
                SELECT id FROM enrollments 
                WHERE student_id = ? AND course_id = ?
            ");
            $stmt->execute([$studentId, $courseId]);
            if (!$stmt->fetch()) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Student is not enrolled in this course']
                ];
            }
            
            // Get student details
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, u.email, sp.roll_number, sp.department
                FROM users u
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch();
            
            // Get attendance records
            $stmt = $this->conn->prepare("
                SELECT date, status, remarks 
                FROM attendance 
                WHERE course_id = ? AND student_id = ?
                ORDER BY date DESC
            ");
            $stmt->execute([$courseId, $studentId]);
            $attendanceRecords = $stmt->fetchAll();
            
            // Get total classes for the course
            $stmt = $this->conn->prepare("
                SELECT COUNT(DISTINCT date) as total_classes 
                FROM attendance 
                WHERE course_id = ?
            ");
            $stmt->execute([$courseId]);
            $totalClasses = (int)$stmt->fetch()['total_classes'];
            
            // Calculate attendance percentage
            $presentCount = 0;
            foreach ($attendanceRecords as $record) {
                if ($record['status'] === 'present') {
                    $presentCount++;
                }
            }
            
            $attendancePercentage = $totalClasses > 0 ? 
                round(($presentCount / $totalClasses) * 100, 2) : 0;
            
            return [
                'statusCode' => 200,
                'data' => [
                    'student' => $student,
                    'course' => $course,
                    'total_classes' => $totalClasses,
                    'present_count' => $presentCount,
                    'attendance_percentage' => $attendancePercentage,
                    'attendance_records' => $attendanceRecords
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getAttendanceByDate($courseId, $date, $authUser) {
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
                    'data' => ['error' => 'You can only view attendance for courses you teach']
                ];
            } else if ($authUser['type'] === 'student') {
                // Students can only view their own attendance
                $stmt = $this->conn->prepare("
                    SELECT a.*, u.full_name as student_name
                    FROM attendance a
                    JOIN users u ON a.student_id = u.id
                    WHERE a.course_id = ? AND a.date = ? AND a.student_id = ?
                ");
                $stmt->execute([$courseId, $date, $authUser['id']]);
                $attendance = $stmt->fetch();
                
                return [
                    'statusCode' => 200,
                    'data' => $attendance ? $attendance : ['message' => 'No attendance record found for this date']
                ];
            }
            
            // For faculty/admin, get all students' attendance for the date
            $stmt = $this->conn->prepare("
                SELECT a.*, u.full_name as student_name, sp.roll_number
                FROM attendance a
                JOIN users u ON a.student_id = u.id
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE a.course_id = ? AND a.date = ?
                ORDER BY u.full_name
            ");
            $stmt->execute([$courseId, $date]);
            $attendanceRecords = $stmt->fetchAll();
            
            // Get enrolled students who don't have attendance records for this date
            $stmt = $this->conn->prepare("
                SELECT u.id, u.full_name, sp.roll_number
                FROM users u
                JOIN enrollments e ON u.id = e.student_id
                JOIN student_profiles sp ON u.id = sp.user_id
                WHERE e.course_id = ?
                AND u.id NOT IN (
                    SELECT student_id FROM attendance 
                    WHERE course_id = ? AND date = ?
                )
                ORDER BY u.full_name
            ");
            $stmt->execute([$courseId, $courseId, $date]);
            $missingStudents = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'course' => $course,
                    'date' => $date,
                    'attendance_records' => $attendanceRecords,
                    'missing_students' => $missingStudents
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function markAttendance($courseId, $authUser) {
        $required = ['date', 'attendance_data'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if course exists and user has permission
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
                    'data' => ['error' => 'You can only mark attendance for courses you teach']
                ];
            }
            
            $date = $this->sanitizeInput($this->requestData['date']);
            $attendanceData = $this->requestData['attendance_data'];
            
            if (!is_array($attendanceData)) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Attendance data must be an array']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            $inserted = 0;
            $updated = 0;
            
            foreach ($attendanceData as $record) {
                if (!isset($record['student_id']) || !isset($record['status'])) {
                    continue;
                }
                
                $studentId = (int)$record['student_id'];
                $status = $this->sanitizeInput($record['status']);
                $remarks = isset($record['remarks']) ? $this->sanitizeInput($record['remarks']) : null;
                
                // Check if student is enrolled in the course
                $stmt = $this->conn->prepare("
                    SELECT id FROM enrollments 
                    WHERE student_id = ? AND course_id = ?
                ");
                $stmt->execute([$studentId, $courseId]);
                if (!$stmt->fetch()) {
                    continue; // Skip students not enrolled
                }
                
                // Check if attendance record already exists
                $stmt = $this->conn->prepare("
                    SELECT id FROM attendance 
                    WHERE student_id = ? AND course_id = ? AND date = ?
                ");
                $stmt->execute([$studentId, $courseId, $date]);
                $existingRecord = $stmt->fetch();
                
                if ($existingRecord) {
                    // Update existing record
                    $stmt = $this->conn->prepare("
                        UPDATE attendance 
                        SET status = ?, remarks = ?, recorded_by = ? 
                        WHERE id = ?
                    ");
                    $stmt->execute([$status, $remarks, $authUser['id'], $existingRecord['id']]);
                    $updated++;
                } else {
                    // Insert new record
                    $stmt = $this->conn->prepare("
                        INSERT INTO attendance 
                        (student_id, course_id, date, status, remarks, recorded_by) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([$studentId, $courseId, $date, $status, $remarks, $authUser['id']]);
                    $inserted++;
                }
            }
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => 'Attendance marked successfully',
                    'inserted' => $inserted,
                    'updated' => $updated
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
    
    private function updateAttendance($attendanceId, $authUser) {
        $required = ['status'];
        $this->validateRequiredParams($required, $this->requestData);
        
        try {
            // Check if attendance record exists
            $stmt = $this->conn->prepare("
                SELECT a.*, c.instructor_id 
                FROM attendance a
                JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            ");
            $stmt->execute([$attendanceId]);
            $attendance = $stmt->fetch();
            
            if (!$attendance) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'Attendance record not found']
                ];
            }
            
            // Check if faculty is the instructor of the course
            if ($authUser['type'] === 'faculty' && $attendance['instructor_id'] != $authUser['id']) {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'You can only update attendance for courses you teach']
                ];
            }
            
            $status = $this->sanitizeInput($this->requestData['status']);
            $remarks = isset($this->requestData['remarks']) ? 
                $this->sanitizeInput($this->requestData['remarks']) : $attendance['remarks'];
            
            // Update attendance record
            $stmt = $this->conn->prepare("
                UPDATE attendance 
                SET status = ?, remarks = ?, recorded_by = ? 
                WHERE id = ?
            ");
            $stmt->execute([$status, $remarks, $authUser['id'], $attendanceId]);
            
            // Get updated record
            $stmt = $this->conn->prepare("
                SELECT a.*, u.full_name as student_name
                FROM attendance a
                JOIN users u ON a.student_id = u.id
                WHERE a.id = ?
            ");
            $stmt->execute([$attendanceId]);
            $updatedAttendance = $stmt->fetch();
            
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => 'Attendance updated successfully',
                    'attendance' => $updatedAttendance
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