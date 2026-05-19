import { Sequelize } from "sequelize";

const globalForSequelize = globalThis as unknown as {
  sequelize: Sequelize | undefined;
};

function sslDialectOptions(): Record<string, unknown> | undefined {
  if (process.env.DB_SSL !== "true") return undefined;
  return {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    },
  };
}

function createSequelize(): Sequelize {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return new Sequelize(databaseUrl, {
      dialect: "mysql",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      dialectOptions: sslDialectOptions(),
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    });
  }

  return new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "ctrl",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: sslDialectOptions(),
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
}

export const sequelize =
  globalForSequelize.sequelize ?? createSequelize();

if (!globalForSequelize.sequelize) {
  globalForSequelize.sequelize = sequelize;
}
