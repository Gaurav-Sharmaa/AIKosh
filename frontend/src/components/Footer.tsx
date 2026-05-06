import {Link} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';

// Base visitor count — starts near 1,62,12,529 as seen in the screenshot
const BASE_VISITOR_COUNT = 16212529;

export default function Footer() {
    const [visitorCount, setVisitorCount] = useState(BASE_VISITOR_COUNT);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Small random increments every 4–10 seconds, mimicking real traffic
        const tick = () => {
            const increment = Math.floor(Math.random() * 3) + 1; // 1–3 per tick
            setVisitorCount(prev => prev + increment);
        };

        const schedule = () => {
            const delay = 4000 + Math.random() * 6000; // 4–10 s
            intervalRef.current = setTimeout(() => {
                tick();
                schedule();
            }, delay);
        };

        schedule();

        return () => {
            if (intervalRef.current) clearTimeout(intervalRef.current);
        };
    }, []);

    // Format like Indian numbering: 1,62,12,529
    const formatIndianNumber = (n: number): string => {
        const s = n.toString();
        if (s.length <= 3) return s;
        const last3 = s.slice(-3);
        const rest = s.slice(0, -3);
        // Group rest in pairs from the right
        const groups: string[] = [];
        let i = rest.length;
        while (i > 0) {
            groups.unshift(rest.slice(Math.max(0, i - 2), i));
            i -= 2;
        }
        return groups.join(',') + ',' + last3;
    };

    return (
        <footer style={{
            background: '#0e1420',
            color: '#d1d5db',
            marginTop: '64px',
            fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative wave lines — subtle background pattern matching screenshot */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
          radial-gradient(ellipse 80% 60% at 80% 110%, rgba(180,60,20,0.18) 0%, transparent 70%)
        `,
                pointerEvents: 'none',
            }}/>

            <div style={{maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 0', position: 'relative'}}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr 1fr 1fr 1fr',
                    gap: '40px',
                    alignItems: 'start',
                }}>

                    {/* Brand column */}
                    <div>
                        <Link to="/" style={{display: 'inline-block', textDecoration: 'none', marginBottom: '12px'}}>
                            <img
                                src="/india-ai-footer-logo.svg"
                                alt="IndiaAI"
                                style={{height: '48px', width: 'auto', display: 'block'}}
                            />
                        </Link>
                        <div style={{fontSize: '13px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5'}}>
                            Dataset Platform
                        </div>
                        <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '6px'}}>
                            Last Updated : {new Date().toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: '2-digit',
                        }).replace(/ /g, ' ')}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Visitors:&nbsp;
                            <span style={{
                                border: '1px solid #4b5563',
                                borderRadius: '12px',
                                padding: '2px 10px',
                                fontSize: '12px',
                                color: '#d1d5db',
                                fontVariantNumeric: 'tabular-nums',
                                transition: 'color 0.4s',
                            }}>
                {formatIndianNumber(visitorCount)}
              </span>
                        </div>
                    </div>

                    {/* AIKosh column */}
                    <div>
                        <h4 style={{color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '16px'}}>AIKosh</h4>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {[
                                {label: 'About us', href: '#'},
                                {label: 'Spotlight', href: '#'},
                                {label: 'Sitemap', href: '#'},
                            ].map(item => (
                                <li key={item.label}>
                                    <a href={item.href} style={{
                                        color: '#9ca3af',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        transition: 'color 0.15s'
                                    }}
                                       onMouseEnter={e => {
                                           (e.currentTarget as HTMLAnchorElement).style.color = '#FF9933';
                                       }}
                                       onMouseLeave={e => {
                                           (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                                       }}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources column */}
                    <div>
                        <h4 style={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>Resources</h4>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {[
                                {label: 'Datasets', to: '/datasets'},
                                {label: 'Models', to: '/models'},
                                {label: 'Use Cases', to: '/usecases'},
                                {label: 'Toolkits', to: '/toolkit'},
                                {label: 'Notebook', to: '#'},
                                {label: 'Competitions', to: '#'},
                                {label: 'Tutorials', to: '/tutorials'},
                                {label: 'Articles', to: '/articles'},
                            ].map(item => (
                                <li key={item.label}>
                                    <Link to={item.to} style={{
                                        color: '#9ca3af',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        transition: 'color 0.15s'
                                    }}
                                          onMouseEnter={e => {
                                              (e.currentTarget as HTMLAnchorElement).style.color = '#FF9933';
                                          }}
                                          onMouseLeave={e => {
                                              (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                                          }}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support column */}
                    <div>
                        <h4 style={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>Support</h4>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {[
                                {label: 'FAQs', href: '#'},
                                {label: 'Grievances', href: '#'},
                                {label: 'User Manual', href: '#'},
                            ].map(item => (
                                <li key={item.label}>
                                    <a href={item.href} style={{
                                        color: '#9ca3af',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        transition: 'color 0.15s'
                                    }}
                                       onMouseEnter={e => {
                                           (e.currentTarget as HTMLAnchorElement).style.color = '#FF9933';
                                       }}
                                       onMouseLeave={e => {
                                           (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                                       }}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social column */}
                    <div>
                        <h4 style={{color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '16px'}}>Follow
                            Us</h4>
                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                            {/* LinkedIn */}
                            <SocialIcon href="#" title="LinkedIn" label="in">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </SocialIcon>
                            {/* Facebook */}
                            <SocialIcon href="#" title="Facebook" label="f">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </SocialIcon>
                            {/* X / Twitter */}
                            <SocialIcon href="#" title="X (Twitter)" label="x">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </SocialIcon>
                            {/* YouTube */}
                            <SocialIcon href="#" title="YouTube" label="yt">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                                </svg>
                            </SocialIcon>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div style={{
                borderTop: '1px solid #1f2937',
                marginTop: '40px',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                maxWidth: '1280px',
                margin: '40px auto 0',
            }}>
                <p style={{fontSize: '12px', color: '#6b7280', margin: 0}}>
                    &copy; 2026 - Copyright AIKosh. All rights reserved. This portal is developed by National
                    e-Governance Division for AIKosh mission.
                </p>
                <div style={{display: 'flex', gap: '16px'}}>
                    <a href="#"
                       style={{fontSize: '12px', color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s'}}
                       onMouseEnter={e => {
                           (e.currentTarget as HTMLAnchorElement).style.color = '#FF9933';
                       }}
                       onMouseLeave={e => {
                           (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
                       }}
                    >
                        Terms of Use
                    </a>
                    <span style={{color: '#4b5563'}}>&bull;</span>
                    <a href="#"
                       style={{fontSize: '12px', color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s'}}
                       onMouseEnter={e => {
                           (e.currentTarget as HTMLAnchorElement).style.color = '#FF9933';
                       }}
                       onMouseLeave={e => {
                           (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
                       }}
                    >
                        Privacy Policy
                    </a>
                </div>
            </div>

            {/* Actual bottom padding */}
            <div style={{height: '16px'}}/>
        </footer>
    );
}

// ── Internal helper — social icon circle button ──
function SocialIcon({
                        href, title, children,
                    }: {
    href: string;
    title: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            title={title}
            style={{
                width: '34px', height: '34px',
                borderRadius: '50%',
                border: '1px solid #374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af',
                textDecoration: 'none',
                transition: 'border-color 0.15s, color 0.15s',
                flexShrink: 0,
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = '#FF9933';
                el.style.color = '#FF9933';
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = '#374151';
                el.style.color = '#9ca3af';
            }}
        >
            {children}
        </a>
    );
}