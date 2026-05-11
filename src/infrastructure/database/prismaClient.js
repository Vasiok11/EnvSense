const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prisma Client Singleton 
// This ensures we do not exhaust pool connections during hot-reloads or scaling
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
