# Flutter 채팅 빠른 시작 가이드

이 문서는 Flutter 앱에서 채팅 기능을 빠르게 구현하기 위한 간단한 가이드입니다.

---

## 1. 패키지 설치

`pubspec.yaml`:

```yaml
dependencies:
  dio: ^5.4.0
  socket_io_client: ^2.0.3+1
  shared_preferences: ^2.2.2
```

```bash
flutter pub get
```

---

## 2. 기본 설정

### 서버 URL 설정

```dart
// config.dart
class ApiConfig {
  static const String baseUrl = 'http://your-server-url:3000/api/v1';
  static const String socketUrl = 'http://your-server-url:3000';
}
```

### 테스트 계정

```dart
// test_accounts.dart
class TestAccounts {
  static const consumer = {
    'email': 'test@example.com',
    'password': 'Test1234!',
  };
  
  static const provider = {
    'email': 'provider@example.com',
    'password': 'Provider1234!',
  };
}
```

---

## 3. 최소 구현 예제

### 로그인

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<String> login(String email, String password) async {
  final dio = Dio();
  final response = await dio.post(
    'http://your-server-url:3000/api/v1/auth/login',
    data: {'email': email, 'password': password},
  );
  
  final token = response.data['data']['accessToken'];
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('token', token);
  
  return token;
}
```

### 채팅방 생성

```dart
Future<String> createChatRoom(String token, String otherUserId) async {
  final dio = Dio();
  final response = await dio.post(
    'http://your-server-url:3000/api/v1/messages/chat-rooms',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
    data: {'otherUserId': otherUserId},
  );
  
  return response.data['id'] ?? response.data['data']['id'];
}
```

### 메시지 전송 (REST)

```dart
Future<void> sendMessage(String token, String roomId, String content) async {
  final dio = Dio();
  await dio.post(
    'http://your-server-url:3000/api/v1/messages/chats/$roomId/messages',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
    data: {'content': content, 'type': 'TEXT'},
  );
}
```

### WebSocket 연결

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

Future<IO.Socket> connectSocket() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  final socket = IO.io(
    'http://your-server-url:3000/chat',
    IO.OptionBuilder()
        .setTransports(['websocket'])
        .setExtraHeaders({'Authorization': 'Bearer $token'})
        .build(),
  );
  
  socket.onConnect((_) => print('Connected'));
  socket.onDisconnect((_) => print('Disconnected'));
  
  return socket;
}
```

### 메시지 수신

```dart
void listenMessages(IO.Socket socket, Function(Map) onMessage) {
  socket.on('message:new', (data) {
    onMessage(data);
  });
}
```

### 메시지 전송 (WebSocket)

```dart
void sendMessageViaSocket(IO.Socket socket, String roomId, String content) {
  socket.emit('message:send', {
    'roomId': roomId,
    'content': content,
    'messageType': 'TEXT',
  });
}
```

---

## 4. 완전한 예제

```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: ChatTestScreen());
  }
}

class ChatTestScreen extends StatefulWidget {
  @override
  _ChatTestScreenState createState() => _ChatTestScreenState();
}

class _ChatTestScreenState extends State<ChatTestScreen> {
  final Dio _dio = Dio();
  IO.Socket? _socket;
  String? _token;
  String? _roomId;
  final List<Map> _messages = [];
  final TextEditingController _controller = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _init();
  }
  
  Future<void> _init() async {
    // 1. 로그인
    await _login();
    
    // 2. 채팅방 생성
    await _createRoom();
    
    // 3. WebSocket 연결
    await _connectSocket();
  }
  
  Future<void> _login() async {
    final response = await _dio.post(
      'http://localhost:3000/api/v1/auth/login',
      data: {'email': 'test@example.com', 'password': 'Test1234!'},
    );
    
    setState(() {
      _token = response.data['data']['accessToken'];
    });
    
    print('✅ 로그인 성공');
  }
  
  Future<void> _createRoom() async {
    final response = await _dio.post(
      'http://localhost:3000/api/v1/messages/chat-rooms',
      options: Options(headers: {'Authorization': 'Bearer $_token'}),
      data: {'otherUserId': 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61'},
    );
    
    setState(() {
      _roomId = response.data['id'] ?? response.data['data']['id'];
    });
    
    print('✅ 채팅방 생성: $_roomId');
  }
  
  Future<void> _connectSocket() async {
    _socket = IO.io(
      'http://localhost:3000/chat',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $_token'})
          .build(),
    );
    
    _socket!.onConnect((_) {
      print('✅ WebSocket 연결');
      _socket!.emit('room:join', {'roomId': _roomId});
    });
    
    _socket!.on('message:new', (data) {
      setState(() {
        _messages.add(data);
      });
    });
  }
  
  void _sendMessage() {
    final content = _controller.text;
    if (content.isEmpty) return;
    
    _socket?.emit('message:send', {
      'roomId': _roomId,
      'content': content,
      'messageType': 'TEXT',
    });
    
    _controller.clear();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('채팅 테스트')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, i) {
                final msg = _messages[i];
                return ListTile(
                  title: Text(msg['content'] ?? ''),
                  subtitle: Text(msg['senderId'] ?? ''),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(controller: _controller),
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _socket?.disconnect();
    _controller.dispose();
    super.dispose();
  }
}
```

---

## 5. 테스트 체크리스트

- [ ] 로그인 성공
- [ ] 채팅방 생성 성공
- [ ] WebSocket 연결 성공
- [ ] 메시지 전송 성공
- [ ] 메시지 수신 성공
- [ ] 오프라인 메시지 수신
- [ ] 재연결 처리

---

## 6. 문제 해결

### 연결 실패
- 서버 URL 확인
- 토큰 유효성 확인
- 네트워크 권한 확인 (Android: INTERNET, iOS: App Transport Security)

### 인증 실패
- 토큰이 헤더에 올바르게 포함되는지 확인
- 토큰 만료 시 재로그인

### 메시지 수신 안 됨
- `room:join` 이벤트 전송 확인
- WebSocket 연결 상태 확인
- 서버 로그 확인

---

자세한 내용은 `FLUTTER_CHAT_IMPLEMENTATION.md` 참고

