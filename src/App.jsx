import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Spinner() {
  return (
    <motion.div
      className="flex items-center justify-center py-1"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    >
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
    </motion.div>
  );
}

export default function App() {
  const [sport, setSport] = useState("mlb");
  const [schedule, setSchedule] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [mode, setMode] = useState("quick");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Sweepy G Sports Models";
  }, []);

  useEffect(() => {
    setSelectedGame(null);
    setSchedule([]);
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split("T")[0];
    if (sport === "mlb") {
      fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`)
        .then((res) => res.json())
        .then((data) => {
          const games = data.dates[0]?.games || [];
          setSchedule(
            games.map((g) => {
              const awayTeam = g.teams.away.team;
              const homeTeam = g.teams.home.team;
              return {
                id: g.gamePk,
                date: g.gameDate,
                away: awayTeam.abbreviation || awayTeam.teamCode || awayTeam.name,
                home: homeTeam.abbreviation || homeTeam.teamCode || homeTeam.name,
              };
            })
          );
        })
        .catch(() => setError("Failed to load games"))
        .finally(() => setLoading(false));
    } else if (sport === "nfl") {
      const yyyymmdd = today.replace(/-/g, "");
      fetch(
        `https://site.api.espn.com/apis/v2/sports/football/nfl/scoreboard?dates=${yyyymmdd}`
      )
        .then((res) => res.json())
        .then((data) => {
          const games = data.events || [];
          setSchedule(
            games.map((ev) => {
              const comp = ev.competitions[0];
              const away = comp.competitors.find((t) => t.homeAway === "away");
              const home = comp.competitors.find((t) => t.homeAway === "home");
              return {
                id: ev.id,
                date: ev.date,
                away: away?.team?.abbreviation || away?.team?.shortDisplayName,
                home: home?.team?.abbreviation || home?.team?.shortDisplayName,
              };
            })
          );
        })
        .catch(() => setError("Failed to load games"))
        .finally(() => setLoading(false));
    }
  }, [sport]);

  const runModel = async () => {
    if (!selectedGame) return;
    setRunning(true);
    setResults(null);
    setSuccess(false);

    const payload = {
      sport,
      away_team: selectedGame.away,
      home_team: selectedGame.home,
      date: selectedGame.date.split("T")[0],
      mode,
    };
    const response = await fetch("/.netlify/functions/poisson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setResults(data);
    setRunning(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1200);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold tracking-tight text-center mb-8"
        >
          Sweepy G Sports Models
        </motion.h1>

        {/* Form Card */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm mb-2">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2"
              >
                <option value="mlb">MLB</option>
                <option value="nfl">NFL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Select Game</label>
              <select
                value={selectedGame?.id?.toString() || ""}
                onChange={(e) => {
                  const g = schedule.find((g) => g.id.toString() === e.target.value);
                  setSelectedGame(g);
                }}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2"
              >
                <option value="">-- Choose a matchup --</option>
                {loading && (
                  <option disabled>
                    <Spinner /> Loading...
                  </option>
                )}
                {error && <option disabled>{error}</option>}
                {!loading && !error && schedule.length === 0 && (
                  <option disabled>No games found</option>
                )}
                {schedule.map((g) => (
                  <option key={g.id} value={g.id.toString()}>
                    {g.away} @ {g.home} ({g.date.split("T")[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2"
              >
                <option value="quick">Quick</option>
                <option value="glm">GLM</option>
              </select>
            </div>

            <button
              onClick={runModel}
              disabled={running}
              className={`flex items-center justify-center gap-2 font-bold rounded-lg py-2 px-4 ${
                running
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {running ? (
                <>
                  <Spinner /> Running...
                </>
              ) : (
                "Run Model"
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {running && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-lg p-6 text-center">
            <Spinner />
            <p className="mt-2">Running model...</p>
          </div>
        )}
        <AnimatePresence>
          {success && !running && (
            <motion.div
              className="flex items-center justify-center text-green-400 mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        {results && !running && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            <pre className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
