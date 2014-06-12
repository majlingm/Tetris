/* 
A simple nodejs tetris server

Written by
Mikael Majling


TODOLIST
    
    *Fix the playerdisconnected issues, since the gameLoop only runs at one connection for each playing pair the disconnection of 
    a client must be handles differently depending on which client that disconnects, atleast I think thats the problem.
    
    *handle the playerQueue and pairing of players differently, with the current method players can be forgetten.
    
    *extend the with a function/class that passes data from files/database to the browser without doing an actual http request
    
    *look into databases(couchDB?) and add a highscore list
    
    *clean up after each client on disconnect


*/


/*a simple Webserver, although i modified and added to it some it's originaly from this tuorial
http://net.tutsplus.com/tutorials/javascript-ajax/learning-serverside-javascript-with-node-js/*/
var http = require('http')
  , url = require('url')
  , path = require("path")
  , sys = require("sys")
  , fs = require('fs')
  , io = require('socket.io')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , server;
  
server = http.createServer(function(request, response) {  
    uri = url.parse(request.url).pathname;  
    
    if(uri == "/")
    {
        uri = "/menu.html";
    }
    else if(uri == "/Multiplayer")
    {
        uri = "tetris2p.html";

    }
    else if(uri == "/Singleplayer")
    {
        uri = "tetris1p.html";
    }    
    
    var filename = path.join(process.cwd(), uri);  
    
    path.exists(filename, function(exists) {  
        if(!exists) {  
            response.writeHead(404, {"Content-Type": "text/plain"});  
            response.write("404 Not Found\n");  
            response.end();  
            return;  
        }  
  
        fs.readFile(filename, "binary", function(err, file) {  
            if(err) {  
                response.writeHead(500, {"Content-Type": "text/plain"});  
                response.write(err + "\n");  
                response.end();  
                return;  
            }  
        
            response.writeHead(200);  
            response.write(file, "binary");  
            response.end();
     
        });  
    });  
});

server.listen(8080);
//--- END OF Webserver

    
//Tetris server app starting here
var playerQueue = new Array();
var io = io.listen(server);

    io.on('connection', function(client){
        var myId;
        var myOpponent;
        var me = client;
        var myOpponentId;

        me.connected = true;
          
          
        me.on('message', function(obj){
          
            //Sets some variables and starts a game
            if ('newPlayer' in obj){

                me.gameOver = false;
                playerQueue.push(me);
                myId = playerQueue.length - 1;
              
                if((myId % 2) != 0)
                {
                    myOpponent = playerQueue[myId - 1];
                    myOpponentId = myId - 1;
                    myOpponent.send({ 'imYourOpponent':myId  });
                }
                else
                {
                    me.send({'watingForOpponent':myId});  
                }
            }
          
            
            if ('foundOpponent' in obj){
                myOpponentId = obj.foundOpponent;
                myOpponent = playerQueue[myOpponentId];
                myOpponent.send({'initGame':1});
                me.send({'initGame':1});

            }
            
            if ('gameReady' in obj)
            {
                console.log(myId + "is here");
                
                if(!me.ready){

                    me.ready = true;
                    
                    if(myOpponent.ready == true)
                    {
                        
                        me.leader = true;
                        myOpponent.leader = false;
                        gameLoop();

                    }
                }
            }
            
            if('sendLines' in obj)
            {

                myOpponent.send({'newLines':obj.sendLines})
            
            }

            if('sendBoard' in obj)
            {
                 myOpponent.send({'newBoard':obj.sendBoard});
            }        

            if('gameOver' in obj)
            {
            
                me.gameOver = true;
            
            }
            
            if('opponentDisconnected' in obj)
            {
                myOpponent.connected = false;
            }           
        
          });

          me.on('disconnect', function(){
                me.connected = false;
          });
          
          function gameLoop()
          {
                me.send({"nextTick": 1});
                myOpponent.send({"nextTick": 1});
          
                if(!me.gameOver && !myOpponent.gameOver)
                {
                    if(myOpponent.connected)
                        setTimeout(gameLoop, 800);
                    else
                        me.send({"opponentDisconnected": 1});
                }
                else if(me.gameOver)
                {
                
                    myOpponent.send({"winner":1});
                    me.send({"loser":1});
                
                }
                else if(myOpponent.gameOver)
                {
                
                    me.send({"winner":1});
                    myOpponent.send({"loser":1});
                
                }
          }
          
      
    });

