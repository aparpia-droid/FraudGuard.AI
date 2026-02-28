import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Login.css';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedScamType, setSelectedScamType] = useState('');
  const [error, setError] = useState('');
  const { login, setScamType } = useApp();
  const navigate = useNavigate();

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const handleScamTypeSelect = (type) => {
    setSelectedScamType(type);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!selectedScamType) {
      setError('Please select a scam type to practice');
      return;
    }

    login(phoneNumber);
    setScamType(selectedScamType);
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="shield-icon">🛡️</div>
          <h1>Scam Defense Training</h1>
          <p className="subtitle">Stay Safe. Stay Smart. Stay Protected.</p>
        </div>

        <div className="info-section">
          <div className="info-content">
            <div className="info-icon">💡</div>
            <div>
              <h3>Practice Makes Perfect</h3>
              <p>
                Experience realistic scam scenarios in a safe environment.
                Learn to spot red flags and protect yourself from fraud.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="phone">Enter Your Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              maxLength="14"
              className={error ? 'error' : ''}
              autoFocus
            />
            <span className="help-text">
              Your number is only used for this training session
            </span>
          </div>

          <div className="form-group">
            <label>Choose Scam Type to Practice</label>
            <div className="scam-type-buttons">
              <button
                type="button"
                className={`scam-type-btn ${selectedScamType === 'social_security' ? 'selected' : ''}`}
                onClick={() => handleScamTypeSelect('social_security')}
              >
                <span className="scam-icon">🏛️</span>
                <span className="scam-label">Social Security / Medicare</span>
              </button>
              <button
                type="button"
                className={`scam-type-btn ${selectedScamType === 'tech_support' ? 'selected' : ''}`}
                onClick={() => handleScamTypeSelect('tech_support')}
              >
                <span className="scam-icon">💻</span>
                <span className="scam-label">Tech Support</span>
              </button>
              <button
                type="button"
                className={`scam-type-btn ${selectedScamType === 'lottery' ? 'selected' : ''}`}
                onClick={() => handleScamTypeSelect('lottery')}
              >
                <span className="scam-icon">🎁</span>
                <span className="scam-label">Lottery / Giveaway</span>
              </button>
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="btn-primary">
            Start Training
          </button>
        </form>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-large">📞</div>
            <h4>Real Scenarios</h4>
            <p>Practice with actual scam tactics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-large">🎯</div>
            <h4>Targeted Training</h4>
            <p>Focus on specific scam types</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-large">📊</div>
            <h4>Instant Feedback</h4>
            <p>Get detailed performance analysis</p>
          </div>
        </div>

        <div className="trust-badges">
          <div className="trust-badge">
            <span className="badge-icon">✓</span>
            <span>100% Safe & Private</span>
          </div>
          <div className="trust-badge">
            <span className="badge-icon">✓</span>
            <span>Educational Purpose</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
