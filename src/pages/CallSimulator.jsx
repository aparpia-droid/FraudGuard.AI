import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { callScenarios } from '../data/scamScenarios';
import { generateScammerResponse, analyzeConversation } from '../utils/scoringEngine';
import axios from 'axios';
import './CallSimulator.css';

const CallSimulator = () => {
  const { user, startSimulation, addMessage, conversationLog, endSimulation, selectedScamType } = useApp();
  const navigate = useNavigate();

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [callInitiated, setCallInitiated] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    startSimulation('call');
  }, []);

  useEffect(() => {
    let interval;
    if (callActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationLog]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async (scenario) => {
    setSelectedScenario(scenario);
    setCallActive(true);

    // Show initial message immediately
    const initialMsg = {
      sender: 'scammer',
      text: scenario.initialMessage,
      timestamp: new Date().toISOString()
    };
    addMessage(initialMsg);

    // Make actual phone call through backend
    try {
      const phoneNumber = user?.phoneNumber || '';
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+1${digitsOnly}`;

      console.log('Initiating call to:', formattedPhone);
      console.log('Scenario ID:', scenario.id);

      const response = await axios.post(`${API_URL}/dev-call`, {
        phoneNumber: formattedPhone,
        scenarioId: scenario.id
      });

      if (response.data.ok) {
        setSessionId(response.data.sessionId);
        setCallInitiated(true);
        console.log('Call initiated successfully. Session ID:', response.data.sessionId);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      // Continue with simulation even if call fails
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = {
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString()
    };
    addMessage(userMsg);
    setUserInput('');

    // Simulate scammer typing
    setIsTyping(true);
    setTimeout(() => {
      const scammerResponse = generateScammerResponse(
        userInput,
        selectedScenario,
        conversationLog
      );
      const scammerMsg = {
        sender: 'scammer',
        text: scammerResponse,
        timestamp: new Date().toISOString()
      };
      addMessage(scammerMsg);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleEndCall = () => {
    const results = analyzeConversation(conversationLog, selectedScenario);
    const simulation = endSimulation(results.score, results);
    navigate('/results', { state: { results, simulation } });
  };

  // Filter scenarios based on selected scam type
  const filteredScenarios = selectedScamType
    ? callScenarios.filter(scenario => scenario.category === selectedScamType)
    : callScenarios;

  if (!selectedScenario) {
    return (
      <div className="call-simulator-container">
        <div className="scenario-selection">
          <h2>Select your Scam Call Scenario</h2>
          <p>Choose which specific scenario you'd like to practice</p>

          <div className="scenario-grid">
            {filteredScenarios.map(scenario => (
              <div key={scenario.id} className="scenario-card">
                <h3>{scenario.name}</h3>
                <p className="scenario-description">{scenario.description}</p>

                <div className="scenario-preview">
                  <strong>Call will start with:</strong>
                  <p className="preview-text">"{scenario.initialMessage.substring(0, 150)}..."</p>
                </div>

                <button
                  onClick={() => handleStartCall(scenario)}
                  className="btn-start-scenario"
                >
                  Start This Call
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn-back">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-simulator-container active-call">
      <div className="phone-call-screen">
        <div className="phone-container">
          {/* Phone Call Header */}
          <div className="phone-header">
            <div className="status-bar">
              <span>9:41</span>
              <div className="status-icons">
                <span>📶</span>
                <span>📡</span>
                <span>🔋</span>
              </div>
            </div>
          </div>

          {/* Caller Info Display */}
          <div className="caller-display">
            <div className="caller-avatar">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="60" fill="#E2E8F0"/>
                <text x="60" y="75" fontSize="48" fill="#718096" textAnchor="middle">?</text>
              </svg>
            </div>
            <h2 className="caller-name-display">Unknown Caller</h2>
            <p className="caller-number-display">+1 (555) 123-4567</p>
            <div className="call-timer">{formatDuration(callDuration)}</div>
            <p className="call-type-label">{selectedScenario.name}</p>
          </div>

          {/* Transcript Area (scrollable) */}
          <div className="call-transcript">
            <div className="transcript-header">
              <span>Call Transcript</span>
            </div>
            <div className="transcript-messages">
              {conversationLog.map((message, index) => (
                <div key={index} className={`transcript-item ${message.sender}`}>
                  <span className="transcript-label">
                    {message.sender === 'scammer' ? '🔴 Caller:' : '🟢 You:'}
                  </span>
                  <p className="transcript-text">{message.text}</p>
                </div>
              ))}
              {isTyping && (
                <div className="transcript-item scammer">
                  <span className="transcript-label">🔴 Caller:</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Response Input */}
          <div className="response-input-area">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                className="response-input"
                autoFocus
              />
              <button type="submit" className="send-response-btn" disabled={!userInput.trim()}>
                Send
              </button>
            </form>
          </div>

          {/* Phone Call Actions */}
          <div className="phone-actions">
            <div className="action-buttons">
              <button className="action-btn mute-btn" title="Mute">
                <span className="btn-icon">🔇</span>
                <span className="btn-label">mute</span>
              </button>
              <button className="action-btn keypad-btn" title="Keypad">
                <span className="btn-icon">⌨️</span>
                <span className="btn-label">keypad</span>
              </button>
              <button className="action-btn speaker-btn" title="Speaker">
                <span className="btn-icon">🔊</span>
                <span className="btn-label">speaker</span>
              </button>
            </div>

            <button onClick={handleEndCall} className="end-call-btn">
              <span className="end-call-icon">📞</span>
            </button>

            <p className="reminder-text">
              Remember: It's always okay to hang up on suspicious calls!
            </p>
          </div>
        </div>
      </div>

      {/* Side Panel for Red Flags */}
      <div className="side-panel">
        <h3>Red Flags to Watch For:</h3>
        <ul className="red-flags-list">
          {selectedScenario.redFlags.map((flag, index) => (
            <li key={index}>{flag}</li>
          ))}
        </ul>

        <div className="safety-reminder">
          <strong>Safety Reminder:</strong>
          <p>In a real scam call, you should hang up immediately. This is practice!</p>
        </div>
      </div>
    </div>
  );
};

export default CallSimulator;
