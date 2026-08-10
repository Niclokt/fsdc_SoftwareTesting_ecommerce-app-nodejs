// util/database.js
const { Sequelize } = require("sequelize");

let sequelize;

const isTestEnv =
    process.env.NODE_ENV === "test" || process.env.NODE_ENV === "e2e";

if (isTestEnv) {
    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: ":memory:",
        logging: false,
    });
} else {
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
