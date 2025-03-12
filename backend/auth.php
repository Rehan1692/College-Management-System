<?php
require_once 'vendor/autoload.php';
require_once 'config.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class Auth {
    private $secret_key;
    private $algorithm = 'HS256';
    private $expiry;
    private $db;

    public function __construct() {
        $this->db = new Database();
        $this->secret_key = getenv('JWT_SECRET') ?: 'your_secret_key_here';
        $this->expiry = getenv('JWT_EXPIRY') ? (int)getenv('JWT_EXPIRY') : 3600;
    }

    public function validateToken() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $authHeader = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, $this->algorithm));
            return (array)$decoded;
        } catch (Exception $e) {
            return false;
        }
    }

    public function generateToken($user) {
        $issuedAt = time();
        $expirationTime = $issuedAt + $this->expiry;

        $payload = array(
            "id" => $user['id'],
            "type" => $user['type'],
            "iat" => $issuedAt,
            "exp" => $expirationTime
        );

        return JWT::encode($payload, $this->secret_key, $this->algorithm);
    }

    public function login($email, $password, $type) {
        $conn = $this->db->getConnection();
        
        // Use the users table with type filter instead of separate tables
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND type = ?");
        $stmt->execute([$email, $type]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            return [
                'token' => $this->generateToken($user),
                'user' => array_diff_key($user, ['password' => 0]) // Remove password from response
            ];
        }
        
        return false;
    }

    public function register($data, $type) {
        $conn = $this->db->getConnection();
        
        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            throw new Exception('Email already registered');
        }

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Set user type
        $data['type'] = $type;
        unset($data['password']); // Remove plain password
        
        // Create SQL based on user type
        $columns = implode(', ', array_keys($data)) . ', password';
        $placeholders = implode(', ', array_fill(0, count($data), '?')) . ', ?';
        
        $stmt = $conn->prepare("INSERT INTO users ({$columns}) VALUES ({$placeholders})");
        $values = array_values($data);
        $values[] = $hashedPassword; // Add hashed password
        
        if ($stmt->execute($values)) {
            $data['id'] = $conn->lastInsertId();
            return [
                'token' => $this->generateToken($data),
                'user' => $data // Password is already removed
            ];
        }
        
        throw new Exception('Registration failed');
    }
    
    // Add password reset functionality
    public function requestPasswordReset($email) {
        $conn = $this->db->getConnection();
        
        // Check if email exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('Email not found');
        }
        
        // Generate reset token
        $resetToken = bin2hex(random_bytes(32));
        $resetExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Store reset token in database
        $stmt = $conn->prepare("UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?");
        if ($stmt->execute([$resetToken, $resetExpiry, $user['id']])) {
            // In a real application, send email with reset link
            return [
                'success' => true,
                'message' => 'Password reset link has been sent to your email'
            ];
        }
        
        throw new Exception('Failed to generate reset token');
    }
    
    public function resetPassword($token, $newPassword) {
        $conn = $this->db->getConnection();
        
        // Find user with valid reset token
        $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expiry > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('Invalid or expired reset token');
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update password and clear reset token
        $stmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?");
        if ($stmt->execute([$hashedPassword, $user['id']])) {
            return [
                'success' => true,
                'message' => 'Password has been reset successfully'
            ];
        }
        
        throw new Exception('Failed to reset password');
    }
}
?> 