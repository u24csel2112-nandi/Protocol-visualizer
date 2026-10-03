// Tab switching
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function showVisTab(tabId) {
    document.getElementById('visAreaApp').style.display = 'none';
    document.getElementById('visAreaTransport').style.display = 'none';
    document.querySelectorAll('.vis-tab-btn').forEach(el => el.classList.remove('active'));
    
    const activeEl = document.getElementById(tabId === 'appLayer' ? 'visAreaApp' : 'visAreaTransport');
    activeEl.style.display = 'block';
    activeEl.scrollTop = activeEl.scrollHeight;
    event.target.classList.add('active');
}

let currentSequence = [];
let currentStepIndex = 0;
let isPlaying = false;
let playInterval = null;

const sequences = {
    browsing: [
        { 
            app: { sender: 'client', text: 'UDP [Port 53] DNS Query: What is the IP of example.com?' },
            transport: { sender: 'client', text: 'UDP Datagram\nSrc Port: 54321, Dst Port: 53\nLength: 45 bytes' }
        },
        { 
            app: { sender: 'server', text: 'UDP [Port 53] DNS Response: example.com is at 93.184.216.34' },
            transport: { sender: 'server', text: 'UDP Datagram\nSrc Port: 53, Dst Port: 54321\nLength: 61 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Handshake 1\nFlags: [SYN]\nSeq: 0\nWin: 64240' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Handshake 2\nFlags: [SYN, ACK]\nSeq: 0, Ack: 1\nWin: 65535' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Handshake 3\nFlags: [ACK]\nSeq: 1, Ack: 1\nWin: 64240' }
        },
        { 
            app: { sender: 'client', text: 'HTTP GET / HTTP/1.1\nHost: example.com' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 1, Ack: 1\nLength: 75 bytes' }
        },
        { 
            app: { sender: 'server', text: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html>...</html>' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 1, Ack: 76\nLength: 1024 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Teardown 1\nFlags: [FIN, ACK]\nSeq: 76, Ack: 1025' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Teardown 2\nFlags: [ACK]\nSeq: 1025, Ack: 77' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Teardown 3\nFlags: [FIN, ACK]\nSeq: 1025, Ack: 77' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Teardown 4\nFlags: [ACK]\nSeq: 77, Ack: 1026' }
        }
    ],
    mail: [
        { 
            app: { sender: 'client', text: 'UDP [Port 53] DNS Query (MX): MX records for destination domain?' },
            transport: { sender: 'client', text: 'UDP Datagram\nSrc Port: 54322, Dst Port: 53\nLength: 50 bytes' }
        },
        { 
            app: { sender: 'server', text: 'UDP [Port 53] DNS Response: mail.example.com' },
            transport: { sender: 'server', text: 'UDP Datagram\nSrc Port: 53, Dst Port: 54322\nLength: 70 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Handshake 1\nFlags: [SYN]\nSeq: 0\nWin: 64240' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Handshake 2\nFlags: [SYN, ACK]\nSeq: 0, Ack: 1\nWin: 65535' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Handshake 3\nFlags: [ACK]\nSeq: 1, Ack: 1\nWin: 64240' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 220 mail.example.com ESMTP' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 1, Ack: 1\nLength: 32 bytes' }
        },
        { 
            app: { sender: 'client', text: 'SMTP: EHLO myclient.com' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 1, Ack: 33\nLength: 21 bytes' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 250 Hello myclient.com' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 33, Ack: 22\nLength: 28 bytes' }
        },
        { 
            app: { sender: 'client', text: 'SMTP: MAIL FROM:<sender@test.com>' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 22, Ack: 61\nLength: 33 bytes' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 250 OK' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 61, Ack: 55\nLength: 12 bytes' }
        },
        { 
            app: { sender: 'client', text: 'SMTP: RCPT TO:<recipient@example.com>' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 55, Ack: 73\nLength: 37 bytes' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 250 OK' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 73, Ack: 92\nLength: 12 bytes' }
        },
        { 
            app: { sender: 'client', text: 'SMTP: DATA' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 92, Ack: 85\nLength: 6 bytes' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 354 End data with <CR><LF>.<CR><LF>' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 85, Ack: 98\nLength: 39 bytes' }
        },
        { 
            app: { sender: 'client', text: 'SMTP: Subject: Test\\n\\nBody content\\n.' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 98, Ack: 124\nLength: 40 bytes' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 250 OK: queued as 12345' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 124, Ack: 138\nLength: 29 bytes' }
        },
        { 
            app: { sender: 'client', text: 'SMTP: QUIT' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 138, Ack: 153\nLength: 6 bytes' }
        },
        { 
            app: { sender: 'server', text: 'SMTP: 221 Bye' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 153, Ack: 144\nLength: 13 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Teardown 1\nFlags: [FIN, ACK]\nSeq: 144, Ack: 166' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Teardown 2\nFlags: [ACK]\nSeq: 166, Ack: 145' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Teardown 3\nFlags: [FIN, ACK]\nSeq: 166, Ack: 145' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Teardown 4\nFlags: [ACK]\nSeq: 145, Ack: 167' }
        }
    ],
    streaming: [
        { 
            app: { sender: 'client', text: 'UDP [Port 53] DNS Query: IP for video.stream.com' },
            transport: { sender: 'client', text: 'UDP Datagram\nSrc Port: 54323, Dst Port: 53\nLength: 48 bytes' }
        },
        { 
            app: { sender: 'server', text: 'UDP [Port 53] DNS Response: 192.0.2.10' },
            transport: { sender: 'server', text: 'UDP Datagram\nSrc Port: 53, Dst Port: 54323\nLength: 64 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Handshake 1\nFlags: [SYN]\nSeq: 0\nWin: 64240' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Handshake 2\nFlags: [SYN, ACK]\nSeq: 0, Ack: 1\nWin: 65535' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Handshake 3\nFlags: [ACK]\nSeq: 1, Ack: 1\nWin: 64240' }
        },
        { 
            app: { sender: 'client', text: 'HTTP GET /playlist.m3u8' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 1, Ack: 1\nLength: 85 bytes' }
        },
        { 
            app: { sender: 'server', text: 'HTTP/1.1 200 OK\\n(Manifest contents...)' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 1, Ack: 86\nLength: 350 bytes' }
        },
        { 
            app: { sender: 'client', text: 'HTTP GET /segment_001.ts' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 86, Ack: 351\nLength: 86 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Data Segment 1/3\nFlags: [ACK]\nSeq: 351, Ack: 172\nLength: 1460 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Data Segment 2/3\nFlags: [ACK]\nSeq: 1811, Ack: 172\nLength: 1460 bytes' }
        },
        { 
            app: { sender: 'server', text: 'HTTP/1.1 200 OK\\n(Video Data Segment 1)' },
            transport: { sender: 'server', text: 'TCP Data Segment 3/3\nFlags: [PSH, ACK]\nSeq: 3271, Ack: 172\nLength: 1040 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP ACK\nFlags: [ACK]\nSeq: 172, Ack: 4311' }
        },
        { 
            app: { sender: 'client', text: 'HTTP GET /segment_002.ts' },
            transport: { sender: 'client', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 172, Ack: 4311\nLength: 86 bytes' }
        },
        { 
            app: { sender: 'server', text: 'HTTP/1.1 200 OK\\n(Video Data Segment 2)' },
            transport: { sender: 'server', text: 'TCP Data Segment\nFlags: [PSH, ACK]\nSeq: 4311, Ack: 258\nLength: 3960 bytes' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Teardown 1\nFlags: [FIN, ACK]\nSeq: 258, Ack: 8271' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Teardown 2\nFlags: [ACK]\nSeq: 8271, Ack: 259' }
        },
        { 
            app: null,
            transport: { sender: 'server', text: 'TCP Teardown 3\nFlags: [FIN, ACK]\nSeq: 8271, Ack: 259' }
        },
        { 
            app: null,
            transport: { sender: 'client', text: 'TCP Teardown 4\nFlags: [ACK]\nSeq: 259, Ack: 8272' }
        }
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
    
    document.getElementById('visAreaApp').innerHTML = '';
    document.getElementById('visAreaTransport').innerHTML = '';
    
    // Auto-play the visualization
    isPlaying = true;
    document.getElementById('playPauseBtn').textContent = 'Pause';
    playNextStep();
    
    if (playInterval) clearInterval(playInterval);
    playInterval = setInterval(() => {
        if (isPlaying) {
            playNextStep();
        }
    }, 1500);
}

function renderStep(index) {
    if (index < 0 || index >= currentSequence.length) return;
    const step = currentSequence[index];
    const visAreaApp = document.getElementById('visAreaApp');
    const visAreaTransport = document.getElementById('visAreaTransport');
    
    if (step.app) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-box ${step.app.sender}-msg`;
        msgDiv.innerHTML = `<strong>${step.app.sender.toUpperCase()}:</strong><br/>${step.app.text.replace(/\\n/g, '<br/>')}`;
        visAreaApp.appendChild(msgDiv);
        void msgDiv.offsetWidth;
        msgDiv.classList.add('visible');
        visAreaApp.scrollTop = visAreaApp.scrollHeight;
    }
    
    if (step.transport) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-box ${step.transport.sender}-msg`;
        msgDiv.innerHTML = `<strong>${step.transport.sender.toUpperCase()}:</strong><br/>${step.transport.text.replace(/\\n/g, '<br/>')}`;
        visAreaTransport.appendChild(msgDiv);
        void msgDiv.offsetWidth;
        msgDiv.classList.add('visible');
        visAreaTransport.scrollTop = visAreaTransport.scrollHeight;
    }
}

function playNextStep() {
    if (currentStepIndex < currentSequence.length) {
        renderStep(currentStepIndex);
        currentStepIndex++;
    } else {
        pauseSimulation();
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
        const visAreaApp = document.getElementById('visAreaApp');
        const visAreaTransport = document.getElementById('visAreaTransport');
        visAreaApp.innerHTML = '';
        visAreaTransport.innerHTML = '';
        for (let i = 0; i < currentStepIndex; i++) {
            const step = currentSequence[i];
            
            if (step.app) {
                const msgDivApp = document.createElement('div');
                msgDivApp.className = `message-box ${step.app.sender}-msg visible`;
                msgDivApp.innerHTML = `<strong>${step.app.sender.toUpperCase()}:</strong><br/>${step.app.text.replace(/\\n/g, '<br/>')}`;
                visAreaApp.appendChild(msgDivApp);
            }
            
            if (step.transport) {
                const msgDivTransport = document.createElement('div');
                msgDivTransport.className = `message-box ${step.transport.sender}-msg visible`;
                msgDivTransport.innerHTML = `<strong>${step.transport.sender.toUpperCase()}:</strong><br/>${step.transport.text.replace(/\\n/g, '<br/>')}`;
                visAreaTransport.appendChild(msgDivTransport);
            }
        }
    }
}

function replaySimulation() {
    document.getElementById('visAreaApp').innerHTML = '';
    document.getElementById('visAreaTransport').innerHTML = '';
    currentStepIndex = 0;
    isPlaying = true;
    document.getElementById('playPauseBtn').textContent = 'Pause';
}
