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
    
    // Get summary data
    $summary_query = "SELECT 
        AVG(grade_point) as cgpa,
        SUM(credits) as total_credits
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = :student_id";
    
    $stmt = $db->prepare($summary_query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get semester data
    $semester_query = "SELECT 
        semester,
        COUNT(*) as total_courses,
        SUM(credits) as total_credits,
        AVG(grade_point) as gpa
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = :student_id
        GROUP BY semester
        ORDER BY semester DESC";
    
    $stmt = $db->prepare($semester_query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $semesters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get course grades
    $courses_query = "SELECT 
        c.code,
        c.name,
        c.credits,
        e.grade_point,
        e.grade_letter,
        c.semester,
        COALESCE(
            (SELECT AVG(score)
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id = c.id AND s.student_id = e.student_id), 0
        ) as assignment_average
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = :student_id
        ORDER BY c.semester DESC, c.code";
    
    $stmt = $db->prepare($courses_query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'summary' => [
                'cgpa' => round($summary['cgpa'], 2),
                'total_credits' => $summary['total_credits'],
                'current_semester' => $semesters[0]['semester'] ?? '--'
            ],
            'semesters' => $semesters,
            'courses' => $courses
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 