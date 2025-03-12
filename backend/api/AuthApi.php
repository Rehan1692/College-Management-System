<?php
require_once __DIR__ . '/BaseApi.php';

class AuthApi extends BaseApi {
    protected function handlePost() {
        // Check for specific auth action
        $action = isset($this->urlParams[0]) ? $this->urlParams[0] : '';
        
        switch ($action) {
            case 'login':
                return $this->login();
            case 'logout':
                return $this->logout();
            case 'register':
                return $this->register();
            case 'reset-password':
                return $this->resetPassword();
            default:
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Invalid action']
                ];
        }
    }
    
    protected function handleGet() {
        // Check for specific auth action
        $action = isset($this->urlParams[0]) ? $this->urlParams[0] : '';
        
        switch ($action) {
            case 'user':
                return $this->getCurrentUser();
            default:
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Invalid action']
                ];
        }
    }
    
    private function login() {
        $required = ['email', 'password'];
        $this->validateRequiredParams($required, $this->requestData);
        
        $email = $this->sanitizeInput($this->requestData['email']);
        $password = $this->requestData['password'];
        
        try {
            // Get user by email
            $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            // Check if user exists and password is correct
            if (!$user || !password_verify($password, $user['password'])) {
                return [
                    'statusCode' => 401,
                    'data' => ['error' => 'Invalid email or password']
                ];
            }
            
            // Check if user is active
            if ($user['status'] !== 'active') {
                return [
                    'statusCode' => 403,
                    'data' => ['error' => 'Your account is not active. Please contact the administrator.']
                ];
            }
            
            // Generate token
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + JWT_EXPIRY);
            
            // Store token in database
            $stmt = $this->conn->prepare("
                INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $user['id'],
                $token,
                $expiresAt,
                $_SERVER['REMOTE_ADDR'],
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
            
            // Remove sensitive data
            unset($user['password']);
            
            // Get user profile based on type
            if ($user['type'] === 'student') {
                $stmt = $this->conn->prepare("
                    SELECT sp.*, d.name as department_name 
                    FROM student_profiles sp
                    LEFT JOIN departments d ON sp.department_id = d.id
                    WHERE sp.user_id = ?
                ");
                $stmt->execute([$user['id']]);
                $profile = $stmt->fetch();
            } else if ($user['type'] === 'faculty') {
                $stmt = $this->conn->prepare("
                    SELECT fp.*, d.name as department_name 
                    FROM faculty_profiles fp
                    LEFT JOIN departments d ON fp.department_id = d.id
                    WHERE fp.user_id = ?
                ");
                $stmt->execute([$user['id']]);
                $profile = $stmt->fetch();
            } else {
                $profile = null;
            }
            
            return [
                'statusCode' => 200,
                'data' => [
                    'token' => $token,
                    'expires_at' => $expiresAt,
                    'user' => $user,
                    'profile' => $profile
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function logout() {
        try {
            // Get authorization header
            $headers = getallheaders();
            $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            
            // Check if token exists
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return [
                    'statusCode' => 200,
                    'data' => ['message' => 'Logged out successfully']
                ];
            }
            
            $token = $matches[1];
            
            // Delete token from database
            $stmt = $this->conn->prepare("DELETE FROM user_sessions WHERE token = ?");
            $stmt->execute([$token]);
            
            return [
                'statusCode' => 200,
                'data' => ['message' => 'Logged out successfully']
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function register() {
        // Only admin can register new users
        $authUser = $this->validateAuth();
        
        if ($authUser['type'] !== 'admin') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Only administrators can register new users']
            ];
        }
        
        $required = ['full_name', 'email', 'password', 'type'];
        $this->validateRequiredParams($required, $this->requestData);
        
        $fullName = $this->sanitizeInput($this->requestData['full_name']);
        $email = $this->sanitizeInput($this->requestData['email']);
        $password = $this->requestData['password'];
        $type = $this->sanitizeInput($this->requestData['type']);
        
        // Validate user type
        if (!in_array($type, ['student', 'faculty', 'admin'])) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'Invalid user type']
            ];
        }
        
        try {
            // Check if email already exists
            $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Email already exists']
                ];
            }
            
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert user
            $stmt = $this->conn->prepare("
                INSERT INTO users (full_name, email, password, type) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$fullName, $email, $hashedPassword, $type]);
            
            $userId = $this->conn->lastInsertId();
            
            // Create profile based on user type
            if ($type === 'student') {
                $departmentId = isset($this->requestData['department_id']) ? (int)$this->requestData['department_id'] : null;
                $rollNumber = isset($this->requestData['roll_number']) ? $this->sanitizeInput($this->requestData['roll_number']) : null;
                $semester = isset($this->requestData['semester']) ? (int)$this->requestData['semester'] : null;
                
                $stmt = $this->conn->prepare("
                    INSERT INTO student_profiles (user_id, roll_number, department_id, semester) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$userId, $rollNumber, $departmentId, $semester]);
            } else if ($type === 'faculty') {
                $departmentId = isset($this->requestData['department_id']) ? (int)$this->requestData['department_id'] : null;
                $designation = isset($this->requestData['designation']) ? $this->sanitizeInput($this->requestData['designation']) : null;
                
                $stmt = $this->conn->prepare("
                    INSERT INTO faculty_profiles (user_id, department_id, designation) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$userId, $departmentId, $designation]);
            }
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'statusCode' => 201,
                'data' => [
                    'message' => 'User registered successfully',
                    'user_id' => $userId
                ]
            ];
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->conn->rollBack();
            
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function resetPassword() {
        // This would typically send a password reset email
        // For simplicity, we'll just implement the actual reset
        
        $required = ['email'];
        $this->validateRequiredParams($required, $this->requestData);
        
        $email = $this->sanitizeInput($this->requestData['email']);
        
        try {
            // Check if user exists
            $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user) {
                // For security, don't reveal if email exists or not
                return [
                    'statusCode' => 200,
                    'data' => ['message' => 'If your email is registered, you will receive a password reset link']
                ];
            }
            
            // Generate reset token
            $resetToken = bin2hex(random_bytes(16));
            $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
            
            // Store reset token
            $stmt = $this->conn->prepare("
                INSERT INTO password_resets (user_id, token, expires_at) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE token = ?, expires_at = ?
            ");
            $stmt->execute([$user['id'], $resetToken, $expiresAt, $resetToken, $expiresAt]);
            
            // In a real application, send an email with the reset link
            // For now, just return the token (for testing purposes)
            return [
                'statusCode' => 200,
                'data' => [
                    'message' => 'If your email is registered, you will receive a password reset link',
                    'debug_token' => $resetToken // Remove this in production
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getCurrentUser() {
        $authUser = $this->validateAuth();
        
        try {
            // Get user profile based on type
            if ($authUser['type'] === 'student') {
                $stmt = $this->conn->prepare("
                    SELECT sp.*, d.name as department_name 
                    FROM student_profiles sp
                    LEFT JOIN departments d ON sp.department_id = d.id
                    WHERE sp.user_id = ?
                ");
                $stmt->execute([$authUser['id']]);
                $profile = $stmt->fetch();
            } else if ($authUser['type'] === 'faculty') {
                $stmt = $this->conn->prepare("
                    SELECT fp.*, d.name as department_name 
                    FROM faculty_profiles fp
                    LEFT JOIN departments d ON fp.department_id = d.id
                    WHERE fp.user_id = ?
                ");
                $stmt->execute([$authUser['id']]);
                $profile = $stmt->fetch();
            } else {
                $profile = null;
            }
            
            return [
                'statusCode' => 200,
                'data' => [
                    'user' => $authUser,
                    'profile' => $profile
                ]
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
}
?> 