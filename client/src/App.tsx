import { useMemo, useState } from "react";
import "./index.css";

type Screen = "home" | "levels" | "game" | "rewards" | "settings";
type ColorItem = {
  name: string;
  hex: string;
  soft: string;
  emoji: string;
  object: string;
};

const GUIDE = "/manus-storage/color-adventure-guide_2fd137f6.png";
const REFERENCE = "/manus-storage/color-adventure-reference_582764a2.png";
const OBJECT_KIT = "/manus-storage/color-adventure-object-kit_60b1055f.png";

const colors: ColorItem[] = [
  { name: "الأحمر", hex: "#F0444F", soft: "#FFE5E7", emoji: "🔴", object: "🍎" },
  { name: "الأصفر", hex: "#F4B928", soft: "#FFF3CD", emoji: "🟡", object: "⭐" },
  { name: "الأزرق", hex: "#3478E5", soft: "#E5F0FF", emoji: "🔵", object: "⚽" },
  { name: "الأخضر", hex: "#36A86B", soft: "#E2F6EA", emoji: "🟢", object: "🍃" },
  { name: "البرتقالي", hex: "#F47C2C", soft: "#FFF0E4", emoji: "🟠", object: "🪁" },
  { name: "البنفسجي", hex: "#8E5AD7", soft: "#F0E8FF", emoji: "🟣", object: "🦄" },
  { name: "الأسود", hex: "#27313F", soft: "#E9EDF2", emoji: "⚫", object: "🕶️" },
  { name: "الأبيض", hex: "#D5DEE8", soft: "#F7FAFC", emoji: "⚪", object: "☁️" },
  { name: "الوردي", hex: "#EF6FAE", soft: "#FFE8F1", emoji: "🩷", object: "💗" },
];

const levels = [
  { id: 1, title: "تعرّف على اللون", subtitle: "استكشف الألوان مع لولو", icon: "👀", tint: "#E9F7FF", accent: "#48AEEA", active: true },
  { id: 2, title: "اختر اللون", subtitle: "أين اللون الصحيح؟", icon: "🎯", tint: "#FFF3DB", accent: "#F2AD32", active: true },
  { id: 3, title: "طابق اللون", subtitle: "اسحب الشيء إلى لونه", icon: "🧩", tint: "#EAF8EE", accent: "#46B778", active: false },
  { id: 4, title: "لعبة الفرز", subtitle: "ضع الأشياء في السلال", icon: "🧺", tint: "#F2EAFE", accent: "#9A6CE0", active: false },
  { id: 5, title: "تحدي الألوان", subtitle: "اختبر ذاكرتك اللطيفة", icon: "🏆", tint: "#FFE8EF", accent: "#E86D98", active: false },
];

const questions = [
  { object: "🍎", objectName: "تفاحة", correct: "الأحمر", prompt: "أين اللون الأحمر؟", hint: "التفاحة حمراء!" },
  { object: "⭐", objectName: "نجمة", correct: "الأصفر", prompt: "أين اللون الأصفر؟", hint: "النجمة صفراء!" },
  { object: "⚽", objectName: "كرة", correct: "الأزرق", prompt: "أين اللون الأزرق؟", hint: "الكرة زرقاء!" },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  utterance.rate = 0.82;
  utterance.pitch = 1.12;
  window.speechSynthesis.speak(utterance);
}

function playTone(kind: "success" | "soft" | "wrong") {
  if (typeof window === "undefined" || !("AudioContext" in window || "webkitAudioContext" in window)) return;
  const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = kind === "success" ? 660 : kind === "wrong" ? 180 : 420;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.055 : 0.09, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === "success" ? 0.28 : 0.18));
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
}

function Stars({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <div className={`stars ${compact ? "stars-compact" : ""}`} aria-label={`${count} نجوم`}>
      {[0, 1, 2, 3, 4].map((star) => (
        <span key={star} className={star < count ? "star-on" : "star-off"}>★</span>
      ))}
      {!compact && <strong>{count}/5</strong>}
    </div>
  );
}

function SpeakerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="speaker-button" onClick={onClick} aria-label={`استمع: ${label}`} title={`استمع إلى ${label}`}>
      <span>🔊</span>
    </button>
  );
}

function Guide({ message, onSpeak }: { message: string; onSpeak: () => void }) {
  return (
    <div className="guide-row">
      <div className="guide-bubble">
        <span className="bubble-tail" />
        <p>{message}</p>
        <SpeakerButton label={message} onClick={onSpeak} />
      </div>
      <img className="guide-image" src={GUIDE} alt="لولو القطة المرشدة" />
    </div>
  );
}

function TopBar({ screen, stars, onNavigate }: { screen: Screen; stars: number; onNavigate: (screen: Screen) => void }) {
  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => onNavigate("home")} aria-label="العودة للرئيسية">
        <span className="brand-mark">✦</span>
        <span className="brand-copy"><b>مغامرة</b><small>الألوان</small></span>
      </button>
      <div className="topbar-center">
        <Stars count={stars} compact />
        <span className="level-pill">رحلة الألوان</span>
      </div>
      <div className="topbar-actions">
        <button className={`round-action ${screen === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")} aria-label="الإعدادات">⚙️</button>
      </div>
    </header>
  );
}

function HomeScreen({ stars, onNavigate, onStart }: { stars: number; onNavigate: (screen: Screen) => void; onStart: () => void }) {
  return (
    <div className="screen home-screen">
      <div className="floating-shape shape-one" />
      <div className="floating-shape shape-two" />
      <TopBar screen="home" stars={stars} onNavigate={onNavigate} />
      <main className="home-main">
        <section className="home-copy">
          <span className="eyebrow"><span>✦</span> تعلّم والعب واكتشف</span>
          <h1>مغامرة<br /><em>الألوان</em></h1>
          <p className="hero-text">هيا يا بطل! لنكتشف عالم الألوان معاً، لوناً بعد لون، وبابتسامة كبيرة.</p>
          <div className="hero-actions">
            <button className="primary-button start-button" onClick={onStart}><span>▶</span> ابدأ اللعب</button>
            <button className="secondary-button" onClick={() => onNavigate("levels")}><span>🎨</span> تعلّم الألوان</button>
          </div>
          <div className="safe-note"><span>🛡️</span><span>لعبة آمنة وبدون إعلانات<br /><b>مصممة بحب لأصدقائنا الصغار</b></span></div>
        </section>
        <section className="home-art" aria-label="عالم الألوان">
          <div className="sun-glow" />
          <div className="cloud cloud-a" /><div className="cloud cloud-b" />
          <div className="confetti confetti-a">✦</div><div className="confetti confetti-b">●</div><div className="confetti confetti-c">✦</div>
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="reference-card"><img src={REFERENCE} alt="لقطة مرجعية من عالم الألوان" /></div>
          <div className="guide-cutout"><img src={GUIDE} alt="لولو القطة المرشدة" /></div>
          <div className="speech-tag"><span>مرحباً!</span><small>أنا لولو 👋</small></div>
          <div className="color-pod pod-red">●</div><div className="color-pod pod-yellow">★</div><div className="color-pod pod-blue">●</div>
        </section>
      </main>
      <section className="home-actions">
        <button className="action-card card-learn" onClick={() => onNavigate("levels")}><span className="action-icon">🎨</span><span><b>تعلّم الألوان</b><small>اكتشف ٩ ألوان</small></span><span className="arrow">‹</span></button>
        <button className="action-card card-rewards" onClick={() => onNavigate("rewards")}><span className="action-icon">🏆</span><span><b>الجوائز</b><small>{stars === 0 ? "ابدأ بجمع النجوم" : `${stars} نجوم جميلة`}</small></span><span className="arrow">‹</span></button>
        <div className="mini-gallery"><img src={OBJECT_KIT} alt="أشياء ملونة للتعلم" /><span>ألوان حولنا في كل مكان!</span></div>
      </section>
    </div>
  );
}

function LevelsScreen({ stars, onNavigate, onChoose }: { stars: number; onNavigate: (screen: Screen) => void; onChoose: (id: number) => void }) {
  return (
    <div className="screen inner-screen">
      <TopBar screen="levels" stars={stars} onNavigate={onNavigate} />
      <main className="inner-main levels-main">
        <div className="section-heading">
          <div><span className="eyebrow"><span>✦</span> اختر مغامرتك</span><h2>ماذا سنلعب اليوم؟</h2><p>كل لعبة قصيرة ومليئة بالمفاجآت اللطيفة.</p></div>
          <button className="back-button" onClick={() => onNavigate("home")}>العودة <span>→</span></button>
        </div>
        <div className="levels-layout">
          <div className="level-list">
            {levels.map((level, index) => (
              <button key={level.id} className={`level-card ${level.active ? "level-active" : "level-soon"}`} style={{ "--tint": level.tint, "--accent": level.accent } as React.CSSProperties} onClick={() => onChoose(level.id)}>
                <span className="level-number">{String(index + 1).padStart(2, "0")}</span><span className="level-icon">{level.icon}</span><span className="level-text"><b>{level.title}</b><small>{level.subtitle}</small></span><span className="level-go">{level.active ? "←" : "قريباً"}</span>
              </button>
            ))}
          </div>
          <div className="level-preview">
            <div className="preview-image"><img src={REFERENCE} alt="معاينة لعبة اختيار اللون" /><span className="preview-sticker">⭐ ممتع!</span></div>
            <div className="preview-copy"><span className="small-label">المستوى التالي</span><h3>اختر اللون</h3><p>ساعد لولو في العثور على اللون الصحيح. كل إجابة صحيحة تمنحك نجمة!</p><div className="preview-meta"><span>⏱ ١–٣ دقائق</span><span>⭐ نجمة لكل إجابة</span></div></div>
            <button className="primary-button preview-button" onClick={() => onChoose(2)}>ابدأ المستوى <span>←</span></button>
          </div>
        </div>
      </main>
    </div>
  );
}

function LearnGame({ selectedColor, setSelectedColor }: { selectedColor: string; setSelectedColor: (name: string) => void }) {
  const selected = colors.find((color) => color.name === selectedColor) ?? colors[0];
  return (
    <div className="learn-game">
      <div className="learn-hero">
        <div className="learn-object" style={{ background: selected.soft, color: selected.hex }}>{selected.object}</div>
        <div><span className="small-label">اكتشف لوناً جديداً</span><h3>هذا لون {selected.name} {selected.emoji}</h3><p>اضغط على أي بطاقة واسمع اسم اللون.</p></div>
        <SpeakerButton label={selected.name} onClick={() => speak(`هذا لون ${selected.name}`)} />
      </div>
      <div className="color-grid">
        {colors.map((color) => <button key={color.name} className={`color-card ${selected.name === color.name ? "selected" : ""}`} onClick={() => { setSelectedColor(color.name); speak(`هذا لون ${color.name}`); }}><span className="color-swatch" style={{ background: color.hex, boxShadow: `0 8px 18px ${color.hex}44` }}>{color.object}</span><b>{color.name}</b><span className="tiny-speaker">🔊</span></button>)}
      </div>
    </div>
  );
}

function QuizGame({ stars, onEarnStar }: { stars: number; onEarnStar: () => void }) {
  const [round, setRound] = useState(0);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("اختَر الدائرة التي تشبه التفاحة");
  const [completed, setCompleted] = useState(false);
  const question = questions[round];
  const choices = useMemo(() => [colors.find((color) => color.name === question.correct)!, colors[(round + 3) % colors.length], colors[(round + 5) % colors.length]], [round, question.correct]);

  const choose = (choice: string) => {
    if (locked || completed) return;
    if (choice === question.correct) {
      setLocked(true); setMessage(round === questions.length - 1 ? "أحسنت! أكملت التحدي 🎉" : "رائع! هذه هي الإجابة الصحيحة ⭐"); playTone("success"); onEarnStar();
      window.setTimeout(() => { if (round === questions.length - 1) setCompleted(true); else { setRound((value) => value + 1); setLocked(false); setMessage("اختَر الدائرة التي تشبه الشيء"); } }, 720);
    } else {
      setMessage("حاول مرة أخرى 😊"); playTone("wrong");
    }
  };

  if (completed) return <div className="completion-card"><div className="celebration">🎉</div><span className="eyebrow"><span>✦</span> إنجاز رائع</span><h3>أكملت لعبة اختيار اللون!</h3><p>لولو فخورة بك. هل نلعب مغامرة أخرى؟</p><Stars count={Math.min(stars, 5)} /><button className="primary-button" onClick={() => { setRound(0); setCompleted(false); setLocked(false); setMessage("اختَر الدائرة التي تشبه التفاحة"); }}>العب مرة أخرى <span>↻</span></button></div>;

  return (
    <div className="quiz-game">
      <div className="question-card">
        <div className="question-copy"><span className="small-label">السؤال {round + 1} من {questions.length}</span><h3>{question.prompt}</h3><p>{question.hint}</p></div>
        <div className="question-object" aria-label={question.objectName}>{question.object}</div>
        <SpeakerButton label={question.correct} onClick={() => speak(question.prompt)} />
      </div>
      <div className="choice-row">
        {choices.map((choice, index) => <button key={`${choice.name}-${index}`} className="choice-button" onClick={() => choose(choice.name)} style={{ "--choice": choice.hex, "--choice-soft": choice.soft } as React.CSSProperties}><span>{choice.emoji}</span><b>{choice.name}</b></button>)}
      </div>
      <div className={`feedback ${message.includes("مرة") ? "feedback-warm" : "feedback-good"}`}><span>{message.includes("مرة") ? "💪" : "✨"}</span>{message}</div>
    </div>
  );
}

function GameScreen({ gameLevel, stars, onNavigate, onEarnStar }: { gameLevel: number; stars: number; onNavigate: (screen: Screen) => void; onEarnStar: () => void }) {
  const [selectedColor, setSelectedColor] = useState("الأحمر");
  const level = levels.find((item) => item.id === gameLevel) ?? levels[1];
  return (
    <div className="screen inner-screen game-screen">
      <TopBar screen="game" stars={stars} onNavigate={onNavigate} />
      <main className="inner-main game-main">
        <div className="game-heading"><button className="icon-back" onClick={() => onNavigate("levels")}>→</button><div><span className="small-label">المستوى {gameLevel}</span><h2>{level.title}</h2></div><div className="progress-track"><span style={{ width: gameLevel === 2 ? "58%" : "24%" }} /></div></div>
        <Guide message={gameLevel === 1 ? "هيا نكتشف الألوان معاً!" : gameLevel === 2 ? "ساعدني! أين اللون الصحيح؟" : "هذه المغامرة ستصل قريباً!"} onSpeak={() => speak(gameLevel === 1 ? "هيا نكتشف الألوان معاً" : "ساعدني أين اللون الصحيح")}/>
        {gameLevel === 1 && <LearnGame selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
        {gameLevel === 2 && <QuizGame stars={stars} onEarnStar={onEarnStar} />}
        {gameLevel > 2 && <div className="coming-card"><div className="coming-icon">{level.icon}</div><h3>مغامرة {level.title} قادمة!</h3><p>نحضّر لك لعبة جديدة مليئة بالألوان. جرّب المستوى الأول أو الثاني الآن.</p><button className="primary-button" onClick={() => onNavigate("levels")}>اختيار مستوى آخر <span>←</span></button></div>}
      </main>
    </div>
  );
}

function RewardsScreen({ stars, onNavigate }: { stars: number; onNavigate: (screen: Screen) => void }) {
  return <div className="screen inner-screen"><TopBar screen="rewards" stars={stars} onNavigate={onNavigate} /><main className="inner-main rewards-main"><div className="section-heading"><div><span className="eyebrow"><span>✦</span> صندوق الفخر</span><h2>جوائزي الجميلة</h2><p>كل نجمة تحكي عن محاولة رائعة.</p></div><button className="back-button" onClick={() => onNavigate("home")}>العودة <span>→</span></button></div><div className="reward-hero"><div className="badge-orbit">🏅</div><div><span className="small-label">تقدّمك اليوم</span><h3>{stars === 0 ? "هيا نبدأ أول نجمة!" : `جمعت ${stars} من 5 نجوم`}</h3><p>{stars >= 5 ? "فتحت شارة بطل الألوان!" : "أكمل 5 نجوم لتفتح شارة بطل الألوان."}</p><div className="big-progress"><span style={{ width: `${Math.min(100, stars * 20)}%` }} /></div></div><Stars count={stars} /></div><div className="sticker-grid"><div className={`sticker ${stars >= 5 ? "sticker-earned" : ""}`}><span>🌈</span><b>بطل الألوان</b><small>{stars >= 5 ? "مفتوحة" : "5 نجوم"}</small></div><div className={`sticker ${stars >= 1 ? "sticker-earned" : ""}`}><span>⭐</span><b>أول نجمة</b><small>{stars >= 1 ? "مفتوحة" : "جرب لعبة"}</small></div><div className="sticker"><span>🎨</span><b>فنان صغير</b><small>قريباً</small></div></div></main></div>;
}

function SettingsScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return <div className="screen inner-screen"><TopBar screen="settings" stars={0} onNavigate={onNavigate} /><main className="inner-main settings-main"><div className="section-heading"><div><span className="eyebrow"><span>✦</span> مساحة الكبار</span><h2>الإعدادات</h2><p>خيارات بسيطة لتجربة مريحة.</p></div><button className="back-button" onClick={() => onNavigate("home")}>العودة <span>→</span></button></div><div className="settings-card"><div className="setting-row"><span className="setting-icon">🔊</span><span><b>الصوت والنطق</b><small>اسمع أسماء الألوان بصوت واضح</small></span><span className="toggle on"><i /></span></div><div className="setting-row"><span className="setting-icon">🎵</span><span><b>الموسيقى الهادئة</b><small>ألحان لطيفة أثناء اللعب</small></span><span className="toggle on"><i /></span></div><div className="setting-row"><span className="setting-icon">🛡️</span><span><b>تجربة آمنة</b><small>لا إعلانات ولا روابط خارجية</small></span><span className="safe-check">✓</span></div></div></main></div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [stars, setStars] = useState(0);
  const [gameLevel, setGameLevel] = useState(2);
  const openLevel = (id: number) => { setGameLevel(id); setScreen("game"); };
  return <div dir="rtl" className="app-root">{screen === "home" && <HomeScreen stars={stars} onNavigate={setScreen} onStart={() => openLevel(2)} />}{screen === "levels" && <LevelsScreen stars={stars} onNavigate={setScreen} onChoose={openLevel} />}{screen === "game" && <GameScreen gameLevel={gameLevel} stars={stars} onNavigate={setScreen} onEarnStar={() => setStars((value) => Math.min(5, value + 1))} />}{screen === "rewards" && <RewardsScreen stars={stars} onNavigate={setScreen} />}{screen === "settings" && <SettingsScreen onNavigate={setScreen} />}</div>;
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext; } }

""
