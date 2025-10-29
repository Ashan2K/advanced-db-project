// hash-generator.js
const bcrypt = require('bcryptjs');

// Get the password from the command line argument
const password = "password123"; // Example password

if (!password) {
    console.error('Usage: node hash-generator.js <password-to-hash>');
    process.exit(1);
}

// Generate a hash
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Password:', password);
    console.log('Hash:    ', hash);
});