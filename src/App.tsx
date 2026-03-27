import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle2, BarChart3, ClipboardList, Loader2, Download, Eye, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const QUESTIONS = [
  "Aplikasi SIAP SPANJU mudah digunakan",
  "Tampilan aplikasi menarik dan mudah dipahami",
  "Aplikasi berjalan dengan cepat dan lancar",
  "Informasi dalam aplikasi jelas dan mudah dimengerti",
  "Fitur dalam aplikasi sudah lengkap",
  "Aplikasi membantu kegiatan sekolah",
  "Aplikasi membantu meningkatkan kedisiplinan siswa",
  "Aplikasi mudah diakses kapan saja",
  "Aplikasi aman dan menjaga privasi pengguna",
  "Saya puas menggunakan aplikasi SIAP SPANJU"
];

const STATUS_OPTIONS = ["Siswa", "Guru", "Orang Tua", "Lainnya"];

export default function App() {
  const [view, setView] = useState<'form' | 'dashboard'>('form');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showRespondentsModal, setShowRespondentsModal] = useState(false);

  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSurveys(data);
      setIsLoadingData(false);
    }, (err) => {
      console.error("Error fetching surveys:", err);
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRatingChange = (questionIndex: number, value: number) => {
    setRatings(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all questions answered
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (!ratings[i]) {
        setError('Mohon isi semua pertanyaan survei sebelum mengirim.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const surveyData = {
        name: name.trim(),
        status,
        feedback: feedback.trim(),
        q1: ratings[0],
        q2: ratings[1],
        q3: ratings[2],
        q4: ratings[3],
        q5: ratings[4],
        q6: ratings[5],
        q7: ratings[6],
        q8: ratings[7],
        q9: ratings[8],
        q10: ratings[9],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'surveys'), surveyData);
      setSubmitSuccess(true);
      // Reset form
      setName('');
      setStatus('');
      setFeedback('');
      setRatings({});
    } catch (err: any) {
      console.error("Error submitting survey:", err);
      setError('Terjadi kesalahan saat mengirim survei. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChartData = () => {
    if (surveys.length === 0) return [];
    
    return QUESTIONS.map((q, index) => {
      let totalScore = 0;
      surveys.forEach(survey => {
        totalScore += survey[`q${index + 1}`] || 0;
      });
      const average = totalScore / surveys.length;
      return {
        name: `P${index + 1}`,
        fullQuestion: q,
        RataRata: parseFloat(average.toFixed(2))
      };
    });
  };

  const handleDownloadExcel = () => {
    const dataToExport = surveys.map(survey => {
      const date = survey.createdAt?.toDate ? survey.createdAt.toDate().toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
      return {
        'Tanggal Waktu': date,
        'Nama': survey.name || '-',
        'Status': survey.status || '-',
        'P1: Aplikasi mudah digunakan': survey.q1,
        'P2: Tampilan menarik': survey.q2,
        'P3: Berjalan cepat': survey.q3,
        'P4: Informasi jelas': survey.q4,
        'P5: Fitur lengkap': survey.q5,
        'P6: Membantu kegiatan': survey.q6,
        'P7: Meningkatkan kedisiplinan': survey.q7,
        'P8: Mudah diakses': survey.q8,
        'P9: Aman dan menjaga privasi': survey.q9,
        'P10: Puas menggunakan': survey.q10,
        'Kritik & Saran': survey.feedback || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Survei");
    XLSX.writeFile(workbook, "Hasil_Survei_SIAP_SPANJU.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://iili.io/KDFk4fI.png" alt="Logo SIAP SPANJU" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">SIAP SPANJU</h1>
          </div>
          <nav className="flex gap-2">
            <button 
              onClick={() => setView('form')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${view === 'form' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Isi Survei</span>
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {view === 'form' ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-blue-600 px-8 py-10 text-white text-center">
              <h2 className="text-3xl font-bold mb-2">FORM SURVEY KEPUASAN PENGGUNAAN APLIKASI SIAP SPANJU</h2>
              <p className="text-blue-100 max-w-2xl mx-auto">Bantu kami meningkatkan kualitas layanan dengan memberikan penilaian Anda terhadap aplikasi SIAP SPANJU.</p>
            </div>

            {submitSuccess ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Terima Kasih!</h3>
                <p className="text-slate-600 mb-8 max-w-md">Tanggapan Anda telah berhasil disimpan dan sangat berarti bagi pengembangan aplikasi kami ke depannya.</p>
                <button 
                  onClick={() => setSubmitSuccess(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Isi Survei Lagi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-10">
                {/* Identitas */}
                <div className="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Identitas Responden (Opsional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Masukkan nama Anda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                      <div className="flex flex-wrap gap-4">
                        {STATUS_OPTIONS.map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="status" 
                              value={opt}
                              checked={status === opt}
                              onChange={() => setStatus(opt)}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Petunjuk */}
                <div className="mb-8 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                  <p className="font-semibold mb-1">Petunjuk Pengisian:</p>
                  <p>Beri tanda pada jawaban yang sesuai dengan pendapat Anda.</p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 font-medium">
                    <span>1 = Sangat Tidak Setuju</span>
                    <span>2 = Tidak Setuju</span>
                    <span>3 = Netral</span>
                    <span>4 = Setuju</span>
                    <span>5 = Sangat Setuju</span>
                  </div>
                </div>

                {/* Pertanyaan */}
                <div className="space-y-6">
                  {QUESTIONS.map((q, index) => (
                    <div key={index} className={`p-4 rounded-lg transition-colors ${ratings[index] ? 'bg-slate-50 border border-slate-200' : 'bg-white border border-slate-200 hover:border-blue-300'}`}>
                      <p className="font-medium text-slate-800 mb-4">
                        <span className="inline-block w-6 h-6 bg-slate-200 text-slate-700 rounded-full text-center leading-6 text-sm mr-2">{index + 1}</span>
                        {q}
                      </p>
                      <div className="flex justify-between sm:justify-start sm:gap-8 px-2 sm:px-8">
                        {[1, 2, 3, 4, 5].map(val => (
                          <label key={val} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative ${ratings[index] === val ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110' : 'bg-white border-slate-300 text-slate-500 group-hover:border-blue-400'}`}>
                              {ratings[index] === val ? <CheckCircle2 className="w-5 h-5 absolute" /> : val}
                            </div>
                            <input 
                              type="radio" 
                              name={`q${index}`} 
                              value={val}
                              checked={ratings[index] === val}
                              onChange={() => handleRatingChange(index, val)}
                              className="sr-only"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kritik dan Saran */}
                <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <label htmlFor="feedback" className="block text-sm font-semibold text-slate-800 mb-2">Kritik dan Saran (Opsional)</label>
                  <textarea
                    id="feedback"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                    placeholder="Tuliskan kritik dan saran Anda untuk aplikasi SIAP SPANJU..."
                  ></textarea>
                </div>

                {error && (
                  <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="mt-10 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mengirim...
                      </>
                    ) : 'Kirim Survei'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Kepuasan</h2>
                <p className="text-slate-500">Ringkasan hasil survei aplikasi SIAP SPANJU</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownloadExcel}
                  disabled={surveys.length === 0 || isLoadingData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download Excel</span>
                </button>
                <div className="bg-blue-50 px-6 py-4 rounded-xl border border-blue-100 text-center min-w-[150px] flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Responden</p>
                  <p className="text-4xl font-bold text-blue-700 mb-3">
                    {isLoadingData ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" /> : surveys.length}
                  </p>
                  <button 
                    onClick={() => setShowRespondentsModal(true)}
                    disabled={surveys.length === 0}
                    className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Grafik Rata-rata Kepuasan per Pertanyaan</h3>
              {isLoadingData ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                </div>
              ) : surveys.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                  <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                  <p>Belum ada data survei yang masuk.</p>
                </div>
              ) : (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartData()}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-100 max-w-xs">
                                <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                                <p className="text-sm text-slate-600 mb-3">{data.fullQuestion}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500 uppercase">Rata-rata:</span>
                                  <span className="font-bold text-blue-600 text-lg">{data.RataRata}</span>
                                  <span className="text-slate-400 text-sm">/ 5</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="RataRata" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Daftar Pertanyaan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {QUESTIONS.map((q, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-bold text-slate-400 min-w-[24px]">P{i+1}.</span>
                    <span className="text-slate-700">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Daftar Responden */}
      {showRespondentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Daftar Responden
              </h3>
              <button 
                onClick={() => setShowRespondentsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {surveys.length > 0 ? (
                <div className="space-y-3">
                  {surveys.map((survey, idx) => (
                    <div key={survey.id || idx} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{survey.name || 'Anonim'}</p>
                        <p className="text-sm text-slate-500">{survey.status || 'Tidak ada status'}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-medium text-slate-400">Tanggal Pengisian</p>
                        <p className="text-sm text-slate-600">
                          {survey.createdAt?.toDate ? survey.createdAt.toDate().toLocaleString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Belum ada responden.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
