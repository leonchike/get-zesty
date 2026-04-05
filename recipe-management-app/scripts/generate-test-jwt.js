#!/usr/bin/env node

const jwt = require("jsonwebtoken");

// Get JWT_SECRET from environment or use a test secret
const JWT_SECRET = process.env.JWT_SECRET || "your-test-secret-key";

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node generate-test-jwt.js <userId> <email> [name]");
  console.error("Example: node generate-test-jwt.js clzefyp8z0000gdusw0ii4med user@example.com 'John Doe'");
  process.exit(1);
}

const [userId, email, name = "Test User"] = args;

// Generate JWT token with the same structure as the login endpoint
const token = jwt.sign(
  {
    userId,
    email,
  },
  JWT_SECRET,
  { expiresIn: "365d" }
);

// Decode to show contents
const decoded = jwt.decode(token);

console.log("\n=== JWT Token Generated ===");
console.log("\nToken:");
console.log(token);
console.log("\nDecoded payload:");
console.log(JSON.stringify(decoded, null, 2));
console.log("\n=== Usage Example ===");
console.log(`curl -X POST http://localhost:3000/api/mobile/recipe-chat \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Create a pasta recipe", "chatHistory": []}'`);
console.log("\n=== Important Notes ===");
console.log("1. Make sure JWT_SECRET in your .env matches the one used to generate this token");
console.log("2. This token expires in 365 days");
console.log("3. For production, always use proper authentication flow");