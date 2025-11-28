import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar.jsx";
import Homepage from "./components/home/home.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
        <Homepage />
      </div>
    </BrowserRouter>
  );
};

export default App;
