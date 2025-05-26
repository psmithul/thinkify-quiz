import { CreatorQuizzes } from './client';

interface Params {
  creator_id: string;
}

export default async function CreatorQuizzesPage({ params }: { params: Promise<Params> }) {
  const { creator_id } = await params;

  return (
    <CreatorQuizzes creatorId={creator_id} />
  );
} 