export default function Footer() {
    return (
        <footer className="py-8 px-4 border-t-2 border-dashed border-accent/30 mt-12">
            <div className="max-w-4xl mx-auto text-center">
                {/* Redes Sociales */}
                <div className="flex justify-center gap-6 mb-6">
                    <a
                        href="https://instagram.com/k0kho_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xl hover:scale-105 transition-transform hover:text-accent font-bold group"
                        aria-label="Instagram"
                    >
                        <svg className="w-8 h-8 fill-current group-hover:text-[#E1306C] transition-colors" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        <span>Sígueme en Instagram</span>
                    </a>
                </div>

                {/* Métodos de Pago */}
                <div className="mb-6">
                    <p className="text-text/60 text-sm mb-2">Métodos de pago aceptados:</p>
                    <div className="flex justify-center gap-4 text-lg">
                        <span className="card-sketch px-4 py-2 text-sm">💳 BancoEstado</span>
                        <span className="card-sketch px-4 py-2 text-sm">💰 PayPal</span>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-6 border-t border-accent/20">
                    <p className="text-text/80 font-medium mb-2">
                        Esta web actúa como filtro de ventas. <span className="text-accent font-bold">¡Lee las reglas antes de contactarme!</span>
                    </p>
                    <p className="text-text/60 text-sm">
                        © 2026 Desarrollado por{' '}
                        <a
                            href="https://franciscodev.cl/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold hover:text-accent underline decoration-accent/50 underline-offset-2 transition-colors"
                        >
                            FranciscoDev
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
