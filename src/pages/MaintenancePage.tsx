import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
        <Wrench className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 bangla mb-4 text-center">
        সিস্টেম মেইনটেন্যান্স চলছে
      </h1>
      <p className="text-gray-600 bangla text-center max-w-md">
        আমরা বর্তমানে সিস্টেম আপডেট করছি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।
      </p>
    </div>
  );
}
