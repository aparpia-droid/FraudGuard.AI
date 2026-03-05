import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Results.css';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    if (!location.state || !location.state.results) {
      navigate('/dashboard');
    }
  }, [location.state, navigate]);

  if (!location.state || !location.state.results) {
    return null;
  }

  const { results, simulation } = location.state;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#38a169';
      case 'B': return '#4299e1';
      case 'C': return '#ed8936';
      case 'D': return '#f56565';
      case 'F': return '#e53e3e';
      default: return '#718096';
    }
  };

  const handleRetry = () => {
    navigate('/call-simulator');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="results-container">
      <div className="results-card">
        <div className="results-header">
          <h1>Training Results</h1>
          <div className="simulation-type">
            📞 Call Simulation
          </div>
        </div>

        <div className="score-section">
          <div className="score-circle" style={{ borderColor: getGradeColor(results.grade) }}>
            <div className="score-number" style={{ color: getGradeColor(results.grade) }}>
              {results.score}
            </div>
            <div className="score-label">Score</div>
          </div>
          <div className="grade-badge" style={{
            background: getGradeColor(results.grade),
            boxShadow: `0 4px 12px ${getGradeColor(results.grade)}40`
          }}>
            Grade: {results.grade}
          </div>
        </div>

        <div className="assessment-section">
          <h2>Assessment</h2>
          <p className="assessment-text">{results.assessment}</p>
        </div>

        {results.feedback && results.feedback.length > 0 && (
          <div className="feedback-section">
            <h2>Detailed Feedback</h2>
            <div className="feedback-list">
              {results.feedback.map((item, index) => (
                <div key={index} className={`feedback-item ${item.type}`}>
                  <div className="feedback-icon">
                    {item.type === 'success' ? '✓' :
                     item.type === 'warning' ? '⚠' : '✗'}
                  </div>
                  <div className="feedback-text">{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.actions && results.actions.length > 0 && (
          <div className="actions-section">
            <h2>Your Actions</h2>
            <div className="actions-list">
              {results.actions.map((action, index) => (
                <div key={index} className={`action-item ${action.type}`}>
                  <div className="action-icon">
                    {action.type === 'success' ? '✓' :
                     action.type === 'warning' ? '⚠' : '✗'}
                  </div>
                  <div className="action-text">{action.action}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="red-flags-section">
          <h2>Red Flags You Should Have Spotted</h2>
          <ul className="red-flags-list">
            {results.redFlags.map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        </div>

        {results.tips && (
          <div className="tips-section">
            <h2>Educational Tips</h2>
            {results.tips.map((tipGroup, index) => (
              <div key={index} className="tip-group">
                <h3>{tipGroup.title}</h3>
                <ul>
                  {tipGroup.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="actions-buttons">
          <button onClick={handleRetry} className="btn-retry">
            Try Another Simulation
          </button>
          <button onClick={handleDashboard} className="btn-dashboard">
            Back to Dashboard
          </button>
        </div>

        <div className="share-section">
          <p>Keep practicing! The more simulations you complete, the better you'll get at recognizing scams.</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
