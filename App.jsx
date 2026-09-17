import React, { useEffect, useState } from 'react'
import './styles.css'

const iconPaths = {
  Sparkles: <><path d="m12 3-1.2 4.2a2 2 0 0 1-1.4 1.4L5.2 10 9.4 11.2a2 2 0 0 1 1.4 1.4L12 16.8l1.2-4.2a2 2 0 0 1 1.4-1.4L18.8 10l-4.2-1.4a2 2 0 0 1-1.4-1.4L12 3Z" /><path d="m19 3-.4 1.6a1 1 0 0 1-.7.7L16.3 6l1.6.4a1 1 0 0 1 .7.7L19 8.7l.4-1.6a1 1 0 0 1 .7-.7l1.6-.4-1.6-.4a1 1 0 0 1-.7-.7L19 3Z" /></>,
  ShoppingCart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.7L20.5 8H6" /></>,
  Home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  Compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
  UserRound: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  Check: <path d="m5 12 4 4L19 6" />,
  MoreHorizontal: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  Sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
  ChevronRight: <path d="m9 18 6-6-6-6" />,
  CircleHelp: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1 .8-1.7 1.2-1.7 2.7M12 17h.01" /></>,
  UserRoundCog: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M19.4 15l.3.6  .7.1-.5.5.1.7-.6-.3-.6.3.1-.7-.5-.5.7-.1.3-.6Z" /></>,
  Bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  CircleHalf: <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18Z" /></>,
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  return <svg className="lucide-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

function SplashScreen() {
  return (
    <main className="splash-screen">
      <div className="app-icon"><Icon name="Sparkles" size={32} /></div>
      <h1>Northstar</h1>
      <p>Your day, beautifully organized.</p>
      <div className="loading-dots" aria-label="Loading" />
    </main>
  )
}

function Header() {
  return (
    <header className="app-header">
      <img className="app-logo" src="https://uploads.onecompiler.io/43y3uz32c/1789654567733/New%20Project%20(14).png" alt="Apple The Exchange TRX" />
      <button className="cart-button" aria-label="Shopping cart"><Icon name="ShoppingCart" size={19} /></button>
    </header>
  )
}

function HomePage() {
  return (
    <div className="page-content">
      <div className="hero-card"><div><div className="hero-label">DAILY FOCUS</div><h2>Small steps,<br /><em>big momentum.</em></h2><p>You've got this.</p></div><div className="sun"><Icon name="Sun" size={92} /></div></div>
      <div className="section-heading"><h3>Today</h3><button className="text-button">See all</button></div>
      <div className="task-card"><div className="check"><Icon name="Check" size={14} strokeWidth={2.5} /></div><div><strong>Morning meditation</strong><span>8:00 AM · 10 min</span></div><div className="task-more"><Icon name="MoreHorizontal" size={18} /></div></div>
      <div className="task-card"><div className="check empty" /><div><strong>Plan the week</strong><span>9:30 AM · Personal</span></div><div className="task-more"><Icon name="MoreHorizontal" size={18} /></div></div>
      <div className="section-heading quote-heading"><h3>Thought for today</h3></div>
      <div className="quote-card"><span className="quote-mark">“</span><p>The future depends on what you do today.</p><small>— Mahatma Gandhi</small></div>
    </div>
  )
}

function CatalogPage() {
  const items = [
    ['Morning routine', 'Start your day with intention.', '12 min'],
    ['Deep work session', 'Make space for focused progress.', '45 min'],
    ['Evening reflection', 'Close the day with gratitude.', '10 min'],
  ]

  return (
    <div className="page-content catalog-page">
      <p className="catalog-intro">Curated routines to help you find your rhythm.</p>
      <div className="catalog-list">
        {items.map(([title, description, duration]) => (
          <button className="catalog-card" key={title}>
            <span className="catalog-icon"><Icon name="Sparkles" size={18} /></span>
            <span className="catalog-copy"><strong>{title}</strong><small>{description}</small></span>
            <span className="catalog-duration">{duration} ›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProfilePage() {
  return <div className="page-content profile-page"><div className="profile-header"><div className="large-avatar">AM</div><h1>Alex Morgan</h1><p>alex@example.com</p></div><div className="settings-list"><button><span><Icon name="UserRoundCog" size={17} /></span> Personal information <b><Icon name="ChevronRight" size={18} /></b></button><button><span><Icon name="Bell" size={17} /></span> Notifications <b><Icon name="ChevronRight" size={18} /></b></button><button><span><Icon name="CircleHalf" size={17} /></span> Appearance <b><Icon name="ChevronRight" size={18} /></b></button><button><span><Icon name="CircleHelp" size={17} /></span> Help & support <b><Icon name="ChevronRight" size={18} /></b></button></div></div>
}

function Content({ tab }) {
  if (tab === 'catalog') return <CatalogPage />
  if (tab === 'profile') return <ProfilePage />
  return <HomePage />
}

function BottomNav({ tab, onTabChange }) {
  return (
    <nav className="tab-bar">
      <button className={tab === 'home' ? 'active' : ''} onClick={() => onTabChange('home')}><span><Icon name="Home" size={22} /></span>Home</button>
      <button className={tab === 'catalog' ? 'active' : ''} onClick={() => onTabChange('catalog')}><span><Icon name="Compass" size={22} /></span>Explore</button>
      <button className={tab === 'profile' ? 'active' : ''} onClick={() => onTabChange('profile')}><span><Icon name="UserRound" size={22} /></span>Profile</button>
    </nav>
  )
}

function AppShell() {
  const [tab, setTab] = useState('home')
  return (
    <div className="app-shell">
      <Header />
      <main className="shell-content"><Content tab={tab} /></main>
      <BottomNav tab={tab} onTabChange={setTab} />
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState('splash')
  useEffect(() => { const timer = setTimeout(() => setScreen('app'), 1800); return () => clearTimeout(timer) }, [])
  if (screen === 'splash') return <SplashScreen />
  return <AppShell />
}

export default App
