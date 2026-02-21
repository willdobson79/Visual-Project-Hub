<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $message = $data['message'] ?? '';
    $to = "will@willpowered.design";
    $subject = "New Contact from Project Canvas";
    
    $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
    $headers = "From: webmaster@willpowered.design";
    
    // Log to SQLite for admin dashboard
    try {
        $db = new PDO('sqlite:db/submissions.db');
        $db->exec("CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        $stmt = $db->prepare("INSERT INTO submissions (name, email, message) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $message]);
    } catch (PDOException $e) {
        // Silently fail logging
    }

    if (mail($to, $subject, $body, $headers)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Email failed"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid request"]);
}
?>
