'use client';

import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                <p>We collect information to provide better services to our users. We collect information in the following ways:</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Name and email address when you create an account</li>
                  <li>Profile information including job title, company, and location (optional)</li>
                  <li>LinkedIn profile data when you choose to connect your LinkedIn account</li>
                  <li>Learning progress and quiz results</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Usage Information</h3>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>How you interact with our platform</li>
                  <li>Quiz completion data and scores</li>
                  <li>Time spent on different sections</li>
                  <li>Device and browser information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Provide, maintain, and improve our learning platform</li>
                  <li>Personalize your learning experience</li>
                  <li>Track your progress and provide certificates</li>
                  <li>Send you educational content and platform updates</li>
                  <li>Connect you with relevant job opportunities based on your skills</li>
                  <li>Communicate with you about your account and our services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                <p>We do not sell your personal information. We may share your information in the following limited circumstances:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>With Your Consent:</strong> We'll share personal information when you give us consent</li>
                  <li><strong>With Recruiters:</strong> If you opt-in, we may share your profile with recruiters at relevant companies</li>
                  <li><strong>For Legal Reasons:</strong> We'll share personal information if required by law</li>
                  <li><strong>With Service Providers:</strong> We share information with trusted service providers who help us operate our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. LinkedIn Integration</h2>
                <p>
                  When you connect your LinkedIn account, we may import and store information from your LinkedIn profile
                  including your name, job title, company, location, and professional summary. This information is used to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Pre-fill your Thinkify profile to save you time</li>
                  <li>Provide personalized learning recommendations</li>
                  <li>Connect you with relevant career opportunities</li>
                </ul>
                <p className="mt-4">
                  You can disconnect your LinkedIn account at any time from your profile settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information
                  against unauthorized access, alteration, disclosure, or destruction. This includes:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure hosting with trusted cloud providers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
                <p>You have several rights regarding your personal information:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Access:</strong> You can access and review your personal information</li>
                  <li><strong>Update:</strong> You can update your profile information at any time</li>
                  <li><strong>Delete:</strong> You can request deletion of your account and personal information</li>
                  <li><strong>Opt-out:</strong> You can opt-out of marketing communications</li>
                  <li><strong>Data Portability:</strong> You can request a copy of your data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
                <p>
                  We use cookies and similar technologies to enhance your experience on our platform. These help us:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Remember your login status and preferences</li>
                  <li>Analyze how our platform is used</li>
                  <li>Provide personalized content and recommendations</li>
                  <li>Improve our services and user experience</li>
                </ul>
                <p className="mt-4">
                  You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
                <p>
                  Our service is not intended for children under 13 years of age. We do not knowingly collect
                  personal information from children under 13. If we discover that we have collected personal
                  information from a child under 13, we will delete such information immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own.
                  We ensure that such transfers comply with applicable data protection laws and that your
                  information receives adequate protection.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes
                  by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage
                  you to review this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <div className="ml-4 mt-2">
                  <p>Email: privacy@thinkify.app</p>
                  <p>Subject: Privacy Policy Inquiry</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 