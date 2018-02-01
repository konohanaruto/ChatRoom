var active = true;
    $(function () {

        window.onblur = function () {
            active = false;
        }
        
        // onfocus
        window.onfocus = function () {
            active = true;
            document.title = document.title.replace("【您有新的消息】", "");
        };
        
        var socket = io.connect('http://localhost:3000');

        // info
        // var uid = '<?php echo $uid;?>';
        // var username = '<?php echo $username;?>';
        // var roomId = '<?php echo $roomId;?>';

        var info = {"uid": uid, "username": username, "roomId": roomId};
        
        socket.emit('on_load', info);
        socket.on('welcome', function (msg) {
            $('.room-message').append('<p style="color: #ff0000;">系统消息 ' + getNowFormatDate() + ': <br>' + msg.username + ' 加入房间</p>');
        });

        socket.on('offline', function (msg) {
            $('.room-message').append(msg);
        });

        socket.on('room-message', function (msg) {

            //console.log(msg);
            var content = '';
            if (msg.type == 'private') {
                if (msg.fromUsername == username) {
                    msg.fromUsername = '您';
                }
                if (msg.toUsername == username) {
                    msg.toUsername = '您';
                }
                content = '<span>' + msg.fromUsername + ' 对 ' + msg.toUsername + ' 说: ' + getNowFormatDate() + ' </span><br/>' + msg.content;
            } else if (msg.type == 'public') {
                content = '<span>' + msg.fromUsername + ' 说: ' + getNowFormatDate() + '</span><br/>' + msg.content;
            }
			$('.room-message').append('<p>' + content + '</p>');

            // 滚动条保持贴在底部状态
            $('.room-message').scrollTop(function() { return this.scrollHeight; });
            if (! active && document.title.indexOf('【您有新的消息】') < 0) {
                document.title = '【您有新的消息】' + document.title;
            }
            
        });

        // 刷新在线用户列表
        socket.on('online-list', function (result) {

            // 右侧用户列表
            $('.online-number').html(result.count);
            
            if (result.users) {
                
                // 当前dom树中用户列表
                var domUserList = new Array();
                $('.online-userlist .username-span').each(function (i, n) {
                    domUserList.push($(n).html());
                });

                
                var realUserList = new Array();
                var content = '';
                jQuery.each(result.users, function (i, value) {
                    content += '<p><span class="username-span">' + value + '</span><span class="action-js-buttons"><button type="button" class="private-chat-btn">私聊</button></span></p>';
                    realUserList.push(value);
                });

                // 首次加载
                if (domUserList.length == 0) {
                    if (content) {
                        $('.online-userlist').append(content);
                    }
                } else {
                    for (var j in domUserList) {
                        if (realUserList.indexOf(domUserList[j]) < 0) {
                            $('.online-userlist .username-span:contains("'+domUserList[j]+'")').parent().remove(); 
                        } else {
                            // 移除和页面相同的, 为此, 先得到索引
                            var index = realUserList.indexOf(domUserList[j]);
                            realUserList.splice(index, 1);
                        }
                    }
                    
                    // 如果存在剩余的元素, 则代表新用户, 追加它到页面
                    if (realUserList.length > 0) {
	                    var content = '';
	                    for (var k in realUserList) {
	                    	content += '<p><span class="username-span">' + realUserList[k] + '</span><span class="action-js-buttons"><button type="button" class="private-chat-btn">私聊</button></span></p>';
	                    }
	                    $('.online-userlist').append(content);
                    }
                    
                }
            }

        });

        // jquery event.
        $("input[name='msg-content']").keydown(function (event) {
            var msg = $(this).val();
            if (msg && event.keyCode == 13) {
                sendMsgToRoom(msg);
            }
        });

        $('.send-btn').on('click', function () {
            var msg = $("input[name='msg-content']").val();
            if (msg) {
                sendMsgToRoom(msg);
            }
        });

        var sendMsgToRoom = function (msg) {
            // clear the content
            $("input[name='msg-content']").val('');
            var type = 'public';
            socket.emit('room-message', {type: type, username: username, content: msg});
        };

        $(document).on('click', '.private-chat-btn', function () {
            $('.private-chat-box').show();
            $('.input-message-box').slideDown(500);
            // 得到目标用户名
            var toUsername = $(this).parent().prev().html();
            $(".private-chat-box input[name='to_username']").val(toUsername);
            // 设置提示文字
            $(".private-chat-box .to-username-span").html(toUsername);
        });

        $('.close-box').on('click', function () {
            $('.input-message-box').slideUp(500);
            $('.private-chat-box').hide();
        });

        $('.send-private-msg-btn').on('click', function () {
            var msg = $(".send-private-msg-text").val();
            var toUsername = $(".private-chat-box input[name='to_username']").val();
            
            if (msg) {
                // 清空
                $(".send-private-msg-text").val('');
                /*
                1. 目标用户名
                2. 消息内容
                */
                socket.emit('private-msg', {to_username: toUsername, content: msg});
            }
            
        });
        
    });