import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedScamType, setSelectedScamType] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: phone + scam type, 2: verification code
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, setScamType } = useApp();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

  const handleSubmit = async (e) => {
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

    // Send verification code
    setLoading(true);
    setError('');

    try {
      const formattedPhone = `+1${digitsOnly}`;
      await axios.post(`${API_URL}/send-code`, {
        phoneNumber: formattedPhone
      });

      // Move to verification step
      setStep(2);
      setLoading(false);
    } catch (err) {
      console.error('Error sending code:', err);
      setError('Failed to send verification code. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+1${digitsOnly}`;

      const response = await axios.post(`${API_URL}/verify-code`, {
        phoneNumber: formattedPhone,
        code: verificationCode
      });

      if (response.data.verified) {
        // Successful verification
        login(phoneNumber);
        setScamType(selectedScamType);
        navigate('/dashboard');
      } else {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Failed to verify code. Please try again.');
      setLoading(false);
    }
  };

  const handleBackToPhoneInput = () => {
    setStep(1);
    setVerificationCode('');
    setError('');
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

        {step === 1 ? (
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
                disabled={loading}
              />
              <span className="help-text">
                We'll send you a verification code via SMS
              </span>
            </div>

            <div className="form-group">
              <label>Choose Scam Type to Practice</label>
              <div className="scam-type-buttons">
                <button
                  type="button"
                  className={`scam-type-btn ${selectedScamType === 'social_security' ? 'selected' : ''}`}
                  onClick={() => handleScamTypeSelect('social_security')}
                  disabled={loading}
                >
                  <span className="scam-icon">🏛️</span>
                  <span className="scam-label">Social Security / Medicare</span>
                </button>
                <button
                  type="button"
                  className={`scam-type-btn ${selectedScamType === 'tech_support' ? 'selected' : ''}`}
                  onClick={() => handleScamTypeSelect('tech_support')}
                  disabled={loading}
                >
                  <span className="scam-icon">💻</span>
                  <span className="scam-label">Tech Support</span>
                </button>
                <button
                  type="button"
                  className={`scam-type-btn ${selectedScamType === 'lottery' ? 'selected' : ''}`}
                  onClick={() => handleScamTypeSelect('lottery')}
                  disabled={loading}
                >
                  <span className="scam-icon">🎁</span>
                  <span className="scam-label">Lottery / Giveaway</span>
                </button>
                <button
                  type="button"
                  className={`scam-type-btn ${selectedScamType === 'voice_impersonation' ? 'selected' : ''}`}
                  onClick={() => handleScamTypeSelect('voice_impersonation')}
                  disabled={loading}
                >
                  <span className="scam-icon">🎭</span>
                  <span className="scam-label">Voice Impersonation</span>
                </button>
              </div>
              {error && <span className="error-message">{error}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="verification-step">
              <div className="verification-icon">📱</div>
              <h3>Verify Your Phone Number</h3>
              <p className="verification-text">
                We sent a 6-digit code to <strong>{phoneNumber}</strong>
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="code">Enter Verification Code</label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="000000"
                maxLength="6"
                className={error ? 'error' : ''}
                autoFocus
                disabled={loading}
              />
              {error && <span className="error-message">{error}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Start Training'}
            </button>

            <button
              type="button"
              onClick={handleBackToPhoneInput}
              className="btn-secondary"
              disabled={loading}
            >
              ← Change Phone Number
            </button>
          </form>
        )}

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
