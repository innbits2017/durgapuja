"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Enemy = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
};

const GAME_DURATION = 45;
const STARTING_LIVES = 3;
const INITIAL_ENEMIES = 6;
const MAX_ENEMIES = 14;
const SPAWN_INTERVAL = 1200;
const MOVE_INTERVAL = 80;

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const createEnemy = (id: number): Enemy => ({
  id,
  x: randomBetween(8, 92),
  y: randomBetween(4, 24),
  size: randomBetween(44, 60),
  speed: 0,
  rotation: randomBetween(-8, 8),
});

export default function ProtectMaaDurgaPage() {
  const nextEnemyId = useRef(0);
  const gameActiveRef = useRef(false);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);
  const timeLeftRef = useRef(GAME_DURATION);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [level, setLevel] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [message, setMessage] = useState("Protect Maa Durga!");
  const [bestScore, setBestScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);

  const endGame = () => {
    if (!gameActiveRef.current) return;

    gameActiveRef.current = false;
    setGameStarted(false);
    setGameOver(true);
    setMessage("Jai Maa Durga!");

    const finalScore = scoreRef.current;

    if (finalScore > bestScoreRef.current) {
      bestScoreRef.current = finalScore;
      setBestScore(finalScore);
      window.localStorage.setItem(
        "buh-protect-maa-durga-best-score",
        String(finalScore)
      );
    }
  };

  const startGame = () => {
    gameActiveRef.current = true;
    scoreRef.current = 0;
    nextEnemyId.current = 0;

    const startingEnemies = Array.from(
      { length: INITIAL_ENEMIES },
      () => {
        const id = nextEnemyId.current++;
        return createEnemy(id);
      }
    );

    setEnemies(startingEnemies);
    setGameStarted(true);
    setGameOver(false);
    timeLeftRef.current = GAME_DURATION;
    setTimeLeft(GAME_DURATION);
    setLives(STARTING_LIVES);
    setScore(0);
    setHits(0);
    setMisses(0);
    setLevel(1);
    setCombo(0);
    setHitFlash(false);
    setMessage("Protect Maa Durga!");
  };

  const hitEnemy = (enemyId: number) => {
    if (!gameActiveRef.current) return;

    // Remove the demon immediately from the current enemy list.
    // Using the functional state update guarantees that rapid taps cannot
    // act on a stale enemy array.
    setEnemies((current) => current.filter((enemy) => enemy.id !== enemyId));

    const nextCombo = combo + 1;
    const points = 10 + Math.min(nextCombo - 1, 4) * 5;
    scoreRef.current += points;
    setScore(scoreRef.current);
    setHits((value) => value + 1);
    setCombo(nextCombo);
    setHitFlash(true);
    setMessage(`+${points} • ${nextCombo}x SHAKTI!`);

    window.setTimeout(() => setHitFlash(false), 140);

    window.setTimeout(() => {
      if (gameActiveRef.current) {
        setMessage("Protect Maa Durga!");
      }
    }, 500);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "buh-protect-maa-durga-best-score"
    );

    if (saved) {
      const parsed = Number(saved);
      if (Number.isFinite(parsed)) {
        bestScoreRef.current = parsed;
        setBestScore(parsed);
      }
    }
  }, []);

  // Main movement loop. The slower movement is intentional:
  // players should have time to see, aim and tap each demon.
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const movementTimer = window.setInterval(() => {
      if (!gameActiveRef.current) return;

      setEnemies((current) => {
        const remaining: Enemy[] = [];
        let reached = 0;

        const elapsed = GAME_DURATION - timeLeftRef.current;
        const progress = Math.min(1, elapsed / GAME_DURATION);
        const acceleratedProgress = Math.pow(progress, 1.15);

        // Continuously increase speed throughout the game.
        // The live ref is used so the movement loop sees every second of
        // elapsed time. This starts fast enough to feel active and becomes
        // dramatically faster near the end.
        const baseSpeed = 0.30 + acceleratedProgress * 1.10;

        current.forEach((enemy) => {
          const nextSpeed = Math.min(
            1.40,
            baseSpeed + ((enemy.id % 5) * 0.022)
          );

          const nextY = enemy.y + nextSpeed;

          if (nextY >= 78) {
            reached += 1;
          } else {
            remaining.push({
              ...enemy,
              speed: nextSpeed,
              y: nextY,
              rotation: enemy.rotation + 0.08,
            });
          }
        });

        if (reached > 0) {
          setMisses((value) => value + reached);

          setLives((currentLives) => {
            const nextLives = Math.max(0, currentLives - reached);

            if (nextLives === 0) {
              window.setTimeout(() => endGame(), 0);
            }

            return nextLives;
          });

          setMessage(
            reached === 1
              ? "A demon reached the temple!"
              : `${reached} demons reached the temple!`
          );
        }

        return remaining;
      });
    }, MOVE_INTERVAL);

    return () => window.clearInterval(movementTimer);
  }, [gameStarted, gameOver]);

  // Spawn fewer demons, much more slowly than the previous version.
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnTimer = window.setInterval(() => {
      if (!gameActiveRef.current) return;

      setEnemies((current) => {
        if (current.length >= MAX_ENEMIES) return current;

        const id = nextEnemyId.current++;
        return [...current, createEnemy(id)];
      });
    }, SPAWN_INTERVAL);

    return () => window.clearInterval(spawnTimer);
  }, [gameStarted, gameOver]);

  // Timer.
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = window.setInterval(() => {
      if (!gameActiveRef.current) return;

      setTimeLeft((value) => {
        if (value <= 1) {
          timeLeftRef.current = 0;
          window.clearInterval(timer);
          window.setTimeout(() => endGame(), 0);
          return 0;
        }

        const next = value - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Level changes only every 15 seconds.
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const nextLevel =
      timeLeft <= 15 ? 3 : timeLeft <= 30 ? 2 : 1;

    setLevel(nextLevel);
  }, [timeLeft, gameStarted, gameOver]);

  const progress = (timeLeft / GAME_DURATION) * 100;

  return (
    <main className="min-h-screen bg-[#f8f1e7] font-sans text-[#241b17]">
      <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
        <Navbar />
      </div>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_#fffaf0_0%,_#f7ead8_55%,_#ecd3b0_100%)] px-5 pb-8 pt-5 sm:pb-10 sm:pt-7">
        <div className="pointer-events-none absolute left-[-120px] top-10 h-72 w-72 rounded-full border border-[#c89a3d]/15" />
        <div className="pointer-events-none absolute right-[-120px] bottom-[-80px] h-80 w-80 rounded-full border border-[#c89a3d]/15" />

        <div className="relative mx-auto max-w-5xl text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#8a6c45] transition hover:text-[#a70e18]"
          >
            <i className="fa-solid fa-arrow-left" />
            BACK TO HOME
          </Link>

          <div className="mx-auto mt-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7b66a] bg-[#fff8ec] text-lg text-[#a70e18] shadow-sm">
            <i className="fa-solid fa-shield-halved" />
          </div>

          <p className="mt-3 text-[9px] font-bold tracking-[0.35em] text-[#a77a2b]">
            PLAY & DISCOVER
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#761019] sm:text-4xl">
            Protect Maa Durga Temple
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-[#766457] sm:text-sm">
            Mahishasura and his forces are approaching the temple. Tap the
            demons before they reach Maa Durga.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-[#d7b66a] bg-white/60 px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#7d531f]">
              <i className="fa-solid fa-clock mr-2 text-[#a70e18]" />
              45 SECONDS
            </span>

            <span className="rounded-full border border-[#d7b66a] bg-white/60 px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#7d531f]">
              <i className="fa-solid fa-hand-pointer mr-2 text-[#a70e18]" />
              TAP TO ATTACK
            </span>

            <span className="rounded-full border border-[#d7b66a] bg-white/60 px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#7d531f]">
              <i className="fa-solid fa-trophy mr-2 text-[#a70e18]" />
              HIGH SCORE
            </span>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f0e5] px-3 py-5 sm:px-4 sm:py-7">
        <div className="mx-auto max-w-5xl">
          {!gameStarted && !gameOver ? (
            <div className="rounded-2xl border border-[#e4d3bc] bg-white p-6 text-center shadow-xl sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d7b66a] bg-[#fffaf2] text-3xl text-[#761019]">
  <i className="fa-solid fa-shield-halved" />
</div>

              <p className="mt-5 text-[9px] font-bold tracking-[0.35em] text-[#a77a2b]">
                SHAKTI CHALLENGE
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#761019]">
                Protect the Temple!
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#766457]">
                Tap the 👹 demons before they reach the temple. Each successful
                hit gives you <strong>10 points</strong>. You have three lives
                and 45 seconds.
              </p>

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <div className="text-2xl">👹</div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    TAP
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <div className="text-2xl">❤️</div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    3 LIVES
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <div className="text-2xl">🏆</div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    +10 EACH
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startGame}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#a70e18] px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
              >
                <i className="fa-solid fa-play mr-3" />
                START CHALLENGE
              </button>
            </div>
          ) : gameOver ? (
            <div className="rounded-2xl border border-[#e4d3bc] bg-white p-6 text-center shadow-xl sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d7b66a] bg-[#fff8ec] text-2xl text-[#a70e18]">
                <i className="fa-solid fa-trophy" />
              </div>

              <p className="mt-4 text-[9px] font-bold tracking-[0.35em] text-[#a77a2b]">
                CHALLENGE COMPLETE
              </p>

              <h2 className="mt-2 text-4xl font-black text-[#761019]">
                {score}
              </h2>

              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#8a6c45]">
                SHAKTI SCORE
              </p>

              <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <p className="text-[9px] font-bold text-[#8a6c45]">HITS</p>
                  <p className="mt-1 text-xl font-black text-[#a70e18]">
                    {hits}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <p className="text-[9px] font-bold text-[#8a6c45]">
                    MAHISHASURA MISSED
                  </p>
                  <p className="mt-1 text-xl font-black text-[#a70e18]">
                    {misses}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <p className="text-[9px] font-bold text-[#8a6c45]">
                    BEST SCORE
                  </p>
                  <p className="mt-1 text-xl font-black text-[#a70e18]">
                    {Math.max(bestScore, score)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={startGame}
                  className="inline-flex items-center justify-center rounded-full bg-[#a70e18] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
                >
                  <i className="fa-solid fa-rotate-right mr-3" />
                  PLAY AGAIN
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7b66a] bg-white px-7 py-3.5 text-sm font-bold text-[#761019] transition hover:bg-[#fff8ec]"
                >
                  <i className="fa-solid fa-house mr-3" />
                  BACK TO HOME
                </Link>
              </div>

              <p className="mt-5 text-xs font-semibold text-[#8a6c45]">
                {score >= bestScore && score > 0
                  ? "🔥 New personal best!"
                  : "Jai Maa Durga! Try again and beat your score."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 rounded-2xl border border-[#d8b66b] bg-[linear-gradient(135deg,#fffaf2,#fff1d8)] p-2 shadow-[0_10px_30px_rgba(118,16,25,0.08)]">
                <div className="mb-2 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#761019] text-xs text-[#f6d98a]">
                      <i className="fa-solid fa-shield-halved" />
                    </span>
                    <div className="text-left">
                      <p className="text-[8px] font-black tracking-[0.18em] text-[#a77a2b]">SHAKTI DEFENCE</p>
                      <p className="text-[9px] font-bold text-[#761019]">Protect Maa Durga</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-[#d8b66b] bg-white/80 px-3 py-1 text-[9px] font-black text-[#761019]">
                    <i className="fa-solid fa-fire mr-1 text-[#b21b25]" /> {combo}x COMBO
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl border border-[#e4d3bc] bg-white px-2 py-2.5 text-center shadow-sm">
                  <p className="text-[8px] font-bold tracking-[0.1em] text-[#8a6c45]">
                    SCORE
                  </p>
                  <p className="mt-1 text-lg font-black text-[#a70e18]">
                    {score}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-white px-2 py-2.5 text-center shadow-sm">
                  <p className="text-[8px] font-bold tracking-[0.1em] text-[#8a6c45]">
                    LIVES
                  </p>
                  <p className="mt-1 text-lg font-black text-[#a70e18]">
                    {"❤️".repeat(lives)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-white px-2 py-2.5 text-center shadow-sm">
                  <p className="text-[8px] font-bold tracking-[0.1em] text-[#8a6c45]">
                    LEVEL
                  </p>
                  <p className="mt-1 text-lg font-black text-[#a70e18]">
                    {level}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-white px-2 py-2.5 text-center shadow-sm">
                  <p className="text-[8px] font-bold tracking-[0.1em] text-[#8a6c45]">
                    TIME
                  </p>
                  <p className="mt-1 text-lg font-black text-[#a70e18]">
                    {timeLeft}s
                  </p>
                </div>
              </div>

              <div className="mb-3 rounded-xl border border-[#e4d3bc] bg-white/80 px-3 py-2 shadow-sm">
                <div className="mb-1 flex items-center justify-between text-[8px] font-black tracking-[0.12em] text-[#8a6c45]">
                  <span><i className="fa-solid fa-gauge-high mr-1 text-[#a70e18]" /> TEMPLE THREAT</span>
                  <span>{level === 1 ? "RISING" : level === 2 ? "DANGER" : "EXTREME"}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#eadfce]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#d7b66a,#a70e18)] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className={`relative mx-auto h-[520px] max-w-4xl overflow-hidden rounded-2xl border-2 border-[#b88b38] bg-[radial-gradient(circle_at_center,_#fff9ed_0%,_#f2ddbd_48%,_#c99c60_100%)] shadow-[0_20px_60px_rgba(118,16,25,0.18)] sm:h-[570px] ${hitFlash ? "ring-4 ring-[#e5c16b]/70" : ""}`}>
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_22%),radial-gradient(circle_at_80%_30%,rgba(167,14,24,0.08),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(229,193,107,0.18),transparent_25%)]" />
                  <div className="absolute left-[8%] top-[30%] text-xl opacity-20">✦</div>
                  <div className="absolute right-[10%] top-[42%] text-2xl opacity-20">✦</div>
                  <div className="absolute left-[18%] bottom-[28%] text-lg opacity-20">✧</div>
                  <div className="absolute right-[22%] bottom-[34%] text-xl opacity-20">✦</div>
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-[#a70e18]/10" />
                  <div className="absolute left-0 top-1/2 h-px w-full bg-[#a70e18]/10" />
                  <div className="absolute left-1/4 top-1/4 h-28 w-28 rounded-full border border-[#a70e18]/10" />
                  <div className="absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full border border-[#a70e18]/10" />
                </div>

                <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-center">
                  <div className="text-4xl drop-shadow sm:text-5xl">🌺</div>
                  <p className="mt-1 rounded-full bg-white/80 px-3 py-1 text-[8px] font-bold tracking-[0.2em] text-[#761019] shadow-sm">
                    MAA DURGA
                  </p>
                </div>

                {enemies.map((enemy) => (
                  <button
                    key={enemy.id}
                    type="button"
                    aria-label="Attack demon"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      hitEnemy(enemy.id);
                    }}
                    className="absolute z-20 flex touch-manipulation select-none items-center justify-center rounded-full transition-transform active:scale-75"
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                      // Slightly larger invisible hit area makes every demon
                      // reliably tappable, especially on mobile.
                      width: enemy.size + 18,
                      height: enemy.size + 18,
                      transform: `translate(-50%, -50%) rotate(${enemy.rotation}deg)`,
                      touchAction: "manipulation",
                    }}
                  >
                    <span
                      className="flex items-center justify-center rounded-full border-2 border-[#5d0710] bg-[radial-gradient(circle_at_35%_30%,#c93642,#8f1520_65%,#650711)] text-2xl shadow-[0_6px_18px_rgba(80,0,0,0.42)] ring-2 ring-[#f0c96b]/20 sm:text-3xl"
                      style={{ width: enemy.size, height: enemy.size }}
                    >
                      👹
                    </span>
                  </button>
                ))}

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10">
                  <div className="h-10 bg-[#761019]/10" />
                  <div className="flex h-20 items-center justify-center border-t-2 border-[#b88b38] bg-[#fff7e9]/95">
                    <div className="text-center">
                      <div className="text-3xl">🛕</div>
                      <p className="text-[8px] font-black tracking-[0.2em] text-[#761019]">
                        PROTECT THE TEMPLE
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#d7b66a] bg-white/90 px-4 py-2 text-[9px] font-black tracking-[0.15em] text-[#a70e18] shadow-lg">
                  {message}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[#e4d3bc] bg-white p-3 text-center">
                <p className="text-[10px] leading-5 text-[#8a7667]">
                  👹 Tap the demons before they reach the temple. More demons appear as you
                  play, while their speed keeps increasing until the final seconds.
                </p>
              </div>
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="bg-[#241b17] px-5 py-5 text-[#eadbc4]">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-3 text-[#e5c16b]">
            <i className="fa-solid fa-spa" />
            <div className="h-px w-12 bg-[#e5c16b]/30" />
            <i className="fa-solid fa-om text-xl" />
            <div className="h-px w-12 bg-[#e5c16b]/30" />
            <i className="fa-solid fa-spa" />
          </div>

          <p className="mt-5 text-lg font-bold tracking-[0.25em] text-[#e5c16b]">
            JAI MAA DURGA
          </p>

          <p className="mt-2 text-[10px] tracking-[0.25em] text-[#9c8b76]">
            A STRONGER COMMUNITY TOGETHER
          </p>

          <p className="mt-6 text-[10px] text-[#756658]">
            © 2026 BUH Durga Puja Committee. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
