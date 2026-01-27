# Flutter/Dart 모바일 앱 채팅 구현 가이드

이 문서는 Flutter/Dart 기반 모바일 앱에서 채팅 기능을 구현하고 테스트하기 위한 가이드입니다.

---

## 목차

1. [필수 패키지 설치](#필수-패키지-설치)
2. [인증 (Authentication)](#인증-authentication)
3. [REST API 사용법](#rest-api-사용법)
4. [WebSocket 실시간 채팅](#websocket-실시간-채팅)
5. [완전한 예제 코드](#완전한-예제-코드)
6. [에러 처리](#에러-처리)
7. [테스트 시나리오](#테스트-시나리오)

---

## 필수 패키지 설치

`pubspec.yaml`에 다음 패키지를 추가하세요:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP 요청
  dio: ^5.4.0
  # 또는 http: ^1.1.0
  
  # WebSocket (Socket.io)
  socket_io_client: ^2.0.3+1
  
  # JSON 직렬화
  json_annotation: ^4.8.1
  
  # 로컬 저장소 (토큰 저장)
  shared_preferences: ^2.2.2
  
  # 상태 관리 (선택사항)
  provider: ^6.1.1
  # 또는 riverpod, bloc 등

dev_dependencies:
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

설치:
```bash
flutter pub get
```

---

## 인증 (Authentication)

### 1. 로그인 및 토큰 저장

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'http://your-server-url:3000/api/v1';
  final Dio _dio = Dio();
  
  // 로그인
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '$baseUrl/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      if (response.data['success'] == true) {
        final token = response.data['data']['accessToken'];
        final user = response.data['data']['user'];
        
        // 토큰 저장
        await _saveToken(token);
        await _saveUser(user);
        
        return {
          'success': true,
          'token': token,
          'user': user,
        };
      }
      
      throw Exception('Login failed');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Login failed');
    }
  }
  
  // 토큰 저장
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
  
  // 사용자 정보 저장
  Future<void> _saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(user));
  }
  
  // 저장된 토큰 가져오기
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
  
  // 저장된 사용자 정보 가져오기
  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user_data');
    if (userJson != null) {
      return jsonDecode(userJson) as Map<String, dynamic>;
    }
    return null;
  }
  
  // 로그아웃
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
  }
}
```

### 2. 인증된 요청 헤더 설정

```dart
class ApiService {
  final Dio _dio = Dio();
  final AuthService _authService = AuthService();
  
  ApiService() {
    _dio.options.baseUrl = 'http://your-server-url:3000/api/v1';
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // 모든 요청에 토큰 추가
          final token = await _authService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          // 401 에러 시 자동 로그아웃
          if (error.response?.statusCode == 401) {
            await _authService.logout();
            // 로그인 화면으로 이동
          }
          handler.next(error);
        },
      ),
    );
  }
  
  Dio get dio => _dio;
}
```

---

## REST API 사용법

### 1. 채팅방 생성/조회

```dart
class ChatService {
  final ApiService _apiService = ApiService();
  
  // 채팅방 생성 또는 기존 채팅방 조회
  Future<Map<String, dynamic>> createOrGetChatRoom(String otherUserId) async {
    try {
      final response = await _apiService.dio.post(
        '/messages/chat-rooms',
        data: {
          'otherUserId': otherUserId,
        },
      );
      
      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }
      
      throw Exception('Failed to create chat room');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to create chat room');
    }
  }
  
  // 내 채팅방 목록 조회
  Future<List<Map<String, dynamic>>> getChatRooms() async {
    try {
      final response = await _apiService.dio.get('/messages/chats');
      
      if (response.data['success'] == true) {
        final chats = response.data['data']['chats'] as List;
        return chats.cast<Map<String, dynamic>>();
      }
      
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to get chat rooms');
    }
  }
  
  // 특정 채팅방 정보 조회
  Future<Map<String, dynamic>> getChatRoom(String roomId) async {
    try {
      final response = await _apiService.dio.get('/messages/chat-rooms/$roomId');
      
      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }
      
      throw Exception('Chat room not found');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to get chat room');
    }
  }
}
```

### 2. 메시지 전송 (REST API)

```dart
class MessageService {
  final ApiService _apiService = ApiService();
  
  // 메시지 전송
  Future<Map<String, dynamic>> sendMessage({
    required String roomId,
    required String content,
    String type = 'TEXT',
    String? attachmentUrl,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/messages/chats/$roomId/messages',
        data: {
          'content': content,
          'type': type,
          if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
        },
      );
      
      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }
      
      throw Exception('Failed to send message');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to send message');
    }
  }
  
  // 메시지 목록 조회
  Future<Map<String, dynamic>> getMessages({
    required String roomId,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.dio.get(
        '/messages/chats/$roomId/messages',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      
      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }
      
      return {
        'messages': [],
        'pagination': {},
      };
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to get messages');
    }
  }
  
  // 메시지 읽음 처리
  Future<void> markAsRead(String messageId) async {
    try {
      await _apiService.dio.patch(
        '/messages/$messageId/read',
      );
    } on DioException catch (e) {
      // 에러 무시 (선택사항)
      print('Failed to mark message as read: ${e.message}');
    }
  }
}
```

### 3. 사용자 검색

```dart
class UserService {
  final ApiService _apiService = ApiService();
  
  // 사용자 검색
  Future<List<Map<String, dynamic>>> searchUsers({
    String? query,
    String? location,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.dio.get(
        '/users/search',
        queryParameters: {
          if (query != null) 'q': query,
          if (location != null) 'location': location,
          'page': page,
          'limit': limit,
        },
      );
      
      if (response.data['success'] == true) {
        final users = response.data['data']['items'] as List;
        return users.cast<Map<String, dynamic>>();
      }
      
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to search users');
    }
  }
}
```

---

## WebSocket 실시간 채팅

### 1. Socket.io 클라이언트 설정

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

class ChatSocketService {
  IO.Socket? _socket;
  final String baseUrl = 'http://your-server-url:3000';
  
  // 연결 상태
  bool get isConnected => _socket?.connected ?? false;
  
  // WebSocket 연결
  Future<void> connect() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    if (token == null) {
      throw Exception('No authentication token found');
    }
    
    _socket = IO.io(
      '$baseUrl/chat', // /chat namespace 사용
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableAutoConnect()
          .build(),
    );
    
    // 인증 헤더 설정
    _socket!.io.options?['extraHeaders'] = {
      'Authorization': 'Bearer $token',
    };
    
    // 연결 이벤트
    _socket!.onConnect((_) {
      print('✅ WebSocket 연결 성공');
      _authenticate(token);
    });
    
    _socket!.onDisconnect((_) {
      print('❌ WebSocket 연결 끊김');
    });
    
    _socket!.onError((error) {
      print('❌ WebSocket 오류: $error');
    });
    
    _socket!.onConnectError((error) {
      print('❌ WebSocket 연결 오류: $error');
    });
  }
  
  // 인증은 연결 시 헤더로 전달되므로 별도 emit 불필요
  // 서버에서 자동으로 JWT 토큰을 검증합니다
  
  // 채팅방 참여
  void joinRoom(String roomId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('room:join', {'roomId': roomId});
      print('📥 채팅방 참여: $roomId');
    }
  }
  
  // 채팅방 나가기
  void leaveRoom(String roomId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('room:leave', {'roomId': roomId});
      print('📤 채팅방 나가기: $roomId');
    }
  }
  
  // 메시지 전송
  void sendMessage({
    required String roomId,
    required String content,
    String messageType = 'TEXT',
  }) {
    if (_socket?.connected ?? false) {
      _socket!.emit('message:send', {
        'roomId': roomId,
        'content': content,
        'messageType': messageType,
      });
      print('📤 메시지 전송: $content');
    }
  }
  
  // 타이핑 시작
  void startTyping(String roomId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('typing:start', {'roomId': roomId});
    }
  }
  
  // 타이핑 중지
  void stopTyping(String roomId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('typing:stop', {'roomId': roomId});
    }
  }
  
  // 이벤트 리스너 등록
  void onMessage(Function(Map<String, dynamic>) callback) {
    _socket?.on('message:new', (data) {
      callback(data as Map<String, dynamic>);
    });
  }
  
  void onTypingStart(Function(Map<String, dynamic>) callback) {
    _socket?.on('typing:start', (data) {
      callback(data as Map<String, dynamic>);
    });
  }
  
  void onTypingStop(Function(Map<String, dynamic>) callback) {
    _socket?.on('typing:stop', (data) {
      callback(data as Map<String, dynamic>);
    });
  }
  
  void onUserOnline(Function(Map<String, dynamic>) callback) {
    _socket?.on('user:online', (data) {
      callback(data as Map<String, dynamic>);
    });
  }
  
  void onUserOffline(Function(Map<String, dynamic>) callback) {
    _socket?.on('user:offline', (data) {
      callback(data as Map<String, dynamic>);
    });
  }
  
  void onOfflineMessages(Function(List<dynamic>) callback) {
    _socket?.on('messages:offline', (data) {
      callback(data as List<dynamic>);
    });
  }
  
  // 연결 해제
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
```

### 2. 채팅 화면 예제

```dart
import 'package:flutter/material.dart';

class ChatScreen extends StatefulWidget {
  final String roomId;
  final String otherUserId;
  
  const ChatScreen({
    Key? key,
    required this.roomId,
    required this.otherUserId,
  }) : super(key: key);
  
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatSocketService _socketService = ChatSocketService();
  final MessageService _messageService = MessageService();
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isTyping = false;
  String? _typingUserId;
  
  @override
  void initState() {
    super.initState();
    _initializeChat();
  }
  
  Future<void> _initializeChat() async {
    // WebSocket 연결
    await _socketService.connect();
    _socketService.joinRoom(widget.roomId);
    
    // 이벤트 리스너 등록
    _socketService.onMessage((message) {
      setState(() {
        _messages.add(message);
      });
    });
    
    _socketService.onTypingStart((data) {
      setState(() {
        _isTyping = true;
        _typingUserId = data['userId'];
      });
    });
    
    _socketService.onTypingStop((data) {
      setState(() {
        _isTyping = false;
        _typingUserId = null;
      });
    });
    
    // 기존 메시지 로드
    await _loadMessages();
  }
  
  Future<void> _loadMessages() async {
    try {
      final data = await _messageService.getMessages(roomId: widget.roomId);
      setState(() {
        _messages.clear();
        _messages.addAll(
          (data['messages'] as List).cast<Map<String, dynamic>>(),
        );
      });
    } catch (e) {
      print('메시지 로드 실패: $e');
    }
  }
  
  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;
    
    // WebSocket으로 전송
    _socketService.sendMessage(
      roomId: widget.roomId,
      content: content,
    );
    
    // 또는 REST API로 전송 (fallback)
    // _messageService.sendMessage(
    //   roomId: widget.roomId,
    //   content: content,
    // );
    
    _messageController.clear();
  }
  
  @override
  void dispose() {
    _socketService.leaveRoom(widget.roomId);
    _socketService.disconnect();
    _messageController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('채팅'),
      ),
      body: Column(
        children: [
          // 메시지 목록
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isTyping) {
                  return const ListTile(
                    title: Text('상대방이 입력 중...'),
                  );
                }
                
                final message = _messages[_messages.length - 1 - index];
                final isMe = message['senderId'] == widget.otherUserId;
                
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(
                      vertical: 4,
                      horizontal: 8,
                    ),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isMe ? Colors.blue : Colors.grey[300],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      message['content'] ?? message['messageText'] ?? '',
                      style: TextStyle(
                        color: isMe ? Colors.white : Colors.black,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          // 입력 필드
          Container(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: '메시지를 입력하세요...',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (text) {
                      if (text.isNotEmpty) {
                        _socketService.startTyping(widget.roomId);
                      } else {
                        _socketService.stopTyping(widget.roomId);
                      }
                    },
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 완전한 예제 코드

### 1. 채팅 목록 화면

```dart
class ChatListScreen extends StatefulWidget {
  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final ChatService _chatService = ChatService();
  List<Map<String, dynamic>> _chats = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadChats();
  }
  
  Future<void> _loadChats() async {
    try {
      setState(() => _isLoading = true);
      final chats = await _chatService.getChatRooms();
      setState(() {
        _chats = chats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('채팅 목록 로드 실패: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('채팅'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadChats,
              child: ListView.builder(
                itemCount: _chats.length,
                itemBuilder: (context, index) {
                  final chat = _chats[index];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundImage: chat['participantImage'] != null
                          ? NetworkImage(chat['participantImage'])
                          : null,
                      child: chat['participantImage'] == null
                          ? Text(chat['participantName'][0])
                          : null,
                    ),
                    title: Text(chat['participantName'] ?? 'Unknown'),
                    subtitle: Text(chat['lastMessage'] ?? ''),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _formatTime(chat['lastMessageTime']),
                          style: const TextStyle(fontSize: 12),
                        ),
                        if ((chat['unreadCount'] ?? 0) > 0)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '${chat['unreadCount']}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                              ),
                            ),
                          ),
                      ],
                    ),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ChatScreen(
                            roomId: chat['chatId'],
                            otherUserId: chat['participantId'],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
    );
  }
  
  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    // 시간 포맷팅 로직
    return timestamp;
  }
}
```

### 2. 사용자 검색 및 채팅 시작

```dart
class UserSearchScreen extends StatefulWidget {
  @override
  State<UserSearchScreen> createState() => _UserSearchScreenState();
}

class _UserSearchScreenState extends State<UserSearchScreen> {
  final UserService _userService = UserService();
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _users = [];
  bool _isSearching = false;
  
  void _searchUsers(String query) async {
    if (query.isEmpty) {
      setState(() => _users = []);
      return;
    }
    
    setState(() => _isSearching = true);
    try {
      final users = await _userService.searchUsers(query: query);
      setState(() {
        _users = users;
        _isSearching = false;
      });
    } catch (e) {
      setState(() => _isSearching = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('검색 실패: $e')),
      );
    }
  }
  
  Future<void> _startChat(String otherUserId) async {
    try {
      final chatService = ChatService();
      final room = await chatService.createOrGetChatRoom(otherUserId);
      
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            roomId: room['id'],
            otherUserId: otherUserId,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('채팅 시작 실패: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('사용자 검색'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: '사용자 검색...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: _searchUsers,
            ),
          ),
          _isSearching
              ? const Center(child: CircularProgressIndicator())
              : Expanded(
                  child: ListView.builder(
                    itemCount: _users.length,
                    itemBuilder: (context, index) {
                      final user = _users[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundImage: user['profileImage'] != null
                              ? NetworkImage(user['profileImage'])
                              : null,
                        ),
                        title: Text(
                          '${user['firstName']} ${user['lastName']}',
                        ),
                        subtitle: Text(user['email'] ?? ''),
                        trailing: const Icon(Icons.chat),
                        onTap: () => _startChat(user['id']),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}
```

---

## 에러 처리

```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  ApiException(this.message, [this.statusCode]);
  
  @override
  String toString() => message;
}

class ErrorHandler {
  static ApiException handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException('연결 시간 초과', 408);
      
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data['message'] ?? '서버 오류';
        return ApiException(message, statusCode);
      
      case DioExceptionType.cancel:
        return ApiException('요청 취소됨');
      
      case DioExceptionType.unknown:
      default:
        return ApiException('네트워크 오류: ${error.message}');
    }
  }
  
  static void showError(BuildContext context, ApiException error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error.message),
        backgroundColor: Colors.red,
      ),
    );
  }
}
```

---

## 테스트 시나리오

### 1. 기본 채팅 플로우

```dart
void testBasicChatFlow() async {
  // 1. 로그인
  final authService = AuthService();
  await authService.login('test@example.com', 'Test1234!');
  
  // 2. 사용자 검색
  final userService = UserService();
  final users = await userService.searchUsers(query: 'provider');
  
  // 3. 채팅방 생성
  final chatService = ChatService();
  final room = await chatService.createOrGetChatRoom(users[0]['id']);
  
  // 4. WebSocket 연결
  final socketService = ChatSocketService();
  await socketService.connect();
  socketService.joinRoom(room['id']);
  
  // 5. 메시지 전송
  socketService.sendMessage(
    roomId: room['id'],
    content: 'Hello!',
  );
  
  // 6. 메시지 수신 대기
  socketService.onMessage((message) {
    print('메시지 수신: ${message['content']}');
  });
}
```

### 2. 오프라인 메시지 처리

```dart
void handleOfflineMessages() {
  final socketService = ChatSocketService();
  
  socketService.onOfflineMessages((messages) {
    print('오프라인 메시지 ${messages.length}개 수신');
    for (var message in messages) {
      // 로컬 데이터베이스에 저장
      // 또는 상태 관리에 추가
    }
  });
}
```

### 3. 재연결 처리

```dart
class ReconnectHandler {
  final ChatSocketService _socketService;
  Timer? _reconnectTimer;
  
  ReconnectHandler(this._socketService) {
    _socketService._socket?.onDisconnect((_) {
      _startReconnect();
    });
  }
  
  void _startReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer.periodic(
      const Duration(seconds: 5),
      (timer) async {
        try {
          await _socketService.connect();
          timer.cancel();
        } catch (e) {
          print('재연결 실패: $e');
        }
      },
    );
  }
  
  void dispose() {
    _reconnectTimer?.cancel();
  }
}
```

---

## API 엔드포인트 요약

### 인증
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/logout` - 로그아웃

### 채팅방
- `POST /api/v1/messages/chat-rooms` - 채팅방 생성
- `GET /api/v1/messages/chat-rooms/:id` - 채팅방 조회
- `GET /api/v1/messages/chats` - 채팅 목록 조회

### 메시지
- `POST /api/v1/messages/chats/:chatId/messages` - 메시지 전송
- `GET /api/v1/messages/chats/:chatId/messages` - 메시지 목록 조회
- `PATCH /api/v1/messages/:messageId/read` - 읽음 처리

### 사용자
- `GET /api/v1/users/search` - 사용자 검색

---

## WebSocket 이벤트

### 클라이언트 → 서버
- `room:join` - 채팅방 참여 (`{ roomId: string }`)
- `room:leave` - 채팅방 나가기 (`{ roomId: string }`)
- `message:send` - 메시지 전송 (`{ roomId: string, content: string, messageType?: string, attachmentUrl?: string }`)
- `typing:start` - 타이핑 시작 (`{ roomId: string }`)
- `typing:stop` - 타이핑 중지 (`{ roomId: string }`)

### 서버 → 클라이언트
- `message:new` - 새 메시지 수신 (`{ messageId, roomId, senderId, content, messageType, attachmentUrl, timestamp }`)
- `messages:offline` - 오프라인 메시지 배치 (연결 시 자동 전송, `Array<Message>`)
- `typing:start` - 상대방 타이핑 시작 (`{ userId, roomId }`)
- `typing:stop` - 상대방 타이핑 중지 (`{ userId, roomId }`)
- `user:online` - 사용자 온라인 (`{ userId }`)
- `user:offline` - 사용자 오프라인 (`{ userId }`)

---

## 주의사항

1. **토큰 관리**: 토큰은 안전하게 저장하고 만료 시 자동 갱신
2. **네트워크 상태**: 오프라인 상태 처리 및 재연결 로직 구현
3. **메시지 동기화**: WebSocket과 REST API 간 메시지 동기화
4. **메모리 관리**: WebSocket 연결 및 리스너 적절히 해제
5. **에러 처리**: 모든 API 호출에 대한 에러 처리 구현

---

## 테스트 계정

- **Consumer**: `test@example.com` / `Test1234!`
- **Provider**: `provider@example.com` / `Provider1234!`

---

## 추가 리소스

- [Dio 문서](https://pub.dev/packages/dio)
- [Socket.io Client 문서](https://pub.dev/packages/socket_io_client)
- [Flutter 공식 문서](https://flutter.dev/docs)

