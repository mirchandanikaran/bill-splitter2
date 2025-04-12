/* Stylized App.jsx (see Canvas for full version) */
import { useState } from "react";

export default function App() {
  const [bill, setBill] = useState(0);
  const [people, setPeople] = useState([{ name: "", amount: 0 }]);

  const totalPaid = people.reduce((sum, person) => sum + (parseFloat(person.amount) || 0), 0);
  const billMatch = totalPaid === bill;

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Bill Splitter</h1>
        <input
          className="border p-2 mb-4 w-full"
          type="number"
          placeholder="Total Bill"
          value={bill}
          onChange={(e) => setBill(parseFloat(e.target.value))}
        />
        {people.map((person, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              className="border p-2 flex-1"
              placeholder="Name"
              value={person.name}
              onChange={(e) => {
                const updated = [...people];
                updated[idx].name = e.target.value;
                setPeople(updated);
              }}
            />
            <input
              className="border p-2 w-24"
              type="number"
              placeholder="Amount"
              value={person.amount}
              onChange={(e) => {
                const updated = [...people];
                updated[idx].amount = parseFloat(e.target.value);
                setPeople(updated);
              }}
            />
          </div>
        ))}
        <button
          onClick={() => setPeople([...people, { name: "", amount: 0 }])}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Person
        </button>
        <div className="mt-4 font-semibold">
          Total Paid: ₹{totalPaid.toFixed(2)}{" "}
          <span className={billMatch ? "text-green-600" : "text-red-600"}>
            ({billMatch ? "Matches Bill" : "Mismatch"})
          </span>
        </div>
      </div>
    </div>
  );
}
