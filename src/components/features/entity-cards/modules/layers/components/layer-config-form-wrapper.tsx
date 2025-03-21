'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface LayerConfigFormWrapperProps {
  title: string;
  description?: string;
  form: UseFormReturn<any>;
  onSubmit: (values: any) => void;
  onDelete?: () => void;
  children: ReactNode;
  isSubmitting?: boolean;
}

export function LayerConfigFormWrapper({
  title,
  description,
  form,
  onSubmit,
  onDelete,
  children,
  isSubmitting = false,
}: LayerConfigFormWrapperProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="space-y-4">
              {children}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
                size="sm"
              >
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset()}
                disabled={isSubmitting}
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}