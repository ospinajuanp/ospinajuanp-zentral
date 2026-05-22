interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mb-6 rounded-md bg-rose-500/10 px-4 py-3 text-sm text-rose-500" role="alert">
      {message}
    </div>
  );
}
