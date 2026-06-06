"use client";

import React, { useState } from 'react';

// Define the expected properties for the modal
interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotel: {
        id: number;
        name: string;
        price: string;
        image: string;
    } | null;
}

export default function BookingModal({ isOpen, onClose, hotel }: BookingModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

    if (!isOpen || !hotel) return null;

    // Extract numeric value from price string (e.g., "₦150,000" -> 150000)
    const numericPrice = parseInt(hotel.price.replace(/[^0-9]/g, ''));
    const refundAmount = numericPrice * 0.7; // 70% Refund Logic

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call to Payment Gateway & Backend Invoice Generation
        setTimeout(() => {
            setIsProcessing(false);
            setStep(3); // Move to success step
        }, 2500);
    };

    const handleClose = () => {
        setStep(1);
        setGuestInfo({ name: '', email: '', phone: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* 🟢 STEP 1: CONFIRMATION & POLICY */}
                {step === 1 && (
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">Confirm Your Stay</h2>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                            <img src={hotel.image} alt={hotel.name} className="w-24 h-24 rounded-xl object-cover" />
                            <div>
                                <h3 className="text-lg font-bold text-[#004A99]">{hotel.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">1 Room • 1 Night</p>
                                <p className="text-xl font-black text-gray-900 mt-2">{hotel.price}</p>
                            </div>
                        </div>

                        {/* AIRGO ESCROW & REFUND POLICY */}
                        <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🛡️</span>
                                <h4 className="text-sm font-black text-yellow-800 uppercase tracking-wide">Airgo Escrow Protection</h4>
                            </div>
                            <p className="text-sm text-yellow-700 leading-relaxed mb-3">
                                You are paying <strong>Airgo.ng</strong> directly. Your funds are held securely and will only be disbursed to the hotel after your check-in is confirmed.
                            </p>
                            <div className="bg-white bg-opacity-50 p-3 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-800 font-medium">
                                    <span className="font-bold text-red-600">Cancellation Policy:</span> Cancellations made within the valid timeframe are eligible for a <strong className="text-green-700">70% refund (₦{refundAmount.toLocaleString()})</strong> provided there is no fault from the hotel or Airgo platform.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full bg-[#004A99] text-white py-4 rounded-xl font-black text-lg hover:bg-blue-800 transition shadow-lg"
                        >
                            Accept & Continue to Payment
                        </button>
                    </div>
                )}

                {/* 🟢 STEP 2: PAYMENT & INVOICE DETAILS */}
                {step === 2 && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStep(1)} className="text-[#004A99] font-bold text-sm flex items-center gap-1 hover:underline">
                                <span>←</span> Back
                            </button>
                            <h2 className="text-xl font-black text-gray-900">Payment Details</h2>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Guest Full Name</label>
                                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#004A99] bg-gray-50" placeholder="John Doe" value={guestInfo.name} onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email for Invoice</label>
                                <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#004A99] bg-gray-50" placeholder="john@example.com" value={guestInfo.email} onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })} />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Card Information</label>
                                <div className="relative">
                                    <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#004A99] bg-gray-50 mb-2" placeholder="0000 0000 0000 0000" maxLength={19} />
                                    <div className="flex gap-2">
                                        <input required type="text" className="w-1/2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#004A99] bg-gray-50" placeholder="MM/YY" maxLength={5} />
                                        <input required type="text" className="w-1/2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#004A99] bg-gray-50" placeholder="CVC" maxLength={3} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-xl font-black text-lg transition shadow-lg mt-4 flex justify-center items-center ${isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FFB81C] text-[#004A99] hover:bg-yellow-400'}`}
                            >
                                {isProcessing ? 'Processing Secure Payment...' : `Pay ${hotel.price}`}
                            </button>
                        </form>
                    </div>
                )}

                {/* 🟢 STEP 3: SUCCESS & AUTOMATED INVOICE */}
                {step === 3 && (
                    <div className="p-10 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>

                        <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-8">
                            Your stay at <span className="font-bold text-[#004A99]">{hotel.name}</span> is confirmed.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl w-full text-left mb-8">
                            <h4 className="font-bold text-gray-900 text-sm mb-1">Invoice Generated</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                An official VAT invoice and booking itinerary have been sent to <span className="font-bold text-gray-700">{guestInfo.email}</span>. Please present this upon check-in.
                            </p>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full bg-[#004A99] text-white py-4 rounded-xl font-black text-lg hover:bg-blue-800 transition shadow-lg"
                        >
                            Done
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}