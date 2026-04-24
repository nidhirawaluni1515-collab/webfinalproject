import { useState } from "react";
import { exchangeRates } from "@/data/locations";

interface CurrencyConverterProps {
  defaultCurrency: string;
}

const currencies = Object.keys(exchangeRates);
// nidhi here 
export function CurrencyConverter({ defaultCurrency }: CurrencyConverterProps) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState(defaultCurrency);

  const convert = () => {
    const val = parseFloat(amount) || 0;
    const inUsd = val / exchangeRates[from];
    return (inUsd * exchangeRates[to]).toFixed(2);
  };

  const result = convert();

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">Currency Converter</h3>
      <p className="text-sm text-muted-foreground mb-6">Convert {from} to other currencies</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* To */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">To</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result}
              readOnly
              className="flex-1 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground"
            />
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="mt-6 rounded-lg bg-muted p-4 text-center">
        <span className="text-xl font-bold text-foreground">{amount} {from}</span>
        <span className="mx-3 text-muted-foreground">=</span>
        <span className="text-xl font-bold text-foreground">{result} {to}</span>
      </div>
    </div>
  );
}
