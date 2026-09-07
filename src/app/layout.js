import "./globals.css";

export const metadata = {
  title: "Hello API",
  description: "Authentication and item API backend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
