const bcrypt = require('bcryptjs');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Usage: node hashPassword.js <password>');
  process.exit(1);
}

// Hash the password with 10 rounds (same as User model)
bcrypt.hash(password, 10)
  .then(hash => {
    console.log('\nHashed password:');
    console.log(hash);
    console.log('\nUse this hash in your MongoDB update statement.\n');
  })
  .catch(err => {
    console.error('Error hashing password:', err);
    process.exit(1);
  });

