/**
 * Created by PhpStorm.
 * File: server.js
 * User: konohanaruto
 * Blog: http://www.muyesanren.com
 * QQ: 1039814413
 * Wechat Number: wikitest
 * Date: 1/31/2018
 * Time: 6:50 PM
 */

var config = require('./libraries/config');
var helper = require('./libraries/helper');
// 监听
var app = require('http').createServer().listen('3000');
var io = require('socket.io')(app);


// redis 
var redis = require('redis');
redisClient = redis.createClient('6379', '127.0.0.1');

io.sockets.on('connection', function (socket) {
    socket.on('on_load',function (info) {
        // level
        socket.level = 0;
        socket.username = info.username;
        socket.subscribeRoomId = 'room:' + info.roomId;
        // 在线列表的rediskey
        socket.onlineList = config.appname + ':' + socket.subscribeRoomId + ':onlinelist';
        socket.jsonInfo = JSON.stringify(info);
        // 用户打开会话的记录变量
        socket.userOpenSessionNumberKey = config.appname + ':open_session_number';
        
        // 判断用户是否被踢出
        // ...
        
        sendWelcome(info);
    });
    
    // 订阅房间并发送消息
    var sendWelcome = function (info) {
        // 订阅频道
        socket.join(socket.subscribeRoomId);
        
        // 创建一个只包含当前用户的空房间, 并订阅该房间
        socket.join(socket.subscribeRoomId + ':' + socket.username);
        
        redisClient.hget(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, function (err, res) {
            // 用户没打开任何会话
            if (! res) {
                // 初始化为1
                redisClient.hset(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, 1, function () {} );
                // 发送欢迎
                io.sockets.to(socket.subscribeRoomId).emit('welcome', info);
            } else {
                //累加
                var number = parseInt(res) + 1;
                redisClient.hset(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, number, function () {} );
            }
        });
        
        // 入hash列
        redisClient.hset(socket.onlineList, socket.username, socket.jsonInfo, function (err, reply) {
            //console.log(reply);
        });
        
        
    }
    
    // 房间内消息
    socket.on('room-message', function (msg) {
//        if (msg.type == 'notice') {
//            var content = msg.content;
//        } else {
//            var content = '<span>' + msg.username + ' ' + helper.getNowFormatDate() + ' : </span><br/>' + msg.content;
//        }
        
        var info = {};
        info.fromUsername = msg.username;
        info.toUsername = '';
        info.content = msg.content;
        info.currentTime = helper.getNowFormatDate();
        info.type = 'public';
        io.sockets.to(socket.subscribeRoomId).emit('room-message', info);
    });
    
    // 私有消息
    socket.on('private-msg', function (data) {
        
        var info = {};
        info.fromUsername = socket.username;
        info.toUsername = data.to_username;
        info.content = data.content;
        info.currentTime = helper.getNowFormatDate();
        info.type = 'private';
        // fromUsername(发送消息者)
        socket.emit('room-message', info);
        // toUsername(接收消息者), 因为会话开始时, 每个用户订阅了一个只包含自己的房间, 所以直接推消息到该房间
        io.sockets.in(socket.subscribeRoomId + ':' + info.toUsername).emit('room-message', info);
        
    });
    
    // get the user list from the current room
    // 在线用户列表, 此处可优化，设置全局变量代替
    
    var realTimeUserlist = function () {
        
        if (socket.onlineList) {
            // 得到所有的用户
            redisClient.hkeys(socket.onlineList, function (err, list) {
                var number = 0;
                var userlist = {};
                if (list) {
                    for (index in list) {
                        userlist[index] = list[index];
                        ++number;
                    }
                }
                io.sockets.to(socket.subscribeRoomId).emit('online-list', {count: number, users: userlist});
            });
        }
        
    };
    
    // 定时取消息
    var stopTimer = setInterval(realTimeUserlist, 5000);
    
    // 监听退出
    socket.on('disconnect', function () {
        if (socket.userOpenSessionNumberKey) {
            //判断多标签的关闭问题，如果真的离开房间，发送离开消息
            redisClient.hget(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, function (err, res) {
               var number = parseInt(res) - 1;
               if (number == 0) {
                   // 真退出
                   redisClient.hdel(socket.onlineList, socket.username, function (err, reply) {});
                   //io.sockets.to(socket.subscribeRoomId).emit('room-message', '<span style="color: #ff0000;">系统消息 ' + helper.getNowFormatDate() + ' : <br>' + socket.username + ' 离开房间</span>');
                   io.sockets.to(socket.subscribeRoomId).emit('offline', '<span style="color: #ff0000;">系统消息 ' + helper.getNowFormatDate() + ' : <br>' + socket.username + ' 离开房间</span>');
                   //销毁此用户打开的会话记录
                   redisClient.hdel(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, function (err, reply) {});
                   //离开房间
                   socket.leave(socket.subscribeRoomId);
               } else {
                   redisClient.hset(socket.userOpenSessionNumberKey, socket.username + ':' + socket.subscribeRoomId, number, function () {} );
               }
            });
        }
    });
})