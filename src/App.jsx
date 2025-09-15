import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function App() {
  const [sport, setSport] = useState("mlb");
  const [schedule, setSchedule] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [mode, setMode] = useState("quick");
  const [results, setResults] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (sport === "mlb") {
      fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`)
        .then((res) => res.json())
        .then((data) => {
          const games = data.dates[0]?.games || [];
          setSchedule(
            games.map((g) => ({
              id: g.gamePk,
              date: g.gameDate,
              away: g.teams.away.team.abbreviation,
              home: g.teams.home.team.abbreviation,
            }))
          );
        });
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
                away: away.team.abbreviation,
                home: home.team.abbreviation,
              };
            })
          );
        });
    }
  }, [sport]);

  const runModel = async () => {
    if (!selectedGame) return;
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
                onChange={(e) => {
                  const g = schedule.find((g) => g.id === e.target.value);
                  setSelectedGame(g);
                }}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2"
              >
                <option value="">-- Choose a matchup --</option>
                {schedule.map((g) => (
                  <option key={g.id} value={g.id}>
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
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg py-2"
            >
              Run Model
            </button>
          </div>
        </div>

        {/* Results Card */}
        {results && (
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
