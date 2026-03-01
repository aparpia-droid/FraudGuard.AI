import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { callScenarios, emailScenarios } from '../data/scamScenarios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, simulationHistory, selectedScamType } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleStartCall = () => {
    navigate('/call-simulator');
  };

  const handleStartEmail = () => {
    navigate('/email-simulator');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const averageScore = simulationHistory.length > 0
    ? Math.round(simulationHistory.reduce((sum, sim) => sum + sim.score, 0) / simulationHistory.length)
    : 0;

  // Filter scenarios based on selected scam type
  const filteredCallScenarios = selectedScamType
    ? callScenarios.filter(scenario => scenario.category === selectedScamType)
    : callScenarios;

  const filteredEmailScenarios = selectedScamType
    ? emailScenarios.filter(scenario => scenario.category === selectedScamType)
    : emailScenarios;

  // Get scam type display name
  const getScamTypeName = () => {
    switch(selectedScamType) {
      case 'social_security': return 'Social Security / Medicare';
      case 'tech_support': return 'Tech Support';
      case 'lottery': return 'Lottery / Giveaway';
      case 'voice_impersonation': return 'Voice Impersonation';
      default: return 'All Types';
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Scam Defense Training</h1>
          <div className="user-info">
            <span>{user.phoneNumber}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h2>Welcome to Your Training Dashboard</h2>
          <p>Practice identifying and avoiding scam phone calls</p>
        </section>

        {simulationHistory.length > 0 && (
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-number">{simulationHistory.length}</div>
              <div className="stat-label">Simulations Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{averageScore}</div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {simulationHistory.filter(s => s.score >= 75).length}
              </div>
              <div className="stat-label">Passed (75+)</div>
            </div>
          </section>
        )}

        <section className="simulators-section">
          <h3>Start Your Training</h3>
          {selectedScamType && (
            <div className="selected-type-badge">
              Training Type: <strong>{getScamTypeName()}</strong>
            </div>
          )}

          <div className="simulator-cards">
            <div className="simulator-card">
              <div className="card-icon">📞</div>
              <h4>Scam Call Simulator</h4>
              <p>Practice responding to fake scam phone calls. The simulator will attempt to extract information from you using realistic scam tactics.</p>

              <div className="scenarios-list">
                <strong>Scenarios available:</strong>
                <ul>
                  {filteredCallScenarios.map(scenario => (
                    <li key={scenario.id}>{scenario.name}</li>
                  ))}
                </ul>
              </div>

              <button onClick={handleStartCall} className="btn-start btn-call">
                Start Call Simulation
              </button>
            </div>

            <div className="simulator-card">
              <div className="card-icon">📧</div>
              <h4>Scam Email Simulator</h4>
              <p>Learn to identify phishing emails and make safe decisions. Review suspicious emails and choose the right actions to protect yourself.</p>

              <div className="scenarios-list">
                <strong>Scenarios available:</strong>
                <ul>
                  {filteredEmailScenarios.map(scenario => (
                    <li key={scenario.id}>{scenario.name}</li>
                  ))}
                </ul>
              </div>

              <button onClick={handleStartEmail} className="btn-start btn-email">
                Start Email Simulation
              </button>
            </div>
          </div>
        </section>

        {simulationHistory.length > 0 && (
          <section className="history-section">
            <h3>Your Training History</h3>
            <div className="history-list">
              {simulationHistory.slice().reverse().map((sim, index) => (
                <div key={index} className="history-item">
                  <div className="history-icon">📞</div>
                  <div className="history-details">
                    <div className="history-type">Call Simulation</div>
                    <div className="history-date">
                      {new Date(sim.date).toLocaleDateString()} at {new Date(sim.date).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className={`history-score score-${sim.grade.toLowerCase()}`}>
                    <span className="score-number">{sim.score}</span>
                    <span className="score-grade">{sim.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="tips-section">
          <h3>Quick Safety Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🛑</div>
              <div className="tip-content">
                <strong>Never rush</strong>
                <p>Scammers create urgency. Take your time to verify.</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🔍</div>
              <div className="tip-content">
                <strong>Verify independently</strong>
                <p>Call back using official numbers, not ones they provide.</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🔒</div>
              <div className="tip-content">
                <strong>Protect your info</strong>
                <p>Never share passwords, SSN, or financial details.</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">❓</div>
              <div className="tip-content">
                <strong>Ask questions</strong>
                <p>Legitimate organizations will answer your concerns.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
