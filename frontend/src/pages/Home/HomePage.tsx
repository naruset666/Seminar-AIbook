import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../../components/common/Reveal';
import Character from '../../components/home/Character';
import ContinueReading from '../../components/home/ContinueReading';
import Furniture from '../../components/home/Furniture';
import { useAuth } from '../../store/AuthContext';
import './HomePage.css';

// Hero scene first; scrolling down slides up the questionnaire button and then the
// signed-in user's documents to continue reading.
export default function HomePage() {
  const { user } = useAuth();
  const ctaRef = useRef<HTMLElement>(null);
  const [atTop, setAtTop] = useState(true);

  // The scroll hint only shows while the page is (almost) at the top.
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollDown = () => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="scene">
          <div className="reading-text">
            <img src="/assets/texthome.png" alt="U want reading?" />
          </div>

          <Furniture />
          <Character />
        </div>

        <button
          type="button"
          className={`scroll-hint ${atTop ? '' : 'hidden'}`}
          onClick={scrollDown}
          aria-label="เลื่อนลงเพื่อดูเพิ่มเติม"
          title="เลื่อนลง"
        >
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <section className="home-cta" ref={ctaRef}>
        <Reveal>
          <Link to="/questionnaire" className="quiz-button">
            เริ่มทำแบบทดสอบความชอบของคุณ
          </Link>
        </Reveal>
      </section>

      {user && <ContinueReading />}
    </main>
  );
}
