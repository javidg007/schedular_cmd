const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

const COMMAND_FILE = path.join(__dirname, '/tmp/commands.txt');
const OUTPUT_FILE = path.join(__dirname, 'sample-output.txt');

let startTime = Date.now();
let executedHashes = new Set();
let lines = [];
let totalRecurringCommands = 0;

function hashCommand(cmd) {
  return crypto.createHash('md5').update(cmd).digest('hex');
}

function executeCommand(command) {
  exec(command, (error, stdout, stderr) => {
    const log = `\n[${new Date().toISOString()}]\nCOMMAND: ${command}\n${stdout}${stderr}\n`;
    fs.appendFileSync(OUTPUT_FILE, log);
  });
}

function loadCommands() {
  const fileData = fs.readFileSync(COMMAND_FILE, 'utf8');
  lines = fileData
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  totalRecurringCommands = lines.filter(line => line.startsWith('*/')).length;
  console.log(`\n🔄 Commands reloaded (${lines.length} total)\n`);

  executedHashes.clear();
  startTime = Date.now();
}

fs.watchFile(COMMAND_FILE, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    loadCommands();
  }
});

loadCommands();


function handleRecurringCommand(line, elapsedMinutes) {
  const match = line.match(/^\*\/(\d+)\s+(.*)/);
  if (!match) return;

  const interval = parseInt(match[1], 10);
  const command = match[2];
  const hash = hashCommand(line);

  if (elapsedMinutes >= interval && !executedHashes.has(hash)) {
    console.log(`[RECURRING] EXECUTE @ ${elapsedMinutes} min → ${command}`);
    executeCommand(command);
    executedHashes.add(hash);
  }
}


function handleOneTimeCommand(line, now) {
  const match = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.*)/);
  if (!match) return;

  const [ , min, hour, day, month, year, command ] = match;
  const hash = hashCommand(line);

  if (
    now.getMinutes() === parseInt(min) &&
    now.getHours() === parseInt(hour) &&
    now.getDate() === parseInt(day) &&
    now.getMonth() + 1 === parseInt(month) &&
    now.getFullYear() === parseInt(year) &&
    !executedHashes.has(hash)
  ) {
    console.log(`[ONCE] EXECUTE @ ${now.toISOString()} → ${command}`);
    executeCommand(command);
    executedHashes.add(hash);
  }
}


function shouldResetRecurring() {
  const recurringExecuted = Array.from(executedHashes).filter(hash =>
    lines.some(line => hashCommand(line) === hash && line.startsWith('*/'))
  ).length;

  if (recurringExecuted === totalRecurringCommands && totalRecurringCommands > 0) {
    console.log('\n✅ All recurring commands executed — resetting...\n');


    executedHashes = new Set(Array.from(executedHashes).filter(hash => {
      const line = lines.find(l => hashCommand(l) === hash);
      return line && !line.startsWith('*/');
    }));

    startTime = Date.now();
  }
}


function runScheduler() {
  const now = new Date();
  const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);

  lines.forEach(line => {
    if (line.startsWith('*/')) {
      handleRecurringCommand(line, elapsedMinutes);
    } else {
      handleOneTimeCommand(line, now);
    }
  });

  shouldResetRecurring();
}


runScheduler();
setInterval(runScheduler, 60 * 1000);
