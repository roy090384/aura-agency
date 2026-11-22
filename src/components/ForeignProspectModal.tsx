import React, { useState, useEffect } from 'react';
import {
  ForeignProspect,
  TargetMarketOption,
  ForeignNegotiationStatus,
  ClubOfferEntry,
  ClubOfferStatus,
  PlayerPosition,
  PlayerGender,
  Language
} from '../types/player';
import { ISRAELI_WOMEN_CLUBS, formatWomenClubValue } from '../data/womenClubs';
import { ISRAELI_MALE_YOUTH_CLUBS, formatMaleClubValue, loadCustomMaleClubs } from '../data/maleClubs';
import { POSITION_TRANSLATIONS, MALE_POSITION_TRANSLATIONS } from '../translations/translations';
import { calculateAgeFromBirthDate } from '../utils/birthdayAlerts';
import { X, Globe, Plus, Trash2, Building2, Link as LinkIcon, Banknote, ShieldCheck, Users } from 'lucide-react';

interface ForeignProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: ForeignProspect) => void;
  prospectToEdit?: ForeignProspect | null;
  language?: Language;
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

export const TARGET_MARKET_OPTIONS: { value: TargetMarketOption; en: string; he: string }[] = [
  { value: 'Israel - Premier League', en: 'Israel - Premier League', he: 'ישראל - ליגת העל' },
  { value: 'Israel - National League', en: 'Israel - National League', he: 'ישראל - ליגה לאומית' },
  { value: 'Europe', en: 'Europe', he: 'אירופה' }
];

export const FOREIGN_STATUS_OPTIONS: { value: ForeignNegotiationStatus; en: string; he: string }[] = [
  { value: 'Initial Contact', en: 'Initial Contact', he: 'יצירת קשר ראשונית' },
  { value: 'In Talks to Sign', en: 'In Talks to Sign', he: 'בשיחות להחתמה בסוכנות' },
  { value: 'Video/Data Review', en: 'Video/Data Review', he: 'בדיקת וידאו ונתונים' },
  { value: 'Representation Mandate Sent', en: 'Representation Mandate Sent', he: 'נשלח מנדט ייצוג' },
  { value: 'Signed with Agency', en: 'Signed with Agency', he: 'חתומה בסוכנות' },
  { value: 'Offered to Clubs', en: 'Offered to Clubs', he: 'מוצעת לקבוצות' }
];

export const OFFER_STATUS_OPTIONS: { value: ClubOfferStatus; en: string; he: string }[] = [
  { value: 'Sent', en: 'Sent', he: 'נשלח' },
  { value: 'Reviewing', en: 'Reviewing', he: 'בבדיקה' },
  { value: 'Interested', en: 'Interested', he: 'מעוניינת' },
  { value: 'Declined', en: 'Declined', he: 'נדחה' }
];

const PASSPORT_CATEGORIES = [
  { value: 'EU Passport', en: 'EU Passport', he: 'דרכון אירופי (EU)' },
  { value: 'US / North America', en: 'US / North America', he: 'ארה"ב / צפון אמריקה' },
  { value: 'South America', en: 'South America', he: 'דרום אמריקה' },
  { value: 'Africa', en: 'Africa', he: 'אפריקה' },
  { value: 'UK / Europe (Non-EU)', en: 'UK / Europe (Non-EU)', he: 'בריטניה / אירופה (לא EU)' },
  { value: 'Asia / Oceania', en: 'Asia / Oceania', he: 'אסיה / אוקיאניה' },
  { value: 'Other', en: 'Other', he: 'אחר' }
];

export const ForeignProspectModal: React.FC<ForeignProspectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  prospectToEdit,
  language = 'en'
}) => {
  const isHe = language === 'he';

  const [gender, setGender] = useState<PlayerGender>('Female');
  const [fullName, setFullName] = useState('');
  const [passportCategory, setPassportCategory] = useState('EU Passport');
  const [nationalityPassport, setNationalityPassport] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<number>(23);
  const [primaryPosition, setPrimaryPosition] = useState<string>('Striker (ST)');
  const [secondaryPosition, setSecondaryPosition] = useState<string>('');
  const [currentClub, setCurrentClub] = useState('');
  const [currentLeague, setCurrentLeague] = useState('');
  const [targetMarkets, setTargetMarkets] = useState<TargetMarketOption[]>(['Israel - Premier League']);
  const [negotiationStatus, setNegotiationStatus] = useState<ForeignNegotiationStatus>('Initial Contact');
  const [clubsOfferedTo, setClubsOfferedTo] = useState<ClubOfferEntry[]>([]);
  const [salaryExpectations, setSalaryExpectations] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [agentNotes, setAgentNotes] = useState('');

  // Draft club offer row inputs
  const [draftClubName, setDraftClubName] = useState('');
  const [draftOfferStatus, setDraftOfferStatus] = useState<ClubOfferStatus>('Sent');
  const [draftOfferNotes, setDraftOfferNotes] = useState('');

  useEffect(() => {
    if (prospectToEdit) {
      setGender(prospectToEdit.gender === 'Male' ? 'Male' : 'Female');
      setFullName(prospectToEdit.fullName);
      setPassportCategory(prospectToEdit.passportCategory || 'EU Passport');
      setNationalityPassport(prospectToEdit.nationalityPassport);
      setBirthDate(prospectToEdit.birthDate || '');
      setAge(prospectToEdit.age || 23);
      setPrimaryPosition(prospectToEdit.primaryPosition || 'Striker (ST)');
      setSecondaryPosition(prospectToEdit.secondaryPosition || '');
      setCurrentClub(prospectToEdit.currentClub || '');
      setCurrentLeague(prospectToEdit.currentLeague || '');
      setTargetMarkets(
        prospectToEdit.targetMarkets && prospectToEdit.targetMarkets.length > 0
          ? prospectToEdit.targetMarkets
          : ['Israel - Premier League']
      );
      setNegotiationStatus(prospectToEdit.negotiationStatus || 'Initial Contact');
      setClubsOfferedTo(prospectToEdit.clubsOfferedTo || []);
      setSalaryExpectations(prospectToEdit.salaryExpectations || '');
      setProfileLink(prospectToEdit.profileLink || '');
      setAgentNotes(prospectToEdit.agentNotes || '');
    } else {
      setGender('Female');
      setFullName('');
      setPassportCategory('EU Passport');
      setNationalityPassport('');
      setBirthDate('');
      setAge(23);
      setPrimaryPosition('Striker (ST)');
      setSecondaryPosition('');
      setCurrentClub('');
      setCurrentLeague('');
      setTargetMarkets(['Israel - Premier League']);
      setNegotiationStatus('Initial Contact');
      setClubsOfferedTo([]);
      setSalaryExpectations('');
      setProfileLink('');
      setAgentNotes('');
    }
    setDraftClubName('');
    setDraftOfferStatus('Sent');
    setDraftOfferNotes('');
  }, [prospectToEdit, isOpen]);

  if (!isOpen) return null;

  const isMale = gender === 'Male';
  const posTranslations = isMale ? MALE_POSITION_TRANSLATIONS : POSITION_TRANSLATIONS;
  const customMaleClubs = isMale ? loadCustomMaleClubs() : [];
  const maleOfferSuggestions = isMale ? [...ISRAELI_MALE_YOUTH_CLUBS, ...customMaleClubs] : [];

  const toggleMarket = (market: TargetMarketOption) => {
    setTargetMarkets(prev =>
      prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]
    );
  };

  const handleAddClubOffer = () => {
    const trimmed = draftClubName.trim();
    if (!trimmed) return;
    const newEntry: ClubOfferEntry = {
      id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clubName: trimmed,
      status: draftOfferStatus,
      date: new Date().toISOString().split('T')[0],
      notes: draftOfferNotes.trim() || undefined
    };
    setClubsOfferedTo(prev => [...prev, newEntry]);
    setDraftClubName('');
    setDraftOfferStatus('Sent');
    setDraftOfferNotes('');
  };

  const handleUpdateOfferStatus = (offerId: string, status: ClubOfferStatus) => {
    setClubsOfferedTo(prev =>
      prev.map(o => (o.id === offerId ? { ...o, status } : o))
    );
  };

  const handleRemoveOffer = (offerId: string) => {
    setClubsOfferedTo(prev => prev.filter(o => o.id !== offerId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !nationalityPassport.trim()) return;

    // Auto-include any pending draft club offer so nothing typed is lost
    let finalOffers = [...clubsOfferedTo];
    if (draftClubName.trim()) {
      finalOffers.push({
        id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        clubName: draftClubName.trim(),
        status: draftOfferStatus,
        date: new Date().toISOString().split('T')[0],
        notes: draftOfferNotes.trim() || undefined
      });
    }

    const nowIso = new Date().toISOString().split('T')[0];
    const statusChanged =
      !prospectToEdit || prospectToEdit.negotiationStatus !== negotiationStatus;
    const nextStatusUpdatedAt = statusChanged
      ? nowIso
      : prospectToEdit.statusUpdatedAt || prospectToEdit.updatedAt || prospectToEdit.createdAt;

    const saved: ForeignProspect = {
      id: prospectToEdit ? prospectToEdit.id : `fpros-${Date.now()}`,
      fullName: fullName.trim(),
      gender,
      nationalityPassport: nationalityPassport.trim(),
      passportCategory,
      age: Number(age) || 22,
      birthDate: birthDate || undefined,
      primaryPosition,
      secondaryPosition: secondaryPosition || undefined,
      currentClub: currentClub.trim() || (isHe ? (isMale ? 'שחקן חופשי' : 'שחקנית חופשית') : 'Free Agent'),
      currentLeague: currentLeague.trim() || '-',
      targetMarkets: targetMarkets.length > 0 ? targetMarkets : ['Israel - Premier League'],
      negotiationStatus,
      clubsOfferedTo: finalOffers,
      salaryExpectations: salaryExpectations.trim() || undefined,
      profileLink: profileLink.trim() || undefined,
      agentNotes: agentNotes.trim() || undefined,
      createdAt: prospectToEdit ? prospectToEdit.createdAt : nowIso,
      updatedAt: nowIso,
      statusUpdatedAt: nextStatusUpdatedAt
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {prospectToEdit
                  ? isHe
                    ? isMale ? 'עריכת מועמד זר / בינלאומי' : 'עריכת מועמדת זרה / בינלאומית'
                    : 'Edit International / Foreign Prospect'
                  : isHe
                  ? isMale ? 'הוספת מועמד זר / בינלאומי (ישראל / אירופה)' : 'הוספת מועמדת זרה / בינלאומית (ישראל / אירופה)'
                  : isMale ? 'Add International / Foreign Male Prospect' : 'Add International / Foreign Female Prospect'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'ניהול מו"מ להחתמה בסוכנות והצעות לשיבוץ בקבוצות בישראל ובאירופה.'
                  : 'Track non-Israeli player signing negotiations, passport quotas, and club placement pitches.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Gender Toggle: Female vs Male */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>{isHe ? 'מגזר שחקן (נשים / גברים)' : 'Player Category (Female / Male)'}</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isHe
                  ? 'בחירת גברים תעדכן את הצעות הקבוצות בישראל למועדוני גברים'
                  : 'Selecting Male switches Israeli club pitch suggestions to Men clubs'}
              </span>
            </div>
            <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setGender('Female')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !isMale ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isHe ? 'נשים' : 'Female'}
              </button>
              <button
                type="button"
                onClick={() => setGender('Male')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isMale ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isHe ? 'גברים' : 'Male'}
              </button>
            </div>
          </div>

          {/* 1. Identity & Passport */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              {isHe ? (isMale ? 'פרטי שחקן ודרכון (למכסת זרים)' : 'פרטי שחקנית ודרכון (למכסת זרות)') : 'Player Identity & Passport Quota'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'שם מלא של השחקנית *' : 'Player Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={isHe ? 'לדוגמה: Maria Gonzalez' : 'e.g. Maria Gonzalez'}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'אזור / סוג דרכון' : 'Passport Region / Quota Type'}
                </label>
                <select
                  value={passportCategory}
                  onChange={e => setPassportCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {PASSPORT_CATEGORIES.map(p => (
                    <option key={p.value} value={p.value}>
                      {isHe ? p.he : p.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'אזרחות / פירוט דרכון *' : 'Nationality / Passport *'}
                </label>
                <input
                  type="text"
                  required
                  value={nationalityPassport}
                  onChange={e => setNationalityPassport(e.target.value)}
                  placeholder={isHe ? 'לדוגמה: ספרד (דרכון אירופי) / ארה"ב' : 'e.g. EU Passport (Spain), USA, Brazil'}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'תאריך לידה (אופציונלי)' : 'Date of Birth (Optional)'}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => {
                    const val = e.target.value;
                    setBirthDate(val);
                    if (val) {
                      setAge(calculateAgeFromBirthDate(val));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'גיל' : 'Age'}
                </label>
                <input
                  type="number"
                  min={15}
                  max={45}
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 2. Positions & Current Club / League */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isHe ? 'עמדה ראשית *' : 'Primary Position *'}
              </label>
              <select
                value={primaryPosition}
                onChange={e => setPrimaryPosition(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>
                    {isHe ? (posTranslations.he[pos] || pos) : pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isHe ? 'עמדה משנית' : 'Secondary Position'}
              </label>
              <select
                value={secondaryPosition}
                onChange={e => setSecondaryPosition(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">{isHe ? 'ללא' : 'None'}</option>
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>
                    {isHe ? (posTranslations.he[pos] || pos) : pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isHe ? 'קבוצה נוכחית / אחרונה' : 'Current / Last Club'}
              </label>
              <input
                type="text"
                value={currentClub}
                onChange={e => setCurrentClub(e.target.value)}
                placeholder={isHe ? 'לדוגמה: Sporting CP' : 'e.g. Sporting CP'}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isHe ? 'ליגה נוכחית / אחרונה' : 'Current / Last League'}
              </label>
              <input
                type="text"
                value={currentLeague}
                onChange={e => setCurrentLeague(e.target.value)}
                placeholder={isHe ? 'לדוגמה: Liga BPI / NCAA D1' : 'e.g. Liga BPI, NCAA D1'}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 3. Target Market & Agency Signing / Negotiation Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {isHe ? 'שוק יעד (ניתן לבחור יותר מאחד):' : 'Target Market (Multi-select):'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_MARKET_OPTIONS.map(opt => {
                    const active = targetMarkets.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleMarket(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {isHe ? opt.he : opt.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isHe
                      ? 'סטטוס החתמה / מו"מ בסוכנות *'
                      : 'Agency Signing / Negotiation Status *'}
                  </span>
                </label>
                <select
                  value={negotiationStatus}
                  onChange={e =>
                    setNegotiationStatus(e.target.value as ForeignNegotiationStatus)
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {FOREIGN_STATUS_OPTIONS.map(st => (
                    <option key={st.value} value={st.value}>
                      {isHe ? `${st.he} (${st.en})` : st.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Clubs Offered To (מעקב הצעות לקבוצות) */}
          <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>
                  {isHe
                    ? 'מעקב הצעות לקבוצות (ישראל / אירופה)'
                    : 'Clubs Offered To (מעקב הצעות לקבוצות)'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isHe
                  ? 'תעד את הקבוצות בישראל או באירופה שאליהן הוצעה השחקנית ואת סטטוס ההצעה בכל קבוצה.'
                  : 'Log every Israeli or European club this player has been pitched to and track club feedback.'}
              </p>
            </div>

            {/* Add new club offer row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isHe ? 'שם הקבוצה (ישראל / אירופה)' : 'Club Name (Israel / Europe)'}
                </label>
                <input
                  type="text"
                  list="foreign-clubs-offer-suggestions"
                  value={draftClubName}
                  onChange={e => setDraftClubName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddClubOffer();
                    }
                  }}
                  placeholder={
                    isMale
                      ? isHe ? 'לדוגמה: מכבי חיפה / FC Basel' : 'e.g. Maccabi Haifa / FC Basel'
                      : isHe ? 'לדוגמה: מ.ס. קריית גת / Braga' : 'e.g. Kiryat Gat / FC Basel'
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <datalist id="foreign-clubs-offer-suggestions">
                  {isMale
                    ? maleOfferSuggestions.map(c => (
                        <option key={c.id} value={formatMaleClubValue(c, language)} />
                      ))
                    : ISRAELI_WOMEN_CLUBS.map(c => (
                        <option key={c.id} value={formatWomenClubValue(c, language)} />
                      ))}
                </datalist>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isHe ? 'סטטוס הצעה' : 'Offer Status'}
                </label>
                <select
                  value={draftOfferStatus}
                  onChange={e => setDraftOfferStatus(e.target.value as ClubOfferStatus)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {OFFER_STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {isHe ? o.he : o.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isHe ? 'הערה קצרה' : 'Note (opt.)'}
                </label>
                <input
                  type="text"
                  value={draftOfferNotes}
                  onChange={e => setDraftOfferNotes(e.target.value)}
                  placeholder={isHe ? 'תגובה / תאריך' : 'Feedback'}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddClubOffer}
                  className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHe ? 'הוסף' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Existing logged club offers */}
            {clubsOfferedTo.length > 0 ? (
              <div className="space-y-1.5">
                {clubsOfferedTo.map(offer => (
                  <div
                    key={offer.id}
                    className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {offer.clubName}
                      </span>
                      {offer.notes && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mx-2">
                          · {offer.notes}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={offer.status}
                        onChange={e =>
                          handleUpdateOfferStatus(offer.id, e.target.value as ClubOfferStatus)
                        }
                        className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        {OFFER_STATUS_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>
                            {isHe ? o.he : o.en}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveOffer(offer.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title={isHe ? 'הסר הצעה' : 'Remove offer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                {isHe
                  ? 'טרם תועדו הצעות לקבוצות. ניתן להוסיף קבוצה למעלה.'
                  : 'No club pitches logged yet. Add clubs above to track offers.'}
              </div>
            )}
          </div>

          {/* 5. Financial Terms & Highlight/Profile Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isHe
                    ? 'ציפיות שכר / תנאים כספיים (אופציונלי)'
                    : 'Salary Expectations / Financial Terms (Optional)'}
                </span>
              </label>
              <input
                type="text"
                value={salaryExpectations}
                onChange={e => setSalaryExpectations(e.target.value)}
                placeholder={isHe ? 'לדוגמה: €2,200 נטו + דירה' : 'e.g. €2,200/mo net + housing'}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isHe
                    ? 'קישור וידאו / Transfermarkt / Soccerway'
                    : 'Highlight Video / Transfermarkt / Soccerway Link'}
                </span>
              </label>
              <input
                type="url"
                value={profileLink}
                onChange={e => setProfileLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 6. Agent Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isHe
                ? 'הערות סוכן (צעדים הבאים, חלון זמינות, וכו׳)'
                : 'Agent Notes (Next steps, availability window, etc.)'}
            </label>
            <textarea
              rows={2}
              value={agentNotes}
              onChange={e => setAgentNotes(e.target.value)}
              placeholder={
                isHe
                  ? 'לדוגמה: פנויה בחלון הקיץ, ממתינים לסרטון מלא ממשחקי העונה...'
                  : 'e.g. Available for summer window, waiting on full 90-min match footage...'
              }
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isHe ? 'ביטול' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              {prospectToEdit
                ? isHe
                  ? 'שמור שינויים'
                  : 'Save Changes'
                : isHe
                ? 'שמור מועמדת זרה'
                : 'Add Foreign Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
