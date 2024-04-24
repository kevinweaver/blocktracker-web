"use client";
import React, { useEffect } from "react";
import { initGalaxyScene } from "./threeMain";

const GalaxyScene = () => {
  useEffect(() => {
    initGalaxyScene("canvas");
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <canvas
        id="canvas"
        data-engine="three.js r146"
        style={{ width: "100%", height: "100%" }}
      ></canvas>
    </div>
  );
};

export default GalaxyScene;
