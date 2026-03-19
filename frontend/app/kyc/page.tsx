'use client';

import { useState } from 'react';
import { ShieldCheck, Upload, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

type Step = 'intro' | 'personal' | 'document' | 'selfie' | 'pending' | 'approved';

export default function KYCPage() {
  const [step, setStep] = useState<Step>('intro');
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', country: '', idType: 'passport' });

  const steps = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'document', label: 'ID Document' },
    { key: 'selfie',   label: 'Selfie' },
    { key: 'pending',  label: 'Review' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <div>
      {/* Page header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>Identity Verification (KYC)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Required by law before you can invest. Your data is encrypted and never shared.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: 660, margin: '0 auto' }}>

        {/* Step intro */}
        {step === 'intro' && (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ background: 'var(--brand-light)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <ShieldCheck size={36} color="var(--brand)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Verify Your Identity</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              AssetsGrator is a regulated securities platform. We are required to verify the identity of all investors under AML/KYC regulations. This process takes under 5 minutes.
            </p>
            <div className="grid-3" style={{ gap: '0.75rem', marginBottom: 24 }}>
              {[
                { icon: ShieldCheck, label: 'Bank-level encryption' },
                { icon: Clock, label: 'Under 5 minutes' },
                { icon: CheckCircle, label: 'One-time process' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <s.icon size={18} color="var(--brand)" style={{ marginBottom: 6 }} />
                  <p style={{ fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              <strong>What you'll need:</strong> Government-issued ID (passport or national ID) · A selfie
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setStep('personal')} style={{ width: '100%' }}>
              Start Verification <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step progress bar */}
        {step !== 'intro' && step !== 'approved' && (
          <>
            <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem' }}>
              {steps.map((s, i) => (
                <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: 4, background: i <= stepIdx ? 'var(--brand)' : 'var(--border)', borderRadius: 4, marginBottom: 4 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: i <= stepIdx ? 'var(--brand)' : 'var(--text-secondary)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Personal Info */}
            {step === 'personal' && (
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
            {step === 'document' && (
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
                        style={{ background: form.idType === val ? 'var(--brand)' : 'var(--bg)', color: form.idType === val ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Upload dropzone (mock) */}
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '2.5rem', textAlign: 'center', background: 'var(--bg)', marginBottom: '1.25rem', cursor: 'pointer' }}
                     onClick={() => setStep('selfie')}>
                  <Upload size={32} color="var(--brand)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload or drag & drop</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PNG, JPG, PDF up to 10MB</p>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep('selfie')}>
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Selfie */}
            {step === 'selfie' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: 17, marginBottom: '0.5rem' }}>Take a Selfie</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Take a clear photo of your face. Make sure you're in good lighting and looking directly at the camera.
                </p>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '3rem', textAlign: 'center', background: 'var(--bg)', marginBottom: '1.5rem' }}>
                  <div style={{ width: 100, height: 100, background: 'var(--border)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={40} color="var(--text-secondary)" />
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Enable camera or upload a selfie</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Look directly at the camera. No sunglasses.</p>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep('pending')}>
                  Submit for Review <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Pending */}
            {step === 'pending' && (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ background: 'var(--yellow-bg)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Clock size={36} color="var(--yellow)" />
                </div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Verification Under Review</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  Your documents have been submitted. Our compliance team typically completes verification within <strong>1–2 business hours</strong>. You'll receive an email when approved.
                </p>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem', marginBottom: 20, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--yellow)' }}>
                    <Clock size={14} />
                    <span>Status: <strong>Pending Review</strong></span>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setStep('approved')}>
                  Simulate Approval (Demo)
                </button>
              </div>
            )}
          </>
        )}

        {/* Approved */}
        {step === 'approved' && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--green-bg)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={36} color="var(--green)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Identity Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your wallet is now whitelisted on-chain. You can purchase property tokens and claim rental income.
            </p>
            <div style={{ background: 'var(--green-bg)', borderRadius: 8, padding: '0.75rem', marginBottom: 24, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              ✓ Wallet whitelisted on Polygon · ERC-1400 Compliance Active
            </div>
            <a href="/properties"><button className="btn btn-primary btn-lg" style={{ width: '100%' }}>Browse Properties <ArrowRight size={16} /></button></a>
          </div>
        )}
      </div>
    </div>
  );
}
