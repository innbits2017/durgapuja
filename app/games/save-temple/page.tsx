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
  flip: boolean;
  depth: number;
};

const STARTING_PROTECTION = 42;
const MAX_PROTECTION = 100;
const HIT_REWARD = 7;
const TEMPLE_DAMAGE = 20;
const INITIAL_ENEMIES = 7;
const MAX_ENEMIES = 18;
const INITIAL_SPAWN_INTERVAL = 900;
const MIN_SPAWN_INTERVAL = 360;
const MOVE_INTERVAL = 55;

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const createEnemy = (id: number): Enemy => {
  const depth = randomBetween(0.72, 1.12);

  return {
    id,
    x: randomBetween(7, 93),
    y: randomBetween(8, 47),
    size: randomBetween(82, 128) * depth,
    speed: 0,
    rotation: randomBetween(-7, 7),
    flip: id % 2 === 0,
    depth,
  };
};

export default function ProtectMaaDurgaPage() {
  const nextEnemyId = useRef(0);
  const gameActiveRef = useRef(false);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);
  const protectionRef = useRef(STARTING_PROTECTION);
  const elapsedMsRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const comboRef = useRef(0);
  const killedEnemyIdsRef = useRef<Set<number>>(new Set());

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [protection, setProtection] = useState(STARTING_PROTECTION);
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
    setMessage("The temple has fallen. Jai Maa Durga!");

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
    protectionRef.current = STARTING_PROTECTION;
    elapsedMsRef.current = 0;
    lastTickRef.current = performance.now();
    lastSpawnRef.current = performance.now();
    comboRef.current = 0;
    killedEnemyIdsRef.current = new Set();
    nextEnemyId.current = 0;

    const startingEnemies = Array.from({ length: INITIAL_ENEMIES }, () => {
      const id = nextEnemyId.current++;
      return createEnemy(id);
    });

    setEnemies(startingEnemies);
    setGameStarted(true);
    setGameOver(false);
    setProtection(STARTING_PROTECTION);
    setScore(0);
    setHits(0);
    setMisses(0);
    setLevel(1);
    setCombo(0);
    setHitFlash(false);
    setMessage("Protect Maa Durga!");
  };

  const hitEnemy = (enemyId: number) => {
    if (!gameActiveRef.current || killedEnemyIdsRef.current.has(enemyId)) return;

    killedEnemyIdsRef.current.add(enemyId);

    setEnemies((current) => current.filter((enemy) => enemy.id !== enemyId));

    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    const points = 10 + Math.min(nextCombo - 1, 5) * 5;
    scoreRef.current += points;

    const nextProtection = Math.min(
      MAX_PROTECTION,
      protectionRef.current + HIT_REWARD
    );
    protectionRef.current = nextProtection;

    setScore(scoreRef.current);
    setProtection(nextProtection);
    setHits((value) => value + 1);
    setCombo(nextCombo);
    setHitFlash(true);
    setMessage(`+${points} • +${HIT_REWARD}% SHAKTI • ${nextCombo}x COMBO`);

    window.setTimeout(() => setHitFlash(false), 120);

    window.setTimeout(() => {
      if (gameActiveRef.current) {
        setMessage("Protect Maa Durga!");
      }
    }, 550);
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

  // Main movement + dynamic spawning loop. There is no fixed timer: the
  // challenge keeps going until the temple protection bar reaches zero.
  // Demons become faster and spawn more frequently the longer you survive.
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const movementTimer = window.setInterval(() => {
      if (!gameActiveRef.current) return;

      const now = performance.now();
      const delta = Math.min(250, Math.max(0, now - lastTickRef.current));
      lastTickRef.current = now;
      elapsedMsRef.current += delta;

      const elapsedSeconds = elapsedMsRef.current / 1000;
      const difficulty = 1 - Math.exp(-elapsedSeconds / 38);
      const baseSpeed = 0.48 + difficulty * 1.55;
      const spawnInterval =
        INITIAL_SPAWN_INTERVAL -
        difficulty * (INITIAL_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);

      const nextLevel =
        elapsedSeconds < 15
          ? 1
          : elapsedSeconds < 30
            ? 2
            : elapsedSeconds < 50
              ? 3
              : elapsedSeconds < 75
                ? 4
                : 5;
      setLevel((currentLevel) =>
        currentLevel === nextLevel ? currentLevel : nextLevel
      );

      let shouldSpawn = now - lastSpawnRef.current >= spawnInterval;
      if (shouldSpawn) lastSpawnRef.current = now;

      setEnemies((current) => {
        const remaining: Enemy[] = [];
        let reached = 0;

        current.forEach((enemy) => {
          const nextSpeed = Math.min(2.35, baseSpeed + (enemy.id % 6) * 0.035);
          const nextY = enemy.y + nextSpeed * (delta / MOVE_INTERVAL);

          if (nextY >= 78) {
            reached += 1;
            return;
          }

          remaining.push({
            ...enemy,
            speed: nextSpeed,
            y: nextY,
            rotation: enemy.rotation + 0.12,
          });
        });

        if (shouldSpawn && remaining.length < MAX_ENEMIES) {
          const id = nextEnemyId.current++;
          remaining.push(createEnemy(id));
        }

        if (reached > 0) {
          const damage = reached * TEMPLE_DAMAGE;
          const nextProtection = Math.max(0, protectionRef.current - damage);
          protectionRef.current = nextProtection;

          setMisses((value) => value + reached);
          setProtection(nextProtection);
          setCombo(0);
          comboRef.current = 0;
          setMessage(
            reached === 1
              ? `A demon hit the temple! -${TEMPLE_DAMAGE}% protection`
              : `${reached} demons hit the temple! -${damage}% protection`
          );

          if (nextProtection <= 0) {
            window.setTimeout(() => endGame(), 0);
          }
        }

        return remaining;
      });
    }, MOVE_INTERVAL);

    return () => window.clearInterval(movementTimer);
  }, [gameStarted, gameOver]);

  const progress = protection;

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
              <i className="fa-solid fa-shield-heart mr-2 text-[#a70e18]" />
              PROTECT THE TEMPLE
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
                Tap the 👹 demons before they reach the temple. Every hit restores
                the temple protection bar. Every demon that reaches the temple drains
                it heavily. The challenge ends only when the protection bar reaches zero.
              </p>

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <div className="text-2xl">👹</div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    TAP
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <div className="text-2xl">🛡️</div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    TEMPLE SHIELD
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <div className="text-2xl">⚡</div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    +7% PER HIT
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
                  <p className="text-[9px] font-bold text-[#8a6c45]">DEMONS HIT</p>
                  <p className="mt-1 text-xl font-black text-[#a70e18]">
                    {hits}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                  <p className="text-[9px] font-bold text-[#8a6c45]">
                    TEMPLE BREACHES
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
                  : "Jai Maa Durga! Protect the temple for longer next time."}
              </p>
            </div>
          ) : (
            <>
              {/* CINEMATIC GAME ARENA */}
              <div
                className={`relative mx-auto min-h-[620px] w-full max-w-7xl overflow-hidden rounded-[28px] border border-[#d8a94b] bg-[#090711] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:min-h-[700px] ${
                  hitFlash ? "ring-4 ring-[#ffd86b]/80" : ""
                }`}
              >
                {/* Premium temple background */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/images/games/maa-durga-temple-arena.png')",
                  }}
                />

                {/* Cinematic color grading */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,14,0.68)_0%,rgba(8,5,12,0.18)_30%,rgba(17,6,7,0.08)_55%,rgba(8,4,7,0.72)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_20%,rgba(0,0,0,0.34)_75%,rgba(0,0,0,0.72)_100%)]" />

                {/* Warm temple glow */}
                <div className="pointer-events-none absolute left-1/2 top-[46%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffb52b]/15 blur-3xl" />

                {/* Atmospheric particles */}
                <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
                  <span className="absolute left-[12%] top-[30%] h-1 w-1 rounded-full bg-[#ffd76a] shadow-[0_0_14px_5px_rgba(255,191,55,0.55)]" />
                  <span className="absolute left-[27%] top-[20%] h-1.5 w-1.5 rounded-full bg-[#fff0b0] shadow-[0_0_15px_5px_rgba(255,202,76,0.5)]" />
                  <span className="absolute right-[18%] top-[31%] h-1 w-1 rounded-full bg-[#ffd76a] shadow-[0_0_14px_5px_rgba(255,191,55,0.55)]" />
                  <span className="absolute right-[35%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#fff0b0] shadow-[0_0_15px_5px_rgba(255,202,76,0.5)]" />
                  <span className="absolute left-[42%] top-[27%] text-sm text-[#ffd36a] opacity-70">✦</span>
                  <span className="absolute right-[28%] top-[42%] text-xs text-[#ffd36a] opacity-60">✦</span>
                </div>

                {/* TOP CINEMATIC HUD */}
                <div className="absolute left-3 right-3 top-3 z-40 grid grid-cols-2 gap-2 sm:left-5 sm:right-5 sm:top-5 sm:grid-cols-[0.9fr_0.55fr_2fr_0.8fr_0.8fr] sm:gap-2">
                  <div className="rounded-2xl border border-[#c99a3c] bg-[#090811]/90 px-4 py-2.5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <p className="text-[8px] font-black tracking-[0.2em] text-[#e8c66d] sm:text-[10px]">SCORE</p>
                    <p className="mt-0.5 text-2xl font-black text-white sm:text-3xl">{score}</p>
                  </div>

                  <div className="rounded-2xl border border-[#c99a3c] bg-[#090811]/90 px-4 py-2.5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <p className="text-[8px] font-black tracking-[0.2em] text-[#e8c66d] sm:text-[10px]">LEVEL</p>
                    <p className="mt-0.5 text-2xl font-black text-white sm:text-3xl">{level}</p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-[#c99a3c] bg-[#090811]/90 px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:col-span-1">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[8px] font-black tracking-[0.15em] text-[#e8c66d] sm:text-[10px]">TEMPLE PROTECTION</p>
                      <p className="text-sm font-black text-white sm:text-base">{protection}%</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border border-[#a87525] bg-[#160f13] shadow-inner">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#b50918_0%,#f23b21_38%,#ffad3d_70%,#ffe38a_100%)] shadow-[0_0_18px_rgba(255,156,42,0.65)] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#c99a3c] bg-[#090811]/90 px-4 py-2.5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <p className="text-[8px] font-black tracking-[0.2em] text-[#e8c66d] sm:text-[10px]">COMBO</p>
                    <p className="mt-0.5 text-2xl font-black text-[#ffbd45] sm:text-3xl">{combo}x</p>
                  </div>

                  <div className="rounded-2xl border border-[#c99a3c] bg-[#090811]/90 px-4 py-2.5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <p className="text-[8px] font-black tracking-[0.2em] text-[#e8c66d] sm:text-[10px]">DEMONS</p>
                    <p className="mt-0.5 text-2xl font-black text-white sm:text-3xl">{enemies.length}</p>
                  </div>
                </div>

                {/* Small status chips */}
                <div className="absolute left-4 top-[132px] z-40 rounded-full border border-[#c99a3c] bg-[#090811]/90 px-3 py-1.5 text-[9px] font-black tracking-[0.12em] text-[#f4d37c] shadow-lg backdrop-blur-md sm:left-6 sm:top-[126px]">
                  <i className="fa-solid fa-fire mr-1 text-[#ff6b2d]" /> {combo}x COMBO
                </div>

                <div className="absolute right-4 top-[132px] z-40 rounded-full border border-[#c99a3c] bg-[#090811]/90 px-3 py-1.5 text-[9px] font-black tracking-[0.12em] text-[#f4d37c] shadow-lg backdrop-blur-md sm:right-6 sm:top-[126px]">
                  <i className="fa-solid fa-skull mr-1 text-[#ff5a45]" /> {enemies.length} DEMONS
                </div>

                {/* MAA DURGA PROTECTION AURA */}
                <div className="pointer-events-none absolute bottom-[17%] left-1/2 z-[6] h-28 w-64 -translate-x-1/2 rounded-full bg-[#ffb92f]/20 blur-3xl" />

                {/* MAHISHASUR ATTACKERS */}
                {enemies.map((enemy) => (
                  <button
                    key={enemy.id}
                    type="button"
                    aria-label="Attack Mahishasur"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      hitEnemy(enemy.id);
                    }}
                    className="absolute z-20 flex touch-manipulation select-none items-center justify-center transition-[filter,transform] duration-100 active:scale-90"
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                      width: enemy.size + 34,
                      height: enemy.size + 34,
                      transform: `translate(-50%, -50%) rotate(${enemy.rotation}deg)`,
                      touchAction: "manipulation",
                      filter: "drop-shadow(0 18px 14px rgba(0,0,0,0.62)) drop-shadow(0 0 12px rgba(255,55,20,0.20))",
                    }}
                  >
                    <span
                      className="relative block"
                      style={{
                        width: enemy.size,
                        height: enemy.size * 1.08,
                        transform: enemy.flip ? "scaleX(-1)" : undefined,
                      }}
                    >
                      <img
                        src="/images/games/mahishasur-warrior.png"
                        alt=""
                        draggable={false}
                        className="h-full w-full select-none object-contain"
                      />
                      <span className="pointer-events-none absolute inset-x-[24%] bottom-0 h-[18%] rounded-full bg-black/45 blur-md" />
                    </span>
                  </button>
                ))}

                {/* Temple protection zone */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-[24%]">
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent to-black/35" />
                  <div className="absolute inset-x-0 bottom-0 h-20 border-t border-[#e0ad47]/70 bg-gradient-to-t from-[#07050b]/95 via-[#10080c]/80 to-transparent" />
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-[#d9a944]/80 bg-[#090811]/90 px-5 py-2 text-center shadow-[0_0_25px_rgba(230,164,52,0.2)] backdrop-blur-md">
                    <p className="text-[9px] font-black tracking-[0.2em] text-[#f2cd73]">PROTECT MAA DURGA</p>
                    <p className="mt-0.5 text-[8px] tracking-[0.12em] text-white/60">KEEP MAHISHASUR AWAY FROM THE TEMPLE</p>
                  </div>
                </div>

                {/* Floating gameplay message */}
                <div className="pointer-events-none absolute bottom-[25%] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#d9a944] bg-[#090811]/90 px-5 py-2 text-[9px] font-black tracking-[0.14em] text-[#ffd66f] shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
                  {message}
                </div>

                {/* Cinematic vignette */}
                <div className="pointer-events-none absolute inset-0 z-50 shadow-[inset_0_0_100px_rgba(0,0,0,0.62)]" />
              </div>

              <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-[#b88b38]/50 bg-[#0b0911] px-4 py-3 text-center shadow-lg">
                <p className="text-[10px] leading-5 text-[#d8c59c]">
                  Tap the Mahishasur warriors before they reach Maa Durga. Every successful hit restores temple protection; every breach drains it heavily. The attack grows faster as you survive.
                </p>
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
