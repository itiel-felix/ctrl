import { sequelize } from "@/lib/db";
import { migrateLegacyXboxPlatform } from "@/lib/migratePlatforms";
import "@/models/index";

let ready: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sequelize.authenticate();
      if (process.env.SYNC_DB === "true") {
        await migrateLegacyXboxPlatform();
        await sequelize.sync({ alter: true });
      }
    })();
  }
  return ready;
}
