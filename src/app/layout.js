import "./globals.css";
export const metadata = {
  title: "Coursework API",
  description: "Online course service",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
