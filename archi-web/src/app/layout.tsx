import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "./tokens.css";

export const metadata: Metadata = {
  title: "Archi",
  description: "Sistema autônomo de pré-venda de software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="oa-root min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
