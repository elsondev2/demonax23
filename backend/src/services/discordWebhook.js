import axios from 'axios';

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1427968178893623379/KRQTpbuGP5W8f4qGba1Yu1GBk-uohZ5nBEvGXqejVsIv_hsADid48rMJKZx24-b7vPvt';

/**
 * Send a feature request notification to Discord
 * @param {Object} featureRequest - The feature request object
 * @returns {Promise<Object>} Discord API response
 */
export const sendFeatureRequestNotification = async (featureRequest) => {
  try {
    // Color coding based on category
    const categoryColors = {
      'bug': 15158332,      // Red
      'feature': 3447003,   // Blue
      'improvement': 10181046, // Purple
      'ui': 16776960       // Yellow
    };

    const embedColor = categoryColors[featureRequest.category] || 3447003;

    // Format the Discord message
    const discordMessage = {
      embeds: [{
        title: `🚀 New Feature Request`,
        color: embedColor,
        fields: [
          {
            name: '📝 Title',
            value: featureRequest.title,
            inline: false
          },
          {
            name: '🏷️ Category',
            value: getCategoryDisplayName(featureRequest.category),
            inline: true
          },
          {
            name: '📊 Status',
            value: '🆕 Pending Review',
            inline: true
          },
          {
            name: '👤 Submitted By',
            value: featureRequest.submittedBy ?
              `[User](${process.env.CLIENT_URL || 'http://localhost:5173'})` :
              'Anonymous',
            inline: true
          },
          {
            name: '📄 Description',
            value: featureRequest.description.length > 1000 ?
              featureRequest.description.substring(0, 1000) + '...' :
              featureRequest.description,
            inline: false
          },
          {
            name: '🗳️ Current Votes',
            value: `👍 ${featureRequest.upvotes || 0} | 👎 ${featureRequest.downvotes || 0}`,
            inline: true
          },
          {
            name: '🏆 Score',
            value: `${featureRequest.upvotes - featureRequest.downvotes}`,
            inline: true
          }
        ],
        footer: {
          text: 'Feature Request System',
          icon_url: 'https://cdn.discordapp.com/emojis/1025356443197161502.webp?size=96&quality=lossless'
        },
        timestamp: featureRequest.createdAt,
        url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/feature-requests/${featureRequest._id}`
      }]
    };

    // Send to Discord
    const response = await axios.post(DISCORD_WEBHOOK_URL, discordMessage, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('Discord notification sent successfully:', response.data);
    return response.data;

  } catch (error) {
    console.error('Failed to send Discord notification:', error.response?.data || error.message);

    // Don't throw error - we don't want webhook failures to break the feature request submission
    return { error: error.message };
  }
};

/**
 * Send a vote update notification to Discord
 * @param {Object} featureRequest - The updated feature request
 * @param {string} voteType - 'up' or 'down'
 * @param {number} newScore - The new vote score
 */
export const sendVoteUpdateNotification = async (featureRequest, voteType, newScore) => {
  try {
    // Only send notifications for significant vote milestones
    if (newScore < 5 && featureRequest.upvotes < 10) {
      return; // Don't spam Discord with minor vote changes
    }

    const embed = {
      title: `🗳️ Feature Request Update`,
      color: voteType === 'up' ? 5763719 : 15548997, // Green for upvotes, red for downvotes
      fields: [
        {
          name: '📝 Request',
          value: featureRequest.title,
          inline: false
        },
        {
          name: '🗳️ New Vote',
          value: voteType === 'up' ? '👍 Upvote' : '👎 Downvote',
          inline: true
        },
        {
          name: '📊 Current Score',
          value: `👍 ${featureRequest.upvotes} | 👎 ${featureRequest.downvotes} | 🏆 ${newScore}`,
          inline: true
        }
      ],
      footer: {
        text: 'Vote Update'
      },
      timestamp: new Date()
    };

    // Add milestone message for significant votes
    if (newScore >= 10) {
      embed.description = `🎉 This request has reached ${newScore} points!`;
    }

    await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

  } catch (error) {
    console.error('Failed to send vote update to Discord:', error.message);
    // Don't throw - non-critical feature
  }
};

/**
 * Send status update notification
 * @param {Object} featureRequest - The feature request with updated status
 * @param {string} oldStatus - Previous status
 */
export const sendStatusUpdateNotification = async (featureRequest, oldStatus) => {
  try {
    const statusEmojis = {
      'pending': '⏳',
      'reviewing': '🔍',
      'approved': '✅',
      'rejected': '❌',
      'implemented': '🚀'
    };

    const statusColors = {
      'pending': 16776960,     // Yellow
      'reviewing': 3447003,    // Blue
      'approved': 5763719,     // Green
      'rejected': 15548997,    // Red
      'implemented': 10181046  // Purple
    };

    const embed = {
      title: `📋 Feature Request Status Updated`,
      color: statusColors[featureRequest.status] || 3447003,
      fields: [
        {
          name: '📝 Request',
          value: featureRequest.title,
          inline: false
        },
        {
          name: '🔄 Status Change',
          value: `${statusEmojis[oldStatus] || '❓'} **${oldStatus}** → ${statusEmojis[featureRequest.status]} **${featureRequest.status}**`,
          inline: false
        },
        {
          name: '🗳️ Current Votes',
          value: `👍 ${featureRequest.upvotes} | 👎 ${featureRequest.downvotes} | 🏆 ${featureRequest.upvotes - featureRequest.downvotes}`,
          inline: true
        }
      ],
      footer: {
        text: 'Status Update'
      },
      timestamp: new Date()
    };

    await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

  } catch (error) {
    console.error('Failed to send status update to Discord:', error.message);
  }
};

/**
 * Get category display name
 * @param {string} category - Category ID
 * @returns {string} Display name
 */
function getCategoryDisplayName(category) {
  const displayNames = {
    'ui': '🎨 UI/UX',
    'feature': '✨ New Feature',
    'improvement': '📈 Improvement',
    'bug': '🐛 Bug Fix'
  };

  return displayNames[category] || category;
}

/**
 * Validate Discord webhook URL format
 * @param {string} url - Webhook URL to validate
 * @returns {boolean} True if valid format
 */
export const validateWebhookUrl = (url) => {
  const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
  return webhookRegex.test(url);
};