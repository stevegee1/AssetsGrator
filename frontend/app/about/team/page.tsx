import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Team | AssetsGrator',
  description: 'Meet the team behind AssetsGrator — building the premier tokenised real-world asset platform.',
};

const TEAM = [
  {
    initials: 'AG',
    name: 'Founder & CEO',
    title: 'Founder & Chief Executive Officer',
    color: '#6366f1',
    bg: '#eef2ff',
    bio: 'Leads the company vision, strategy, and partnerships. Background spanning real estate investment, fintech, and institutional finance. Identified the gap between institutional-quality RWA investing and the lack of on-chain privacy, which became the founding thesis of AssetsGrator.',
    tags: ['Strategy', 'Real Estate', 'Partnerships'],
  },
  {
    initials: 'CTO',
    name: 'Chief Technology Officer',
    title: 'Chief Technology Officer',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    bio: 'Blockchain architect with expertise in smart contract development and DeFi protocol design. Designed and built the core ERC-3643 tokenized asset architecture and FeeManager smart contract powering AssetsGrator.',
    tags: ['Solidity', 'ERC-3643', 'Arbitrum'],
  },
  {
    initials: 'HC',
    name: 'Head of Compliance',
    title: 'Head of Compliance & Regulatory Affairs',
    color: '#10b981',
    bg: '#d1fae5',
    bio: 'Leads AssetsGrator\'s regulatory engagement including the FCA Regulatory Sandbox onboarding. Specialist in UK financial services regulation, COBS rules for investor classification, and the treatment of digital security tokens under UK law. Partners with Sumsub on the KYC/AML framework.',
    tags: ['FCA Sandbox', 'UK FSMA', 'AML', 'KYC'],
  },
  {
    initials: 'HL',
    name: 'Head of Legal',
    title: 'Head of Legal',
    color: '#f59e0b',
    bg: '#fef3c7',
    bio: 'Responsible for legal structuring of all tokenised assets, off-chain documentation (title deeds, licences, SPV structures), and investor agreements. Ensures that legal ownership rights correspond unambiguously to on-chain token holdings. Oversees review of all Terms of Service, Privacy Policy, and Risk Disclosure documents.',
    tags: ['Property Law', 'SPV Structuring', 'GDPR', 'UK FSMA'],
  },
  {
    initials: 'SM',
    name: 'Smart Contract Security',
    title: 'Smart Contract Auditor',
    color: '#8b5cf6',
    bg: '#ede9fe',
    bio: 'Leads internal smart contract security review, security testing, and co-ordinates third-party audits. Specialist in T-REX compliance module edge cases and smart contract optimization. Maintains the security posture of the FeeManager and core token contracts.',
    tags: ['Audit', 'Security', 'Penetration Testing'],
  },
  {
    initials: 'PM',
    name: 'Product & Design',
    title: 'Head of Product & Design',
    color: '#be185d',
    bg: '#fce7f3',
    bio: 'Owns the investor-facing platform experience — from the KYC onboarding flow to the portfolio dashboard. Applies user research insights to reduce friction for first-time RWA investors while maintaining the compliance-grade controls required for a regulated platform.',
    tags: ['UX Research', 'Product Strategy', 'Design Systems'],
  },
];

const ADVISORS = [
  {
    name: 'Advisory Board',
    desc: 'AssetsGrator benefits from a network of advisors spanning institutional real estate investment, blockchain cryptography, UK financial regulation, and ESG standards.',
  },
];

export default function TeamPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0f0a2e 0%, #1e1b4b 60%, #1a3a6b 100%)', padding: 'clamp(3.5rem, 8vw, 6rem) 1.25rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a5b4fc', marginBottom: 12 }}>The People</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>Meet the Team</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
            A multidisciplinary team combining expertise in real estate, blockchain cryptography, UK financial regulation, and institutional finance — united by the belief that institutional-grade RWA investing should be secure, compliant, and accessible.
          </p>
        </div>
      </section>

      {/* Team grid */}
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 1100 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Leadership</p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#111827', marginBottom: '2rem' }}>Core Team</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {TEAM.map((member) => (
              <div key={member.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: member.bg, border: `2px solid ${member.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: member.color, flexShrink: 0,
                  }}>
                    {member.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{member.title}</div>
                  </div>
                </div>

                {/* Bio */}
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0 }}>{member.bio}</p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {member.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 10px',
                      borderRadius: 999, background: member.bg, color: member.color, border: `1px solid ${member.color}33`,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisors */}
      <section className="section-pad" style={{ background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Advisory</p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Advisors &amp; Backers</h2>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
            <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0 }}>
              AssetsGrator benefits from a network of advisors spanning institutional real estate investment, blockchain cryptography, UK financial regulation, and ESG investment standards. Advisor profiles will be published following the close of our seed round.
            </p>
          </div>
        </div>
      </section>

      {/* Join us */}
      <section className="section-pad" style={{ background: 'var(--bg)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 540 }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, color: '#111827', marginBottom: 12 }}>We&rsquo;re Hiring</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            We&rsquo;re building a small, high-impact team. If you&rsquo;re passionate about privacy-preserving finance, blockchain infrastructure, or regulated fintech — we&rsquo;d love to hear from you.
          </p>
          <a href="mailto:careers@assetsgrator.com">
            <button className="btn btn-primary btn-lg">Get in Touch</button>
          </a>
        </div>
      </section>
    </main>
  );
}
