import { config } from "dotenv";
import * as path from "path";

module.exports = async () => {
    config({ path: path.resolve(__dirname, "./.env.test") });
};
