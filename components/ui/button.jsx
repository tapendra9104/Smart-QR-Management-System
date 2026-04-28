import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    // Base styles — professional defaults
    [
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
        "transition-all duration-200 ease-in-out",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
        "outline-none",
        "focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:border-ring",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "select-none",
    ].join(' '),
    {
        variants: {
            variant: {
                // Primary — solid brand
                default: [
                    'bg-primary text-primary-foreground shadow-sm',
                    'hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20',
                    'active:scale-[0.98]',
                ].join(' '),

                // Gradient — our hero brand button (violet → pink)
                gradient: [
                    'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500',
                    'text-white border-0',
                    'shadow-lg shadow-violet-500/30',
                    'hover:shadow-xl hover:shadow-violet-500/40 hover:opacity-90',
                    'active:scale-[0.98]',
                ].join(' '),

                // Destructive
                destructive: [
                    'bg-destructive text-white shadow-sm',
                    'hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20',
                    'focus-visible:ring-destructive/30',
                    'dark:bg-destructive/60',
                    'active:scale-[0.98]',
                ].join(' '),

                // Outline
                outline: [
                    'border border-border bg-background shadow-xs',
                    'hover:bg-accent hover:text-accent-foreground hover:border-border/80',
                    'dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
                    'active:scale-[0.98]',
                ].join(' '),

                // Secondary
                secondary: [
                    'bg-secondary text-secondary-foreground shadow-xs',
                    'hover:bg-secondary/80',
                    'active:scale-[0.98]',
                ].join(' '),

                // Ghost
                ghost: [
                    'hover:bg-accent hover:text-accent-foreground',
                    'dark:hover:bg-accent/50',
                    'active:scale-[0.98]',
                ].join(' '),

                // Link
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2 has-[>svg]:px-3',
                sm:      'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
                lg:      'h-11 rounded-md px-6 has-[>svg]:px-4 text-base',
                xl:      'h-13 rounded-xl px-8 has-[>svg]:px-6 text-base font-semibold',
                icon:    'size-9',
                'icon-sm': 'size-8',
                'icon-lg': 'size-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? Slot : 'button';
    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
