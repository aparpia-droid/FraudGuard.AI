import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { callScenarios } from '../data/scamScenarios';
import { generateScammerResponse, analyzeConversation } from '../utils/scoringEngine';
import './CallSimulator.css';

const CallSimulator = () => {
  const { startSimulation, addMessage, conversationLog, endSimulation, selectedScamType } = useApp();
  const navigate = useNavigate();

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef(null);

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

  const handleStartCall = (scenario) => {
    setSelectedScenario(scenario);
    setCallActive(true);
    const initialMsg = {
      sender: 'scammer',
      text: scenario.initialMessage,
      timestamp: new Date().toISOString()
    };
    addMessage(initialMsg);
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
      <div className="call-interface">
        <div className="call-header">
          <div className="call-info">
            <div className="caller-id">
              <div className="caller-icon">📞</div>
              <div>
                <div className="caller-name">Unknown Caller</div>
                <div className="caller-number">+1 (555) 123-4567</div>
              </div>
            </div>
            <div className="call-status">
              <div className="status-indicator active"></div>
              <span>Call Active - {formatDuration(callDuration)}</span>
            </div>
          </div>
          <div className="scenario-name">{selectedScenario.name}</div>
        </div>

        <div className="conversation-area">
          <div className="messages-container">
            {conversationLog.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-bubble">
                  <div className="message-sender">
                    {message.sender === 'scammer' ? 'Caller' : 'You'}
                  </div>
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message scammer">
                <div className="message-bubble typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area">
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your response..."
              disabled={!callActive}
              autoFocus
            />
            <button type="submit" className="btn-send" disabled={!userInput.trim()}>
              Send
            </button>
          </form>
        </div>

        <div className="call-controls">
          <button onClick={handleEndCall} className="btn-end-call">
            End Call & See Results
          </button>
          <div className="hint-text">
            Remember: It's always okay to hang up on suspicious calls!
          </div>
        </div>
      </div>

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
