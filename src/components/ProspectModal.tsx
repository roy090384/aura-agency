import React, { useState, useEffect } from 'react';
import { TalkProspect, ProspectScope, TalkStage, PlayerPosition, YouthCategory, Language, Currency, SalaryPeriod } from '../types/player';
import { TRANSLATIONS, getYouthBadgeColor } from '../translations/translations';
import { CURRENCY_SYMBOLS, convertCurrency, formatSalary } from '../utils/currency';
import { X, Video, Globe, MapPin, Sparkles, Plus, Tag, Coins } from 'lucide-react';
import { NationalitySelect } from './NationalitySelect';

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: TalkProspect) => void;
  prospectToEdit?: TalkProspect | null;
  language?: Language;
  defaultCurrency?: Currency;
}

const POSITIONS: PlayerPosition[] = [
  'Goalkeeper (GK)',
  'Centre-Back (CB)',
  'Left-Back (LB)',
  'Right-Back (RB)',
  'Defensive Midfield (CDM)',
  'Central Midfield (CM)',
  'Attacking Midfield (CAM)',
  'Left Winger (LW)',
  'Right Winger (RW)',
  'Striker (ST)'
];

const STAGES: TalkStage[] = [
  'Initial Contact',
  'Scouting & Video',
  'Meeting Scheduled',
  'Offer Proposed',
  'Contract Drafting',
  'Signed'
];

const YOUTH_OPTIONS: YouthCategory[] = ['Senior', 'U19', 'U17', 'U15'];

export const ProspectModal: React.FC<ProspectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  prospectToEdit,
  language = 'en',
  defaultCurrency = 'EUR'
}) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(18);
  const [birthDate, setBirthDate] = useState('2008-01-01');
  const [nationality, setNationality] = useState('England');
  const [countryCode, setCountryCode] = useState('GB');
  const [currentClub, setCurrentClub] = useState('');
  const [league, setLeague] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('Central Midfield (CM)');
  const [youthCategory, setYouthCategory] = useState<YouthCategory>('U19');
  const [scope, setScope] = useState<ProspectScope>('Local');
  const [talkStage, setTalkStage] = useState<TalkStage>('Initial Contact');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [assignedAgent, setAssignedAgent] = useState('Marcus Sterling (Senior Agent)');

  // Target Salary & Compensation
  const [targetSalaryAmount, setTargetSalaryAmount] = useState<number>(2500);
  const [targetSalaryCurrency, setTargetSalaryCurrency] = useState<Currency>(defaultCurrency);
  const [targetSalaryPeriod, setTargetSalaryPeriod] = useState<SalaryPeriod>('Weekly');

  // Video info
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [videoTitle, setVideoTitle] = useState('Tactical Match Compilation & Skills');
  const [videoDescription, setVideoDescription] = useState('Full game scout review, press resistance, and progressive forward passes.');

  // Scouting report
  const [strengthsText, setStrengthsText] = useState('Vision & Passing, Pace in Transition, Physical Stamina');
  const [areasToImproveText, setAreasToImproveText] = useState('Aerial Duels, Weak-foot consistency');
  const [tacticalFit, setTacticalFit] = useState('Modern dynamic playmaker suited for high-tempo attacking team.');
  const [dominantFoot, setDominantFoot] = useState<'Right' | 'Left' | 'Both'>('Right');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [internationalCaps, setInternationalCaps] = useState<number>(4);
  const [generalNotes, setGeneralNotes] = useState('');

  useEffect(() => {
    if (prospectToEdit) {
      setName(prospectToEdit.name);
      setAge(prospectToEdit.age);
      setBirthDate(prospectToEdit.birthDate);
      setNationality(prospectToEdit.nationality);
      setCountryCode(prospectToEdit.countryCode);
      setCurrentClub(prospectToEdit.currentClub);
      setLeague(prospectToEdit.league);
      setPosition(prospectToEdit.position);
      setYouthCategory(prospectToEdit.youthCategory || (prospectToEdit.age <= 15 ? 'U15' : prospectToEdit.age <= 17 ? 'U17' : prospectToEdit.age <= 19 ? 'U19' : 'Senior'));
      setScope(prospectToEdit.scope);
      setTalkStage(prospectToEdit.talkStage);
      setPriority(prospectToEdit.priority);
      setAssignedAgent(prospectToEdit.assignedAgent);
      
      // Target salary loading
      setTargetSalaryAmount(prospectToEdit.targetSalaryAmount || 2500);
      setTargetSalaryCurrency(prospectToEdit.targetSalaryCurrency || defaultCurrency);
      setTargetSalaryPeriod(prospectToEdit.targetSalaryPeriod || 'Weekly');

      setVideoUrl(prospectToEdit.videoUrl);
      setVideoTitle(prospectToEdit.videoTitle);
      setVideoDescription(prospectToEdit.videoDescription || '');
      setStrengthsText(prospectToEdit.scoutingReport.strengths.join(', '));
      setAreasToImproveText(prospectToEdit.scoutingReport.areasToImprove.join(', '));
      setTacticalFit(prospectToEdit.scoutingReport.tacticalFit);
      setDominantFoot(prospectToEdit.scoutingReport.dominantFoot);
      setHeightCm(prospectToEdit.scoutingReport.heightCm);
      setInternationalCaps(prospectToEdit.scoutingReport.internationalCaps);
      setGeneralNotes(prospectToEdit.generalNotes);
    } else {
      setName('');
      setAge(18);
      setBirthDate('2008-01-01');
      setNationality('England');
      setCountryCode('GB');
      setCurrentClub('');
      setLeague('');
      setPosition('Central Midfield (CM)');
      setYouthCategory('U19');
      setScope('Local');
      setTalkStage('Initial Contact');
      setPriority('High');
      setAssignedAgent('Marcus Sterling (Senior Agent)');
      setTargetSalaryAmount(2500);
      setTargetSalaryCurrency(defaultCurrency);
      setTargetSalaryPeriod('Weekly');
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setVideoTitle('Scouting Highlight Reel');
      setVideoDescription('High-tempo game footage and technical attributes analysis.');
      setStrengthsText('Pace, Ball Control, Tactical Awareness');
      setAreasToImproveText('Aerial Strength');
      setTacticalFit('Versatile attacker with explosive counter-pressing capability.');
      setDominantFoot('Right');
      setHeightCm(170);
      setInternationalCaps(4);
      setGeneralNotes('');
    }
  }, [prospectToEdit, isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentClub.trim()) {
      alert('Please fill in candidate name and current club.');
      return;
    }

    const strengths = strengthsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const areasToImprove = areasToImproveText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const formattedWage = formatSalary(
      targetSalaryAmount,
      targetSalaryCurrency,
      targetSalaryCurrency,
      targetSalaryPeriod,
      language
    );

    const savedProspect: TalkProspect = {
      id: prospectToEdit ? prospectToEdit.id : `pros-${Date.now()}`,
      name: name.trim(),
      photoUrl: prospectToEdit?.photoUrl || '',
      age: Number(age) || 20,
      birthDate,
      nationality: nationality.trim() || 'England',
      countryCode: countryCode.trim() || 'GB',
      currentClub: currentClub.trim(),
      league: league.trim() || 'Top Tier',
      position,
      youthCategory,
      scope,
      talkStage,
      priority,
      assignedAgent: assignedAgent.trim() || 'Marcus Sterling',
      targetSalaryAmount: Number(targetSalaryAmount) || 0,
      targetSalaryCurrency,
      targetSalaryPeriod,
      videoUrl: videoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      videoTitle: videoTitle.trim() || `${name.trim()} - Tactical Video Reel`,
      videoDescription: videoDescription.trim(),
      scoutingReport: {
        strengths: strengths.length ? strengths : ['Technical quality', 'Pace'],
        areasToImprove: areasToImprove.length ? areasToImprove : ['Physical consistency'],
        tacticalFit: tacticalFit.trim(),
        dominantFoot,
        heightCm: Number(heightCm) || 170,
        internationalCaps: Number(internationalCaps) || 0,
        estimatedWageWeekly: formattedWage
      },
      conversationHistory: prospectToEdit?.conversationHistory || [
        {
          id: `c-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          channel: 'In-Person',
          summary: 'Logged initial scouting dossier and scheduled introductory conversation.',
          nextAction: 'Review full match video and contact player advisor.',
          loggedBy: assignedAgent.split(' ')[0] || 'Agent'
        }
      ],
      generalNotes: generalNotes.trim(),
      createdAt: prospectToEdit ? prospectToEdit.createdAt : new Date().toISOString().split('T')[0]
    };

    onSave(savedProspect);
    onClose();
  };

  // Converted salary previews in other currencies
  const inEur = convertCurrency(targetSalaryAmount, targetSalaryCurrency, 'EUR');
  const inUsd = convertCurrency(targetSalaryAmount, targetSalaryCurrency, 'USD');
  const inIls = convertCurrency(targetSalaryAmount, targetSalaryCurrency, 'ILS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {prospectToEdit ? 'Edit Talk Candidate Dossier' : 'Add New Candidate to "In Talk With"'}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                Recruitment
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track local and international player discussions, video reels, target salary, and age categories.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Scope Selector: Local vs International */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Recruitment Territory Scope
              </span>
              <span className="text-[11px] text-slate-500">
                Categorize whether this is local domestic talent or an international scout target
              </span>
            </div>

            <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setScope('Local')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  scope === 'Local'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Local Prospect</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('International')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  scope === 'International'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>International Target</span>
              </button>
            </div>
          </div>

          {/* Age Tier Selector: Senior vs U19 vs U17 vs U15 */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Age Category (Senior / U19 / U17 / U15) *</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Mark youth prospects for academy pathway
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {YOUTH_OPTIONS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setYouthCategory(cat)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                    youthCategory === cat
                      ? `${getYouthBadgeColor(cat)} ring-2 ring-emerald-500 shadow-xs`
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Player Identity & Club
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Candidate Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yuki Takahashi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Club *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urawa Reds, Brighton Academy"
                  value={currentClub}
                  onChange={e => setCurrentClub(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Playing Position *
                </label>
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value as PlayerPosition)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="13"
                  max="40"
                  value={age}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setAge(val);
                    if (val <= 15) setYouthCategory('U15');
                    else if (val <= 17) setYouthCategory('U17');
                    else if (val <= 19) setYouthCategory('U19');
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <NationalitySelect
                  value={nationality}
                  countryCode={countryCode}
                  onChange={(selectedName, selectedCode) => {
                    setNationality(selectedName);
                    setCountryCode(selectedCode);
                  }}
                  language={language}
                  label="Nationality"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Talk Negotiation Stage *
                </label>
                <select
                  value={talkStage}
                  onChange={e => setTalkStage(e.target.value as TalkStage)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {STAGES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agency Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Agent
                </label>
                <input
                  type="text"
                  value={assignedAgent}
                  onChange={e => setAssignedAgent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* TARGET SALARY & CURRENCY SELECTION SECTION */}
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                  {t.targetSalary} & Compensation
                </h3>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Supports NIS, USD ($) & Euros (€)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Salary Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">
                    {CURRENCY_SYMBOLS[targetSalaryCurrency]}
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetSalaryAmount}
                    onChange={e => setTargetSalaryAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono-tabular font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Currency Selector (NIS, Dollar, Euros) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Salary Currency *
                </label>
                <select
                  value={targetSalaryCurrency}
                  onChange={e => setTargetSalaryCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="EUR">Euros (€ EUR)</option>
                  <option value="USD">US Dollars ($ USD)</option>
                  <option value="ILS">Israeli Shekels (₪ NIS)</option>
                </select>
              </div>

              {/* Payment Cadence */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Cadence
                </label>
                <select
                  value={targetSalaryPeriod}
                  onChange={e => setTargetSalaryPeriod(e.target.value as SalaryPeriod)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Weekly">{t.weekly} (/wk)</option>
                  <option value="Monthly">{t.monthly} (/mo)</option>
                  <option value="Annual">{t.annual} (/yr)</option>
                </select>
              </div>
            </div>

            {/* Live Multi-Currency Conversion Preview */}
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-mono-tabular">
              <span>Automatic Conversion Reference:</span>
              <div className="flex items-center gap-3">
                <span>€{new Intl.NumberFormat().format(inEur)}</span>
                <span>·</span>
                <span>${new Intl.NumberFormat().format(inUsd)}</span>
                <span>·</span>
                <span className="font-bold">₪{new Intl.NumberFormat().format(inIls)} NIS</span>
              </div>
            </div>
          </div>

          {/* Video Highlights & Reel */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Scouting Video Highlights & Clip Information
              </h3>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Provide direct video reel (MP4, YouTube, Vimeo, Hudl) to evaluate tactical attributes.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Video URL (MP4, YouTube, Vimeo, Hudl) *
              </label>
              <input
                type="text"
                required
                placeholder="https://..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Video Reel Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025/26 Season - Key Touches & Goals"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Video Notes / Timestamps
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01:20 1v1 takeon, 02:45 line-breaking pass"
                  value={videoDescription}
                  onChange={e => setVideoDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Scouting Attributes & Intelligence */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Scouting Intelligence & Player Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Top Strengths (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. First touch, Tactical vision, Aerial power"
                  value={strengthsText}
                  onChange={e => setStrengthsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Areas to Develop
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weak foot finishing, Defensive positioning"
                  value={areasToImproveText}
                  onChange={e => setAreasToImproveText(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tactical Fit & Playing Style Analysis
              </label>
              <textarea
                rows={2}
                placeholder="Describe tactical fit in 4-3-3 or 3-5-2, pressing triggers, counter-attack velocity..."
                value={tacticalFit}
                onChange={e => setTacticalFit(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dominant Foot
                </label>
                <select
                  value={dominantFoot}
                  onChange={e => setDominantFoot(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Int'l Caps
                </label>
                <input
                  type="number"
                  value={internationalCaps}
                  onChange={e => setInternationalCaps(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              General Discussion Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Met with family at hotel, player open to youth contract or transfer next window..."
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              {prospectToEdit ? 'Save Changes' : 'Save to Talk Pipeline'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
