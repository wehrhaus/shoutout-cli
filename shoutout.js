#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";

// Recreate __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use __dirname to resolve the file path
const filePath = path.resolve(__dirname, "shoutouts.json");

// Helper to load or initialize the shoutouts file
function loadShoutouts() {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return [];
}

// Helper to save shoutouts to the file
function saveShoutouts(shoutouts) {
  fs.writeFileSync(filePath, JSON.stringify(shoutouts, null, 2));
}

// Helper to generate a unique color for a name
function getColorForName(name) {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ["red", "green", "yellow", "blue", "magenta", "cyan", "white"];
  return chalk[colors[hash % colors.length]];
}

// Command to add a shoutout
const addShoutout = async (options = {}) => {
  let { name, shout } = options;

  if (!name) {
    const response = await inquirer.prompt({
      type: "input",
      name: "name",
      message: "Enter a Name:",
      validate: (input) => input.trim() !== "" || "Name cannot be empty!",
    });
    name = response.name;
  }

  if (!shout) {
    const response = await inquirer.prompt({
      type: "input",
      name: "shoutout",
      message: "Enter a Shoutout:",
      validate: (input) => input.trim() !== "" || "Shoutout cannot be empty!",
    });
    shout = response.shoutout;
  }

  const shoutouts = loadShoutouts();
  shoutouts.push({
    id: Date.now().toString(),
    name,
    shoutout: shout,
    timestamp: new Date().toISOString(),
  });
  saveShoutouts(shoutouts);

  console.log("Shoutout added successfully!");
};

const program = new Command();

// Main program options for adding a shoutout
program
  .description("A CLI tool to manage shoutouts")
  .option("-n, --name <name...>", "Name for the shoutout")
  .option("-s, --shout <shoutout...>", "The shoutout message")
  .option("-l, --list", "List all shoutouts")
  .option("-r, --reset", "Reset all shoutouts")
  .action(async (options) => {
    const { name: __name, shout: __shout, list, reset } = options;

    const name = __name ? __name.join(" ") : "";
    const shout = __shout ? __shout.join(" ") : "";

    if (reset) {
      const response = await inquirer.prompt({
        type: "confirm",
        name: "confirm",
        message:
          "Are you sure you want to reset ALL Shoutouts? This cannot be undone.",
      });

      if (response.confirm) {
        saveShoutouts([]);
        console.log("All shoutouts have been reset.");
      } else {
        console.log("Reset aborted.");
      }
      return;
    }

    if (list) {
      const shoutouts = loadShoutouts();

      if (shoutouts.length === 0) {
        console.log("No shoutouts found.");
        return;
      }
      // Group shoutouts by name
      const groupedShoutouts = shoutouts.reduce((acc, shoutout) => {
        if (!acc[shoutout.name]) {
          acc[shoutout.name] = [];
        }
        acc[shoutout.name].push(shoutout);
        return acc;
      }, {});

      // Display each group in a box
      for (const [name, shoutouts] of Object.entries(groupedShoutouts)) {
        const shoutoutMessages = shoutouts
          .map(
            (shoutout) =>
              `${chalk.blue(shoutout.shoutout)} @ ${chalk.cyan(
                shoutout.timestamp
              )}`
          )
          .join("\n");

        const framedMessage = boxen(shoutoutMessages, {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          title: name,
          titleAlignment: "left",
        });

        console.log(framedMessage);
      }
      return;
    }

    // If neither --list nor --reset is provided, we assume the user wants to add a shoutout
    await addShoutout({ name, shout });
  });

program.parse(process.argv);
