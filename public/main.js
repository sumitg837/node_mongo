'use strict'

var app = {
	chat : function(email){
		//var socket = io("/");
		var socket = io('http://localhost:8081',{origins:"*"});
		socket.on('connect',function(){
			$('#send').on('click', function(e){
				e.preventDefault();
				//var email = $('#email').val().trim();
				var msg=$('#text').val().trim();
				if(msg !== ''){
					var message ={ 
						content: msg,
						email: email,
						date: Date.now()
					};
					socket.emit('clientMessage', message);
					alert(message);
					$('#input').val('');
					app.helper.addMessage(message);
				}
			});
		socket.on('addMessage',function(message){
			app.helpers.addMessage(message);
		});
		});
	},
	//html helper
	helpers : {
		encodeHTML: function(str){
			return $('<div />').text(str).html();
		},
		// Adding a new message to chat history
    addMessage: function(message){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.email);
      message.content   = this.encodeHTML(message.content);

      var html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.username}</span>
                      <span class="message-data-time">${message.date}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.content}</div>
                  </li>`;
      //$(html).hide().appendTo('.chat-history ul').slideDown(200);
      $(html).appendTo('.chat-history ul').slideDown(200);
      // Keep scroll bar down
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    }
	}
}