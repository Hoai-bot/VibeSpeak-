// src/constants/advancedDrills.ts

export interface AdvancedDrill {
  id: string;
  station: 'STATION_2' | 'STATION_4';
  level: 'C1' | 'C2';
  domain: 'ACADEMIC' | 'BUSINESS' | 'EXECUTIVE_CRISIS';
  title: string;
  prompt: string;
  contextEn?: string;
  expectedTenses: string[];
  mandatoryKeywords: string[];
  sampleNativeResponse?: string;
  evaluationCriteria: string;
}

export const ADVANCED_PROMPTS_POOL: AdvancedDrill[] = [
  // ==========================================
  // 🏛️ TRẠM 2: VOCABULARY ARENA (C1 & C2)
  // ==========================================
  {
    id: 's2_acad_c1_01',
    station: 'STATION_2',
    level: 'C1',
    domain: 'ACADEMIC',
    title: 'Ethical Implications of Generative AI in Academic Publishing',
    prompt: 'To what extent does the deployment of Large Language Models compromise academic integrity, and how should peer-review frameworks evolve?',
    contextEn: 'Discuss algorithmic contribution, attribution, and the risk of automated peer review.',
    expectedTenses: ['Present Perfect', 'Passive Voice', 'Mixed Conditionals'],
    mandatoryKeywords: ['integrity', 'peer review', 'attribution', 'bias', 'framework'],
    sampleNativeResponse: 'The ubiquity of large language models fundamentally challenges academic attribution. Had existing editorial frameworks accounted for synthetic text generation, institutions would not be grappling with verified provenance. Moving forward, peer-review mechanisms must incorporate algorithmic auditing to preserve scholarly integrity.',
    evaluationCriteria: 'Ability to use hedging (fundamentally, arguably), passive constructions, and precise academic vocabulary.'
  },
  {
    id: 's2_acad_c1_02',
    station: 'STATION_2',
    level: 'C1',
    domain: 'ACADEMIC',
    title: 'Climate Geoengineering vs. Aggressive Decarbonization',
    prompt: 'Evaluate whether large-scale solar radiation management presents a viable mitigation strategy or merely an excuse to delay net-zero transition.',
    contextEn: 'Consider unintended ecological externalities, moral hazards, and geopolitical risks.',
    expectedTenses: ['Conditionals (Types 2 & 3)', 'Hypothetical Subjunctive', 'Relative Clauses'],
    mandatoryKeywords: ['mitigation', 'externalities', 'hazard', 'decarbonization', 'net-zero'],
    sampleNativeResponse: 'While solar radiation management might offer a temporary thermodynamic buffer, treating it as an alternative to structural decarbonization introduces profound moral hazards. Were global leaders to rely on aerosol injection, the resulting climatic externalities could severely destabilize regional precipitation patterns.',
    evaluationCriteria: 'Usage of hypothetical clauses (were leaders to rely), contrasting conjuncts, and nuanced risk analysis.'
  },
  {
    id: 's2_acad_c2_01',
    station: 'STATION_2',
    level: 'C2',
    domain: 'ACADEMIC',
    title: 'Globalization and the Threat to Indigenous Epistemology',
    prompt: 'Discuss how dominant global academic discourse inadvertently marginalizes localized and indigenous knowledge systems.',
    contextEn: 'Reflect on epistemological hegemony, linguistic homogenization, and scientific pluralism.',
    expectedTenses: ['Cleft Sentences', 'Inversion', 'Complex Subordinate Clauses'],
    mandatoryKeywords: ['hegemony', 'indigenous', 'homogenization', 'epistemology', 'discourse'],
    sampleNativeResponse: 'Seldom does mainstream academia acknowledge the epistemic hegemony perpetuated through standardized publication metrics. It is the pervasive homogenization of research paradigms that systematically disenfranchises indigenous frameworks, thereby impoverishing our collective intellectual pluralism.',
    evaluationCriteria: 'C2-level syntactic variation (Inversion: Seldom does..., Cleft: It is the... that...), sophisticated collocations.'
  },
  {
    id: 's2_biz_c1_01',
    station: 'STATION_2',
    level: 'C1',
    domain: 'BUSINESS',
    title: 'High-Stakes M&A Post-Merger Cultural Integration',
    prompt: 'Analyze the primary structural risks during a cross-border acquisition regarding organizational culture dissonance.',
    contextEn: 'Address organizational friction, talent retention, due diligence, and operational synergies.',
    expectedTenses: ['Past Modal Deductions', 'Cause-and-Effect Participial Clauses'],
    mandatoryKeywords: ['friction', 'synergy', 'retention', 'due diligence', 'dissonance'],
    sampleNativeResponse: 'Cross-border acquisitions frequently falter due to underestimated cultural friction. Having failed to conduct exhaustive behavioral due diligence, acquiring firms routinely encounter voluntary attrition among executive talent, thereby completely neutralizing anticipated operational synergies.',
    evaluationCriteria: 'Usage of participial clauses (Having failed to...), domain-specific business terminology, and logical causality.'
  },
  {
    id: 's2_biz_c2_01',
    station: 'STATION_2',
    level: 'C2',
    domain: 'BUSINESS',
    title: 'Algorithmic Accountability and ESG Regulatory Compliance',
    prompt: 'How should multinational corporations reconcile regulatory mandates on algorithmic transparency with proprietary trade secret protection?',
    contextEn: 'Examine fiduciary duty, proprietary intellectual property, compliance, and public trust.',
    expectedTenses: ['Hedging Structures', 'Adverbial Inversion', 'Complex Modals'],
    mandatoryKeywords: ['fiduciary', 'transparency', 'proprietary', 'compliance', 'reconcile'],
    sampleNativeResponse: 'Reconciling fiduciary obligations with stringent compliance directives necessitates an unprecedented degree of organizational agility. Under no circumstances can proprietary black-box algorithms remain shielded when algorithmic bias directly compromises consumer trust and ESG accountability.',
    evaluationCriteria: 'Executive presence, negative inversion (Under no circumstances can...), and defensible strategic perspective.'
  },

  // ==========================================
  // ⚡ TRẠM 4: SPEAKING EXPRESS (C1 & C2)
  // ==========================================
  {
    id: 's4_exec_c1_01',
    station: 'STATION_4',
    level: 'C1',
    domain: 'EXECUTIVE_CRISIS',
    title: 'Boardroom Pushback on Blanket Layoffs',
    prompt: 'A lead investor demands laying off 25% of engineering before the next board meeting. Deliver a firm diplomatic pushback in 15 seconds.',
    contextEn: '15-second executive counter-proposal defending core talent while offering alternative cost reductions.',
    expectedTenses: ['Polite Modals', 'First Conditional', 'Present Subjunctive'],
    mandatoryKeywords: ['EBITDA', 'retention', 'OPEX', 'roadmap'],
    sampleNativeResponse: 'While I acknowledge our profitability targets, slashing engineering now permanently jeopardizes our core roadmap. I propose freezing non-essential operating expenditures and renegotiating cloud vendor contracts instead.',
    evaluationCriteria: 'Immediate diplomatic deflection without combative phrasing; concrete financial counter-offer.'
  },
  {
    id: 's4_exec_c1_02',
    station: 'STATION_4',
    level: 'C1',
    domain: 'EXECUTIVE_CRISIS',
    title: 'Unconfirmed Data Breach Press Inquiry',
    prompt: 'An investigative reporter asks you on live broadcast about an unconfirmed enterprise data breach. Address this without admitting premature liability.',
    contextEn: '15-second press statement balancing transparency and legal protection.',
    expectedTenses: ['Present Perfect', 'Passive Voice'],
    mandatoryKeywords: ['integrity', 'forensic', 'isolated', 'verified'],
    sampleNativeResponse: 'Our foremost commitment is security. We have preemptively isolated the affected partition and mobilized independent forensic specialists. Verified findings will be released transparently through our investor portal within the hour.',
    evaluationCriteria: 'De-escalation tone, zero premature admission of legal liability, clear procedural timeline.'
  },
  {
    id: 's4_exec_c2_01',
    station: 'STATION_4',
    level: 'C2',
    domain: 'EXECUTIVE_CRISIS',
    title: 'Tier-1 Client Scope Creep Deflection',
    prompt: 'A major enterprise client demands adding generative AI capabilities into their contract deliverable with zero budget or timeline adjustment.',
    contextEn: '15-second assertively polite scope deflection.',
    expectedTenses: ['Polite Modals', 'Conditional Phrasing'],
    mandatoryKeywords: ['deliverable', 'scope', 'allocation', 'milestone'],
    sampleNativeResponse: 'We are eager to support that capability; however, incorporating it into the current sprint would compromise rigor. Let us formally scope that into Milestone 2 alongside an aligned resource allocation.',
    evaluationCriteria: 'Decisive commercial boundaries, positive framing, and disciplined scope preservation.'
  },
  {
    id: 's4_exec_c2_02',
    station: 'STATION_4',
    level: 'C2',
    domain: 'EXECUTIVE_CRISIS',
    title: 'Cross-Functional Launch Impasse',
    prompt: 'The Compliance Director threatens to halt tomorrow morning\'s product launch over minor paperwork gaps. Propose an instant executive compromise.',
    contextEn: '15-second impasse resolution under high commercial stakes.',
    expectedTenses: ['Present Subjunctive', 'First Conditional'],
    mandatoryKeywords: ['rollout', 'contingency', 'compliance', 'gate'],
    sampleNativeResponse: 'Canceling tomorrow incurs prohibitive commercial penalties. I propose we gate rollout strictly to pilot accounts under internal review while our joint team clears the remaining filings by midnight.',
    evaluationCriteria: 'Calculated risk mitigation, consensus-building, and high-velocity decision making.'
  }
];

export function getRandomAdvancedDrill(station: 'STATION_2' | 'STATION_4', level?: 'C1' | 'C2'): AdvancedDrill {
  const filtered = ADVANCED_PROMPTS_POOL.filter(d => {
    if (d.station !== station) return false;
    if (level && d.level !== level) return false;
    return true;
  });
  const list = filtered.length > 0 ? filtered : ADVANCED_PROMPTS_POOL.filter(d => d.station === station);
  return list[Math.floor(Math.random() * list.length)];
}