import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { ENV } from '../lib/env.js';

// Generate Agora RTC token
export const generateToken = async (req, res) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    const appId = ENV.AGORA_APP_ID;
    const appCertificate = ENV.AGORA_APP_CERTIFICATE;

    // If no app certificate, return null token (static key mode)
    if (!appCertificate) {
      return res.json({ token: null });
    }

    // Token expiration time (24 hours)
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use uid 0 if not provided (Agora will assign one)
    const uidNumber = uid ? parseInt(uid) : 0;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uidNumber,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({ token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ message: 'Failed to generate token' });
  }
};
