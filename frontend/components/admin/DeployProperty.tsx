'use client';

/**
 * CreatePropertyForm — Two-phase asset creation on AssetsGrator
 *
 * Phase 1 (Metadata):
 *   Admin fills asset details + uploads docs, images
 *   → files uploaded to IPFS via Pinata API route
 *   → metadata JSON assembled and pinned → ipfsCID generated
 *
 * Phase 2 (On-chain):
 *   Admin fills token economics
 *   → single AssetFactory.deployAsset(DeployParams) tx
 *   → AssetToken + AssetTreasury clones deployed on Arbitrum Sepolia
 */

import { useState, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { parseUnits, parseGwei } from 'viem';
import { Upload, CheckCircle, Loader, X, FileText, Image, Video, ArrowRight } from 'lucide-react';
import { ASSET_FACTORY_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

// ── Types ─────────────────────────────────────────────────────────────────────
type UploadedFile = { name: string; ipfsUrl: string; gatewayUrl: string; type: 'doc' | 'image' | 'video' };

type MetaForm = {
  propertyName: string;
  propertyAddress: string;
  city: string;
  country: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  yearBuilt: string;
  propertyType: string;
};

type TokenForm = {
  tokenSymbol: string;
  totalSupply: string;    // whole tokens, no decimals
  pricePerUnit: string;  // USD per unit, 18 decimals on-chain
  valuationUSD: string;  // total property value in USD, 18 decimals on-chain
};

const EMPTY_META: MetaForm = {
  propertyName: '', propertyAddress: '', city: '', country: '',
  description: '', bedrooms: '', bathrooms: '', sqft: '', yearBuilt: '',
  propertyType: 'Residential',
};

const EMPTY_TOKEN: TokenForm = {
  tokenSymbol: '',
  totalSupply: '1000000',
  pricePerUnit: '1',
  valuationUSD: '',
};

// ── File upload helper ────────────────────────────────────────────────────────
async function uploadToIPFS(file: File, name: string): Promise<UploadedFile | null> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) return null;
  const data = await res.json();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type: UploadedFile['type'] =
    ['pdf', 'doc', 'docx'].includes(ext) ? 'doc' :
    ['mp4', 'mov', 'avi', 'webm'].includes(ext) ? 'video' : 'image';
  return { name: file.name, ipfsUrl: data.ipfsUrl, gatewayUrl: data.gatewayUrl, type };
}

// ── File drop zone ─────────────────────────────────────────────────────────────
function FileDropZone({ label, accept, icon: Icon, onFiles, uploading, uploaded }: {
  label: string; accept: string; icon: React.ElementType;
  onFiles: (files: FileList) => void; uploading: boolean;
  uploaded: UploadedFile[];
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>{label}</label>
      <div
        onClick={() => ref.current?.click()}
        style={{
          border: '2px dashed var(--border)', borderRadius: 10, padding: '1rem',
          cursor: 'pointer', textAlign: 'center', background: 'var(--bg-secondary)',
          transition: 'border-color 0.2s',
        }}
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
      >
        {uploading
          ? <Loader size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          : <Icon size={20} color="var(--text-secondary)" style={{ margin: '0 auto 4px' }} />}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          {uploading ? 'Uploading to IPFS…' : 'Click or drag & drop'}
        </p>
        <input ref={ref} type="file" accept={accept} multiple style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.length) onFiles(e.target.files); }} />
      </div>
      {uploaded.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {uploaded.map(f => (
            <div key={f.ipfsUrl} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <CheckCircle size={12} color="var(--green)" />
              <a href={f.gatewayUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--brand)', textDecoration: 'none', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 260 }}>
                {f.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Phase 1: Metadata + uploads ───────────────────────────────────────────────
function MetadataPhase({ onComplete }: { onComplete: (uri: string, name: string) => void }) {
  const [form, setForm] = useState<MetaForm>(EMPTY_META);
  const [docs,   setDocs]   = useState<UploadedFile[]>([]);
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [videos, setVideos] = useState<UploadedFile[]>([]);
  const [uploadingDocs,   setUploadingDocs]   = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [error, setError]     = useState('');

  const set = (k: keyof MetaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFiles = async (files: FileList, type: 'doc' | 'image' | 'video', setUploading: (v: boolean) => void, setList: React.Dispatch<React.SetStateAction<UploadedFile[]>>) => {
    setUploading(true);
    const results = await Promise.all(Array.from(files).map(f => uploadToIPFS(f, f.name)));
    setList(prev => [...prev, ...(results.filter(Boolean) as UploadedFile[])]);
    setUploading(false);
  };

  const submit = async () => {
    setError('');
    if (!form.propertyName || !form.propertyAddress || !form.city || !form.country) {
      setError('Asset Name, Address, City, and Country are required.'); return;
    }
    if (docs.length === 0) { setError('At least one ownership document is required.'); return; }

    setPinning(true);
    try {
      const metadata = {
        name:        form.propertyName,
        description: form.description,
        property_type: form.propertyType,
        location: {
          address: form.propertyAddress,
          city:    form.city,
          country: form.country,
        },
        attributes: [
          { trait_type: 'Property Type', value: form.propertyType },
          { trait_type: 'City',          value: form.city },
          { trait_type: 'Country',       value: form.country },
          ...(form.bedrooms  ? [{ trait_type: 'Bedrooms',   value: form.bedrooms }]  : []),
          ...(form.bathrooms ? [{ trait_type: 'Bathrooms',  value: form.bathrooms }] : []),
          ...(form.sqft      ? [{ trait_type: 'Sq Ft',      value: form.sqft }]      : []),
          ...(form.yearBuilt ? [{ trait_type: 'Year Built', value: form.yearBuilt }] : []),
        ],
        documents: docs.map(d   => ({ name: d.name, url: d.ipfsUrl })),
        images:    images.map(i => ({ name: i.name, url: i.ipfsUrl })),
        videos:    videos.map(v => ({ name: v.name, url: v.ipfsUrl })),
        image:     images[0]?.ipfsUrl ?? '',   // primary image (NFT standard)
      };

      const res = await fetch('/api/upload/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      if (!res.ok) { const { error } = await res.json(); setError(error); return; }
      const { ipfsUrl } = await res.json();
      onComplete(ipfsUrl, form.propertyName);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to pin metadata.');
    } finally {
      setPinning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📍 Asset Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label>Asset Name / Title <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="meta-name" placeholder="e.g. Victoria Heights, Unit 4B" value={form.propertyName} onChange={set('propertyName')} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label>Street Address <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="meta-address" placeholder="123 High Street, Apt 4B" value={form.propertyAddress} onChange={set('propertyAddress')} />
          </div>
          <div>
            <label>City <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="meta-city" placeholder="Lagos" value={form.city} onChange={set('city')} />
          </div>
          <div>
            <label>Country <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="meta-country" placeholder="Nigeria" value={form.country} onChange={set('country')} />
          </div>
          <div>
            <label>Asset Category</label>
            <select value={form.propertyType} onChange={set('propertyType')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', width: '100%' }}>
              {['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed-Use'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label>Year Built</label>
            <input id="meta-year" type="number" placeholder="2018" value={form.yearBuilt} onChange={set('yearBuilt')} />
          </div>
          <div>
            <label>Bedrooms</label>
            <input id="meta-beds" type="number" min="0" placeholder="3" value={form.bedrooms} onChange={set('bedrooms')} />
          </div>
          <div>
            <label>Bathrooms</label>
            <input id="meta-baths" type="number" min="0" placeholder="2" value={form.bathrooms} onChange={set('bathrooms')} />
          </div>
          <div>
            <label>Area (sq ft)</label>
            <input id="meta-sqft" type="number" placeholder="1200" value={form.sqft} onChange={set('sqft')} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label>Description</label>
            <textarea id="meta-desc" placeholder="Describe the asset, its location, investment potential…"
              value={form.description} onChange={set('description')}
              style={{ width: '100%', minHeight: 80, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', fontSize: 14 }} />
          </div>
        </div>
      </div>

      {/* File uploads */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📎 Documents & Media</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
          <FileDropZone label="Ownership Documents (Title Deed, Survey, Legal) *" accept=".pdf,.doc,.docx"
            icon={FileText} uploading={uploadingDocs} uploaded={docs}
            onFiles={files => handleFiles(files, 'doc', setUploadingDocs, setDocs)} />
          <FileDropZone label="Asset Photos" accept="image/*"
            icon={Image} uploading={uploadingImages} uploaded={images}
            onFiles={files => handleFiles(files, 'image', setUploadingImages, setImages)} />
          <FileDropZone label="Videos / Virtual Tours (optional)" accept="video/*"
            icon={Video} uploading={uploadingVideos} uploaded={videos}
            onFiles={files => handleFiles(files, 'video', setUploadingVideos, setVideos)} />
        </div>
      </div>

      {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13 }}>{error}</div>}

      <button id="pin-metadata-btn" className="btn btn-primary" onClick={submit}
        disabled={pinning || uploadingDocs || uploadingImages || uploadingVideos}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {pinning
          ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading to IPFS…</>
          : <><Upload size={15} /> Upload to IPFS & Continue <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

// ── Phase 2: Token economics + on-chain ───────────────────────────────────────
// AssetCategory enum mirrors IAssetToken.AssetCategory (0=RealEstate, 1=Energy, 2=Carbon, 3=REC)
const ASSET_CATEGORIES = ['Real Estate', 'Energy', 'Carbon', 'REC'] as const;

function TokenPhase({ metadataUri, propertyName, onBack }: {
  metadataUri: string; propertyName: string; onBack: () => void;
}) {
  const { address } = useAccount();
  const { ASSET_FACTORY, IDENTITY_REGISTRY } = useContractAddresses();

  const [form, setForm] = useState<TokenForm>({
    ...EMPTY_TOKEN,
    tokenSymbol: propertyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5),
  });
  const [category, setCategory] = useState<number>(0); // index into ASSET_CATEGORIES
  const [assetSubType, setAssetSubType] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const set = (k: keyof TokenForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setError('');
    if (!form.tokenSymbol || !form.valuationUSD) {
      setError('Token Symbol and Asset Valuation are required.'); return;
    }
    console.log("hey")
    // Strip the ipfs:// prefix — the contract stores just the CID
    const cid = metadataUri.replace('ipfs://', '');

    writeContract({
      address: ASSET_FACTORY,
      abi: ASSET_FACTORY_ABI,
      functionName: 'deployAsset',
      // Gas buffer: Arbitrum Sepolia base fee fluctuates around 0.01–0.025 gwei.
      // Setting 0.1 gwei floor prevents "maxFeePerGas < baseFee" race condition.
      maxFeePerGas: parseGwei('0.1'),
      maxPriorityFeePerGas: parseGwei('0.001'),
      args: [{
        name:             propertyName,
        symbol:           form.tokenSymbol.toUpperCase(),
        ipfsCID:          cid,
        location:         location || propertyName,
        category:         category,
        assetSubType:     assetSubType || ASSET_CATEGORIES[category],
        totalSupply:      parseUnits(form.totalSupply, 0),
        pricePerUnit:     parseUnits(form.pricePerUnit, 18),
        valuationUSD:     parseUnits(form.valuationUSD, 18),
        identityRegistry: IDENTITY_REGISTRY,
        capacityKW:       0n,
        annualYieldMWh:   0n,
        ppaContractCID:   '',
        ppaTermYears:     0n,
      }],
    });
  };

  const busy = isPending || isMining;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* URI confirmation */}
      <div style={{ background: 'var(--green-bg)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={14} color="var(--green)" />
        <div>
          <strong>Metadata pinned to IPFS</strong>
          <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: 'var(--text-secondary)', marginTop: 2 }}>{metadataUri}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>💰 Token Economics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label>Token Symbol <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="tok-symbol" placeholder="VHT" value={form.tokenSymbol} onChange={set('tokenSymbol')} style={{ textTransform: 'uppercase' }} />
          </div>
          <div>
            <label>Total Supply (tokens)</label>
            <input id="tok-supply" type="number" value={form.totalSupply} onChange={set('totalSupply')} />
          </div>
          <div>
            <label>Price Per Unit (USD) <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="tok-price" type="number" step="0.01" value={form.pricePerUnit} onChange={set('pricePerUnit')} />
          </div>
          <div>
            <label>Asset Valuation (USD) <span style={{ color: 'var(--red)' }}>*</span></label>
            <input id="tok-value" type="number" placeholder="500000" value={form.valuationUSD} onChange={set('valuationUSD')} />
          </div>
          <div>
            <label>Asset Category</label>
            <select value={category} onChange={e => setCategory(Number(e.target.value))}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', width: '100%' }}>
              {ASSET_CATEGORIES.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
          </div>
          <div>
            <label>Asset Sub-Type</label>
            <input id="tok-subtype" placeholder="e.g. Residential, Solar Farm" value={assetSubType} onChange={e => setAssetSubType(e.target.value)} />
          </div>
        </div>

        {/* Estimation row */}
        {form.valuationUSD && form.totalSupply && form.pricePerUnit && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12, padding: '0.75rem', background: 'var(--brand-light)', borderRadius: 8, fontSize: 12 }}>
            <div><div style={{ color: 'var(--text-secondary)' }}>Total Raise</div><strong>${(parseFloat(form.totalSupply) * parseFloat(form.pricePerUnit)).toLocaleString()}</strong></div>
            <div><div style={{ color: 'var(--text-secondary)' }}>Valuation</div><strong>${parseFloat(form.valuationUSD).toLocaleString()}</strong></div>
          </div>
        )}
      </div>

      {(error || writeError) && (
        <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13 }}>
          {error || writeError?.message?.split('\n')[0]}
        </div>
      )}

      {isSuccess && (
        <div style={{ background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 8, padding: '0.85rem 1rem', fontSize: 14 }}>
          🎉 Asset deployed on-chain! Check the Assets tab.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" onClick={onBack} disabled={busy} style={{ flex: '0 0 auto' }}>
          ← Back
        </button>
        <button id="deploy-asset-btn" className="btn btn-primary" style={{ flex: 1 }}
          disabled={busy || !address || isSuccess} onClick={submit}>
          {!address ? 'Connect Wallet' : busy
            ? (isMining ? 'Deploying contracts… (30s)' : 'Confirm in wallet…')
            : '🚀 Deploy Asset (1 transaction)'}
        </button>
      </div>
      {busy && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>Deploying PropertyToken + ModularCompliance on-chain… (~20s)</p>}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CreatePropertyForm() {
  const [phase, setPhase]             = useState<1 | 2>(1);
  const [metadataUri, setMetadataUri] = useState('');
  const [propertyName, setPropertyName] = useState('');

  const handleMetaComplete = (uri: string, name: string) => {
    setMetadataUri(uri);
    setPropertyName(name);
    setPhase(2);
  };

  return (
    <div>
      {/* Phase indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {[{ n: 1, label: 'Asset Details & Files' }, { n: 2, label: 'Token Economics & Deploy' }].map(({ n, label }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: phase >= n ? 'var(--brand)' : 'var(--border)', color: phase >= n ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 700,
            }}>{phase > n ? '✓' : n}</div>
            <span style={{ fontSize: 13, fontWeight: phase === n ? 700 : 400, color: phase === n ? 'var(--brand)' : 'var(--text-secondary)' }}>{label}</span>
            {n < 2 && <ArrowRight size={12} color="var(--border)" />}
          </div>
        ))}
      </div>

      {phase === 1 && <MetadataPhase onComplete={handleMetaComplete} />}
      {phase === 2 && <TokenPhase metadataUri={metadataUri} propertyName={propertyName} onBack={() => setPhase(1)} />}
    </div>
  );
}
