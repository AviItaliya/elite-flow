import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "production",
  target: "node",
  entry: "./src/server.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "server.js",
  },
  resolve: {
  extensions: [".ts", ".js"],
  extensionAlias: {
    ".js": [".js", ".ts"],
  },
},

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.json"),
          },
        },
      },
    ],
  },

  output: {
    filename: "server.js",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
};