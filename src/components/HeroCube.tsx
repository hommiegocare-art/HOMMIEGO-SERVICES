import React from "react";

// Sub-component to create the 3x3 Rubik's grid for each face
const CubeFace = ({ imageUrl }: { imageUrl: string }) => {
  const segments = Array.from({ length: 9 });
  return (
    <div className="grid grid-cols-3 grid-rows-3 w-full h-full bg-slate-900 gap-[2px] p-[2px]">
      {segments.map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return (
          <div
            key={i}
            className="relative overflow-hidden"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "300% 300%",
              backgroundPosition: `${col * 50}% ${row * 50}%`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

const HeroCube = () => {
  const images = [
    "/background2.png",
    "/background3.png",
    "/background4.png",
    "/background5.png",
    "/background6.png",
    "/background2.png", // Bottom face
  ];

  return (
    <div className="flex items-center justify-center h-[550px] w-full perspective-1200">
      <style>{`
        .perspective-1200 {
          perspective: 1200px;
        }
        .cube-container {
          width: 350px;
          height: 350px;
          position: relative;
          transform-style: preserve-3d;
          animation: rotateCube 25s infinite linear;
          transition: transform 0.5s ease-out;
        }
        @keyframes rotateCube {
          0% { transform: rotateY(0deg) rotateX(15deg) rotateZ(0deg); }
          25% { transform: rotateY(90deg) rotateX(-15deg) rotateZ(5deg); }
          50% { transform: rotateY(180deg) rotateX(15deg) rotateZ(0deg); }
          75% { transform: rotateY(270deg) rotateX(-15deg) rotateZ(-5deg); }
          100% { transform: rotateY(360deg) rotateX(15deg) rotateZ(0deg); }
        }
        .face {
          position: absolute;
          width: 350px;
          height: 350px;
          backface-visibility: hidden;
          border: 3px solid #1e293b;
          box-shadow: 0 0 50px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        /* 3D Placement - Z is half of width (350 / 2 = 175px) */
        .front  { transform: rotateY(0deg) translateZ(175px); }
        .back   { transform: rotateY(180deg) translateZ(175px); }
        .right  { transform: rotateY(90deg) translateZ(175px); }
        .left   { transform: rotateY(-90deg) translateZ(175px); }
        .top    { transform: rotateX(90deg) translateZ(175px); }
        .bottom { transform: rotateX(-90deg) translateZ(175px); }

        .cube-container:hover {
          animation-play-state: paused;
          cursor: pointer;
          transform: scale(1.05) rotateY(10deg);
        }

        /* Face shine effect */
        .face::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.08) 0%,
            transparent 40%,
            rgba(0,0,0,0.05) 100%
          );
          pointer-events: none;
          z-index: 5;
        }

        /* Smooth edge glow */
        .face {
          box-shadow:
            0 0 40px rgba(0,0,0,0.4),
            inset 0 0 60px rgba(0,0,0,0.2);
        }

        /* Individual segment hover effect */
        .face .grid > div {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .face .grid > div:hover {
          transform: scale(1.05);
          filter: brightness(1.2);
          z-index: 10;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .cube-container {
            width: 260px;
            height: 260px;
          }
          .face {
            width: 260px;
            height: 260px;
          }
          .front  { transform: rotateY(0deg) translateZ(130px); }
          .back   { transform: rotateY(180deg) translateZ(130px); }
          .right  { transform: rotateY(90deg) translateZ(130px); }
          .left   { transform: rotateY(-90deg) translateZ(130px); }
          .top    { transform: rotateX(90deg) translateZ(130px); }
          .bottom { transform: rotateX(-90deg) translateZ(130px); }
        }
      `}</style>

      <div className="cube-container">
        <div className="face front"><CubeFace imageUrl={images[0]} /></div>
        <div className="face back"><CubeFace imageUrl={images[1]} /></div>
        <div className="face right"><CubeFace imageUrl={images[2]} /></div>
        <div className="face left"><CubeFace imageUrl={images[3]} /></div>
        <div className="face top"><CubeFace imageUrl={images[4]} /></div>
        <div className="face bottom"><CubeFace imageUrl={images[5]} /></div>
      </div>
    </div>
  );
};

export default HeroCube;