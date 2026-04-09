import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#1A237E] to-[#283593] pt-32 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="bangla text-3xl md:text-4xl font-extrabold text-white mb-2">
            ব্যবহারের শর্তাবলী
          </h1>
          <p className="text-blue-200">Terms of Use</p>
        </div>
      </section>

      <section className="bg-white py-12 px-4 flex-grow">
        <div className="max-w-4xl mx-auto prose prose-blue">
          <div className="space-y-8 text-gray-700">
            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">১. অ্যাকাউন্ট</h2>
              <p className="bangla leading-relaxed">
                প্রতিটি শিক্ষার্থীর জন্য শুধুমাত্র একটি অ্যাকাউন্ট অনুমোদিত। 
                অ্যাকাউন্ট খোলার সময় সঠিক তথ্য প্রদান করা বাধ্যতামূলক।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">২. ব্যবহারবিধি</h2>
              <p className="bangla leading-relaxed">
                আপনার লগইন ক্রেডেনশিয়াল (ইমেইল ও পাসওয়ার্ড) অন্য কারো সাথে শেয়ার করা সম্পূর্ণ নিষেধ। 
                একাধিক ডিভাইস থেকে সন্দেহজনক লগইন পরিলক্ষিত হলে অ্যাকাউন্ট স্থগিত করা হতে পারে।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">৩. কন্টেন্ট</h2>
              <p className="bangla leading-relaxed">
                NexusEdu-এর সকল ভিডিও এবং স্টাডি ম্যাটেরিয়াল শুধুমাত্র আপনার ব্যক্তিগত ব্যবহারের জন্য। 
                ভিডিও রেকর্ড করা, ডাউনলোড করা বা অন্য কোনো মাধ্যমে বিতরণ করা কপিরাইট আইনের লঙ্ঘন।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">৪. বন্ধ করার অধিকার</h2>
              <p className="bangla leading-relaxed">
                শর্তাবলী ভঙ্গের কারণে অ্যাডমিন যেকোনো সময় কোনো পূর্ব নোটিশ ছাড়াই 
                যেকোনো অ্যাকাউন্ট স্থগিত বা বাতিল করার অধিকার সংরক্ষণ করেন।
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
