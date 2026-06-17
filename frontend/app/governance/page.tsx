'use client';

import { useState } from 'react';
import { MOCK_PROPOSALS, MOCK_PROPERTIES, fmtTokens } from '@/lib/mock-data';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, Info } from 'lucide-react';

export default function GovernancePage() {
  const [votes, setVotes] = useState<Record<string, 'for' | 'against' | null>>({});

  const handleVote = (id: string, side: 'for' | 'against') => {
    setVotes(v => ({ ...v, [id]: v[id] === side ? null : side }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>Governance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Token holders vote on platform decisions. 1 token = 1 vote.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem 1.25rem' }}>
        {/* Info banner */}
        <div style={{ background: 'var(--brand-light)', border: '1px solid rgba(26,111,168,0.2)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
          <Info size={16} color="var(--brand)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: 'var(--brand)' }}>
            <strong>How voting works:</strong> Proposals pass when &gt;50% of voting power votes For before the deadline. Your vote weight equals your token balance at proposal creation.
          </span>
        </div>

        <div className="sidebar-2fr">
          {/* Proposals */}
          <div>
            <h2 style={{ fontSize: 16, marginBottom: '0.75rem' }}>Active & Recent Proposals</h2>
            {MOCK_PROPOSALS.map(pr => {
              const totalVotes = pr.votesFor + pr.votesAgainst;
              const forPct  = totalVotes > 0 ? Math.round((pr.votesFor / pr.totalVotingPower) * 100) : 0;
              const againstPct = totalVotes > 0 ? Math.round((pr.votesAgainst / pr.totalVotingPower) * 100) : 0;
              const quorumPct = Math.round((totalVotes / pr.totalVotingPower) * 100);
              const myVote = votes[pr.id] ?? null;

              const StatusIcon = { active: Clock, passed: CheckCircle, rejected: XCircle, pending: Clock }[pr.status];
              const statusCls  = { active: 'badge-yellow', passed: 'badge-green', rejected: 'badge-red', pending: 'badge-blue' }[pr.status];

              return (
                <div key={pr.id} className="card" style={{ marginBottom: '1rem', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <span className={`badge ${statusCls}`} style={{ marginBottom: 8 }}>{pr.status}</span>
                        <h3 style={{ fontSize: 15, marginBottom: 4 }}>{pr.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pr.description}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ends</p>
                        <p style={{ fontSize: 13, fontWeight: 700 }}>{pr.endDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vote bars */}
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div className="grid-2" style={{ gap: '1rem', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={12} /> For</span>
                          <span>{forPct}% · {fmtTokens(pr.votesFor)}</span>
                        </div>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: `${forPct}%`, background: 'var(--green)' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsDown size={12} /> Against</span>
                          <span>{againstPct}% · {fmtTokens(pr.votesAgainst)}</span>
                        </div>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: `${againstPct}%`, background: 'var(--red)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Quorum */}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: pr.status === 'active' ? 12 : 0 }}>
                      Quorum: {quorumPct}% of {fmtTokens(pr.totalVotingPower)} tokens voted
                    </div>

                    {/* Vote buttons */}
                    {pr.status === 'active' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-sm"
                          style={{ flex: 1, background: myVote === 'for' ? 'var(--green)' : 'var(--green-bg)', color: myVote === 'for' ? '#fff' : 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                          onClick={() => handleVote(pr.id, 'for')}>
                          <ThumbsUp size={13} /> {myVote === 'for' ? 'Voted For' : 'Vote For'}
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ flex: 1, background: myVote === 'against' ? 'var(--red)' : 'var(--red-bg)', color: myVote === 'against' ? '#fff' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                          onClick={() => handleVote(pr.id, 'against')}>
                          <ThumbsDown size={13} /> {myVote === 'against' ? 'Voted Against' : 'Vote Against'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div>
            <h2 style={{ fontSize: 16, marginBottom: '0.75rem' }}>Your Voting Power</h2>
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              {MOCK_PROPERTIES.slice(0, 2).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{p.name.split(' ').slice(0, 2).join(' ')}</span>
                  <span style={{ fontWeight: 700 }}>2,000 votes</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 800, color: 'var(--brand)' }}>2,500 votes</span>
              </div>
            </div>

            <h2 style={{ fontSize: 16, marginBottom: '0.75rem' }}>Governance Rules</h2>
            <div className="card" style={{ padding: '1rem' }}>
              {[
                ['Proposal Threshold', '100 tokens'],
                ['Quorum Required', '10% of supply'],
                ['Voting Period', '7 days'],
                ['Pass Threshold', '>50% For'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
