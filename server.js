const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration from your script
const FRAMES_DIR = 'frames';
const FRAME_DELAY_MS = 50; // 0.041 seconds transformed to milliseconds
const RESET_CURSOR = '\x1b[H';
const CLEAR_SCREEN = '\x1b[2J';

const server = http.createServer((req, res) => {
    // 1. Only serve clients connecting via curl
    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent.includes('curl')) {
        res.writeHead(302, { 'Location': 'https://github.com' });
        res.end();
        return;
    }

    // 2. Read and sort all terminal art frames in the directory
    fs.readdir(FRAMES_DIR, (err, files) => {
        if (err || files.length === 0) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error: Could not read frames directory.\n');
            return;
        }

        // Filter for .txt files and sort them alphanumerically (frame_001, frame_002, etc.)
        const txtFiles = files
            .filter(file => file.endsWith('.txt'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        // 3. Open a live chunked text stream
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked'
        });

        // Clear the user's terminal window exactly once at connection start
        res.write(CLEAR_SCREEN);

        let currentFrameIndex = 0;

        // 4. Playback loop matching your Bash while-true loop
        const playbackInterval = setInterval(() => {
            const currentFile = path.join(FRAMES_DIR, txtFiles[currentFrameIndex]);

            fs.readFile(currentFile, 'utf8', (readErr, data) => {
                if (!readErr) {
                    // Send cursor reset command followed by raw ANSI text data
                    res.write(RESET_CURSOR + data);
                }

                // Advance to the next frame, looping infinitely back to 0
                currentFrameIndex = (currentFrameIndex + 1) % txtFiles.length;
            });
        }, FRAME_DELAY_MS);

        // 5. Connection Cleanup
        // If the user drops the connection or hits Ctrl+C, stop reading files immediately
        req.on('close', () => {
            clearInterval(playbackInterval);
        });
    });
});

server.listen(6767, () => {
    console.log('Video Terminal Server running on http://localhost:6767');
});

