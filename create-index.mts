#!/usr/bin/env node

import { readdir, writeFile, stat } from "fs/promises";
import { join } from "path";

interface IndexData {
    directories: string[];
    generated: string;
}

async function isDirectory(path: string): Promise<boolean> {
    try {
        const stats = await stat(path);
        return stats.isDirectory();
    } catch {
        return false;
    }
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

    // Sort directories alphabetically
    return directories;
}

async function createIndex(): Promise<void> {
    console.log("Reading directories...");

    const directories = await readDirectories();

    const indexData: IndexData = {
        directories,
        generated: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(indexData, null, 2);

    await writeFile("index.json", jsonContent, "utf8");
    console.log(
        `✅ Created index.json with ${directories.length} directories:`,
    );
}

// Run the script
await createIndex();
