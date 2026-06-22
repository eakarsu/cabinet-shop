import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/site";
import { AuthProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: `${COMPANY.name} — ${COMPANY.tagline}`,
  description:
    "Custom cabinetry and natural stone countertops — granite, quartz, and marble — fabricated and installed in our own shop. Free in-home estimates.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
