const path = require('path');
require('dotenv').config(); // Load environment variables

const environment = process.env.NODE_ENV || 'development'; // Get the environment or default to 'development'

// Define configurations for both environments
const configs = {
    development: {
        https: false, // No HTTPS for development
        port: 3000, // Local development port
        httpsOptions: {
            key: null,
            cert: null
        }
    },
    production: {
        https: true, // HTTPS for production
        port: 443, // HTTPS port for production
        httpsOptions: {
            key: path.resolve('/etc/letsencrypt/live/dsf.vitagliano.dk/privkey.pem'), // Path to Let's Encrypt private key
            cert: path.resolve('/etc/letsencrypt/live/dsf.vitagliano.dk/fullchain.pem') // Path to Let's Encrypt full chain certificate
        },
        httpRedirectPort: 80 // Redirect HTTP traffic to HTTPS
    }
};

// Export the configuration based on the environment
module.exports = configs[environment];
