// util/database.js
const { Sequelize } = require("sequelize");

let sequelize;

// FIX #1: Check if Node is running under 'test' environment (set by npm test / cross-env)
if (process.env.NODE_ENV === "test") {
    // FIX #2: Use explicit object configuration for SQLite to avoid Node 20+ URL deprecation warnings
    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: ":memory:", // Runs entirely in RAM - fast, isolated, and requires no local MySQL server
        logging: false, // Prevents SQL query log clutter from leaking into terminal test results
    });
} else {
    // FIX #3: Use your original MySQL environment variables when running in dev/production mode
    sequelize = new Sequelize(
        process.env.DB_SCHEMA_NAME,
        process.env.DB_USER_NAME,
        process.env.DB_USER_PASSWORD,
        {
            dialect: "mysql",
            host: process.env.DB_HOST_URL,
        },
    );
}

module.exports = sequelize;
