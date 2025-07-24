var admin = require("firebase-admin");

var serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
