import express from 'express';
import { createServer, getContext, getServerPort } from '@devvit/server';
import { EightBallResponse } from '../shared/types/game';
import { getRedis } from '@devvit/redis';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Magic 8-Ball answers
const EIGHT_BALL_ANSWERS = [
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

router.post<{ postId: string }, EightBallResponse, { question: string }>(
  '/api/ask',
  async (req, res): Promise<void> => {
    const { question } = req.body;
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
    if (!question || question.trim().length === 0) {
      res.status(400).json({ status: 'error', message: 'Question is required' });
      return;
    }

    try {
      // Store the question for analytics/history if needed
      const questionKey = `question:${postId}:${userId}:${Date.now()}`;
      await redis.set(questionKey, question.trim());
      
      // Set expiration for 24 hours to keep storage clean
      await redis.expire(questionKey, 86400);

      // Get a random answer
      const randomIndex = Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length);
      const answer = EIGHT_BALL_ANSWERS[randomIndex];

      if (!answer) {
        res.status(500).json({ status: 'error', message: 'Failed to get answer' });
        return;
      }

      // Store the answer as well for potential history feature
      const answerKey = `answer:${postId}:${userId}:${Date.now()}`;
      await redis.set(answerKey, JSON.stringify({ question: question.trim(), answer }));
      await redis.expire(answerKey, 86400);

      res.json({
        status: 'success',
        answer,
        animation: 'reveal'
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