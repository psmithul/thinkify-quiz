import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import UserClient from './client';

type Params = Promise<{ user_id: string }>;

// Server Component
export default async function Page({ params }: { params: Params }) {
  const { user_id } = await params;
  
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    }>
      <UserClient userId={user_id} />
    </Suspense>
  );
} 