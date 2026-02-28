import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const configuredBase = import.meta.env.VITE_API_BASE_URL;
  const apiBaseUrl = (configuredBase && configuredBase.trim() ? configuredBase : "")
    .trim()
    .replace(/\/$/, "");

  useEffect(() => {
    const loadHomepage = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/home`);
        if (!response.ok) {
          throw new Error("Request failed");
        }
        const payload = await response.json();
        setPageData(payload);
      } catch (err) {
        setError("Could not load page data from Node.js API.");
      } finally {
        setLoading(false);
      }
    };

    loadHomepage();
  }, []);

  if (loading) {
    return <main className="status">Loading website data...</main>;
  }

  if (error) {
    return <main className="status error">{error}</main>;
  }

  if (!pageData) {
    return <main className="status error">No data returned by API.</main>;
  }

  const serviceIcons = ["stack", "signal", "route", "shield"];

  return (
    <div className="page">
      <div className="bg-orb orb-one" />
      <div className="bg-orb orb-two" />
      <header className="topbar">
        <div className="brand">{pageData.brand}</div>
        <nav>
          <a href="#services">Services</a>
          <a href="#industries">Industries</a>
          <a href="#cases">Case Studies</a>
          <a href="#insights">Insights</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AI-First Product Engineering</p>
            <h1>{pageData.hero.title}</h1>
            <p>{pageData.hero.subtitle}</p>
            <div className="actions">
              <button>{pageData.hero.ctaPrimary}</button>
              <button className="secondary">{pageData.hero.ctaSecondary}</button>
            </div>
          </div>
          <div className="hero-graphic" aria-hidden="true">
            <div className="ring ring-a" />
            <div className="ring ring-b" />
            <div className="floating-card">
              <h4>Platform Health</h4>
              <div className="bars">
                <span />
                <span />
                <span />
                <span />
              </div>
              <p>99.9% uptime</p>
            </div>
          </div>
        </section>

        <section className="grid metrics">
          {pageData.metrics.map((item, index) => (
            <article className="card" key={item.label}>
              <h3>{item.value}</h3>
              <p>{item.label}</p>
              <div className="mini-line" aria-hidden="true">
                <span style={{ width: `${48 + index * 10}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section id="services">
          <h2>Service Pillars</h2>
          <div className="grid">
            {pageData.servicePillars.map((item, index) => (
              <article className="card" key={item.title}>
                <div className={`service-icon ${serviceIcons[index % serviceIcons.length]}`} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="industries">
          <h2>Industries</h2>
          <div className="chips">
            {pageData.industries.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section id="cases">
          <h2>Case Studies</h2>
          <div className="grid">
            {pageData.caseStudies.map((item) => (
              <article className="card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.result}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="insights">
          <h2>Latest Thoughts and Trends</h2>
          <ul className="insights">
            {pageData.insights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer>
        <p>
          Built with React frontend + Node.js backend API. Last updated:{" "}
          {new Date(pageData.updatedAt).toLocaleString()}
        </p>
      </footer>
    </div>
  );
}

export default App;
