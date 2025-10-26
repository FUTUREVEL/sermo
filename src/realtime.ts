import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

let session: RealtimeSession | null = null;
let isConnected = false;
let isMicrophoneOn = true;
let isAISpeaking = false;
let mediaStream: MediaStream | null = null;
let micTestStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let micTestActive = false;

export async function setupRealtime() {
  const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
  const micBtn = document.getElementById('mic-btn') as HTMLButtonElement;
  const micTestBtn = document.getElementById('mic-test-btn') as HTMLButtonElement;
  const retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  
  // Mic popup elements
  const micPopup = document.getElementById('mic-popup') as HTMLDivElement;
  const closePopupBtn = document.getElementById('close-popup') as HTMLButtonElement;
  const startMicTestBtn = document.getElementById('start-mic-test') as HTMLButtonElement;
  const stopMicTestBtn = document.getElementById('stop-mic-test') as HTMLButtonElement;
  const micStatusDiv = document.getElementById('mic-status') as HTMLDivElement;
  const volumeBars = document.querySelectorAll('.volume-bar');
  
  if (!connectBtn || !micBtn || !statusDiv) {
    console.error('Required elements not found');
    return;
  }

  // Update status display
  function updateStatus(message: string, isActive: boolean = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isActive ? 'active' : ''}`;
  }

  // Update button states
  function updateButtons() {
    connectBtn.textContent = isConnected ? 'Disconnect' : 'Connect to OpenAI';
    connectBtn.className = `btn ${isConnected ? 'disconnect' : 'connect'}`;
    
    micBtn.textContent = isMicrophoneOn ? '🎤 Mic On' : '🎤 Mic Off';
    micBtn.className = `btn mic-btn ${isMicrophoneOn ? 'mic-on' : 'mic-off'}`;
    micBtn.disabled = !isConnected;
  }

  // Connect/Disconnect functionality
  connectBtn.addEventListener('click', async () => {
    if (!isConnected) {
      try {
        updateStatus('Connecting...', true);
        
        const agent = new RealtimeAgent({
          name: 'Assistant',
          instructions: 'You are a helpful, friendly assistant. Speak naturally and conversationally in Korean if the user speaks Korean.',
        });
        
        session = new RealtimeSession(agent);
        
        console.log('Attempting to connect to OpenAI Realtime API...');
        console.log('Using ephemeral key:', 'ek_68fdcccb5d888191a4d855036da816f0');
        
        // Add timeout and retry logic
        const connectWithTimeout = async (timeoutMs: number = 10000) => {
          return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout after ' + timeoutMs + 'ms'));
            }, timeoutMs);
            
            session!.connect({
              apiKey: 'ek_68fdcccb5d888191a4d855036da816f0'
            }).then(() => {
              clearTimeout(timeout);
              resolve();
            }).catch((error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
        };
        
        await connectWithTimeout(15000); // 15 second timeout
        
        console.log('Successfully connected to OpenAI Realtime API');
        
        isConnected = true;
        updateStatus('✅ Connected - Ready to talk!', false);
        updateButtons();
        
        // Hide retry button on successful connection
        retryBtn.classList.add('hidden');
        
        // Request microphone access immediately after connection
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone access granted');
          updateStatus('🎤 Ready to talk - Start speaking!', false);
        } catch (micError) {
          console.warn('Microphone access failed:', micError);
          updateStatus('Connected but mic access needed', false);
        }
        
      } catch (e) {
        console.error('Connection failed - Full error details:', e);
        
        // More specific error messages for WebRTC issues
        let errorMessage = 'Connection failed';
        if (e instanceof Error) {
          console.error('Error type:', e.constructor.name);
          console.error('Error message:', e.message);
          console.error('Error stack:', e.stack);
          
          if (e.message.includes('setRemoteDescription') || e.message.includes('RTCPeerConnection')) {
            errorMessage = 'WebRTC connection failed - Try refreshing the page';
          } else if (e.message.includes('SessionDescription')) {
            errorMessage = 'Invalid session description - Generate new key';
          } else if (e.message.includes('API key')) {
            errorMessage = 'Invalid API key - Generate new key';
          } else if (e.message.includes('network') || e.message.includes('fetch')) {
            errorMessage = 'Network error - Check internet connection';
          } else if (e.message.includes('expired') || e.message.includes('timeout')) {
            errorMessage = 'Connection timeout - Try again';
          } else if (e.message.includes('Permission')) {
            errorMessage = 'Permission denied - Allow microphone access';
          } else {
            errorMessage = `Connection failed: ${e.message.substring(0, 50)}...`;
          }
        }
        
        updateStatus(errorMessage, false);
        isConnected = false;
        updateButtons();
        
        // Show retry button on failure
        retryBtn.classList.remove('hidden');
        
        // Suggest solutions
        console.log('🔧 Troubleshooting suggestions:');
        console.log('1. Refresh the page and try again');
        console.log('2. Check your internet connection');
        console.log('3. Generate a new ephemeral key');
        console.log('4. Try using a different browser (Chrome/Edge recommended)');
        console.log('5. Allow microphone permissions');
      }
    } else {
      // Disconnect
      if (session) {
        try {
          // Close the session gracefully
          session = null;
        } catch (e) {
          console.error('Disconnect error:', e);
        }
      }
      
      // Stop microphone stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }
      
      isConnected = false;
      updateStatus('Disconnected', false);
      updateButtons();
    }
  });

  // Microphone toggle functionality
  micBtn.addEventListener('click', async () => {
    if (!isConnected) return;
    
    isMicrophoneOn = !isMicrophoneOn;
    
    if (isMicrophoneOn) {
      try {
        // Request microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateStatus('🎤 Microphone enabled - Ready to talk', false);
      } catch (e) {
        console.error('Microphone access denied:', e);
        updateStatus('Microphone access denied', false);
        isMicrophoneOn = false;
      }
    } else {
      // Stop microphone
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }
      updateStatus('🔇 Microphone disabled', false);
    }
    
    updateButtons();
  });

  // Retry connection functionality
  retryBtn.addEventListener('click', async () => {
    // Reset session
    if (session) {
      try {
        session = null;
      } catch (e) {
        console.error('Error resetting session:', e);
      }
    }
    
    // Clear any existing media streams
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    // Reset state
    isConnected = false;
    isMicrophoneOn = true;
    
    // Hide retry button and try connecting again
    retryBtn.classList.add('hidden');
    
    // Wait a moment before retrying
    updateStatus('Preparing to retry...', true);
    setTimeout(() => {
      connectBtn.click(); // Trigger the connect button
    }, 1000);
  });

  // Microphone visualization functions
  function updateVolumeVisualization(volume: number) {
    const activeBarCount = Math.floor((volume / 100) * volumeBars.length);
    volumeBars.forEach((bar, index) => {
      const barElement = bar as HTMLElement;
      if (index < activeBarCount) {
        barElement.classList.add('active');
        barElement.style.backgroundColor = index < 3 ? '#28a745' : index < 6 ? '#ffc107' : '#dc3545';
      } else {
        barElement.classList.remove('active');
        barElement.style.backgroundColor = '#333';
      }
    });
  }

  function startMicrophoneAnalysis(stream: MediaStream) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function analyze() {
      if (!micTestActive || !analyser) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const volume = (average / 255) * 100;
      
      updateVolumeVisualization(volume);
      
      // Update status based on volume
      if (volume > 50) {
        micStatusDiv.textContent = '🔊 Loud input detected!';
        micStatusDiv.className = 'mic-status loud';
      } else if (volume > 20) {
        micStatusDiv.textContent = '🎤 Good input level';
        micStatusDiv.className = 'mic-status good';
      } else if (volume > 5) {
        micStatusDiv.textContent = '🔉 Quiet input detected';
        micStatusDiv.className = 'mic-status quiet';
      } else {
        micStatusDiv.textContent = '🔇 No input detected';
        micStatusDiv.className = 'mic-status silent';
      }
      
      requestAnimationFrame(analyze);
    }
    
    analyze();
  }

  // Mic popup event handlers
  micTestBtn.addEventListener('click', () => {
    micPopup.classList.remove('hidden');
  });

  closePopupBtn.addEventListener('click', () => {
    stopMicrophoneTest();
    micPopup.classList.add('hidden');
  });

  startMicTestBtn.addEventListener('click', async () => {
    try {
      micTestStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micTestActive = true;
      
      startMicrophoneAnalysis(micTestStream);
      
      startMicTestBtn.disabled = true;
      stopMicTestBtn.disabled = false;
      micStatusDiv.textContent = '🎤 Listening... Speak into your microphone';
      micStatusDiv.className = 'mic-status listening';
      
    } catch (error) {
      console.error('Microphone access failed:', error);
      micStatusDiv.textContent = '❌ Microphone access denied';
      micStatusDiv.className = 'mic-status error';
    }
  });

  stopMicTestBtn.addEventListener('click', () => {
    stopMicrophoneTest();
  });

  function stopMicrophoneTest() {
    micTestActive = false;
    
    if (micTestStream) {
      micTestStream.getTracks().forEach(track => track.stop());
      micTestStream = null;
    }
    
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    
    analyser = null;
    
    // Reset UI
    startMicTestBtn.disabled = false;
    stopMicTestBtn.disabled = true;
    micStatusDiv.textContent = 'Click "Start Test" to begin';
    micStatusDiv.className = 'mic-status';
    
    // Reset volume bars
    volumeBars.forEach(bar => {
      const barElement = bar as HTMLElement;
      barElement.classList.remove('active');
      barElement.style.backgroundColor = '#333';
    });
  }

  // Close popup when clicking outside
  micPopup.addEventListener('click', (e) => {
    if (e.target === micPopup) {
      stopMicrophoneTest();
      micPopup.classList.add('hidden');
    }
  });

  // Initialize button states
  updateStatus('Click Connect to start', false);
  updateButtons();
}