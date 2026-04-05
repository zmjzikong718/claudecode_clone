import path from "node:path";
import fs from "node:fs";

const envPath = path.join(process.cwd(), ".env");
console.log("envPath:", envPath);

try {
    const content = fs.readFileSync(envPath, "utf-8");
    console.log("file content:", content);
    console.log("lines:", content.split("\n"));
} catch (e) {
    console.log("error:", e);
}
