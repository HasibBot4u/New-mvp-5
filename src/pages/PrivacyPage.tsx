import React from 'react';
import { setPageTitle } from '../utils/setPageTitle';

export default function PrivacyPage() {
  React.useEffect(() => { setPageTitle('Privacy Policy'); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 bangla">গোপনীয়তা নীতি (Privacy Policy)</h1>
      <div className="prose prose-indigo max-w-none bangla space-y-4 text-gray-700">
        <p>NexusEdu-তে আপনার গোপনীয়তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। এই গোপনীয়তা নীতি ব্যাখ্যা করে যে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত করি।</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8">১. আমরা কী তথ্য সংগ্রহ করি</h2>
        <p>আমরা আপনার নাম, ইমেইল ঠিকানা, এবং প্ল্যাটফর্ম ব্যবহারের তথ্য সংগ্রহ করি।</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8">২. আমরা কীভাবে তথ্য ব্যবহার করি</h2>
        <p>আপনার তথ্য শুধুমাত্র আপনাকে উন্নত সেবা প্রদান, একাউন্ট পরিচালনা এবং প্রয়োজনীয় যোগাযোগ করার জন্য ব্যবহার করা হয়।</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8">৩. তথ্য সুরক্ষা</h2>
        <p>আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে যথাযথ প্রযুক্তিগত ব্যবস্থা গ্রহণ করি।</p>
      </div>
    </div>
  );
}
