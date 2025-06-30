type Response<T> = { status: 'error'; message: string } | ({ status: 'success' } & T);

export type EightBallResponse = Response<{
  answer: string;
  subreddit?: string;
  animation?: 'shake' | 'reveal';
}>;

export type QuestionSubmitResponse = Response<{
  questionId: string;
}>;

export type SubredditInfo = {
  name: string;
  displayName: string;
  description?: string;
  subscribers?: number;
  rules?: Array<{ shortName: string; description: string }>;
  flairEnabled?: boolean;
};