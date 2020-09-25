import React, { useEffect, useRef, useState } from 'react';
import './Room.css';
import io from 'socket.io-client';
import Peer from 'peerjs';
const ENDPOINT = 'localhost:3001';
const myPeer = new Peer(undefined, {
  // host: '/',
  // port: '3001'
});

// const myPeer

function Room(props) {
  
  const [circleTurn, setCircleTurn] = useState(false);
  let boardRef = useRef(null);
  let messageRef = useRef(null);
  const userVideo = useRef();
  const partnerVideo = useRef();
  const videoGrid = useRef();
  const socketRef = useRef();
  const startButtonRef = useRef();
  const [yourID, setYourID] = useState();
  const [myClass, setMyClass] = useState();
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);

  const [userId, setUserId] = useState();
  const X_CLASS = 'x';
  const CIRCLE_CLASS = 'circle';
  const peers = {};
  const roomID = props.match.params.roomID;


  useEffect(() => {
    socketRef.current = io.connect('/');
    
    myPeer.on('open', id =>{
      socketRef.current.emit('join-room', roomID, id);
  });

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream =>{
      //show my video
      addVideoStream(userVideo.current, stream)
      socketRef.current.on('user-connected', user =>{
        // console.log(user)
        setUserId(user)
        connectToNewUser(user, stream)
    })

    // const video = document.createElement('video')

      //show other users video
      myPeer.on('call', call =>{
        call.answer(stream);

        call.on('stream', userVideoStream =>{
            addVideoStream(partnerVideo.current, userVideoStream)
        })
    })

      
    })

  }, [])

  

  function addVideoStream(video, stream){
    video.srcObject = stream;
    // video.addEventListener('loadedmetadata', () =>{
    //     video.play();
    // });
    // videoGrid.current.append(video)
}

function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream)
    peers[userId] = call
    const video = document.createElement('video')
    call.on('stream', userVideoStream =>{
        addVideoStream(partnerVideo.current, userVideoStream)
    })
    call.on('close',  () =>{
        partnerVideo.remove();
    })
}

  useEffect(() => {
    socketRef.current.on('your id', user => {
      setYourID(state => user.id)
      setMyClass(user.class)
    });
    

    socketRef.current.on('change-turns', turn => setCircleTurn(turn));
    socketRef.current.on('winner', winner =>{
        setStart(false)
        messageRef.current.querySelector('[data-winning-message]').innerHTML= `${winner}'s Win`;
      messageRef.current.classList.add('show');
    })

    socketRef.current.on('allUsers', allUsers => {
      setUsers( allUsers);
     });

    socketRef.current.on('set-board', board =>{
      [...boardRef.current.children].map((cell, index) =>{
        cell.classList.add(board[index].class)
      })

    })

    socketRef.current.on('user-disconnected', v =>{
      setStart(false);
      cleanBoard();
      if(peers[userId]) peers[userId].close();
      // messageRef.current.classList.remove('show');
      startButtonRef.current.classList.remove('hide');

    })

    socketRef.current.on('draw', draw =>{
      if(draw){
        setStart(false);
        messageRef.current.querySelector('[data-winning-message]').innerHTML= "Draw!";
       messageRef.current.classList.add('show');
       
      }
    })

    socketRef.current.on('start-game',turn =>{
      cleanBoard();
      messageRef.current.classList.remove('show');
      startButtonRef.current.classList.add('hide');
      setCircleTurn(turn)
      setStart(true)
    })


  }, [yourID, users])
  
  function cleanBoard(){
    [...boardRef.current.children].forEach(cell =>{
      cell.classList.remove(X_CLASS);
      cell.classList.remove(CIRCLE_CLASS);
    })
  }

  function markCell(cell){
    if(circleTurn){

      cell.classList.add(CIRCLE_CLASS);

    }
    else{
      cell.classList.add(X_CLASS);
    }
  }
  function handleClick(event){
    if(!start) return;
    const currentTurn = circleTurn ? CIRCLE_CLASS : X_CLASS;
    if(currentTurn !== myClass){ return}
    if(event.target.matches(`.${X_CLASS}`) || event.target.matches(`.${CIRCLE_CLASS}`)){
      return;
    }
  
    markCell(event.target);
    const index = event.target.getAttribute('data-key');
    console.log(index);
    socketRef.current.emit('mark-cell', parseInt(index), currentTurn, roomID)
  
    
    socketRef.current.emit('check-win', currentTurn, roomID);
    
    socketRef.current.emit('set-turn', circleTurn, roomID);

  }
  function startGame(){
    setCircleTurn(false);
    setStart(true);

    socketRef.current.emit('startGame', roomID);
   

  }

  function handleStartGame(){

    startGame()
  }


  
  
  
  return (
    <div className="App">

      <div ref={boardRef} className={["board", myClass].join(' ')} id="board">
        <div className="cell" data-key={0} onClick={handleClick}></div>
        <div className="cell" data-key={1} onClick={handleClick}></div>
        <div className="cell" data-key={2} onClick={handleClick}></div>
        <div className="cell" data-key={3} onClick={handleClick}></div>
        <div className="cell" data-key={4} onClick={handleClick}></div>
        <div className="cell" data-key={5} onClick={handleClick}></div>
        <div className="cell" data-key={6} onClick={handleClick}></div>
        <div className="cell" data-key={7} onClick={handleClick}></div>
        <div className="cell" data-key={8} onClick={handleClick}></div>
      </div>

      <div className="startGame" ref={startButtonRef}>
        <button id="restartButton" onClick={handleStartGame} disabled={users.length < 2}>Start Game</button>
        <p className="wait_message" hidden={users.length > 1}>Waiting for another user to connect...</p>
        </div>

      <div className={["turn-text", start? '': 'hide'].join(' ')}><p>{circleTurn? 'Circle' : 'X'}'s Turn</p></div>
      <div ref={messageRef} className="winning_message" id="winningMessage">
        <div data-winning-message></div>
        <button id="restartButton" onClick={startGame}>Restart</button>
      </div>

      <div ref={videoGrid} className="video_grid">
          <video ref={userVideo} muted playsInline autoPlay className="myVideo"></video>
          <video ref={partnerVideo} playsInline autoPlay className="partner_video"></video>


      </div>
    </div>
    
    
  );
}

export default Room;