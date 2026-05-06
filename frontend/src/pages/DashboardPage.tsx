import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {getDashboard, getDatasets, getModels, getUseCases} from '../services/api';
import type {Dashboard, Dataset, Model, UseCase} from '../types';
import DatasetCard from '../components/DatasetCard';
import ModelCard from '../components/ModelCard';
import UseCaseCard from '../components/UseCaseCard';

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [useCases, setUseCases] = useState<UseCase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashRes, datasetsRes, modelsRes, useCasesRes] = await Promise.all([
                    getDashboard(),
                    getDatasets(),
                    getModels(),
                    getUseCases(),
                ]);
                setDashboard(dashRes.data);
                setDatasets(datasetsRes.data);
                setModels(modelsRes.data);
                setUseCases(useCasesRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #003366',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}/>
                <p style={{color: '#6b7280', fontSize: '14px', fontFamily: 'sans-serif'}}>Loading AIKosh portal...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div
            style={{fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f5f5f5', minHeight: '100vh'}}>

            {/* ── Hero Banner ── */}
            <div style={{
                background: 'linear-gradient(135deg, #003366 0%, #004080 60%, #005099 100%)',
                color: '#fff',
                padding: '0',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Saffron top stripe */}
                <div style={{
                    height: '6px',
                    background: 'linear-gradient(90deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)'
                }}/>

                {/* Decorative background pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                    backgroundSize: '20px 20px',
                }}/>

                <div style={{maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 40px', position: 'relative'}}>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap'}}>

                        {/* Emblem area */}
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.12)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {/* Ashoka Chakra simplified SVG */}
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                                <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"
                                        fill="none"/>
                                <circle cx="22" cy="22" r="4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"
                                        fill="none"/>
                                {Array.from({length: 24}).map((_, i) => {
                                    const angle = (i * 360) / 24;
                                    const rad = (angle * Math.PI) / 180;
                                    const x1 = 22 + 5 * Math.cos(rad);
                                    const y1 = 22 + 5 * Math.sin(rad);
                                    const x2 = 22 + 16 * Math.cos(rad);
                                    const y2 = 22 + 16 * Math.sin(rad);
                                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                                                 stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>;
                                })}
                            </svg>
                        </div>

                        <div style={{flex: 1}}>
                            <div style={{
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.7)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: '4px'
                            }}>
                                India AI &nbsp;|&nbsp; Government of India
                            </div>
                            <h1 style={{
                                margin: '0 0 4px',
                                fontSize: 'clamp(22px, 4vw, 34px)',
                                fontWeight: 700,
                                color: '#fff',
                                letterSpacing: '-0.5px'
                            }}>
                                AIKosh &nbsp;
                                <span style={{
                                    fontSize: 'clamp(14px, 2vw, 18px)',
                                    fontWeight: 400,
                                    color: 'rgba(255,255,255,0.8)'
                                }}>
                                  — राष्ट्रीय AI भण्डार
                                </span>
                            </h1>
                            <p style={{
                                margin: '0',
                                color: 'rgba(255,255,255,0.75)',
                                fontSize: '14px',
                                maxWidth: '560px',
                                lineHeight: '1.6'
                            }}>
                                India's National AI Repository for Datasets, Models, and Resources enabling
                                data-driven governance and innovation.
                            </p>
                        </div>
                    </div>

                    {/* Stat counters — no emojis, clean SVG icons instead */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px', marginTop: '36px',
                    }}>
                        {[
                            {
                                label: 'Datasets', labelHi: 'डेटासेट', value: datasets.length,
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                         stroke="rgba(255,153,51,0.9)" strokeWidth="1.8" strokeLinecap="round">
                                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                                    </svg>
                                ),
                            },
                            {
                                label: 'AI Models', labelHi: 'AI मॉडल', value: models.length,
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                         stroke="rgba(255,153,51,0.9)" strokeWidth="1.8" strokeLinecap="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                                        <path d="M8 21h8M12 17v4"/>
                                    </svg>
                                ),
                            },
                            {
                                label: 'Use Cases', labelHi: 'उपयोग', value: useCases.length,
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                         stroke="rgba(255,153,51,0.9)" strokeWidth="1.8" strokeLinecap="round">
                                        <path d="M9 11l3 3L22 4"/>
                                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                                    </svg>
                                ),
                            },
                            {
                                label: 'Organizations', labelHi: 'संगठन', value: '54+',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                         stroke="rgba(255,153,51,0.9)" strokeWidth="1.8" strokeLinecap="round">
                                        <path
                                            d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11"/>
                                    </svg>
                                ),
                            },
                        ].map((stat) => (
                            <div key={stat.label} style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                borderRadius: '8px',
                                padding: '16px 20px',
                                backdropFilter: 'blur(4px)',
                            }}>
                                <div style={{marginBottom: '4px'}}>{stat.icon}</div>
                                <div style={{
                                    fontSize: 'clamp(24px, 3vw, 32px)',
                                    fontWeight: 700,
                                    color: '#FF9933',
                                    lineHeight: 1
                                }}>
                                    {stat.value}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.85)',
                                    marginTop: '4px',
                                    fontWeight: 500
                                }}>
                                    {stat.label}
                                </div>
                                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '2px'}}>
                                    {stat.labelHi}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom border accent */}
                <div style={{height: '4px', background: '#FF9933', opacity: 0.6}}/>
            </div>

            {/* ── Main Content ── */}
            <div style={{maxWidth: '1280px', margin: '0 auto', padding: '32px 24px'}}>

                {/* User Activity Card */}
                {dashboard && (
                    <div style={{
                        background: '#fff',
                        border: '1px solid #dde1e7',
                        borderLeft: '4px solid #003366',
                        borderRadius: '4px',
                        padding: '20px 24px',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '24px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{flex: 1, minWidth: '200px'}}>
                            <div style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: '4px'
                            }}>
                                Welcome back
                            </div>
                            <div style={{fontSize: '18px', fontWeight: 600, color: '#003366', marginBottom: '2px'}}>
                                {dashboard.greeting}
                            </div>
                            <div style={{fontSize: '12px', color: '#6b7280'}}>Role: {dashboard.role}</div>
                        </div>

                        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                            {[
                                {label: 'Login Streak', value: `${dashboard.login_streak} days`, color: '#FF9933'},
                                {
                                    label: 'Datasets Viewed',
                                    value: dashboard.artifacts_viewed.datasets,
                                    color: '#003366'
                                },
                                {label: 'Models Viewed', value: dashboard.artifacts_viewed.models, color: '#003366'},
                                {
                                    label: 'Downloads',
                                    value: dashboard.artifacts_downloaded.datasets + dashboard.artifacts_downloaded.models,
                                    color: '#138808'
                                },
                            ].map((item) => (
                                <div key={item.label} style={{
                                    textAlign: 'center',
                                    padding: '10px 16px',
                                    background: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '4px',
                                    minWidth: '90px',
                                }}>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: item.color
                                    }}>{item.value}</div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#6b7280',
                                        marginTop: '2px'
                                    }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Links Navigation */}
                <div style={{marginBottom: '32px'}}>
                    <SectionHeading title="Quick Access" titleHi="त्वरित पहुँच"/>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '12px',
                        marginTop: '16px'
                    }}>
                        {[
                            {to: '/datasets', label: 'Datasets', labelHi: 'डेटासेट'},
                            {to: '/models', label: 'Models', labelHi: 'मॉडल'},
                            {to: '/usecases', label: 'Use Cases', labelHi: 'उपयोग'},
                            {to: '/toolkit', label: 'Toolkit', labelHi: 'टूलकिट'},
                            {to: '/tutorials', label: 'Tutorials', labelHi: 'ट्यूटोरियल'},
                            {to: '/articles', label: 'Articles', labelHi: 'लेख'},
                        ].map((link) => (
                            <Link key={link.to} to={link.to} style={{
                                display: 'block',
                                background: '#fff',
                                border: '1px solid #dde1e7',
                                borderTop: '3px solid #003366',
                                borderRadius: '4px',
                                padding: '14px 16px',
                                textDecoration: 'none',
                                transition: 'box-shadow 0.15s, border-color 0.15s',
                            }}
                                  onMouseEnter={e => {
                                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,51,102,0.12)';
                                  }}
                                  onMouseLeave={e => {
                                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                                  }}
                            >
                                <div style={{fontSize: '14px', fontWeight: 600, color: '#003366'}}>{link.label}</div>
                                <div style={{fontSize: '11px', color: '#6b7280', marginTop: '2px'}}>{link.labelHi}</div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Datasets Section */}
                <section style={{marginBottom: '40px'}}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <SectionHeading title="Datasets" titleHi="डेटासेट"/>
                        <ViewAllLink to="/datasets"/>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {datasets.slice(0, 6).map((dataset) => (
                            <DatasetCard key={dataset.id} dataset={dataset}/>
                        ))}
                    </div>
                </section>

                {/* Models Section */}
                <section style={{marginBottom: '40px'}}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <SectionHeading title="AI Models" titleHi="AI मॉडल"/>
                        <ViewAllLink to="/models"/>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {models.slice(0, 6).map((model) => (
                            <ModelCard key={model.id} model={model}/>
                        ))}
                    </div>
                </section>

                {/* Use Cases Section */}
                <section style={{marginBottom: '40px'}}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <SectionHeading title="Use Cases" titleHi="उपयोग के मामले"/>
                        <ViewAllLink to="/usecases"/>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {useCases.slice(0, 6).map((useCase) => (
                            <UseCaseCard key={useCase.id} useCase={useCase}/>
                        ))}
                    </div>
                </section>

                {/* Footer Note */}
                <div style={{
                    borderTop: '1px solid #dde1e7',
                    paddingTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}>
                    <p style={{fontSize: '12px', color: '#9ca3af', margin: 0}}>
                        Content maintained by Ministry of Electronics and Information Technology, Government of India
                    </p>
                    <p style={{fontSize: '12px', color: '#9ca3af', margin: 0}}>
                        Last Updated: {new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Internal helpers — not exported ──

function SectionHeading({title, titleHi}: { title: string; titleHi: string }) {
    return (
        <div>
            <h2 style={{
                margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a2e4a',
                display: 'flex', alignItems: 'baseline', gap: '8px',
            }}>
                {title}
                <span style={{fontSize: '13px', fontWeight: 400, color: '#6b7280'}}>{titleHi}</span>
            </h2>
            <div style={{height: '3px', width: '40px', background: '#FF9933', marginTop: '6px', borderRadius: '2px'}}/>
        </div>
    );
}

function ViewAllLink({to}: { to: string }) {
    return (
        <Link to={to} style={{
            color: '#003366', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px',
            border: '1px solid #003366', borderRadius: '3px', padding: '5px 12px',
            transition: 'background 0.15s',
        }}
              onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#003366';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#003366';
              }}
        >
            View All &rarr;
        </Link>
    );
}