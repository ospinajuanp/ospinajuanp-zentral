import { Spinner } from '@/components/icons';

export default function ModulesLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Spinner />
    </div>
  );
}
