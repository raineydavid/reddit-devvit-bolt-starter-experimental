type Response<T> = { status: 'error'; message: string } | ({ status: 'success' } & T);

export type EightBallResponse = Response<{
  answer: string;
  animation?: 'shake' | 'reveal';
}>;

export type QuestionSubmitResponse = Response<{
  questionId: string;
}>;