import { Link } from 'react-router-dom';
import { Play, UserPlus, BookOpen, CheckCircle2, Atom, Beaker, Calculator } from 'lucide-react';
import { NexusLogo } from '../components/shared/NexusLogo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <NexusLogo />
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium bangla"
              >
                লগইন
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium bangla shadow-sm"
              >
                রেজিস্ট্রেশন
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-600 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="text-center lg:text-left">
              <div className="inline-block bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium bangla mb-6 shadow-sm">
                🎓 HSC {new Date().getFullYear().toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d as any])}-{((new Date().getFullYear() + 1) % 100).toString().padStart(2, '0').replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d as any])} কোর্স চলছে
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight bangla mb-6">
                HSC-র সেরা অনলাইন ক্লাস এখন এখানে
              </h1>
              <p className="text-xl text-indigo-100 bangla mb-8 max-w-2xl mx-auto lg:mx-0">
                পদার্থবিজ্ঞান, রসায়ন ও উচ্চতর গণিত — সেরা শিক্ষকদের সাথে প্রস্তুতি নাও
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  to="/signup" 
                  className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-bold text-lg bangla shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  এখনই শুরু করো
                </Link>
                <a 
                  href="#courses" 
                  className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-lg bangla"
                >
                  আরও জানুন ↓
                </a>
              </div>
            </div>

            {/* Right Column - CSS Mockup */}
            <div className="hidden lg:block relative perspective-1000">
              <div className="transform rotate-y-[-10deg] rotate-x-[5deg] shadow-2xl rounded-2xl bg-white p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">NexusEdu</span>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                </div>
                
                {/* Video Area */}
                <div className="aspect-video bg-gray-900 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[65%]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 bangla mb-1">পদার্থবিজ্ঞান | Chapter 3</h3>
                    <p className="text-sm text-gray-500 bangla">গতিবিদ্যা - লেকচার ৪</p>
                  </div>
                  <div className="text-indigo-600 font-medium text-sm bangla flex items-center gap-1 hover:underline cursor-pointer">
                    পরবর্তী ক্লাস →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="bg-indigo-50 py-12 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-indigo-200/50">
            {[
              { value: '১৪০০+', label: 'ভিডিও' },
              { value: '১৮টি', label: 'চ্যানেল' },
              { value: '৩টি', label: 'বিষয়' },
              { value: 'সম্পূর্ণ', label: 'বিনামূল্যে' },
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-bold text-indigo-700 bangla mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-gray-600 bangla font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUBJECTS SECTION */}
      <section id="courses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 bangla mb-4">আমাদের বিষয়সমূহ</h2>
            <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Physics */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <Atom className="w-20 h-20 text-white/90 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 bangla mb-2">পদার্থবিজ্ঞান</h3>
                <p className="text-gray-600 bangla mb-6">৬টি সাইকেল · ৪০০+ ভিডিও</p>
                <Link to="/signup" className="inline-flex items-center text-blue-600 font-medium bangla group-hover:text-blue-700">
                  ক্লাস দেখুন <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* Chemistry */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <Beaker className="w-20 h-20 text-white/90 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 bangla mb-2">রসায়ন</h3>
                <p className="text-gray-600 bangla mb-6">৬টি সাইকেল · ৩০০+ ভিডিও</p>
                <Link to="/signup" className="inline-flex items-center text-purple-600 font-medium bangla group-hover:text-purple-700">
                  ক্লাস দেখুন <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* Math */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <Calculator className="w-20 h-20 text-white/90 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 bangla mb-2">উচ্চতর গণিত</h3>
                <p className="text-gray-600 bangla mb-6">৬টি সাইকেল · ৩০০+ ভিডিও</p>
                <Link to="/signup" className="inline-flex items-center text-green-600 font-medium bangla group-hover:text-green-700">
                  ক্লাস দেখুন <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-slate-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 bangla mb-4">কীভাবে কাজ করে?</h2>
            <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-indigo-200 z-0" />

            {[
              { icon: UserPlus, title: 'রেজিস্ট্রেশন করো', desc: 'ফ্রি একাউন্ট খুলুন' },
              { icon: BookOpen, title: 'বিষয় বেছে নাও', desc: 'তোমার পছন্দের বিষয় সিলেক্ট করো' },
              { icon: Play, title: 'ক্লাস শুরু করো', desc: 'যেকোনো সময়, যেকোনো জায়গা থেকে দেখো' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white rounded-full shadow-md border-4 border-indigo-50 flex items-center justify-center mb-6 text-indigo-600">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 bangla mb-2">{step.title}</h3>
                <p className="text-gray-600 bangla">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NEXUSEDU SECTION */}
      <section className="py-20 bg-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bangla mb-4">কেন NexusEdu বেছে নেবে?</h2>
            <div className="w-24 h-1.5 bg-amber-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'উচ্চমানের কনটেন্ট', desc: 'সেরা শিক্ষকদের তৈরি গোছানো ভিডিও লেকচার।' },
              { title: 'যেকোনো ডিভাইসে', desc: 'মোবাইল, ট্যাবলেট বা ল্যাপটপ — সব ডিভাইসেই স্মুথ এক্সপেরিয়েন্স।' },
              { title: 'নিজের গতিতে শেখো', desc: 'যখন খুশি, যতবার খুশি ক্লাস দেখার সুযোগ।' },
              { title: 'বিশেষজ্ঞ শিক্ষক', desc: 'দেশের সেরা বিশ্ববিদ্যালয়ের শিক্ষার্থীদের দ্বারা পরিচালিত।' },
              { title: 'প্রগতি ট্র্যাকিং', desc: 'তোমার পড়াশোনার অগ্রগতি ট্র্যাক করো ড্যাশবোর্ড থেকে।' }
            ].map((feature, i) => (
              <div key={i} className="bg-indigo-800/50 border border-indigo-700/50 rounded-xl p-6 hover:bg-indigo-800 transition-colors">
                <div className="w-12 h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mb-4 text-amber-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold bangla mb-2">{feature.title}</h3>
                <p className="text-indigo-200 bangla">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-indigo-950 pt-16 pb-8 border-t border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">NexusEdu</span>
              </div>
              <p className="text-indigo-200 bangla max-w-xs">
                তোমার শিক্ষার নতুন দিগন্ত। HSC পরীক্ষার সেরা প্রস্তুতির জন্য আজই যুক্ত হও।
              </p>
            </div>

            {/* Center */}
            <div>
              <h4 className="text-white font-bold bangla mb-6 uppercase tracking-wider text-sm">কুইক লিংক</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-indigo-200 hover:text-white bangla transition-colors">বাড়ি</Link></li>
                <li><Link to="/login" className="text-indigo-200 hover:text-white bangla transition-colors">লগইন</Link></li>
                <li><Link to="/signup" className="text-indigo-200 hover:text-white bangla transition-colors">রেজিস্ট্রেশন</Link></li>
              </ul>
            </div>

            {/* Right */}
            <div>
              <h4 className="text-white font-bold bangla mb-6 uppercase tracking-wider text-sm">যোগাযোগ</h4>
              <ul className="space-y-3 text-indigo-200 bangla">
                <li>ইমেইল: support@nexusedu.com</li>
                <li>ফোন: +880 1XXX XXXXXX</li>
                <li>ঠিকানা: ঢাকা, বাংলাদেশ</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-indigo-900/50 text-center">
            <p className="text-indigo-300 bangla text-sm">
              © ২০২৫ NexusEdu. সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
