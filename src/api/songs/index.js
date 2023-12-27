const SongHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'songs',
  version: '1.0.0',
  register: async (server, { service, validator, queryValidator }) => {
    const songsHandler = new SongHandler(service, validator, queryValidator);
    server.route(routes(songsHandler));
  },
};
