import React from 'react';
import { setPageTitle } from '../utils/setPageTitle';

export default function TermsPage() {
  React.useEffect(() => { setPageTitle('Terms of Service'); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 bangla">শর্তাবলী (Terms of Service)</h1>
      <div className="prose prose-indigo max-w-none bangla space-y-4 text-gray-700">
        <p>NexusEdu ব্যবহার করার জন্য আপনাকে নিম্নলিখিত শর্তাবলী মেনে চলতে হবে।</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8">১. একাউন্ট ব্যবহার</h2>
        <p>আপনার একাউন্ট এবং পাসওয়ার্ডের গোপনীয়তা বজায় রাখার দায়িত্ব আপনার। একাউন্ট শেয়ার করা সম্পূর্ণ নিষিদ্ধ।</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8">২. কন্টেন্ট কপিরাইট</h2>
        <p>এই প্ল্যাটফর্মের সকল ভিডিও, নোট এবং অন্যান্য কন্টেন্ট NexusEdu এর নিজস্ব সম্পত্তি। এগুলো ডাউনলোড, কপি বা অন্য কোথাও শেয়ার করা আইনত দণ্ডনীয়।</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8">৩. সেবা স্থগিতকরণ</h2>
        <p>শর্তাবলী ভঙ্গ করলে আমরা যেকোনো সময় আপনার একাউন্ট স্থগিত বা বাতিল করার অধিকার সংরক্ষণ করি।</p>
      </div>
    </div>
  );
}
