import React from 'react';
import { TalkProspect, Player } from '../types/player';
import { X, Play, Video, ExternalLink, Award, FileText, CheckCircle2 } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl: string;
  description?: string;
  playerOrProspect?: TalkProspect | Player | null;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  title,
  videoUrl,
  description,
  playerOrProspect
}) => {
  if (!isOpen) return null;

  // Determine if it's YouTube, Vimeo or direct video
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isVimeo = videoUrl.includes('vimeo.com');
  const isDirectVideo = videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm') || videoUrl.includes('commondatastorage.googleapis.com');

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {title || 'Tactical Video Highlights Reel'}
              </h2>
              {playerOrProspect && (
                <p className="text-xs text-slate-400 truncate">
                  {'clubName' in playerOrProspect 
                    ? `${playerOrProspect.name} · ${playerOrProspect.clubName} (${playerOrProspect.position})` 
                    : `${playerOrProspect.name} · ${playerOrProspect.currentClub} (${playerOrProspect.position})`}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close video player"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Screen Viewport */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center">
          {!videoUrl?.trim() ? (
            <div className="p-8 text-center max-w-md">
              <Video className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Video Reel Attached</h3>
              <p className="text-xs text-slate-400">
                Video highlight links are optional for agency candidates. You can attach a highlight URL anytime by editing the candidate dossier.
              </p>
            </div>
          ) : isDirectVideo ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video tag.
            </video>
          ) : isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(videoUrl)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : isVimeo ? (
            <iframe
              src={videoUrl}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="p-8 text-center max-w-md">
              <Video className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-xs text-slate-400 mb-4">
                External video reel source: <span className="font-mono text-emerald-400 break-all">{videoUrl}</span>
              </p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                <span>Open in External Match Player</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Video Notes & Tactical Breakdown Drawer */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                Agency Scouting Review
              </span>
              <p className="text-sm text-slate-300 mt-0.5">
                {description || 'Tactical performance evaluation: distribution under pressure, high-speed recoveries, and attacking decision-making.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
              >
                Close Player
              </button>
            </div>
          </div>

          {/* If it's a prospect with scouting attributes */}
          {playerOrProspect && 'scoutingReport' in playerOrProspect && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Strengths Highlighted:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {playerOrProspect.scoutingReport.strengths.map((str, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium text-[11px] border border-emerald-800/50">
                      {str}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Tactical Role:</span>
                <span className="text-slate-200 mt-1 block">
                  {playerOrProspect.scoutingReport.tacticalFit}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Negotiation Stage:</span>
                <span className="text-amber-300 font-semibold mt-1 block">
                  {playerOrProspect.talkStage} ({playerOrProspect.scope})
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
