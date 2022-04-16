const SocketIO = require('socket.io');

module.exports = (server, app) => {
	const io = SocketIO(server, { path: '/socket.io' });
	
	io.on('connection', (socket) => {
		const req = socket.request;
		app.set('io', io); //라우터에서 io 객체 사용할 수 있도록 저장해 둠. req.app.get('io')로 접근 가능
		
		const room = io.of('/room'); // Socket.IO에 네임스페이스를 부여하는 메서드
		const chat = io.of('/chat'); // 기본적으로는 / 네임스페이스에 접속하지만 of 메서드를 이용하여 다른 네임스페이스를 만들어 접속할 수 있다.
		                             // 같은 네임스페이스끼리만 데이터를 전달한다.
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
			
			socket.on('disconnect', () => {
				console.log('chat 네임스페이스 접속 해제');
				socket.leave(roomId); // 방에 나가는 메서드
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