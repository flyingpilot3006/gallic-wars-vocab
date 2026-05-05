import React, { useState, useEffect, useMemo } from 'react';
import { Check, RotateCcw, TrendingUp, BookOpen, Download, Shield, Trophy, ScrollText } from 'lucide-react';

/**
 * Gallic Wars: Legionnaire Edition
 * A PWA Flashcard app with a Monumental Roman Aesthetic.
 */

const FULL_VOCAB_DATA = [
  {"key": "qui", "value": "who, which", "frequency": 212},
  {"key": "et", "value": "and", "frequency": 195},
  {"key": "in", "value": "in, into", "frequency": 181},
  {"key": "sum", "value": "to be", "frequency": 151},
  {"key": "ad", "value": "to, towards", "frequency": 111},
  {"key": "se", "value": "himself, herself, itself", "frequency": 92},
  {"key": "is", "value": "he, she, it", "frequency": 92},
  {"key": "non", "value": "not", "frequency": 91},
  {"key": "cum", "value": "with, when", "frequency": 88},
  {"key": "ut", "value": "that, so that", "frequency": 74},
  {"key": "a", "value": "from, by (prep)", "frequency": 60},
  {"key": "ex", "value": "from, out of", "frequency": 58},
  {"key": "caesar", "value": "Caesar", "frequency": 55},
  {"key": "quam", "value": "than, how, as", "frequency": 51},
  {"key": "neque", "value": "neither...nor", "frequency": 50},
  {"key": "si", "value": "if", "frequency": 49},
  {"key": "atque", "value": "and also", "frequency": 47},
  {"key": "eo", "value": "there, to that place", "frequency": 47},
  {"key": "ab", "value": "from, by", "frequency": 45},
  {"key": "res", "value": "thing, matter", "frequency": 42},
  {"key": "suus", "value": "his own", "frequency": 40},
  {"key": "sibi", "value": "to/for himself", "frequency": 40},
  {"key": "de", "value": "about, from", "frequency": 37},
  {"key": "helvetii", "value": "the Helvetians", "frequency": 36},
  {"key": "aut", "value": "or", "frequency": 36},
  {"key": "finis", "value": "border, territory", "frequency": 34},
  {"key": "eius", "value": "his, hers, its", "frequency": 34},
  {"key": "per", "value": "through", "frequency": 33},
  {"key": "ne", "value": "lest, that...not", "frequency": 31},
  {"key": "his", "value": "these (abl/dat)", "frequency": 30},
  {"key": "romani", "value": "the Romans", "frequency": 30},
  {"key": "possum", "value": "to be able", "frequency": 29},
  {"key": "ac", "value": "and", "frequency": 28},
  {"key": "proelium", "value": "battle", "frequency": 28},
  {"key": "eos", "value": "them (masc)", "frequency": 26},
  {"key": "populi", "value": "peoples", "frequency": 26},
  {"key": "sese", "value": "themselves", "frequency": 26},
  {"key": "uti", "value": "to use / that, so that", "frequency": 25},
  {"key": "omnis", "value": "all", "frequency": 24},
  {"key": "eorum", "value": "their, of them", "frequency": 24},
  {"key": "iter", "value": "journey, march", "frequency": 24},
  {"key": "castris", "value": "camp (abl/dat)", "frequency": 24},
  {"key": "galliae", "value": "of Gaul", "frequency": 22},
  {"key": "hic", "value": "this", "frequency": 21},
  {"key": "esset", "value": "he/she/it was (subj)", "frequency": 21},
  {"key": "copiae", "value": "forces, supplies", "frequency": 20},
  {"key": "sed", "value": "but", "frequency": 20},
  {"key": "ariovistus", "value": "Ariovistus", "frequency": 20}
];

const manualDefs = {
  "a": "from, by", "quam": "than, how", "neque": "neither, nor", "si": "if", "atque": "and also",
  "eo": "there, thither", "sibi": "to/for himself", "de": "about, from", "aut": "or",
  "eius": "his, hers, its", "per": "through", "ne": "lest, so that...not", "his": "these",
  "romani": "Romans", "ac": "and", "eos": "them", "populi": "peoples", "sese": "themselves",
  "uti": "to use", "eorum": "of them, their", "castris": "camp", "galliae": "of Gaul",
  "esset": "was (subjunctive)", "sed": "but", "ariovistus": "Ariovistus"
};

const VOCAB_LIST = FULL_VOCAB_DATA.map(w => ({
  ...w,
  value: (w.value === "[Definition not found]" && manualDefs[w.key]) ? manualDefs[w.key] : w.value
}));

export default function App() {
  const [masteredKeys, setMasteredKeys] = useState(() => {
    const saved = localStorage.getItem('mastered_keys');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activePool, setActivePool] = useState([]);
  const [isReviewCard, setIsReviewCard] = useState(false);
  const [reviewOverride, setReviewOverride] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const remaining = VOCAB_LIST.filter(w => !masteredKeys.includes(w.key));
    const nextPool = remaining.slice(0, 10);
    setActivePool(nextPool);
    if (nextPool.length > 0 && currentWordIndex >= nextPool.length) setCurrentWordIndex(0);
  }, [masteredKeys]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shouldReview = Math.random() < 0.15 && masteredKeys.length > 0;
      if (shouldReview) {
        const randomKey = masteredKeys[Math.floor(Math.random() * masteredKeys.length)];
        const word = VOCAB_LIST.find(w => w.key === randomKey);
        setIsReviewCard(true);
        setReviewOverride(word);
      } else {
        setIsReviewCard(false);
        setReviewOverride(null);
        setCurrentWordIndex((prev) => (prev + 1) % activePool.length);
      }
    }, 250);
  };

  const handleMastered = (key) => {
    if (!isReviewCard) {
      const newMastered = [...masteredKeys, key];
      setMasteredKeys(newMastered);
      localStorage.setItem('mastered_keys', JSON.stringify(newMastered));
    }
    handleNext();
  };

  const activeDisplayWord = reviewOverride || activePool[currentWordIndex];
  const masteryPercentage = Math.round((masteredKeys.length / VOCAB_LIST.length) * 100);

  if (!activeDisplayWord) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-6 text-center marble-bg">
        <div className="max-w-xs p-8 bg-white/80 backdrop-blur rounded-2xl border-4 border-[#C5B358] shadow-2xl">
          <Trophy className="w-16 h-16 text-[#C5B358] mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-[#722F37] mb-2 uppercase tracking-tighter">Victoria!</h1>
          <p className="text-[#5D4037] font-serif italic">The Gauls have been subdued. Your vocabulary is supreme.</p>
          <button 
            onClick={() => { setMasteredKeys([]); localStorage.removeItem('mastered_keys'); }}
            className="mt-8 px-8 py-3 bg-[#722F37] text-[#C5B358] font-bold rounded-lg border-2 border-[#C5B358] shadow-md active:scale-95 transition-all"
          >
            RESTORE THE REPUBLIC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col font-serif select-none marble-bg overflow-x-hidden">
      {/* Roman Header */}
      <header className="px-4 py-3 bg-[#722F37] border-b-4 border-[#C5B358] shadow-lg flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C5B358] rounded-full flex items-center justify-center border-2 border-[#F4F1EA] shadow-inner">
             <span className="text-[#722F37] font-bold text-lg">X</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#F4F1EA] uppercase tracking-widest leading-none">De Bello Gallico</h1>
            <p className="text-[9px] text-[#C5B358] font-bold tracking-widest mt-1 opacity-80">LEGIO VOCABULARIUM</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="p-2 bg-[#C5B358] text-[#722F37] rounded shadow hover:brightness-110 transition-all">
              <Download size={16} />
            </button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#C5B358] font-bold uppercase tracking-tighter">Honor Level</span>
            <div className="flex items-center gap-1 text-white font-bold text-sm">
              <Shield size={14} className="text-[#C5B358]" />
              {masteredKeys.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        
        {/* Status Indicators */}
        <div className={`transition-all duration-500 transform ${isReviewCard ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="flex items-center gap-2 px-4 py-1 bg-[#722F37] border-2 border-[#C5B358] rounded-full shadow-xl">
             <RotateCcw size={12} className="text-[#C5B358]" />
             <span className="text-[10px] font-bold text-[#F4F1EA] uppercase tracking-[0.2em]">Veteris Vocis</span>
          </div>
        </div>

        {/* The Card */}
        <div 
          className="relative w-full max-w-[340px] aspect-[4/5] cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full duration-700 transition-all preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT: Latin (Monumental Stone Style) */}
            <div className="absolute inset-0 backface-hidden bg-[#FAF9F6] rounded-xl flex flex-col items-center justify-center p-6 border-[6px] border-[#C5B358] shadow-[0_20px_50px_rgba(0,0,0,0.2)] stone-texture">
              {/* Decorative Laurel Corners */}
              <div className="absolute top-4 left-4 text-[#C5B358] opacity-30"><ScrollText size={24} /></div>
              <div className="absolute top-4 right-4 text-[#C5B358] opacity-30"><ScrollText size={24} /></div>
              
              <span className="mb-6 px-3 py-1 bg-[#722F37]/10 rounded text-[10px] font-bold text-[#722F37] uppercase tracking-[0.3em]">Latine</span>
              
              <h2 className="text-6xl font-bold text-[#2D2D2D] text-center uppercase tracking-tighter drop-shadow-sm leading-tight">
                {activeDisplayWord.key}
              </h2>
              
              <div className="mt-12 w-16 h-1 bg-[#C5B358]/30 rounded-full" />
              <p className="mt-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">Tap to reveal</p>
            </div>

            {/* BACK: English (Imperial Scroll Style) */}
            <div className="absolute inset-0 backface-hidden bg-[#722F37] rounded-xl flex flex-col items-center justify-center p-8 border-[6px] border-[#C5B358] shadow-2xl rotate-y-180 overflow-hidden">
               {/* Patterned Background Overlay */}
               <div className="absolute inset-0 opacity-10 pointer-events-none laurel-pattern"></div>
               
               <span className="mb-6 px-3 py-1 bg-[#C5B358]/20 rounded text-[10px] font-bold text-[#C5B358] uppercase tracking-[0.3em]">Anglice</span>
               
               <p className="text-3xl font-bold text-[#F4F1EA] text-center leading-relaxed italic drop-shadow-md z-10">
                 "{activeDisplayWord.value}"
               </p>
               
               <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center opacity-60 z-10">
                 <div className="text-[11px] text-[#C5B358] font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="w-8 h-[1px] bg-[#C5B358]"></div>
                   Freq: {activeDisplayWord.frequency}
                   <div className="w-8 h-[1px] bg-[#C5B358]"></div>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className={`w-full max-w-[340px] flex flex-col gap-3 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleMastered(activeDisplayWord.key); }}
            className="w-full py-4 bg-[#722F37] text-[#C5B358] font-bold uppercase tracking-widest rounded-lg border-b-4 border-[#521E25] shadow-xl hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0 transition-all"
          >
            Ipsa Scientia (Mastered)
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-full py-3 bg-white text-[#722F37] font-bold uppercase tracking-widest rounded-lg border-2 border-[#722F37]/20 hover:bg-[#FAF9F6] transition-all text-xs"
          >
            Continuere (Keep Learning)
          </button>
        </div>
      </main>

      {/* Footer / Roman Progress Bar */}
      <footer className="p-6 bg-white border-t-4 border-[#722F37] relative overflow-hidden">
        <div className="max-w-[340px] mx-auto relative z-10">
          <div className="flex justify-between items-baseline mb-3">
            <h3 className="text-[11px] font-bold text-[#722F37] uppercase tracking-[0.2em]">Imperium Progress</h3>
            <span className="text-2xl font-black text-[#722F37] italic">{masteryPercentage}%</span>
          </div>
          
          <div className="relative w-full h-6 bg-stone-100 rounded-lg overflow-hidden border-2 border-[#722F37]/10 p-1 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#722F37] to-[#913F49] rounded-sm transition-all duration-1000 ease-out relative" 
              style={{ width: `${masteryPercentage}%` }}
            >
              {/* Shine effect on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase tracking-widest">
            <span>Pool: {activePool.length}/10</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#722F37]"></span>
              <span>De Bello Gallico Vol. 1</span>
            </div>
          </div>
        </div>
        
        {/* Subtle decorative background wreath */}
        <div className="absolute -bottom-10 -right-10 opacity-5 text-[#722F37]">
          <Trophy size={150} />
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        
        body { background-color: #F4F1EA; }
        .font-serif { font-family: 'Lora', serif; }
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        .marble-bg {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cpath d='M0 0l400 400M400 0L0 400' stroke='%23722F37' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E");
        }

        .stone-texture {
          background-image: radial-gradient(circle at center, transparent 0%, rgba(114, 47, 55, 0.02) 100%), 
                            url("https://www.transparenttextures.com/patterns/natural-paper.png");
        }

        .laurel-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10c-5 0-9 4-9 9 0 5 4 9 9 9s9-4 9-9c0-5-4-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z' fill='%23C5B358' fill-opacity='0.4'/%3E%3C/svg%3E");
        }
      `}} />
    </div>
  );
}
