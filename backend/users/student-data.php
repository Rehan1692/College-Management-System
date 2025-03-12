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
    
    // Get student data
    $stmt = $conn->prepare("
        SELECT 
            s.id,
            s.full_name,
            s.email,
            s.roll_number,
            s.semester,
            s.department,
            s.admission_year
        FROM students s
        WHERE s.id = ?
    ");
    
    $stmt->execute([$user['id']]);
    $studentData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$studentData) {
        throw new Exception('Student data not found');
    }
    
    echo json_encode($studentData);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 