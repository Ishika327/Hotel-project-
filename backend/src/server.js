import app from "./app.js";
import connectDB from "./config/db.js";

const initialPort = Number(process.env.PORT || 5001);
const host = process.env.HOST || "localhost";

const start = async () => {
  await connectDB();

  const listenOnPort = (port) => {
    const server = app.listen(port, () => {
      console.log(`API server running at http://${host}:${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.warn(`Port ${port} is busy, trying ${port + 1}...`);
        server.close(() => listenOnPort(port + 1));
        return;
      }

      throw error;
    });
  };

  listenOnPort(initialPort);
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
