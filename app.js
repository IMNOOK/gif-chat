const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const ColorHash = require('color-hash');
/*
접속한 사용자에게 고유한 색상을 부여하려고 한다.
익명 채팅이지만 자신과 남은 구별하기 위한 최소한의 사용자 정보는 필요하다.
현재 우리가 사용할 수 있는 고유한 값은 세션 아이디(req.sessionID)와 소켓 아이디(socket.id)이다.
그런데 매번 페이지를 이동할 때마다 소켓연결이 해제되고 다시 연결되면서 소켓 아이디가 바뀌게 된다.
따라서 세션 아이디를 사용한다.

color-hash 패키지는 세션 아이디를 HEX 형식의 색상 문자열로 바꿔주는 패키지다.
hash 이므로 같은 세션 아이디는 항상 같은 색상 문자열로 바뀐다. 사용자가 많아지만 색상이 중복되는 문제가 생길 수도 있다.
*/

dotenv.config();
const webSocket = require('./socket');
const indexRouter = require('./routes');
const connect = require('./schemas');

const app = express();
app.set('port', process.env.PORT || 8005);
app.set('view engine', 'html');
nunjucks.configure('views', {
	express: app,
	watch: true,
});
connect();

const sessionMiddleware = session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
	},
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);

app.use((req, res, next) => {
	if (!req.session.color) {
		const colorHash = new ColorHash();
		req.session.color = colorHash.hex(req.sessionID);
	}
	next();
});

app.use('/', indexRouter);

app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV != 'production' ? err : {};
	res.status(err.status || 500);
	res.render('error');
});

const server = app.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기 중');
});

webSocket(server, app, sessionMiddleware);