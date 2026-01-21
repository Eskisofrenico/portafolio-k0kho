'use client';

import rules from '@/data/rules.json';

interface Rule {
    text: string;
    icon: string;
}

interface RulesSectionProps {
    hasAcceptedRules: boolean;
    onAcceptRules: (accepted: boolean) => void;
}

export default function RulesSection({ hasAcceptedRules, onAcceptRules }: RulesSectionProps) {
    return (
        <section className="py-12 px-4 animate-fade-in-delay-3" id="reglas">
            <div className="max-w-4xl mx-auto">
                {/* Título */}
                <div className="text-center mb-8">
                    <h2 className="text-4xl mb-2">📋 Reglas Importantes</h2>
                    <p className="text-text/70 text-lg">
                        Lee esto antes de contactarme, ¡es súper importante!
                    </p>
                </div>

                {/* Grid de Reglas */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Columna Verde - SÍ Dibujo */}
                    <div className="rules-allowed rounded-2xl p-6 animate-slide-left" style={{ animationDelay: '0.5s' }}>
                        <h3 className="text-2xl text-center mb-4 text-green-dark">
                            ✅ Sí Dibujo
                        </h3>
                        <ul className="space-y-3">
                            {(rules.allowed as Rule[]).map((rule, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-3 bg-white/50 rounded-xl p-3 hover:scale-105 transition-transform duration-300"
                                >
                                    <span className="text-2xl animate-bounce">{rule.icon}</span>
                                    <span className="font-medium text-text">{rule.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Columna Roja - NO Dibujo */}
                    <div className="rules-forbidden rounded-2xl p-6 animate-slide-right" style={{ animationDelay: '0.7s' }}>
                        <h3 className="text-2xl text-center mb-4 text-red-dark">
                            ❌ No Dibujo
                        </h3>
                        <ul className="space-y-3">
                            {(rules.forbidden as Rule[]).map((rule, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-3 bg-white/50 rounded-xl p-3 hover:scale-105 transition-transform duration-300"
                                >
                                    <span className="text-2xl grayscale hover:grayscale-0 transition-all">{rule.icon}</span>
                                    <span className="font-medium text-text">{rule.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Checkbox Obligatorio */}
                <div className="card-sketch p-6 text-center bg-washi/30">
                    <label className="flex items-center justify-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={hasAcceptedRules}
                            onChange={(e) => onAcceptRules(e.target.checked)}
                            className="w-6 h-6 rounded accent-accent cursor-pointer"
                        />
                        <span className="text-lg group-hover:text-accent transition-colors">
                            He leído lo que <strong>NO dibujas</strong> (Sin NSFW, Sin Robots, Sin Gore, Sin Realismo)
                        </span>
                    </label>
                </div>
            </div>
        </section>
    );
}
