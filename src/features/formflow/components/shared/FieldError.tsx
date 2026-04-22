interface FieldErrorProps {
  id: string;
  message: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-center gap-1.5 text-sm text-red-400"
    >
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  );
}
