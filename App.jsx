import { useMemo, useState } from "react";

const defaultState = {
  size: 1500,
  rooms: 3,
};

function App() {
  const [size, setSize] = useState(defaultState.size);
  const [rooms, setRooms] = useState(defaultState.rooms);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(() => {
    return "Train-on-CSV linear model served by FastAPI and consumed with React.";
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          size: Number(size),
          rooms: Number(rooms),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Request failed");
      }

      const data = await response.json();
      setEstimatedPrice(data.predicted_price);
    } catch (err) {
      setEstimatedPrice(null);
      setError(err.message || "Could not get prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="aurora a1" />
      <div className="aurora a2" />
      <main className="shell">
        <header className="hero">
          <p className="badge">Full Stack ML Demo</p>
          <h1>House Price Predictor</h1>
          <p>{subtitle}</p>
        </header>

        <section className="grid">
          <form className="panel" onSubmit={onSubmit}>
            <h2>Property Details</h2>
            <label htmlFor="size">Size (sq ft)</label>
            <input
              id="size"
              type="number"
              min="1"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              required
            />

            <label htmlFor="rooms">Rooms</label>
            <input
              id="rooms"
              type="number"
              min="1"
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict Price"}
            </button>

            {error && <p className="error">{error}</p>}
          </form>

          <article className="panel result">
            <h2>Estimated Price</h2>
            {estimatedPrice === null ? (
              <p className="hint">Submit values to view model output.</p>
            ) : (
              <p className="price">{estimatedPrice.toFixed(2)} lakh</p>
            )}
            <p className="small">Dataset columns used: size, rooms, price</p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
