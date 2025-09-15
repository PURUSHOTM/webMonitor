import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: 'default' | 'destructive';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title = 'Confirm', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', intent = 'destructive', onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          {description}
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={intent === 'destructive' ? 'destructive' : 'default'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
