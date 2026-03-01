import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedScamType, setSelectedScamType] = useState(null);
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [conversationLog, setConversationLog] = useState([]);
  const [sharedInfo, setSharedInfo] = useState({
    personalInfo: [],
    financialInfo: [],
    securityInfo: []
  });

  const login = (phoneNumber) => {
    setUser({ phoneNumber });
  };

  const setScamType = (type) => {
    setSelectedScamType(type);
  };

  const logout = () => {
    setUser(null);
    setSelectedScamType(null);
    setCurrentSimulation(null);
    setConversationLog([]);
    setSharedInfo({
      personalInfo: [],
      financialInfo: [],
      securityInfo: []
    });
  };

  const startSimulation = (type) => {
    setCurrentSimulation(type);
    setConversationLog([]);
    setSharedInfo({
      personalInfo: [],
      financialInfo: [],
      securityInfo: []
    });
  };

  const addMessage = (message) => {
    setConversationLog(prev => [...prev, message]);
  };

  const trackSharedInfo = (category, info) => {
    setSharedInfo(prev => ({
      ...prev,
      [category]: [...prev[category], info]
    }));
  };

  const endSimulation = (score, feedback) => {
    const simulation = {
      type: currentSimulation,
      date: new Date().toISOString(),
      score,
      grade: feedback.grade || 'N/A',
      feedback,
      conversationLog,
      sharedInfo
    };
    setSimulationHistory(prev => [...prev, simulation]);
    return simulation;
  };

  const value = {
    user,
    selectedScamType,
    currentSimulation,
    simulationHistory,
    conversationLog,
    sharedInfo,
    login,
    setScamType,
    logout,
    startSimulation,
    addMessage,
    trackSharedInfo,
    endSimulation
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
