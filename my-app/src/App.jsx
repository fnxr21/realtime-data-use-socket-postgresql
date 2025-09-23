// App.jsx
import { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const socket = io("http://localhost:4000");

export default function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load initial data
    fetch("http://localhost:4000/data")
      .then((res) => res.json())
      .then((rows) => setData(rows));

    // Listen for new realtime data
    socket.on("new_data", (row) => {
      setData((prev) => [...prev.slice(-49), row]); // keep last 50
    });

    return () => socket.off("new_data");
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Realtime Chart</h1>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="created_at" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
