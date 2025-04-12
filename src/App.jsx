import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import QRCode from "qrcode";

export default function App() {
  const [bill, setBill] = useState(() => parseFloat(localStorage.getItem("bill")) || 0);
  const [people, setPeople] = useState(() => {
    const saved = localStorage.getItem("people");
    return saved ? JSON.parse(saved) : [{ name: "", amount: 0 }];
  });
  const [equalSplit, setEqualSplit] = useState(() => JSON.parse(localStorage.getItem("equalSplit")) || false);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("darkMode")) || false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    localStorage.setItem("bill", bill);
  }, [bill]);

  useEffect(() => {
    localStorage.setItem("people", JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem("equalSplit", JSON.stringify(equalSplit));
  }, [equalSplit]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const updatePerson = (index, field, value) => {
    const updated = [...people];
    updated[index][field] = field === "amount" ? parseFloat(value) : value;
    setPeople(updated);
  };

  const addPerson = () => {
    setPeople([...people, { name: "", amount: 0 }]);
  };

  const removePerson = (index) => {
    const updated = people.filter((_, i) => i !== index);
    setPeople(updated);
  };

  const equalAmount = bill / people.length;

  const settlements = () => {
    const balances = people.map((person) => ({
      name: person.name || "Unnamed",
      balance: (equalSplit ? 0 : (person.amount || 0)) - equalAmount,
    }));

    const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    const transactions = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(creditor.balance, -debtor.balance);

      transactions.push({ from: debtor.name, to: creditor.name, amount });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return transactions;
  };

  const settlementText = () =>
    settlements().map((t) => `${t.from} pays ₹${t.amount.toFixed(2)} to ${t.to}`).join("\n");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(settlementText());
  };

  const downloadAsText = () => {
    const blob = new Blob([settlementText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "settlements.txt";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const lines = settlementText().split("\n");
    lines.forEach((line, i) => {
      doc.text(line, 10, 10 + i * 10);
    });
    doc.save("settlements.pdf");
  };

  const generateQRCode = async () => {
    const url = await QRCode.toDataURL(settlementText());
    setQrCodeUrl(url);
  };

  const clearAll = () => {
    setPeople([{ name: "", amount: 0 }]);
    setBill(0);
    setEqualSplit(false);
    setQrCodeUrl("");
    localStorage.clear();
  };

  const totalPaid = people.reduce((sum, person) => sum + (parseFloat(person.amount) || 0), 0);
  const billMatch = totalPaid === bill;
  const pendingBalance = bill - totalPaid;

  return (
    <div className={`min-h-screen p-4 flex flex-col items-center transition-colors duration-300 ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      <Card className="w-full max-w-xl p-4">
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Bill Splitter</h1>
            <Button variant="secondary" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>

          <div>
            <label className="block mb-1">Total Bill</label>
            <Input
              type="number"
              placeholder="Enter total bill"
              value={bill}
              onChange={(e) => setBill(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={equalSplit}
              onChange={() => setEqualSplit(!equalSplit)}
            />
            <label>Equal Split</label>
          </div>

          {people.map((person, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 items-center">
              <Input
                placeholder="Name"
                value={person.name}
                onChange={(e) => updatePerson(index, "name", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount (optional)"
                value={person.amount || ""}
                onChange={(e) => updatePerson(index, "amount", e.target.value)}
                disabled={equalSplit}
              />
              <Button variant="destructive" onClick={() => removePerson(index)}>Remove</Button>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <Button onClick={addPerson}>Add Person</Button>
            <div className="text-sm font-medium">
              <span className={billMatch ? "text-green-600" : "text-red-600"}>
                Total Paid: ₹{totalPaid.toFixed(2)} {billMatch ? "(Matches Bill)" : "(Mismatch)"}
              </span>
              {!billMatch && (
                <span className="ml-4 text-yellow-600">Pending Balance: ₹{pendingBalance.toFixed(2)}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="destructive" onClick={clearAll}>Clear All</Button>
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-xl font-semibold mb-2">Amount Breakdown</h2>
            {people.map((person, index) => {
              const balance = (equalSplit ? 0 : (person.amount || 0)) - equalAmount;
              let label = "Owes";
              let color = "text-red-600";
              if (Math.abs(balance) < 0.01) {
                label = "Settled";
                color = "text-green-600";
              } else if (balance > 0) {
                label = "Paid Extra";
                color = "text-blue-600";
              }
              return (
                <div key={index} className="flex justify-between border-b py-1 text-sm">
                  <span>{person.name || `Person ${index + 1}`}</span>
                  <span className={color}>₹{balance.toFixed(2)} ({label})</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-xl font-semibold mb-2">Settlements</h2>
            {settlements().length === 0 ? (
              <p className="text-sm text-gray-500">No transactions needed. Everyone is settled!</p>
            ) : (
              <>
                <ul className="space-y-1 text-sm">
                  {settlements().map((t, idx) => (
                    <li key={idx}>
                      <strong>{t.from}</strong> pays <strong>₹{t.amount.toFixed(2)}</strong> to <strong>{t.to}</strong>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button onClick={copyToClipboard}>Copy to Clipboard</Button>
                  <Button onClick={downloadAsText}>Export as Text</Button>
                  <Button onClick={exportPDF}>Export as PDF</Button>
                  <Button onClick={generateQRCode}>Generate QR</Button>
                </div>
                {qrCodeUrl && (
                  <div className="mt-2 flex justify-center">
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
