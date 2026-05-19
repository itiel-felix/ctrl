import { sequelize } from "@/lib/db";

/**
 * Convierte el valor unificado antiguo a Xbox One.
 * Ejecutar con SYNC_DB=true antes de sequelize.sync({ alter: true }).
 */
export async function migrateLegacyXboxPlatform(): Promise<void> {
  try {
    await sequelize.query(
      "UPDATE repairs SET platform = 'XBOX_ONE' WHERE platform = 'XBOX_ONE_SERIES'"
    );
    await sequelize.query(
      "UPDATE parts SET platform = 'XBOX_ONE' WHERE platform = 'XBOX_ONE_SERIES'"
    );
  } catch {
    // Tablas aún no creadas o columna ya migrada
  }
}
