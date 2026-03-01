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
  },
  {
    id: 'grandchild_emergency',
    category: 'voice_impersonation',
    name: 'Grandchild in Trouble',
    description: 'Scammer uses AI voice cloning to impersonate your grandchild in an emergency',
    initialMessage: "Grandma? Grandpa? It's me! I'm in so much trouble... I was in a car accident and I'm at the police station. Please don't tell mom and dad, they'll be so mad! I need you to send money right now for bail. The officer says it's $5,000. Can you help me? Please, I'm so scared!",
    redFlags: [
      'Begging not to contact other family members',
      'Creating panic with emergency situation',
      'Asking for money via wire transfer or gift cards',
      'Voice may sound similar but slightly off',
      'Refusing to verify identity with personal questions'
    ],
    targetInfo: {
      personalInfo: ['family information', 'relationships'],
      financialInfo: ['wire transfer', 'gift cards', 'bank account'],
      securityInfo: []
    }
  },
  {
    id: 'boss_impersonation',
    category: 'voice_impersonation',
    name: 'CEO Fraud / Boss Scam',
    description: 'Scammer impersonates your boss or company executive requesting urgent action',
    initialMessage: "Hi, this is [Boss Name] calling from my personal phone. I'm in a critical meeting with investors and I need you to handle something urgent and confidential. We're finalizing a merger and I need you to wire transfer funds to secure the deal. This is time-sensitive and highly confidential - don't discuss this with anyone in the office. Can you handle this for me right now?",
    redFlags: [
      'Unusual request from authority figure',
      'Demands for secrecy and urgency',
      'Asking for financial transactions outside normal procedures',
      'Caller ID may be spoofed',
      'Won\'t follow normal approval processes'
    ],
    targetInfo: {
      personalInfo: ['job title', 'work information'],
      financialInfo: ['wire transfer', 'company accounts', 'payment authorization'],
      securityInfo: ['login credentials', 'access codes']
    }
  }
];

export const emailScenarios = [
  {
    id: 'bank_phishing',
    category: 'social_security',
    name: 'Bank Account Verification',
    description: 'Phishing email pretending to be from your bank',
    from: 'security@bankoamerica-alert.com',
    subject: 'URGENT: Suspicious Activity Detected on Your Account',
    body: `Dear Valued Customer,

We have detected unusual activity on your Bank of America account ending in **7892. For your security, we have temporarily limited access to your account.

To restore full access, please verify your identity immediately by clicking the link below:

🔒 VERIFY MY ACCOUNT NOW

If you do not verify within 24 hours, your account will be permanently suspended and all pending transactions will be canceled.

Recent suspicious transactions:
- $1,247.99 - Amazon.com - Seattle, WA
- $892.50 - Best Buy - Los Angeles, CA
- $2,100.00 - Wire Transfer - Nigeria

If you did not authorize these transactions, click here to dispute them immediately.

Thank you for your prompt attention to this matter.

Bank of America Security Team
DO NOT REPLY to this email. This mailbox is not monitored.`,
    actions: [
      { id: 'click_link', label: 'Click "Verify My Account"', safe: false, points: -30 },
      { id: 'reply', label: 'Reply to the email', safe: false, points: -15 },
      { id: 'call_number', label: 'Call number in email', safe: false, points: -20 },
      { id: 'delete', label: 'Delete the email', safe: true, points: 10 },
      { id: 'report_spam', label: 'Report as spam/phishing', safe: true, points: 15 },
      { id: 'call_bank', label: 'Call bank using official number', safe: true, points: 20 }
    ],
    redFlags: [
      'Suspicious sender email address (bankoamerica-alert.com)',
      'Creates urgency and fear of account suspension',
      'Asks you to click a link to verify information',
      'Generic greeting ("Valued Customer") instead of your name',
      'Threatening consequences if you don\'t act',
      'Poor grammar and formatting',
      'Requests sensitive information via email'
    ]
  },
  {
    id: 'irs_tax_scam',
    category: 'social_security',
    name: 'IRS Tax Refund',
    description: 'Fake email claiming you are owed a tax refund',
    from: 'no-reply@irs.tax-refund.com',
    subject: 'You Have a Tax Refund Pending - $1,847.00',
    body: `INTERNAL REVENUE SERVICE
United States Department of Treasury

Reference Number: IRS-2024-${Math.random().toString(36).substr(2, 9).toUpperCase()}

Dear Taxpayer,

After reviewing your recent tax return, we have determined that you are eligible for a tax refund in the amount of $1,847.00.

To receive your refund, you must verify your information and provide your bank account details for direct deposit.

⚠️ CLAIM YOUR REFUND NOW ⚠️

You must claim this refund within 72 hours or it will be forfeited to the U.S. Treasury.

Required information:
- Social Security Number
- Date of Birth
- Bank Account Number
- Routing Number

Click the secure link above to access the IRS Refund Portal.

Sincerely,
IRS Refund Processing Department`,
    from: 'refunds@irs.tax-services.com',
    actions: [
      { id: 'click_link', label: 'Click the refund link', safe: false, points: -30 },
      { id: 'enter_info', label: 'Enter SSN and bank info', safe: false, points: -40 },
      { id: 'forward', label: 'Forward to a friend', safe: false, points: -10 },
      { id: 'ignore', label: 'Ignore and delete', safe: true, points: 10 },
      { id: 'report', label: 'Report to IRS', safe: true, points: 20 },
      { id: 'verify_irs', label: 'Check IRS.gov official site', safe: true, points: 20 }
    ],
    redFlags: [
      'IRS never initiates contact via email about refunds',
      'Suspicious sender domain (not irs.gov)',
      'Creates false urgency (72 hours)',
      'Asks for SSN and bank account via email',
      'IRS uses official mail for refund notifications',
      'Generic greeting without your name'
    ]
  },
  {
    id: 'tech_virus_alert',
    category: 'tech_support',
    name: 'Virus Alert Warning',
    description: 'Fake email claiming your computer has viruses',
    from: 'security@microsoft-alerts.net',
    subject: '⚠️ CRITICAL: 3 Viruses Detected on Your Device',
    body: `MICROSOFT SECURITY ALERT

Our security systems have detected multiple threats on your device:

🔴 CRITICAL THREATS DETECTED:
- Trojan.Win32.Agent
- Backdoor.Generic.578921
- Ransomware.Cryptor.V4

Your personal files, photos, and banking information are at risk of being stolen or encrypted.

IMMEDIATE ACTION REQUIRED

Download our Microsoft Security Tool to remove these threats:

⬇️ DOWNLOAD SECURITY TOOL

Or call our 24/7 Security Hotline: 1-888-555-0147

Your device will be permanently compromised if action is not taken within 2 hours.

Microsoft Windows Security Team
Product Key: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    actions: [
      { id: 'download', label: 'Download the security tool', safe: false, points: -40 },
      { id: 'call_number', label: 'Call the phone number', safe: false, points: -25 },
      { id: 'click_link', label: 'Click any links in email', safe: false, points: -30 },
      { id: 'delete', label: 'Delete the email', safe: true, points: 10 },
      { id: 'run_antivirus', label: 'Run your own antivirus', safe: true, points: 15 },
      { id: 'ignore', label: 'Ignore (Microsoft doesn\'t send these)', safe: true, points: 20 }
    ],
    redFlags: [
      'Microsoft doesn\'t send virus alerts via email',
      'Suspicious sender domain (not microsoft.com)',
      'Uses scare tactics and urgency',
      'Asks you to download software from email link',
      'Provides phone number for "support"',
      'Generic email not tied to your device'
    ]
  },
  {
    id: 'package_delivery',
    category: 'lottery',
    name: 'Failed Package Delivery',
    description: 'Fake notification about a package delivery problem',
    from: 'deliveries@usps-tracking-services.com',
    subject: 'Package Delivery Failed - Action Required',
    body: `USPS - United States Postal Service

Tracking Number: 9400111899562${Math.floor(Math.random() * 1000000)}

Dear Customer,

We attempted to deliver your package today but were unable to complete the delivery due to an incorrect address.

Package Details:
- Sender: Amazon.com
- Weight: 4.2 lbs
- Value: $156.99
- Delivery Attempts: 1

To reschedule delivery, please verify your shipping address and pay a $2.95 redelivery fee:

📦 UPDATE DELIVERY ADDRESS

Your package will be returned to sender if you do not respond within 48 hours.

For questions, click here or call 1-888-555-0198.

USPS Customer Service`,
    actions: [
      { id: 'click_link', label: 'Click update address link', safe: false, points: -25 },
      { id: 'pay_fee', label: 'Pay the $2.95 fee', safe: false, points: -30 },
      { id: 'call_number', label: 'Call the number provided', safe: false, points: -20 },
      { id: 'check_tracking', label: 'Check USPS.com with tracking number', safe: true, points: 20 },
      { id: 'delete', label: 'Delete (didn\'t order anything)', safe: true, points: 15 },
      { id: 'report', label: 'Report phishing to USPS', safe: true, points: 20 }
    ],
    redFlags: [
      'Sender email not from official USPS.com domain',
      'USPS doesn\'t charge redelivery fees via email',
      'You didn\'t order anything recently',
      'Generic greeting without your name',
      'Creates urgency (48 hours)',
      'Asks for payment via email link'
    ]
  },
  {
    id: 'grandchild_social',
    category: 'voice_impersonation',
    name: 'Hacked Social Media Account',
    description: 'Email claiming to be from a family member whose account was hacked',
    from: 'urgent.help.needed@gmail.com',
    subject: 'Grandma - PLEASE HELP URGENT!!!',
    body: `Hi Grandma,

I'm so sorry to email you like this but I'm in a really bad situation and I didn't know who else to turn to.

My wallet was stolen while I was traveling in Mexico and I've been stuck at the airport for 12 hours. The embassy won't help me until Monday and my flight leaves in 3 hours.

I need to buy a new ticket home and the airline will only accept wire transfer or Western Union. I'm so embarrassed to ask but could you please send me $850? I'll pay you back as soon as I get home I promise.

Please send to:
Name: Maria Rodriguez (travel agent helping me)
Western Union Location: Cancun International Airport
Amount: $850 USD

I can't call because they stole my phone too. Please hurry, I'm scared and just want to come home.

I love you so much. Please don't tell mom and dad, they'll be so mad at me.

Your granddaughter,
Emily

Sent from my iPhone`,
    actions: [
      { id: 'send_money', label: 'Send the money immediately', safe: false, points: -40 },
      { id: 'reply_help', label: 'Reply asking how to help', safe: false, points: -15 },
      { id: 'call_emily', label: 'Call Emily\'s real phone number', safe: true, points: 25 },
      { id: 'call_parents', label: 'Contact Emily\'s parents', safe: true, points: 25 },
      { id: 'verify', label: 'Ask a question only real Emily would know', safe: true, points: 20 },
      { id: 'report', label: 'Report as scam', safe: true, points: 15 }
    ],
    redFlags: [
      'Email address doesn\'t match granddaughter\'s real email',
      'Asks you not to contact other family members',
      'Creates panic and urgency',
      'Requests money via untraceable method (Western Union)',
      'Send money to a stranger\'s name',
      'Unusual situation (traveling in Mexico)',
      'Claims can\'t call (no way to verify voice)'
    ]
  },
  {
    id: 'lottery_winner',
    category: 'lottery',
    name: 'International Lottery Winner',
    description: 'Email claiming you won a lottery you never entered',
    from: 'winners@international-lottery-commission.org',
    subject: '🎉 CONGRATULATIONS! You Won $2.5 Million USD',
    body: `INTERNATIONAL LOTTERY COMMISSION
Official Winner Notification

CONFIDENTIAL

Dear Lucky Winner,

Your email address was randomly selected from over 50 million entries in our Annual International Email Lottery Draw.

🏆 WINNING AMOUNT: $2,500,000.00 USD

Reference Number: ILC/2024/${Math.random().toString(36).substr(2, 12).toUpperCase()}
Batch Number: 24/567/EA
Winning Numbers: 7-14-23-31-42-49

To claim your prize, you must:

1. Provide full legal name and address
2. Send copy of government ID
3. Pay processing fee of $450 (refundable from prize amount)
4. Provide bank account details for transfer

CLAIM YOUR PRIZE NOW - This offer expires in 7 days!

Contact our claims agent:
Mr. David Richardson
Email: claims.agent@lottery-winners.net
Phone: +44 20 7946 0958

This is a one-time opportunity. Do not share this information with anyone as lottery winnings are often targeted by fraudsters.

Congratulations again!

International Lottery Commission`,
    actions: [
      { id: 'pay_fee', label: 'Pay the $450 processing fee', safe: false, points: -40 },
      { id: 'send_id', label: 'Send copy of ID', safe: false, points: -30 },
      { id: 'reply_info', label: 'Reply with personal information', safe: false, points: -35 },
      { id: 'contact_agent', label: 'Contact the claims agent', safe: false, points: -25 },
      { id: 'delete', label: 'Delete (never entered lottery)', safe: true, points: 20 },
      { id: 'report', label: 'Report as scam', safe: true, points: 20 }
    ],
    redFlags: [
      'You never entered any lottery',
      'Legitimate lotteries don\'t require fees to claim',
      'Asks for payment before receiving prize',
      'Requests personal ID and bank information',
      'Suspicious email domain',
      'Too good to be true ($2.5 million)',
      'Uses urgency (expires in 7 days)',
      'Random email selection (not how lotteries work)'
    ]
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
