export const metadata = {
    title: "Component Editor V3",
    description: "Actionable Component Editor (V3)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
        <body style={{ margin: 0 }}>{children}</body>
        </html>
    );
}