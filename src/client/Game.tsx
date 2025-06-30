import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EightBallResponse, SubredditInfo } from '../shared/types/game';
import packageJson from '../../package.json';

function extractSubredditName(): string | null {
  const devCommand = packageJson.scripts?.['dev:devvit'];

  if (!devCommand || !devCommand.includes('devvit playtest')) {
    console.warn('"dev:devvit" script is missing or malformed.');
    return null;
  }

  const argsMatch = devCommand.match(/devvit\s+playtest\s+(.*)/);
  if (!argsMatch || !argsMatch[1]) {
    console.warn('Could not parse arguments in dev:devvit script.');
    return null;
  }

  const args = argsMatch[1].trim().split(/\s+/);
  const subreddit = args.find((arg) => !arg.startsWith('-'));

  if (!subreddit) {
    console.warn('No subreddit name found in dev:devvit command.');
    return null;
  }

  return subreddit;
}

const Banner = () => {
  const subreddit = extractSubredditName();
  if (!subreddit) {
    return (
      <div className="w-full bg-purple-600 text-white p-4 text-center mb-4">
        Please visit your playtest subreddit to play the game with network functionality.
      </div>
    );
  }

  const subredditUrl = `https://www.reddit.com/r/${subreddit}`;

  return (
    <div className="w-full bg-purple-600 text-white p-4 text-center mb-4">
      Please visit{' '}
      <a
        href={subredditUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-bold"
      >
        r/{subreddit}
      </a>{' '}
      to play the game with network functionality. Remember to create a post from the three dots
      (beside the mod tools button).
    </div>
  );
};

// Particle component for magical effects
const Particle = ({ x, y, delay }: { x: number; y: number; delay: number }) => (
  <div
    className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-0 animate-sparkle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}ms`,
    }}
  />
);

// Floating emoji component
const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <div
    className="absolute text-2xl opacity-0 animate-float"
    style={{
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 20 + 40}%`,
      animationDelay: `${delay}ms`,
    }}
  >
    {emoji}
  </div>
);

export const Game: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [subredditInfo, setSubredditInfo] = useState<SubredditInfo | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showFloatingEmojis, setShowFloatingEmojis] = useState(false);
  const [ballRotation, setBallRotation] = useState(0);
  const [questionHistory, setQuestionHistory] = useState<Array<{question: string; answer: string}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [ballGlow, setBallGlow] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  
  const ballRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  React.useEffect(() => {
    const hostname = window.location.hostname;
    setShowBanner(!hostname.endsWith('devvit.net'));
    
    // Load subreddit info when component mounts
    if (hostname.endsWith('devvit.net')) {
      loadSubredditInfo();
      loadQuestionHistory();
    }

    // Initialize audio context for sound effects
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const loadSubredditInfo = async () => {
    try {
      const response = await fetch('/api/subreddit');
      const result = await response.json();
      if (result.status === 'success' && result.subreddit) {
        setSubredditInfo(result.subreddit);
      }
    } catch (error) {
      console.error('Error loading subreddit info:', error);
    }
  };

  const loadQuestionHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const result = await response.json();
      if (result.status === 'success' && result.history) {
        setQuestionHistory(result.history.slice(0, 5)); // Show last 5 questions
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Sound effect functions
  const playShakeSound = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const playRevealSound = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const askQuestion = useCallback(async () => {
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    setAnswer('');
    setIsShaking(true);
    setBallGlow(true);
    setShowParticles(true);
    setScreenShake(true);

    // Play shake sound
    playShakeSound();

    // Rotate the ball during shaking
    const rotationInterval = setInterval(() => {
      setBallRotation(prev => prev + 15);
    }, 50);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      const result = (await response.json()) as EightBallResponse;

      if (result.status === 'error') {
        setAnswer('Error: ' + result.message);
        setIsShaking(false);
        setBallGlow(false);
        setShowParticles(false);
        setScreenShake(false);
        setIsLoading(false);
        clearInterval(rotationInterval);
        return;
      }

      // Enhanced shaking animation with multiple phases
      setTimeout(() => {
        setIsShaking(false);
        setIsRevealing(true);
        setShowFloatingEmojis(true);
        setBallRotation(0);
        clearInterval(rotationInterval);
        
        // Play reveal sound
        playRevealSound();
        
        setAnswer(result.answer);
        
        // Update question history
        setQuestionHistory(prev => [
          { question: question.trim(), answer: result.answer },
          ...prev.slice(0, 4)
        ]);
        
        // Update subreddit info if provided
        if (result.subreddit && !subredditInfo) {
          setSubredditInfo({ name: result.subreddit } as SubredditInfo);
        }
        
        setTimeout(() => {
          setIsRevealing(false);
          setBallGlow(false);
          setShowParticles(false);
          setShowFloatingEmojis(false);
          setScreenShake(false);
          setIsLoading(false);
        }, 2000);
      }, 3000); // Longer shake time for more drama

    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Network error, please try again.');
      setIsShaking(false);
      setBallGlow(false);
      setShowParticles(false);
      setScreenShake(false);
      setIsLoading(false);
      clearInterval(rotationInterval);
    }
  }, [question, subredditInfo]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      askQuestion();
    }
  };

  // Generate particles for magical effect
  const particles = Array.from({ length: 20 }, (_, i) => (
    <Particle
      key={i}
      x={Math.random() * 100}
      y={Math.random() * 100}
      delay={i * 100}
    />
  ));

  // Generate floating emojis
  const floatingEmojis = ['✨', '🔮', '💫', '⭐', '🌟'].map((emoji, i) => (
    <FloatingEmoji key={i} emoji={emoji} delay={i * 200} />
  ));

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>
      {showBanner && <Banner />}
      
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated background orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full animate-pulse-slow" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/20 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-indigo-500/20 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Particles */}
        {showParticles && particles}
        
        {/* Floating emojis */}
        {showFloatingEmojis && floatingEmojis}
      </div>
      
      <div className="text-center max-w-md w-full relative z-10">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wider animate-glow">
          🎱 {subredditInfo ? `r/${subredditInfo.name}` : 'Magic'} 8-Ball
        </h1>
        <p className="text-purple-200 mb-4 text-lg">
          {subredditInfo 
            ? `Ask a question about r/${subredditInfo.name}...` 
            : 'Ask a question and discover your fate...'
          }
        </p>
        
        {subredditInfo && subredditInfo.subscribers && (
          <p className="text-purple-300 mb-6 text-sm animate-pulse">
            🌟 Powered by {Math.floor(subredditInfo.subscribers / 1000)}k community members
          </p>
        )}

        {/* Question Input with enhanced styling */}
        <div className="mb-8 relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={subredditInfo ? `Ask about r/${subredditInfo.name}...` : "Ask your question..."}
            disabled={isLoading}
            className="w-full px-4 py-3 text-lg rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 focus:bg-white/20 focus:scale-105"
          />
          {question && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-purple-300 animate-pulse">✨</span>
            </div>
          )}
        </div>

        {/* Enhanced Magic 8-Ball */}
        <div className="relative mb-8">
          <div 
            ref={ballRef}
            className={`w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-black border-4 border-gray-600 shadow-2xl cursor-pointer transition-all duration-300 relative ${
              isShaking ? 'animate-intense-shake' : 'hover:scale-105'
            } ${isRevealing ? 'animate-reveal-pulse' : ''} ${ballGlow ? 'animate-magical-glow' : ''}`}
            onClick={askQuestion}
            style={{ transform: `rotate(${ballRotation}deg)` }}
          >
            {/* Outer glow effect */}
            {ballGlow && (
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 animate-spin-slow blur-lg" />
            )}
            
            {/* 8-Ball Surface with enhanced reflections */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner relative overflow-hidden">
              {/* Highlight reflection */}
              <div className="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-full blur-xl" />
              
              {/* Number 8 with enhanced styling */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300">
                  <span className="text-3xl font-bold text-black drop-shadow-sm">8</span>
                </div>
              </div>
              
              {/* Answer Window with enhanced effects */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-40 h-24">
                <div className={`w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center p-3 shadow-inner relative overflow-hidden ${
                  isRevealing ? 'animate-answer-reveal' : ''
                }`}>
                  {/* Answer window glow */}
                  {answer && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
                  )}
                  
                  <div className="relative z-10">
                    {isLoading ? (
                      <div className="text-white text-sm text-center animate-pulse">
                        {isShaking ? (
                          <div className="flex items-center justify-center space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        ) : 'Thinking...'}
                      </div>
                    ) : answer ? (
                      <div className="text-white text-sm text-center leading-tight font-medium animate-fade-in">
                        {answer}
                      </div>
                    ) : (
                      <div className="text-blue-300 text-sm text-center opacity-60">
                        {subredditInfo ? `Ask r/${subredditInfo.name}` : 'Ask a question'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Ask Button */}
        <button
          onClick={askQuestion}
          disabled={!question.trim() || isLoading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          {/* Button glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          
          <span className="relative z-10">
            {isLoading 
              ? (subredditInfo ? `Consulting r/${subredditInfo.name}...` : 'Consulting the spirits...') 
              : (subredditInfo ? `Ask r/${subredditInfo.name} 8-Ball` : 'Ask the Magic 8-Ball')
            }
          </span>
        </button>

        {/* Question History Toggle */}
        {questionHistory.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-4 px-4 py-2 bg-white/10 backdrop-blur-sm text-purple-200 rounded-lg hover:bg-white/20 transition-all duration-300 text-sm"
          >
            {showHistory ? 'Hide' : 'Show'} Recent Questions ({questionHistory.length})
          </button>
        )}

        {/* Question History */}
        {showHistory && questionHistory.length > 0 && (
          <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-lg p-4 max-h-48 overflow-y-auto">
            <h3 className="text-purple-200 font-semibold mb-2 text-sm">Recent Questions</h3>
            <div className="space-y-2">
              {questionHistory.map((item, index) => (
                <div key={index} className="text-xs text-left">
                  <div className="text-purple-300 font-medium">Q: {item.question}</div>
                  <div className="text-blue-300 ml-2">A: {item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Instructions */}
        <div className="mt-8 text-purple-200 text-sm space-y-2">
          <p>💫 Think of a yes/no question {subredditInfo ? `about r/${subredditInfo.name}` : ''}</p>
          <p>🎱 Click the 8-ball or press Enter for magical answers</p>
          <p>✨ Experience the {subredditInfo ? 'community-powered' : 'mystical'} wisdom</p>
          {subredditInfo && subredditInfo.rules && subredditInfo.rules.length > 0 && (
            <p className="text-xs opacity-75">📋 Answers may reference community rules and culture</p>
          )}
        </div>
      </div>
    </div>
  );
};