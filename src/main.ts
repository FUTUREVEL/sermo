import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupRealtime } from './realtime.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>OpenAI Realtime Chat</h1>
    
    <div class="realtime-container">
      <div id="status" class="status">Ready to connect</div>
      
      <div class="card">
        <button id="connect-btn" type="button" class="btn connect">Connect to OpenAI</button>
        <button id="mic-btn" type="button" class="btn mic-btn mic-on" disabled>🎤 Mic On</button>
        <button id="mic-test-btn" type="button" class="btn mic-test">🎤 Test Mic</button>
        <button id="retry-btn" type="button" class="btn retry hidden">🔄 Retry Connection</button>
      </div>
      
      <div class="instructions">
        <p>1. Click "Connect to OpenAI" to start</p>
        <p>2. Allow microphone access when prompted</p>
        <p>3. Use "Test Mic" to check microphone input</p>
        <p>4. Use the mic button to toggle microphone on/off</p>
        <p>5. Start speaking naturally!</p>
      </div>
    </div>
    
    <!-- Microphone Test Popup -->
    <div id="mic-popup" class="mic-popup hidden">
      <div class="mic-popup-content">
        <div class="mic-popup-header">
          <h3>🎤 Microphone Test</h3>
          <button id="close-popup" class="close-btn">×</button>
        </div>
        <div class="mic-popup-body">
          <div class="mic-visualizer">
            <div class="mic-icon">🎤</div>
            <div class="volume-bars">
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
              <div class="volume-bar"></div>
            </div>
          </div>
          <div id="mic-status" class="mic-status">Click "Start Test" to begin</div>
          <div class="mic-controls">
            <button id="start-mic-test" class="btn mic-test">Start Test</button>
            <button id="stop-mic-test" class="btn mic-stop" disabled>Stop Test</button>
          </div>
        </div>
      </div>
    </div>
    
    <p class="read-the-docs">
      Powered by OpenAI Realtime API
    </p>
  </div>
`

setupRealtime()
