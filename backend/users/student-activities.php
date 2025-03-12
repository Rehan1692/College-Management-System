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
    
    // Get student's recent activities
    $stmt = $conn->prepare("
        SELECT 
            a.id,
            a.title,
            a.description,
            a.activity_type,
            a.timestamp,
            c.code as course_code,
            c.name as course_name
        FROM student_activities a
        LEFT JOIN courses c ON c.id = a.course_id
        WHERE a.student_id = ?
        ORDER BY a.timestamp DESC
        LIMIT 10
    ");
    
    $stmt->execute([$user['id']]);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($activities);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 