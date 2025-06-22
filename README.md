

## ✅ Features

- Supports recurring commands (every N minutes)
- Supports one-time scheduled commands (specific date & time)
- Automatically reloads commands when the file changes
- Logs command output to a file

---

## 🗂 Files

- `scheduler.js` – Main scheduler logic
- `/tmp/commands.txt` – Command list (recurring + one-time)
- `sample-output.txt` – Log file storing command output
- `README.md` – You're reading it

---

## 📜 Command Formats

### 🌀 Recurring Command
*/5 date && echo "Recurring every 5 minutes"

## 🚀 Run the Scheduler

1. Make sure Node.js is installed.
2. Add your commands to `commands.txt`
3. Run the script:

```bash
node scheduler.js

