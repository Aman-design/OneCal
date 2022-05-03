import 'dotenv/config';

const calComSdk = require('api')(process.env.CAL_API_URL);
export default calComSdk;
