import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QR Manager — Create, Manage & Track QR Codes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #be185d 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background circles */}
                <div style={{
                    position: 'absolute',
                    top: '-100px',
                    left: '-100px',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-80px',
                    right: '-80px',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                }} />

                {/* Icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '96px',
                    height: '96px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '24px',
                    marginBottom: '32px',
                }}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="5" height="5" x="3" y="3" rx="1"/>
                        <rect width="5" height="5" x="16" y="3" rx="1"/>
                        <rect width="5" height="5" x="3" y="16" rx="1"/>
                        <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                        <path d="M21 21v.01"/>
                        <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                        <path d="M3 12h.01"/>
                        <path d="M12 3h.01"/>
                        <path d="M12 16v.01"/>
                        <path d="M16 12h1"/>
                        <path d="M21 12v.01"/>
                        <path d="M12 21v-1"/>
                    </svg>
                </div>

                {/* Brand name */}
                <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '20px',
                }}>
                    QR Manager
                </div>

                {/* Headline */}
                <div style={{
                    fontSize: '56px',
                    fontWeight: '900',
                    color: 'white',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    maxWidth: '900px',
                    marginBottom: '24px',
                    letterSpacing: '-0.02em',
                }}>
                    Create, Manage &amp; Track QR Codes
                </div>

                {/* Subtitle */}
                <div style={{
                    fontSize: '24px',
                    color: 'rgba(255,255,255,0.75)',
                    textAlign: 'center',
                    maxWidth: '700px',
                    lineHeight: 1.5,
                }}>
                    Dynamic QR codes · Real-time analytics · Enterprise-grade security
                </div>

                {/* Bottom pills */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '40px',
                }}>
                    {['Free to start', 'No credit card', 'GDPR compliant'].map((label) => (
                        <div key={label} style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: '999px',
                            padding: '8px 20px',
                            fontSize: '18px',
                            color: 'white',
                            fontWeight: '600',
                        }}>
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
