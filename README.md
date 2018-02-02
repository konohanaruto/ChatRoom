# Websocket聊天室
一个简单聊天室实现，基于nodejs，socket.io，php，redis等等。

## 预览

![界面预览](screenshots/201801315.jpg "界面截图")

## 相关功能

- 公共消息
- 私聊消息
- 当前在线用户
- 会员登入提示
- 会员离开提示
- 多房间聊天

## 环境准备

- node.js
- socket.io
- php
- redis(npm)
- redis(server)

## 安装和部署

#### 安装nodejs的socket.io和redis扩展包

```
npm install
```

#### node.js安装

[nodejs](https://nodejs.org/en/download/)

#### php配置

```
<VirtualHost *:80>
    ServerName socket.web
    DocumentRoot /var/www/www.phptest.com/ChatRoom
    <Directory /var/www/www.phptest.com/ChatRoom>
        Require all granted
        Options Indexes FollowSymlinks MultiViews
        AllowOverride All
    </Directory>
</VirtualHost>
```

#### Redis服务端安装

[redis](https://redis.io/)

## 测试步骤

1. 启动redis服务

`/usr/local/redis/redis-server`

2. node服务端启动

`/usr/local/node/bin/node server.js`

3. 进入聊天室

http://`你的域名`/index.php?uid=`用户id`&username=`用户名`&room_id=`房间id`  

范例：  

http://socket.web/index.php?uid=1&username=konohanaruto&room_id=1

适当调整这三个参数可实现同时多房间聊天，私聊。

:smile::smile::smile:

## License

[Apache License 2.0](http://www.apache.org/licenses/)









