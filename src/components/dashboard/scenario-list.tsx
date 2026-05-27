import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ArrowRight } from 'lucide-react'
import type { ScenarioInfo } from './dashboard-data'

export function ScenarioList({ scenarios }: { scenarios: ScenarioInfo[] }) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {scenarios.map((scenario, idx) => (
        <AccordionItem
          key={idx}
          value={`scenario-${idx}`}
          className="bg-card border border-border rounded-lg shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline px-5 py-4 text-left">
            <div className="flex flex-col">
              <span className="font-semibold text-lg">{scenario.title}</span>
              <span className="text-sm text-muted-foreground font-normal mt-1">
                {scenario.description}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 p-4 bg-muted/40 rounded-lg border border-border/50">
              {scenario.steps.map((step, sIdx) => (
                <React.Fragment key={sIdx}>
                  <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-full shadow-sm text-sm font-medium">
                    <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                      {sIdx + 1}
                    </span>
                    {step}
                  </div>
                  {sIdx < scenario.steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
                  )}
                  {sIdx < scenario.steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground block sm:hidden shrink-0 rotate-90 ml-6 my-1" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
