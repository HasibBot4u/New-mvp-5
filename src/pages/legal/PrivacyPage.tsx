import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#1A237E] to-[#283593] pt-32 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="bangla text-3xl md:text-4xl font-extrabold text-white mb-2">
            গোপনীয়তা নীতি
          </h1>
          <p className="text-blue-200">Privacy Policy</p>
        </div>
      </section>

      <section className="bg-white py-12 px-4 flex-grow">
        <div className="max-w-4xl mx-auto prose prose-blue">
          <p className="bangla text-gray-500 mb-8">সর্বশেষ আপডেট: এপ্রিল ২০২৫</p>
          
          <div className="space-y-8 text-gray-700">
            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">১. তথ্য সংগ্রহ</h2>
              <p className="bangla leading-relaxed">
                আমরা আপনার ইমেইল, নাম এবং ভিডিও দেখার ইতিহাস (watch history) সংগ্রহ করি। 
                আপনার শেখার অভিজ্ঞতা উন্নত করার জন্যই এই তথ্যগুলো সংগ্রহ করা হয়।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">২. তথ্য ব্যবহার</h2>
              <p className="bangla leading-relaxed">
                আপনার সংগৃহীত তথ্য শুধুমাত্র আপনার শেখার অগ্রগতি ট্র্যাক করতে এবং 
                প্ল্যাটফর্মের মান উন্নয়নে ব্যবহার করা হয়। আমরা কখনোই আপনার ব্যক্তিগত তথ্য 
                কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">৩. তথ্য সুরক্ষা</h2>
              <p className="bangla leading-relaxed">
                আপনার ডেটা সুরক্ষিত রাখতে আমরা Supabase এনক্রিপ্টেড স্টোরেজ এবং 
                Row Level Security (RLS) পলিসি ব্যবহার করি, যাতে শুধুমাত্র আপনিই 
                আপনার ব্যক্তিগত তথ্য দেখতে পারেন।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">৪. কুকি নীতি</h2>
              <p className="bangla leading-relaxed">
                সেশন ম্যানেজমেন্ট এবং লগইন অবস্থা ধরে রাখার জন্য আমরা localStorage 
                ব্যবহার করি।
              </p>
            </div>

            <div>
              <h2 className="bangla text-2xl font-bold text-gray-900 mb-4">৫. যোগাযোগ</h2>
              <p className="bangla leading-relaxed">
                গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন: 
                <a href="mailto:support@nexusedu.com" className="text-blue-600 ml-1 hover:underline">support@nexusedu.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
