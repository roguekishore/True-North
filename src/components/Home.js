import { Link } from "react-router-dom";
import "../css/Home.css";

const features = [
  { 
    title: "Journal", 
    description: "Capture thoughts with a distraction-free editor.", 
    to: "/journal" 
  },
  { 
    title: "Habits", 
    description: "Track daily habits and visualize your progress.", 
    to: "/habit-tracker" 
  },
  { 
    title: "Trackers", 
    description: "Monitor health metrics and custom data points.", 
    to: "/trackers" 
  },
];

const Home = () => {
  return (
    <main className="home">
      <section className="home-hero">
        <span className="home-badge">↑ True North</span>
        <h1 className="home-title">
          Find your direction.<br />
          <span className="home-title--accent">Stay on course.</span>
        </h1>
        <p className="home-subtitle">
          A compass for your mind—journal, build habits, and navigate toward the person you want to become.
        </p>
        <div className="home-actions">
          <Link className="btn primary" to="/journal">Start writing</Link>
          <Link className="btn ghost" to="/entries">View entries</Link>
        </div>
      </section>

      <section className="home-features">
        {features.map((feature) => (
          <Link key={feature.title} to={feature.to} className="home-feature">
            <h3 className="home-feature__title">{feature.title}</h3>
            <p className="home-feature__desc">{feature.description}</p>
            <span className="home-feature__arrow">→</span>
          </Link>
        ))}
      </section>

      <section className="home-footer">
        <p className="home-footer__text">
          Your north star for personal growth. Synced securely.
        </p>
      </section>
    </main>
  );
};

export default Home;