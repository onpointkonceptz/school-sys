import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Plus, Search, X, Printer, CheckCircle } from 'lucide-react';

// Configure Axios
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
    }
});

const PaymentModal = ({ student, onClose, onSuccess }) => {
    const [step, setStep] = useState(student ? 2 : 1); // 1: Search, 2: Payment, 3: Success/Receipt
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(student || null);

    // Form Fields
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentType, setPaymentType] = useState('TUITION');
    const [term, setTerm] = useState('1st Term');
    const [session, setSession] = useState('2025/2026');
    const [description, setDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // Pre-fill fields when student selected
    useEffect(() => {
        if (selectedStudent) {
            setTerm(selectedStudent.current_term || '1st Term');
            setSession(selectedStudent.current_session || '2025/2026');
        }
    }, [selectedStudent]);

    // Update description automatically based on type/term
    useEffect(() => {
        if (selectedStudent) {
            setDescription(`${paymentType} Payment - ${term} ${session}`);
        }
    }, [paymentType, term, session, selectedStudent]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.get(`/students/?search=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (s) => {
        setSelectedStudent(s);
        setStep(2);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                admission_number: selectedStudent.admission_number,
                amount: amount,
                payment_method: paymentMethod,
                payment_type: paymentType,
                description: description,
                term: term,
                session: session
            };

            const res = await api.post('/accounts/payments/', payload);

            setReceiptData({
                ...payload,
                transaction_id: res.data.transaction_id || 'TXN-' + Date.now(),
                date: new Date().toLocaleString(),
                student_name: selectedStudent.full_name,
                class: selectedStudent.class_grade
            });

            setStep(3); // Move to Receipt
            if (onSuccess) onSuccess();
        } catch (err) {
            alert('Payment failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border-4 border-[#001f3f] print:border-0 print:shadow-none print:w-full print:max-w-none">

                {/* Header (Hidden in Print) */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#001f3f] text-white print:hidden">
                    <h3 className="font-bold text-lg">
                        {step === 1 ? 'Find Student' : step === 2 ? 'Record Payment' : 'Payment Successful'}
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* STEP 1: SEARCH */}
                {step === 1 && (
                    <div className="p-6 space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                autoFocus
                                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-[#ff851b] focus:ring-0 outline-none text-[#001f3f] font-medium placeholder:text-gray-400"
                                placeholder="Search Name or Admission No..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="bg-[#ff851b] text-white px-4 rounded-xl hover:bg-[#ff851b]-600 transition-colors shadow-lg shadow-[#ff851b]/20">
                                <Search size={20} />
                            </button>
                        </form>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {loading ? (
                                <div className="text-center py-4 text-[#001f3f]/50 font-medium">Searching...</div>
                            ) : searchResults.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectStudent(s)}
                                    className="w-full text-left p-3 hover:bg-[#001f3f]/5 rounded-xl border border-gray-100 flex justify-between items-center group transition-all"
                                >
                                    <div>
                                        <div className="font-bold text-[#001f3f]">{s.full_name}</div>
                                        <div className="text-xs text-gray-500">{s.admission_number} • {s.class_grade}</div>
                                    </div>
                                    <div className="text-[#ff851b] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">Select</div>
                                </button>
                            ))}
                            {searchResults.length === 0 && searchQuery && !loading && (
                                <div className="text-center py-4 text-gray-400 text-sm">No students found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: PAYMENT FORM */}
                {step === 2 && selectedStudent && (
                    <form onSubmit={handleSubmitPayment} className="p-6 space-y-6">
                        <div className="bg-[#001f3f]/5 p-4 rounded-xl border border-[#001f3f]/10">
                            <div className="text-xs text-[#001f3f]/60 uppercase tracking-wide font-bold">Student</div>
                            <div className="font-bold text-[#001f3f] text-lg">{selectedStudent.full_name}</div>
                            <div className="text-sm text-gray-600">{selectedStudent.admission_number} • {selectedStudent.class_grade}</div>
                            {selectedStudent.balance && (
                                <div className="mt-2 flex justify-between text-sm border-t border-[#001f3f]/10 pt-2">
                                    <span className="text-[#001f3f]/70">Outstanding Balance:</span>
                                    <span className="font-mono font-bold text-[#ff851b]">₦{Number(selectedStudent.balance).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#001f3f] mb-1">Type</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-[#001f3f] outline-none font-bold text-[#001f3f] bg-white"
                                        value={paymentType}
                                        onChange={e => setPaymentType(e.target.value)}
                                    >
                                        <option value="TUITION">Tuition</option>
                                        <option value="BOARDING">Boarding</option>
                                        <option value="ADMISSION">Admission</option>
                                        <option value="PTA">PTA</option>
                                        <option value="EXAM">Exam</option>
                                        <option value="UNIFORM">Uniform</option>
                                        <option value="BOOKS">Books</option>
                                        <option value="OTHERS">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#001f3f] mb-1">Term</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-[#001f3f] outline-none font-bold text-[#001f3f] bg-white"
                                        value={term}
                                        onChange={e => setTerm(e.target.value)}
                                    >
                                        <option value="1st Term">1st Term</option>
                                        <option value="2nd Term">2nd Term</option>
                                        <option value="3rd Term">3rd Term</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#001f3f] mb-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['CASH', 'BANK_TRANSFER', 'POS', 'CHEQUE'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${paymentMethod === method
                                                ? 'border-[#ff851b] bg-[#ff851b]/10 text-[#ff851b]'
                                                : 'border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {method.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#001f3f] mb-1">Amount (₦)</label>
                                <input
                                    required
                                    autoFocus
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#001f3f] focus:ring-0 text-2xl font-black text-[#001f3f] outline-none"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#001f3f] mb-1">Description</label>
                                <input
                                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-[#001f3f] outline-none text-sm"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            {!student && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-3 rounded-xl text-[#001f3f] font-bold hover:bg-[#001f3f]/5 transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#001f3f] text-white py-3 rounded-xl font-bold hover:bg-[#001f3f]-light transition-all shadow-lg shadow-[#001f3f]/20 flex justify-center items-center gap-2"
                            >
                                {loading ? 'Processing...' : (
                                    <>
                                        <CreditCard size={18} /> CONFIRM PAYMENT
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: SUCCESS / RECEIPT */}
                {step === 3 && receiptData && (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                            <CheckCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[#001f3f]">Payment Successful!</h3>
                            <p className="text-gray-500">Transaction has been recorded.</p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-left space-y-3 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Ref:</span>
                                <span className="font-bold text-[#001f3f]">{receiptData.transaction_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Student:</span>
                                <span className="font-bold text-[#001f3f]">{receiptData.student_name}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2">
                                <span className="text-gray-500">Amount:</span>
                                <span className="font-bold text-[#001f3f] text-lg">₦{Number(receiptData.amount).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-[#001f3f] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#001f3f]-light transition-all flex items-center justify-center gap-2"
                            >
                                <Printer size={18} /> Print Receipt
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* HIDDEN PRINT LAYOUT */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
                {receiptData && (
                    <div className="max-w-xl mx-auto border-2 border-[#001f3f] p-8">
                        <div className="text-center border-b-2 border-[#001f3f] pb-4 mb-4">
                            <h1 className="text-2xl font-bold text-[#001f3f]">KADWEL INTERNATIONAL SCHOOLS</h1>
                            <p className="text-sm text-gray-600"> OFFICIAL PAYMENT RECEIPT </p>
                        </div>
                        <div className="space-y-4 font-mono">
                            <div className="flex justify-between"><span>Date:</span> <span>{receiptData.date}</span></div>
                            <div className="flex justify-between"><span>Reference:</span> <span>{receiptData.transaction_id}</span></div>
                            <div className="border-b border-dashed border-gray-300 my-2"></div>
                            <div className="flex justify-between"><span>Received From:</span> <span className="font-bold">{receiptData.student_name}</span></div>
                            <div className="flex justify-between"><span>Class:</span> <span>{receiptData.class}</span></div>
                            <div className="border-b border-dashed border-gray-300 my-2"></div>
                            <div className="flex justify-between"><span>Payment For:</span> <span>{receiptData.description}</span></div>
                            <div className="flex justify-between"><span>Method:</span> <span>{receiptData.payment_method}</span></div>
                            <div className="border-t-2 border-[#001f3f] mt-4 pt-2 flex justify-between text-xl font-bold">
                                <span>TOTAL PAID:</span>
                                <span>₦{Number(receiptData.amount).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-12 text-center text-xs text-gray-400">
                            Generated by School Management System
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
