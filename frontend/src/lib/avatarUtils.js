// Function to generate initials from a name
export const getInitials = (name) => {
  if (!name) return '??';
  
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  } else if (names[0].length > 1) {
    initials += names[0].substring(1, 2).toUpperCase();
  }
  
  return initials;
};

// Function to generate a random background color based on name
// Uses DaisyUI color palette for theme consistency
export const getAvatarColor = (name) => {
  if (!name) return 'hsl(var(--p))'; // Default to primary color
  
  // Generate a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use DaisyUI color variables for consistent theming
  const colorOptions = [
    'hsl(var(--p))',     // primary
    'hsl(var(--s))',     // secondary  
    'hsl(var(--a))',     // accent
    'hsl(var(--in))',    // info
    'hsl(var(--su))',    // success
    'hsl(var(--wa))',    // warning
    'hsl(var(--er))',    // error
  ];
  
  const colorIndex = Math.abs(hash) % colorOptions.length;
  return colorOptions[colorIndex];
};

// Function to generate avatar SVG with initials
export const generateAvatarSVG = (name, size = 40) => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size/2}" fill="${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="${size/2.5}" fill="hsl(var(--pc))" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `.trim();
};

// Function to generate a data URL for avatar SVG (can be used as img src)
export const generateAvatarDataURL = (name, size = 40) => {
  const svg = generateAvatarSVG(name, size);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Function to check if an avatar URL is valid (not a fallback)
export const isValidAvatarURL = (url) => {
  return url && url !== '/avatar.png' && url !== 'avatar.png' && url.trim() !== '';
};

// Function to get the best avatar source (image URL or generated)
export const getAvatarSource = (profilePic, name, size = 40) => {
  if (isValidAvatarURL(profilePic)) {
    return profilePic;
  }
  return generateAvatarDataURL(name, size);
};