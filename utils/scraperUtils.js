const { spawn } = require('child_process');
const path = require('path');

function parseChildOutput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    const first = trimmed.indexOf('[');
    const last = trimmed.lastIndexOf(']');
    if (first !== -1 && last !== -1 && last >= first) {
        const jsonText = trimmed.slice(first, last + 1);
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            console.error('Invalid JSON chunk from scraper:', e.message);
        }
    }

    try {
        return JSON.parse(trimmed);
    } catch (e) {
        console.error('JSON.parse failed for scraper output:', e.message);
    }
    return [];
}

function runScraper(scriptName, query, callback) {
    const process = spawn('python', [scriptName, query], { cwd: path.join(__dirname, '..') });
    let outputData = '';

    process.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    process.stderr.on('data', (data) => {
        console.error(`${scriptName} stderr:`, data.toString());
    });

    process.on('close', (code) => {
        if (code === 0) {
            const results = parseChildOutput(outputData);
            callback(null, results);
        } else {
            console.error(`${scriptName} process exited with code ${code}`);
            callback(new Error(`${scriptName} exited with code ${code}`));
        }
    });
}

module.exports = {
    runScraper
};
