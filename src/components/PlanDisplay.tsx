import React, { useState } from 'react';
import { PlanData } from '@/types/crisis';

const IMMEDIATE_KEYWORDS = ['Evacuate', 'medical team', 'Send '];
const isImmediate = (action: string) => IMMEDIATE_KEYWORDS.some(k => action.includes(k));

type PlanDisplayProps = {
  data: PlanData;
  isSimulated?: boolean;
};

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 1) return (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-black rounded-full bg-red-600 text-white tracking-wider uppercase shadow-sm">
      ⚠ PRIORITY 1
    </span>
  );
  if (priority === 2) return (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full bg-gray-900 text-white tracking-wider uppercase">
      Priority 2
    </span>
  );
  if (priority === 3) return (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full bg-gray-300 text-gray-600 tracking-wider uppercase">
      Priority 3
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-400 tracking-wider">
      Priority {priority}
    </span>
  );
}

export default function PlanDisplay({ data: plan, isSimulated = false }: PlanDisplayProps) {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  if (!plan) return null;

  return (
    <div className="w-full flex flex-col gap-8 font-sans text-gray-900 mt-4 border-t-2 border-gray-200 pt-8">

      {/* SYSTEM INFO BAR */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          Decision Engine: Active
        </span>
        <span className="text-gray-300">|</span>
        <span>Mode: {isSimulated ? <span className="text-orange-500">Simulation (Worsened)</span> : <span className="text-blue-500">Simulation</span>}</span>
        <span className="text-gray-300">|</span>
        <span>Last Updated: {plan.lastUpdated}</span>
        {plan.excludedZoneCount !== undefined && plan.excludedZoneCount > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-orange-500">{plan.excludedZoneCount} zone(s) excluded (incomplete data)</span>
          </>
        )}
      </div>

      {/* LIVE CRISIS ALERT SIGNAL */}
      <div className="flex items-center gap-3 text-sm text-blue-900 bg-blue-50 py-3 px-5 rounded-xl border-2 border-blue-200 w-max shadow-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
        <span className="font-black text-sm">⚡ LIVE CRISIS ALERT: {plan.signalData}</span>
      </div>

      {/* SIMULATION FEEDBACK BANNER */}
      {isSimulated && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl px-5 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-sm font-bold text-orange-700">Scenario worsened — priorities recalculated based on degraded conditions.</span>
        </div>
      )}

      {/* ZERO RESOURCE ALERT */}
      {plan.zeroResourceAlert && (
        <div className="bg-gray-900 border-2 border-gray-700 p-5 rounded-xl flex items-start gap-4 shadow-lg">
          <svg className="w-6 h-6 text-white mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          <div>
            <h3 className="font-black text-white text-base uppercase tracking-tight">No Resources Available</h3>
            <p className="text-gray-300 text-sm mt-1">No resources available — allocation not possible. Add resources before running the engine.</p>
          </div>
        </div>
      )}

      {/* CRITICAL SHORTAGE BANNER */}
      {!plan.zeroResourceAlert && plan.criticalShortage && (
        <div className="bg-orange-600 border-2 border-orange-700 p-4 rounded-xl flex items-start gap-4">
          <svg className="w-5 h-5 text-white mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <p className="text-sm font-bold text-white">Critical shortage — some zones will remain unsupported. Reinforce resource supply immediately.</p>
        </div>
      )}

      {/* FAILURE MODE BANNER */}
      {plan.isUnreliable ? (
        <div className="bg-red-600 border-2 border-red-700 p-5 rounded-xl shadow-lg flex items-start gap-4">
          <svg className="w-8 h-8 text-white mt-0.5 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">⚠ WARNING: DECISION MAY BE UNRELIABLE</h3>
            <p className="text-sm text-red-100 mt-1 font-medium">
              Critical data missing <strong>(completion &lt; 70%)</strong> or extreme resource deficit detected. Manual command intervention required immediately.
            </p>
          </div>
        </div>
      ) : plan.deficitAlert ? (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm flex items-start gap-4">
          <svg className="w-6 h-6 text-orange-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-base font-black text-orange-800 tracking-tight uppercase">Resource Deficit Alert</h3>
            <p className="text-sm text-orange-700 mt-1">
              <strong>{plan.deficitAlert.underSupportedZones} zone(s)</strong> are critically under-resourced. Highlighted below.
            </p>
          </div>
        </div>
      ) : null}

      {/* ACTION PLAN HEADER */}
      <div className={`flex flex-col gap-6 p-6 rounded-2xl border-2 shadow-md ${plan.isUnreliable ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-gray-100 pb-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">CrisisMind · System Decision Output</div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Action Plan Generated</h2>
            <p className="text-sm text-gray-500 mt-1.5">{plan.confidenceReason}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confidence</span>
            <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border-2
              ${plan.confidence === 'HIGH' ? 'bg-green-50 text-green-700 border-green-300' :
                plan.confidence === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                'bg-orange-50 text-orange-700 border-orange-300'}`}>
              {plan.confidence}
            </span>
          </div>
        </div>

        {/* IMPACT STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Affected</div>
            <div className="text-3xl font-black text-gray-900">{plan.totalPeopleAffected.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">people across all zones</div>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Prioritized Rescues</div>
            <div className="text-3xl font-black text-blue-700">{plan.prioritizedPeople.toLocaleString()}</div>
            <div className="text-xs text-blue-400 mt-1">in top 3 zones</div>
          </div>
          <div className={`p-5 rounded-xl border-2 ${plan.underSupportedPeople > 0 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-200'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${plan.underSupportedPeople > 0 ? 'text-orange-600' : 'text-green-600'}`}>Under-supported</div>
            <div className={`text-3xl font-black ${plan.underSupportedPeople > 0 ? 'text-orange-700' : 'text-green-700'}`}>{plan.underSupportedPeople.toLocaleString()}</div>
            <div className={`text-xs mt-1 ${plan.underSupportedPeople > 0 ? 'text-orange-400' : 'text-green-400'}`}>{plan.underSupportedPeople > 0 ? 'need reinforcement' : 'fully covered'}</div>
          </div>
        </div>
      </div>

      {/* ZONE PRIORITY CARDS */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Zone Priority & Directives</h2>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {plan.plan?.map((item) => {
            const isFirst = item.priority === 1;
            const isSecond = item.priority === 2;
            const isThird = item.priority === 3;
            const isExpanded = expandedZone === item.id;
            const isManual = item.scoreBreakdown.some(b => b.factor === 'MANUAL OVERRIDE');

            const immediateActions = item.actions?.filter(isImmediate) || [];
            const supportActions = item.actions?.filter(a => !isImmediate(a)) || [];

            let cardClass = 'bg-white rounded-2xl flex flex-col relative overflow-hidden transition-all ';
            if (item.isUnderSupported) {
              cardClass += 'border-2 border-dashed border-orange-400 shadow-md';
            } else if (isFirst) {
              cardClass += 'border-2 border-red-500 shadow-xl shadow-red-100 scale-[1.03] z-10';
            } else if (isSecond) {
              cardClass += 'border-2 border-gray-800 shadow-lg';
            } else if (isThird) {
              cardClass += 'border border-gray-200 shadow-sm opacity-90';
            } else {
              cardClass += 'border border-gray-100 shadow-sm opacity-70';
            }

            const cardBg = isFirst ? 'bg-red-50/30' : 'bg-white';

            return (
              <div key={item.id} className={`${cardClass} ${cardBg}`}>
                {/* Top accent */}
                {isFirst && <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>}
                {isSecond && !item.isUnderSupported && <div className="absolute top-0 left-0 w-full h-1 bg-gray-800"></div>}
                {isThird && !item.isUnderSupported && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-400"></div>}

                <div className="p-5 flex-1 flex flex-col gap-4">

                  {/* ROW 1: Name + Priority Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className={`font-black tracking-tight leading-tight break-words ${isFirst ? 'text-xl text-gray-900' : isThird ? 'text-base text-gray-600' : 'text-lg text-gray-800'}`}>
                        {item.area}
                      </h3>
                      {isManual && (
                        <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-purple-100 text-purple-700">
                          CMD OVERRIDE
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      <PriorityBadge priority={item.priority} />
                      {item.isUnderSupported && (
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          UNDER-RESOURCED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ROW 2: Urgency + ETA */}
                  <div className="flex flex-wrap gap-2">
                    {item.urgency && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg
                        ${item.urgency === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                          item.urgency === 'Risky' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                          'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        🕐 {item.urgency} Window
                      </span>
                    )}
                    {item.responseTime && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                        ⏱ ETA: {item.responseTime}
                      </span>
                    )}
                  </div>

                  {/* ROW 3: Split Actions */}
                  {item.actions && item.actions.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {immediateActions.length > 0 && (
                        <div className={`rounded-xl p-3 border ${isFirst ? 'bg-red-50 border-red-200' : 'bg-red-50/40 border-red-100'}`}>
                          <div className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2">🚨 Immediate Actions</div>
                          <ul className="space-y-1.5">
                            {immediateActions.map((action, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm font-bold px-2.5 py-1.5 rounded-lg ${isFirst ? 'text-red-900 bg-red-100/70' : 'text-red-800 bg-red-50 border border-red-100'}`}>
                                <span className="text-red-500 shrink-0">→</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {supportActions.length > 0 && (
                        <div className="rounded-xl p-3 border bg-gray-50 border-gray-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">🚧 Support Actions</div>
                          <ul className="space-y-1.5">
                            {supportActions.map((action, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm font-semibold px-2.5 py-1.5 rounded-lg text-gray-700 bg-white border border-gray-100">
                                <span className="text-gray-400 shrink-0">→</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ROW 4: Resource allocation with color logic */}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Resource Allocation</div>
                    <div className="grid grid-cols-2 gap-2">
                      {item.allocations?.map((alloc, i) => {
                        const pct = alloc.percentage;
                        const pctColor = pct >= 40 ? 'text-gray-900' : pct >= 20 ? 'text-orange-600' : 'text-red-600';
                        const bgColor = pct >= 40
                          ? (item.isUnderSupported ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100')
                          : pct >= 20 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
                        return (
                          <div key={i} className={`flex flex-col p-2.5 rounded-lg border ${bgColor}`}>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate" title={alloc.name}>{alloc.name}</span>
                            <span className={`text-xl font-black tracking-tight ${pctColor}`}>{alloc.value}</span>
                            <span className={`text-[10px] font-semibold mt-0.5 ${pctColor}`}>
                              / {alloc.total} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ROW 5: Decision Logic Breakdown (collapsible, low prominence) */}
                  <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                    <div
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedZone(isExpanded ? null : item.id)}
                    >
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        Decision Logic Breakdown
                        <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </span>
                      <span className="text-sm font-black text-gray-400">{item.score.toFixed(2)}</span>
                    </div>
                    {isExpanded && (
                      <div className="bg-white border-t border-gray-100 px-3 py-2 space-y-1">
                        {item.scoreBreakdown.map((b, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{b.factor}</span>
                            <span className="font-semibold text-gray-600">+{b.points.toFixed(2)} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reasoning */}
                  {item.reason && (
                    <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                      <span className="font-bold text-gray-600">Reasoning: </span>{item.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY THIS DECISION + NEXT ESCALATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">

        {/* 🧠 WHY THIS DECISION? */}
        {plan.trade_offs && plan.trade_offs.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">🧠 Why This Decision?</h2>
              <div className="flex-1 h-0.5 bg-gray-900"></div>
            </div>
            <ul className="space-y-3">
              {plan.trade_offs.map((tradeoff, idx) => {
                const [firstSentence, ...rest] = tradeoff.split('. ');
                return (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border-l-4 border-gray-900 shadow-sm">
                    <span className="text-gray-900 font-black mt-0.5 shrink-0">›</span>
                    <span>
                      <strong className="font-bold text-gray-900">{firstSentence}.</strong>
                      {rest.length > 0 && ` ${rest.join('. ')}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ⚠️ NEXT ESCALATION RISK */}
        {plan.prediction && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-red-700">⚠️ Next Escalation Risk</h2>
              <div className="flex-1 h-0.5 bg-red-600"></div>
            </div>
            <div className="bg-red-50 rounded-xl border-2 border-red-400 shadow-md p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Incoming Threat Detected</p>
                  <p className="font-black text-gray-900 text-xl">{plan.prediction.next_area}</p>
                </div>
                <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-sm animate-pulse">
                  {plan.prediction.risk_level}
                </span>
              </div>
              <div className="pt-4 border-t-2 border-red-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong className="font-black text-red-800">Trigger logic: </strong>{plan.prediction.reason}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
