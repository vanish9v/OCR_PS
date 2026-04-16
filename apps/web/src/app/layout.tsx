import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata = { title: "ProService OCR" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-neutral-900 antialiased">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-neutral-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
