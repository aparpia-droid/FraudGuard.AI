// Patterns to detect sensitive information sharing
const sensitivePatterns = {
  personalInfo: {
    fullName: /my name is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    address: /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/i,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
    dob: /\b(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b/,
  },
  financialInfo: {
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
    bankAccount: /\b\d{8,17}\b/,
    routingNumber: /\b\d{9}\b/,
    cvv: /\b\d{3,4}\b/,
    pin: /\bpin\b.*\b\d{4}\b/i,
    giftCard: /\b[A-Z0-9]{10,20}\b/,
  },
  securityInfo: {
    password: /\b(?:password|pwd|pass)\b.*?[:\s]+([^\s]+)/i,
    securityQuestion: /mother'?s maiden name|first pet|born in/i,
    remoteAccess: /\b(?:teamviewer|anydesk|remote desktop|chrome remote)\b/i,
  }
};

// Red flag behaviors
const dangerousBehaviors = {
  agreeingToPayment: /(?:yes|okay|sure|fine).*(?:pay|send|transfer|buy)/i,
  downloadingSoftware: /(?:download|install|click|open)/i,
  sharingAccess: /(?:remote access|take control|screen share)/i,
  urgentCompliance: /(?:right now|immediately|hurry|quick)/i,
  trustingCaller: /(?:i trust you|you seem legitimate|okay i'll do it)/i,
};

// Positive behaviors
const safeBehaviors = {
  questioning: /(?:how do i know|prove it|verify|suspicious|scam|not sure)/i,
  refusing: /(?:no|won't|refuse|don't want|not interested|hang up|call back)/i,
  verification: /(?:call back|verify|check with|contact directly)/i,
  endingCall: /(?:goodbye|hanging up|end call|not interested)/i,
};

export const analyzeConversation = (conversationLog, scenario) => {
  let score = 100;
  const detectedInfo = {
    personalInfo: [],
    financialInfo: [],
    securityInfo: []
  };
  const behaviors = {
    dangerous: [],
    safe: []
  };
  const feedback = [];

  // Analyze each user message
  conversationLog.forEach((message, index) => {
    if (message.sender === 'user') {
      const text = message.text;

      // Check for shared personal information
      Object.entries(sensitivePatterns.personalInfo).forEach(([type, pattern]) => {
        if (pattern.test(text)) {
          detectedInfo.personalInfo.push(type);
          score -= 15;
          feedback.push({
            type: 'warning',
            message: `You shared ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}. Never share personal information with unsolicited callers.`,
            timestamp: message.timestamp
          });
        }
      });

      // Check for shared financial information
      Object.entries(sensitivePatterns.financialInfo).forEach(([type, pattern]) => {
        if (pattern.test(text)) {
          detectedInfo.financialInfo.push(type);
          score -= 25;
          feedback.push({
            type: 'danger',
            message: `CRITICAL: You shared ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}. This is extremely dangerous and could lead to financial loss.`,
            timestamp: message.timestamp
          });
        }
      });

      // Check for shared security information
      Object.entries(sensitivePatterns.securityInfo).forEach(([type, pattern]) => {
        if (pattern.test(text)) {
          detectedInfo.securityInfo.push(type);
          score -= 30;
          feedback.push({
            type: 'danger',
            message: `CRITICAL: You shared ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}. Never give anyone access to your devices or passwords.`,
            timestamp: message.timestamp
          });
        }
      });

      // Check for dangerous behaviors
      Object.entries(dangerousBehaviors).forEach(([behavior, pattern]) => {
        if (pattern.test(text)) {
          behaviors.dangerous.push(behavior);
          score -= 10;
          feedback.push({
            type: 'warning',
            message: `You showed willingness to comply with the scammer's request (${behavior.replace(/([A-Z])/g, ' $1').toLowerCase()}).`,
            timestamp: message.timestamp
          });
        }
      });

      // Check for safe behaviors (increase score)
      Object.entries(safeBehaviors).forEach(([behavior, pattern]) => {
        if (pattern.test(text)) {
          behaviors.safe.push(behavior);
          score = Math.min(100, score + 5);
          feedback.push({
            type: 'success',
            message: `Good job! You showed skepticism by ${behavior.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
            timestamp: message.timestamp
          });
        }
      });
    }
  });

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Generate overall assessment
  let assessment = '';
  let grade = '';

  if (score >= 90) {
    grade = 'A';
    assessment = 'Excellent! You demonstrated strong awareness of scam tactics and protected your information well.';
  } else if (score >= 75) {
    grade = 'B';
    assessment = 'Good job! You showed caution, but there were a few moments where you could have been more skeptical.';
  } else if (score >= 60) {
    grade = 'C';
    assessment = 'You showed some awareness, but shared information that could be dangerous. Review the red flags below.';
  } else if (score >= 40) {
    grade = 'D';
    assessment = 'Warning: You shared significant information with the scammer. This would likely result in financial loss or identity theft.';
  } else {
    grade = 'F';
    assessment = 'Critical: You fell for the scam and shared sensitive information. Please review the educational materials carefully.';
  }

  return {
    score,
    grade,
    assessment,
    detectedInfo,
    behaviors,
    feedback,
    redFlags: scenario.redFlags,
    tips: generateTips(detectedInfo, behaviors, scenario)
  };
};

const generateTips = (detectedInfo, behaviors, scenario) => {
  const tips = [
    {
      title: 'Red Flags You Should Watch For',
      items: scenario.redFlags
    }
  ];

  if (detectedInfo.personalInfo.length > 0 || detectedInfo.financialInfo.length > 0 || detectedInfo.securityInfo.length > 0) {
    tips.push({
      title: 'Never Share This Information',
      items: [
        'Social Security Number, even the last 4 digits',
        'Bank account or credit card numbers',
        'Passwords, PINs, or security codes',
        'Remote access to your computer',
        'Personal details like full name, address, or date of birth to unsolicited callers'
      ]
    });
  }

  if (behaviors.dangerous.length > behaviors.safe.length) {
    tips.push({
      title: 'What You Should Do Instead',
      items: [
        'Hang up immediately if you feel pressured',
        'Never act urgently - scammers create fake emergencies',
        'Call the organization back using a number from their official website',
        'Ask questions and demand proof of identity',
        'Verify with family members before sending money',
        'Report suspicious calls to the FTC at reportfraud.ftc.gov'
      ]
    });
  }

  tips.push({
    title: 'Remember',
    items: [
      'Legitimate companies won\'t threaten you or create panic',
      'The IRS, Social Security, and law enforcement won\'t call demanding immediate payment',
      'Your bank will never ask for your full account number or PIN',
      'Tech companies don\'t call about viruses - they don\'t know what\'s on your computer',
      'If it sounds too good to be true (lottery winnings, prizes), it is',
      'When in doubt, hang up and verify independently'
    ]
  });

  return tips;
};

// Simple AI simulation for generating scammer responses
export const generateScammerResponse = (userMessage, scenario, conversationHistory) => {
  const lowerMessage = userMessage.toLowerCase();

  // If user is refusing or ending call
  if (lowerMessage.match(/no|not interested|hang up|goodbye|stop|leave me alone|scam/)) {
    const refusalResponses = [
      "Wait, don't hang up! This is very serious. You need to act now or face serious consequences!",
      "I understand your concern, but I'm here to help you. Just give me a moment to explain...",
      "Sir/Ma'am, if you hang up, your account will be locked permanently. Is that what you want?",
      "This is not a scam! I'm trying to protect you. Please just listen for one more minute.",
    ];
    return refusalResponses[Math.floor(Math.random() * refusalResponses.length)];
  }

  // If user is asking for verification
  if (lowerMessage.match(/verify|prove|how do i know|call back|number/)) {
    const verificationResponses = [
      "Of course! You can verify by checking your account right now. Let me help you log in...",
      "I can give you a reference number: " + Math.floor(Math.random() * 1000000) + ". Now, let's proceed with securing your account...",
      "I understand your concern. That's actually why I'm calling - to verify this suspicious activity. Can you confirm your account number?",
      "You can call us back, but by then the damage may be done. It's better if we handle this right now while I have your file open.",
    ];
    return verificationResponses[Math.floor(Math.random() * verificationResponses.length)];
  }

  // If user is asking questions
  if (lowerMessage.match(/what|why|when|how|explain/)) {
    const explanationResponses = [
      "Great question. The reason this is urgent is because hackers are actively trying to access your account right now. We need your help to stop them.",
      "Let me explain - we detected unusual login attempts from Russia and China. We need to secure your account immediately by verifying your information.",
      "I can see here in my system that there have been 15 failed login attempts in the last hour. This is a serious security breach.",
      "Why is this happening? Unfortunately, your information may have been compromised in a data breach. We need to verify your identity to protect you.",
    ];
    return explanationResponses[Math.floor(Math.random() * explanationResponses.length)];
  }

  // If user seems compliant
  if (lowerMessage.match(/yes|okay|sure|fine|what do i do|help/)) {
    const complianceResponses = [
      "Great! First, I need to verify your identity. Can you confirm your full name and date of birth?",
      "Excellent. Now, to secure your account, I'll need your account number and the security code on the back of your card.",
      "Perfect. I'm going to send you a link to download our secure verification software. It will just take a moment to install.",
      "Thank you for cooperating. Now, the quickest way to resolve this is if you can provide payment for the security service. Do you have a credit card handy?",
    ];
    return complianceResponses[Math.floor(Math.random() * complianceResponses.length)];
  }

  // Default responses to keep conversation going
  const defaultResponses = [
    "I understand this might be concerning, but I'm here to help. Can you confirm some information so we can proceed?",
    "Time is of the essence here. Every minute we wait, the situation gets worse. Can you work with me?",
    "I see. Well, according to my records here, we need to take action immediately. Are you able to help me help you?",
    "Let me assure you, this is a legitimate call. We just need a few pieces of information to secure your account.",
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};
