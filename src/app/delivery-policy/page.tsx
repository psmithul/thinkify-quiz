'use client';

import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';

export default function DeliveryPolicyPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Delivery Policy</h1>
            
            <div className="prose max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Nature of Services</h2>
                <p>
                  Thinkify provides digital educational services including online quizzes, assessments, courses, 
                  and learning materials. All our services are delivered electronically through our web platform 
                  and do not involve physical delivery of goods.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded my-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Digital Services Include:</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Interactive online quizzes and assessments</li>
                    <li>Digital certificates upon completion</li>
                    <li>Progress tracking and analytics</li>
                    <li>Course materials and learning resources</li>
                    <li>Platform access and user dashboard</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Delivery Timeline</h2>
                <p>
                  Since our services are digital, delivery is immediate upon successful payment confirmation 
                  and account verification.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 my-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        ⚡
                      </div>
                      <h3 className="font-semibold text-green-900">Instant Delivery</h3>
                    </div>
                    <p className="text-sm text-green-800">
                      Quiz access and platform features are activated immediately after payment verification.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        📧
                      </div>
                      <h3 className="font-semibold text-blue-900">Email Confirmation</h3>
                    </div>
                    <p className="text-sm text-blue-800">
                      Confirmation email with access details sent within 5 minutes of purchase.
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center mb-2">
                      <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        🏆
                      </div>
                      <h3 className="font-semibold text-purple-900">Digital Certificates</h3>
                    </div>
                    <p className="text-sm text-purple-800">
                      Certificates generated automatically upon quiz/course completion.
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center mb-2">
                      <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-2">
                        📱
                      </div>
                      <h3 className="font-semibold text-orange-900">24/7 Access</h3>
                    </div>
                    <p className="text-sm text-orange-800">
                      Platform access available round the clock from any device with internet.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Delivery Process</h2>
                <p>Our streamlined delivery process ensures you get immediate access to your purchased services:</p>
                
                <div className="space-y-4 my-6">
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Payment Processing</h3>
                      <p className="text-gray-600 text-sm">
                        Secure payment processing through Razorpay with instant verification
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Account Activation</h3>
                      <p className="text-gray-600 text-sm">
                        Your account is automatically updated with purchased quiz/course access
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Confirmation Email</h3>
                      <p className="text-gray-600 text-sm">
                        Detailed confirmation email with access instructions and receipt
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Immediate Access</h3>
                      <p className="text-gray-600 text-sm">
                        Start using your purchased services immediately from your dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Service Availability</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Access Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Platform Availability
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">Quiz Access</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Instant</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Lifetime</td>
                        <td className="px-4 py-3 text-sm text-gray-700">24/7</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">Course Materials</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Instant</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Lifetime</td>
                        <td className="px-4 py-3 text-sm text-gray-700">24/7</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">Digital Certificates</td>
                        <td className="px-4 py-3 text-sm text-gray-700">On completion</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Permanent</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Download anytime</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">Progress Analytics</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Real-time</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Lifetime</td>
                        <td className="px-4 py-3 text-sm text-gray-700">24/7</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Technical Requirements</h2>
                <p>
                  To ensure smooth delivery and access to our services, please ensure you meet 
                  the following technical requirements:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 my-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Minimum Requirements:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Internet connection (minimum 1 Mbps)
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Modern web browser (Chrome, Firefox, Safari, Edge)
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        JavaScript enabled
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Valid email address for account verification
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Supported Devices:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-2">📱</span>
                        Mobile phones (iOS/Android)
                      </li>
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-2">💻</span>
                        Desktop computers (Windows/Mac/Linux)
                      </li>
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-2">📟</span>
                        Tablets (iPad/Android tablets)
                      </li>
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-2">🖥️</span>
                        Laptops (all operating systems)
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delivery Issues & Resolution</h2>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
                    <h3 className="font-semibold text-red-900 mb-2">Common Issues & Solutions</h3>
                    <div className="space-y-2 text-red-800 text-sm">
                      <p><strong>Payment processed but no access:</strong> Check spam folder for confirmation email, refresh your dashboard</p>
                      <p><strong>Unable to access quiz:</strong> Clear browser cache, try incognito mode, or contact support</p>
                      <p><strong>Email not received:</strong> Check spam/promotions folder, verify email address in profile</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                    <h3 className="font-semibold text-yellow-900 mb-2">Resolution Timeline</h3>
                    <div className="space-y-1 text-yellow-800 text-sm">
                      <p><strong>Immediate:</strong> Automatic troubleshooting and system retry</p>
                      <p><strong>Within 1 hour:</strong> Manual verification and access restoration</p>
                      <p><strong>Within 24 hours:</strong> Complete issue resolution with support intervention</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Razorpay Compliance</h2>
                <p>
                  In compliance with Razorpay's requirements for digital service providers, we maintain:
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-3">Service Documentation</h3>
                      <ul className="space-y-1 text-blue-800 text-sm">
                        <li>• Clear service descriptions</li>
                        <li>• Transparent pricing structure</li>
                        <li>• Delivery timeline commitments</li>
                        <li>• Refund and cancellation policies</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-3">Customer Protection</h3>
                      <ul className="space-y-1 text-blue-800 text-sm">
                        <li>• Secure payment processing</li>
                        <li>• Data protection compliance</li>
                        <li>• 24/7 customer support</li>
                        <li>• Clear dispute resolution process</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Support</h2>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Need Help with Service Delivery?
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Our support team is available to help with any delivery-related questions or issues.
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-blue-600">
                        <span className="bg-blue-100 px-2 py-1 rounded">Instant Response</span>
                        <span className="bg-blue-100 px-2 py-1 rounded">Technical Support</span>
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

                <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">Emergency Contact Information:</p>
                  <p>For urgent delivery issues outside business hours, our automated systems will attempt immediate resolution. 
                  For complex issues requiring human intervention, support requests are processed in order of receipt.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Level Agreement (SLA)</h2>
                <p>
                  We commit to the following service levels for our digital delivery:
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 my-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">99.9%</div>
                    <div className="text-sm font-semibold text-green-900">Platform Uptime</div>
                    <div className="text-xs text-green-700 mt-1">Monthly average</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">&lt; 30s</div>
                    <div className="text-sm font-semibold text-blue-900">Access Activation</div>
                    <div className="text-xs text-blue-700 mt-1">After payment</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600 mb-1">&lt; 5min</div>
                    <div className="text-sm font-semibold text-purple-900">Email Delivery</div>
                    <div className="text-xs text-purple-700 mt-1">Confirmation emails</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              <p className="mt-2">
                This delivery policy is compliant with Razorpay's merchant requirements and applicable digital commerce regulations.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 