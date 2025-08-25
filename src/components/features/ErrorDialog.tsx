"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorDialogProps {
  title: string;
  message: string;
  onClose: () => void;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}

export function ErrorDialog({ title, message, onClose, actionLabel, onAction }: ErrorDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            id="error-dialog-title"
            className="text-center flex items-center justify-center gap-2"
          >
            <AlertCircle className="text-red-500" size={24} />
            <span className="text-red-600">{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p id="error-dialog-description" className="text-center text-gray-700">
            {message}
          </p>

          <div className="flex gap-2">
            {onAction && actionLabel && (
              <Button onClick={onAction} className="flex-1">
                {actionLabel}
              </Button>
            )}
            <Button onClick={onClose} variant={onAction ? "outline" : "default"} className="flex-1">
              閉じる
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
