import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`EliteFlow API running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

server.on("close", () => {
  console.log("EliteFlow server was closed");
});