'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Vote,
  BarChart2,
  Settings,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Inbox,
  Calendar,
  Ticket,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/keril', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/keril/finances', label: 'Finances & Paliers', icon: DollarSign },
    { href: '/keril/events', label: 'Événements', icon: Calendar },
    { href: '/keril/tickets', label: 'Billetterie', icon: Ticket },
    { href: '/keril/competitions', label: 'Compétitions', icon: Trophy },
    { href: '/keril/candidates', label: 'Candidats', icon: Users },
    { href: '/keril/requests', label: 'Demandes', icon: Inbox },
    { href: '/keril/votes', label: 'Votes', icon: Vote },
    { href: '/resultats', label: 'Résultats', icon: BarChart2 },
    { href: '/keril/settings', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/keril') return pathname === '/keril';
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('keril_admin_auth');
      window.location.href = '/keril';
    }
  };

  return (
    <>
      {/* Top Mobile Navigation Bar */}
      <div
        className="lg:hidden sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between"
        style={{ borderColor: 'var(--line)' }}
      >
        <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
          <Image src="/images/logo.png" alt="VoteMoi" width={120} height={32} style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          <span
            className="chip"
            style={{ fontSize: '0.65rem', padding: '2px 8px', marginLeft: '6px' }}
          >
            ADMIN
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn sm line"
          style={{ padding: '8px 12px' }}
          aria-label="Menu Admin"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 z-40"
        style={{
          background: 'var(--bg)',
          borderRight: '1px solid var(--line)',
          padding: '24px 20px',
        }}
      >
        {/* Brand Header */}
        <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--line)' }}>
          <Link href="/" className="logo" style={{ fontSize: '1.15rem' }}>
            <Image src="/images/logo.png" alt="VoteMoi" width={120} height={32} style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <div style={{ marginTop: '10px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--p)',
                background: 'var(--soft)',
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            >
              Organisateur /keril
            </span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingTop: '20px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  background: active ? 'var(--p)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--mute)',
                  boxShadow: active ? '0 4px 14px rgba(91, 61, 245, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--soft)';
                    e.currentTarget.style.color = 'var(--ink)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--mute)';
                  }
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: active ? '#ffffff' : 'var(--p)' }}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Security Banner & Logout */}
        <div
          style={{
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              background: 'var(--soft)',
              padding: '10px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.78rem',
            }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--p)' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Espace Sécurisé</div>
              <div className="mute" style={{ fontSize: '0.72rem' }}>Connecté sur /keril</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--a)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 90, 126, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--mute)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--soft)';
              e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--mute)';
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Voir le site public
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
              onClick={() => setIsOpen(false)}
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 p-6 flex flex-col justify-between z-10"
              style={{
                background: 'var(--bg)',
                borderRight: '1px solid var(--line)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div>
                <div
                  className="flex items-center justify-between pb-4"
                  style={{ borderBottom: '1px solid var(--line)' }}
                >
                  <Link href="/" className="logo">
                    <Image src="/images/logo.png" alt="VoteMoi" width={120} height={32} style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="cx"
                    style={{ position: 'static' }}
                  >
                    ✕
                  </button>
                </div>

                <nav
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingTop: '20px',
                  }}
                >
                  {links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          background: active ? 'var(--p)' : 'transparent',
                          color: active ? '#ffffff' : 'var(--mute)',
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: active ? '#ffffff' : 'var(--p)' }}
                        />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div
                style={{
                  paddingTop: '20px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--a)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--mute)',
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft className="w-4 h-4" /> Voir le site public
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
