<?php
require_once '../config/database.php';

class Auth {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function validateToken() {
        $headers = getallheaders();
        $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (empty($auth_header) || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return false;
        }

        $token = $matches[1];
        
        // Validate token in database
        $query = "SELECT id, user_type FROM " . $this->table_name . " WHERE access_token = ? AND token_expiry > NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$token]);

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return [
                'user_id' => $row['id'],
                'user_type' => $row['user_type']
            ];
        }

        return false;
    }

    public function requireStudent() {
        $user = $this->validateToken();
        
        if (!$user || $user['user_type'] !== 'student') {
            header('HTTP/1.0 401 Unauthorized');
            echo json_encode(['message' => 'Unauthorized access']);
            exit();
        }

        return $user;
    }
}

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Create auth instance
$auth = new Auth($db);
?> 