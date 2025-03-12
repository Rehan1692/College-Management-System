<?php
/**
 * College Management System Database Check Script
 * 
 * This script checks if the database and tables are properly set up.
 * Run this script after importing the schema.
 */

// Load configuration
require_once __DIR__ . '/backend/config.php';

echo "College Management System - Database Check\n";
echo "=========================================\n\n";

try {
    // Create a database connection
    $database = new Database();
    $conn = $database->getConnection();
    
    echo "✅ Database connection successful\n\n";
    
    // Check if tables exist
    $tables = [
        'users', 'departments', 'student_profiles', 'faculty_profiles',
        'courses', 'enrollments', 'course_schedule', 'course_materials',
        'attendance', 'assignments', 'submissions', 'notices',
        'notice_attachments', 'notice_reads'
    ];
    
    echo "Checking tables:\n";
    
    foreach ($tables as $table) {
        $stmt = $conn->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        
        if ($stmt->rowCount() > 0) {
            // Table exists, check row count
            $countStmt = $conn->prepare("SELECT COUNT(*) as count FROM $table");
            $countStmt->execute();
            $count = $countStmt->fetch()['count'];
            
            echo "✅ Table '$table' exists with $count rows\n";
        } else {
            echo "❌ Table '$table' does not exist\n";
        }
    }
    
    echo "\nChecking default admin user:\n";
    
    // Check if default admin user exists
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = 'admin@college.edu'");
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $admin = $stmt->fetch();
        echo "✅ Default admin user exists (ID: {$admin['id']})\n";
    } else {
        echo "❌ Default admin user does not exist\n";
        
        // Create default admin user
        echo "Creating default admin user...\n";
        
        $hashedPassword = password_hash('password', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("
            INSERT INTO users (full_name, email, password, type) 
            VALUES ('Admin User', 'admin@college.edu', ?, 'admin')
        ");
        $stmt->execute([$hashedPassword]);
        
        echo "✅ Default admin user created\n";
    }
    
    echo "\nChecking sample departments:\n";
    
    // Check if sample departments exist
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM departments");
    $stmt->execute();
    $count = $stmt->fetch()['count'];
    
    if ($count > 0) {
        echo "✅ Sample departments exist ($count departments)\n";
    } else {
        echo "❌ No departments found\n";
        
        // Create sample departments
        echo "Creating sample departments...\n";
        
        $departments = [
            ['Computer Science', 'CS', 'Department of Computer Science and Engineering'],
            ['Electrical Engineering', 'EE', 'Department of Electrical Engineering'],
            ['Mechanical Engineering', 'ME', 'Department of Mechanical Engineering'],
            ['Civil Engineering', 'CE', 'Department of Civil Engineering'],
            ['Business Administration', 'BA', 'Department of Business Administration']
        ];
        
        $stmt = $conn->prepare("
            INSERT INTO departments (name, code, description) 
            VALUES (?, ?, ?)
        ");
        
        foreach ($departments as $dept) {
            $stmt->execute($dept);
        }
        
        echo "✅ Sample departments created\n";
    }
    
    echo "\nDatabase check completed.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>