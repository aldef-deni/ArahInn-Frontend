import { useEffect, useRef, useState } from "react";
import "./LoaderArahInn.css";

const messages = [
  "Menemukan hotel terbaik...",
  "Membandingkan harga terbaik...",
  "Memeriksa ketersediaan kamar...",
  "Menyiapkan perjalanan Anda..."
];

export default function LoaderArahInn() {
  const planeRef = useRef(null);
  const pathRef = useRef(null);

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    const plane = planeRef.current;

    if (!path || !plane) return;

    const length = path.getTotalLength();
    let start = null;
    const duration = 4500;

    const animate = (time) => {
      if (!start) start = time;

      const elapsed = (time - start) % duration;
      const progress = elapsed / duration;

      const point = path.getPointAtLength(progress * length);

      const next = path.getPointAtLength(
        Math.min(progress * length + 1, length)
      );

      const angle =
        (Math.atan2(next.y - point.y, next.x - point.x) * 180) /
        Math.PI;

      // Posisi dlm persen (viewBox 600x220) → responsif di ukuran layar mana pun
      plane.style.left = `${(point.x / 600) * 100}%`;
      plane.style.top = `${(point.y / 220) * 100}%`;
      plane.style.transform =
        `translate(-50%, -50%) rotate(${angle}deg)`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  return (
    <div className="arahinn-overlay">

      <div className="arahinn-modal">

        <div className="cloud cloud1">☁️</div>
        <div className="cloud cloud2">☁️</div>

        <div className="logo-wrapper">
          <img
            src="/arahinn-logo.png"
            alt="ArahInn"
            className="loader-logo"
          />
        </div>

        <div className="flight-container">

          <svg
            className="flight-svg"
            viewBox="0 0 600 220"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              ref={pathRef}
              d="M40 170 Q300 10 560 170"
              className="flight-path"
            />
          </svg>

          <div
            ref={planeRef}
            className="plane"
          >
            ✈️
          </div>

          <div className="hotel">
            🏨
          </div>

        </div>

        <div className="loader-text">
          {messages[messageIndex]}
        </div>

      </div>

    </div>
  );
}