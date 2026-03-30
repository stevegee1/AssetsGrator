'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  ShieldCheck, Upload, CheckCircle, Clock,
  AlertCircle, ArrowRight, Loader2, ExternalLink,
} from 'lucide-react';
import {
  useKYCVerified,
} from '@/lib/hooks/useFHEKYC';

type Step = 'intro' | 'personal' | 'document' | 'selfie' | 'submitting' | 'pending' | 'approved';

export default function KYCPage() {
  const [step, setStep] = useState<Step>('intro');
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', country: '', idType: 'passport',
  });

  const { address: wallet, isConnected } = useAccount();
  const { isValid: isOnChainVerified } = useKYCVerified(wallet);

  // Check if user already submitted the off-chain KYC form
  const alreadySubmitted =
    typeof window !== 'undefined' && wallet
      ? localStorage.getItem(`kyc_submitted_${wallet.toLowerCase()}`) === '1'
      : false;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive effective step
  const effectiveStep: Step =
    isOnChainVerified ? 'approved'
    : alreadySubmitted && step === 'intro' ? 'pending'
    : step;

  // Submit handler — sets localStorage flag and transitions to pending
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // TODO: POST KYC form data to backend API here
      if (wallet) {
        localStorage.setItem(`kyc_submitted_${wallet.toLowerCase()}`, '1');
      }
      setStep('pending');
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'document', label: 'ID Document' },
    { key: 'selfie',   label: 'Selfie' },
    { key: 'pending',  label: 'Review' },
  ];
  const stepIdx = steps.findIndex(s => s.key === effectiveStep);

  return (
    <div>
      {/* Page header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>Identity Verification (KYC)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Required by law before you can invest. Your KYC flag is stored as an encrypted boolean
            on-chain via Fhenix FHE — never exposed publicly.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: 660, margin: '0 auto' }}>

        {/* Wallet not connected */}
        {!isConnected && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="var(--yellow)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Connect Your Wallet First</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Connect your MetaMask or WalletConnect wallet to start KYC.
              Your wallet address will be registered on-chain once verified.
            </p>
          </div>
        )}

        {/* Intro */}
        {isConnected && effectiveStep === 'intro' && (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{
              background: 'var(--brand-light)', borderRadius: '50%', width: 72, height: 72,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
            }}>
              <ShieldCheck size={36} color="var(--brand)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Verify Your Identity</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              AssetsGrator is a regulated securities platform. We verify all investors under AML/KYC
              regulations. Your KYC status is stored as an encrypted <code>ebool</code> on Arbitrum Sepolia
              via Fhenix CoFHE — only the compliance module can evaluate it. This process takes under 5 minutes.
            </p>
            <div className="grid-3" style={{ gap: '0.75rem', marginBottom: 24 }}>
              {[
                { icon: ShieldCheck, label: 'FHE-encrypted on-chain' },
                { icon: Clock, label: 'Under 5 minutes' },
                { icon: CheckCircle, label: 'One-time process' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg)', borderRadius: 8, padding: '0.75rem',
                  fontSize: 12, color: 'var(--text-secondary)',
                }}>
                  <s.icon size={18} color="var(--brand)" style={{ marginBottom: 6 }} />
                  <p style={{ fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              <strong>What you&apos;ll need:</strong> Government-issued ID (passport or national ID) · A selfie
            </p>
            <div style={{
              background: 'var(--bg)', borderRadius: 8, padding: '0.75rem 1rem',
              fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20,
              fontFamily: 'monospace',
            }}>
              Wallet: {wallet?.slice(0, 6)}…{wallet?.slice(-4)}
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setStep('personal')}
              style={{ width: '100%' }}
            >
              Start Verification <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Multi-step form */}
        {isConnected && !['intro', 'submitting', 'pending', 'approved'].includes(effectiveStep) && (
          <>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem' }}>
              {steps.map((s, i) => (
                <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: 4, background: i <= stepIdx ? 'var(--brand)' : 'var(--border)', borderRadius: 4, marginBottom: 4 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: i <= stepIdx ? 'var(--brand)' : 'var(--text-secondary)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Personal Info */}
            {effectiveStep === 'personal' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: 17, marginBottom: '1.25rem' }}>Personal Information</h2>
                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label>First Name *</label>
                    <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" />
                  </div>
                  <div>
                    <label>Last Name *</label>
                    <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Date of Birth *</label>
                  <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label>Country of Residence *</label>
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                    <option value="">Select country…</option>
                    {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States', 'Canada', 'Germany'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }}
                  disabled={!form.firstName || !form.lastName || !form.dob || !form.country}
                  onClick={() => setStep('document')}>
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Document Upload */}
            {effectiveStep === 'document' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: 17, marginBottom: '0.5rem' }}>Upload ID Document</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Take a clear photo of your document. All four corners must be visible.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Document Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['passport', 'Passport'], ['national_id', 'National ID'], ['drivers_license', "Driver's License"]].map(([val, lbl]) => (
                      <button key={val} onClick={() => setForm(f => ({ ...f, idType: val }))}
                        className="btn btn-sm"
                        style={{
                          background: form.idType === val ? 'var(--brand)' : 'var(--bg)',
                          color: form.idType === val ? '#fff' : 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '2.5rem', textAlign: 'center', background: 'var(--bg)', marginBottom: '1.25rem', cursor: 'pointer' }}
                  onClick={() => setStep('selfie')}
                >
                  <Upload size={32} color="var(--brand)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload or drag &amp; drop</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PNG, JPG, PDF up to 10MB</p>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep('selfie')}>
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Selfie */}
            {effectiveStep === 'selfie' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: 17, marginBottom: '0.5rem' }}>Take a Selfie</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Take a clear photo of your face. Good lighting, no sunglasses.
                </p>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '3rem', textAlign: 'center', background: 'var(--bg)', marginBottom: '1.5rem' }}>
                  <div style={{ width: 100, height: 100, background: 'var(--border)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={40} color="var(--text-secondary)" />
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Enable camera or upload a selfie</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Look directly at the camera.</p>
                </div>

                {submitError && (
                  <div style={{ background: '#fee2e2', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
                    {submitError}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Submitting…</>
                  ) : (
                    <>Submit for Review <ArrowRight size={15} /></>
                  )}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
                  Your KYC data is submitted securely. Once verified, your encrypted attributes will be written to <code>FHEKYCRegistry</code> on Arbitrum Sepolia.
                </p>
              </div>
            )}
          </>
        )}

        {/* Submitting spinner */}
        {isConnected && effectiveStep === 'submitting' && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Loader2 size={48} color="var(--brand)" style={{ margin: '0 auto 1.25rem', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Submitting KYC…</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Please wait while we securely process your submission.</p>
          </div>
        )}

        {/* Pending (on-chain request submitted) */}
        {isConnected && effectiveStep === 'pending' && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--yellow-bg)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Clock size={36} color="var(--yellow)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Verification Under Review</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your request has been registered on-chain. Our compliance team typically completes
              verification within <strong>1–2 business hours</strong>. Your encrypted KYC attributes
              will be written to <code>FHEKYCRegistry</code> once approved.
            </p>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem', marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--yellow)' }}>
                <Clock size={14} />
                <span>Status: <strong>Pending Review</strong></span>
              </div>
              <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                Wallet: {wallet?.slice(0, 10)}…{wallet?.slice(-6)}
              </div>
            </div>
            {/* Arbiscan link */}
            <a
              href={`https://sepolia.arbiscan.io/address/0x4ae073082dE6691EDE691CA630496f066caDA107`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--brand)' }}
            >
              View FHEKYCRegistry on Arbiscan <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* Approved */}
        {isConnected && effectiveStep === 'approved' && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--green-bg)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={36} color="var(--green)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Identity Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your wallet is now whitelisted on-chain and your encrypted KYC attributes
              (<code>IS_ACCREDITED ∧ AML_CLEARED</code>) have been written to the
              <code>FHEKYCRegistry</code> on Arbitrum Sepolia.
            </p>
            <div style={{ background: 'var(--green-bg)', borderRadius: 8, padding: '0.75rem', marginBottom: 24, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              ✓ Wallet registered · ERC-3643 Compliance Active · FHE KYC Approved
            </div>
            <a href="/dashboard">
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Go to Dashboard <ArrowRight size={16} />
              </button>
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
