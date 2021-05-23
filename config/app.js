//глобальные константы приложения
const port = 8080,
  host = '78.140.136.124';

module.exports = {
  port,
  address: host,
  base_address: `http://${host}:${port}/`,
  mongo_uri: 'mongodb://localhost:27017/online-store',
  secret_jwt: 'lylyly',
};

