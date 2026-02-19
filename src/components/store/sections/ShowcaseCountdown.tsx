import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  endsAt: string;
  title?: string;
}

export function ShowcaseCountdown({ endsAt, title }: Props) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (expired) return null;

  const blocks = [
    { label: "Dias", value: timeLeft.days },
    { label: "Horas", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Seg", value: timeLeft.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-4 md:py-6"
    >
      <div className="container text-center">
        {title && (
          <p className="font-sans text-xs font-bold uppercase tracking-wider text-accent mb-3">
            {title}
          </p>
        )}
        <div className="flex justify-center gap-3 md:gap-4">
          {blocks.map((b) => (
            <div
              key={b.label}
              className="flex flex-col items-center min-w-[56px] md:min-w-[72px] px-3 py-2.5 rounded-2xl bg-card border border-border/50 shadow-sm"
            >
              <span className="font-display text-2xl md:text-3xl font-bold text-foreground leading-none">
                {String(b.value).padStart(2, "0")}
              </span>
              <span className="font-sans text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
