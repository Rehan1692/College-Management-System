<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Test database connection
require_once 'backend/config/database.php';
$database = new Database();
$db = $database->getConnection();

if ($db) {
    // Test queries
    try {
        // Test courses table
        $query = "SELECT COUNT(*) as count FROM courses";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $courses_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Test users table
        $query = "SELECT COUNT(*) as count FROM users";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Test attendance table
        $query = "SELECT COUNT(*) as count FROM attendance";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $attendance_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        echo json_encode([
            'status' => 'success',
            'message' => 'Database connection successful',
            'data' => [
                'courses_count' => $courses_count,
                'users_count' => $users_count,
                'attendance_count' => $attendance_count
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Database tables not found: ' . $e->getMessage(),
            'error' => $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed'
    ]);
}
?> 