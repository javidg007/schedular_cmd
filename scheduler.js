const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');


const COMMAND_FILE = path.join(__dirname, '/tmp/commands.txt');
const OUTPUT_FILE = path.join(__dirname, 'sample-output.txt');

const startTime = Date.now();
const executedHashes = new Set();


const crypto = require('crypto');
function hashCommand(cmd) {
  return crypto.createHash('md5').update(cmd).digest('hex');
}

function executeCommand(command) {
    const shellCommand = process.platform === 'win32'
   ? `cmd /c "${command}"`
   : command;
  exec(shellCommand, (error, stdout, stderr) => {

    if(error){
        console.log(error);
        return
    }
    console.log('hii');
    
    const log = `\n[${new Date().toISOString()}]\nCOMMAND: ${command}\n${stdout}${stderr}\n`;
    fs.appendFileSync(OUTPUT_FILE, log);
  });
}

function runScheduler() {
  const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);

  const lines = fs.readFileSync(COMMAND_FILE, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('*/'));

  lines.forEach(line => {
    const match = line.match(/^\*\/(\d+)\s+(.*)/);
    if (!match) return;

    const interval = parseInt(match[1], 10);
    const command = match[2];
    const hash = hashCommand(line);

    if (elapsedMinutes >= interval && !executedHashes.has(hash)) {
      console.log(`[EXECUTE @ ${elapsedMinutes} min] ${command}`);
      executeCommand(command);
      executedHashes.add(hash);
    }
  });
}


runScheduler();
setInterval(runScheduler, 60 * 1000);
