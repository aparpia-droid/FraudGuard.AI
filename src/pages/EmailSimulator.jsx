import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { emailScenarios } from '../data/scamScenarios';
import './EmailSimulator.css';

const EmailSimulator = () => {
  const { startSimulation, endSimulation, selectedScamType } = useApp();
  const navigate = useNavigate();

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedActions, setSelectedActions] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    startSimulation('email');
  }, []);

  // Filter scenarios based on selected scam type
  const filteredScenarios = selectedScamType
    ? emailScenarios.filter(scenario => scenario.category === selectedScamType)
    : emailScenarios;

  const handleStartEmail = (scenario) => {
    setSelectedScenario(scenario);
    setSelectedActions([]);
    setShowResults(false);
  };

  const handleActionClick = (action) => {
    // Check if action is already selected
    if (selectedActions.find(a => a.id === action.id)) {
      // Remove action
      setSelectedActions(selectedActions.filter(a => a.id !== action.id));
    } else {
      // Add action
      setSelectedActions([...selectedActions, action]);
    }
  };

  const handleSubmit = () => {
    if (selectedActions.length === 0) {
      alert('Please select at least one action before submitting.');
      return;
    }

    // Calculate score
    let totalScore = 100;
    const feedback = [];

    selectedActions.forEach(action => {
      totalScore += action.points;

      if (action.safe) {
        feedback.push({
          type: 'success',
          message: `Good choice! ${action.label} was a safe action. (+${action.points} points)`
        });
      } else {
        feedback.push({
          type: 'danger',
          message: `Dangerous! ${action.label} would help the scammer. (${action.points} points)`
        });
      }
    });

    // Ensure score is between 0 and 100
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine grade
    let grade = '';
    let assessment = '';

    if (totalScore >= 90) {
      grade = 'A';
      assessment = 'Excellent! You identified the scam and took all the right actions. You\'re well-protected against email phishing!';
    } else if (totalScore >= 75) {
      grade = 'B';
      assessment = 'Good job! You showed caution and avoided most dangerous actions, but there\'s room for improvement.';
    } else if (totalScore >= 60) {
      grade = 'C';
      assessment = 'You recognized some red flags but took actions that could help scammers. Review the feedback below.';
    } else if (totalScore >= 40) {
      grade = 'D';
      assessment = 'Warning: Several of your actions would have assisted the scammer. This could lead to identity theft or financial loss.';
    } else {
      grade = 'F';
      assessment = 'Critical: You fell for the scam. The actions you took would likely result in serious consequences. Please review the educational materials.';
    }

    const results = {
      score: totalScore,
      grade,
      assessment,
      feedback,
      actions: selectedActions.map(action => ({
        action: action.label,
        type: action.safe ? 'success' : 'danger'
      })),
      redFlags: selectedScenario.redFlags,
      tips: [
        {
          title: 'Email Red Flags to Watch For',
          items: selectedScenario.redFlags
        },
        {
          title: 'Safe Actions to Take',
          items: [
            'Verify sender\'s email address carefully',
            'Never click links in suspicious emails',
            'Contact organizations using official phone numbers or websites',
            'Look for poor grammar and formatting',
            'Be wary of urgent or threatening language',
            'Never provide personal information via email',
            'Report phishing emails to the proper authorities'
          ]
        },
        {
          title: 'Remember',
          items: [
            'Banks and government agencies never ask for sensitive info via email',
            'Legitimate companies don\'t create false urgency',
            'If you didn\'t initiate contact, be suspicious',
            'Hover over links to see real destination (don\'t click!)',
            'When in doubt, contact the company directly using official channels',
            'Report phishing to reportphish@apwg.org'
          ]
        }
      ]
    };

    const simulation = endSimulation(totalScore, results);
    navigate('/results', { state: { results, simulation } });
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
    setSelectedActions([]);
    setShowResults(false);
  };

  if (!selectedScenario) {
    return (
      <div className="email-simulator-container">
        <div className="scenario-selection">
          <h2>Select Your Email Scam Scenario</h2>
          <p>Choose which phishing email you'd like to practice identifying</p>

          <div className="scenario-grid">
            {filteredScenarios.map(scenario => (
              <div key={scenario.id} className="scenario-card">
                <h3>{scenario.name}</h3>
                <p className="scenario-description">{scenario.description}</p>

                <div className="scenario-preview">
                  <strong>Email Preview:</strong>
                  <div className="email-preview">
                    <div className="email-header-preview">
                      <strong>From:</strong> {scenario.from}
                    </div>
                    <div className="email-header-preview">
                      <strong>Subject:</strong> {scenario.subject}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartEmail(scenario)}
                  className="btn-start-scenario"
                >
                  Start This Email
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
    <div className="email-simulator-container active-email">
      <div className="email-interface">
        <div className="email-header-bar">
          <h2>📧 Email Inbox</h2>
          <button onClick={handleBackToScenarios} className="btn-back-scenarios">
            ← Back to Scenarios
          </button>
        </div>

        <div className="email-container">
          <div className="email-header">
            <div className="email-meta">
              <div className="meta-row">
                <span className="meta-label">From:</span>
                <span className="meta-value">{selectedScenario.from}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Subject:</span>
                <span className="meta-value">{selectedScenario.subject}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Date:</span>
                <span className="meta-value">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="email-body">
            <div className="email-content">
              {selectedScenario.body.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="actions-section">
          <h3>What Actions Will You Take?</h3>
          <p className="instructions">Select all actions you would take in response to this email. Choose carefully!</p>

          <div className="actions-grid">
            {selectedScenario.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`action-button ${
                  selectedActions.find(a => a.id === action.id) ? 'selected' : ''
                }`}
              >
                <span className="action-checkbox">
                  {selectedActions.find(a => a.id === action.id) ? '✓' : ''}
                </span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className="btn-submit"
            disabled={selectedActions.length === 0}
          >
            Submit & See Results
          </button>

          <div className="selection-count">
            {selectedActions.length} action{selectedActions.length !== 1 ? 's' : ''} selected
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
            <p>This is a training exercise. In real life, delete suspicious emails immediately!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSimulator;
