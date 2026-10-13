import { useEffect, useRef, useState } from 'react';
import { useMutation } from 'urql';
import { DeletePropertyDocument } from '../graphql/operations.ts';
import { ErrorIcon } from './ErrorIcon.tsx';
import './ConfirmDialog.css';

type ConfirmDialogProps = {
  property: { id: string; street: string } | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function ConfirmDialog({ property, onClose, onDeleted }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [failure, setFailure] = useState(false);
  const [mutationResult, deleteProperty] = useMutation(DeletePropertyDocument);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!property || !dialog || dialog.open) return;
    setFailure(false);
    dialog.showModal();
    cancelRef.current?.focus();
  }, [property]);

  const confirmDelete = async () => {
    if (!property || mutationResult.fetching) return;
    setFailure(false);
    const result = await deleteProperty({ id: property.id });
    if (!result.data?.deleteProperty) {
      setFailure(true);
      return;
    }
    dialogRef.current?.close();
    onDeleted();
  };

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClose={() => {
        setFailure(false);
        onClose();
      }}
      onCancel={(event) => {
        if (mutationResult.fetching) event.preventDefault();
      }}
    >
      <h2 id="confirm-dialog-title">Delete {property?.street}?</h2>
      <p id="confirm-dialog-description">
        The property and its saved weather are removed. This cannot be undone.
      </p>
      {failure && (
        <div className="alert confirm-dialog__alert" role="alert">
          <ErrorIcon />
          <p className="alert__body">Could not delete. The property is still here.</p>
        </div>
      )}
      <div className="confirm-dialog__actions">
        <button
          ref={cancelRef}
          className="button button--dialog-cancel"
          type="button"
          aria-disabled={mutationResult.fetching || undefined}
          onClick={() => {
            if (!mutationResult.fetching) dialogRef.current?.close();
          }}
        >
          Cancel
        </button>
        <button
          className="button button--danger"
          type="button"
          aria-disabled={mutationResult.fetching || undefined}
          onClick={() => void confirmDelete()}
        >
          {mutationResult.fetching ? 'Deleting…' : 'Delete property'}
        </button>
      </div>
      {mutationResult.fetching && (
        <p className="text-muted" role="status">
          Deleting…
        </p>
      )}
    </dialog>
  );
}
