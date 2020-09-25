require('dotenv').config();

const express = require('express')
const app = express()
const http = require('http')
const path = require('path');
let users = {};
const socketToRoom = {};
let gameBoard = {};
const X_CLASS = 'x';
const CIRCLE_CLASS = 'circle';

const WINNING_COMBINATIONS = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
  ]

  function checkWin(currentTurn, id){
    return WINNING_COMBINATIONS.some(combination =>{
      return combination.every(index =>{
       return gameBoard[socketToRoom[id]][index].class === currentTurn
      })
    })
    
  }

  function checkDraw(id){
    return gameBoard[socketToRoom[id]].every(cell =>{
        return cell.class ===  X_CLASS || cell.class === CIRCLE_CLASS
  
     });
  }

const server = http.createServer(app)
const io = require('socket.io')(server)


// io.on('connection', socket =>{
    
//     socket.on('join-room', roomID =>{
//         socket.join(roomId);
//         socket.to(roomId).broadcast.emit('user-connected', socket.id)
//          if(users[roomId] ) users[roomId] = [userId];
//          else users[roomId].push(userId)

//         socket.on('disconnect' , () =>{
//             socket.to(roomId).broadcast.emit('user-disconnected', userId)
//             users[roomId]= users[roomId].filter(id => id !== userId)
//         })
//     })
// })



//connect to server
io.on('connection', socket =>{
    socket.on('join-room', (roomID, userId) =>{
        
        
        if(users[roomID]){
            const length = users[roomID].length;
            
            if(length > 1){
                return;
            }
            
              
        }
        else{

            users[roomID] = []  

        }
        const user = {
            id: socket.id,
            class: users[roomID].some(user => user.class === 'x') ? 'circle': 'x'
        }
        users[roomID].push(user) 
        socket.join(roomID);

        socket.emit("your id", user);
        socket.to(roomID).broadcast.emit('user-connected', userId);
        io.sockets.to(roomID).emit('allUsers', users[roomID]);

        socketToRoom[socket.id] = roomID;
        console.log('users: ', users);
         
    })

    // if(Object.keys(users).length >1){
    //     // socket.emit('full', 'room is full');
    // }
    // //send back a user id from socket id
    // else{
    //     const user = {
    //         id:
    //         socket.id,
    //         class: users.some(user => user.class === 'x') ? 'circle': 'x'
    //     }
    //     users[roomId].push(user)
    //     console.log(users)
    //     if(users.length > 1){
    //         // console.log(gameBoard)
    //     }
        
    // }
    
    
    //when syou send a message you 
    socket.on('mark-cell', (index, current, roomID) =>{
        //message is sent to everyone for display
        console.log(gameBoard[roomID])
        if(gameBoard[roomID][index].class === 'a'){
            console.log(console.log(gameBoard[roomID][index].class))
            gameBoard[roomID][index] = {class: current} ;
    }
        // console.log(gameBoard)
        // console.log(gameBoard[roomID])
        io.sockets.to(roomID).emit('set-board', gameBoard[roomID]);
    })

    socket.on('startGame', roomID =>{
        gameBoard[roomID] = new Array(9).fill({class: 'a'})
        console.log('game started')
        io.to(roomID).emit('start-game', false)
        
    })

    socket.on('set-turn', (circleTurn, roomID) =>{
        console.log(circleTurn)
       io.to(roomID).emit('change-turns', !circleTurn);


    })

    socket.on('check-win', (currentTurn, roomID) =>{
        if (checkWin(currentTurn, socket.id)){
            console.log(currentTurn, ' is the winner')
            io.to(roomID).emit('winner', currentTurn);
        }
        else {
            if(checkDraw(socket.id)) {
                io.to(roomID).emit('draw', true)
                console.log('game is draw')
            }
        }
    })


    socket.on('disconnect', ()=>{
        
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        socket.to(roomID).broadcast.emit('user-disconnected', true)
        
        if(room){
            users[roomID] = users[roomID].filter(user => user.id !==socket.id)
        }
        io.sockets.to(roomID).emit('allUsers', users[roomID]);
        
    
    })







})
if(process.env.PROD){
    app.use(express.static(path.join(__dirname, 'client/build')));

    console.log("trying to get react app");
    app.get('*', (req, res) =>{
        res.sendFile(path.join(__dirname, '/client/build/index.html'));
    })
}

const port = process.env.port ||3001;
server.listen(port , () => console.log(`listening on port: ${port}`))