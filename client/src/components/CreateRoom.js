import React, { useEffect } from "react";
import { v1 as uuid } from "uuid";
import './CreateRoom.css';

const CreateRoom = (props) => {

    function create() {
        const id = uuid();
        props.history.push(`/game/${id}`);
    }

    return (
        <div className="home">
            <div className="home_menu">
                <div className="home_title">
                <h1>Tic-Tac-Toe</h1>
                <h2>Online</h2>
                </div>
                
            <button onClick={create}>Create room</button>
            </div>
        </div>
        
    );
};

export default CreateRoom;
