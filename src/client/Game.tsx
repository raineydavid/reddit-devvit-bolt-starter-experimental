import React, { useState, useCallback } from 'react';
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

export const Game: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [subredditInfo, setSubredditInfo] = useState<SubredditInfo | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const hostname = window.location.hostname;
    setShowBanner(!hostname.endsWith('devvit.net'));
    
    // Load subreddit info when component mounts
    if (hostname.endsWith('devvit.net')) {
      loadSubredditInfo();
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

  const askQuestion = useCallback(async () => {
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    setAnswer('');
    setIsShaking(true);

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
        setIsLoading(false);
        return;
      }

      // Simulate shaking animation
      setTimeout(() => {
        setIsShaking(false);
        setIsRevealing(true);
        setAnswer(result.answer);
        
        // Update subreddit info if provided
        if (result.subreddit && !subredditInfo) {
          setSubredditInfo({ name: result.subreddit } as SubredditInfo);
        }
        
        setTimeout(() => {
          setIsRevealing(false);
          setIsLoading(false);
        }, 1000);
      }, 2000);

    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Network error, please try again.');
      setIsShaking(false);
      setIsLoading(false);
    }
  }, [question]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      askQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      {showBanner && <Banner />}
      
      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">
          🎱 {subredditInfo ? `r/${subredditInfo.name}` : 'Magic'} 8-Ball
        </h1>
        <p className="text-purple-200 mb-4 text-lg">
          {subredditInfo 
            ? `Ask a question about r/${subredditInfo.name}...` 
            : 'Ask a question and discover your fate...'
          }
        </p>
        
        {subredditInfo && subredditInfo.subscribers && (
          <p className="text-purple-300 mb-6 text-sm">
            🌟 Powered by {Math.floor(subredditInfo.subscribers / 1000)}k community members
          </p>
        )}

        {/* Question Input */}
        <div className="mb-8">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={subredditInfo ? `Ask about r/${subredditInfo.name}...` : "Ask your question..."}
            disabled={isLoading}
            className="w-full px-4 py-3 text-lg rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
          />
        </div>

        {/* Magic 8-Ball */}
        <div className="relative mb-8">
          <div 
            className={`w-64 h-64 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-black border-4 border-gray-600 shadow-2xl cursor-pointer transition-all duration-300 ${
              isShaking ? 'animate-bounce' : 'hover:scale-105'
            } ${isRevealing ? 'animate-pulse' : ''}`}
            onClick={askQuestion}
          >
            {/* 8-Ball Surface */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner">
              {/* Number 8 */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">8</span>
                </div>
              </div>
              
              {/* Answer Window */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-20">
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center p-2 shadow-inner">
                  {isLoading ? (
                    <div className="text-white text-xs text-center animate-pulse">
                      {isShaking ? '...' : 'Thinking...'}
                    </div>
                  ) : answer ? (
                    <div className="text-white text-xs text-center leading-tight font-medium">
                      {answer}
                    </div>
                  ) : (
                    <div className="text-blue-300 text-xs text-center opacity-60">
                      {subredditInfo ? `Ask r/${subredditInfo.name}` : 'Ask a question'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ask Button */}
        <button
          onClick={askQuestion}
          disabled={!question.trim() || isLoading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          {isLoading 
            ? (subredditInfo ? `Consulting r/${subredditInfo.name}...` : 'Consulting the spirits...') 
            : (subredditInfo ? `Ask r/${subredditInfo.name} 8-Ball` : 'Ask the Magic 8-Ball')
          }
        </button>

        {/* Instructions */}
        <div className="mt-8 text-purple-200 text-sm space-y-2">
          <p>💫 Think of a yes/no question {subredditInfo ? `about r/${subredditInfo.name}` : ''}</p>
          <p>🎱 Click the 8-ball or press Enter</p>
          <p>✨ Receive your {subredditInfo ? 'community-powered' : 'mystical'} answer</p>
          {subredditInfo && subredditInfo.rules && subredditInfo.rules.length > 0 && (
            <p className="text-xs opacity-75">📋 Answers may reference community rules and culture</p>
          )}
        </div>
      </div>
    </div>
  );
};