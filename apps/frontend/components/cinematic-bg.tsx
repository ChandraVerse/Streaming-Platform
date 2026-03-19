/**
 * CinematicBg — Full-screen animated background for auth pages.
 *
 * Features:
 * - Animated glowing orbs (red, blue, purple, gold)
 * - Floating movie/series poster cards with real TMDB images
 * - Geometric shapes: hexagons, triangles, rings, diamonds, dot-grids, lines
 * - Starfield, scanline, film-grain noise, vignette, bottom fade
 *
 * Usage:
 *   import { CinematicBg } from "@/components/cinematic-bg";
 *   <CinematicBg theme="signin" />   // red-dominant (default)
 *   <CinematicBg theme="signup" />   // purple/blue-dominant
 */

interface CinematicBgProps {
  theme?: "signin" | "signup";
}

// TMDB poster images — sign-in set
const SIGNIN_POSTERS = [
  "https://image.tmdb.org/t/p/w185/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",  // Pulp Fiction
  "https://image.tmdb.org/t/p/w185/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",  // Thor
  "https://image.tmdb.org/t/p/w185/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",  // Avengers
  "https://image.tmdb.org/t/p/w185/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",  // Guardians
  "https://image.tmdb.org/t/p/w185/or06FN3Dka5tukK1e9sl16pB3iy.jpg",  // Shawshank
  "https://image.tmdb.org/t/p/w185/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg",  // Interstellar
  "https://image.tmdb.org/t/p/w185/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",  // The Dark Knight
  "https://image.tmdb.org/t/p/w185/lyXCfaoaa515OYZdnRAz5ZVFQUZ.jpg",  // Inception
];

// TMDB poster images — sign-up set (different titles)
const SIGNUP_POSTERS = [
  "https://image.tmdb.org/t/p/w185/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",  // Black Panther
  "https://image.tmdb.org/t/p/w185/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg",  // Doctor Strange
  "https://image.tmdb.org/t/p/w185/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",  // Dune
  "https://image.tmdb.org/t/p/w185/pThyQovXQrws2hmLinDiMSZnAGi.jpg",  // Spider-Man
  "https://image.tmdb.org/t/p/w185/kuf6dutpsT0vSVehic3EZIqkOBt.jpg",  // Oppenheimer
  "https://image.tmdb.org/t/p/w185/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",  // Harry Potter
  "https://image.tmdb.org/t/p/w185/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",  // The Matrix
  "https://image.tmdb.org/t/p/w185/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",  // John Wick
];

// Fallback gradient backgrounds if poster images fail to load
const FALLBACK_GRADIENTS = [
  "linear-gradient(160deg,#991b1b,#450a0a,#0f0f0f)",
  "linear-gradient(160deg,#1e40af,#0c1a4f,#0f0f0f)",
  "linear-gradient(160deg,#065f46,#022c22,#0f0f0f)",
  "linear-gradient(160deg,#6b21a8,#3b0764,#0f0f0f)",
  "linear-gradient(160deg,#92400e,#451a03,#0f0f0f)",
  "linear-gradient(160deg,#0e7490,#082f49,#0f0f0f)",
  "linear-gradient(160deg,#166534,#052e16,#0f0f0f)",
  "linear-gradient(160deg,#9f1239,#4c0519,#0f0f0f)",
];

// Card positions & animation for 8 poster cards
const CARD_STYLES = [
  { className: "cin-card--1", style: { width: 88, height: 132, top: "10%",  left: "4%",    animationDuration: "9s",  opacity: 0.75 } },
  { className: "cin-card--2", style: { width: 76, height: 114, top: "52%",  left: "2%",    animationDuration: "11s", opacity: 0.65, animationDirection: "reverse" as const } },
  { className: "cin-card--3", style: { width: 96, height: 144, top: "7%",   right: "5%",   animationDuration: "13s", opacity: 0.75 } },
  { className: "cin-card--4", style: { width: 72, height: 108, top: "58%",  right: "3%",   animationDuration: "10s", opacity: 0.65, animationDirection: "reverse" as const } },
  { className: "cin-card--5", style: { width: 80, height: 120, top: "28%",  left: "0.5%",  animationDuration: "14s", opacity: 0.55 } },
  { className: "cin-card--6", style: { width: 76, height: 114, top: "22%",  right: "1.5%", animationDuration: "12s", opacity: 0.55, animationDirection: "reverse" as const } },
  { className: "cin-card--7", style: { width: 68, height: 102, top: "75%",  left: "7%",    animationDuration: "15s", opacity: 0.45 } },
  { className: "cin-card--8", style: { width: 70, height: 105, top: "80%",  right: "7%",   animationDuration: "16s", opacity: 0.45, animationDirection: "reverse" as const } },
];

export function CinematicBg({ theme = "signin" }: CinematicBgProps) {
  const posters = theme === "signup" ? SIGNUP_POSTERS : SIGNIN_POSTERS;
  const isSignup = theme === "signup";

  return (
    <div className="cin-bg" aria-hidden="true">

      {/* ── Deep base gradient ─────────────────────────── */}
      <div
        className="cin-bg__base"
        style={{
          background: isSignup
            ? `radial-gradient(ellipse 700px 500px at 100% 0%,  rgba(124,58,237,0.2) 0%, transparent 60%),
               radial-gradient(ellipse 600px 500px at 0%   100%,rgba(29,78,216,0.16) 0%, transparent 60%),
               radial-gradient(ellipse 500px 400px at 50%  50%, rgba(229,9,20,0.08) 0%,  transparent 60%),
               radial-gradient(ellipse 350px 280px at 15%  20%, rgba(245,158,11,0.09) 0%, transparent 55%)`
            : `radial-gradient(ellipse 800px 600px at 0%   0%,  rgba(229,9,20,0.18) 0%, transparent 60%),
               radial-gradient(ellipse 600px 500px at 100% 100%,rgba(29,78,216,0.15) 0%, transparent 60%),
               radial-gradient(ellipse 500px 400px at 50%  50%, rgba(124,58,237,0.10) 0%,transparent 60%),
               radial-gradient(ellipse 400px 300px at 80%  10%, rgba(245,158,11,0.08) 0%, transparent 55%)`,
        }}
      />

      {/* ── Starfield ──────────────────────────────────── */}
      <div className="cin-bg__stars" />

      {/* ── Glowing orbs ───────────────────────────────── */}
      {isSignup ? (
        <>
          <div className="cin-bg__orb" style={{ width: 580, height: 580, background: "radial-gradient(circle,rgba(124,58,237,0.5) 0%,rgba(76,29,149,0.28) 40%,transparent 70%)", top: -150, right: -100, animation: "drift-blue 12s ease-in-out infinite alternate" }} />
          <div className="cin-bg__orb" style={{ width: 500, height: 500, background: "radial-gradient(circle,rgba(29,78,216,0.42) 0%,rgba(30,58,138,0.22) 40%,transparent 70%)", bottom: -100, left: -80,  animation: "drift-red 15s ease-in-out infinite alternate" }} />
          <div className="cin-bg__orb" style={{ width: 380, height: 380, background: "radial-gradient(circle,rgba(229,9,20,0.3) 0%,rgba(185,28,28,0.18) 40%,transparent 70%)",  top: "40%", left: "52%", transform: "translate(-50%,-50%)", animation: "drift-purple 18s ease-in-out infinite alternate" }} />
          <div className="cin-bg__orb" style={{ width: 300, height: 300, background: "radial-gradient(circle,rgba(245,158,11,0.28) 0%,rgba(180,83,9,0.16) 40%,transparent 70%)", top: "15%", left: "15%", animation: "drift-gold 10s ease-in-out infinite alternate" }} />
        </>
      ) : (
        <>
          <div className="cin-bg__orb cin-bg__orb--red" />
          <div className="cin-bg__orb cin-bg__orb--blue" />
          <div className="cin-bg__orb cin-bg__orb--purple" />
          <div className="cin-bg__orb cin-bg__orb--gold" />
        </>
      )}

      {/* ── Geometric shapes ───────────────────────────── */}
      <div className="cin-bg__geo">
        {isSignup ? (
          <>
            {/* Sign-up geometric arrangement (purple/blue dominant) */}
            <div className="geo geo-hex"         style={{ top: "8%",  right: "10%", width: 100, height: 115, animationDelay: "0.3s", borderColor: "rgba(124,58,237,0.3)" }} />
            <div className="geo geo-hex-2"       style={{ top: "60%", left:  "12%", width: 65,  height: 75,  animationDelay: "0.7s" }} />
            <div className="geo geo-hex-2"       style={{ top: "25%", left:  "20%", width: 50,  height: 58,  animationDelay: "1.0s", borderColor: "rgba(245,158,11,0.35)" }} />
            <div className="geo geo-tri-outline" style={{ top: "50%", right: "18%", width: 75,  height: 75,  animationDelay: "0.5s", borderColor: "rgba(229,9,20,0.3)" }} />
            <div className="geo geo-tri-outline" style={{ top: "78%", left:  "22%", width: 60,  height: 60,  animationDelay: "1.2s", borderColor: "rgba(124,58,237,0.3)" }} />
            <div className="geo geo-ring"        style={{ top: "35%", right: "8%",  width: 110, height: 110, animationDelay: "0.4s", borderColor: "rgba(124,58,237,0.28)" }} />
            <div className="geo geo-ring"        style={{ top: "18%", left:  "6%",  width: 90,  height: 90,  animationDelay: "0.9s", borderColor: "rgba(229,9,20,0.2)" }} />
            <div className="geo geo-ring-2"      style={{ top: "70%", right: "22%", width: 75,  height: 75,  animationDelay: "0.6s" }} />
            <div className="geo geo-diamond"     style={{ top: "55%", left:  "26%", width: 38,  height: 38,  animationDelay: "0.8s", borderColor: "rgba(245,158,11,0.32)" }} />
            <div className="geo geo-diamond"     style={{ top: "15%", right: "24%", width: 28,  height: 28,  animationDelay: "1.3s", borderColor: "rgba(124,58,237,0.3)" }} />
            <div className="geo geo-dots"        style={{ top: "65%", right: "10%", width: 110, height: 70,  animationDelay: "1.6s", opacity: 0.28 }} />
            <div className="geo geo-dots"        style={{ top: "5%",  left:  "8%",  width: 90,  height: 55,  animationDelay: "2s",   opacity: 0.22 }} />
            <div className="geo geo-line"        style={{ top: "42%", right: "4%",  width: 160, animationDelay: "1.1s", background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.45),transparent)" }} />
            <div className="geo geo-line"        style={{ top: "82%", left:  "6%",  width: 150, animationDelay: "1.5s" }} />
          </>
        ) : (
          <>
            {/* Sign-in geometric arrangement (red dominant) */}
            <div className="geo geo-hex"         style={{ top: "14%", left:  "12%", width: 90,  height: 104, animationDelay: "0.2s" }} />
            <div className="geo geo-hex"         style={{ top: "65%", right: "14%", width: 70,  height: 80,  animationDelay: "0.5s", borderColor: "rgba(124,58,237,0.3)" }} />
            <div className="geo geo-hex-2"       style={{ top: "40%", left:  "18%", width: 55,  height: 63,  animationDelay: "0.8s" }} />
            <div className="geo geo-hex-2"       style={{ top: "20%", right: "22%", width: 65,  height: 75,  animationDelay: "0.3s", borderColor: "rgba(245,158,11,0.3)" }} />
            <div className="geo geo-tri-outline" style={{ top: "72%", left:  "20%", width: 70,  height: 70,  animationDelay: "0.6s" }} />
            <div className="geo geo-tri-outline" style={{ top: "8%",  right: "28%", width: 55,  height: 55,  animationDelay: "1.0s", borderColor: "rgba(124,58,237,0.28)" }} />
            <div className="geo geo-ring"        style={{ top: "30%", left:  "8%",  width: 100, height: 100, animationDelay: "0.4s" }} />
            <div className="geo geo-ring"        style={{ top: "55%", right: "10%", width: 140, height: 140, animationDelay: "0.9s", borderColor: "rgba(29,78,216,0.22)" }} />
            <div className="geo geo-ring-2"      style={{ top: "80%", left:  "28%", width: 80,  height: 80,  animationDelay: "0.7s" }} />
            <div className="geo geo-diamond"     style={{ top: "48%", left:  "24%", width: 40,  height: 40,  animationDelay: "1.1s" }} />
            <div className="geo geo-diamond"     style={{ top: "18%", right: "16%", width: 30,  height: 30,  animationDelay: "0.6s", borderColor: "rgba(245,158,11,0.3)" }} />
            <div className="geo geo-dots"        style={{ top: "60%", left:  "10%", width: 120, height: 80,  animationDelay: "1.5s", opacity: 0.3 }} />
            <div className="geo geo-dots"        style={{ top: "10%", right: "10%", width: 100, height: 60,  animationDelay: "1.8s", opacity: 0.25 }} />
            <div className="geo geo-line"        style={{ top: "35%", left:  "5%",  width: 180, animationDelay: "1.2s" }} />
            <div className="geo geo-line"        style={{ top: "75%", right: "8%",  width: 140, animationDelay: "1.4s", background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.4),transparent)" }} />
          </>
        )}
      </div>

      {/* ── Movie poster cards ─────────────────────────── */}
      <div className="cin-bg__cards">
        {CARD_STYLES.map((card, i) => (
          <div
            key={i}
            className={`cin-card ${card.className}`}
            style={{
              width:    card.style.width,
              height:   card.style.height,
              top:      card.style.top,
              left:     "left" in card.style ? card.style.left : undefined,
              right:    "right" in card.style ? card.style.right : undefined,
              opacity:  card.style.opacity,
              animation: `float-card ${card.style.animationDuration} ease-in-out infinite${card.style.animationDirection === "reverse" ? " reverse" : ""}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posters[i]}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => {
                const el = e.currentTarget.parentElement as HTMLElement;
                el.style.background = FALLBACK_GRADIENTS[i] ?? FALLBACK_GRADIENTS[0];
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Overlays ───────────────────────────────────── */}
      <div className="cin-bg__scanline" />
      <div className="cin-bg__noise" />
      <div className="cin-bg__vignette" />
      <div className="cin-bg__fade" />
    </div>
  );
}
