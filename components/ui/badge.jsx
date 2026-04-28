import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    [
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5',
        'text-xs font-semibold w-fit whitespace-nowrap shrink-0',
        '[&>svg]:size-3 gap-1 [&>svg]:pointer-events-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'transition-[color,box-shadow] overflow-hidden',
        'select-none',
    ].join(' '),
    {
        variants: {
            variant: {
                // Solid primary
                default: [
                    'border-transparent bg-primary text-primary-foreground',
                    'shadow-sm shadow-primary/20',
                    '[a&]:hover:bg-primary/90',
                ].join(' '),

                // Gradient — premium pill
                gradient: [
                    'border-transparent text-white',
                    'bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500',
                    'shadow-sm shadow-violet-500/20',
                ].join(' '),

                // Soft success / emerald
                success: [
                    'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                ].join(' '),

                // Soft warning
                warning: [
                    'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
                ].join(' '),

                // Secondary muted
                secondary: [
                    'border-transparent bg-secondary text-secondary-foreground',
                    '[a&]:hover:bg-secondary/90',
                ].join(' '),

                // Destructive
                destructive: [
                    'border-transparent bg-destructive text-white',
                    '[a&]:hover:bg-destructive/90',
                    'focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
                    'dark:bg-destructive/60',
                ].join(' '),

                // Outline only
                outline: [
                    'text-foreground border-border',
                    '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
                ].join(' '),

                // Info / blue
                info: [
                    'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400',
                ].join(' '),
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

function Badge({ className, variant, asChild = false, ...props }) {
    const Comp = asChild ? Slot : 'span';
    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
