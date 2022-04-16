const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');


module.exports = (server, app, sessionMiddleware) => {
	const io = SocketIO(server, { path: '/socket.io' });
	
	io.on('connection', (socket) => {
		const req = socket.request;
		app.set('io', io); //라우터에서 io 객체 사용할 수 있도록 저장해 둠. req.app.get('io')로 접근 가능
		
		const room = io.of('/room'); // Socket.IO에 네임스페이스를 부여하는 메서드
		const chat = io.of('/chat'); // 기본적으로는 / 네임스페이스에 접속하지만 of 메서드를 이용하여 다른 네임스페이스를 만들어 접속할 수 있다.
		                             // 같은 네임스페이스끼리만 데이터를 전달한다.
		io.use((socket, next) => {
			cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res, next);
			sessionMiddleware(socket.request, socket.request.res, next);
		})
		//모든 소켓 연결 시마다 실행: 세션 미들웨어에 요청 객체(socket.request), 응답 객체(socket.request.res), next 함수를 인수로 넣으면 socket.request 객체 안에 socket.request.session 객체 생성됨
		
		room.on('connection', (socket) => {
			console.log('room 네임스페이스에 접속');
			socket.on('disconnect', () => {
				console.log('room 네임스페이스 접속 해제');
			});
		});
		
		chat.on('connection', (socket) => {
			console.log('chat 네임스페이스에 접속');
			const req = socket.request;
			const { headers: { referer } } = req;
			const roomId = referer
				.split('/')[referer.split('/').length - 1]
				.replace(/\?.+/, '');
			socket.join(roomId); // 방에 들어가는 메서드
			socket.to(roomId).emit('join', { //세션 미들웨어로 누가 들어왔는지 알림
				user: 'system',
				chat: `${req.session.color}님이 입장하셨습니다.`,
			})
			
			socket.on('disconnect', () => {
				console.log('chat 네임스페이스 접속 해제');
				socket.leave(roomId); // 방에 나가는 메서드
				//접속 해제 시에는 현재 방의 사람 수를 구해서 0이면 제거하고 아니면 참여자에게 퇴장했다는 데이터를 보낸다.
				const currentRoom = socket.adapter.rooms[roomId]; //참여 중인 소켓 정보가 들어있다.
				const userCount = currentRoom ? currentRoom.length : 0;
				if (userCount === 0) {
					/*
					axios에 요청을 보낼 때 요청자가 누구인지 정보가 들어 있지 않는다. 
					express-session에서 세션 쿠키인 req.signedCookies['connect.sid']를 보고 현재 세션이 누구인지 판단한다.
					브라우저에서 axios 요청을 보낼 때는 자동으로 쿠키를 넣어 보내지만, 서버에서 axios 요청할 때는 쿠키가 같이 보내지지 않는다.
					따라서 express-session이 판단할 수 있게 하려면 직접 요청 헤더에 세션 쿠리를 넣어야 한다.
					req.signedCookies 내부의 쿠키들은 모두 복호화되어 있으므로 다시 암호화 해서 요청에 담아야 한다.
					이떄 express-session의 세션 쿠키 앞에는 s%3A를 붙여야 한다.
					*/
					const signedCookies = req.signedCookies['connect.sid'];
					const connectSID = cookie.sign(signedCookie, process.env.COOKIE_SECRET);
					axios.delete(`https://gif-chat-ytwin.run.goorm.io/room/${roomId}`, {
						headers: {
							Cookie: `connect.sid=s%3A${connectSID}`,
						},
					})
						.then(() => {
							console.log('방 제거 요청 성공');
						})
						.catch((error) => {
							console.error(error);
						})
				} else {
					socket.to(roomId).emit('exit', {
						user: 'system',
						chat: `${req.session.color}님이 퇴장하셨습니다.`,
					});
				}
			}); // Socket.IO에는 네임스페이스보다 더 세부적인 개념으로 방(room)이 존재, 같은 네임스페이스에서도 같은 방에 있는 소켓끼리 데이터를 주고 받음. join 과  leave로 방의 아디를 인수로 받음.
		});     // socket.request.headers.referer를 통해 현재 웹 페이지의 URL을 가져올 수 있고, URL에서 방 아이디 부분을 추출함.(split과 replace 부분)
	});
};

// ws 버젼
/*
const WebSocket = require('ws');

module.exports = (server) => {
	const wss = new WebSocket.Server({server});
	
	wss.on('connection', (ws, req) => {
		const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		console.log('새로운 클라이언트 접속', ip);
		ws.on('message', (message) => {
			console.log(message);
		});
		ws.on('error', (error) => {
			console.error(error);
		});
		ws.on('close', () => {
			console.log('클라리언트 접속 해제', ip);
			clearInterval(ws.interval);
		});
		
		ws.interval = setInterval(() => {
			if (ws.readyState === ws.OPEN) {
				ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
			}
		}, 3000);
	});
};
*/