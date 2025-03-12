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
    
    // Get notices relevant to the student
    $stmt = $conn->prepare("
        SELECT 
            n.id,
            n.title,
            n.content,
            n.date,
            n.type,
            CONCAT(f.title, ' ', f.full_name) as posted_by
        FROM notices n
        LEFT JOIN faculty f ON f.id = n.posted_by
        WHERE (n.target_type = 'all' 
            OR (n.target_type = 'department' AND n.target_id = (
                SELECT department FROM students WHERE id = ?
            ))
            OR (n.target_type = 'semester' AND n.target_id = (
                SELECT semester FROM students WHERE id = ?
            ))
            OR (n.target_type = 'course' AND n.target_id IN (
                SELECT course_id FROM student_courses WHERE student_id = ?
            ))
        )
        AND n.date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        ORDER BY n.date DESC
        LIMIT 10
    ");
    
    $stmt->execute([$user['id'], $user['id'], $user['id']]);
    $notices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($notices);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 