import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
