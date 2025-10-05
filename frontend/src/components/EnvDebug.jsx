// Debug component to check environment variables
function EnvDebug() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (import.meta.env.DEV) {
    return (
      <div className="fixed bottom-4 right-4 bg-base-200 p-2 rounded text-xs opacity-50 hover:opacity-100 transition-opacity">
        <div>Google Client ID: {clientId ? '✅ Set' : '❌ Missing'}</div>
        <div>Mode: {import.meta.env.MODE}</div>
      </div>
    );
  }
  
  return null;
}

export default EnvDebug;