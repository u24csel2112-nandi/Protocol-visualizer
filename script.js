// Tab switching
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

let currentSequence = [];
let currentStepIndex = 0;
let isPlaying = false;
let playInterval = null;

const sequences = {
    browsing: [
        { sender: 'client', text: 'DNS Query: What is the IP of example.com?' },
        { sender: 'server', text: 'DNS Response: example.com is at 93.184.216.34' },
        { sender: 'client', text: 'HTTP GET / HTTP/1.1\nHost: example.com' },
        { sender: 'server', text: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html>...</html>' }
    ],
    mail: [
        { sender: 'client', text: 'DNS Query (MX): MX records for destination domain?' },
        { sender: 'server', text: 'DNS Response: mail.example.com' },
        { sender: 'client', text: 'SMTP: EHLO myclient.com' },
        { sender: 'server', text: 'SMTP: 250 Hello myclient.com' },
        { sender: 'client', text: 'SMTP: MAIL FROM:<sender@test.com>' },
        { sender: 'server', text: 'SMTP: 250 OK' },
        { sender: 'client', text: 'SMTP: RCPT TO:<recipient@example.com>' },
        { sender: 'server', text: 'SMTP: 250 OK' },
        { sender: 'client', text: 'SMTP: DATA' },
        { sender: 'server', text: 'SMTP: 354 End data with <CR><LF>.<CR><LF>' },
        { sender: 'client', text: 'SMTP: Subject: Test\\n\\nBody content\\n.' },
        { sender: 'server', text: 'SMTP: 250 OK: queued as 12345' },
        { sender: 'client', text: 'SMTP: QUIT' },
        { sender: 'server', text: 'SMTP: 221 Bye' }
    ],
    streaming: [
        { sender: 'client', text: 'DNS Query: IP for video.stream.com' },
        { sender: 'server', text: 'DNS Response: 192.0.2.10' },
        { sender: 'client', text: 'HTTP GET /playlist.m3u8' },
        { sender: 'server', text: 'HTTP/1.1 200 OK\\n(Manifest contents...)' },
        { sender: 'client', text: 'HTTP GET /segment_001.ts' },
        { sender: 'server', text: 'HTTP/1.1 200 OK\\n(Video Data...)' },
        { sender: 'client', text: 'HTTP GET /segment_002.ts' },
        { sender: 'server', text: 'HTTP/1.1 200 OK\\n(Video Data...)' }
    ]
};

function logActivity(message) {
    const logList = document.getElementById('logList');
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logList.prepend(li);
}

function startSimulation(type) {
    logActivity(`Started ${type} simulation`);
    currentSequence = sequences[type];
    currentStepIndex = 0;
    document.getElementById('visArea').innerHTML = '';
    
    // Auto-play the visualization
    isPlaying = true;
    document.getElementById('playPauseBtn').textContent = 'Pause';
    playNextStep();
    
    if (playInterval) clearInterval(playInterval);
    playInterval = setInterval(() => {
        if (isPlaying) {
            playNextStep();
        }
    }, 1500); // 1.5s per step
}

function renderStep(index) {
    if (index < 0 || index >= currentSequence.length) return;
    const step = currentSequence[index];
    const visArea = document.getElementById('visArea');
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message-box ${step.sender}-msg`;
    msgDiv.innerHTML = `<strong>${step.sender.toUpperCase()}:</strong><br/>${step.text.replace(/\\n/g, '<br/>')}`;
    
    visArea.appendChild(msgDiv);
    
    // Trigger reflow to apply transition
    void msgDiv.offsetWidth;
    msgDiv.classList.add('visible');
    visArea.scrollTop = visArea.scrollHeight;
}

function playNextStep() {
    if (currentStepIndex < currentSequence.length) {
        renderStep(currentStepIndex);
        currentStepIndex++;
    } else {
        pauseSimulation(); // Stop when finished
    }
}

function pauseSimulation() {
    isPlaying = false;
    document.getElementById('playPauseBtn').textContent = 'Play';
}

function togglePlayPause() {
    if (!currentSequence.length) return;
    isPlaying = !isPlaying;
    document.getElementById('playPauseBtn').textContent = isPlaying ? 'Pause' : 'Play';
}

function nextStep() {
    pauseSimulation();
    if (currentStepIndex < currentSequence.length) {
        playNextStep();
    }
}

function prevStep() {
    pauseSimulation();
    if (currentStepIndex > 0) {
        currentStepIndex--;
        // Re-render everything up to current step
        const visArea = document.getElementById('visArea');
        visArea.innerHTML = '';
        for (let i = 0; i < currentStepIndex; i++) {
            const step = currentSequence[i];
            const msgDiv = document.createElement('div');
            msgDiv.className = `message-box ${step.sender}-msg visible`;
            msgDiv.innerHTML = `<strong>${step.sender.toUpperCase()}:</strong><br/>${step.text.replace(/\\n/g, '<br/>')}`;
            visArea.appendChild(msgDiv);
        }
    }
}

function replaySimulation() {
    document.getElementById('visArea').innerHTML = '';
    currentStepIndex = 0;
    isPlaying = true;
    document.getElementById('playPauseBtn').textContent = 'Pause';
}
