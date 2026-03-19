export function CinematicBg() {
  return (
    <div className="cin-bg" aria-hidden="true">
      <div className="cin-bg__stars" />
      <div className="cin-bg__orb cin-bg__orb--red" />
      <div className="cin-bg__orb cin-bg__orb--blue" />
      <div className="cin-bg__orb cin-bg__orb--purple" />
      <div className="cin-bg__orb cin-bg__orb--gold" />
      <div className="cin-bg__cards">
        <div className="cin-card cin-card--1" />
        <div className="cin-card cin-card--2" />
        <div className="cin-card cin-card--3" />
        <div className="cin-card cin-card--4" />
        <div className="cin-card cin-card--5" />
        <div className="cin-card cin-card--6" />
      </div>
      <div className="cin-bg__scanline" />
      <div className="cin-bg__noise" />
      <div className="cin-bg__vignette" />
      <div className="cin-bg__fade" />
    </div>
  );
}
