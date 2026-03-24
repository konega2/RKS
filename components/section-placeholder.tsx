import { Card } from "@/components/card";

type SectionPlaceholderProps = {
  title: string;
};

export function SectionPlaceholder({ title }: SectionPlaceholderProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Módulo en preparación. Aquí podrás gestionar esta sección pronto.
      </p>
    </Card>
  );
}
