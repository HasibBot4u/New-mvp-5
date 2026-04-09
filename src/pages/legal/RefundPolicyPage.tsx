import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#1A237E] to-[#283593] pt-32 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="bangla text-3xl md:text-4xl font-extrabold text-white mb-2">
            ফেরত নীতি
          </h1>
          <p className="text-blue-200">Refund Policy</p>
        </div>
      </section>

      <section className="bg-white py-12 px-4 flex-grow">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 md:p-12">
            <div className="text-5xl mb-6">💸</div>
            <p className="bangla text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              বর্তমানে আমাদের প্ল্যাটফর্মের সকল কন্টেন্ট সম্পূর্ণ বিনামূল্যে প্রদান করা হচ্ছে। 
              ভবিষ্যতে পেইড ফিচার চালু হলে আমাদের রিফান্ড পলিসি এখানে আপডেট করা হবে। 
              যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
            </p>
            <a 
              href="mailto:support@nexusedu.com" 
              className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
            >
              সাপোর্টে ইমেইল করুন
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
