import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import PaymentClient from './client';

export default async function Page({
  params,
}: {
  params: { quiz_id: string };
}) {
  const quizId = params.quiz_id;
  
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    }>
      <PaymentClient quizId={quizId} />
    </Suspense>
  );
}

async function PaymentClientWrapper({
  params
}: {
  params: { quiz_id: string };
}) {
  return (
    <PaymentClient quizId={params.quiz_id} />
  );
} 