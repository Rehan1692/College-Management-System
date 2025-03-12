<?php
/**
 * College Management System API Test Script
 * 
 * This script tests the basic functionality of the API endpoints.
 * Run this script from the command line or browser after setting up the system.
 */

// Configuration
$base_url = 'http://localhost/college-management/api';
$admin_email = 'admin@college.edu';
$admin_password = 'password';

// Function to make API requests
function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init($url);
    
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        echo "Error: " . curl_error($ch) . "\n";
        return null;
    }
    
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

// Test login
echo "Testing login API...\n";
$loginResponse = makeRequest("$base_url/auth/login", 'POST', [
    'email' => $admin_email,
    'password' => $admin_password
]);

if (!$loginResponse || $loginResponse['code'] !== 200) {
    echo "Login failed with status code: " . ($loginResponse ? $loginResponse['code'] : 'unknown') . "\n";
    echo "Response: " . print_r($loginResponse['body'] ?? [], true) . "\n";
    exit(1);
}

echo "Login successful!\n";
$token = $loginResponse['body']['token'];
echo "Token: $token\n\n";

// Test getting current user
echo "Testing get current user API...\n";
$userResponse = makeRequest("$base_url/auth/user", 'GET', null, $token);

if (!$userResponse || $userResponse['code'] !== 200) {
    echo "Get user failed with status code: " . ($userResponse ? $userResponse['code'] : 'unknown') . "\n";
    exit(1);
}

echo "Get user successful!\n";
echo "User: " . print_r($userResponse['body']['user'], true) . "\n\n";

// Test departments API
echo "Testing departments API...\n";
$departmentsResponse = makeRequest("$base_url/departments", 'GET', null, $token);

if (!$departmentsResponse) {
    echo "Get departments failed\n";
} else {
    echo "Departments status code: " . $departmentsResponse['code'] . "\n";
    if ($departmentsResponse['code'] === 200) {
        echo "Departments: " . print_r($departmentsResponse['body'], true) . "\n\n";
    }
}

// Test courses API
echo "Testing courses API...\n";
$coursesResponse = makeRequest("$base_url/courses", 'GET', null, $token);

if (!$coursesResponse) {
    echo "Get courses failed\n";
} else {
    echo "Courses status code: " . $coursesResponse['code'] . "\n";
    if ($coursesResponse['code'] === 200) {
        echo "Courses: " . print_r($coursesResponse['body'], true) . "\n\n";
    }
}

// Test logout
echo "Testing logout API...\n";
$logoutResponse = makeRequest("$base_url/auth/logout", 'POST', null, $token);

if (!$logoutResponse || $logoutResponse['code'] !== 200) {
    echo "Logout failed with status code: " . ($logoutResponse ? $logoutResponse['code'] : 'unknown') . "\n";
    exit(1);
}

echo "Logout successful!\n";
echo "All tests completed.\n";
?> 