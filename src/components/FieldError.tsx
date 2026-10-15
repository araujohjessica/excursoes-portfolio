/**
 * Aviso de erro de um campo, no mesmo estilo do tooltip do site.
 * Use logo abaixo do input: <FieldError message={errors.email} />
 */
export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="field-tooltip field-tooltip--inline field-tooltip--visible">
      <span className="field-tooltip__icon" aria-hidden="true">!</span>
      <span>{message}</span>
    </div>
  );
}
