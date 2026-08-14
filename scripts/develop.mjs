// Vici has no development-name flag, so this preload gives `vici develop` a virtual "-dev" manifest.
// That keeps its imperative installation separate from production without modifying package.json.
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packagePath = join(projectRoot, "package.json");
const originalReadFileSync = fs.readFileSync;
const originalCpSync = fs.cpSync;
const manifest = JSON.parse(originalReadFileSync(packagePath, "utf8"));

if (manifest.name.endsWith("-dev")) {
    throw new Error(
        `Expected a production extension name, received ${manifest.name}`,
    );
}

const developmentManifest = {
    ...manifest,
    name: `${manifest.name}-dev`,
    title: `${manifest.title} (Dev)`,
};
const manifestContents = `${JSON.stringify(developmentManifest, null, 2)}\n`;

// Vici reads package.json to determine the development ID, then copies it into the built extension.
// Override only those accesses; every other file comes directly from the real repository.
fs.readFileSync = (path, options) => {
    if (resolve(path.toString()) !== packagePath) {
        return originalReadFileSync(path, options);
    }

    return typeof options === "string" || options?.encoding
        ? manifestContents
        : Buffer.from(manifestContents);
};

fs.cpSync = (source, destination, options) => {
    if (resolve(source.toString()) === packagePath) {
        fs.writeFileSync(destination, manifestContents);
        return;
    }

    return originalCpSync(source, destination, options);
};

// `vici develop` deliberately throws after stopping its session on Ctrl+C. Treat only that expected
// interruption as a clean exit and preserve all other uncaught errors.
process.on("uncaughtException", (error) => {
    if (
        error instanceof Error &&
        error.message === "Development session interrupted"
    ) {
        process.exit(0);
    }

    console.error(error);
    process.exit(1);
});
