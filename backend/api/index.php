<?php
// Set error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load required files
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/AuthApi.php';
require_once __DIR__ . '/UsersApi.php';
require_once __DIR__ . '/CoursesApi.php';
require_once __DIR__ . '/AssignmentsApi.php';
require_once __DIR__ . '/AttendanceApi.php';
require_once __DIR__ . '/GradesApi.php';
require_once __DIR__ . '/NoticesApi.php';

// Parse the URL
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api/';

// Extract the path after /api/
$position = strpos($requestUri, $basePath);
if ($position !== false) {
    $path = substr($requestUri, $position + strlen($basePath));
} else {
    $path = '';
}

// Remove query string if present
if (($queryPos = strpos($path, '?')) !== false) {
    $path = substr($path, 0, $queryPos);
}

// Split the path into segments
$segments = explode('/', trim($path, '/'));
$resource = isset($segments[0]) ? $segments[0] : '';
$params = array_slice($segments, 1);

// Route to the appropriate API handler
try {
    switch ($resource) {
        case 'auth':
            $api = new AuthApi($params);
            break;
        case 'users':
            $api = new UsersApi($params);
            break;
        case 'courses':
            $api = new CoursesApi($params);
            break;
        case 'assignments':
            $api = new AssignmentsApi($params);
            break;
        case 'attendance':
            $api = new AttendanceApi($params);
            break;
        case 'grades':
            $api = new GradesApi($params);
            break;
        case 'notices':
            $api = new NoticesApi($params);
            break;
        default:
            // Handle 404 Not Found
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Resource not found']);
            exit;
    }

    // Process the request
    $api->processRequest();
} catch (Exception $e) {
    // Handle any uncaught exceptions
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit;
}
?> 