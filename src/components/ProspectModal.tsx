import React, { useState, useEffect } from 'react';
import { TalkProspect, ProspectScope, TalkStage, PlayerPosition, YouthCategory, Language, Currency, PlayerGender, AgentProfile } from '../types/player';
import { POSITION_TRANSLATIONS, MALE_POSITION_TRANSLATIONS, getYouthBadgeColor } from '../translations/translations';
import { X, Video, Globe, MapPin, Tag, UserCheck, Users } from 'lucide-react';
import { NationalitySelect } from './NationalitySelect';
import { WomenClubSelect } from './WomenClubSelect';
import { MaleClubSelect } from './MaleClubSelect';
import { findWomenClubByString } from '../data/womenClubs';
import { findMaleClubByString } from '../data/maleClubs';
import { DEFAULT_AGENTS } from '../data/defaultAgents';

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: TalkProspect) => void;
  prospectToEdit?: TalkProspect | null;
  language?: Language;
  defaultCurrency?: Currency;
  agents?: AgentProfile[];
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

const FEMALE_YOUTH_OPTIONS: YouthCategory[] = ['Senior', 'U19', 'U17', 'U15'];
const MALE_YOUTH_OPTIONS: YouthCategory[] = ['Senior', 'U19', 'U17', 'U16', 'U15', 'U14'];

export const ProspectModal: React.FC<ProspectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  prospectToEdit,
  language = 'en',
  agents = DEFAULT_AGENTS
}) => {
  const [gender, setGender] = useState<PlayerGender>('Female');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(18);
  const [birthDate, setBirthDate] = useState('2008-01-01');
  const [nationality, setNationality] = useState('Israel');
  const [countryCode, setCountryCode] = useState('IL');
  const [currentClub, setCurrentClub] = useState('');
  const [league, setLeague] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('Central Midfield (CM)');
  const [youthCategory, setYouthCategory] = useState<YouthCategory>('U19');
  const [scope, setScope] = useState<ProspectScope>('Local');
  const [talkStage, setTalkStage] = useState<TalkStage>('Initial Contact');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [assignedAgent, setAssignedAgent] = useState(agents[0]?.name || 'Roy Shpitalnik');

  // Video info (Optional)
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  // Scouting report
  const [strengthsText, setStrengthsText] = useState('Vision & Passing, Pace in Transition, Physical Stamina');
  const [areasToImproveText, setAreasToImproveText] = useState('Aerial Duels, Weak-foot consistency');
  const [tacticalFit, setTacticalFit] = useState('Dynamic playmaker suited for high-tempo attacking team with high agency potential.');
  const [dominantFoot, setDominantFoot] = useState<'Right' | 'Left' | 'Both'>('Right');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [internationalCaps, setInternationalCaps] = useState<number>(4);
  const [generalNotes, setGeneralNotes] = useState('');

  useEffect(() => {
    if (prospectToEdit) {
      const editGender: PlayerGender = prospectToEdit.gender === 'Male' ? 'Male' : 'Female';
      setGender(editGender);
      setName(prospectToEdit.name);
      setAge(prospectToEdit.age);
      setBirthDate(prospectToEdit.birthDate);
      setNationality(prospectToEdit.nationality);
      setCountryCode(prospectToEdit.countryCode);
      setCurrentClub(prospectToEdit.currentClub);
      setLeague(prospectToEdit.league);
      setPosition(prospectToEdit.position);
      setYouthCategory(
        prospectToEdit.youthCategory ||
          (prospectToEdit.age <= 14 && editGender === 'Male'
            ? 'U14'
            : prospectToEdit.age <= 15
            ? 'U15'
            : prospectToEdit.age === 16 && editGender === 'Male'
            ? 'U16'
            : prospectToEdit.age <= 17
            ? 'U17'
            : prospectToEdit.age <= 19
            ? 'U19'
            : 'Senior')
      );
      setScope(prospectToEdit.scope);
      setTalkStage(prospectToEdit.talkStage);
      setPriority(prospectToEdit.priority);
      setAssignedAgent(prospectToEdit.assignedAgent);

      setVideoUrl(prospectToEdit.videoUrl || '');
      setVideoTitle(prospectToEdit.videoTitle || '');
      setVideoDescription(prospectToEdit.videoDescription || '');
      setStrengthsText(prospectToEdit.scoutingReport?.strengths?.join(', ') || '');
      setAreasToImproveText(prospectToEdit.scoutingReport?.areasToImprove?.join(', ') || '');
      setTacticalFit(prospectToEdit.scoutingReport?.tacticalFit || '');
      setDominantFoot(prospectToEdit.scoutingReport?.dominantFoot || 'Right');
      setHeightCm(prospectToEdit.scoutingReport?.heightCm || 170);
      setInternationalCaps(prospectToEdit.scoutingReport?.internationalCaps || 0);
      setGeneralNotes(prospectToEdit.generalNotes || '');
    } else {
      setGender('Female');
      setName('');
      setAge(18);
      setBirthDate('2008-01-01');
      setNationality('Israel');
      setCountryCode('IL');
      setCurrentClub('');
      setLeague('');
      setPosition('Central Midfield (CM)');
      setYouthCategory('U19');
      setScope('Local');
      setTalkStage('Initial Contact');
      setPriority('High');
      setAssignedAgent(agents[0]?.name || 'Roy Shpitalnik');
      setVideoUrl('');
      setVideoTitle('');
      setVideoDescription('');
      setStrengthsText('Pace, Ball Control, Tactical Awareness');
      setAreasToImproveText('Aerial Strength');
      setTacticalFit('Versatile candidate with outstanding commercial and sporting representation potential.');
      setDominantFoot('Right');
      setHeightCm(170);
      setInternationalCaps(0);
      setGeneralNotes('');
    }
  }, [prospectToEdit, isOpen, agents]);

  if (!isOpen) return null;

  const isMale = gender === 'Male';
  const youthOptions = isMale ? MALE_YOUTH_OPTIONS : FEMALE_YOUTH_OPTIONS;
  const posTranslations = isMale ? MALE_POSITION_TRANSLATIONS : POSITION_TRANSLATIONS;

  const handleGenderChange = (nextGender: PlayerGender) => {
    if (nextGender === gender) return;
    setGender(nextGender);

    if (nextGender === 'Male') {
      // Clear female-only club selection so the Male clubs dropdown updates cleanly
      if (currentClub && findWomenClubByString(currentClub) && !findMaleClubByString(currentClub)) {
        setCurrentClub('');
      }
      if (
        !league ||
        league.includes("Women's") ||
        league.includes('לנשים')
      ) {
        setLeague(language === 'he' ? 'ליגת העל לנוער' : 'Israeli Youth Premier League');
      }
    } else {
      // Clear male-only club selection when switching back to Female
      if (currentClub && findMaleClubByString(currentClub) && !findWomenClubByString(currentClub)) {
        setCurrentClub('');
      }
      if (youthCategory === 'U14') setYouthCategory('U15');
      else if (youthCategory === 'U16') setYouthCategory('U17');
      if (
        !league ||
        league.includes('Youth') ||
        league.includes('לנוער')
      ) {
        setLeague(language === 'he' ? 'ליגת העל לנשים' : "Israeli Women's Premier League");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentClub.trim()) {
      alert(language === 'he' ? 'נא למלא שם שחקן/ית וקבוצה נוכחית.' : 'Please fill in candidate name and current club.');
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

    const trimmedVideo = videoUrl.trim();
    const savedProspect: TalkProspect = {
      id: prospectToEdit ? prospectToEdit.id : `pros-${Date.now()}`,
      name: name.trim(),
      gender,
      photoUrl: prospectToEdit?.photoUrl || '',
      age: Number(age) || 20,
      birthDate,
      nationality: nationality.trim() || 'Israel',
      countryCode: countryCode.trim() || 'IL',
      currentClub: currentClub.trim(),
      league: league.trim() || (isMale ? 'Israeli Youth Premier League' : 'Top Tier'),
      position,
      youthCategory,
      scope,
      talkStage,
      priority,
      assignedAgent: assignedAgent.trim() || agents[0]?.name || 'Roy Shpitalnik',
      videoUrl: trimmedVideo,
      videoTitle: videoTitle.trim() || (trimmedVideo ? `${name.trim()} - Video Highlights` : ''),
      videoDescription: videoDescription.trim(),
      scoutingReport: {
        strengths: strengths.length ? strengths : ['Technical quality', 'Pace'],
        areasToImprove: areasToImprove.length ? areasToImprove : ['Physical consistency'],
        tacticalFit: tacticalFit.trim(),
        dominantFoot,
        heightCm: Number(heightCm) || 170,
        internationalCaps: Number(internationalCaps) || 0,
        estimatedWageWeekly: ''
      },
      conversationHistory: prospectToEdit?.conversationHistory || [
        {
          id: `c-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          channel: 'In-Person',
          summary: 'Logged initial scouting dossier and scheduled introductory representation meeting.',
          nextAction: 'Review player profile and establish contact with agency leadership.',
          loggedBy: assignedAgent.split(' ')[0] || 'Agent'
        }
      ],
      generalNotes: generalNotes.trim(),
      createdAt: prospectToEdit ? prospectToEdit.createdAt : new Date().toISOString().split('T')[0]
    };

    onSave(savedProspect);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {prospectToEdit
                  ? isMale
                    ? language === 'he' ? 'עריכת מועמד לייצוג בסוכנות' : 'Edit Male Candidate Dossier'
                    : language === 'he' ? 'עריכת מועמדת לייצוג בסוכנות' : 'Edit Female Candidate Dossier'
                  : isMale
                  ? language === 'he' ? 'הוספת מועמד חדש לייצוג בסוכנות' : 'Add New Male Candidate for Agency'
                  : language === 'he' ? 'הוספת מועמדת חדשה לייצוג בסוכנות' : 'Add New Female Candidate for Agency'}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                isMale
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}>
                {isMale
                  ? language === 'he' ? 'מועמד (גברים / נוער)' : 'Male Candidate'
                  : language === 'he' ? 'מועמדת (נשים)' : 'Female Candidate'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'he'
                ? 'ניהול מועמדים ומועמדות לייצוג בסוכנות BRIT SPORT GROUP Management, סקאוטינג, סרטוני ביצועים ושלבי החתמה.'
                : 'Track prospective male & female representation candidates for BRIT SPORT GROUP Management, scouting reports, optional video reels, and agency signing stages.'}
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

          {/* Player Gender Selector: Female vs Male */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'he' ? 'מגזר / סגל שחקן (נשים / גברים)' : 'Player Roster Category (Female / Male)'}</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {language === 'he'
                  ? 'בחירת גברים / נוער תעדכן אוטומטית את רשימת הקבוצות למועדוני גברים ונוער'
                  : 'Choosing Male automatically updates the club selector to the Men / Youth clubs list'}
              </span>
            </div>

            <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => handleGenderChange('Female')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !isMale
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {language === 'he' ? 'שחקנית (נשים)' : 'Female Player'}
              </button>

              <button
                type="button"
                onClick={() => handleGenderChange('Male')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isMale
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {language === 'he' ? 'שחקן (גברים / נוער)' : 'Male Player'}
              </button>
            </div>
          </div>

          {/* Scope Selector: Local vs International */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                {language === 'he' ? 'היקף טריטוריאלי לייצוג' : 'Representation Territory Scope'}
              </span>
              <span className="text-[11px] text-slate-500">
                {language === 'he'
                  ? 'סיווג כישרון ישראלי מקומי או יעד סקאוטינג וייצוג בינלאומי'
                  : 'Categorize whether this is local domestic talent or an international scout target for agency representation'}
              </span>
            </div>

            <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
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
                <span>{language === 'he' ? (isMale ? 'מועמד מקומי' : 'מועמדת מקומית') : 'Local Candidate'}</span>
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
                <span>{language === 'he' ? (isMale ? 'מועמד בינלאומי' : 'מועמדת בינלאומית') : 'International Candidate'}</span>
              </button>
            </div>
          </div>

          {/* Age Tier Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Age Category ({isMale ? 'Senior / U19 / U17 / U16 / U15 / U14' : 'Senior / U19 / U17 / U15'}) *
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                Mark youth prospects for academy pathway
              </span>
            </div>

            <div className={`grid gap-2 ${isMale ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-4'}`}>
              {youthOptions.map(cat => (
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
                  {language === 'he' ? (isMale ? 'שם מלא של המועמד *' : 'שם מלא של המועמדת *') : 'Full Candidate Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isMale ? 'e.g. Liel Abada / Yonatan Cohen' : 'e.g. Yuki Takahashi'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                {isMale ? (
                  <MaleClubSelect
                    key="prospect-male-club-select"
                    value={currentClub}
                    onChange={(selectedClub, suggestedLeague) => {
                      setCurrentClub(selectedClub);
                      if (suggestedLeague !== undefined) {
                        setLeague(suggestedLeague);
                      }
                    }}
                    language={language}
                    label={language === 'he' ? 'קבוצה / מחלקת נוער נוכחית (גברים)' : 'Current Club (Male / Youth)'}
                    required
                  />
                ) : (
                  <WomenClubSelect
                    key="prospect-women-club-select"
                    value={currentClub}
                    onChange={(selectedClub, suggestedLeague) => {
                      setCurrentClub(selectedClub);
                      if (suggestedLeague !== undefined) {
                        setLeague(suggestedLeague);
                      }
                    }}
                    language={language}
                    label={language === 'he' ? 'קבוצה נוכחית (נשים)' : 'Current Club (Female)'}
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'ליגה' : 'League'}
                </label>
                <input
                  type="text"
                  placeholder={isMale ? 'e.g. Israeli Youth Premier League' : "e.g. Israeli Women's Premier League"}
                  value={league}
                  onChange={e => setLeague(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'עמדה *' : 'Playing Position *'}
                </label>
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value as PlayerPosition)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>
                      {language === 'he' ? (posTranslations.he[pos] || pos) : pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'גיל' : 'Age'}
                </label>
                <input
                  type="number"
                  min="12"
                  max="40"
                  value={age}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setAge(val);
                    if (isMale && val <= 14) setYouthCategory('U14');
                    else if (val <= 15) setYouthCategory('U15');
                    else if (isMale && val === 16) setYouthCategory('U16');
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
                  label={language === 'he' ? 'לאום' : 'Nationality'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'שלב בשיחות הייצוג *' : 'Agency Representation Stage *'}
                </label>
                <select
                  value={talkStage}
                  onChange={e => setTalkStage(e.target.value as TalkStage)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {STAGES.map(st => (
                    <option key={st} value={st}>
                      {st === 'Signed'
                        ? (language === 'he'
                            ? isMale ? 'נחתם בסוכנות (העברה לסגל בנים)' : 'נחתמה בסוכנות (העברה לסגל נשים)'
                            : isMale ? 'Signed in Agency (Move to Male Roster)' : 'Signed in Agency (Move to Female Roster)')
                        : st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'עדיפות בסוכנות' : 'Agency Priority'}
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
                  {language === 'he' ? 'סוכן מטפל' : 'Assigned Agent'}
                </label>
                <input
                  type="text"
                  list="prospect-assigned-agent-list"
                  value={assignedAgent}
                  onChange={e => setAssignedAgent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <datalist id="prospect-assigned-agent-list">
                  {agents.map(ag => (
                    <option key={ag.id} value={ag.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {talkStage === 'Signed' && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <UserCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {language === 'he'
                    ? isMale
                      ? 'שמירה במצב "נחתם בסוכנות" תעביר את השחקן אוטומטית לסגל בנים ונוער ותסיר אותו מרשימת המועמדים.'
                      : 'שמירה במצב "נחתמה בסוכנות" תעביר את השחקנית אוטומטית לסגל השחקניות הרשמי ותסיר אותה מרשימת המועמדות.'
                    : isMale
                      ? 'Saving as "Signed in Agency" will automatically move this player to the Male Roster and remove him from In Talk With.'
                      : 'Saving as "Signed in Agency" will automatically move this player to the Female Roster and remove her from In Talk With.'}
                </span>
              </div>
            )}
          </div>

          {/* Video Highlights & Reel (Optional) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {language === 'he' ? 'סרטון ביצועים וקטעי וידאו (אופציונלי)' : 'Scouting Video Highlights & Reel (Optional)'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {language === 'he' ? 'לא חובה' : 'Optional'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {language === 'he'
                ? 'באפשרותך להזין קישור לסרטון ביצועים (MP4, YouTube, Vimeo, Hudl). אם אין סרטון זמין, ניתן להשאיר ריק.'
                : 'Direct video link (MP4, YouTube, Vimeo, Hudl) to evaluate match footage. Leave blank if not yet available.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'כתובת סרטון (אופציונלי)' : 'Video URL (Optional)'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'https://... (אופציונלי)' : 'https://... (Optional)'}
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'כותרת סרטון (אופציונלי)' : 'Video Reel Title (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'he' ? 'לדוגמה: ביצועים עונת 2025/26' : 'e.g. 2025/26 Season - Key Touches & Goals'}
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'הערות וידאו / זמנים' : 'Video Notes / Timestamps'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'he' ? 'לדוגמה: 01:20 מעבר שחקנית' : 'e.g. 01:20 1v1 takeon, 02:45 line-breaking pass'}
                  value={videoDescription}
                  onChange={e => setVideoDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
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
                {language === 'he' ? 'התאמה לסוכנות ופרופיל מקצועי' : 'Agency Fit & Playing Style Analysis'}
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
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              {talkStage === 'Signed'
                ? (language === 'he'
                    ? isMale ? 'חתום בסוכנות והעבר לסגל בנים' : 'נחתמה בסוכנות והעבר לסגל'
                    : isMale ? 'Sign & Move to Male Roster' : 'Sign & Move to Female Roster')
                : prospectToEdit
                  ? (language === 'he' ? 'שמור שינויים' : 'Save Changes')
                  : (language === 'he' ? (isMale ? 'שמור מועמד' : 'שמור מועמדת') : 'Save Candidate')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
