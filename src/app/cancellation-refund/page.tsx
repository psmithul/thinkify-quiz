'use client';

import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';

export default function CancellationRefundPage() {
  const handleContactRedirect = () => {
    window.open('https://connect.thinkify.io', '_blank');
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Cancellation & Refund Policy</h1>
            
            <div className="prose max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Refund Eligibility</h2>
                <p>
                  At Thinkify, we are committed to providing high-quality quiz and assessment services. 
                  We understand that circumstances may arise where you need to request a refund.
                </p>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded my-4">
                  <h3 className="font-semibold text-green-900 mb-2">Eligible for Full Refund:</h3>
                  <ul className="list-disc list-inside space-y-1 text-green-800">
                    <li>Technical issues preventing quiz access within 24 hours of payment</li>
                    <li>Duplicate payments made in error</li>
                    <li>Quiz content not matching the description provided</li>
                    <li>Service unavailability for more than 48 hours</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded my-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Partial Refund (50%):</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    <li>Cancellation within 7 days of purchase (quiz not attempted)</li>
                    <li>Documented technical issues affecting quiz completion</li>
                    <li>Change of mind within 72 hours of purchase (quiz not started)</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded my-4">
                  <h3 className="font-semibold text-red-900 mb-2">No Refund Available:</h3>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    <li>Quiz completed and results generated</li>
                    <li>Cancellation after 7 days of purchase</li>
                    <li>Violation of terms of service</li>
                    <li>Change of mind after quiz attempt</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cancellation Process</h2>
                <p>To request a cancellation or refund, please follow these steps:</p>
                
                <div className="grid md:grid-cols-2 gap-4 my-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        1
                      </div>
                      <h3 className="font-semibold text-gray-900">Submit Request</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Contact our support team with your payment details and reason for cancellation.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        2
                      </div>
                      <h3 className="font-semibold text-gray-900">Review Process</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Our team will review your request within 2-3 business days.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        3
                      </div>
                      <h3 className="font-semibold text-gray-900">Decision Notice</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      You'll receive an email notification about the approval or denial of your request.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        4
                      </div>
                      <h3 className="font-semibold text-gray-900">Refund Processing</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Approved refunds are processed within 5-7 business days to your original payment method.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Refund Processing Time</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processing Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">UPI / Digital Wallets</td>
                        <td className="px-4 py-3 text-sm text-gray-700">1-2 business days</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Fastest refund method</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">Debit/Credit Card</td>
                        <td className="px-4 py-3 text-sm text-gray-700">3-5 business days</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Depends on bank processing</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">Net Banking</td>
                        <td className="px-4 py-3 text-sm text-gray-700">3-7 business days</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Bank transfer processing time</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Special Circumstances</h2>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
                    <h3 className="font-semibold text-green-900 mb-2">Technical Issues</h3>
                    <p className="text-green-800">
                      If you experience technical difficulties that prevent you from completing a quiz, 
                      we offer full refunds or the option to retake the quiz at no additional cost.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded">
                    <h3 className="font-semibold text-purple-900 mb-2">Content Issues</h3>
                    <p className="text-purple-800">
                      If quiz content does not match the description or contains errors that affect your results, 
                      we provide full refunds and immediate content corrections.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded">
                    <h3 className="font-semibold text-orange-900 mb-2">Exceptional Cases</h3>
                    <p className="text-orange-800">
                      Medical emergencies, natural disasters, or other extraordinary circumstances will be 
                      reviewed on a case-by-case basis with compassionate consideration.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Us</h2>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Need Help with Cancellations & Refunds?
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Our customer support team is ready to help you with any questions about 
                        cancellations, refunds, or policy clarifications.
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-blue-600">
                        <span className="bg-blue-100 px-2 py-1 rounded">Quick Response</span>
                        <span className="bg-blue-100 px-2 py-1 rounded">Expert Support</span>
                        <span className="bg-blue-100 px-2 py-1 rounded">24/7 Available</span>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button
                        onClick={handleContactRedirect}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="font-semibold text-gray-900 mb-1">Response Time</div>
                    <div>Within 24 hours</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="font-semibold text-gray-900 mb-1">Support Languages</div>
                    <div>English & Hindi</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="font-semibold text-gray-900 mb-1">Resolution Time</div>
                    <div>2-3 business days</div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Policy Updates</h2>
                <p>
                  This policy is subject to change. We will notify users of any significant updates via email 
                  or website notifications. For urgent matters, please contact us immediately through our support portal.
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