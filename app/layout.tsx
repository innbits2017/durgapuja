import { Open_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">      
      <head>
        <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9MFCEK6DWD"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9MFCEK6DWD');
          `}
        </Script>
      </head>
      <body className={openSans.className}>
        {children}
      </body>
    </html>
  );
}