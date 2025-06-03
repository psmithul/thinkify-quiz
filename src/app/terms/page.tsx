'use client';

import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
            
            <div className="prose max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Thinkify, you accept and agree to be bound by the terms and provision of this agreement.
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p>
                  Thinkify is an online learning platform that provides educational quizzes, courses, and learning materials
                  created by instructors and content creators. Our platform facilitates learning through interactive content
                  and assessments.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
                <p>
                  To access certain features of the service, you may be required to create an account. You are responsible for:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Maintaining the confidentiality of your account and password</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information when creating your account</li>
                  <li>Updating your information to keep it current</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
                <p>You agree not to use the service to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Upload, post, or transmit any content that is unlawful, harmful, threatening, or inappropriate</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
                  <li>Interfere with or disrupt the service or servers or networks connected to the service</li>
                  <li>Attempt to gain unauthorized access to any portion of the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
                <p>
                  All content provided by Thinkify, including but not limited to text, graphics, logos, and software,
                  is the property of Thinkify and is protected by intellectual property laws. Content created by users
                  remains the property of the respective creators, but by uploading content, you grant Thinkify a
                  license to use, display, and distribute that content on the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy Policy</h2>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of
                  the service, to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimers</h2>
                <p>
                  The information on this platform is provided on an "as is" basis. Thinkify disclaims all warranties,
                  expressed or implied, including but not limited to warranties of merchantability and fitness for a
                  particular purpose.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p>
                  Thinkify shall not be liable for any damages arising from the use or inability to use the service,
                  including but not limited to direct, indirect, incidental, punitive, and consequential damages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modifications to Terms</h2>
                <p>
                  Thinkify reserves the right to modify these terms at any time. We will notify users of any material
                  changes to these terms. Your continued use of the service after such modifications constitutes your
                  acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
                <p>
                  If you have any questions about these Terms and Conditions, please contact us at support@thinkify.app
                </p>
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