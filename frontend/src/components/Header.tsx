import {Link} from 'react-router-dom';

export default function Header() {
    return (
        <header style={{
            background: '#fff',
            borderBottom: '1px solid #dde1e7',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
            {/* Top government strip */}
            <div style={{
                background: '#003366',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '11px',
                textAlign: 'center',
                padding: '4px 16px',
                letterSpacing: '0.04em',
            }}>
                India AI &nbsp;|&nbsp; Government of India
            </div>

            <div style={{maxWidth: '1280px', margin: '0 auto', padding: '0 24px'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '64px',
                }}>
                    {/* Logo + Nav */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '40px'}}>
                        <Link to="/"
                              style={{display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0}}>
                            <img
                                src="/ai-kosh-header-logo.svg"
                                alt="AIKosh — India AI"
                                style={{height: '40px', width: 'auto', display: 'block'}}
                            />
                        </Link>

                        <nav style={{display: 'flex', gap: '28px', alignItems: 'center'}}>
                            {[
                                {to: '/', label: 'Dashboard'},
                                {to: '/datasets', label: 'Datasets'},
                                {to: '/models', label: 'Models'},
                                {to: '/usecases', label: 'Use Cases'},
                                {to: '/toolkit', label: 'Toolkit'},
                                {to: '/tutorials', label: 'Tutorials'},
                                {to: '/articles', label: 'Articles'},
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    style={{
                                        color: '#374151',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.color = '#FF9933';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.color = '#374151';
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Profile button */}
                    <Link
                        to="/profile"
                        style={{
                            background: '#003366',
                            color: '#fff',
                            padding: '8px 18px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
                            transition: 'background 0.15s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#FF9933';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#003366';
                        }}
                    >
                        Profile
                    </Link>
                </div>
            </div>
        </header>
    );
}