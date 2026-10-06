import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./src/server.ts",
  target: "node",
  mode: "development",
  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
    ],
  },

  output: {
    filename: "server.js",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
};