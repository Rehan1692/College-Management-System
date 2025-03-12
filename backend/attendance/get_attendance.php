<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get student ID from token (you should implement proper token verification)
    $student_id = 1; // Temporary hardcoded for testing
    
    // Get filter parameters
    $course_id = isset($_GET['course_id']) ? $_GET['course_id'] : null;
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    
    // Build the base query
    $query = "SELECT 
        a.date,
        a.status,
        a.remarks,
        c.code as course_code,
        c.name as course_name
        FROM attendance a
        JOIN courses c ON a.course_id = c.id
        WHERE a.student_id = :student_id";
    
    $params = [':student_id' => $student_id];
    
    // Add filters
    if ($course_id) {
        $query .= " AND a.course_id = :course_id";
        $params[':course_id'] = $course_id;
    }
    if ($start_date) {
        $query .= " AND a.date >= :start_date";
        $params[':start_date'] = $start_date;
    }
    if ($end_date) {
        $query .= " AND a.date <= :end_date";
        $params[':end_date'] = $end_date;
    }
    
    $query .= " ORDER BY a.date DESC";
    
    // Get attendance records
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary data
    $summary_query = "SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendance
        WHERE student_id = :student_id";
    
    $stmt = $db->prepare($summary_query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate attendance percentage
    $attendance_percentage = $summary['total_classes'] > 0 
        ? round(($summary['present_count'] / $summary['total_classes']) * 100, 2)
        : 0;
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'summary' => [
                'total_classes' => (int)$summary['total_classes'],
                'present_count' => (int)$summary['present_count'],
                'absent_count' => (int)$summary['absent_count'],
                'attendance_percentage' => $attendance_percentage
            ],
            'records' => $records
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 