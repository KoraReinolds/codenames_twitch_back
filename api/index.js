const axios = require('axios');
const ownerId = process.env.OWNER_ID

function makeServerToken(user) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 3000,
    channel_id: user.channel_id,
    user_id: ownerId,
    role: 'external',
    pubsub_perms: {
      send: [ "*" ],
    },
  };
  return jsonwebtoken.sign(payload, secret, { algorithm: 'HS256' });
}

module.exports = {
  
  async getUserById(user) {

    return (await axios.get(
      `https://api.twitch.tv/kraken/users/${user.user_id}`,
      {
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-Id': process.env.OWNER_ID,
        }
      }
    )).data
    
  }
    
}