/**
 * Discord Webhook Service
 * Handles sending enhanced announcements to Discord via webhook
 */

import User from '../models/User.js';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1427628493843337236/Or_RO5u-nIboDUN-IcreBF7ZaspeOoo0z4N2GPe8YoP_1jjFVXcR5UYXeQOxI5HRd9_o';

/**
 * Sends a formatted Discord message via webhook
 * @param {Object} announcement - The announcement object
 * @param {string} announcement.title - Announcement title
 * @param {string} announcement.content - Announcement content
 * @param {string} announcement.priority - Announcement priority (normal, high, urgent)
 * @param {Object} announcement.createdBy - User reference for author info
 * @param {Date} announcement.createdAt - Creation timestamp
 * @param {Date} announcement.updatedAt - Update timestamp
 * @param {boolean} isEdit - Whether this is an edited announcement
 * @returns {Promise<boolean>} - Returns true if successful, false if failed
 */
export const sendDiscordWebhook = async (announcement, isEdit = false) => {
  try {
    // Get author information
    const author = await User.findById(announcement.createdBy).select('username email');
    const authorName = author ? author.username : 'Unknown User';

    // Create enhanced Discord embed with improved layout
    const embed = {
      title: `${getPriorityEmoji(announcement.priority)} ${announcement.title}`,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/announcements`,
      description: formatAnnouncementContent(announcement.content),
      color: getPriorityColor(announcement.priority),
      fields: [
        {
          name: `${getStatusEmoji(isEdit)} ${isEdit ? '📝 ANNOUNCEMENT UPDATED' : '🆕 NEW ANNOUNCEMENT'}`,
          value: `**Priority Level:** ${getPriorityDisplayName(announcement.priority)}\n**Published by:** ${authorName}\n**Administrator:** System Control Center`,
          inline: false
        },
        {
          name: '📅 Publication Timeline',
          value: `**📝 Created:** <t:${Math.floor(new Date(announcement.createdAt).getTime() / 1000)}:F>\n**${isEdit ? '🔄 Last Modified' : '📢 Published'}:** <t:${Math.floor(new Date(announcement.updatedAt || announcement.createdAt).getTime() / 1000)}:R>`,
          inline: true
        },
        {
          name: '🏷️ System Information',
          value: `**Announcement ID:** \`${announcement._id}\`\n**Message Type:** ${isEdit ? '📝 Content Update' : '📰 New Publication'}\n**Status:** ✅ Live & Active`,
          inline: true
        }
      ],
      author: {
        name: '🚀 V8 System Administration Center',
        icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}`
      },
      thumbnail: {
        url: getPriorityThumbnail(announcement.priority)
      },
      image: announcement.bannerImage ? {
        url: announcement.bannerImage
      } : announcement.content.length > 500 ? {
        url: 'https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=Important+System+Announcement'
      } : null,
      timestamp: new Date(announcement.updatedAt || announcement.createdAt).toISOString(),
      footer: {
        text: `🚀 V8 System Administration • ${isEdit ? 'Content Updated' : 'New Release Published'} • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
      }
    };

    // Add action buttons for important announcements
    if (announcement.priority === 'urgent' || announcement.priority === 'high') {
      embed.fields.push({
        name: '⚡ Actions Required',
        value: 'Please review this announcement and take appropriate action.\n[View Full Details](' + `${process.env.FRONTEND_URL || 'http://localhost:3000'}/announcements` + ')',
        inline: false
      });
    }

    // Prepare webhook payload with enhanced branding
    const payload = {
      embeds: [embed],
      username: 'V8 Announcement System',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      components: getAnnouncementButtons(announcement.priority, isEdit)
    };

    // Send webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Enhanced Discord webhook sent successfully for announcement:', announcement.title);
    return true;

  } catch (error) {
    console.error('Error sending Discord webhook:', error.message);
    return false;
  }
};

/**
 * Gets Discord embed color based on priority with enhanced color palette
 * @param {string} priority - Announcement priority
 * @returns {number} - Discord color code
 */
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent':
      return 15548997; // Bright red for urgency
    case 'high':
      return 16744272; // Orange for importance
    case 'normal':
    default:
      return 5814783; // Professional blue
  }
};

/**
 * Gets priority emoji indicator
 * @param {string} priority - Announcement priority
 * @returns {string} - Priority emoji
 */
const getPriorityEmoji = (priority) => {
  switch (priority) {
    case 'urgent':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'normal':
    default:
      return '📢';
  }
};

/**
 * Gets status emoji for new vs edited announcements
 * @param {boolean} isEdit - Whether this is an edited announcement
 * @returns {string} - Status emoji
 */
const getStatusEmoji = (isEdit) => {
  return isEdit ? '✏️' : '🆕';
};

/**
 * Gets display name for priority with enhanced formatting
 * @param {string} priority - Announcement priority
 * @returns {string} - Formatted priority name
 */
const getPriorityDisplayName = (priority) => {
  switch (priority) {
    case 'urgent':
      return '🚨 **URGENT** - Immediate Action Required';
    case 'high':
      return '⚠️ **HIGH** - Please Review';
    case 'normal':
    default:
      return '📢 **NORMAL** - Information';
  }
};

/**
 * Gets thumbnail URL based on priority
 * @param {string} priority - Announcement priority
 * @returns {string} - Thumbnail URL
 */
const getPriorityThumbnail = (priority) => {
  const thumbnails = {
    urgent: 'https://cdn.discordapp.com/emojis/1025950574434967602.webp?size=96&quality=lossless',
    high: 'https://cdn.discordapp.com/emojis/1025950574434967602.webp?size=96&quality=lossless',
    normal: 'https://cdn.discordapp.com/emojis/1025950574434967602.webp?size=96&quality=lossless'
  };
  return thumbnails[priority] || 'https://cdn.discordapp.com/embed/avatars/0.png';
};

/**
 * Formats announcement content for better Discord display
 * @param {string} content - Raw announcement content
 * @returns {string} - Formatted content
 */
const formatAnnouncementContent = (content) => {
  if (!content) return '*No content provided*';

  // Truncate if too long but preserve word boundaries
  const maxLength = 1900; // Leave room for other content
  let formattedContent = content;

  if (content.length > maxLength) {
    formattedContent = content.substring(0, maxLength);
    const lastSpace = formattedContent.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      formattedContent = formattedContent.substring(0, lastSpace);
    }
    formattedContent += '...';
  }

  // Add some basic formatting enhancements
  formattedContent = formattedContent
    .replace(/\*\*(.*?)\*\*/g, '***$1***') // Make bold text more prominent
    .replace(/\*(.*?)\*/g, '_$1_') // Convert italics to underline for Discord
    .replace(/`(.*?)`/g, '`$1`'); // Ensure code blocks are preserved

  return formattedContent;
};

/**
 * Gets action buttons for interactive announcements
 * @param {string} priority - Announcement priority
 * @param {boolean} isEdit - Whether this is an edited announcement
 * @returns {Array} - Discord action components
 */
const getAnnouncementButtons = (priority, isEdit) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (priority === 'urgent') {
    return [{
      type: 1,
      components: [
        {
          type: 2,
          style: 4, // Danger red button
          label: '🚨 View Urgent Announcement',
          url: `${baseUrl}/announcements`
        }
      ]
    }];
  } else if (priority === 'high') {
    return [{
      type: 1,
      components: [
        {
          type: 2,
          style: 1, // Primary blue button
          label: '⚠️ Review Important Update',
          url: `${baseUrl}/announcements`
        }
      ]
    }];
  }

  return [];
};
