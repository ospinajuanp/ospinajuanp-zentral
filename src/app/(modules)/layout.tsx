import ProtectedLayout from '@/components/protected-layout';

export default function ModulesLayout({
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
