'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer>
      <div className="wd">
        <div className="fg">
          <div>
            <Link href="/" className="logo">
              <i aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 6.9 7.1.3-5.5 4.6 1.8 7.2L12 17l-5.8 4 1.8-7.2L2.5 9.2l7.1-.3L12 2z" />
                </svg>
              </i>
              <span>VoteMoi</span>
            </Link>
            <p>La plateforme officielle de vote pour vos élections universitaires et concours d&apos;élégance.</p>
            <p className="sm mute" style={{ marginTop: '14px' }}>
              Paiement sécurisé via Mobile Money (Orange Money, MTN MoMo). Aucun compte bancaire requis.
            </p>
          </div>

          <div>
            <h4>Plateforme</h4>
            <ul>
              <li><Link href="/competitions">Compétitions en cours</Link></li>
              <li><Link href="/classement">Classement en direct</Link></li>
              <li><Link href="/resultats">Résultats &amp; statistiques</Link></li>
            </ul>
          </div>

          <div>
            <h4>Créateur</h4>
            <p style={{ marginTop: 0 }}>Développé avec passion pour moderniser et fiabiliser les votes sur campus.</p>
            <ul style={{ marginTop: '12px' }}>
              <li>
                <a
                  href="https://www.facebook.com/share/1Hf5TYLo1o/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook — MK PROG
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/mk__prog?igsi=MWhyaXBtZDVidGdhYg%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram — @mk__prog
                </a>
              </li>
              <li>
                <a href="mailto:contact@votemoi.cm">contact@votemoi.cm</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="cp">
          <div>© {new Date().getFullYear()} VoteMoi. Tous droits réservés.</div>
          <div className="sg">
            Conçu et développé par{' '}
            <a
              href="https://www.instagram.com/mk__prog?igsi=MWhyaXBtZDVidGdhYg%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
            >
              MK PROG
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
