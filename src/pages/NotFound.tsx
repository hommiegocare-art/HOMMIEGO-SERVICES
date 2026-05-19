import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Hammer, Camera, Heart, Home,
  Gamepad2, RefreshCcw, Trophy, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Types ---
interface FallingItem {
  id: number;
  x: number;
  y: number;
  icon: any;
  speed: number;
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Game State
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerPosition, setPlayerPosition] = useState(50); // Percentage 0-100

  const icons = [Wrench, Hammer, Camera, Heart];

  useEffect(() => {
    console.error("404 Error: Path", location.pathname);
    const saved = localStorage.getItem("hommiego_highscore");
    if (saved) setHighScore(parseInt(saved));
  }, [location.pathname]);

  // Game Loop
  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      const newItem: FallingItem = {
        id: Date.now(),
        x: Math.random() * 90 + 5,
        y: -10,
        icon: icons[Math.floor(Math.random() * icons.length)],
        speed: Math.random() * 2 + 2,
      };
      setItems((prev) => [...prev, newItem]);
    }, 800);

    const moveInterval = setInterval(() => {
      setItems((prev) => {
        const nextItems = prev
          .map((item) => ({ ...item, y: item.y + item.speed }))
          .filter((item) => item.y < 110);

        // Collision Detection
        nextItems.forEach((item) => {
          if (item.y > 85 && item.y < 95) {
            const distance = Math.abs(item.x - playerPosition);
            if (distance < 10) {
              setScore((s) => {
                const newScore = s + 1;
                if (newScore > highScore) {
                  setHighScore(newScore);
                  localStorage.setItem("hommiego_highscore", newScore.toString());
                }
                return newScore;
              });
              item.y = 200; // Move off screen to "collect"
            }
          }
        });

        return nextItems.filter((item) => item.y < 120);
      });
    }, 16);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [isPlaying, playerPosition, highScore]);

  // Handle Input
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gameContainerRef.current) return;
    const rect = gameContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlayerPosition(Math.max(5, Math.min(95, x)));
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950 font-sans">

      {/* 1. ANIMATED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 max-w-4xl px-4 flex flex-col items-center">

        {/* 2. ERROR HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-bold mb-4">
            <AlertCircle className="w-4 h-4" /> Error Code: 404
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-2">
            LOST IN <span className="text-primary">SPACE?</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto">
            We couldn't find that page, but we found some missing tools! Help catch them while we fix the link.
          </p>
        </motion.div>

        {/* 3. GAME AREA */}
        <Card className="relative w-full h-[350px] md:h-[500px] bg-white/5 border-white/10 backdrop-blur-md rounded-xl overflow-hidden cursor-crosshair group shadow-2xl"
          ref={gameContainerRef}
          onMouseMove={handleMouseMove}
        >
          {!isPlaying ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-50 p-6 text-center">
              <Gamepad2 className="w-16 h-16 text-primary mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold text-white mb-2">HommieGo Tool Catcher</h2>
              <p className="text-slate-400 mb-2">Move your mouse/finger to catch the falling icons!</p>
              <Button size="lg" onClick={() => { setScore(0); setIsPlaying(true); }} className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                Start Game
              </Button>
            </div>
          ) : (
            <>
              {/* Score HUD */}
              <div className="absolute top-4 left-6 flex flex-col gap-1 z-20">
                <div className="flex items-center gap-2 text-white font-black text-2xl">
                  <Trophy className="w-6 h-6 text-yellow-400" /> {score}
                </div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  High Score: {highScore}
                </div>
              </div>

              {/* Falling Items */}
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className="absolute text-primary p-3 bg-white/10 rounded-xl border border-white/10 shadow-lg"
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <item.icon size={24} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Player / Bucket */}
              <motion.div
                className="absolute bottom-4 h-16 w-24 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/40 border-t-4 border-white/20"
                animate={{ left: `${playerPosition}%`, x: "-50%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.1 }}
              >
                <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent rounded-2xl flex items-center justify-center">
                  <Gamepad2 className="text-white w-8 h-8" />
                </div>
              </motion.div>
            </>
          )}

          {/* 5. FOOTER DECORATION */}
          <p className="absolute bottom-0 text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} HommieGo Interactive Error Labs
          </p>
        </Card>

        {/* 4. NAVIGATION ACTIONS */}
        <div className="mt-2 flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsPlaying(false)}
            className="rounded-2xl h-14 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Reset Game
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="rounded-2xl h-14 px-10 font-bold gap-2"
          >
            <Home className="w-5 h-5" /> Back to Homepage
          </Button>
        </div>

      </div>


    </div>
  );
};

const Card = ({ children, className, ref, ...props }: any) => (
  <div ref={ref} className={`border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export default NotFound;