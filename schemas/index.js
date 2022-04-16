const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const PORT = `13.124.191.162`;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:${PORT}/admin`;

const connect = () => {
	if (NODE_ENV !== 'production') {
		mongoose.set('debug', true);
	}
	mongoose.connect(MONGO_URL, {
		dbName: 'gifchat',
		useNewUrlParser: true,
		useCreateIndex: true,
	}, (error) => {
		if(error) {
			console.log('몽고디비 연결 에러', error);
		} else {
			console.log('몽고디비 연결 성공');
		}
	});
};

mongoose.connection.on('error', (error) => {
	console.error('몽고디비 연결 에러', error);
});
mongoose.connection.on('disconnected', () => {
	console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
	connect();
})

module.exports = connect;