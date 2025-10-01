import { readdir, writeFile, stat } from "fs/promises";
import { join } from "path";

/**
 * no-op tagged template literal function for syntax highlighting
 */
function html(strings: TemplateStringsArray, ...values: any[]) {
    return strings.reduce(
        (acc, str, idx) => acc + str + (idx < values.length ? values[idx] : ""),
        "",
    );
}

async function isDirectory(path: string): Promise<boolean> {
    try {
        const stats = await stat(path);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

function isSemver(dir: string): boolean {
    return /^v\d+\.\d+\.\d+/.test(dir);
}

function parseSemver(dir: string): [number, number, number] | null {
    const match = dir.match(/^v(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return [
        parseInt(match[1]!, 10),
        parseInt(match[2]!, 10),
        parseInt(match[3]!, 10),
    ];
}

function compareSemver(a: string, b: string): number {
    const aVer = parseSemver(a);
    const bVer = parseSemver(b);

    if (!aVer || !bVer) return 0;

    // Compare major, minor, patch in order
    for (let i = 0; i < 3; i++) {
        if (aVer[i] !== bVer[i]) {
            return bVer[i]! - aVer[i]!;
        }
    }
    return 0;
}

async function readDirectories(basePath: string = "."): Promise<string[]> {
    const entries = await readdir(basePath);
    const directories: string[] = [];

    for (const entry of entries) {
        const fullPath = join(basePath, entry);
        if (entry.startsWith(".")) {
            continue;
        }

        if (await isDirectory(fullPath)) {
            directories.push(entry);
        }
    }

    // Separate semver and non-semver directories
    const semverDirs = directories.filter(isSemver);
    const nonSemverDirs = directories.filter((dir) => !isSemver(dir));

    // Sort non-semver directories alphabetically
    nonSemverDirs.sort();

    // Sort semver directories by version
    semverDirs.sort(compareSemver);

    // Return non-semver directories first, then semver directories
    return [...nonSemverDirs, ...semverDirs];
}

function generateHTML(directories: string[], generatedTime: string): string {
    const directoryList = directories
        .map((dir) => html` <li><a href="${dir}/">${dir}</a></li>`)
        .join("\n");

    return html`<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>Radiator 10 Documentation Versions</title>
                <style>
                    body {
                        background: #131313;
                        font-family:
                            -apple-system, BlinkMacSystemFont, "Segoe UI",
                            Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        line-height: 1.6;
                        color: #ffffff;
                    }
                    h1 {
                        color: #ffffff;
                        border-bottom: 2px solid #30a77e;
                        padding-bottom: 0.5rem;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                    }
                    li {
                        margin: 0.5rem 0;
                        padding: 0.75rem;
                        background: #242424;
                        border-radius: 4px;
                        border-left: 4px solid #30a77e;
                    }
                    li:hover {
                        background: #242424;
                        transform: translateX(4px);
                        transition: all 0.2s ease;
                    }
                    a {
                        text-decoration: none;
                        color: #30a77e;
                        font-weight: 500;
                    }
                    a:hover {
                        color: #30a77e;
                    }
                    .meta {
                        margin-top: 2rem;
                        padding-top: 1rem;
                        border-top: 1px solid #30a77e;
                        color: #e1e1e1;
                        font-size: 0.9rem;
                    }
                    .count {
                        color: #495057;
                        font-weight: 500;
                    }
                </style>
            </head>
            <body>
                <h1>Radiator 10 Documentation</h1>

                <ul>
                    ${directoryList}
                </ul>

                <div class="meta">
                    <p>
                        Generated on ${new Date(generatedTime).toLocaleString()}
                    </p>
                </div>
            </body>
        </html>`;
}

async function createIndex(): Promise<void> {
    console.log("Reading directories...");

    const directories = await readDirectories();
    const generatedTime = new Date().toISOString();

    const htmlContent = generateHTML(directories, generatedTime);

    await writeFile("index.html", htmlContent, "utf8");
    console.log(
        `:white_check_mark: Created index.html with ${directories.length} directories`,
    );
}

// Run the script
await createIndex();
