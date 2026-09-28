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

const STARTING_PROTECTION = 42;
const MAX_PROTECTION = 100;
const HIT_REWARD = 7;
const TEMPLE_DAMAGE = 20;
const INITIAL_ENEMIES = 4;
const MAX_ENEMIES = 7;
const INITIAL_SPAWN_INTERVAL = 1250;
const MIN_SPAWN_INTERVAL = 650;
const MOVE_INTERVAL = 55;

// Fixed attack slots keep multiple Mahishasurs visible at the same time
// without allowing them to visually stack on top of one another.
// We deliberately use different horizontal lanes and staggered vertical
// entry points so the player has to keep watching different parts of the arena.
const ATTACK_SLOTS = [
  { x: 9, y: 14 },
  { x: 23, y: 32 },
  { x: 37, y: 12 },
  { x: 51, y: 36 },
  { x: 65, y: 15 },
  { x: 79, y: 34 },
  { x: 92, y: 13 },
];

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const isSlotClear = (
  slot: { x: number; y: number },
  existing: Enemy[]
) => {
  // Approximate the visual footprint of a demon in percentage space.
  // Horizontal and vertical spacing are intentionally generous for phones.
  return existing.every((enemy) => {
    const dx = Math.abs(enemy.x - slot.x);
    const dy = Math.abs(enemy.y - slot.y);
    return dx >= 12 || dy >= 16;
  });
};

const createEnemy = (
  id: number,
  preferredSlotIndex: number,
  existing: Enemy[] = []
): Enemy => {
  const preferred = ATTACK_SLOTS[preferredSlotIndex % ATTACK_SLOTS.length];

  // Prefer the requested attack slot, but never place a new demon inside
  // another demon's visual footprint. If the preferred slot is occupied,
  // choose the clearest available slot.
  const shuffled = [...ATTACK_SLOTS].sort(() => Math.random() - 0.5);
  const candidates = [preferred, ...shuffled];
  const slot =
    candidates.find((candidate) => isSlotClear(candidate, existing)) ??
    preferred;

  return {
    id,
    x: Math.max(7, Math.min(93, slot.x + randomBetween(-2.5, 2.5))),
    y: Math.max(8, Math.min(58, slot.y + randomBetween(-2, 2))),
    size: randomBetween(40, 48),
    speed: 0,
    rotation: randomBetween(-4, 4),
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

    const startingEnemies: Enemy[] = [];
    for (let index = 0; index < INITIAL_ENEMIES; index += 1) {
      const id = nextEnemyId.current++;
      startingEnemies.push(createEnemy(id, index, startingEnemies));
    }

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
      const baseSpeed = 0.62 + difficulty * 1.85;
      const spawnInterval =
        INITIAL_SPAWN_INTERVAL -
        difficulty * (INITIAL_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);

      const nextLevel =
        elapsedSeconds < 12
          ? 1
          : elapsedSeconds < 25
            ? 2
            : elapsedSeconds < 42
              ? 3
              : elapsedSeconds < 62
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
          const nextSpeed = Math.min(2.80, baseSpeed + (enemy.id % 5) * 0.045);
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
          // Multiple demons are allowed, but every new demon must occupy a
          // clearly separated attack slot. This prevents the phone layout
          // from becoming a pile of overlapping characters.
          const slotIndex = (id * 3 + Math.floor(elapsedSeconds / 4)) % ATTACK_SLOTS.length;
          remaining.push(createEnemy(id, slotIndex, remaining));
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
                  <div className="flex h-8 items-center justify-center text-[#761019]">
                    <i className="fa-solid fa-hand-pointer text-xl" />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-[#761019]">
                    TAP MAHISHASUR
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
              <div className={`relative mx-auto h-[560px] w-full max-w-7xl overflow-hidden rounded-[24px] border border-[#d7a83e] bg-[#26180f] shadow-[0_28px_80px_rgba(35,12,0,0.38)] sm:h-[680px] ${hitFlash ? "ring-4 ring-[#ffd76a]/80" : ""}`}>
                {/* Bright cinematic temple arena */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,225,170,0.06),rgba(30,8,3,0.16)), url('/images/games/save-temple-bg.webp')",
                    filter: "brightness(1.10) saturate(1.08) contrast(1.04)",
                  }}
                />

                {/* Warm cinematic atmosphere */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,220,145,0.10),transparent_42%),linear-gradient(180deg,rgba(10,6,8,0.20)_0%,transparent_24%,transparent_72%,rgba(12,4,2,0.32)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(10,4,3,0.34)_100%)]" />

                {/* Compact premium HUD — matching the reference */}
                <div className="absolute left-2 right-2 top-2 z-50 grid grid-cols-[0.82fr_0.72fr_2.25fr_0.82fr_0.82fr] overflow-hidden rounded-[18px] border border-[#a87825] bg-[#090914]/90 shadow-[0_10px_30px_rgba(0,0,0,0.42)] backdrop-blur-md sm:left-4 sm:right-4 sm:top-3 sm:rounded-[20px]">
                  <div className="flex min-h-[58px] flex-col items-center justify-center border-r border-[#8d6524]/70 px-1 sm:min-h-[70px]">
                    <p className="text-[7px] font-black tracking-[0.14em] text-[#d6b15c] sm:text-[9px]">SCORE</p>
                    <p className="mt-0.5 text-lg font-black leading-none text-white sm:text-2xl">{score}</p>
                  </div>

                  <div className="flex min-h-[58px] flex-col items-center justify-center border-r border-[#8d6524]/70 px-1 sm:min-h-[70px]">
                    <p className="text-[7px] font-black tracking-[0.14em] text-[#d6b15c] sm:text-[9px]">LEVEL</p>
                    <p className="mt-0.5 text-lg font-black leading-none text-white sm:text-2xl">{level}</p>
                  </div>

                  <div className="flex min-h-[58px] flex-col justify-center px-3 sm:min-h-[70px] sm:px-5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[7px] font-black tracking-[0.12em] text-[#e0c16c] sm:text-[9px]">TEMPLE PROTECTION</p>
                      <p className="text-[10px] font-black text-white sm:text-sm">{protection}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border border-[#c69a40] bg-[#17131b] shadow-inner sm:h-3">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#c81722_0%,#ef5b20_48%,#ffd96a_100%)] shadow-[0_0_12px_rgba(255,184,65,0.65)] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex min-h-[58px] flex-col items-center justify-center border-l border-[#8d6524]/70 px-1 sm:min-h-[70px]">
                    <p className="flex items-center gap-1 text-[7px] font-black tracking-[0.08em] text-[#d6b15c] sm:text-[9px]">
                      <i className="fa-solid fa-fire text-[#ff7a1a]" /> COMBO
                    </p>
                    <p className="mt-0.5 text-lg font-black leading-none text-[#f1b94e] sm:text-2xl">{combo}x</p>
                  </div>

                  <div className="flex min-h-[58px] flex-col items-center justify-center border-l border-[#8d6524]/70 px-1 sm:min-h-[70px]">
                    <p className="flex items-center gap-1 text-[7px] font-black tracking-[0.08em] text-[#d6b15c] sm:text-[9px]">
                      <i className="fa-solid fa-skull-crossbones text-[#e24a39]" /> DEMONS
                    </p>
                    <p className="mt-0.5 text-lg font-black leading-none text-white sm:text-2xl">{enemies.length}</p>
                  </div>
                </div>

                {/* Subtle gameplay particles */}
                <div className="pointer-events-none absolute inset-0 z-10">
                  <span className="absolute left-[18%] top-[27%] h-1.5 w-1.5 rounded-full bg-[#ffe59a] shadow-[0_0_10px_#ffe59a]" />
                  <span className="absolute left-[43%] top-[36%] h-1 w-1 rounded-full bg-[#fff1bd] shadow-[0_0_8px_#fff1bd]" />
                  <span className="absolute right-[20%] top-[30%] h-1.5 w-1.5 rounded-full bg-[#ffd978] shadow-[0_0_10px_#ffd978]" />
                </div>

                {/* Mahishasur enemies: multiple can attack together, but each is kept
                    in a separate attack slot so they never visually pile up. */}
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
                    className="absolute z-30 flex touch-manipulation select-none items-center justify-center transition-[filter,transform] duration-100 active:scale-90"
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                      width: enemy.size + 22,
                      height: enemy.size + 22,
                      transform: `translate(-50%, -50%) rotate(${enemy.rotation}deg)`,
                      touchAction: "manipulation",
                      filter: "drop-shadow(0 12px 12px rgba(20,5,0,0.48)) drop-shadow(0 0 10px rgba(255,116,35,0.16))",
                    }}
                  >
                    <img
                      src="/images/games/mahisasur-blue.webp"
                      alt="Mahishasur"
                      draggable={false}
                      className="pointer-events-none block h-full w-full object-contain"
                    />
                  </button>
                ))}

                {/* Temple breach zone */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-[92px] bg-gradient-to-t from-[#08050a]/65 via-[#10070a]/25 to-transparent sm:h-[112px]" />
                <div className="pointer-events-none absolute bottom-0 left-1/2 z-40 -translate-x-1/2">
                  <div className="mb-3 rounded-full border border-[#d5a83f] bg-[#090914]/92 px-5 py-2.5 text-[9px] font-black tracking-[0.08em] text-[#f1d27a] shadow-[0_8px_25px_rgba(0,0,0,0.45)] sm:px-7 sm:py-3 sm:text-[11px]">
                    {message}
                  </div>
                </div>

                {/* Protection warning glow */}
                {protection <= 25 && (
                  <div className="pointer-events-none absolute inset-0 z-15 animate-pulse border-2 border-red-500/40 shadow-[inset_0_0_70px_rgba(220,30,20,0.22)]" />
                )}
              </div>

              <div className="mt-3 text-center">
                <p className="text-[9px] font-medium tracking-[0.04em] text-[#8a7667] sm:text-[10px]">
                  Hit Mahishasur to restore Shakti. Every demon that reaches the temple drains protection.
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
