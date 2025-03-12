<?php
header('Content-Type: application/json');
require_once '../backend/config.php';
require_once '../backend/auth.php';

// Verify JWT token
$auth = new Auth();
$user = $auth->validateToken();

if (!$user || $user['type'] !== 'student') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Get student's courses
    $stmt = $conn->prepare("
        SELECT 
            c.id,
            c.code,
            c.name,
            f.full_name as instructor,
            sc.progress,
            sc.attendance,
            sc.grade_point
        FROM student_courses sc
        JOIN courses c ON c.id = sc.course_id
        JOIN faculty f ON f.id = c.instructor_id
        WHERE sc.student_id = ?
        AND sc.semester = (
            SELECT semester 
            FROM students 
            WHERE id = ?
        )
    ");
    
    $stmt->execute([$user['id'], $user['id']]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($courses);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 