<?php
require_once __DIR__ . '/BaseApi.php';

class UsersApi extends BaseApi {
    protected function handleGet() {
        // Validate authentication for all user endpoints
        $authUser = $this->validateAuth();
        
        // Get user ID from URL params or use authenticated user's ID
        $userId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : $authUser['id'];
        
        // Check if user is requesting their own profile or has admin privileges
        if ($userId !== $authUser['id'] && $authUser['type'] !== 'admin') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Forbidden: You can only access your own profile']
            ];
        }
        
        // Check for specific profile action
        $action = isset($this->urlParams[1]) ? $this->urlParams[1] : '';
        
        switch ($action) {
            case 'profile':
                return $this->getUserProfile($userId, $authUser['type']);
            case 'courses':
                return $this->getUserCourses($userId, $authUser['type']);
            default:
                return $this->getUserBasicInfo($userId);
        }
    }
    
    protected function handlePut() {
        // Validate authentication
        $authUser = $this->validateAuth();
        
        // Get user ID from URL params or use authenticated user's ID
        $userId = isset($this->urlParams[0]) && is_numeric($this->urlParams[0]) ? 
            (int)$this->urlParams[0] : $authUser['id'];
        
        // Check if user is updating their own profile or has admin privileges
        if ($userId !== $authUser['id'] && $authUser['type'] !== 'admin') {
            return [
                'statusCode' => 403,
                'data' => ['error' => 'Forbidden: You can only update your own profile']
            ];
        }
        
        // Check for specific update action
        $action = isset($this->urlParams[1]) ? $this->urlParams[1] : 'profile';
        
        switch ($action) {
            case 'profile':
                return $this->updateUserProfile($userId, $authUser['type']);
            case 'password':
                return $this->updatePassword($userId);
            default:
                return [
                    'statusCode' => 400,
                    'data' => ['error' => 'Invalid action']
                ];
        }
    }
    
    private function getUserBasicInfo($userId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT id, full_name, email, type, created_at 
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'User not found']
                ];
            }
            
            return [
                'statusCode' => 200,
                'data' => $user
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getUserProfile($userId, $userType) {
        try {
            // Get basic user info
            $stmt = $this->conn->prepare("
                SELECT id, full_name, email, type, created_at 
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return [
                    'statusCode' => 404,
                    'data' => ['error' => 'User not found']
                ];
            }
            
            // Get profile details based on user type
            $profileTable = $user['type'] === 'student' ? 'student_profiles' : 'faculty_profiles';
            $stmt = $this->conn->prepare("
                SELECT * FROM {$profileTable} 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch();
            
            // Combine user and profile data
            $result = array_merge($user, $profile ? $profile : []);
            
            return [
                'statusCode' => 200,
                'data' => $result
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function getUserCourses($userId, $userType) {
        try {
            if ($userType === 'student') {
                // Get courses enrolled by student
                $stmt = $this->conn->prepare("
                    SELECT c.*, e.grade_point, e.grade_letter, e.enrollment_date
                    FROM courses c
                    JOIN enrollments e ON c.id = e.course_id
                    WHERE e.student_id = ?
                    ORDER BY c.semester, c.name
                ");
                $stmt->execute([$userId]);
            } else {
                // Get courses taught by faculty
                $stmt = $this->conn->prepare("
                    SELECT * FROM courses 
                    WHERE instructor_id = ?
                    ORDER BY semester, name
                ");
                $stmt->execute([$userId]);
            }
            
            $courses = $stmt->fetchAll();
            
            return [
                'statusCode' => 200,
                'data' => $courses
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function updateUserProfile($userId, $userType) {
        try {
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Update basic user info
            $updateFields = [];
            $updateValues = [];
            
            // Only allow updating certain fields
            $allowedUserFields = ['full_name'];
            
            foreach ($allowedUserFields as $field) {
                if (isset($this->requestData[$field])) {
                    $updateFields[] = "{$field} = ?";
                    $updateValues[] = $this->sanitizeInput($this->requestData[$field]);
                }
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $userId;
                $stmt = $this->conn->prepare("
                    UPDATE users 
                    SET " . implode(', ', $updateFields) . " 
                    WHERE id = ?
                ");
                $stmt->execute($updateValues);
            }
            
            // Update profile details based on user type
            $profileTable = $userType === 'student' ? 'student_profiles' : 'faculty_profiles';
            
            // Define allowed fields for each profile type
            $allowedProfileFields = [
                'student' => ['department', 'semester', 'contact', 'address', 'guardian_name', 'guardian_contact'],
                'faculty' => ['department', 'designation', 'specialization', 'contact', 'office', 'education']
            ];
            
            $updateFields = [];
            $updateValues = [];
            
            foreach ($allowedProfileFields[$userType] as $field) {
                if (isset($this->requestData[$field])) {
                    $updateFields[] = "{$field} = ?";
                    $updateValues[] = $this->sanitizeInput($this->requestData[$field]);
                }
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $userId;
                $stmt = $this->conn->prepare("
                    UPDATE {$profileTable} 
                    SET " . implode(', ', $updateFields) . " 
                    WHERE user_id = ?
                ");
                $stmt->execute($updateValues);
            }
            
            // Commit transaction
            $this->conn->commit();
            
            // Return updated profile
            return $this->getUserProfile($userId, $userType);
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->conn->rollBack();
            
            return [
                'statusCode' => 500,
                'data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    private function updatePassword($userId) {
        $required = ['current_password', 'new_password', 'confirm_password'];
        $this->validateRequiredParams($required, $this->requestData);
        
        // Validate password match
        if ($this->requestData['new_password'] !== $this->requestData['confirm_password']) {
            return [
                'statusCode' => 400,
                'data' => ['error' => 'New passwords do not match']
            ];
        }
        
        try {
            // Verify current password
            $stmt = $this->conn->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($this->requestData['current_password'], $user['password'])) {
                return [
                    'statusCode' => 401,
                    'data' => ['error' => 'Current password is incorrect']
                ];
            }
            
            // Update password
            $hashedPassword = password_hash($this->requestData['new_password'], PASSWORD_DEFAULT);
            $stmt = $this->conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $userId]);
            
            return [
                'statusCode' => 200,
                'data' => ['message' => 'Password updated successfully']
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