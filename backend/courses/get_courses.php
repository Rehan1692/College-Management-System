<?php
require_once '../middleware/auth.php';

// Require student authentication
$user = $auth->requireStudent();

try {
    // Get query parameters
    $semester = isset($_GET['semester']) ? $_GET['semester'] : null;
    $department = isset($_GET['department']) ? $_GET['department'] : null;

    // Build the base query
    $query = "SELECT c.*, 
              e.grade_point,
              (SELECT COUNT(*) FROM attendance a WHERE a.course_id = c.id AND a.student_id = :student_id) as total_attendance,
              (SELECT COUNT(*) FROM attendance a WHERE a.course_id = c.id AND a.student_id = :student_id AND a.status = 'present') as present_attendance
              FROM courses c
              INNER JOIN enrollments e ON c.id = e.course_id
              WHERE e.student_id = :student_id";

    // Add filters if provided
    $params = [':student_id' => $user['user_id']];
    
    if ($semester) {
        $query .= " AND c.semester = :semester";
        $params[':semester'] = $semester;
    }
    
    if ($department) {
        $query .= " AND c.department = :department";
        $params[':department'] = $department;
    }

    // Prepare and execute the query
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    $courses = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Calculate attendance percentage
        $attendance_percentage = $row['total_attendance'] > 0 
            ? ($row['present_attendance'] / $row['total_attendance']) * 100 
            : 0;
            
        $courses[] = [
            'id' => $row['id'],
            'code' => $row['code'],
            'name' => $row['name'],
            'instructor' => $row['instructor'],
            'department' => $row['department'],
            'semester' => $row['semester'],
            'credits' => $row['credits'],
            'description' => $row['description'],
            'schedule' => $row['schedule'],
            'attendance' => round($attendance_percentage, 2),
            'grade_point' => $row['grade_point']
        ];
    }

    // Return the courses data
    echo json_encode([
        'status' => 'success',
        'data' => $courses
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 