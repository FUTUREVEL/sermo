// OpenAI Realtime API uses WebSocket, not the agents library
let websocket: WebSocket | null = null;
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
  
  // 대화창 요소들
  const conversationContainer = document.getElementById('conversation-container') as HTMLDivElement;
  const conversationMessages = document.getElementById('conversation-messages') as HTMLDivElement;
  const clearConversationBtn = document.getElementById('clear-conversation') as HTMLButtonElement;
  const userSpeakingIndicator = document.getElementById('user-speaking') as HTMLDivElement;
  const aiSpeakingIndicator = document.getElementById('ai-speaking') as HTMLDivElement;
  
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

  // 대화 메시지를 추가하는 함수
  function addMessageToConversation(sender: 'user' | 'ai', content: string) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.textContent = sender === 'user' ? '👤 사용자' : '🤖 AI Assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    conversationMessages.appendChild(messageDiv);
    
    // 자동 스크롤을 위해 최신 메시지로 이동
    messageDiv.scrollIntoView({ behavior: 'smooth' });
  }

  // 말하는 상태 표시를 업데이트하는 함수
  function updateSpeakingStatus(speaker: 'user' | 'ai' | 'none') {
    userSpeakingIndicator.classList.toggle('hidden', speaker !== 'user');
    aiSpeakingIndicator.classList.toggle('hidden', speaker !== 'ai');
  }

  // Handle incoming messages from OpenAI Realtime API
  function handleRealtimeMessage(message: any) {
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'session.created':
        console.log('Session created successfully');
        addMessageToConversation('ai', '세션이 연결되었습니다. 말씀해 주세요!');
        break;
      case 'session.updated':
        console.log('Session updated');
        break;
      case 'conversation.item.created':
        console.log('Conversation item created:', message);
        if (message.item && message.item.content) {
          // 사용자의 음성을 텍스트로 변환된 것
          if (message.item.role === 'user') {
            const transcript = message.item.content[0]?.transcript || message.item.content[0]?.text;
            if (transcript) {
              addMessageToConversation('user', transcript);
              updateSpeakingStatus('none');
            }
          }
        }
        break;
      case 'response.audio.delta':
        // Handle audio response from AI
        if (message.delta) {
          console.log('Received audio delta');
          updateSpeakingStatus('ai');
          // TODO: Play audio delta
        }
        break;
      case 'response.text.delta':
        // Handle text response from AI
        if (message.delta) {
          console.log('AI response:', message.delta);
          // AI가 텍스트로 응답하는 경우
          addMessageToConversation('ai', message.delta);
          updateSpeakingStatus('ai');
        }
        break;
      case 'response.done':
        console.log('Response completed');
        updateSpeakingStatus('none');
        break;
      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        updateSpeakingStatus('user');
        break;
      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        updateSpeakingStatus('none');
        break;
      case 'conversation.item.input_audio_transcription.completed':
        // 사용자 음성의 전체 전사가 완료됨
        if (message.transcript) {
          addMessageToConversation('user', message.transcript);
        }
        break;
      case 'response.output_item.added':
        // AI 응답이 시작됨
        if (message.item && message.item.content) {
          updateSpeakingStatus('ai');
        }
        break;
      case 'error':
        console.error('OpenAI API error:', message);
        addMessageToConversation('ai', `오류가 발생했습니다: ${message.error?.message || '알 수 없는 오류'}`);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
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
        
        console.log('Attempting to connect to OpenAI Realtime API...');
        
        // Get fresh ephemeral key from your backend or use environment variable
        // TODO: Replace with valid ephemeral key from RealTimeGptTest.py
        const apiKey = 'ek_68fdde1ffcf081918d8a183e563ffbb2'; // ⚠️ This key is expired - need new one
        
        // Create WebSocket connection to OpenAI Realtime API with proper authentication
        const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
        
        // Use WebSocket with proper headers via subprotocols for authentication
        websocket = new WebSocket(wsUrl, [
          'realtime',
          `openai-beta.realtime-v1`,
          `openai-insecure-api-key.${apiKey}`
        ]);
        
        console.log('Using ephemeral key:', apiKey);
        
        // Add timeout for WebSocket connection
        const connectWithTimeout = async (timeoutMs: number = 15000) => {
          return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('WebSocket connection timeout after ' + timeoutMs + 'ms'));
            }, timeoutMs);
            
            websocket!.onopen = () => {
              clearTimeout(timeout);
              console.log('WebSocket connection established');
              
              // Send session configuration (authentication already done via subprotocol)
              websocket!.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: 'You are a helpful, friendly assistant. Speak naturally and conversationally in Korean if the user speaks Korean.',
                  voice: 'alloy',
                  input_audio_format: 'pcm16',
                  output_audio_format: 'pcm16',
                  input_audio_transcription: {
                    model: 'whisper-1'
                  }
                }
              }));
              
              resolve();
            };
            
            websocket!.onerror = (error) => {
              clearTimeout(timeout);
              console.error('WebSocket connection error:', error);
              reject(new Error('WebSocket connection failed'));
            };
            
            websocket!.onclose = (event) => {
              clearTimeout(timeout);
              console.log('WebSocket connection closed:', event.code, event.reason);
              if (event.code !== 1000) { // Not a normal closure
                reject(new Error(`WebSocket closed unexpectedly: ${event.reason || event.code}`));
              }
            };
            
            websocket!.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data);
                handleRealtimeMessage(message);
              } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
              }
            };
          });
        };
        
        await connectWithTimeout(15000); // 15 second timeout
        
        console.log('Successfully connected to OpenAI Realtime API');
        
        isConnected = true;
        updateStatus('✅ Connected - Ready to talk!', false);
        updateButtons();
        
        // Show conversation container
        conversationContainer.classList.remove('hidden');
        
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
        
        // More specific error messages based on the actual error
        let errorMessage = 'Connection failed';
        if (e instanceof Error) {
          console.error('Error type:', e.constructor.name);
          console.error('Error message:', e.message);
          console.error('Error stack:', e.stack);
          
          if (e.message.includes('WebSocket') && e.message.includes('timeout')) {
            errorMessage = 'Connection timeout - Ephemeral key may be expired';
          } else if (e.message.includes('WebSocket') && e.message.includes('failed')) {
            errorMessage = 'WebSocket connection failed - Check API key and network';
          } else if (e.message.includes('closed unexpectedly')) {
            errorMessage = 'Connection closed - Generate new ephemeral key';
          } else if (e.message.includes('network') || e.message.includes('fetch')) {
            errorMessage = 'Network error - Check internet connection';
          } else if (e.message.includes('timeout')) {
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
        console.log('1. Generate a fresh ephemeral key using RealTimeGptTest.py');
        console.log('2. Set a valid OPENAI_API_KEY environment variable');
        console.log('3. Ensure you have access to OpenAI Realtime API');
        console.log('4. Check your internet connection');
        console.log('5. Try using a different browser (Chrome/Edge recommended)');
        console.log('6. Allow microphone permissions when prompted');
      }
    } else {
      // Disconnect
      if (websocket) {
        try {
          // Close the WebSocket connection gracefully
          websocket.close(1000, 'User disconnected');
          websocket = null;
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
      
      // Hide conversation container
      conversationContainer.classList.add('hidden');
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
    // Reset websocket
    if (websocket) {
      try {
        websocket.close();
        websocket = null;
      } catch (e) {
        console.error('Error resetting websocket:', e);
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

  // Clear conversation button
  clearConversationBtn.addEventListener('click', () => {
    conversationMessages.innerHTML = '';
    addMessageToConversation('ai', '대화 기록이 지워졌습니다.');
  });

  // Initialize button states
  updateStatus('Click Connect to start', false);
  updateButtons();
}