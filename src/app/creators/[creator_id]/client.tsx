'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase, User, Quiz, Follow } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

type CreatorWithQuizzes = User & {
  quizzes: Quiz[];
  followerCount: number;
};

export function CreatorProfile({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorWithQuizzes | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
   
  useEffect(() => {
    async function fetchCreatorProfile() {
      try {
        // Fetch creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .in('role', ['creator', 'admin'])
          .single();

        if (creatorError) throw creatorError;
        
        // Fetch creator's quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });
          
        if (quizzesError) throw quizzesError;

        // Fetch follower count
        const { count, error: followerCountError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', creatorId);

        if (followerCountError) throw followerCountError;
        
        setCreator({
          ...creatorData,
          quizzes: quizzesData || [],
          followerCount: count || 0
        });

        // Check if current user is following this creator
        if (user) {
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', creatorId)
            .maybeSingle();

          if (followError) throw followError;
          setIsFollowing(!!followData);
        }
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (creatorId) {
      fetchCreatorProfile();
    }
  }, [creatorId, user]);

  const handleFollow = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isFollowing) {
        // Unfollow logic
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId);

        if (error) throw error;
        setIsFollowing(false);
        setCreator(prev => prev ? {...prev, followerCount: Math.max(0, prev.followerCount - 1)} : null);
        setSuccess(`You have unfollowed ${creator?.full_name || 'this creator'}`);
      } else {
        // Follow logic
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId
          });

        if (error) throw error;
        setIsFollowing(true);
        setCreator(prev => prev ? {...prev, followerCount: prev.followerCount + 1} : null);
        setSuccess(`You are now following ${creator?.full_name || 'this creator'}`);
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!showFollowers) {
      try {
        setIsActionLoading(true);
        const { data, error } = await supabase
          .from('follows')
          .select('follower:users!follower_id(id, email, full_name, profile_image, role)')
          .eq('following_id', creatorId)
          .limit(10);

        if (error) throw error;
        // Extract the follower data from each row
        const followerUsers: User[] = [];
        data?.forEach(item => {
          if (item.follower) {
            followerUsers.push(item.follower as unknown as User);
          }
        });
        setFollowers(followerUsers);
        setShowFollowers(true);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsActionLoading(false);
      }
    } else {
      setShowFollowers(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
            <Button 
              variant="outline" 
              onClick={() => router.push('/creators')}
            >
              Back to Creators
            </Button>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-red-700">Creator not found or no longer active.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/creators')}
          >
            Back to Creators
          </Button>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 p-4 rounded-md"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 p-4 rounded-md"
          >
            <p className="text-sm text-green-600">{success}</p>
          </motion.div>
        )}
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
        >
          <div className="p-8">
            <div className="flex flex-col md:flex-row">
              <div className="mb-6 md:mb-0 md:mr-8">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border border-gray-300"
                >
                  {creator.profile_image ? (
                    <img 
                      src={creator.profile_image} 
                      alt={creator.full_name || 'Creator'} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-purple-100 text-purple-800 text-4xl font-bold">
                      {(creator.full_name || creator.email || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </motion.div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
                    {creator.full_name || creator.email}
                  </h2>
                  <Button
                    variant={isFollowing ? "outline" : "primary"}
                    size="sm"
                    onClick={handleFollow}
                    isLoading={isActionLoading}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                </div>
                
                <div className="mb-4 flex space-x-4">
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {creator.quizzes.length} {creator.quizzes.length === 1 ? 'Quiz' : 'Quizzes'}
                  </span>
                  <button 
                    onClick={fetchFollowers} 
                    className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded hover:bg-blue-200 transition-colors"
                  >
                    {creator.followerCount} {creator.followerCount === 1 ? 'Follower' : 'Followers'}
                  </button>
                </div>
                
                {creator.bio && (
                  <div className="prose max-w-none text-gray-700">
                    <p>{creator.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showFollowers && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 p-4"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-3">Followers</h3>
              {followers.length === 0 ? (
                <p className="text-gray-500">No followers yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {followers.map(follower => (
                    <div key={follower.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {follower.profile_image ? (
                          <img 
                            src={follower.profile_image} 
                            alt={follower.full_name || 'User'} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-blue-100 text-blue-800 text-sm font-bold">
                            {(follower.full_name || follower.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {follower.full_name || follower.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quizzes by this Creator</h2>
          
          {creator.quizzes.length === 0 ? (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">This creator has no published quizzes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creator.quizzes.map((quiz, index) => (
                <motion.div 
                  key={quiz.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white shadow rounded-lg p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{quiz.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-500">
                      {quiz.price ? `$${quiz.price.toFixed(2)}` : 'Free'}
                    </div>
                    <Button 
                      onClick={() => router.push(`/user/quiz/${quiz.id}`)}
                      size="sm"
                    >
                      Take Quiz
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 