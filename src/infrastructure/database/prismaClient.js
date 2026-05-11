const { PrismaClient } = require('@prisma/client');

// Prisma Client Singleton 
// This ensures we do not exhaust pool connections during hot-reloads or scaling
const prisma = new PrismaClient();

module.exports = prisma;
