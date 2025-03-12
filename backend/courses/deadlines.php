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
    
    // Get upcoming deadlines for student's courses
    $stmt = $conn->prepare("
        SELECT 
            d.id,
            d.title,
            d.description,
            d.due_date,
            d.type,
            c.code as course_code,
            c.name as course_name
        FROM deadlines d
        JOIN courses c ON c.id = d.course_id
        JOIN student_courses sc ON sc.course_id = c.id
        WHERE sc.student_id = ?
        AND d.due_date >= CURRENT_DATE
        ORDER BY d.due_date ASC
        LIMIT 10
    ");
    
    $stmt->execute([$user['id']]);
    $deadlines = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($deadlines);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 