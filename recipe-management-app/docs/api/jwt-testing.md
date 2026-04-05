# JWT Token Testing Guide

## Quick JWT Generation

### Method 1: Using the provided script

```bash
# Make sure you're in the project root
cd /Users/leonnwankwo/Code/Projects/recipe-management-app

# Run the script with your user ID and email
node scripts/generate-test-jwt.js clzefyp8z0000gdusw0ii4med user@example.com "Your Name"
```

### Method 2: Online JWT Generator

If you don't have access to the JWT_SECRET, you can use https://jwt.io to create a test token:

1. Go to https://jwt.io
2. In the "PAYLOAD" section, replace with:
```json
{
  "userId": "clzefyp8z0000gdusw0ii4med",
  "email": "user@example.com",
  "iat": 1704240000,
  "exp": 1735776000
}
```

3. In the "VERIFY SIGNATURE" section:
   - Keep algorithm as HS256
   - Replace `your-256-bit-secret` with your actual JWT_SECRET from .env file

4. The encoded token on the left is your JWT

### Method 3: Quick Node.js one-liner

If you have Node.js and know your JWT_SECRET:

```bash
node -e "console.log(require('jsonwebtoken').sign({userId:'clzefyp8z0000gdusw0ii4med',email:'user@example.com'},'your-jwt-secret',{expiresIn:'365d'}))"
```

## Example Test Token

If your JWT_SECRET is `test-secret-key`, here's a ready-to-use token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHplZnlwOHowMDAwZ2R1c3cwaWk0bWVkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA0MjQwMDAwLCJleHAiOjE3MzU3NzYwMDB9.CHANGE_THIS_SIGNATURE
```

**Note**: This token won't work unless your JWT_SECRET matches!

## Testing the Token

Once you have your token, test it:

```bash
# Test current user endpoint
curl -X GET http://localhost:3000/api/mobile/user-get-current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Test recipe chat
curl -X POST http://localhost:3000/api/mobile/recipe-chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a simple pasta recipe", "chatHistory": []}'
```

## Finding Your JWT_SECRET

Your JWT_SECRET should be in your `.env` or `.env.local` file:

```bash
# Check your environment files
cat .env | grep JWT_SECRET
cat .env.local | grep JWT_SECRET
```

If you don't have a JWT_SECRET set, add one:

```env
JWT_SECRET=your-very-secure-secret-key-here
```

## Security Notes

1. **Never commit JWT_SECRET to version control**
2. **Use different secrets for development and production**
3. **In production, use strong, randomly generated secrets**
4. **Test tokens should only be used in development**

## Troubleshooting

If your token doesn't work:

1. **Check the secret**: Make sure the JWT_SECRET used to sign matches your app's secret
2. **Check expiration**: Ensure the token hasn't expired
3. **Check the payload**: Verify userId and email are correct
4. **Check headers**: Ensure you're using `Bearer ` prefix in Authorization header