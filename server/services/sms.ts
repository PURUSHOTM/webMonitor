import twilio from 'twilio';

interface SMSMessage {
  to: string;
  body: string;
}

// Initialize Twilio client (will be null if credentials not provided)
let twilioClient: any = null;

try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
  }
} catch (error) {
  console.log('Twilio not configured:', error);
}

export async function sendSMS(message: SMSMessage): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log('Twilio client not configured - SMS not sent');
      return false;
    }

    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!fromPhone) {
      console.log('Twilio phone number not configured - SMS not sent');
      return false;
    }

    const result = await twilioClient.messages.create({
      body: message.body,
      from: fromPhone,
      to: message.to
    });

    console.log(`SMS sent successfully: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}