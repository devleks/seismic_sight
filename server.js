import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cloud Run sets the PORT environment variable. Default to 8080 if not set.
const PORT = process.env.PORT || 8080;

// Serve the static files from the React build directory (dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA Fallback: Any request that doesn't match a static file should return index.html
// This allows React Router to handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server is running on port ${PORT}`);
});
