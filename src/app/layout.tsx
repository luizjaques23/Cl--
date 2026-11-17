import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#790D16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "ALCATRAZZ — Portal Oficial do Clã",
  description:
    "ALCATRAZZ — Honra, Lealdade e Poder. Portal Oficial de Gerenciamento de Membros, Hierarquia, SoD (Siege of the Darkness), Bless Castle e Ranking inspirado em Priston Tale. Desenvolvido por Luiz Jaques.",
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/alcatrazz-crest.jpg",
    apple: "/assets/alcatrazz-crest.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable} dark`}>
      <body className="font-sans bg-[#090909] text-stone-100 antialiased selection:bg-[#790D16] selection:text-[#D6A33A]">
        {children}
      </body>
    </html>
  );
}
