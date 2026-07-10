import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface OnboardingStep {
    label: string;
    description: string;
    href: string;
    cta: string;
    done: boolean;
}

export default function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
    const completedCount = steps.filter(s => s.done).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    if (completedCount === steps.length) return null;

    return (
        <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-800">Get your account up and running</h2>
                    <span className="text-sm font-bold text-brand-600">{completedCount}/{steps.length} complete</span>
                </div>
                <p className="text-gray-500 text-sm mb-5">A few quick steps to get the most out of the platform.</p>

                <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="space-y-3">
                    {steps.map((step) => (
                        <div
                            key={step.label}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${step.done ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {step.done ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                )}
                                <div>
                                    <div className={`font-bold ${step.done ? 'text-emerald-800' : 'text-gray-800'}`}>{step.label}</div>
                                    <div className="text-sm text-gray-500">{step.description}</div>
                                </div>
                            </div>
                            {!step.done && (
                                <Link
                                    href={step.href}
                                    className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors whitespace-nowrap ml-4"
                                >
                                    {step.cta} <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
