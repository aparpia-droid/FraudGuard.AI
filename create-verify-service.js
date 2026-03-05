require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function createVerifyService() {
  try {
    console.log('Creating Twilio Verify Service...');

    const service = await client.verify.v2.services.create({
      friendlyName: 'FraudGuard Verification'
    });

    console.log('\n✅ Verify Service Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Service SID:', service.sid);
    console.log('Service Name:', service.friendlyName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Add this to your .env file:');
    console.log(`TWILIO_VERIFY_SERVICE_SID=${service.sid}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error creating Verify Service:');
    console.error(error.message);

    if (error.code === 20003) {
      console.log('\n💡 Tip: Make sure your Twilio credentials are correct in .env');
    }
  }
}

createVerifyService();
