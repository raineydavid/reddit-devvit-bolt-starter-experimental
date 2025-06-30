import express from 'express';
import { createServer, getContext, getServerPort } from '@devvit/server';
import { EightBallResponse, SubredditInfo } from '../shared/types/game';
import { getRedis } from '@devvit/redis';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Generic Magic 8-Ball answers (fallback)
const GENERIC_ANSWERS = [
  "It is certain",
  "Reply hazy, try again", 
  "Don't count on it",
  "It is decidedly so",
  "Ask again later",
  "My reply is no",
  "Without a doubt",
  "Better not tell you now",
  "My sources say no",
  "Yes definitely",
  "Cannot predict now",
  "Outlook not so good",
  "You may rely on it",
  "Concentrate and ask again",
  "Very doubtful",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes"
];

// Community-specific answer generators
const generateCommunityAnswers = (subredditInfo: SubredditInfo): string[] => {
  const { name, displayName, subscribers, rules } = subredditInfo;
  const communityAnswers = [
    `The mods of r/${name} say yes`,
    `According to r/${name} rules, absolutely`,
    `The r/${name} community believes so`,
    `Ask the r/${name} daily thread`,
    `Check the r/${name} wiki first`,
    `The r/${name} hivemind says no`,
    `Post it in r/${name} and find out`,
    `The r/${name} automod says maybe`,
    `r/${name} veterans would agree`,
    `That's against r/${name} guidelines`,
    `r/${name} would upvote this`,
    `The r/${name} FAQ has your answer`,
    `Ask r/${name} in the weekly thread`,
    `r/${name} mods are watching...`,
    `The spirit of r/${name} says yes`,
    `The r/${name} oracle has spoken: Yes!`,
    `r/${name}'s collective wisdom says no`,
    `The ancient scrolls of r/${name} confirm it`,
    `r/${name}'s magic 8-ball network agrees`,
    `The r/${name} prophecy foretells: Maybe`,
    `r/${name}'s crystal ball is cloudy...`,
    `The r/${name} fortune cookies say yes`,
    `r/${name}'s tarot cards reveal: No`,
    `The r/${name} tea leaves suggest: Definitely`,
    `r/${name}'s cosmic energy says: Ask again`,
    `The r/${name} universe aligns: Absolutely`,
    `r/${name}'s mystical forces say: Doubtful`,
    `The r/${name} spirits whisper: Yes`,
    `r/${name}'s digital divination: Unclear`,
    `The r/${name} algorithm predicts: Likely`,
  ];

  // Add subscriber-based answers
  if (subscribers) {
    if (subscribers > 100000) {
      communityAnswers.push(`With ${Math.floor(subscribers/1000)}k members, r/${name} says yes`);
      communityAnswers.push(`${Math.floor(subscribers/1000)}k r/${name} users can't be wrong`);
    } else if (subscribers > 1000) {
      communityAnswers.push(`All ${Math.floor(subscribers/1000)}k r/${name} members agree`);
    }
  }

  // Add rule-based answers
  if (rules && rules.length > 0) {
    communityAnswers.push(`Check rule ${Math.floor(Math.random() * rules.length) + 1} of r/${name}`);
    communityAnswers.push(`The r/${name} rules are clear on this`);
  }

  // Mix community answers with some generic ones
  return [...communityAnswers, ...GENERIC_ANSWERS.slice(0, 5)];
};

// Get subreddit information
const getSubredditInfo = async (context: any): Promise<SubredditInfo | null> => {
  try {
    const subreddit = await context.reddit.getCurrentSubreddit();
    const rules = await context.reddit.getSubredditRules(subreddit.name);
    
    return {
      name: subreddit.name,
      displayName: subreddit.displayName || subreddit.name,
      description: subreddit.description,
      subscribers: subreddit.subscribers,
      rules: rules?.map(rule => ({
        shortName: rule.shortName || rule.violationReason || 'Rule',
        description: rule.description || ''
      })) || [],
      flairEnabled: subreddit.userFlairEnabled || false
    };
  } catch (error) {
    console.error('Error getting subreddit info:', error);
    return null;
  }
};

router.post<{ postId: string }, EightBallResponse, { question: string }>(
  '/api/ask',
  async (req, res): Promise<void> => {
    const { question } = req.body;
    const context = getContext();
    const { postId, userId } = context;
    const redis = getRedis();

    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'Must be logged in' });
      return;
    }
    if (!question || question.trim().length === 0) {
      res.status(400).json({ status: 'error', message: 'Question is required' });
      return;
    }

    try {
      // Get subreddit information for community-specific answers
      const subredditInfo = await getSubredditInfo(context);
      let availableAnswers = GENERIC_ANSWERS;
      
      if (subredditInfo) {
        availableAnswers = generateCommunityAnswers(subredditInfo);
        
        // Store subreddit info for caching (expires in 1 hour)
        const subredditKey = `subreddit_info:${subredditInfo.name}`;
        await redis.set(subredditKey, JSON.stringify(subredditInfo));
        await redis.expire(subredditKey, 3600);
      }

      // Store the question for analytics/history if needed
      const questionKey = `question:${postId}:${userId}:${Date.now()}`;
      await redis.set(questionKey, question.trim());
      
      // Set expiration for 24 hours to keep storage clean
      await redis.expire(questionKey, 86400);

      // Get a random answer
      const randomIndex = Math.floor(Math.random() * availableAnswers.length);
      const answer = availableAnswers[randomIndex];

      if (!answer) {
        res.status(500).json({ status: 'error', message: 'Failed to get answer' });
        return;
      }

      // Store the answer as well for potential history feature
      const answerKey = `answer:${postId}:${userId}:${Date.now()}`;
      await redis.set(answerKey, JSON.stringify({ 
        question: question.trim(), 
        answer,
        subreddit: subredditInfo?.name 
      }));
      await redis.expire(answerKey, 86400);

      res.json({
        status: 'success',
        answer,
        subreddit: subredditInfo?.name,
        animation: 'reveal',
        confidence: Math.floor(Math.random() * 100) + 1, // Random confidence level
        mysticalLevel: Math.floor(Math.random() * 5) + 1 // Mystical power level 1-5
      });
    } catch (error) {
      console.error('Error processing Magic 8-Ball question:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Internal server error while consulting the Magic 8-Ball' 
      });
    }
  }
);

// Get subreddit info endpoint
router.get<{ postId: string }, { status: string; subreddit?: SubredditInfo }>(
  '/api/subreddit',
  async (_req, res): Promise<void> => {
    const context = getContext();
    const { postId } = context;
    const redis = getRedis();

    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }

    try {
      const subredditInfo = await getSubredditInfo(context);
      
      if (subredditInfo) {
        res.json({
          status: 'success',
          subreddit: subredditInfo
        });
      } else {
        res.json({
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Error getting subreddit info:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get subreddit info' });
    }
  }
);

// Optional: Get question history for a user
router.get<{ postId: string }, { status: string; history?: Array<{ question: string; answer: string; timestamp: number }> }>(
  '/api/history',
  async (_req, res): Promise<void> => {
    const { postId, userId } = getContext();
    const redis = getRedis();

    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'Must be logged in' });
      return;
    }

    try {
      // Get recent answers for this user in this post
      const pattern = `answer:${postId}:${userId}:*`;
      const keys = await redis.keys(pattern);
      
      const history = [];
      for (const key of keys.slice(-10)) { // Get last 10 questions
        const data = await redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          const timestamp = parseInt(key.split(':').pop() || '0');
          history.push({
            question: parsed.question,
            answer: parsed.answer,
            timestamp
          });
        }
      }

      // Sort by timestamp descending (newest first)
      history.sort((a, b) => b.timestamp - a.timestamp);

      res.json({
        status: 'success',
        history
      });
    } catch (error) {
      console.error('Error getting question history:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get history' });
    }
  }
);

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`Magic 8-Ball server running on http://localhost:${port}`));