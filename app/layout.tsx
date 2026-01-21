import type { Metadata } from "next";
import { Patrick_Hand, Nunito } from "next/font/google";
import "./globals.css";

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-handwritten",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "k0kho_ | Comisiones de Arte",
  description: "Portafolio y comisiones de arte. Icons, Chibis, Half Body, Full Body. ¡Comisiones abiertas! 🎨",
  keywords: ["arte", "comisiones", "dibujo", "ilustración", "fanart", "OC", "chibi"],
  openGraph: {
    title: "k0kho_ | Comisiones de Arte",
    description: "Portafolio y comisiones de arte. ¡Comisiones abiertas! 🎨",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${patrickHand.variable} ${nunito.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
