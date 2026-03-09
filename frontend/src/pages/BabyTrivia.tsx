import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

interface TriviaOption {
    _id: string;
    username: string;
    displayName: string;
}

interface TriviaQuestion {
    questionId: string;
    babyPictureUrl: string;
    options: TriviaOption[];
}

interface GuessResult {
    isCorrect: boolean;
    actualUser: TriviaOption;
    message: string;
}

export default function BabyTrivia() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [question, setQuestion] = useState<TriviaQuestion | null>(null);
    const [error, setError] = useState('');

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchQuestion = async () => {
        setLoading(true);
        setError('');
        setGuessResult(null);
        setSelectedOption(null);

        try {
            const data = await api('/api/trivia/question');
            setQuestion(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestion();
    }, []);

    const handleGuess = async (guessedUserId: string) => {
        if (submitting || guessResult || !question) return;

        setSelectedOption(guessedUserId);
        setSubmitting(true);

        try {
            const result = await api('/api/trivia/guess', {
                method: 'POST',
                body: JSON.stringify({
                    questionId: question.questionId,
                    guessedUserId
                })
            });

            setGuessResult(result);

            if (result.isCorrect) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

        } catch (err: any) {
            setError(err.message);
            setSelectedOption(null);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6">
                <Loader2 className="animate-spin text-secondary mb-4" size={48} />
                <p className="text-white/60 font-medium">Fetching the cutest photo...</p>
            </div>
        );
    }

    if (error && !question) {
        return (
            <div className="min-h-screen bg-background text-white p-6 pb-24">
                <header className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-black">Who's Who? 👶</h1>
                </header>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                    <div className="text-4xl mb-4">🍼</div>
                    <h2 className="text-xl font-bold mb-2">Not Enough Players Yet</h2>
                    <p className="text-white/60 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-primary text-black font-black py-3 px-6 rounded-full w-full max-w-xs"
                    >
                        Upload My Baby Pic
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white p-6 pb-24 font-sans">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black leading-tight flex items-center gap-2">
                            Who's Who?
                        </h1>
                        <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Baby Picture Trivia</p>
                    </div>
                </div>
            </header>

            {question && (
                <div className="max-w-md mx-auto">
                    {/* The Picture */}
                    <div className="bg-white/5 rounded-3xl p-4 border border-white/10 mb-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-60"></div>
                        <img
                            src={question.babyPictureUrl}
                            alt="Guess who"
                            className="w-full aspect-square object-cover rounded-2xl filter sepia-[.2]"
                        />
                        <div className="absolute top-6 left-6 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <span className="text-sm font-bold flex items-center gap-2">
                                <Sparkles size={16} className="text-secondary" /> Who's this?
                            </span>
                        </div>
                    </div>

                    {/* The Options */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {question.options.map((opt) => {
                            const isSelected = selectedOption === opt._id;
                            let btnStyle = "bg-white/5 border-white/10 hover:bg-white/10 text-white";
                            let icon = null;

                            if (guessResult) {
                                if (opt._id === guessResult.actualUser._id) {
                                    // This is the correct answer
                                    btnStyle = "bg-success/20 border-success text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                                    icon = <CheckCircle2 size={18} />;
                                } else if (isSelected) {
                                    // This was the wrong answer picked
                                    btnStyle = "bg-error/20 border-error text-error";
                                    icon = <XCircle size={18} />;
                                } else {
                                    // Other wrong answers
                                    btnStyle = "bg-white/2 border-transparent text-white/40 opacity-50";
                                }
                            } else if (isSelected) {
                                btnStyle = "bg-secondary border-secondary text-black";
                            }

                            return (
                                <button
                                    key={opt._id}
                                    onClick={() => handleGuess(opt._id)}
                                    disabled={!!guessResult || submitting}
                                    className={`relative p-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 h-24 ${btnStyle}`}
                                >
                                    <span className="text-sm text-center leading-tight truncate w-full">{opt.displayName}</span>
                                    {icon && <div className="absolute top-2 right-2">{icon}</div>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Result & Next Button */}
                    {guessResult && (
                        <div className="animate-fade-in-up text-center bg-white/5 p-6 rounded-3xl border border-white/10">
                            <h3 className={`text-xl font-black mb-2 ${guessResult.isCorrect ? 'text-success' : 'text-error'}`}>
                                {guessResult.message}
                            </h3>
                            <p className="text-white/70 mb-6">
                                That was <span className="font-bold text-white">{guessResult.actualUser.displayName}</span>!
                            </p>
                            <button
                                onClick={fetchQuestion}
                                className="bg-white text-black font-black py-4 px-8 rounded-full w-full relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-secondary transition-transform origin-left scale-x-0 group-hover:scale-x-100"></div>
                                <span className="relative z-10 uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                                    Next Baby <ArrowLeft className="rotate-180" size={16} />
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
