import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./components/CreateRoom";
import Room from "./components/Room";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        
        <Route path="/game/:roomID" component={Room} />
        <Route path="/"  component={CreateRoom} />
      </Switch>
    </BrowserRouter>

  );
}

export default App;