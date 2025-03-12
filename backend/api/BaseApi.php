<?php
/**
 * Base API Class
 * 
 * This class serves as the foundation for all API endpoints.
 * It handles request processing, authentication, and response formatting.
 */
class BaseApi {
    protected $conn;
    protected $requestMethod;
    protected $urlParams;
    protected $requestData;
    
    /**
     * Constructor
     * 
     * @param array $urlParams Parameters from the URL
     */
    public function __construct($urlParams = []) {
        global $conn;
        $this->conn = $conn;
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];
        $this->urlParams = $urlParams;
        $this->parseRequestData();
    }
    
    /**
     * Parse request data based on request method
     */
    private function parseRequestData() {
        $this->requestData = [];
        
        // Get data from query string
        if (!empty($_GET)) {
            $this->requestData = array_merge($this->requestData, $_GET);
        }
        
        // For POST, PUT, DELETE methods, get data from request body
        if (in_array($this->requestMethod, ['POST', 'PUT', 'DELETE'])) {
            $input = file_get_contents('php://input');
            $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
            
            if (strpos($contentType, 'application/json') !== false) {
                // Parse JSON data
                $jsonData = json_decode($input, true);
                if ($jsonData) {
                    $this->requestData = array_merge($this->requestData, $jsonData);
                }
            } else if (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
                // Parse form data
                parse_str($input, $formData);
                if ($formData) {
                    $this->requestData = array_merge($this->requestData, $formData);
                }
            }
            
            // Also include $_POST data
            if (!empty($_POST)) {
                $this->requestData = array_merge($this->requestData, $_POST);
            }
        }
    }
    
    /**
     * Process the API request
     */
    public function processRequest() {
        // Set default headers
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        // Handle preflight OPTIONS request
        if ($this->requestMethod === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        // Call the appropriate handler based on request method
        $response = [];
        
        try {
            switch ($this->requestMethod) {
                case 'GET':
                    $response = $this->handleGet();
                    break;
                case 'POST':
                    $response = $this->handlePost();
                    break;
                case 'PUT':
                    $response = $this->handlePut();
                    break;
                case 'DELETE':
                    $response = $this->handleDelete();
                    break;
                default:
                    $response = [
                        'statusCode' => 405,
                        'data' => ['error' => 'Method not allowed']
                    ];
            }
        } catch (Exception $e) {
            $response = [
                'statusCode' => 500,
                'data' => ['error' => 'Server error: ' . $e->getMessage()]
            ];
        }
        
        // Set HTTP status code
        $statusCode = isset($response['statusCode']) ? $response['statusCode'] : 200;
        http_response_code($statusCode);
        
        // Output response data
        echo json_encode(isset($response['data']) ? $response['data'] : $response);
    }
    
    /**
     * Handle GET requests (to be overridden by child classes)
     * 
     * @return array Response data
     */
    protected function handleGet() {
        return [
            'statusCode' => 405,
            'data' => ['error' => 'Method not implemented']
        ];
    }
    
    /**
     * Handle POST requests (to be overridden by child classes)
     * 
     * @return array Response data
     */
    protected function handlePost() {
        return [
            'statusCode' => 405,
            'data' => ['error' => 'Method not implemented']
        ];
    }
    
    /**
     * Handle PUT requests (to be overridden by child classes)
     * 
     * @return array Response data
     */
    protected function handlePut() {
        return [
            'statusCode' => 405,
            'data' => ['error' => 'Method not implemented']
        ];
    }
    
    /**
     * Handle DELETE requests (to be overridden by child classes)
     * 
     * @return array Response data
     */
    protected function handleDelete() {
        return [
            'statusCode' => 405,
            'data' => ['error' => 'Method not implemented']
        ];
    }
    
    /**
     * Validate authentication token
     * 
     * @return array User data if authenticated
     */
    protected function validateAuth() {
        // Get authorization header
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        
        // Check if token exists
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        
        $token = $matches[1];
        
        // Validate token
        try {
            // For simplicity, we're using a basic token validation
            // In production, use a proper JWT library
            $stmt = $this->conn->prepare("
                SELECT u.* FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ? AND s.expires_at > NOW()
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid or expired token']);
                exit;
            }
            
            // Remove sensitive data
            unset($user['password']);
            
            return $user;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Authentication error']);
            exit;
        }
    }
    
    /**
     * Validate required parameters
     * 
     * @param array $required Required parameter names
     * @param array $data Data to validate
     * @return bool True if all required parameters exist
     */
    protected function validateRequiredParams($required, $data) {
        $missing = [];
        
        foreach ($required as $param) {
            if (!isset($data[$param]) || (empty($data[$param]) && $data[$param] !== '0' && $data[$param] !== 0)) {
                $missing[] = $param;
            }
        }
        
        if (!empty($missing)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required parameters: ' . implode(', ', $missing)]);
            exit;
        }
        
        return true;
    }
    
    /**
     * Sanitize input data
     * 
     * @param mixed $input Input to sanitize
     * @return mixed Sanitized input
     */
    protected function sanitizeInput($input) {
        if (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = $this->sanitizeInput($value);
            }
            return $input;
        }
        
        return sanitizeInput($input);
    }
}
?> 