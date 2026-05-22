import ProtectedLayout from '@/components/protected-layout';

export default function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout
      title="Zentral"
      dashboardHref="/dashboard"
    >
      {children}
    </ProtectedLayout>
  );
}
