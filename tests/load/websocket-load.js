import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ws_connecting: ['p(95)<1000'],
    ws_msgs_received: ['count>100'],
  },
};

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:3000';

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'customer:join',
          data: { name: `User-${__VU}` },
        })
      );
    });

    socket.on('message', data => {
      const msg = JSON.parse(data);
      check(msg, { 'message received': m => m !== null });
    });

    socket.setTimeout(() => {
      socket.close();
    }, 10000);
  });

  check(res, { 'status is 101': r => r && r.status === 101 });
}
