import React, { useState, useEffect } from 'react';
import { Player, PlayerPosition, PlayerStatus, YouthCategory, Language } from '../types/player';
import { TRANSLATIONS, POSITION_TRANSLATIONS, getYouthBadgeColor } from '../translations/translations';
import { X, User, Calendar, Shield, DollarSign, Video, Mail, Phone, Check, Tag, Cake } from 'lucide-react';
import { NationalitySelect } from './NationalitySelect';
import { calculateAgeFromBirthDate } from '../utils/birthdayAlerts';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Player) => void;
  playerToEdit?: Player | null;
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

const STATUSES: PlayerStatus[] = [
  'Active',
  'Injured',
  'On Loan',
  'Free Agent',
  'Pending Renewal',
  'Negotiating',
  'Transferred'
];

const YOUTH_OPTIONS: YouthCategory[] = ['Senior', 'U19', 'U17', 'U15'];

const PRESET_AVATARS = [
  { label: 'Forward Portrait', url: '/src/assets/images/player_portrait_forward_1794074972306.jpg' },
  { label: 'Midfielder Portrait', url: '/src/assets/images/player_portrait_midfield_1794074972939.jpg' },
  { label: 'Defender Portrait', url: '/src/assets/images/player_portrait_defender_1794074973806.jpg' },
];

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playerToEdit,
  language = 'en'
}) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [age, setAge] = useState<number>(22);
  const [birthDate, setBirthDate] = useState('2004-01-01');
  const [nationality, setNationality] = useState('England');
  const [countryCode, setCountryCode] = useState('GB');
  const [clubName, setClubName] = useState('');
  const [league, setLeague] = useState('Barclays Women\'s Super League');
  const [position, setPosition] = useState<PlayerPosition>('Central Midfield (CM)');
  const [youthCategory, setYouthCategory] = useState<YouthCategory>('Senior');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [dominantFoot, setDominantFoot] = useState<'Right' | 'Left' | 'Both'>('Right');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Set default expiry to 1 year from now
  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
  const [contractExpiryDate, setContractExpiryDate] = useState(defaultExpiry.toISOString().split('T')[0]);

  const [status, setStatus] = useState<PlayerStatus>('Active');
  const [marketValue, setMarketValue] = useState('€450,000');
  const [agencyFeePct, setAgencyFeePct] = useState<number>(10);
  const [representationType, setRepresentationType] = useState<'Exclusive' | 'Co-representation' | 'Commercial Only'>('Exclusive');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [videoHighlightsUrl, setVideoHighlightsUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name);
      setPhotoUrl(playerToEdit.photoUrl || '');
      setAge(playerToEdit.age);
      setBirthDate(playerToEdit.birthDate);
      setNationality(playerToEdit.nationality);
      setCountryCode(playerToEdit.countryCode);
      setClubName(playerToEdit.clubName);
      setLeague(playerToEdit.league);
      setPosition(playerToEdit.position);
      setYouthCategory(playerToEdit.youthCategory || 'Senior');
      setJerseyNumber(playerToEdit.jerseyNumber);
      setDominantFoot(playerToEdit.dominantFoot);
      setContractStartDate(playerToEdit.contractStartDate);
      setContractExpiryDate(playerToEdit.contractExpiryDate);
      setStatus(playerToEdit.status);
      setMarketValue(playerToEdit.marketValue);
      setAgencyFeePct(playerToEdit.agencyFeePct);
      setRepresentationType(playerToEdit.representationType);
      setContactEmail(playerToEdit.contactEmail || '');
      setContactPhone(playerToEdit.contactPhone || '');
      setVideoHighlightsUrl(playerToEdit.videoHighlightsUrl || '');
      setNotes(playerToEdit.notes || '');
    } else {
      setName('');
      setPhotoUrl('');
      setAge(22);
      setBirthDate('2004-01-01');
      setNationality('England');
      setCountryCode('GB');
      setClubName('');
      setLeague('Barclays Women\'s Super League');
      setPosition('Central Midfield (CM)');
      setYouthCategory('Senior');
      setJerseyNumber(10);
      setDominantFoot('Right');
      setContractStartDate(new Date().toISOString().split('T')[0]);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 2);
      setContractExpiryDate(nextYear.toISOString().split('T')[0]);
      setStatus('Active');
      setMarketValue('€450,000');
      setAgencyFeePct(10);
      setRepresentationType('Exclusive');
      setContactEmail('');
      setContactPhone('');
      setVideoHighlightsUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setNotes('');
    }
  }, [playerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clubName.trim()) {
      alert('Please fill in the player name and current club.');
      return;
    }

    const savedPlayer: Player = {
      id: playerToEdit ? playerToEdit.id : `ply-${Date.now()}`,
      name: name.trim(),
      photoUrl,
      age: Number(age) || 20,
      birthDate,
      nationality: nationality.trim() || 'England',
      countryCode: countryCode.trim() || 'GB',
      clubName: clubName.trim(),
      league: league.trim() || 'Top Flight',
      position,
      youthCategory,
      jerseyNumber: Number(jerseyNumber) || 0,
      dominantFoot,
      contractStartDate,
      contractExpiryDate,
      status,
      marketValue: marketValue.trim() || '€300,000',
      agencyFeePct: Number(agencyFeePct) || 10,
      representationType,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      videoHighlightsUrl: videoHighlightsUrl.trim(),
      notes: notes.trim(),
      createdAt: playerToEdit ? playerToEdit.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(savedPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {playerToEdit ? 'Edit Player Representation Dossier' : 'Add New Female Player to Agency'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Maintain agency mandate dates, club contracts, and age tier (Senior, U19, U17, U15).
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
          
          {/* Age Tier Selector: Senior vs U19 vs U17 vs U15 */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Player Age Category (Senior / U19 / U17 / U15) *</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Categorize for academy & senior tracking
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

          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Player Identity & Club
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Player Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lauren James"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Club *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chelsea FC Women"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  League
                </label>
                <input
                  type="text"
                  placeholder="e.g. WSL, NWSL, Liga F"
                  value={league}
                  onChange={e => setLeague(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

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
                  Jersey #
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={jerseyNumber}
                  onChange={e => setJerseyNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Birthday Date Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5 text-pink-500" />
                  <span>Birthday (Date of Birth) *</span>
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={birthDate}
                  onChange={e => {
                    const newDate = e.target.value;
                    setBirthDate(newDate);
                    if (newDate) {
                      const computedAge = calculateAgeFromBirthDate(newDate);
                      setAge(computedAge);
                      // Auto suggest youth category based on age
                      if (computedAge <= 15) setYouthCategory('U15');
                      else if (computedAge <= 17) setYouthCategory('U17');
                      else if (computedAge <= 19) setYouthCategory('U19');
                      else setYouthCategory('Senior');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                />
              </div>

              {/* Age Field (Auto-calculated, with manual override) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Age (Years) *
                </label>
                <input
                  type="number"
                  min="13"
                  max="45"
                  value={age}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setAge(val);
                    if (val <= 15 && youthCategory === 'Senior') setYouthCategory('U15');
                    else if (val <= 17 && val > 15 && youthCategory === 'Senior') setYouthCategory('U17');
                    else if (val <= 19 && val > 17 && youthCategory === 'Senior') setYouthCategory('U19');
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400 font-mono-tabular"
                />
              </div>

              {/* Nationality Dropdown */}
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

              {/* Dominant Foot */}
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
                  <option value="Both">Both (Ambidextrous)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contract with Agency Dates (CRITICAL REQUIREMENT) */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Agency Representation Agreement & Expiration
              </h3>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                Powers automated 1-month alerts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contract Start Date
                </label>
                <input
                  type="date"
                  value={contractStartDate}
                  onChange={e => setContractStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                  Contract Expiration Date *
                </label>
                <input
                  type="date"
                  required
                  value={contractExpiryDate}
                  onChange={e => setContractExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Player Status *
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as PlayerStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Market Valuation
                </label>
                <input
                  type="text"
                  placeholder="e.g. €650,000"
                  value={marketValue}
                  onChange={e => setMarketValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agency Fee %
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={agencyFeePct}
                  onChange={e => setAgencyFeePct(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                />
              </div>
            </div>
          </div>

          {/* Photo & Media */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Media & High-Res Portrait
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Choose Studio Portrait or Enter Image URL
              </label>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {PRESET_AVATARS.map(preset => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setPhotoUrl(preset.url)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs transition-all ${
                      photoUrl === preset.url 
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-semibold text-emerald-800 dark:text-emerald-300' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-md object-cover" 
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or paste custom image URL..."
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Video Highlights Link (YouTube, Vimeo, MP4, Hudl)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={videoHighlightsUrl}
                onChange={e => setVideoHighlightsUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agent Strategy Notes & Action Items
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Contract renewal schedule, commercial boot sponsor renegotiation, international call-up status..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
              {playerToEdit ? 'Save Changes' : 'Add Player to Agency'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
