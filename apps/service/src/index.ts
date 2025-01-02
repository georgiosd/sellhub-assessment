import dotenv from "dotenv";
import { createExpressApp } from "./app";

dotenv.config();

async function main() {
  const { app } = await createExpressApp({
    connectionString: process.env.POSTGRES_URL as string,
    isDevEnv: process.env.NODE_ENV === "development",
  });

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

main();
