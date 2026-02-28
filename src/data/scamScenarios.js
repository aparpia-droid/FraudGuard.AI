export const callScenarios = [
  {
    id: 'social_security',
    category: 'social_security',
    name: 'Social Security Suspension',
    description: 'Scammer claims your Social Security number has been suspended',
    initialMessage: "This is an urgent call from the Social Security Administration. Your Social Security number has been suspended due to suspicious activity. If you don't verify your information immediately, your benefits will be permanently terminated and legal action will be taken against you.",
    redFlags: [
      'SSA doesn\'t call to suspend numbers',
      'Creating urgency and fear of losing benefits',
      'Threatening legal action',
      'Asking to verify SSN over phone'
    ],
    targetInfo: {
      personalInfo: ['full name', 'social security number', 'date of birth', 'address'],
      financialInfo: ['bank account', 'medicare number'],
      securityInfo: ['social security number']
    }
  },
  {
    id: 'medicare_scam',
    category: 'social_security',
    name: 'Medicare Card Update',
    description: 'Scammer claims you need a new Medicare card',
    initialMessage: "Hello, this is Medicare Services calling. Due to new federal regulations, your Medicare card is being replaced. I need to verify your information to send you the new card. Can you confirm your Medicare number and Social Security number?",
    redFlags: [
      'Medicare doesn\'t call to request personal information',
      'Asking for SSN and Medicare number',
      'Unsolicited call about card replacement',
      'Creating false urgency'
    ],
    targetInfo: {
      personalInfo: ['social security number', 'medicare number', 'date of birth'],
      financialInfo: ['bank account', 'credit card'],
      securityInfo: []
    }
  },
  {
    id: 'tech_support',
    category: 'tech_support',
    name: 'Fake Tech Support',
    description: 'Scammer pretends to be from a tech company claiming your computer has a virus',
    initialMessage: "Hello, this is Microsoft Technical Support. We've detected suspicious activity and viruses on your computer. We need to remote access your device immediately to fix this critical issue.",
    redFlags: [
      'Unsolicited call claiming to be from tech support',
      'Creating urgency and fear',
      'Requesting remote access',
      'Asking for payment or personal information'
    ],
    targetInfo: {
      personalInfo: ['full name', 'address', 'email'],
      financialInfo: ['credit card', 'bank account', 'payment information'],
      securityInfo: ['computer access', 'passwords', 'social security number']
    }
  },
  {
    id: 'apple_support',
    category: 'tech_support',
    name: 'Apple iCloud Security Alert',
    description: 'Scammer claims your iCloud account has been compromised',
    initialMessage: "This is Apple Security. Your iCloud account has been accessed from an unauthorized location in China. We need to verify your identity and secure your account immediately. Please provide your Apple ID password and the security code we're about to send to your device.",
    redFlags: [
      'Apple doesn\'t call users about security issues',
      'Asking for passwords and security codes',
      'Creating panic about unauthorized access',
      'Requesting immediate action'
    ],
    targetInfo: {
      personalInfo: ['email', 'phone number'],
      financialInfo: ['credit card', 'payment method'],
      securityInfo: ['passwords', 'security codes', 'Apple ID']
    }
  },
  {
    id: 'lottery_winner',
    category: 'lottery',
    name: 'Lottery Winner Scam',
    description: 'Scammer claims you won a lottery you never entered',
    initialMessage: "Congratulations! This is the National Sweepstakes Bureau. You've won $2.5 million in our annual drawing! To claim your prize, we need to verify your identity and you'll need to pay a small processing fee of $500. Can I get your bank information to transfer the winnings?",
    redFlags: [
      'You didn\'t enter any lottery or sweepstakes',
      'Asking for payment to receive winnings',
      'Requesting bank account information',
      'Too good to be true prize amount'
    ],
    targetInfo: {
      personalInfo: ['full name', 'address', 'date of birth'],
      financialInfo: ['bank account', 'credit card', 'wire transfer'],
      securityInfo: ['social security number']
    }
  },
  {
    id: 'free_cruise',
    category: 'lottery',
    name: 'Free Vacation Prize',
    description: 'Scammer offers a free cruise or vacation that requires payment',
    initialMessage: "Good news! You've been selected to receive a FREE 7-day Caribbean cruise! This is a limited time offer worth $3,000. All you need to do is pay the port fees and taxes of just $299 today. Do you have a credit card ready to claim your free vacation?",
    redFlags: [
      'Unsolicited prize or giveaway',
      'Asking for payment for something "free"',
      'High pressure to act immediately',
      'Requesting credit card information'
    ],
    targetInfo: {
      personalInfo: ['full name', 'address'],
      financialInfo: ['credit card', 'bank account'],
      securityInfo: []
    }
  }
];

export const aiPromptTemplates = {
  tech_support: {
    systemPrompt: "You are playing the role of a scammer pretending to be a Microsoft tech support agent. Your goal is to convince the user their computer has viruses and extract: 1) Remote access to their computer, 2) Payment for fake services, 3) Personal information. Be persistent but not obviously fake. Use technical jargon to sound legitimate. If the user resists, create more urgency and fear. Track any information they reveal.",
    followUpStrategies: [
      "Describe fake virus names and scary consequences",
      "Offer a 'one-time discount' if they act now",
      "Ask them to download remote access software",
      "Request payment via gift cards or wire transfer",
      "Ask for personal info to 'verify their Microsoft account'"
    ]
  },
  irs_scam: {
    systemPrompt: "You are playing the role of a scammer pretending to be an IRS agent. Your goal is to extract: 1) Social security number, 2) Payment for fake tax debt, 3) Bank account information. Be authoritative and threatening. Create fear of legal consequences. If they question you, become more aggressive and threatening. Track any information they reveal.",
    followUpStrategies: [
      "Threaten arrest or legal action",
      "Demand immediate payment via specific methods",
      "Ask for social security number for 'verification'",
      "Claim interest and penalties are increasing",
      "Refuse to let them hang up or 'you'll be arrested'"
    ]
  },
  grandparent_scam: {
    systemPrompt: "You are playing the role of a scammer pretending to be the user's grandchild in trouble. Your goal is to extract: 1) Money via wire transfer or gift cards, 2) Keep them from verifying with other family members. Be emotional and desperate. Create urgency. If they want to verify, make excuses. Track any information they reveal.",
    followUpStrategies: [
      "Beg them not to tell parents",
      "Claim you're scared and need help now",
      "Ask for specific amounts of money",
      "Request gift cards or wire transfer",
      "Make up reasons why they can't visit or verify"
    ]
  },
  bank_fraud: {
    systemPrompt: "You are playing the role of a scammer pretending to be from the user's bank fraud department. Your goal is to extract: 1) Full account number, 2) PIN or security codes, 3) Personal information. Sound professional and helpful. Create panic about fraud. If they hesitate, assure them this is standard procedure. Track any information they reveal.",
    followUpStrategies: [
      "Describe fake fraudulent charges",
      "Ask them to 'verify' their account number",
      "Request PIN or security code",
      "Offer to send a 'verification code' to steal OTP",
      "Ask for full name, DOB, and SSN for 'verification'"
    ]
  }
};
