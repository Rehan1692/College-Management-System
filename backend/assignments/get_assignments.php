<?php
require_once '../middleware/auth.php';

// Require student authentication
$user = $auth->requireStudent();

try {
    // Get query parameters
    $course_id = isset($_GET['course_id']) ? $_GET['course_id'] : null;
    $status = isset($_GET['status']) ? $_GET['status'] : null;

    // Build the base query
    $query = "SELECT a.*, c.name as course_name, c.code as course_code,
              s.submission_date, s.status as submission_status, s.score
              FROM assignments a
              INNER JOIN courses c ON a.course_id = c.id
              INNER JOIN enrollments e ON c.id = e.course_id AND e.student_id = :student_id
              LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = :student_id
              WHERE 1=1";

    // Add filters if provided
    $params = [':student_id' => $user['user_id']];
    
    if ($course_id) {
        $query .= " AND a.course_id = :course_id";
        $params[':course_id'] = $course_id;
    }
    
    if ($status) {
        if ($status === 'pending') {
            $query .= " AND (s.status IS NULL OR s.status = 'draft')";
        } else {
            $query .= " AND s.status = :status";
            $params[':status'] = $status;
        }
    }

    $query .= " ORDER BY a.due_date ASC";

    // Prepare and execute the query
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    $assignments = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $assignments[] = [
            'id' => $row['id'],
            'course_id' => $row['course_id'],
            'course_name' => $row['course_name'],
            'course_code' => $row['course_code'],
            'title' => $row['title'],
            'description' => $row['description'],
            'due_date' => $row['due_date'],
            'total_marks' => $row['total_marks'],
            'submission_status' => $row['submission_status'] ?? 'not_submitted',
            'submission_date' => $row['submission_date'],
            'score' => $row['score'],
            'attachments' => json_decode($row['attachments'] ?? '[]'),
            'is_late' => $row['submission_date'] && strtotime($row['submission_date']) > strtotime($row['due_date'])
        ];
    }

    // Get assignment summary
    $summary_query = "SELECT 
                     COUNT(*) as total_assignments,
                     SUM(CASE WHEN s.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
                     SUM(CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
                     AVG(CASE WHEN s.status = 'graded' THEN (s.score / a.total_marks * 100) ELSE NULL END) as average_score
                     FROM assignments a
                     INNER JOIN courses c ON a.course_id = c.id
                     INNER JOIN enrollments e ON c.id = e.course_id AND e.student_id = :student_id
                     LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = :student_id";

    if ($course_id) {
        $summary_query .= " WHERE a.course_id = :course_id";
    }

    $stmt = $db->prepare($summary_query);
    $stmt->execute($params);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    // Return the assignments data
    echo json_encode([
        'status' => 'success',
        'data' => [
            'assignments' => $assignments,
            'summary' => [
                'total_assignments' => (int)$summary['total_assignments'],
                'submitted_count' => (int)$summary['submitted_count'],
                'graded_count' => (int)$summary['graded_count'],
                'average_score' => round($summary['average_score'] ?? 0, 2)
            ]
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 