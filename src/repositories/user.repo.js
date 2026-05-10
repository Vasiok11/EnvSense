const bcrypt = require('bcryptjs');

// Mock User DB
const users = [
    {
        id: 'u_12345',
        username: 'admin',
        // Mock hashed password for 'password123'
        passwordHash: bcrypt.hashSync('password123', 10),
        role: 'admin'
    }
];

class UserRepository {
    async findByUsername(username) {
        return users.find(u => u.username === username);
    }

    async findById(id) {
        return users.find(u => u.id === id);
    }
}

module.exports = new UserRepository();