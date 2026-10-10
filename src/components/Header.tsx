'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export const Header: React.FC = () => {
  const { lang, toggleLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: t('nav.home', 'Accueil') },
    { href: '/competitions', label: t('nav.competitions', 'Compétitions') },
    { href: '/classement', label: t('nav.rankings', 'Classement') },
    { href: '/resultats', label: t('nav.results', 'Résultats') },
    { href: '/creer-evenement', label: t('nav.createContest', 'Créer un concours') },
  ];


  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="top">
      <div className="wd" style={{ position: 'relative' }}>
        {/* LOGO */}
        <Link href="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          <i aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 6.9 7.1.3-5.5 4.6 1.8 7.2L12 17l-5.8 4 1.8-7.2L2.5 9.2l7.1-.3L12 2z" />
            </svg>
          </i>
          <span>MISS MISTER</span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="desktop-nav">
          {navLinks.slice(0, 4).map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? 'on' : ''}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ACTIONS: LANG + MOBILE MENU BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="lgb"
            onClick={toggleLang}
            title="Changer de langue"
          >
            {lang}
          </button>

          {/* HAMBURGER TOGGLE FOR MOBILE */}
          <button
            type="button"
            className="mobile-burger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              display: 'none',
              background: 'none',
              border: '1.5px solid var(--line)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              color: 'var(--ink)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg)',
            borderBottom: '2px solid var(--line)',
            boxShadow: '0 16px 32px rgba(0,0,0,0.25)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 60,
          }}
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.98rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--p)' : 'var(--ink)',
                  background: active ? 'var(--soft)' : 'transparent',
                }}
              >
                <span>{link.label}</span>
                <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>→</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
